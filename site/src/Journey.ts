import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Media } from './Media';
import { OpeningBackdrop } from './OpeningBackdrop';
import { spaceTimeline } from './SpaceTimeline';
import { asset, clamp, smooth } from './story';

export class Journey {
  group = new THREE.Group();
  logo = new THREE.Group();
  logoMesh!: THREE.Mesh;
  ready: Promise<void>;
  private cards: {mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>; poster: THREE.Texture; media?: Media}[] = [];
  private logoMaterials: THREE.MeshStandardMaterial[] = [];
  private logoScale = 2;
  private disposed = false;
  private backdrop?:OpeningBackdrop;
  private aspect=16/9;
  get environmentObjects(){return this.cards.map(c=>c.mesh);}
  get openingObjects(){return [this.logo,this.backdrop!.mesh];}
  get openingBackground(){return this.backdrop?.mesh;}
  get openingPoster(){return this.cards[1].poster;}
  get openingVideo(){return this.cards[1].media!.texture;}
  get openingBlend(){return this.backdrop?.mesh.material.uniforms.uBlend.value ?? 0;}
  constructor(host: HTMLElement) {
    this.group.add(this.logo);
    this.ready = Promise.all([
      new GLTFLoader().loadAsync(asset('models/cyberpunk-wordmark.glb')).then(g => {
        this.logo.add(g.scene);
        g.scene.traverse(o => {
          if (o instanceof THREE.Mesh) {
            this.logoMesh = o;
            const material = o.material as THREE.MeshStandardMaterial;
            material.color.set('#f3e65b'); material.metalness = .72; material.roughness = .29;
            material.emissive.set('#80670a'); material.emissiveIntensity = .13;
            material.userData.spacePresence={value:1};this.logoMaterials.push(material);
          }
        });
      }),
      ...[1,2,3,4].map(async i => {
        const id = String(i).padStart(2,'0');
        const poster = await new THREE.TextureLoader().loadAsync(asset(`media/scene-${id}.webp`));
        poster.colorSpace = THREE.SRGBColorSpace;
        const media = i > 1 ? new Media(`media/scene-${id}.mp4`, host) : undefined;
        const material = new THREE.ShaderMaterial({
          uniforms: {tPoster:{value:poster},tVideo:{value:media?.texture ?? poster},uBlend:{value:0},uOpacity:{value:0}},
          transparent:true,depthWrite:false,depthTest:true,
          vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
          fragmentShader:`uniform sampler2D tPoster,tVideo;uniform float uBlend,uOpacity;varying vec2 vUv;void main(){vec3 col=texture2D(tPoster,vUv).rgb;if(uBlend>.001)col=mix(col,texture2D(tVideo,vUv).rgb,uBlend);gl_FragColor=vec4(col,uOpacity);\n#include <colorspace_fragment>\n}`,
        });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(16,9), material);
        mesh.position.set(0, 0, -(i-1)*8); mesh.renderOrder = 4-i;
        this.cards[i-1] = {mesh,poster,media}; this.group.add(mesh);
      }),
    ]).then(() => {
      this.backdrop=new OpeningBackdrop(this.openingPoster,this.cards[1].media!);
      this.group.add(this.backdrop.mesh);this.backdrop.resize(this.aspect);
      if(this.disposed)this.dispose();
    });
  }
  resize(aspect: number) { this.aspect=aspect;this.logoScale = Math.min(3.1, 12.05 * Math.tan(THREE.MathUtils.degToRad(17.5)) * aspect * .62 / 2);this.backdrop?.resize(aspect); }
  bindOpeningReflection(texture:THREE.Texture,resolution:THREE.Vector2){
    for(const material of this.logoMaterials){
      material.onBeforeCompile=shader=>{
        shader.uniforms.uLogoPresence=material.userData.spacePresence;
        shader.uniforms.tOpeningReflection={value:texture};shader.uniforms.uOpeningResolution={value:resolution};
        shader.fragmentShader='uniform float uLogoPresence;uniform sampler2D tOpeningReflection;uniform vec2 uOpeningResolution;\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
          vec2 openingUv=gl_FragCoord.xy/uOpeningResolution-normal.xy*.055;
          vec3 openingLight=texture2D(tOpeningReflection,clamp(openingUv,.001,.999)).rgb;
          float openingFresnel=pow(1.-max(0.,dot(normal,normalize(vViewPosition))),2.);
          outgoingLight+=openingLight*(.35+openingFresnel*.75);
          outgoingLight*=uLogoPresence;
          #include <opaque_fragment>
        `);
      };
      material.customProgramCacheKey=()=> 'opening-video-particle-reflection-v2';
      material.needsUpdate=true;
    }
  }
  update(p: number, time: number, dt: number, reduced: boolean) {
    const space=spaceTimeline(p),footer=space.footer;
    const t = footer?clamp((p-.87)/.13):clamp(p/.145);
    this.logo.visible = p < .20 || footer;
    this.logo.rotation.set(footer?Math.PI:reduced ? 0 : .16*Math.sin(t*Math.PI), reduced ? 0 : -.20+t*3.64, reduced ? 0 : -.12*Math.sin(t*Math.PI));
    this.logo.position.set(0,space.logoY,0);
    this.logo.scale.setScalar(this.logoScale);
    for(const m of this.logoMaterials){m.transparent=false;m.opacity=1;m.userData.spacePresence.value=space.logoPresence;}
    this.logo.updateWorldMatrix(true,true);
    for(let i=0;i<this.cards.length;i++){
      const card=this.cards[i];if(!card)continue;
      const {mesh,media} = card;const focus=.20+i*.09;
      const enter=i===0?(p>=.11?1:0):smooth(focus-.085,focus-.012,p);
      const exit=i===3?(p<.595?1:0):1-smooth(focus+.026,focus+.080,p);
      const alpha=enter*exit;
      mesh.visible=alpha>.001;mesh.material.uniforms.uOpacity.value=alpha;
      mesh.rotation.set(0,reduced?0:(i%2===0?-.05:.05)*Math.sin(clamp((p-focus)/.09,-1,1)*1.2),0);
      mesh.material.uniforms.uBlend.value=media?.update(alpha>.60||(i===1&&(p<.20||footer)),time,dt,reduced) ?? 0;
    }
    this.backdrop?.update(p,this.cards[1]?.mesh.material.uniforms.uBlend.value ?? 0);
  }
  pause(){for(const c of this.cards)if(c)c.media?.pause();}
  dispose(){this.disposed=true;this.backdrop?.dispose();for(const c of this.cards)if(c){c.mesh.geometry.dispose();c.mesh.material.dispose();c.poster.dispose();c.media?.dispose();}this.logo.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(o.material as THREE.Material).dispose();}});}
}
