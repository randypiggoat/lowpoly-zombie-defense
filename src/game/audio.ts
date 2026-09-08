// Tiny WebAudio synth — no asset files, works offline on iOS Safari.

type Ctx = AudioContext | null;
let ctx: Ctx = null;
let master: GainNode | null = null;
let muted = false;

function ensure(): Ctx {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  return ctx;
}

export function unlockAudio() {
  const c = ensure();
  if (c && c.state === "suspended") void c.resume();
}

export function setMuted(v: boolean) {
  muted = v;
  if (master) master.gain.value = v ? 0 : 0.5;
}
export function isMuted() {
  return muted;
}

type ToneOpts = {
  freq: number;
  to?: number;
  dur?: number;
  type?: OscillatorType;
  gain?: number;
  delay?: number;
};

function tone({ freq, to, dur = 0.12, type = "square", gain = 0.2, delay = 0 }: ToneOpts) {
  const c = ensure();
  if (!c || !master || muted) return;
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(30, to), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise(dur = 0.18, gain = 0.18, filterFreq = 900) {
  const c = ensure();
  if (!c || !master || muted) return;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = filterFreq;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(f).connect(g).connect(master);
  src.start();
}

export type SfxName =
  | "shootGunner"
  | "shootCannon"
  | "shootFrost"
  | "shootTesla"
  | "hit"
  | "death"
  | "gib"
  | "build"
  | "upgrade"
  | "deny"
  | "baseHit"
  | "wave"
  | "gameOver";

let lastShot = 0;

export function sfx(name: SfxName) {
  const c = ensure();
  if (!c || muted) return;
  switch (name) {
    case "shootGunner":
    case "shootFrost":
    case "shootTesla":
    case "shootCannon": {
      // throttle shot spam
      const now = c.currentTime;
      if (now - lastShot < 0.045) return;
      lastShot = now;
      if (name === "shootGunner") tone({ freq: 620, to: 260, dur: 0.06, type: "square", gain: 0.08 });
      if (name === "shootCannon") {
        tone({ freq: 160, to: 45, dur: 0.2, type: "sawtooth", gain: 0.16 });
        noise(0.14, 0.1, 600);
      }
      if (name === "shootFrost") tone({ freq: 1200, to: 700, dur: 0.1, type: "triangle", gain: 0.07 });
      if (name === "shootTesla") {
        tone({ freq: 900, to: 1800, dur: 0.08, type: "sawtooth", gain: 0.07 });
        noise(0.07, 0.05, 3000);
      }
      return;
    }
    case "hit":
      tone({ freq: 240, to: 150, dur: 0.05, type: "triangle", gain: 0.05 });
      return;
    case "death":
      noise(0.22, 0.14, 700);
      tone({ freq: 180, to: 60, dur: 0.18, type: "sawtooth", gain: 0.08 });
      return;
    case "gib":
      noise(0.3, 0.2, 420);
      tone({ freq: 120, to: 40, dur: 0.24, type: "square", gain: 0.1 });
      return;
    case "build":
      tone({ freq: 420, dur: 0.09, type: "triangle", gain: 0.14 });
      tone({ freq: 660, dur: 0.11, type: "triangle", gain: 0.14, delay: 0.09 });
      return;
    case "upgrade":
      tone({ freq: 520, dur: 0.08, type: "square", gain: 0.12 });
      tone({ freq: 780, dur: 0.09, type: "square", gain: 0.12, delay: 0.07 });
      tone({ freq: 1040, dur: 0.12, type: "square", gain: 0.1, delay: 0.15 });
      return;
    case "deny":
      tone({ freq: 200, to: 120, dur: 0.12, type: "square", gain: 0.1 });
      return;
    case "baseHit":
      tone({ freq: 90, to: 50, dur: 0.3, type: "sawtooth", gain: 0.2 });
      noise(0.25, 0.14, 400);
      return;
    case "wave":
      tone({ freq: 300, dur: 0.18, type: "triangle", gain: 0.12 });
      tone({ freq: 400, dur: 0.22, type: "triangle", gain: 0.12, delay: 0.16 });
      return;
    case "gameOver":
      tone({ freq: 400, to: 80, dur: 0.9, type: "sawtooth", gain: 0.18 });
      return;
  }
}
