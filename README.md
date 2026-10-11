# Cyberpunk 2077 — Memory Stream

Desktop cinematic single-page tribute: a user-provided rotating 3D Cyberpunk wordmark, four official game environments, a sculpted spine, and four radial video screens in the order **female V → Jackie Welles → David → Lucy**. English copy. No second pages. The ending returns to an inverted particle/video space and exits into near-empty darkness.

## Run locally

Node.js 24.12+ or 26+, npm.

```sh
cd site
npm ci
npm run dev -- --port 5190
```

Open http://127.0.0.1:5190/. Scroll to rotate the particle forest while the logo and camera descend together through the opening space, reveal the environments through a diagonal refractive cut, and orbit the spine. The pointer pushes a real-time particle velocity field and changes camera/glass response. Controls appear after the opening. SOUND directly plays **I Really Want to Stay at Your House**, initially paused. REPLAY returns through the same timeline without changing the music choice.

```sh
npm run build
npm run preview
```

The production output is `site/dist/`. Assets and fonts are local; the page needs no runtime API or external media player.
Raw round-3 source videos (about 4.1GB) and processing scratch files are kept locally and excluded from Git. The served asset directory is about 42MB; regeneration uses the processed selections, not the raw masters.

## GitHub Pages

`.github/workflows/pages.yml` builds and deploys on pushes to `main`, with a manual Actions run also available. After publishing this repository, choose **GitHub Actions** in Settings → Pages, then run **Deploy Cyberpunk to GitHub Pages**. The Pages action supplies the repository base path automatically, supporting both `owner.github.io` and `owner.github.io/repository/` URLs.

For a local repository-path build:

```sh
cd site
VITE_BASE_PATH=/cyberpunk-memory-stream/ npm run build
```

The public repository is [Ethan3114/cyberpunk-memory-stream](https://github.com/Ethan3114/cyberpunk-memory-stream). The live GitHub Pages site is [https://ethan3114.github.io/cyberpunk-memory-stream/](https://ethan3114.github.io/cyberpunk-memory-stream/). Public video, audio, scroll and replay were verified on 2026-10-11.

## Structure

- `site/src/App.tsx`: native scroll, pointer response, character screens, audio, replay.
- `site/src/Scene.ts`: shared 3D camera, lights, timeline and glass background sampling.
- `site/src/Journey.ts`: user GLB, four official environment planes, scroll-controlled opening.
- `site/src/Panels.ts`: closed rounded glass volumes, published WorkItem refraction shading, radial video screens and spatial captions.
- `site/src/Media.ts`: lazy muted videos, 300ms focus delay and 500ms image/video blending.
- `site/src/FlowField.ts`: 128×128 GPU velocity field, vorticity and 20 pressure iterations.
- `site/src/Particles.ts`: 65536 decoded forest points, source ParticleTest shape/sprite shader, pixel-unit fluid + dye mask, and first-order relaxation.
- `site/src/OpeningBackdrop.ts`: shared official opening video, 13-tap blur and vignette.
- `site/src/ParticleBanks.ts`: 65536 decoded reference points in two fixed world-space banks, with matcap sphere shading and spine/glass/media exclusion volumes.
- `site/src/Core.ts`: sculpted reference mesh instancing and local mechanical attachments.
- `site/src/ReferenceFBR.ts`: original getFBR and four source maps for the spine body.
- `site/src/ReferencePostFX.ts`: volumetric mask/blur/radial sampling, 3-mip UnrealBloom, 8-level HydraLensStreak GlobalComposite, and a two-scene FXScrollTransition cut.
- `site/src/ReferenceShaders.ts`: expanded published GLSL with desktop branches selected.
- `site/src/story.ts`: character content and the 2D fallback trajectory.
- `qa/space-v11.md`: thin glass, floating lower-left captions, refracting cuts, and opposing Home/Footer particle timelines.
- `site/src/SpaceTimeline.ts`: forward opening and reversed ending choreography.
- `qa/ending-v10.md`: previous ending silhouette protection and release verification.
- `site/public/assets/`: ready-to-serve visuals, fonts, and music.
- `site/public/assets/asset-manifest.json`: material origins and processing.
- `materials/`: local collected assets and research; the public repository includes provenance README files, while the prepared runtime assets are under `site/public/assets/`.
- `qa/opening-space-v9.md`: current opening ground, rotation, camera and browser verification; `qa/spatial-glass-v8.md` records glass and collision changes.

The environments use official images/videos on moving 3D planes; their buildings have not been reconstructed as freely navigable geometry. The opening uses the user's 460-triangle wordmark, with its original thin extrusion. The spine uses a decoded published-site archive mesh repeated 40 times, with local mechanical details. Screens and camera share one 3D scene: radius 3.8, 50° between characters, 150° total orbit.

The opening uses the reference forest point cloud and the published ParticleTest shader, with the project's cyan/blue/violet/magenta palette and world scale. Its mouse response now follows the source pixel-unit fluid field, 512² dye mask and first-order target relaxation; the project spring, global curl and depth-softened sprite blur have been removed. The same official scene-02 video feeds the blurred backdrop, particle surfaces and wordmark reflection. Published VolumetricLight, UnrealBloom, HydraLensStreak and GlobalComposite shaders now run in a Three.js host. The spine body uses source getFBR / SpineShader and original basecolor, MRO, normal and matcap maps; local attachments retain their standard materials. The wordmark still uses its own metallic material and sampled reflection. This is an algorithm/pass port with branded composition and color adaptations, not the original Hydra runtime or camera timeline. GPU-unavailable and reduced-motion particles use a static cloud. Videos pause after exit and when hidden. The opening cloud stays at a fixed height and rotates 190° with scrolling; the camera and wordmark descend together by 1.8 world units. The video plane stays fixed in world space. Original low forest samples form an extended ground footprint; floor attenuation is separated from canopy attenuation so approaching the ground does not remove nearby particles. Published FXScrollTransition reveals the first environment using two separately rendered scenes and a water-normal distorted diagonal edge. Video screens now use WorkItemShader on 0.30-thick closed rounded volumes, with adapted media UVs and a protected clear video aperture. Particle centres are excluded from the actual spine envelope and glass volumes; foreground points are also cleared from the media aperture. The ending additionally clears camera rays through the spine silhouette and lowers screen-sampled particle reflection from .85 to .22, preserving the metal outline. The ending unfolds along polar paths around the spine. See `qa/opening-space-v9.md` and `qa/spatial-glass-v8.md` for current verification and `qa/reference-port.md` for earlier algorithm scope and comparisons. Earlier QA documents record superseded iterations.

Scene 01 is an official rain still. Female V uses an official motion poster rather than engine footage. The other videos include hard-cut montages and are not seamless loops. Lucy uses the alternate clip for recognizable face/netrunner shots. These limitations are recorded rather than disguised with generated media.

Development review anchors: `?at=0` logo; `.07` side view; `.20/.29/.38/.47` environments; `.634/.718/.802/.886` characters; `1` ending. `?motion=reduce`, `?particles=cpu`, `?fx=off` (or `bloom,streak,volume`) and `?probe=1` are development-only. Probe reads GPU data for verification and must not be used for performance measurements. Review parameters do not freeze production builds. `?webgl=off` previews the static fallback.

## Assets

Ready-to-serve files are already included; asset regeneration is optional:

```sh
cd site
node scripts/prepare-assets.mjs
```

The repository already includes the processed runtime assets needed for `npm ci` and `npm run build`. Regeneration requires the locally collected source materials. This prepares the existing font/core/music assets, then applies `scripts/prepare-round3.mjs` to copy the selected GLB, official posters and seven muted videos. It does not redraw the environments or characters. The generated fallback core is documented separately. Font license texts are stored with the fonts. Application code is MIT licensed; the MIT license does not relicense third-party characters, images or music.
