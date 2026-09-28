// Tiny WebAudio synth — no asset files, works offline on iOS Safari.

type Ctx = AudioContext | null;
let ctx: Ctx = null;
let master: GainNode | null = null;
let muted = false;

function ensure(): Ctx {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    } catch {
      // Some embedded/mobile browsers can reject audio-context creation.
      // Audio failure must never make an otherwise valid tap fail.
      ctx = null;
      master = null;
      return null;
    }
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
  | "shootRifle"
  | "shootShotgun"
  | "shootSniper"
  | "shootTesla"
  | "shootFlame"
  | "shootFrost"
  | "shootRocket"
  | "shootLaser"
  | "hit"
  | "death"
  | "gib"
  | "build"
  | "upgrade"
  | "deny"
  | "baseHit"
  | "wave"
  | "streak"
  | "gameOver"
  | "bigHit"
  | "coin"
  | "uiClick";

let lastShot = 0;
let lastImpact = -Infinity;
let lastCoin = -Infinity;
let coinCombo = 0;

export function sfx(name: SfxName) {
  const c = ensure();
  if (!c || muted) return;
  switch (name) {
    case "shootRifle":
    case "shootShotgun":
    case "shootSniper":
    case "shootTesla":
    case "shootFlame":
    case "shootFrost":
    case "shootRocket":
    case "shootLaser": {
      // Throttle dense weapon fire while keeping each weapon's timbre distinct.
      const now = c.currentTime;
      if (now - lastShot < 0.045) return;
      lastShot = now;

      if (name === "shootRifle") {
        tone({ freq: 700, to: 310, dur: 0.045, type: "square", gain: 0.055 });
      } else if (name === "shootShotgun") {
        tone({ freq: 180, to: 62, dur: 0.13, type: "sawtooth", gain: 0.12 });
        noise(0.09, 0.075, 760);
      } else if (name === "shootSniper") {
        tone({ freq: 105, to: 52, dur: 0.16, type: "sine", gain: 0.11 });
        tone({ freq: 1700, to: 1050, dur: 0.075, type: "triangle", gain: 0.065, delay: 0.012 });
      } else if (name === "shootTesla") {
        tone({ freq: 820, to: 1780, dur: 0.085, type: "sawtooth", gain: 0.065 });
        noise(0.075, 0.045, 3000);
      } else if (name === "shootFlame") {
        noise(0.12, 0.085, 1500);
        tone({ freq: 150, to: 90, dur: 0.11, type: "triangle", gain: 0.045 });
      } else if (name === "shootFrost") {
        tone({ freq: 1350, to: 820, dur: 0.105, type: "triangle", gain: 0.06 });
        tone({ freq: 2100, to: 1600, dur: 0.08, type: "sine", gain: 0.035, delay: 0.028 });
      } else if (name === "shootRocket") {
        tone({ freq: 125, to: 46, dur: 0.19, type: "sawtooth", gain: 0.115 });
        noise(0.14, 0.08, 520);
      } else if (name === "shootLaser") {
        tone({ freq: 480, to: 1850, dur: 0.12, type: "triangle", gain: 0.05 });
        tone({ freq: 1450, to: 620, dur: 0.09, type: "sine", gain: 0.03, delay: 0.02 });
      }
      return;
    }
    case "hit": {
      const now = c.currentTime;
      if (now - lastImpact < 0.025) return;
      lastImpact = now;
      tone({ freq: 240, to: 150, dur: 0.05, type: "triangle", gain: 0.05 });
      return;
    }
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
    case "streak":
      tone({ freq: 620, to: 880, dur: 0.09, type: "triangle", gain: 0.1 });
      tone({ freq: 930, to: 1240, dur: 0.12, type: "triangle", gain: 0.09, delay: 0.08 });
      return;
    case "gameOver":
      tone({ freq: 400, to: 80, dur: 0.9, type: "sawtooth", gain: 0.18 });
      return;
    case "bigHit":
      tone({ freq: 920, to: 240, dur: 0.11, type: "triangle", gain: 0.1 });
      return;
    case "uiClick":
      tone({ freq: 420, to: 300, dur: 0.045, type: "triangle", gain: 0.04 });
      return;
    case "coin": {
      const now = c.currentTime;
      if (now - lastCoin < 0.045) return;
      coinCombo = now - lastCoin < 0.32 ? Math.min(8, coinCombo + 1) : 0;
      lastCoin = now;
      const freq = 760 + coinCombo * 68;
      tone({ freq, to: freq * 1.18, dur: 0.07, type: "triangle", gain: 0.075 });
      tone({ freq: freq * 1.5, dur: 0.055, type: "sine", gain: 0.045, delay: 0.035 });
      return;
    }
  }
}
