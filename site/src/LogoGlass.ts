import * as THREE from 'three';
import { asset } from './story';

/** Preserve the GLB silhouette, adding a narrow physical bevel to its hard slab edges. */
export function bevelWordmark(source:THREE.BufferGeometry){
  source.computeBoundingBox();const box=source.boundingBox!,position=source.getAttribute('position');
  const edges=new Map<string,{a:string;b:string;count:number}>(),vertices=new Map<string,THREE.Vector2>();
  const key=(i:number)=>{const x=position.getX(i),y=position.getY(i),k=`${Math.round(x*1e5)},${Math.round(y*1e5)}`;vertices.set(k,new THREE.Vector2(x,y));return k;};
  const count=source.index?.count??position.count;
  for(let i=0;i<count;i+=3){
    const ids=[0,1,2].map(j=>source.index?source.index.getX(i+j):i+j);
    if(!ids.every(j=>Math.abs(position.getZ(j)-box.max.z)<1e-5))continue;
    const keys=ids.map(key);
    for(let j=0;j<3;j++){const a=keys[j],b=keys[(j+1)%3],id=[a,b].sort().join('|');const e=edges.get(id);if(e)e.count++;else edges.set(id,{a,b,count:1});}
  }
  const neighbors=new Map<string,string[]>();
  for(const e of edges.values())if(e.count===1){for(const [a,b]of [[e.a,e.b],[e.b,e.a]])neighbors.set(a,[...(neighbors.get(a)??[]),b]);}
  if(!neighbors.size||[...neighbors.values()].some(n=>n.length!==2))return source;
  const visited=new Set<string>(),loops:THREE.Vector2[][]=[];
  for(const first of neighbors.keys()){
    if(visited.has(first))continue;const loop:THREE.Vector2[]=[];let current=first,previous='';
    do{visited.add(current);loop.push(vertices.get(current)!.clone());const next=neighbors.get(current)!.find(k=>k!==previous)!;previous=current;current=next;}while(current!==first&&loop.length<=neighbors.size);
    if(current!==first)return source;loops.push(loop);
  }
  const contains=(polygon:THREE.Vector2[],p:THREE.Vector2)=>{let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;};
  const depths=loops.map((loop,i)=>loops.reduce((n,other,j)=>n+(i!==j&&contains(other,loop[0])?1:0),0));
  const shapes:THREE.Shape[]=[];
  for(let i=0;i<loops.length;i++)if(depths[i]%2===0){const shape=new THREE.Shape(loops[i]);for(let j=0;j<loops.length;j++)if(depths[j]===depths[i]+1&&contains(loops[i],loops[j][0]))shape.holes.push(new THREE.Path(loops[j]));shapes.push(shape);}
  const thickness=box.max.z-box.min.z,bevel=Math.min(.009,thickness*.12);
  const geometry=new THREE.ExtrudeGeometry(shapes,{depth:thickness-2*bevel,steps:1,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:3,curveSegments:1});
  geometry.translate(0,0,box.min.z+bevel);geometry.computeBoundingBox();return geometry;
}

/** HomeLogoShader's screen refraction / video blend / Fresnel, adapted to a wide wordmark.
 * No original logo-specific UV clipping, rainbow green band, or metallic base layer.
 */
export class LogoGlass {
  readonly normal=new THREE.TextureLoader().load(asset('glass/waternormals.jpg'));
  readonly matcap=new THREE.TextureLoader().load(asset('fbr/matcap.jpg'));
  material:THREE.ShaderMaterial;
  constructor(){
    this.normal.wrapS=this.normal.wrapT=THREE.RepeatWrapping;this.matcap.colorSpace=THREE.SRGBColorSpace;
    this.material=new THREE.ShaderMaterial({
      uniforms:{tRefraction:{value:null},tNormal:{value:this.normal},tMap:{value:this.matcap},tPoster:{value:null},tVideo:{value:null},uVideoBlend:{value:0},resolution:{value:new THREE.Vector2(1,1)},time:{value:0},uVisible:{value:1},uFooter:{value:0}},
      depthTest:true,depthWrite:true,transparent:false,side:THREE.FrontSide,
      vertexShader:`varying vec2 vLogoUV;varying vec3 vNormal,vViewDir;
        void main(){vLogoUV=vec2(position.x*.25+.5,position.y/0.9823713+.5);
          vNormal=normalMatrix*normal;vec4 viewPos=modelViewMatrix*vec4(position,1.);vViewDir=-viewPos.xyz;
          gl_Position=projectionMatrix*viewPos;}`,
      fragmentShader:`uniform sampler2D tRefraction,tNormal,tMap,tPoster,tVideo;
        uniform vec2 resolution;uniform float time,uVisible,uFooter,uVideoBlend;
        varying vec2 vLogoUV;varying vec3 vNormal,vViewDir;
        vec3 movie(vec2 uv){vec3 c=texture2D(tPoster,clamp(uv,.001,.999)).rgb;
          if(uVideoBlend>.001){vec3 v=texture2D(tVideo,clamp(uv,.001,.999)).rgb;
            v=mix(v/12.92,pow((v+.055)/1.055,vec3(2.4)),step(vec3(.04045),v));c=mix(c,v,uVideoBlend);}return c;}
        vec3 neon(float t){t=fract(t);if(t<.5)return mix(vec3(.16,.72,1.),vec3(.48,.23,1.),t*2.);return mix(vec3(.48,.23,1.),vec3(1.,.32,.68),(t-.5)*2.);}
        void main(){vec2 screen=gl_FragCoord.xy/resolution;vec3 n=normalize(vNormal),view=normalize(vViewDir);
          vec2 normalUV=(mix(screen,vLogoUV,.5)-.5)*.5+.5-n.xy*.05-view.xy*.001-time*.01;
          vec3 ripple=texture2D(tNormal,normalUV).xyz*2.-1.;
          vec2 offset=n.xy*.05+ripple.xy*.005;
          vec2 ruv=clamp(screen-offset,.002,.998);vec2 chroma=n.xy*.0014+ripple.xy*.0004;
          vec3 color=vec3(texture2D(tRefraction,clamp(ruv+chroma,.002,.998)).r,texture2D(tRefraction,ruv).g,texture2D(tRefraction,clamp(ruv-chroma,.002,.998)).b);
          vec3 video=movie((screen-.5)*.5+.5-ripple.xy*.02);
          color+=video*.065;
          color=mix(color,2.*color*video+color*color*(1.-2.*video),.12);
          vec3 opticalNormal=normalize(n+vec3(ripple.xy*.045,0.));
          float f=pow(1.-clamp(abs(dot(opticalNormal,view)),0.,1.),1.5+sin(time*.1)*.3);
          vec2 envUV=normalize(reflect(-view,opticalNormal)).xy*.48+.5;
          // Surface reflection is view-dependent, separate from the background
          // seen through the glass. It remains present as that background leaves
          // the screen during the descent, then fades only with uVisible.
          vec3 reflection=mix(texture2D(tMap,envUV).rgb,movie(envUV*.6+.2),.45);
          float highlight=1.-smoothstep(.01,.095,abs(vLogoUV.y-(.5+.32*sin(time*.25))));
          vec3 rim=neon(f*1.35+vLogoUV.x*.30+time*.018);
          color+=reflection*(.075+f*.30);
          color+=rim*f*mix(.38,.68,highlight);
          color+=pow(f,2.)*mix(.55,1.,uFooter)*mix(video,vec3(.75,.86,1.),.5);
          color+=vec3(.045,.055,.065)*highlight*.16;
          color*=uVisible;
          gl_FragColor=vec4(max(color,vec3(0.)),1.);
          #include <colorspace_fragment>
        }`,
    });
  }
  bind(texture:THREE.Texture,resolution:THREE.Vector2,poster:THREE.Texture,video:THREE.Texture){const u=this.material.uniforms;u.tRefraction.value=texture;u.resolution.value=resolution;u.tPoster.value=poster;u.tVideo.value=video;}
  update(time:number,presence:number,footer:boolean,videoBlend:number){const u=this.material.uniforms;u.time.value=time;u.uVisible.value=presence;u.uFooter.value=footer?1:0;u.uVideoBlend.value=videoBlend;}
  dispose(){this.normal.dispose();this.matcap.dispose();this.material.dispose();}
}
