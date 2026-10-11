import * as THREE from 'three';
import { asset, smooth } from './story';
import { neonPalette } from './NeonPalette';

/** Published flower_spine point positions and colors, decoded as data with Three's Draco decoder.
 * Hydra's point-sprite matcap, paired-bank layout and normal-offset reflection are ported separately.
 * This is a fixed world-space cloud: it does not follow the camera or explode with each scroll.
 */
export class ParticleBanks {
  readonly group = new THREE.Group();
  readonly count = 65536;
  ready: Promise<void>;
  private material?: THREE.ShaderMaterial;
  private geometry?: THREE.BufferGeometry;
  private matcap?: THREE.Texture;
  private disposed = false;
  private coreRadius=1.14;
  private panelInverse=Array.from({length:4},()=>new THREE.Matrix4());
  private panelActive=new Float32Array(4);
  private cameraPosition=new THREE.Vector3();
  private coreHeight=new THREE.Vector2(-19,9);
  private coreForeground=0;
  private lastProbe=0;
  private protectedVolumes:THREE.Object3D[]=[];

  constructor() {
    this.ready = Promise.all([
      fetch(asset('models/flower-reference.bin')).then(r=>{if(!r.ok)throw Error('Particle cloud unavailable');return r.arrayBuffer();}),
      new THREE.TextureLoader().loadAsync(asset('particle-matcap.png')),
    ]).then(([buffer,matcap])=>{
      this.matcap=matcap;matcap.colorSpace=THREE.SRGBColorSpace;
      const data=new Float32Array(buffer),positions=new Float32Array(this.count*3),colors=data.slice(this.count*3),sizes=new Float32Array(this.count),seeds=new Float32Array(this.count);
      let seed=77;const random=()=>{seed=seed*16807%2147483647;return seed/2147483647;};
      for(let i=0;i<this.count;i++){
        const j=i*3;let x=data[j],y=data[j+1],z=data[j+2];
        // Reference FlowerParticleShader's paired geometry transform, frozen at its middle pose.
        if(x<0){z=-z;y-=5;}
        x+=1;z-=.5;
        const side=x<0;
        x-=Math.cos(-data[j+1]*.06+(side?0:3))*3+(side?-3.5:3.5);
        z-=Math.sin(-data[j+1]*.06+(side?0:3))*3+(side?-2:1);
        positions.set([-x*.48,y*.32-1,-z*.48],j);
        sizes[i]=.024+Math.pow(random(),4)*.045;seeds[i]=random();
      }
      this.geometry=new THREE.BufferGeometry();this.geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));this.geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));this.geometry.setAttribute('aSize',new THREE.BufferAttribute(sizes,1));this.geometry.setAttribute('aSeed',new THREE.BufferAttribute(seeds,1));
      this.material=new THREE.ShaderMaterial({
        uniforms:{uCoreRadius:{value:1.14},uCoreHeight:{value:this.coreHeight},uCoreForeground:{value:0},uPanelInverse:{value:this.panelInverse},uPanelActive:{value:this.panelActive},uCameraPosition:{value:this.cameraPosition},uProtectMedia:{value:0},tMatcap:{value:matcap},uOpacity:{value:0},uHeight:{value:900},uDpr:{value:1},uTime:{value:0}},
        transparent:true,depthTest:true,depthWrite:false,
        vertexShader:`attribute float aSize,aSeed;attribute vec3 color;uniform float uHeight,uDpr;varying vec3 vColor;varying float vSeed;varying vec3 vWorld;varying float vAllowed;uniform mat4 uPanelInverse[4];uniform float uPanelActive[4];uniform vec3 uCameraPosition;uniform vec2 uCoreHeight;uniform float uCoreRadius,uProtectMedia,uCoreForeground;
          void main(){vWorld=(modelMatrix*vec4(position,1.)).xyz;
          vAllowed=step(uCoreRadius,length(vWorld.xz));
          // A foreground billboard may cover the spine despite lying outside its volume.
          // Clear rays that reach the protected spine cylinder after the point itself.
          vec3 ray=vWorld-uCameraPosition;float a=dot(ray.xz,ray.xz);
          float b=2.*dot(uCameraPosition.xz,ray.xz),c=dot(uCameraPosition.xz,uCameraPosition.xz)-uCoreRadius*uCoreRadius;
          float discriminant=b*b-4.*a*c;
          if(a>.00001&&discriminant>0.){float t=(-b-sqrt(discriminant))/(2.*a);float hitY=uCameraPosition.y+t*ray.y;
            if(t>1.&&hitY>uCoreHeight.x&&hitY<uCoreHeight.y&&aSeed<uCoreForeground)vAllowed=0.;}
          if(uProtectMedia>.5){for(int i=0;i<4;i++){if(uPanelActive[i]<.5)continue;
            vec3 local=(uPanelInverse[i]*vec4(vWorld,1.)).xyz;
            if(all(lessThan(abs(local),vec3(1.86,1.11,.33))))vAllowed=0.;
            // Clear foreground sprites from the media aperture; retain the glass border's refraction.
            vec3 eye=(uPanelInverse[i]*vec4(uCameraPosition,1.)).xyz;
            float dz=local.z-eye.z;float face=eye.z>=0.?.15:-.15;
            if(abs(dz)>.0001){float t=(face-eye.z)/dz;vec2 hit=eye.xy+t*(local.xy-eye.xy);
              if(t>1.&&all(lessThan(abs(hit),vec2(1.63,.94))))vAllowed=0.;}
          }}vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(aSize*uHeight*uDpr/max(1.,-mv.z),1.4*uDpr,10.*uDpr);vColor=color;vSeed=aSeed;}`,
        fragmentShader:`uniform sampler2D tMatcap;uniform float uOpacity,uTime;varying vec3 vColor;varying float vSeed;varying vec3 vWorld;varying float vAllowed;
          ${neonPalette}
          void main(){if(vAllowed<.5)discard;vec2 uv=gl_PointCoord;vec2 q=uv-.5;float r=length(q);if(r>.5)discard;
          vec3 cap=texture2D(tMatcap,rotateSprite(uv,sin(uTime*.25+vSeed*20.)*.3+1.)).rgb;
          float luminance=max(vColor.r,max(vColor.g,vColor.b));
          vec3 hue=neonPalette(vWorld);
          vec3 tint=mix(hue,softLight(hue,cap*1.3),.8);
          tint*=.68+luminance*.65;
          tint*=1.+pow(vSeed,30.)*sin(uTime*1.3+vSeed*50.)*.15;
          gl_FragColor=vec4(tint,uOpacity*(1.-smoothstep(.40,.5,r)));
          #include <colorspace_fragment>
        }`,
      });
      const points=new THREE.Points(this.geometry,this.material);points.frustumCulled=false;this.group.add(points);
      if(this.disposed)this.dispose();
    });
  }
  resize(height:number,dpr:number){if(this.material){this.material.uniforms.uHeight.value=height;this.material.uniforms.uDpr.value=dpr;}}
  setCoreRadius(radius:number){this.coreRadius=radius;if(this.material)this.material.uniforms.uCoreRadius.value=radius;}
  setCoreHeight(height:THREE.Vector2){this.coreHeight.copy(height);}
  protect(panels:THREE.Object3D[],camera:THREE.Camera,enabled:boolean,coreForeground=0){
    this.protectedVolumes=panels;
    this.cameraPosition.setFromMatrixPosition(camera.matrixWorld);
    this.coreForeground=coreForeground;
    for(let i=0;i<4;i++){this.panelActive[i]=panels[i].visible&&panels[i].scale.x>.01?1:0;this.panelInverse[i].copy(panels[i].matrixWorld).invert();}
    if(this.material){this.material.uniforms.uProtectMedia.value=enabled?1:0;this.material.uniforms.uCoreForeground.value=coreForeground;}
  }
  update(p:number,time:number,reduced:boolean){
    const alpha=smooth(.51,.59,p);this.group.visible=alpha>.001;
    if(this.material){
      // The reference writes opaque sprites. Restore point-to-point depth once its entrance finishes.
      const fading=alpha<.999;
      if(this.material.transparent!==fading){this.material.transparent=fading;this.material.needsUpdate=true;}
      this.material.depthWrite=!fading;
      this.material.uniforms.uOpacity.value=alpha;this.material.uniforms.uTime.value=reduced?0:time;
    }
  }
  measure(time:number){
    if(!import.meta.env.DEV||new URLSearchParams(location.search).get('probe')!=='1'||!this.geometry||time-this.lastProbe<.5)return;
    this.lastProbe=time;const positions=this.geometry.attributes.position,seeds=this.geometry.attributes.aSeed;let core=0,volume=0,foreground=0,coreForeground=0;
    const point=new THREE.Vector3(),local=new THREE.Vector3(),eye=new THREE.Vector3();
    for(let i=0;i<positions.count;i++){
      point.fromBufferAttribute(positions,i);
      if(Math.hypot(point.x,point.z)<this.coreRadius){core++;continue;}
      const dx=point.x-this.cameraPosition.x,dy=point.y-this.cameraPosition.y,dz=point.z-this.cameraPosition.z;
      const a=dx*dx+dz*dz,b=2*(this.cameraPosition.x*dx+this.cameraPosition.z*dz),c=this.cameraPosition.x**2+this.cameraPosition.z**2-this.coreRadius**2,d=b*b-4*a*c;
      if(a>.00001&&d>0){const t=(-b-Math.sqrt(d))/(2*a),hitY=this.cameraPosition.y+t*dy;if(t>1&&hitY>this.coreHeight.x&&hitY<this.coreHeight.y&&seeds.getX(i)<this.coreForeground){coreForeground++;continue;}}
      for(let panel=0;panel<4;panel++){if(this.panelActive[panel]<.5)continue;const inverse=this.panelInverse[panel];
        local.copy(point).applyMatrix4(inverse);
        if(Math.abs(local.x)<1.86&&Math.abs(local.y)<1.11&&Math.abs(local.z)<.33){volume++;break;}
        eye.copy(this.cameraPosition).applyMatrix4(inverse);const dz=local.z-eye.z,t=((eye.z>=0?.15:-.15)-eye.z)/dz;
        if(Math.abs(dz)>.0001&&t>1&&Math.abs(eye.x+t*(local.x-eye.x))<1.63&&Math.abs(eye.y+t*(local.y-eye.y))<.94){foreground++;break;}
      }
    }
    return {coreExcluded:core,coreForegroundExcluded:coreForeground,coreHeight:this.coreHeight.toArray(),coreForegroundStrength:this.coreForeground,glassExcluded:volume,foregroundExcluded:foreground,total:positions.count,coreRadius:this.coreRadius,active:Array.from(this.panelActive),enabled:this.material?.uniforms.uProtectMedia.value,panels:this.protectedVolumes.length};
  }
  dispose(){this.disposed=true;this.geometry?.dispose();this.material?.dispose();this.matcap?.dispose();}
}
