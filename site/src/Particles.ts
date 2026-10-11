import * as THREE from 'three';
import { GPUComputationRenderer, type Variable } from 'three/addons/misc/GPUComputationRenderer.js';
import { FlowField } from './FlowField';
import { referenceShaders as S } from './ReferenceShaders';
import { spaceTimeline } from './SpaceTimeline';
import { asset, smooth } from './story';

/** Original point preset + ParticleTest shape shader; branded palette / world scale are adaptations. */
export class Particles {
  readonly count=65536;
  points:THREE.Points<THREE.BufferGeometry,THREE.ShaderMaterial>;
  mode='static-reference-fallback';
  private flow?:FlowField;
  private gpu?:GPUComputationRenderer;
  private position?:Variable;
  private origin:THREE.DataTexture;
  private color:THREE.DataTexture;
  private viewProjection=new THREE.Matrix4();
  private basis=new THREE.Matrix3();
  private cameraBasis=new THREE.Matrix3();
  private lastProbe=0;
  private enteredAt?:number;
  private probeData=new Float32Array(256*256*4);
  constructor(private renderer:THREE.WebGLRenderer,forest:Float32Array,poster:THREE.Texture,video:THREE.VideoTexture){
    let seed=19;const rand=()=>{seed=seed*16807%2147483647;return seed/2147483647;};
    const origin=new Float32Array(this.count*4),colors=new Float32Array(this.count*4),refs=new Float32Array(this.count*2),randoms=new Float32Array(this.count*4),positions=new Float32Array(this.count*3);
    const palette=['#40b9ff','#4f72ff','#8d3cf1','#ec42a7','#edb875'].map(c=>new THREE.Color(c));
    const c=new THREE.Color();
    for(let i=0;i<this.count;i++){
      const j=i*3;
      // Extend the real ground samples beneath the descending camera in every azimuth.
      // Keep the tree tops unchanged and blend the footprint at their bases.
      const footprint=1+.4*(1-smooth(1.5,4,forest[j+1]));
      const point=[forest[j]*footprint,forest[j+1],forest[j+2]*footprint];
      origin.set([...point,1],i*4);positions.set(point,j);
      const k=this.count*3+j,lum=Math.max(forest[k],forest[k+1],forest[k+2]);
      const hue=THREE.MathUtils.clamp((forest[j]*.055+forest[j+2]*.025+1.8),0,3.99),index=Math.floor(hue);
      c.copy(palette[index]).lerp(palette[index+1],hue-index).multiplyScalar(.08+.45*Math.pow(lum,.6));colors.set([c.r,c.g,c.b,1],i*4);
      refs.set([(i%256+.5)/256,(Math.floor(i/256)+.5)/256],i*2);randoms.set([rand(),rand(),rand(),rand()],i*4);
    }
    const data=(a:Float32Array)=>{const t=new THREE.DataTexture(a,256,256,THREE.RGBAFormat,THREE.FloatType);t.needsUpdate=true;return t;};
    this.origin=data(origin);this.color=data(colors);
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.setAttribute('aRef',new THREE.BufferAttribute(refs,2));geo.setAttribute('aRandom',new THREE.BufferAttribute(randoms,4));
    // Use the settled forest pose: its low vertices form the actual ground, rather than
    // the entrance funnel lifting those vertices into an overhead cloud.
    const vertex=S.ParticleVertex
      .replace('pos.y -= smoothstep(0.8, 1.0, uScroll) * 2.0 * pow(funnel, 5.0);','pos.y -= smoothstep(0.8, 1.0, uScroll) * 2.0 * pow(funnel, 5.0) * smoothstep(1.5, 4.0, decodedPos.y);')
      .replaceAll('smoothstep(5.0, 3.0, length(worldPos - uLogoPos))','smoothstep(2.15, 1.29, length(worldPos - uLogoPos))')
      .replace('vScale = smoothstep(8.0, 15.0, dist);','vScale = mix(smoothstep(1.1, 3.6, dist), smoothstep(8.0, 15.0, dist), smoothstep(1.5, 4.0, decodedPos.y));')
      .replace('vScale *= smoothstep(4.0, 5.0, rippleDist);','vScale *= smoothstep(1.15, 1.75, rippleDist);');
    const fragment=S.ParticleFragment.replace('if (length(vPos.xz) < 2.5) discard;','if (length(vPos.xz) < 2.5 && vPos.y > 1.5) discard;');
    const material=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,transparent:false,depthWrite:true,
      uniforms:{tPos:{value:this.origin},tPointColor:{value:this.color},tMap:{value:new THREE.TextureLoader().load(asset('particle-matcap.png'))},tVideo:{value:video},tPoster:{value:poster},uVideoBlend:{value:0},DPR:{value:1},uScroll:{value:0},uVisible:{value:1},uPulse:{value:0},uSizeBias:{value:1.4},uLogoPos:{value:new THREE.Vector3(0,0,0)},uTime:{value:0},uOpacity:{value:1},uTint:{value:new THREE.Color('white')}}});
    this.points=new THREE.Points(geo,material);this.points.frustumCulled=false;this.points.scale.setScalar(.43);this.points.position.set(0,-2.8,-3);
    const forceCpu=import.meta.env.DEV&&new URLSearchParams(location.search).get('particles')==='cpu';
    if(!forceCpu&&renderer.extensions.has('EXT_color_buffer_float')){
      try{
        this.flow=new FlowField(renderer);this.gpu=new GPUComputationRenderer(256,256,renderer);this.gpu.setDataType(THREE.FloatType);
        const start=this.gpu.createTexture();(start.image.data as Float32Array).set(origin);
        this.position=this.gpu.addVariable('texturePosition',`uniform sampler2D tPointCloud,tFluid,tFluidMask;uniform mat4 uModelMatrix,uProjMatrix;uniform mat3 uProjNormalMatrix;uniform float HZ,uMouseStrength;
          void main(){vec2 uv=gl_FragCoord.xy/resolution.xy;vec3 pos=texture2D(texturePosition,uv).xyz;vec3 target=texture2D(tPointCloud,uv).xyz;
          vec3 mpos=vec3(uModelMatrix*vec4(pos,1.));vec4 projected=uProjMatrix*vec4(mpos,1.);vec2 screenUV=projected.xy/projected.w*.5+.5;
          vec3 flow=vec3(texture2D(tFluid,screenUV).xy,0.);flow=uProjNormalMatrix*flow;
          target+=flow*.0001*HZ*uMouseStrength*texture2D(tFluidMask,screenUV).r;
          pos+=(target-pos)*.07*HZ;gl_FragColor=vec4(pos,1.);}`,start);
        this.gpu.setVariableDependencies(this.position,[this.position]);
        Object.assign(this.position.material.uniforms,{tPointCloud:{value:this.origin},tFluid:{value:this.flow.texture},tFluidMask:{value:this.flow.mask},uModelMatrix:{value:this.points.matrixWorld},uProjMatrix:{value:this.viewProjection},uProjNormalMatrix:{value:this.basis},HZ:{value:1},uMouseStrength:{value:100}});
        const error=this.gpu.init();if(error)throw Error(error);this.mode='reference-fluid-dye-relaxation';
      }catch{this.flow?.dispose();this.gpu?.dispose();this.flow=undefined;this.gpu=undefined;}
    }
  }
  get flowTexture(){return this.flow?.texture??this.origin;}
  get flowMask(){return this.flow?.mask??this.color;}
  resize(_height:number,pixelRatio:number){this.points.material.uniforms.DPR.value=pixelRatio;}
  update(p:number,x:number,y:number,time:number,dt:number,reduced:boolean,camera:THREE.Camera,videoBlend:number){
    const space=spaceTimeline(p),footer=space.footer,scroll=space.scroll,opacity=p<.20||footer?1:0;
    this.enteredAt??=time;
    this.points.rotation.set(footer?Math.PI:0,space.rotation,0);this.points.position.y=footer?2.8:-2.8;this.points.updateMatrixWorld(true);
    const m=this.points.material;m.uniforms.uVideoBlend.value=videoBlend;m.uniforms.uTime.value=reduced?0:time;m.uniforms.uScroll.value=scroll;m.uniforms.uOpacity.value=opacity;
    m.uniforms.uVisible.value=footer||reduced?1:smooth(0,5,time-this.enteredAt);
    this.points.visible=opacity>.001;const transparent=opacity<.999;if(m.transparent!==transparent){m.transparent=transparent;m.needsUpdate=true;}
    if(!reduced&&this.points.visible&&this.gpu&&this.flow&&this.position){
      this.viewProjection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
      // Map screen motion into the rotating cloud's local axes, preserving the
      // established local-unit mouse strength rather than amplifying by 1/scale.
      this.cameraBasis.setFromMatrix4(camera.matrixWorld);
      this.basis.setFromMatrix4(this.points.matrixWorld).invert().multiply(this.cameraBasis).multiplyScalar(this.points.scale.x);
      this.flow.update(x,y,dt,(camera as THREE.PerspectiveCamera).aspect);
      const u=this.position.material.uniforms;u.tFluid.value=this.flow.texture;u.tFluidMask.value=this.flow.mask;u.HZ.value=Math.min(dt,.033)*60;
      this.gpu.compute();m.uniforms.tPos.value=this.gpu.getCurrentRenderTarget(this.position).texture;
    }else if(reduced)m.uniforms.tPos.value=this.origin;
    if(import.meta.env.DEV&&new URLSearchParams(location.search).get('probe')==='1'&&time-this.lastProbe>.25&&this.flow&&this.gpu&&this.position){
      this.lastProbe=time;const flow=this.flow.measure();this.renderer.readRenderTargetPixels(this.gpu.getCurrentRenderTarget(this.position),0,0,256,256,this.probeData);
      let maxOffset=0,positive=0,negative=0,affected=0,nonFinite=0;const origin=this.origin.image.data as Float32Array;
      for(let i=0;i<this.count;i++){const k=i*4,dx=this.probeData[k]-origin[k],dy=this.probeData[k+1]-origin[k+1],dz=this.probeData[k+2]-origin[k+2];const offset=Math.hypot(dx,dy,dz);if(!Number.isFinite(offset)){nonFinite++;continue;}maxOffset=Math.max(maxOffset,offset);if(Math.abs(dy)>.05){affected++;positive=Math.max(positive,dy);negative=Math.min(negative,dy);}}
      const d=this.renderer.domElement.dataset;d.flowMean=flow.mean.toFixed(6);d.flowMax=flow.max.toFixed(6);d.particleDisplacement=JSON.stringify({maxOffset,positive,negative,affected,nonFinite});
    }
    return{mode:reduced?'static-reference-reduced':this.mode,count:this.count,impulse:this.flow?.impulse??0,energy:0,morph:scroll};
  }
  dispose(){this.flow?.dispose();this.gpu?.dispose();this.origin.dispose();this.color.dispose();this.points.geometry.dispose();(this.points.material.uniforms.tMap.value as THREE.Texture).dispose();this.points.material.dispose();}
}
