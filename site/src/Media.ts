import * as THREE from 'three';
import { asset, clamp } from './story';

/** Lazy, muted local video. Loading failures retain the poster; hidden media never plays. */
export class Media {
  video: HTMLVideoElement;
  texture: THREE.VideoTexture;
  blend = 0;
  private entered = -1;
  private active = false;
  private pending = false;
  private failed = false;
  private loaded = false;
  private disposed = false;
  constructor(private file: string, host: HTMLElement) {
    this.video = document.createElement('video');
    this.video.muted = true; this.video.defaultMuted = true; this.video.loop = true;
    this.video.playsInline = true; this.video.preload = 'none';
    this.video.dataset.media = file; this.video.dataset.state = 'poster';
    this.video.setAttribute('aria-hidden', 'true'); host.append(this.video);
    this.texture = new THREE.VideoTexture(this.video); this.texture.colorSpace = THREE.SRGBColorSpace;
    this.video.addEventListener('error', this.onError);
  }
  private onError = () => { this.failed = true; this.video.dataset.state = 'failed-poster'; };
  update(active: boolean, time: number, dt: number, reduced: boolean) {
    if (this.disposed) return;
    active = active && !reduced && !document.hidden && !this.failed;
    if (active !== this.active) {
      this.active = active; this.entered = active ? time : -1;
      if (!active) { this.video.pause(); this.video.dataset.state = this.failed ? 'failed-poster' : 'paused'; }
    }
    if (active && time - this.entered >= .3 && this.video.paused && !this.pending) {
      if (!this.loaded) { this.video.src = asset(this.file); this.loaded = true; }
      this.pending = true; this.video.dataset.state = 'loading';
      this.video.play().then(() => {
        if (!this.active || this.disposed) this.video.pause();
        else this.video.dataset.state = 'playing';
      }).catch(() => { if (this.active && !this.disposed) this.onError(); }).finally(() => { this.pending = false; });
    }
    const playing = active && !this.video.paused && this.video.readyState >= 2;
    // Five hundred millisecond sine blend, after the stable-focus delay.
    this.blend = clamp(this.blend + (playing ? 1 : -1) * dt / .5);
    return Math.sin(this.blend * Math.PI / 2);
  }
  pause() { this.active = false; this.entered = -1; this.video.pause(); this.video.dataset.state = 'paused'; }
  dispose() {
    this.disposed = true; this.pause(); this.video.removeEventListener('error', this.onError);
    this.video.removeAttribute('src'); this.video.load(); this.texture.dispose(); this.video.remove();
  }
}
