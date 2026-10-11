import * as THREE from 'three';
import { referenceShaders as S } from './ReferenceShaders';
import { asset } from './story';

/** Source getFBR and SpineShader, with Three.js instancing and fade uniforms. */
export async function createReferenceFBR(){
  const names=['basecolor.png','mro.png','normal.png','matcap.jpg'];
  const maps=await Promise.all(names.map(n=>new THREE.TextureLoader().loadAsync(asset('fbr/'+n))));
  maps.forEach(t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;});
  maps[0].colorSpace=maps[3].colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.ShaderMaterial({
    uniforms:{tBaseColor:{value:maps[0]},tMRO:{value:maps[1]},tNormal:{value:maps[2]},tMatcap:{value:maps[3]},uNormalStrength:{value:.19},uColor:{value:new THREE.Color('#d1eeff')},uLight:{value:new THREE.Vector4(1,1,1,.4)},tRefraction:{value:maps[3]},uReflection:{value:new THREE.Vector2(2.7,.85)},resolution:{value:new THREE.Vector2(1,1)},uOpacity:{value:1}},
    vertexShader:`varying vec3 vNormal,vWorldNormal,vPos,vEyePos,vMPos;varying vec2 vUv;varying vec4 vWorldPos;
    void main(){vec3 p=position,n=normal;
    #ifdef USE_INSTANCING
      p=(instanceMatrix*vec4(p,1.)).xyz;n=mat3(instanceMatrix)*n;
    #endif
    vNormal=normalMatrix*n;vWorldNormal=normalize(mat3(modelMatrix)*n);vUv=uv;vPos=p;vWorldPos=modelMatrix*vec4(p,1.);vMPos=vWorldPos.xyz;vEyePos=(modelViewMatrix*vec4(p,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader:`uniform sampler2D tBaseColor,tRefraction;uniform vec2 uReflection,resolution;uniform float uOpacity;varying vec4 vWorldPos;
    ${S['fbr.fs']}
    void main(){vec2 uv=vUv;uv.x+=vWorldPos.x*.2;vec3 baseColor=texture2D(tBaseColor,uv).rgb;vec3 color=getFBR(baseColor,uv);vec3 normal=unpackNormalFBR(vEyePos,vWorldNormal,tNormal,uNormalStrength,1.,vUv);normal.y-=vWorldPos.y*.02;vec2 screenuv=gl_FragCoord.xy/resolution+normal.xy*.1*uReflection.x;color+=texture2D(tRefraction,screenuv).rgb*uReflection.y;gl_FragColor=vec4(color,uOpacity);
    #include <colorspace_fragment>
    }`,
  });
  return{material,maps};
}
