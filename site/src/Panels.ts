import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { asset, characters } from './story';
import { Media } from './Media';
import { referenceShaders as S } from './ReferenceShaders';

export const ORBIT_STEP = THREE.MathUtils.degToRad(50);
export const ORBIT_RADIUS = 3.8;
export const CAMERA_RADIUS = 9.6; // Source targets at 2R, plus the camera's local z=2.
export const DESCENT = .12 * characters.length;
export const orbitAngle = (index: number) => Math.PI / 2 - index * ORBIT_STEP;
export const orbitPosition = (index: number) => new THREE.Vector3(Math.cos(orbitAngle(index)) * ORBIT_RADIUS, -index * DESCENT, Math.sin(orbitAngle(index)) * ORBIT_RADIUS);
export const orbitQuaternion = (index: number) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2 - orbitAngle(index));
export type Panel = { group: THREE.Group; caption: THREE.Mesh<THREE.PlaneGeometry,THREE.ShaderMaterial>; image: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>; media: Media; angle: number; position: THREE.Vector3; quaternion: THREE.Quaternion; materials: THREE.Material[]; geometries: THREE.BufferGeometry[]; textures: THREE.Texture[] };

export async function createPanels(host: HTMLElement): Promise<Panel[]> {
  await document.fonts.ready;
  return Promise.all(characters.map(async (character, index) => {
    const group = new THREE.Group();
    const imageMap = await new THREE.TextureLoader().loadAsync(asset(character.image));
    imageMap.colorSpace = THREE.NoColorSpace; imageMap.anisotropy = 4;
    const media = new Media(`media/${character.id}.mp4`,host);
    const [normalMap,environmentMap]=await Promise.all([
      new THREE.TextureLoader().loadAsync(asset('glass/waternormals.jpg')),
      new THREE.TextureLoader().loadAsync(asset('fbr/matcap.jpg')),
    ]);
    normalMap.wrapS=normalMap.wrapT=THREE.RepeatWrapping;
    const clock={value:0},mouse={value:new THREE.Vector2(.5,.5)},viewport={value:new THREE.Vector2(1,1)};
    const material=new THREE.ShaderMaterial({
      uniforms:{tMap:{value:imageMap},tVideo:{value:media.texture},tRefraction:{value:null},tEnv:{value:environmentMap},tNormal:{value:normalMap},uFresnelPow:{value:1.5},uDistortStrength:{value:1},uRefractionRatio:{value:1/1.33},uColor:{value:new THREE.Color('#b4d8ed')},uHover:{value:0},uMouse:mouse,uVideoBlend:{value:0},uScale:{value:new THREE.Vector2(1,1)},uPhone:{value:0},time:clock,uTime:clock,uReduced:{value:0},resolution:viewport,uResolution:viewport},
      vertexShader:S.WorkItemShaderVertex,fragmentShader:S.WorkItemShaderFragment,
      depthTest:true,depthWrite:true,transparent:false,side:THREE.FrontSide,
    });
    // One closed refracting volume; the video is shaded inside it, with no metallic housing.
    const imageGeo=new RoundedBoxGeometry(3.46,3.46*9/16,.15,4,.0375);
    const image=new THREE.Mesh(imageGeo,material);group.add(image);
    // Independent curved UI surface, floating in front of the video at lower left.
    const label = document.createElement('canvas'); label.width = 2048; label.height = 1024;
    const ctx = label.getContext('2d')!;
    ctx.fillStyle = '#edf7f9'; ctx.font = '500 132px Rajdhani';
    ctx.fillText(character.name, 120, 770);
    ctx.fillStyle = '#c5e3ef'; ctx.font = '400 42px Inter'; ctx.fillText(character.line, 124, 860);
    const labelMap = new THREE.CanvasTexture(label); labelMap.colorSpace = THREE.SRGBColorSpace;
    const labelGeo = new THREE.PlaneGeometry(3.46,3.46*9/16,40,20);
    const labelMaterial = new THREE.ShaderMaterial({
      uniforms:{tMap:{value:labelMap},uHover:{value:0},uCamDistance:{value:0}},
      vertexShader:S.WorkItemUIVertex,fragmentShader:S.WorkItemUIFragment,
      transparent:true,depthTest:true,depthWrite:false,
    });
    const caption = new THREE.Mesh(labelGeo,labelMaterial);caption.position.z=.085;group.add(caption);
    const position = orbitPosition(index), quaternion = orbitQuaternion(index);
    group.position.copy(position); group.quaternion.copy(quaternion);
    return { group, caption, image, media, angle: orbitAngle(index), position, quaternion, materials: [material, labelMaterial], geometries: [imageGeo, labelGeo], textures: [imageMap, labelMap,normalMap,environmentMap] };
  }));
}
