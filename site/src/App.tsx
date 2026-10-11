import { useEffect, useRef, useState } from 'react';
import { World } from './Scene';
import { asset, characters, clamp, coreProgress, mix, screenPose, smooth } from './story';

export function App() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const mediaHost = useRef<HTMLDivElement>(null);
  const environments = useRef<(HTMLDivElement|null)[]>([]);
  const screens = useRef<(HTMLDivElement | null)[]>([]);
  const audio = useRef<HTMLAudioElement>(null);
  const replay = useRef<{ from: number; start: number } | null>(null);
  const [sound, setSound] = useState(false);
  const [soundError, setSoundError] = useState(false);
  const [chapter, setChapter] = useState('');
  const [ready, setReady] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    let alive = true;
    const initialAssets = Promise.all([document.fonts.ready, ...['cyberpunk-2077.png', ...characters.map(c=>c.image)].map(name => {
      const image = new Image(); image.src = asset(name); return image.decode().catch(() => undefined);
    })]);
    let world: World | null = null;
    const useFallback = (error?:unknown) => { if(import.meta.env.DEV&&error){console.error(error);canvas.current!.dataset.fallbackReason=String(error);}world?.dispose(); world = null; if (alive) setFallback(true); };
    try {
      if (new URLSearchParams(window.location.search).get('webgl') === 'off') throw new Error('Fallback preview');
      world = new World(canvas.current!,mediaHost.current!);
    } catch(error) { useFallback(error); }
    Promise.all([initialAssets, world?.ready ?? Promise.resolve()]).then(() => {
      if (alive) setReady(true);
    }).catch((error) => {
      useFallback(error);
      initialAssets.then(() => { if (alive) setReady(true); });
    });
    const onContextLost = (event: Event) => { event.preventDefault(); useFallback(); };
    const canvasElement = canvas.current!; canvasElement.addEventListener('webglcontextlost', onContextLost);
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const qaReduced = import.meta.env.DEV && new URLSearchParams(window.location.search).get('motion') === 'reduce';
    let reduced = media.matches || qaReduced;
    const onMotion = () => { reduced = media.matches || qaReduced; };
    media.addEventListener('change', onMotion);
    let width = window.innerWidth, height = window.innerHeight;
    let pointerX = 0, pointerY = 0, x = 0, y = 0, p = 0, last = performance.now();
    let label = '', wasEnding = false, raf = 0;
    const visibility = () => { if(document.hidden)world?.pause(); };
    const resize = () => { width = window.innerWidth; height = window.innerHeight; world?.resize(width, height); };
    const pointer = (event: PointerEvent) => { pointerX = event.clientX / width * 2 - 1; pointerY = event.clientY / height * 2 - 1; };
    const leave = () => { pointerX = 0; pointerY = 0; };
    const stopReplay = () => { replay.current = null; };
    const key = (event: KeyboardEvent) => { if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) stopReplay(); };
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, .06); last = now;
      if(document.hidden){raf=requestAnimationFrame(frame);return;}
      if (replay.current) {
        const t = clamp((now - replay.current.start) / (reduced ? 1 : 1600));
        window.scrollTo(0, replay.current.from * (1 - (t * t * (3 - 2 * t))));
        if (t >= 1) replay.current = null;
      }
      const target = scenePosition !== null && Number.isFinite(Number(scenePosition))
        ? clamp(Number(scenePosition))
        : clamp(window.scrollY / Math.max(1, document.documentElement.scrollHeight - height));
      const alpha = reduced ? 1 : 1 - Math.exp(-dt / .12);
      p = mix(p, target, alpha); x = mix(x, pointerX, alpha); y = mix(y, pointerY, alpha);
      const q=coreProgress(p);
      const node = stage.current!;
      node.style.setProperty('--hero-opacity', String(1 - smooth(.11, .18, p)));
      node.style.setProperty('--city-opacity', '0');
      node.style.setProperty('--ui-opacity',String(smooth(.13,.18,p)));
      node.style.setProperty('--city-scale', String(mix(1.055, 1.53, smooth(0, .29, p))));
      node.style.setProperty('--city-x', `${reduced ? 0 : x * -10}px`);
      node.style.setProperty('--city-y', `${reduced ? 0 : y * -10}px`);
      node.style.setProperty('--core-opacity', String(smooth(.205, .315, q)*(1-smooth(.87,.92,p))));
      node.style.setProperty('--core-y', `${mix(32, -32, smooth(.3, .88, q))}%`);
      node.style.setProperty('--core-x', `${reduced ? 0 : x * 16}px`);
      node.style.setProperty('--transition-opacity', '0');
      node.style.setProperty('--end-opacity', String(smooth(.975, .995, p)));
      node.style.setProperty('--progress', String(p));
      node.dataset.progress = p.toFixed(4);
      node.dataset.motion = reduced ? 'reduced' : 'full';
      node.dataset.phase = p<.14?'logo':p<.52?'environments':p<.94?'memories':'ending';
      for(let i=0;i<4;i++){
        const focus=.20+i*.09,enter=i===0?smooth(.12,.19,p):smooth(focus-.085,focus-.012,p),exit=i===3?1-smooth(.49,.57,p):1-smooth(focus+.026,focus+.080,p);
        if(environments.current[i]){environments.current[i]!.style.opacity=String(enter*exit);environments.current[i]!.style.transform=`scale(${mix(1,1.18,smooth(focus-.05,focus+.06,p))})`;}
      }
      node.querySelector('.hero')?.setAttribute('aria-hidden', p > .19 ? 'true' : 'false');
      const activeIndex = Math.min(3, Math.max(0, Math.round((q - .39) / .14)));
      for (let i = 0; i < characters.length; i++) {
        const screen = screens.current[i]; if (!screen) continue;
        if (world) {
          screen.setAttribute('aria-hidden', q < .29 || p >= .92 || i !== activeIndex ? 'true' : 'false');
          continue;
        }
        const pose = screenPose(q, i, width, height);
        screen.style.transform = `translate3d(${pose.x + (reduced ? 0 : x * (pose.active ? 8 : 3))}px,${pose.y + (reduced ? 0 : y * 5)}px,0) translate(-50%,-50%) perspective(1400px) rotateY(${pose.yaw}deg) scale(${pose.scale})`;
        screen.style.opacity = String(pose.opacity);
        screen.style.zIndex = pose.active ? '10' : String(2 + i);
        screen.style.visibility = pose.opacity < .005 ? 'hidden' : 'visible';
        screen.classList.toggle('is-active', pose.active);
        screen.setAttribute('aria-hidden', pose.opacity < .05 ? 'true' : 'false');
      }
      const current = p<.52?'':q<.29?'MEMORY STREAM':q>.91?'END OF TRANSMISSION':characters[Math.min(3,Math.max(0,Math.round((q-.39)/.14)))].name;
      if (current !== label) { label = current; setChapter(current); }
      const nextEnding = p > .975;
      if (nextEnding !== wasEnding) { wasEnding = nextEnding; setEnding(nextEnding); }
      try { world?.render(p, x, y, now / 1000, reduced, dt, pointerX, pointerY); } catch(error) { useFallback(error); }
      raf = requestAnimationFrame(frame);
    };
    // Development-only deterministic scene position for screenshot review.
    const scenePosition = import.meta.env.DEV ? new URLSearchParams(window.location.search).get('at') : null;
    if (scenePosition !== null && Number.isFinite(Number(scenePosition))) {
      p = clamp(Number(scenePosition));
      window.scrollTo(0, p * (document.documentElement.scrollHeight - height));
    }
    raf = requestAnimationFrame(frame);
    window.addEventListener('resize', resize); window.addEventListener('pointermove', pointer);
    document.addEventListener('pointerleave', leave); window.addEventListener('wheel', stopReplay, { passive: true });
    window.addEventListener('keydown', key);
    document.addEventListener('visibilitychange',visibility);
    return () => {
      alive = false; cancelAnimationFrame(raf); world?.dispose();
      window.removeEventListener('resize', resize); window.removeEventListener('pointermove', pointer);
      document.removeEventListener('visibilitychange',visibility);
      document.removeEventListener('pointerleave', leave); window.removeEventListener('wheel', stopReplay); window.removeEventListener('keydown', key);
      media.removeEventListener('change', onMotion); canvasElement.removeEventListener('webglcontextlost', onContextLost);
    };
  }, []);

  async function toggleSound() {
    const player = audio.current!;
    setSoundError(false);
    if (!player.paused) { player.pause(); setSound(false); return; }
    player.volume = .45;
    try { await player.play(); setSound(true); } catch { setSound(false); setSoundError(true); }
  }

  return <>
    <main className={`stage ${ready ? 'is-ready' : ''} ${fallback ? 'is-fallback' : ''}`} ref={stage} tabIndex={-1} aria-label="Cyberpunk 2077 — Memory Stream">
      <div className="fallback-environments" aria-hidden="true">{[1,2,3,4].map((id,i)=><div className="fallback-scene" key={id} ref={node=>{environments.current[i]=node;}}><img src={asset(`media/scene-0${id}.webp`)} alt="" /></div>)}</div>
      <canvas ref={canvas} className="world" aria-hidden="true" />
      <div className="media-host" ref={mediaHost} aria-hidden="true" />
      <div className="fallback-core" aria-hidden="true"><img src={asset('core.webp')} alt="" /></div>
      <div className="atmosphere" aria-hidden="true" />
      <header className="header">
        <a className="wordmark" href="#top" onClick={event => { event.preventDefault(); replay.current = { from: window.scrollY, start: performance.now() }; stage.current?.focus({preventScroll:true}); }} aria-label="Replay experience"><img src={asset('cdpr.svg')} alt="CD PROJEKT RED" /></a>
        <button className={`sound ${sound ? 'is-on' : ''}`} onClick={toggleSound} aria-pressed={sound} title="I Really Want to Stay at Your House — Rosa Walton & Hallie Coggins">
          <span className="sound-bars" aria-hidden="true"><i /><i /><i /><i /></span>
          SOUND {sound ? 'ON' : 'OFF'}
        </button>
        {soundError && <span className="sound-error" role="status">Audio unavailable. Try again.</span>}
      </header>
      <section className="hero" aria-label="Cyberpunk 2077">
        <h1 className="brand-logo" aria-label="Cyberpunk 2077">
          <img className="logo-main" src={asset('cyberpunk-2077.png')} alt="" />
          {[0, 1, 2].map(i => <img className={`logo-slice logo-slice-${i}`} key={i} src={asset('cyberpunk-2077.png')} alt="" aria-hidden="true" />)}
        </h1>
      </section>
      <div className="screens" aria-label="Character memories">
        {characters.map((character, i) => <div className={`screen screen-${character.id}`} key={character.id} ref={node => { screens.current[i] = node; }}>
          <article className="screen-inner" aria-label={character.name}>
            <div className="screen-image"><img src={asset(character.image)} alt={`${character.name}, ${i < 2 ? 'Cyberpunk 2077' : 'Cyberpunk: Edgerunners'}`} draggable="false" /><div className="image-shade" /><span className="screen-corner top-left" /><span className="screen-corner bottom-right" /></div>
            <div className="screen-caption"><div><h2>{character.name}</h2></div><p>{character.line}</p></div>
          </article>
        </div>)}
      </div>
      <div className="ending" aria-hidden={!ending}><button tabIndex={ending ? 0 : -1} onClick={() => { replay.current = { from: window.scrollY, start: performance.now() }; stage.current?.focus({preventScroll:true}); }}>REPLAY <span aria-hidden="true">↗</span></button></div>
      <footer className="footer">
        <span className="scroll-hint" aria-hidden={chapter !== ''}><i aria-hidden="true" /> SCROLL TO ENTER</span>
      </footer>
    </main>
    <div id="top" className="scroll-space" aria-hidden="true" />
    <audio ref={audio} loop preload="none" onPause={() => setSound(false)} onPlaying={() => setSound(true)}><source src={asset('music.m4a')} type="audio/mp4" /></audio>
  </>;
}
