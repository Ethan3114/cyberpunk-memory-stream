import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createCore } from './Core';
import { createPanels, orbitPosition, orbitQuaternion, CAMERA_RADIUS, ORBIT_RADIUS, DESCENT, type Panel } from './Panels';
import { Journey } from './Journey';
import { ReferencePostFX } from './ReferencePostFX';
import { Particles } from './Particles';
import { ParticleBanks } from './ParticleBanks';
import { asset, characters, clamp, coreProgress, mix, smooth } from './story';

/** One renderer and camera, from the user's logo through official environments to the approved orbit. */
export class World {
  renderer: THREE.WebGLRenderer;
  ready: Promise<void>;
  private panels: Panel[] = [];
  private textures: THREE.Texture[] = [];
  private environment: THREE.WebGLRenderTarget;
  private reflection = new THREE.WebGLRenderTarget(1, 1);
  private banks = new ParticleBanks();
  private refraction = new THREE.WebGLRenderTarget(1, 1);
  private resolution = new THREE.Vector2();
  private targetPosition = new THREE.Vector3();
  private nextPosition = new THREE.Vector3();
  private localOffset = new THREE.Vector3();
  private targetQuaternion = new THREE.Quaternion();
  private journeyPosition = new THREE.Vector3();
  private journeyQuaternion = new THREE.Quaternion();
  private footerCamera=new THREE.PerspectiveCamera();
  private environmentCamera=new THREE.PerspectiveCamera();
  private raycaster = new THREE.Raycaster();
  private initialized = false;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(35, 1, .1, 100);
  private core = new THREE.Group();
  private coreRadius=1;
  private observedGap=Infinity;
  private journey: Journey;
  private particles?: Particles;
  private materials: THREE.Material[] = [];
  private coreMaterials: THREE.Material[] = [];
  private geometries: THREE.BufferGeometry[] = [];
  private key: THREE.PointLight;
  private rim: THREE.PointLight;
  private disposed = false;
  private post:ReferencePostFX;

  constructor(canvas: HTMLCanvasElement, host: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: true, powerPreference: 'high-performance' });
    this.post=new ReferencePostFX(this.renderer);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.autoClear = false;
    this.renderer.info.autoReset = false;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x05080b, 1);
    this.scene.fog = new THREE.FogExp2(0x05080b, .025);
    this.scene.add(new THREE.AmbientLight(0x8bb5c4, 1.35));
    const fill = new THREE.DirectionalLight(0xe7f3ff, 2.4); fill.position.set(-5, 8, 8); this.scene.add(fill);
    this.key = new THREE.PointLight(0x6de5ff, 45, 25); this.scene.add(this.key);
    this.rim = new THREE.PointLight(0xffd67a, 22, 24); this.scene.add(this.rim);
    const environment = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.environment = pmrem.fromScene(environment, .04);
    this.scene.environment = this.environment.texture;
    environment.dispose(); pmrem.dispose();
    this.journey = new Journey(host); this.scene.add(this.journey.group);
    this.camera.position.set(0, 0, 10);
    this.scene.add(this.banks.group);
    const openingCloud=fetch(asset('models/forest-reference.bin')).then(r=>{if(!r.ok)throw Error('Opening cloud unavailable');return r.arrayBuffer();});
    this.ready = Promise.all([createCore(), createPanels(host), this.journey.ready, this.banks.ready,openingCloud]).then(([core, panels,,,forest]) => {
      this.geometries.push(...core.geometries);
      this.coreMaterials = core.materials;this.coreRadius=core.radius;this.banks.setCoreRadius(core.radius+.15);this.banks.setCoreHeight(core.height);
      for(const material of core.materials){
        if(material instanceof THREE.ShaderMaterial){material.uniforms.tRefraction.value=this.reflection.texture;material.uniforms.resolution.value=this.resolution;if(import.meta.env.DEV&&new URLSearchParams(location.search).get('reflection')==='off')material.uniforms.uReflection.value.y=0;continue;}
        if(!(material instanceof THREE.MeshStandardMaterial)||material.emissiveIntensity>1)continue;
        material.roughness=Math.min(material.roughness,.27);
        material.userData.particleReflectionStrength={value:.85};
        material.onBeforeCompile=shader=>{
          shader.uniforms.tParticleReflection={value:this.reflection.texture};
          shader.uniforms.uReflectionResolution={value:this.resolution};
          shader.uniforms.uParticleReflectionStrength=material.userData.particleReflectionStrength;
          shader.fragmentShader='uniform sampler2D tParticleReflection;uniform vec2 uReflectionResolution;uniform float uParticleReflectionStrength;\n'+shader.fragmentShader;
          shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
            vec2 reflectionUv=gl_FragCoord.xy/uReflectionResolution+normal.xy*.1*2.7;
            vec3 reflectedParticles=texture2D(tParticleReflection,clamp(reflectionUv,.001,.999)).rgb;
            outgoingLight+=reflectedParticles*uParticleReflectionStrength;
            #include <opaque_fragment>
          `);
        };
        material.customProgramCacheKey=()=> 'particle-reflection-v1';
      }
      this.materials.push(...core.materials); this.textures.push(...core.textures);
      this.core = core.group; this.panels = panels;
      for (const panel of panels) {
        this.geometries.push(...panel.geometries); this.materials.push(...panel.materials); this.textures.push(...panel.textures);
        panel.image.material.uniforms.tRefraction.value = this.refraction.texture;
        this.scene.add(panel.group);
      }
      this.scene.add(this.core);
      if (this.disposed) { this.releaseAssets(); return; }
      this.particles = new Particles(this.renderer,new Float32Array(forest),this.journey.openingPoster,this.journey.openingVideo); this.scene.add(this.particles.points);
      this.journey.bindOpeningReflection(this.reflection.texture,this.resolution);
      this.post.bind(this.journey.openingBackground!,this.journey.logo);
      this.post.setOpening([...this.journey.openingObjects,this.particles.points],this.journey.environmentObjects);
      this.post.setCore([this.core,this.banks.group,...this.panels.map(panel=>panel.group)]);
      this.resize(window.innerWidth,window.innerHeight);
    });
    this.resize(window.innerWidth, window.innerHeight);
  }

  resize(width: number, height: number) {
    this.renderer.setSize(width, height, false); this.camera.aspect = width / height; this.camera.updateProjectionMatrix();
    this.journey.resize(width / height);
    this.particles?.resize(height,this.renderer.getPixelRatio());
    this.banks.resize(height,this.renderer.getPixelRatio());
    this.renderer.getDrawingBufferSize(this.resolution);
    this.refraction.setSize(Math.round(width), Math.round(height));
    this.reflection.setSize(this.resolution.x,this.resolution.y);
    this.post.resize(this.resolution.x,this.resolution.y);
    for (const panel of this.panels) panel.image.material.uniforms.uResolution.value.copy(this.resolution);
  }

  render(p: number, x: number, y: number, time: number, reduced: boolean, dt: number, pointerX: number, pointerY: number) {
    if (this.disposed) return;
    this.renderer.info.reset();
    const q = coreProgress(p), reveal = smooth(.205, .315, q), footer=p>=.87, coreVisible=reveal>.001&&p<.92;
    const segment = clamp((q - .39) / .14, 0, 3);
    const i0 = Math.floor(segment), i1 = Math.min(3, i0 + 1), fraction = segment - i0;
    this.targetPosition.copy(orbitPosition(i0)).multiplyScalar(CAMERA_RADIUS / ORBIT_RADIUS);
    this.nextPosition.copy(orbitPosition(i1)).multiplyScalar(CAMERA_RADIUS / ORBIT_RADIUS);
    this.targetPosition.y = -i0 * DESCENT; this.nextPosition.y = -i1 * DESCENT;
    this.targetPosition.lerp(this.nextPosition, fraction);
    this.targetQuaternion.copy(orbitQuaternion(i0)).slerp(orbitQuaternion(i1), fraction);
    this.targetPosition.multiplyScalar(mix(1.55, 1, smooth(.25, .39, q)));
    const travel = clamp((p - .20) / .09,0,3);
    if(p<.20){
      // Scaled reference camera height / look direction. Logo and lens descend together
      // through the stationary forest; the floor approaches with real perspective.
      this.journeyPosition.set(0,.64-1.8*smooth(.02,.18,p),12.05);
      this.journeyQuaternion.setFromEuler(new THREE.Euler(-Math.atan2(.774,14.19),0,0));
    }else{
      this.journeyPosition.set(reduced ? 0 : Math.sin(travel*Math.PI)*.24,0,10-travel*8);
      this.journeyQuaternion.setFromEuler(new THREE.Euler(0,reduced ? 0 : Math.sin(travel*Math.PI)*.013,0));
    }
    const approach = p>=.49?1:0;
    this.nextPosition.copy(this.targetPosition);
    this.targetPosition.copy(this.journeyPosition).lerp(this.nextPosition,approach);
    this.targetQuaternion.copy(this.journeyQuaternion).slerp(orbitQuaternion(i0).slerp(orbitQuaternion(i1),fraction),approach);
    this.footerCamera.copy(this.camera);this.footerCamera.position.set(0,.64,12.05);
    this.footerCamera.quaternion.setFromEuler(new THREE.Euler(-Math.atan2(.774,14.19),0,0));this.footerCamera.updateMatrixWorld(true);
    this.environmentCamera.copy(this.camera);this.environmentCamera.position.set(0,0,-14);this.environmentCamera.quaternion.identity();this.environmentCamera.updateMatrixWorld(true);
    if(p>=.92){this.targetPosition.copy(this.footerCamera.position);this.targetQuaternion.copy(this.footerCamera.quaternion);}
    this.localOffset.set(reduced ? 0 : x * .14*smooth(.20,.23,p), reduced ? 0 : -y * .10*smooth(.20,.23,p), 0).applyQuaternion(this.targetQuaternion);
    this.targetPosition.add(this.localOffset);
    const follow = reduced || p<.23 || !this.initialized ? 1 : 1 - Math.pow(.8, dt * 60);
    this.camera.position.lerp(this.targetPosition, follow); this.camera.quaternion.slerp(this.targetQuaternion, follow);
    this.initialized = true; this.camera.updateMatrixWorld();
    this.key.position.copy(this.camera.position).add(new THREE.Vector3(2, 3, 0));
    this.rim.position.set(-this.camera.position.x * .4, this.camera.position.y - 2, -this.camera.position.z * .4);
    this.journey.update(p,time,dt,reduced);
    this.core.visible = coreVisible; this.core.scale.setScalar(mix(.85, 1, reveal));
    for (const material of this.coreMaterials) {
      const transparent = reveal < .999;
      if (material.transparent !== transparent) { material.transparent = transparent; material.needsUpdate = true; }
      material.opacity = reveal;
      if(material instanceof THREE.ShaderMaterial&&material.uniforms.uOpacity)material.uniforms.uOpacity.value=reveal;
      const reflectionOff=import.meta.env.DEV&&new URLSearchParams(location.search).get('reflection')==='off';
      const reflectionStrength=reflectionOff?0:.85;
      if(material instanceof THREE.ShaderMaterial&&material.uniforms.uReflection)material.uniforms.uReflection.value.y=reflectionStrength;
      if(material.userData.particleReflectionStrength)material.userData.particleReflectionStrength.value=reflectionStrength;
    }
    for (let i = 0; i < this.panels.length; i++) {
      const panel = this.panels[i]; panel.group.visible = q > .265&&p<.92;
      panel.group.position.copy(panel.position);panel.group.quaternion.copy(panel.quaternion);
      panel.group.scale.setScalar(smooth(.265 + i * .009, .335 + i * .009, q));
      panel.image.material.uniforms.uResolution.value.copy(this.resolution);
      panel.image.material.uniforms.uTime.value = reduced?0:time;
      panel.image.material.uniforms.uReduced.value = reduced ? 1 : 0;
      panel.image.material.uniforms.uMouse.value.set(reduced ? .5 : .5+x*.5, reduced ? .5 : .5-y*.5);
    }
    this.scene.updateMatrixWorld(true);
    this.raycaster.setFromCamera(new THREE.Vector2(pointerX, -pointerY), this.camera);
    const hits = q > .32 && p < .87 ? this.raycaster.intersectObjects(this.panels.map(panel => panel.image)) : [];
    const hit = hits[0]?.object;
    for (let i=0;i<this.panels.length;i++) {
      const panel=this.panels[i], uniforms = panel.image.material.uniforms;
      const hover = !reduced && panel.image === hit ? 1 : 0;
      uniforms.uHover.value = mix(uniforms.uHover.value, hover, 1 - Math.pow(.92, dt * 60));
      panel.caption.material.uniforms.uHover.value=uniforms.uHover.value;
      panel.caption.material.uniforms.uCamDistance.value=this.camera.position.distanceTo(panel.group.position);
      const active = q>.32 && p<.87 && (Math.abs(q-characters[i].focus)<.058 || panel.image===hit);
      uniforms.uVideoBlend.value=panel.media.update(active,time,dt,reduced) ?? 0;
    }
    if(this.panels.length===4){this.banks.protect(this.panels.map(panel=>panel.group),this.camera,q>.265&&p<.92,0);
      const clearance=this.banks.measure(time);if(clearance)this.renderer.domElement.dataset.bankClearance=JSON.stringify(clearance);}
    this.banks.update(p,time,reduced);
    if(this.particles)this.particles.points.material.uniforms.uLogoPos.value.set(0,0,0);
    const particleState = this.particles?.update(p,pointerX,pointerY,time,dt,reduced,this.camera,this.journey.openingBlend);
    const canvas = this.renderer.domElement;
    canvas.dataset.orbit = (segment * 50).toFixed(2);
    canvas.dataset.camera = this.camera.position.toArray().map(v => v.toFixed(3)).join(',');
    canvas.dataset.quaternion = this.camera.quaternion.toArray().map(v => v.toFixed(4)).join(',');
    canvas.dataset.panels = String(this.panels.length);
    canvas.dataset.hover = String(this.panels.findIndex(panel => panel.image === hit));
    canvas.dataset.core = this.core.children.length ? 'sculpted-40-segments' : 'loading';
    canvas.dataset.openingVideoMatrix=this.journey.openingBackground?.matrixWorld.elements.map(v=>v.toFixed(4)).join(',')??'';
    canvas.dataset.openingScroll=String(this.particles?.points.material.uniforms.uScroll.value??0);
    canvas.dataset.openingField=this.particles?.points.matrixWorld.elements.map(v=>v.toFixed(4)).join(',')??'';
    canvas.dataset.logoPosition=this.journey.logo.position.toArray().map(v=>v.toFixed(4)).join(',');
    canvas.dataset.panelMaterial='WorkItemShader-refracting-rounded-volume';
    canvas.dataset.logoYaw = this.journey.logo.rotation.y.toFixed(3);
    canvas.dataset.particleMode = particleState?.mode ?? 'loading';
    canvas.dataset.particleCount = String(particleState?.count ?? 0);
    canvas.dataset.particleImpulse = (particleState?.impulse ?? 0).toFixed(4);
    canvas.dataset.particleEnergy = (particleState?.energy ?? 0).toFixed(4);
    canvas.dataset.openingVideoBlend=this.journey.openingBlend.toFixed(3);
    canvas.dataset.openingCloud='forest-reference-video-lit';
    canvas.dataset.videoBlend = this.panels.map(panel=>panel.image.material.uniforms.uVideoBlend.value.toFixed(3)).join(',');
    canvas.dataset.particleBanks=String(this.banks.group.visible?this.banks.count:0);
    canvas.dataset.coreBoundsRadius=this.coreRadius.toFixed(5);
    const gaps=this.panels.map(panel=>this.glassGap(panel.group));
    if(reveal>.1)for(const gap of gaps)if(gap.visible)this.observedGap=Math.min(this.observedGap,gap.gap);
    canvas.dataset.glassSpineGap=JSON.stringify(gaps);canvas.dataset.minimumObservedGlassGap=String(this.observedGap);
    canvas.dataset.coreMaterial='native-getFBR-original-maps';
    canvas.dataset.reflection=import.meta.env.DEV&&new URLSearchParams(location.search).get('reflection')==='off'?'disabled-for-comparison':'normal-offset-particle-pass';
    canvas.dataset.phase=p<.14?'logo':p<.52?'environments':p<.87?'memories':'ending';
    if(this.journey.logo.visible&&this.particles){
      const environmentState=this.journey.environmentObjects.map(o=>o.visible);this.journey.environmentObjects.forEach(o=>{o.visible=false;});
      this.journey.logo.visible=false;
      this.renderer.setRenderTarget(this.reflection);this.renderer.clear();this.renderer.render(this.scene,this.camera);
      this.renderer.setRenderTarget(null);this.journey.logo.visible=true;this.journey.environmentObjects.forEach((o,i)=>{o.visible=environmentState[i];});
    }
    if (coreVisible) {
      for (const panel of this.panels) panel.group.visible = false;
      // Capture particles without the spine, avoiding recursive self-reflection.
      this.core.visible=false;
      this.renderer.setRenderTarget(this.reflection);this.renderer.clear();this.renderer.render(this.scene,this.camera);
      this.core.visible=true;
      this.renderer.setRenderTarget(this.refraction); this.renderer.clear(); this.renderer.render(this.scene, this.camera);
      this.renderer.setRenderTarget(null);
      for (const panel of this.panels) panel.group.visible = q > .265&&p<.92;
    }
    this.post.render(this.scene,this.camera,this.journey.logo,p,time,this.particles?.flowTexture,this.particles?.flowMask,reduced,this.environmentCamera,this.footerCamera);
    canvas.dataset.coreVisible=String(coreVisible);canvas.dataset.visiblePanels=String(this.panels.filter(panel=>panel.group.visible).length);canvas.dataset.footer=String(footer);canvas.dataset.glassThickness="0.15";
    canvas.dataset.draws = String(this.renderer.info.render.calls);
    canvas.dataset.triangles = String(this.renderer.info.render.triangles);
  }

  private glassGap(group:THREE.Group){
    // Exact distance from the projected closed slab footprint to the spine's bounding cylinder.
    const corners=[[-1.745,-.10],[1.745,-.10],[1.745,.10],[-1.745,.10]].map(([x,z])=>new THREE.Vector3(x,0,z).applyMatrix4(group.matrixWorld));
    let distance=Infinity,positive=true,negative=true;
    for(let i=0;i<4;i++){
      const a=corners[i],b=corners[(i+1)%4],dx=b.x-a.x,dz=b.z-a.z,cross=dx*(-a.z)-dz*(-a.x);
      positive=positive&&cross>=0;negative=negative&&cross<=0;
      const t=clamp(-(a.x*dx+a.z*dz)/Math.max(1e-10,dx*dx+dz*dz));distance=Math.min(distance,Math.hypot(a.x+dx*t,a.z+dz*t));
    }
    if(positive||negative)distance=0;
    return {gap:distance-this.coreRadius,visible:group.visible&&group.scale.x>.01,center:group.position.toArray()};
  }
  pause(){this.journey.pause();for(const panel of this.panels)panel.media.pause();}
  private releaseAssets() {
    new Set(this.geometries).forEach(geo => geo.dispose());
    new Set(this.materials).forEach(material => material.dispose());
    new Set(this.textures).forEach(texture => texture.dispose());
    for(const panel of this.panels)panel.media.dispose();
  }
  dispose() {
    this.disposed = true; this.releaseAssets(); this.journey.dispose(); this.particles?.dispose();
    this.post.dispose();this.banks.dispose();this.reflection.dispose();this.environment.dispose(); this.refraction.dispose(); this.renderer.dispose();
  }
}
