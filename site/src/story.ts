export const asset = (path: string) => `${import.meta.env.BASE_URL}assets/${path}`;
// Keep the approved core-camera choreography in its original coordinate system.
export const coreProgress = (progress: number) => clamp((progress - .4) / .6);
export const pageFocus = (focus: number) => .4 + .6 * focus;

export const characters = [
  { id: 'v', name: 'V', line: 'A borrowed future. A life still her own.', tag: 'THE SURVIVOR', image: 'v.webp', focus: .39, side: -1, angle: -8 },
  { id: 'jackie', name: 'JACKIE WELLES', line: 'Some legends begin with loyalty.', tag: 'THE HEART', image: 'jackie.webp', focus: .53, side: 1, angle: 8 },
  { id: 'david', name: 'DAVID', line: 'A dream that burned beyond its limits.', tag: 'THE DREAMER', image: 'david.webp', focus: .67, side: -1, angle: -7 },
  { id: 'lucy', name: 'LUCY', line: 'Some dreams outlive the city.', tag: 'THE MOON', image: 'lucy.webp', focus: .81, side: 1, angle: 7 },
] as const;

export const clamp = (x: number, min = 0, max = 1) => Math.min(max, Math.max(min, x));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export function screenPose(progress: number, index: number, width: number, height: number) {
  const character = characters[index];
  const r = (progress - character.focus) / .14;
  let scale: number, opacity: number, x: number, y: number, yaw: number;
  if (r < -.25) {
    const t = clamp((r + 1.4) / 1.15);
    const e = t * t;
    scale = mix(.10, .96, e);
    opacity = smooth(-1.45, -.65, r);
    x = mix(width * (.5 + character.side * .34), width * (.5 + character.side * .05), e);
    y = mix(height * .69, height * .46, e);
    yaw = mix(character.side * -28, character.angle, e);
  } else if (r <= .25) {
    const t = (r + .25) / .5;
    scale = mix(.96, 1.04, t);
    opacity = 1;
    x = width * (.5 + character.side * .05);
    y = height * mix(.465, .455, t);
    yaw = character.angle;
  } else {
    const t = clamp((r - .25) / .40);
    scale = mix(1.04, 2.25, t * t);
    opacity = 1 - smooth(.36, .65, r);
    x = width * (.5 + character.side * mix(.05, .26, t));
    y = height * mix(.455, .20, t);
    yaw = character.angle * (1 + t);
  }
  const end = smooth(.89, .985, progress);
  if (end > 0) {
    const targetX = width * (index % 2 === 0 ? .24 : .76);
    const targetY = height * (index < 2 ? .31 : .66);
    x = mix(x, targetX, end);
    y = mix(y, targetY, end);
    scale = mix(Math.min(scale, 1.1), Math.min(.39, width / 2600), end);
    opacity = mix(opacity, .88, end);
    yaw = mix(yaw, index % 2 === 0 ? -9 : 9, end);
  }
  opacity *= smooth(.265, .315, progress);
  return { x, y, scale, opacity, yaw, active: Math.abs(r) <= .28 && end < .25 };
}
