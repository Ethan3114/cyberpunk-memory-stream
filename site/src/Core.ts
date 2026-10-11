import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { asset } from './story';
import { createReferenceFBR } from './ReferenceFBR';

type MeshData = { attributes: Record<string, { itemSize: number; array: number[] }>; index: number[] };

/** The reference mesh is data from the published site archive, not executable code. */
export async function createCore() {
  const response = await fetch(asset('models/spine-reference.json'));
  if (!response.ok) throw new Error('Core mesh unavailable');
  const data: MeshData = await response.json();
  const vertebra = new THREE.BufferGeometry();
  for (const [name, attribute] of Object.entries(data.attributes)) {
    vertebra.setAttribute(name, new THREE.Float32BufferAttribute(attribute.array, attribute.itemSize));
  }
  vertebra.setIndex(data.index); vertebra.computeBoundingSphere();
  const group = new THREE.Group();
  const fbr=await createReferenceFBR();
  const metal=fbr.material;
  const silver = new THREE.MeshStandardMaterial({ color: 0x90a4ad, metalness: .86, roughness: .32, envMapIntensity: .65 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x101b21, metalness: .75, roughness: .42 });
  const light = new THREE.MeshStandardMaterial({ color: 0x6ae7f4, emissive: 0x37c7df, emissiveIntensity: 1.65 });
  const scratch = document.createElement('canvas'); scratch.width = scratch.height = 256;
  const ctx = scratch.getContext('2d')!; ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, 256, 256);
  let seed = 2077;
  const random = () => { seed = seed * 16807 % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 480; i++) {
    const x = random() * 256, y = random() * 256;
    ctx.strokeStyle = `rgba(${i % 2 ? '240,240,240' : '20,20,20'},.17)`;
    ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 3 + random() * 18, y + random() * 2); ctx.stroke();
  }
  const bump = new THREE.CanvasTexture(scratch); bump.wrapS = bump.wrapT = THREE.RepeatWrapping; bump.repeat.set(3, 3);
  silver.bumpMap = bump; silver.bumpScale = .02;
  // Repeat the sculpted mesh with the source's 0.65 spacing and 0.4-radian twist.
  const body = new THREE.InstancedMesh(vertebra, metal, 40);
  const transform = new THREE.Object3D();
  for (let i = 0; i < 40; i++) {
    transform.position.set(0, 7.4 - i * .65, 0);
    transform.rotation.set(0, i * .4, 0); transform.scale.setScalar(3.5);
    transform.updateMatrix(); body.setMatrixAt(i, transform.matrix);
  }
  body.computeBoundingSphere(); group.add(body);
  const ring = new THREE.TorusGeometry(.24, .034, 8, 32);
  const socket = new THREE.CylinderGeometry(.115, .145, .22, 12);
  const bolt = new THREE.CylinderGeometry(.036, .036, .1, 6);
  const diode = new THREE.SphereGeometry(.048, 10, 8);
  const collar = new THREE.TorusGeometry(.24, .055, 8, 28);
  const batches = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const add = (geo: THREE.BufferGeometry, material: THREE.Material, object: THREE.Object3D) => {
    object.updateMatrixWorld(true);
    const parts = batches.get(material) ?? [];
    parts.push(geo.clone().applyMatrix4(object.matrixWorld)); batches.set(material, parts);
  };
  for (let i = 0; i < 40; i++) {
    const segment = new THREE.Group(); segment.position.y = 7.4 - i * .65; segment.rotation.y = i * .4;
    const c = new THREE.Mesh(collar, dark); c.rotation.x = Math.PI / 2; c.position.y = -.29; segment.add(c);
    for (const side of [-1, 1]) {
      const r = new THREE.Mesh(ring, silver); r.position.set(side * .52, .1, .22); r.rotation.y = side * .25; segment.add(r);
      const s = new THREE.Mesh(socket, dark); s.position.set(side * .65, -.06, .36); s.rotation.x = Math.PI / 2; segment.add(s);
      const d = new THREE.Mesh(diode, light); d.position.set(side * .65, -.06, .485); segment.add(d);
      for (let j = 0; j < 3; j++) {
        const b = new THREE.Mesh(bolt, silver); b.position.set(side * (.36 + j * .12), .16, .41); b.rotation.x = Math.PI / 2; segment.add(b);
      }
    }
    segment.updateMatrixWorld(true);
    segment.traverse(object => { if (object instanceof THREE.Mesh) add(object.geometry, object.material as THREE.Material, object); });
  }
  for (let j = 0; j < 7; j++) {
    const angle = j / 7 * Math.PI * 2;
    const curve = new THREE.CatmullRomCurve3(Array.from({ length: 100 }, (_, i) => {
      const a = angle + i * .075;
      const radius = .38 + Math.sin(i * .2 + j) * .035;
      return new THREE.Vector3(Math.cos(a) * radius, 8 - i * .27, Math.sin(a) * radius);
    }));
    const geo = new THREE.TubeGeometry(curve, 160, j === 2 ? .016 : .027, 6, false);
    add(geo, j === 2 ? light : dark, new THREE.Object3D()); geo.dispose();
  }
  const geometries = [vertebra];
  for (const [material, parts] of batches) {
    const geo = mergeGeometries(parts)!; group.add(new THREE.Mesh(geo, material)); geometries.push(geo);
    parts.forEach(part => part.dispose());
  }
  [ring, socket, bolt, diode, collar].forEach(geo => geo.dispose());
  group.updateMatrixWorld(true);
  let radius=0,minY=Infinity,maxY=-Infinity;const vertex=new THREE.Vector3(),instance=new THREE.Matrix4();
  group.traverse(object=>{
    if(!(object instanceof THREE.Mesh))return;
    const positions=object.geometry.attributes.position;
    const instances=object instanceof THREE.InstancedMesh?object.count:1;
    for(let i=0;i<instances;i++){
      if(object instanceof THREE.InstancedMesh)object.getMatrixAt(i,instance);else instance.identity();
      for(let j=0;j<positions.count;j++){vertex.fromBufferAttribute(positions,j).applyMatrix4(instance).applyMatrix4(object.matrixWorld);radius=Math.max(radius,Math.hypot(vertex.x,vertex.z));minY=Math.min(minY,vertex.y);maxY=Math.max(maxY,vertex.y);}
    }
  });
  return { group, geometries, radius, height:new THREE.Vector2(minY,maxY), materials: [metal, silver, dark, light], textures: [bump,...fbr.maps] };
}
