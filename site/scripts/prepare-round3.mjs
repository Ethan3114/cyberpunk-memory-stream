import {copyFile,mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const input=path.join(root,'materials/supplemental/round-3');
const output=path.join(root,'site/public/assets');
await mkdir(path.join(output,'media'),{recursive:true});
await mkdir(path.join(output,'models'),{recursive:true});
const selection=[];
for(const id of ['v','jackie','david','lucy']){
 const role=id==='lucy'?'alternate':'main';
 for(const ext of ['mp4','webp']){
  const source=`characters/${id}/${role}.${ext}`,file=ext==='webp'?`${id}.webp`:`media/${id}.mp4`;
  await copyFile(path.join(input,source),path.join(output,file));selection.push({file,source});
 }
}
for(let i=1;i<=4;i++){
 const id=String(i).padStart(2,'0');
 await copyFile(path.join(input,`scenes/${id}/main.webp`),path.join(output,`media/scene-${id}.webp`));
 selection.push({file:`media/scene-${id}.webp`,source:`scenes/${id}/main.webp`});
 if(i>1){await copyFile(path.join(input,`scenes/${id}/main.mp4`),path.join(output,`media/scene-${id}.mp4`));selection.push({file:`media/scene-${id}.mp4`,source:`scenes/${id}/main.mp4`});}
}
await copyFile(path.join(input,'opening/cyberpunk-wordmark.glb'),path.join(output,'models/cyberpunk-wordmark.glb'));
const referenceParticles=path.join(root,'materials/supplemental/reference-particles');
await copyFile(path.join(referenceParticles,'flower-reference.bin'),path.join(output,'models/flower-reference.bin'));
await copyFile(path.join(referenceParticles,'forest-reference.bin'),path.join(output,'models/forest-reference.bin'));
await copyFile(path.join(referenceParticles,'particle-matcap.png'),path.join(output,'particle-matcap.png'));
const referenceFbr=path.join(root,'materials/supplemental/reference-fbr');
await mkdir(path.join(output,'fbr'),{recursive:true});
for(const name of ['basecolor.png','mro.png','normal.png','matcap.jpg'])await copyFile(path.join(referenceFbr,name),path.join(output,'fbr',name));
await mkdir(path.join(output,'glass'),{recursive:true});
await copyFile(path.join(root,'materials/supplemental/reference-glass/waternormals.jpg'),path.join(output,'glass/waternormals.jpg'));
const manifest=JSON.parse(await readFile(path.join(output,'asset-manifest.json'),'utf8'));
for(const item of manifest.images){const match=selection.find(s=>s.file===item.file);if(match){item.source=`materials/supplemental/round-3/${match.source}`;item.processing='Round-3 video poster, retained as static fallback and pre-playback image';}}
manifest.cityDepth='Official environment media on moving 3D planes; no reconstructed street geometry or fabricated depth map';
manifest.brand[0].processing='Official complete logo for semantic/static fallback; visible WebGL opening uses the user-provided GLB';
manifest.round3={selection,model:'models/cyberpunk-wordmark.glb',sourceManifest:'materials/supplemental/round-3/manifest.json',notes:['Scene 01 is an official still.','V is an official motion poster, not engine footage.','Lucy alternate selected for identifiable face and netrunner shots.','Montages are not seamless loops.'],particles:'Project Three.js GPU logo halo; 65536 published reference flower_spine positions/colors plus public matcap; normal-offset particle reflection adapted from SpineShader. No Hydra runtime or AT logo.'};
manifest.referenceParticles={cloud:{file:'models/flower-reference.bin',source:'https://activetheory.net/assets/geometry/particles/flower_spine-256.bin',processing:'Draco decoded to Float32: 65536 xyz positions followed by 65536 rgb colors, retained as data; transformed by the project'},matcap:{file:'particle-matcap.png',source:'https://activetheory.net/assets/images/particle/matcap3.png'},shaderReference:'https://activetheory.net/assets/shaders/compiled.vs',runtime:'Project Three.js implementation; no archived application JS executed'};
manifest.referenceParticles.openingCloud={file:'models/forest-reference.bin',source:'https://activetheory.net/assets/geometry/particles/forest-256.bin',processing:'65536 decoded xyz/rgb points; source color used as luminance, project neon palette and shared official video supply light'};
manifest.opening={video:'media/scene-02.mp4',poster:'media/scene-02.webp',sharing:'One muted local video element is shared by the opening backdrop, particle illumination, and later scene 02',blur:'13-tap spatial blur in the project backdrop shader; first-act video pauses after exit',reference:'ParticleTestShader / HomeVideoShader / HomeLogoShader; published ParticleTest/Fluid, VolumetricLight, UnrealBloom, HydraLensStreak and GlobalComposite ported to Three.js; branded content and composition adapted'};
manifest.round3.particles='Opening: 65536 decoded forest points, shared official video illumination, source ParticleTest bubble shading, full vertex shape rules, pixel-unit GPU fluid/dye mask and first-order target relaxation. Second act: 65536 flower_spine points with spatial neon palette and native getFBR with original base/MRO/normal/matcap maps and particle reflection. Published post-processing shaders hosted in Three.js. No Hydra runtime.';
manifest.referenceFbr={files:['fbr/basecolor.png','fbr/mro.png','fbr/normal.png','fbr/matcap.jpg'],source:'https://activetheory.net/assets/shaders/compiled.vs',textures:['assets/images/pbr/alien_cracked_2_basecolor.png','assets/images/pbr/cliffs_MRO.png','assets/images/pbr/damaged_road_normal.png','assets/images/room/matcap-test.jpg'],shader:'Source getFBR / SpineShader with Three.js instancing and fade adaptations'};
manifest.glass={normal:'glass/waternormals.jpg',source:'https://activetheory.net/assets/images/tree_room/waternormals.jpg',shader:'Published WorkItemShader adapted to one closed .30-deep rounded slab; optical background refraction and interior video'};
manifest.opening.stationary='Forest transform, video plane and camera fixed during opening; scroll only rotates/lowers wordmark';
manifest.opening.transition='Published FXScrollTransition between two independently rendered targets, .11-.20 timeline';
await writeFile(path.join(output,'asset-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Prepared round-3 model, four scenes and four character videos.');
