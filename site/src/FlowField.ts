import * as THREE from 'three';
import { referenceShaders as S } from './ReferenceShaders';

/** Port of MouseFluid / Fluid: pixel-unit velocity, 512² dye mask and original pass order. */
export class FlowField {
  private velocity=[this.target(128),this.target(128)];
  private density=[this.target(512),this.target(512)];
  private pressure=[this.target(128,THREE.NearestFilter),this.target(128,THREE.NearestFilter)];
  private curl=this.target(128,THREE.NearestFilter);
  private divergence=this.target(128,THREE.NearestFilter);
  private scene=new THREE.Scene();
  private camera=new THREE.Camera();
  private quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2));
  private programs:Record<string,THREE.ShaderMaterial>={};
  private last=new THREE.Vector2();
  private point=new THREE.Vector2();
  private initialized=false;
  impulse=0;
  constructor(private renderer:THREE.WebGLRenderer){
    this.scene.add(this.quad);
    for(const name of ['curl','vorticity','divergence','clear','pressure','gradientSubtract','advection','splat']){
      this.programs[name]=new THREE.ShaderMaterial({vertexShader:S['fluidBase.vs'],fragmentShader:S[name+'Shader.fs'],depthTest:false,depthWrite:false,
        uniforms:{texelSize:{value:new THREE.Vector2(1/128,1/128)},uVelocity:{value:null},uCurl:{value:null},curl:{value:30},dt:{value:1/60},uTexture:{value:null},value:{value:.8},uPressure:{value:null},uDivergence:{value:null},uSource:{value:null},dissipation:{value:.98},uTarget:{value:null},aspectRatio:{value:1},point:{value:new THREE.Vector2()},prevPoint:{value:new THREE.Vector2()},color:{value:new THREE.Vector3()},radius:{value:.18},canRender:{value:1},uAdd:{value:1}}});
    }
    const old=renderer.getRenderTarget(),clear=renderer.getClearColor(new THREE.Color()),alpha=renderer.getClearAlpha();renderer.setClearColor(0x000000,0);for(const rt of [...this.velocity,...this.density,...this.pressure,this.curl,this.divergence]){renderer.setRenderTarget(rt);renderer.clear();}renderer.setRenderTarget(old);renderer.setClearColor(clear,alpha);
  }
  private target(size:number,filter:THREE.TextureFilter=THREE.LinearFilter){return new THREE.WebGLRenderTarget(size,size,{type:THREE.HalfFloatType,minFilter:filter as THREE.MinificationTextureFilter,magFilter:filter as THREE.MagnificationTextureFilter,depthBuffer:false});}
  get texture(){return this.velocity[0].texture;}
  get mask(){return this.density[0].texture;}
  private pass(name:string,target:THREE.WebGLRenderTarget,values:Record<string,unknown>){const m=this.programs[name];for(const[k,v]of Object.entries(values))m.uniforms[k].value=v;this.quad.material=m;this.renderer.setRenderTarget(target);this.renderer.render(this.scene,this.camera);}
  update(x:number,y:number,dt:number,aspect:number){
    const old=this.renderer.getRenderTarget(),hz=Math.min(dt,.033)*60;
    const size=this.renderer.getSize(new THREE.Vector2());this.point.set((x+1)*.5*size.x,(y+1)*.5*size.y);
    if(!this.initialized){this.last.copy(this.point);this.initialized=true;}
    const dx=this.point.x-this.last.x,dy=this.point.y-this.last.y,len=Math.hypot(dx,dy),radius=Math.min(len/5,1)*60*.6/200;
    this.impulse=len;
    if(len>.01){
      const u=this.programs.splat.uniforms;u.prevPoint.value.copy(u.point.value);u.point.value.set(this.point.x/size.x,1-this.point.y/size.y);
      // Avoid a zero-length segment and the source shader's 0/0 on the first splat.
      if(u.prevPoint.value.distanceToSquared(u.point.value)<1e-12)u.prevPoint.value.copy(u.point.value).addScalar(.000001);
      const speed=Math.min(len/15,1)*10;
      this.pass('splat',this.velocity[1],{uTarget:this.velocity[0].texture,aspectRatio:aspect,radius,color:new THREE.Vector3(dx*speed,-dy*speed,1)});this.velocity.reverse();
      this.pass('splat',this.density[1],{uTarget:this.density[0].texture,color:new THREE.Vector3(1,1,1)});this.density.reverse();
    }
    this.last.copy(this.point);
    const step=Math.min(dt,.033);
    this.pass('curl',this.curl,{uVelocity:this.texture});
    this.pass('vorticity',this.velocity[1],{uVelocity:this.texture,uCurl:this.curl.texture,dt:step});this.velocity.reverse();
    this.pass('divergence',this.divergence,{uVelocity:this.texture});
    this.pass('clear',this.pressure[1],{uTexture:this.pressure[0].texture,value:Math.pow(.8,hz)});this.pressure.reverse();
    for(let i=0;i<20;i++){this.pass('pressure',this.pressure[1],{uPressure:this.pressure[0].texture,uDivergence:this.divergence.texture});this.pressure.reverse();}
    this.pass('gradientSubtract',this.velocity[1],{uPressure:this.pressure[0].texture,uVelocity:this.texture});this.velocity.reverse();
    this.pass('advection',this.velocity[1],{texelSize:new THREE.Vector2(1/128,1/128),uVelocity:this.texture,uSource:this.texture,dt:step,dissipation:Math.pow(.98,hz)});this.velocity.reverse();
    this.pass('advection',this.density[1],{texelSize:new THREE.Vector2(1/512,1/512),uVelocity:this.texture,uSource:this.mask,dt:step,dissipation:Math.pow(.97,hz)});this.density.reverse();
    this.renderer.setRenderTarget(old);
  }
  measure(){const data=new Uint16Array(128*128*4);this.renderer.readRenderTargetPixels(this.velocity[0],0,0,128,128,data);let total=0,max=0;for(let i=0;i<data.length;i+=4){const l=Math.hypot(THREE.DataUtils.fromHalfFloat(data[i]),THREE.DataUtils.fromHalfFloat(data[i+1]));total+=l;max=Math.max(max,l);}return{mean:total/(128*128),max};}
  dispose(){for(const rt of [...this.velocity,...this.density,...this.pressure,this.curl,this.divergence])rt.dispose();for(const m of Object.values(this.programs))m.dispose();this.quad.geometry.dispose();}
}
