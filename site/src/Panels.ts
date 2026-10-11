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
export type Panel = { group: THREE.Group; image: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>; media: Media; angle: number; position: THREE.Vector3; quaternion: THREE.Quaternion; materials: THREE.Material[]; geometries: THREE.BufferGeometry[]; textures: THREE.Texture[] };

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
    const imageGeo=new RoundedBoxGeometry(3.46,3.46*9/16,.30,4,.075);
    const image=new THREE.Mesh(imageGeo,material);group.add(image);
    const label = document.createElement('canvas'); label.width = 2048; label.height = 256;
    const ctx = label.getContext('2d')!;
    ctx.fillStyle = '#59dce8'; ctx.font = '500 36px Rajdhani'; ctx.fillText(`0${index + 1} /`, 18, 96);
    ctx.fillStyle = '#edf7f9'; ctx.font = '600 104px Rajdhani'; ctx.fillText(character.name, 130, 112);
    ctx.fillStyle = '#b6cbd2'; ctx.font = '400 32px Inter'; ctx.fillText(character.line, 132, 170);
    ctx.strokeStyle = '#385561'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(18, 12); ctx.lineTo(2030, 12); ctx.stroke();
    const labelMap = new THREE.CanvasTexture(label); labelMap.colorSpace = THREE.SRGBColorSpace;
    const labelGeo = new THREE.PlaneGeometry(3.4, 3.4 / 8);
    const labelMaterial = new THREE.MeshBasicMaterial({ map: labelMap, transparent: true, depthWrite: false });
    const caption = new THREE.Mesh(labelGeo, labelMaterial); caption.position.set(0, -1.216, .21); group.add(caption);
    const meta = document.createElement('canvas'); meta.width = 2048; meta.height = 64;
    const metaCtx = meta.getContext('2d')!; metaCtx.fillStyle = '#9cb8c2'; metaCtx.font = '500 28px Rajdhani'; metaCtx.fillText(`MEMORY / 0${index + 1}`, 10, 42);
    metaCtx.fillStyle = '#59dce8'; metaCtx.textAlign = 'right'; metaCtx.fillText(character.tag, 2038, 42);
    const metaMap = new THREE.CanvasTexture(meta); metaMap.colorSpace = THREE.SRGBColorSpace;
    const metaGeo = new THREE.PlaneGeometry(3.4, 3.4 / 32);
    const metaMaterial = new THREE.MeshBasicMaterial({ map: metaMap, transparent: true, depthWrite: false });
    const metaMesh = new THREE.Mesh(metaGeo, metaMaterial); metaMesh.position.set(0, 1.056, .21); group.add(metaMesh);
    const position = orbitPosition(index), quaternion = orbitQuaternion(index);
    group.position.copy(position); group.quaternion.copy(quaternion);
    return { group, image, media, angle: orbitAngle(index), position, quaternion, materials: [material, labelMaterial, metaMaterial], geometries: [imageGeo, labelGeo, metaGeo], textures: [imageMap, labelMap, metaMap,normalMap,environmentMap] };
  }));
}
