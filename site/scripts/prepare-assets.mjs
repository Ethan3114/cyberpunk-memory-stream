import sharp from 'sharp';
import {mkdir,copyFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const output=path.join(root,'site/public/assets');
await mkdir(path.join(output,'fonts'),{recursive:true});
await mkdir(path.join(output,'models'),{recursive:true});
const images=[
 ['city.webp','materials/supplemental/provenance/CITY_OFFICIAL_BLOOD_IN_RAIN_3840.jpg',2560,88],
 ['v.webp','materials/supplemental/provenance/V_OFFICIAL_FEMALE_HERO_3840.png',1920,88],
 ['jackie.webp','materials/images/characters/CHARACTER_02_WELLES_b_eating.jpg',1920,88],
 ['david.webp','materials/images/characters/CHARACTER_03_DAVID_a_early.jpg',1920,90],
 ['lucy.webp','materials/supplemental/lucy-music/edgerunners-official-trailer2.gif',1920,90],
 ['core.webp','materials/supplemental/core/core-main-v2.png',724,92],
];
await Promise.all(images.map(async([name,source,width,quality])=>{
 await sharp(path.join(root,source),{page:name==='lucy.webp'?15:0,pages:1}).resize({width,withoutEnlargement:true}).webp({quality}).toFile(path.join(output,name));
}));
for(const [source,target] of [
 ['Rajdhani-500-latin.woff2','rajdhani-500.woff2'],['Rajdhani-600-latin.woff2','rajdhani-600.woff2'],['Rajdhani-700-latin.woff2','rajdhani-700.woff2'],['Inter-400-500-latin.woff2','inter.woff2'],['OFL-Rajdhani.txt','OFL-Rajdhani.txt'],['OFL-Inter.txt','OFL-Inter.txt'],
])await copyFile(path.join(root,'materials/fonts',source),path.join(output,'fonts',target));
await copyFile(path.join(root,'materials/supplemental/requested-music/i-really-want-to-stay-at-your-house.m4a'),path.join(output,'music.m4a'));
await copyFile(path.join(root,'materials/supplemental/brand/cyberpunk-2077-official.png'),path.join(output,'cyberpunk-2077.png'));
await copyFile(path.join(root,'materials/supplemental/brand/cdpr-official.svg'),path.join(output,'cdpr.svg'));
await copyFile(path.join(root,'materials/supplemental/brand/favicon-official.png'),path.join(root,'site/public/favicon.png'));
await copyFile(path.join(root,'materials/supplemental/core/reference/spine-decoded.json'),path.join(output,'models/spine-reference.json'));
await writeFile(path.join(output,'asset-manifest.json'),JSON.stringify({
 images:images.map(([file,source])=>({file,source,processing:file==='lucy.webp'?'Frame 15 of official trailer GIF; WebP encoding':'Resize and WebP encoding; source composition retained'})),
 music:{file:'music.m4a',title:'I Really Want to Stay at Your House',artist:'Rosa Walton & Hallie Coggins',source:'https://www.youtube.com/watch?v=gzbLODUb1sA'},
 cityDepth:'Approximate hand-authored depth field in shader; not extracted geometry',
 core:{file:'models/spine-reference.json',source:'https://github.com/Abdulhadi446/activetheory.net/blob/37ceb0fbdeca1f12d129256629b05fab96bcebe1/assets/geometry/spine/spine.bin',processing:'Draco decoded; 40 instanced segments, 0.65 spacing, 0.4-radian twist; local metal materials and procedural mechanical attachments',vertices:2375,trianglesPerSegment:4244,status:'Published-site archive reference mesh; not an open-source Sandevistan model',fallback:'core.webp: separately generated 2D fallback'},
 brand:[{file:'cyberpunk-2077.png',source:'https://www.cyberpunk.net/build/images/logo-en-ed943f1c.png',dimensions:[640,160],processing:'Official complete logo retained; CSS slice animation'},{file:'cdpr.svg',source:'https://www.cdprojekt.com/en/wp-content/themes/cdprojekt/assets/images/cd_projekt_red_logo.svg',processing:'Official SVG retained; CSS monochrome white on dark background'}],
},null,2)+'\n');
console.log('Prepared original-source visual assets, local fonts and requested music.');
await import('./prepare-round3.mjs');
