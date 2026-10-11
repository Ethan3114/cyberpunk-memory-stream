import * as THREE from 'three';
import { referenceShaders as S } from './ReferenceShaders';
import { asset, smooth } from './story';
const vertex='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.);}';
/** Published shader math / Hydra schedules, adapted to a Three.js host. */
export class ReferencePostFX {
  private scene=new THREE.Scene();private camera=new THREE.Camera();private quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2));
  private programs:Record<string,THREE.ShaderMaterial>={};
  private main=this.target(THREE.UnsignedByteType);private home=this.target(THREE.UnsignedByteType);private bloom=this.target();private prefilter=this.target();private streak=this.target();
  private bloomH=Array.from({length:3},()=>this.target());private bloomV=Array.from({length:3},()=>this.target());
  private down=Array.from({length:8},()=>this.target());private up=Array.from({length:6},()=>this.target());
  private incoming=this.target(THREE.UnsignedByteType);private cut=this.target(THREE.UnsignedByteType);
  private openingObjects:THREE.Object3D[]=[];private incomingObjects:THREE.Object3D[]=[];
  private incomingCamera=new THREE.PerspectiveCamera();
  private volumeInput=this.target();private volumeX=this.target();private volumeY=this.target();private volume=this.target();
  private maskScene=new THREE.Scene();private occluder?:THREE.Group;private background?:THREE.Mesh;private sourceBackground?:THREE.Mesh;
  private volumeMaterial?:THREE.ShaderMaterial;
  private black=new THREE.MeshBasicMaterial({color:0x000000});private probeTime=0;
  private disabled=new Set<string>();
  constructor(private renderer:THREE.WebGLRenderer){
    if(import.meta.env.DEV)this.disabled=new Set((new URLSearchParams(location.search).get('fx')??'').split(','));this.scene.add(this.quad);
    const add=(n:string,f:string,u:Record<string,unknown>)=>{this.programs[n]=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:f,depthTest:false,depthWrite:false,uniforms:Object.fromEntries(Object.entries(u).map(([k,value])=>[k,{value}]))});};
    for(let i=0;i<3;i++)add('gaussian'+i,`#define KERNEL_RADIUS ${[3,5,7][i]}\n#define SIGMA ${[3,5,7][i]}\n`+S['UnrealBloomGaussian.glsl'],{colorTexture:null,texSize:new THREE.Vector2(),direction:new THREE.Vector2()});
    const composite=S['UnrealBloomComposite.glsl'].replace('uniform sampler2D blurTexture1;','uniform sampler2D blurTexture1,blurTexture2,blurTexture3;').replace('lerpBloomFactor(1.0) * vec4(bloomTintColor, 1.0) * texture2D(blurTexture1, vUv)','lerpBloomFactor(1.0)*vec4(bloomTintColor,1.)*texture2D(blurTexture1,vUv)+lerpBloomFactor(.8)*vec4(bloomTintColor,1.)*texture2D(blurTexture2,vUv)+lerpBloomFactor(.6)*vec4(bloomTintColor,1.)*texture2D(blurTexture3,vUv)');
    add('bloom',composite,{blurTexture1:this.bloomV[0].texture,blurTexture2:this.bloomV[1].texture,blurTexture3:this.bloomV[2].texture,bloomStrength:.6,bloomRadius:.8,bloomTintColor:new THREE.Color('white')});
    add('prefilter',S['LensFlarePrefilter.glsl'],{tMap:null,uThreshold:.42,uRotate:.3});
    add('down',S['LensFlareDown.glsl'],{tMap:null,uResolution:new THREE.Vector2(),uStretch:1});
    add('up',S['LensFlareUp.glsl'],{tHigh:null,tScene:null,uResolution:new THREE.Vector2(),uStretch:1,uSoftenEdge:1.5});
    add('streak','uniform vec2 resolution;\n'+S['CompositeStreak.glsl'],{tHigh:this.up[5].texture,tDown:this.down[6].texture,tPrefiltered:this.down[4].texture,resolution:new THREE.Vector2(),uStreakColor:new THREE.Color('#c2dcff'),uStreakIntensity:.1,uGlowIntensity:.2,uDebugHalo:false,uFlareIntensity:.5,uAspectCorrection:1,uHaloChroma:.5,uHaloScale:.5,uRotateStreak:.3,uHaloSoftness:2,uHaloRotateSrc:1,uHaloConstant:0,uHaloColor:new THREE.Color('#cceeff'),uHaloRing:new THREE.Vector4(.5,.5,.6,.4)});
    add('lightBlur','uniform sampler2D tDiffuse;uniform vec2 resolution,uDir;varying vec2 vUv;\n'+S['gaussianblur.fs']+'\nvoid main(){gl_FragColor=blur9(tDiffuse,vUv,resolution,uDir);}',{tDiffuse:null,resolution:new THREE.Vector2(),uDir:new THREE.Vector2()});
    add('volume','uniform sampler2D tDiffuse;varying vec2 vUv;\n'+S['VolumetricLight.fs'],{tDiffuse:this.volumeY.texture,lightPos:new THREE.Vector2(.5,.5),fExposure:.86,fDecay:.8,fDensity:.22,fWeight:.34,fClamp:1});
    add('home','uniform sampler2D tDiffuse,tVolume;uniform float uVolume;varying vec2 vUv;void main(){gl_FragColor=vec4(texture2D(tDiffuse,vUv).rgb+texture2D(tVolume,vUv).rgb*uVolume,1.);}',{tDiffuse:this.main.texture,tVolume:this.volume.texture,uVolume:1.1});
    const water=new THREE.TextureLoader().load(asset('glass/waternormals.jpg'));water.wrapS=water.wrapT=THREE.RepeatWrapping;
    add('transition',S.FXScrollTransitionFragment,{tMap1:this.home.texture,tMap2:this.incoming.texture,tNormal:water,resolution:new THREE.Vector2(),time:0,uTransition:0,uAngle:1,uVelocity:0,uAngleVelocity:0,uRatio:1});
    const normal=new THREE.TextureLoader().load(asset('fbr/normal.png'));normal.wrapS=normal.wrapT=THREE.RepeatWrapping;
    add('final',S.GlobalComposite,{tDiffuse:this.home.texture,tUnrealBloom:this.bloom.texture,tLightStreak:this.streak.texture,tFluid:this.volume.texture,tFluidMask:this.volume.texture,tNormal:normal,resolution:new THREE.Vector2(),time:0,uBloomEnabled:1,uStreakEnabled:1,uRGBStrength:1,uVolumetricStrength:1,uContrast:new THREE.Vector2(.98,1.2),uScroll:0,uContact:0,uScrollDelta:0,uMouse:new THREE.Vector2(),uFrostCorner:new THREE.Vector3(),uNormalScale:3,uVisible:1,uChatOpen:0,uGradient:new THREE.Vector2(.6,1.2),uMobile:0,uUIColor:new THREE.Color('#6449cf'),uUIBlend:1,uSyncTouch:0});

  }
  private target(type:THREE.TextureDataType=THREE.HalfFloatType){return new THREE.WebGLRenderTarget(1,1,{type,depthBuffer:false});}
  bind(background:THREE.Mesh,logo:THREE.Group){this.sourceBackground=background;this.background=background.clone();this.background.matrixAutoUpdate=false;
    const source=background.material as THREE.ShaderMaterial;this.volumeMaterial=source.clone();this.volumeMaterial.uniforms={...source.uniforms};
    this.volumeMaterial.fragmentShader=source.fragmentShader.replace('vec4(color,uOpacity)','vec4(color*smoothstep(.5,.05,length(vUv-.5))*.35,uOpacity)');this.background.material=this.volumeMaterial;
    this.maskScene.add(this.background);this.occluder=logo.clone(true);this.occluder.matrixAutoUpdate=false;this.occluder.traverse(o=>{if(o instanceof THREE.Mesh)o.material=this.black;});this.maskScene.add(this.occluder);}
  setOpening(opening:THREE.Object3D[],incoming:THREE.Object3D[]){this.openingObjects=opening;this.incomingObjects=incoming;}
  resize(width:number,height:number){
    this.volumeInput.depthBuffer=true;this.main.depthBuffer=true;this.main.setSize(width,height);this.home.setSize(width,height);this.incoming.depthBuffer=true;this.incoming.setSize(width,height);this.cut.setSize(width,height);this.programs.transition.uniforms.resolution.value.set(width,height);this.programs.transition.uniforms.uRatio.value=width/height;
    let w=Math.max(1,Math.round(width*.3/2)),h=Math.max(1,Math.round(height*.3/2));for(let i=0;i<3;i++){this.bloomH[i].setSize(w,h);this.bloomV[i].setSize(w,h);w=Math.max(1,Math.round(w/2));h=Math.max(1,Math.round(h/2));}this.bloom.setSize(this.bloomH[0].width,this.bloomH[0].height);
    w=width;h=Math.max(1,Math.round(height/2));this.prefilter.setSize(width,height);this.streak.setSize(width,height);this.programs.streak.uniforms.resolution.value.set(width,height);this.programs.final.uniforms.resolution.value.set(width,height);
    for(let i=0;i<8;i++){this.down[i].setSize(w,h);w=Math.max(1,Math.floor(w/2));}for(let i=0;i<6;i++)this.up[i].setSize(this.down[i].width,this.down[i].height);
    for(const rt of [this.volumeInput,this.volumeX,this.volumeY,this.volume])rt.setSize(Math.max(1,Math.round(width*.2)),Math.max(1,Math.round(height*.2)));
  }
  private pass(n:string,rt:THREE.WebGLRenderTarget|null,u:Record<string,unknown>={}){const m=this.programs[n];for(const[k,v]of Object.entries(u))m.uniforms[k].value=v;this.quad.material=m;this.renderer.setRenderTarget(rt);this.renderer.render(this.scene,this.camera);}
  render(scene:THREE.Scene,camera:THREE.Camera,logo:THREE.Group,p:number,time:number,flow?:THREE.Texture,mask?:THREE.Texture,reduced=false){
    const opening=p<.20&&this.openingObjects.length>0;
    const transition=smooth(.11,.20,p);
    const incomingState=this.incomingObjects.map(o=>o.visible);
    if(opening)this.incomingObjects.forEach(o=>{o.visible=false;});
    this.renderer.setRenderTarget(this.main);this.renderer.clear();this.renderer.render(scene,camera);
    if(opening)this.incomingObjects.forEach((o,i)=>{o.visible=incomingState[i];});
    const on=(name:string)=>!this.disabled.has(name)&&!this.disabled.has('off');const volume=p<.20&&logo.visible&&on('volume');
    if(volume&&this.occluder&&this.background&&this.sourceBackground){
      this.occluder.matrix.copy(logo.matrixWorld);this.background.matrix.copy(this.sourceBackground.matrixWorld);this.maskScene.updateMatrixWorld(true);this.renderer.setRenderTarget(this.volumeInput);this.renderer.clear();this.renderer.render(this.maskScene,camera);
      const res=new THREE.Vector2(this.volume.width,this.volume.height);this.pass('lightBlur',this.volumeX,{tDiffuse:this.volumeInput.texture,resolution:res,uDir:new THREE.Vector2(.3,0)});this.pass('lightBlur',this.volumeY,{tDiffuse:this.volumeX.texture,uDir:new THREE.Vector2(0,.3)});
      const pos=new THREE.Vector3().setFromMatrixPosition(logo.matrixWorld).project(camera);this.pass('volume',this.volume,{lightPos:new THREE.Vector2(pos.x*.5+.5,pos.y*.5+.5)});
    }
    this.pass('home',this.home,{uVolume:volume?1.1:0});
    let composited=this.home.texture;
    if(opening&&transition>0){
      const openingState=this.openingObjects.map(o=>o.visible);this.openingObjects.forEach(o=>{o.visible=false;});
      this.incomingCamera.copy(camera as THREE.PerspectiveCamera);this.incomingCamera.position.set(0,0,10);this.incomingCamera.quaternion.identity();this.incomingCamera.updateMatrixWorld(true);
      this.renderer.setRenderTarget(this.incoming);this.renderer.clear();this.renderer.render(scene,this.incomingCamera);
      this.openingObjects.forEach((o,i)=>{o.visible=openingState[i];});
      this.pass('transition',this.cut,{uTransition:transition});composited=this.cut.texture;
    }
    if(on('bloom')){let input=composited;for(let i=0;i<3;i++){this.pass('gaussian'+i,this.bloomH[i],{colorTexture:input,texSize:new THREE.Vector2(this.bloomH[i].width,this.bloomH[i].height),direction:new THREE.Vector2(.3,0)});this.pass('gaussian'+i,this.bloomV[i],{colorTexture:this.bloomH[i].texture,direction:new THREE.Vector2(0,.3)});input=this.bloomV[i].texture;}this.pass('bloom',this.bloom,{bloomStrength:p<.23?.6:.5,bloomRadius:p<.23?.8:.5});}
    if(on('streak')){
      this.pass('prefilter',this.prefilter,{tMap:composited});let input=this.prefilter.texture;
      for(let i=0;i<8;i++){const previous=i===0?this.prefilter:this.down[i-1];this.pass('down',this.down[i],{tMap:input,uResolution:new THREE.Vector2(previous.width,previous.height)});input=this.down[i].texture;}
      // Published scheduling retained, including its unreferenced tHigh upsample input.
      let last=this.down[7].texture;this.pass('up',this.up[0],{tHigh:last,tScene:last,uResolution:new THREE.Vector2(this.up[0].width,this.up[0].height)});
      for(let i=1;i<6;i++){this.pass('up',this.up[i],{tHigh:this.down[i-1].texture,tScene:last,uResolution:new THREE.Vector2(this.up[i].width,this.up[i].height)});last=this.up[i].texture;}this.pass('streak',this.streak);
    }
    this.pass('final',null,{tDiffuse:composited,uBloomEnabled:on('bloom')?1:0,uStreakEnabled:on('streak')?1:0,time:reduced?0:time,uScroll:p,tFluid:flow??this.volume.texture,tFluidMask:mask??this.volume.texture});
    const d=this.renderer.domElement.dataset;d.transition=transition.toFixed(4);d.transitionShader='FXScrollTransition';d.fxPipeline='ldr-home-volume-bloom3-lens8-global';d.fxEnabled=JSON.stringify({volume,bloom:on('bloom'),streak:on('streak')});
    if(import.meta.env.DEV&&new URLSearchParams(location.search).get('probe')==='1'&&time-this.probeTime>1){this.probeTime=time;d.fxEnergy=JSON.stringify({volume:volume?this.energy(this.volume):0,bloom:on('bloom')?this.energy(this.bloom):0,streak:on('streak')?this.energy(this.streak):0});}
  }
  private energy(rt:THREE.WebGLRenderTarget){const data=new Uint16Array(rt.width*rt.height*4);this.renderer.readRenderTargetPixels(rt,0,0,rt.width,rt.height,data);let sum=0;for(let i=0;i<data.length;i+=4)sum+=THREE.DataUtils.fromHalfFloat(data[i])+THREE.DataUtils.fromHalfFloat(data[i+1])+THREE.DataUtils.fromHalfFloat(data[i+2]);return sum/(rt.width*rt.height*3);}
  dispose(){for(const rt of [this.main,this.home,this.incoming,this.cut,this.bloom,this.prefilter,this.streak,...this.bloomH,...this.bloomV,...this.down,...this.up,this.volumeInput,this.volumeX,this.volumeY,this.volume])rt.dispose();for(const m of Object.values(this.programs))m.dispose();(this.programs.final.uniforms.tNormal.value as THREE.Texture).dispose();(this.programs.transition.uniforms.tNormal.value as THREE.Texture).dispose();this.volumeMaterial?.dispose();this.black.dispose();this.quad.geometry.dispose();}
}
