import * as THREE from 'three';
import { type Media } from './Media';
import { openingCut } from './SpaceTimeline';

/** One shared official video feeds the opening backdrop, particles and logo reflection.
 * The reference curves/masks its HomeVideo plane; this adaptation adds an explicit blur.
 */
export class OpeningBackdrop {
  mesh:THREE.Mesh<THREE.PlaneGeometry,THREE.ShaderMaterial>;
  constructor(poster:THREE.Texture,media:Media){
    const blur=import.meta.env.DEV&&new URLSearchParams(location.search).get('openingBlur')==='off'?0:.022;
    this.mesh=new THREE.Mesh(new THREE.PlaneGeometry(36,20.25,48,24),new THREE.ShaderMaterial({
      uniforms:{tPoster:{value:poster},tVideo:{value:media.texture},uBlend:{value:0},uOpacity:{value:1},uBlur:{value:blur}},
      transparent:true,depthTest:true,depthWrite:false,
      // HomeVideoShader bends the plane back at its center. Scale its curve to
      // our world, leaving the geometry's outer edge behind a soft aperture.
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;vec3 pos=position;pos.z-=6.4*(-.5+1.-smoothstep(0.,1.,abs(uv.x-.5)));gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.);}',
      fragmentShader:`uniform sampler2D tPoster,tVideo;uniform float uBlend,uOpacity,uBlur;varying vec2 vUv;
        vec3 sampleMedia(vec2 uv){vec3 col=texture2D(tPoster,clamp(uv,.001,.999)).rgb;
          if(uBlend>.001){vec3 movie=texture2D(tVideo,clamp(uv,.001,.999)).rgb;
            movie=mix(movie/12.92,pow((movie+.055)/1.055,vec3(2.4)),step(vec3(.04045),movie));
            col=mix(col,movie,uBlend);
          }return col;}
        void main(){vec3 color=sampleMedia(vUv)*.16;
          for(int i=0;i<12;i++){float angle=float(i)*2.399963;float radius=sqrt((float(i)+.5)/12.);color+=sampleMedia(vUv+vec2(cos(angle),sin(angle)*1.7778)*radius*uBlur)*.07;}
          float aperture=1.-smoothstep(.05,.5,length(vUv-.5));
          color*=.055+.17*aperture;
          color=mix(color,vec3(.025,.035,.075),.18);
          // Unlike an intensity-only vignette, alpha reaches zero on every
          // boundary, so neither the tinted floor nor the dark edge can form a box.
          gl_FragColor=vec4(color*aperture,uOpacity*aperture);
          #include <colorspace_fragment>
        }`,
    }));
    this.mesh.position.z=-16;this.mesh.renderOrder=-10;
  }
  resize(aspect:number){this.mesh.scale.set(Math.max(1,aspect/(16/9)),Math.max(1,(16/9)/aspect),1);}
  update(p:number,blend:number){const footer=p>=.87,alpha=p<openingCut.end?1:footer?.5:0;this.mesh.rotation.z=footer?Math.PI:0;this.mesh.visible=alpha>.001;this.mesh.material.uniforms.uOpacity.value=alpha;this.mesh.material.uniforms.uBlend.value=blend;}
  dispose(){this.mesh.geometry.dispose();this.mesh.material.dispose();}
}
