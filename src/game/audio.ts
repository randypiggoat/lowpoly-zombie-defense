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
  if (c && c.state === "suspended") {
    void c.resume().then(() => {
      if (musicMode !== "off" && musicTimer === null) startMusic();
    }).catch(() => undefined);
  } else if (c?.state === "running" && musicMode !== "off" && musicTimer === null) {
    startMusic();
  }
}

export function setMusicMode(mode: MusicMode) {
  musicMode = mode;
  if (mode === "off") {
    stopMusic();
    return;
  }
  const c = ensure();
  if (c?.state === "running") startMusic();
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

type MusicMode = "off" | "menu" | "combat" | "boss";

let musicMode: MusicMode = "off";
let musicTimer: ReturnType<typeof setInterval> | null = null;
let musicStep = 0;
let musicGain: GainNode | null = null;

const MUSIC_SCALES = {
  menu: [0, 3, 5, 7, 10, 12, 15, 17],
  combat: [0, 2, 3, 5, 7, 10, 12, 14],
  boss: [0, 1, 3, 6, 7, 8, 10, 13],
} as const;

function stopMusic() {
  if (musicTimer !== null) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
  if (musicGain) {
    try {
      musicGain.gain.cancelScheduledValues(ensure()?.currentTime ?? 0);
      musicGain.gain.setTargetAtTime(0.0001, ensure()?.currentTime ?? 0, 0.04);
    } catch {
      // Music is optional feedback and must never interrupt gameplay.
    }
    musicGain = null;
  }
}

function musicTick() {
  const c = ensure();
  if (!c || !master || muted || musicMode === "off" || c.state !== "running") return;
  if (!musicGain) {
    musicGain = c.createGain();
    musicGain.gain.value = 0.0001;
    musicGain.connect(master);
  }

  const scale = MUSIC_SCALES[musicMode];
  const root = musicMode === "boss" ? 98 : musicMode === "combat" ? 110 : 123;
  const semitone = scale[musicStep % scale.length]!;
  const octave = musicMode === "menu" ? 0 : Math.floor(musicStep / scale.length) % 2;
  const freq = root * Math.pow(2, (semitone + octave * 12) / 12);
  const now = c.currentTime + 0.01;
  const note = c.createOscillator();
  const noteGain = c.createGain();
  note.type = musicMode === "boss" ? "sawtooth" : "triangle";
  note.frequency.setValueAtTime(freq, now);
  noteGain.gain.setValueAtTime(0.0001, now);
  noteGain.gain.exponentialRampToValueAtTime(musicMode === "boss" ? 0.026 : 0.018, now + 0.018);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, now + (musicMode === "menu" ? 0.26 : 0.18));
  note.connect(noteGain).connect(musicGain);
  note.start(now);
  note.stop(now + 0.3);

  if (musicStep % 4 === 0) {
    const bass = c.createOscillator();
    const bassGain = c.createGain();
    bass.type = "sine";
    bass.frequency.setValueAtTime(root / 2, now);
    bassGain.gain.setValueAtTime(0.0001, now);
    bassGain.gain.exponentialRampToValueAtTime(musicMode === "boss" ? 0.028 : 0.014, now + 0.02);
    bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
    bass.connect(bassGain).connect(musicGain);
    bass.start(now);
    bass.stop(now + 0.42);
  }
  musicStep += 1;
}

function startMusic() {
  stopMusic();
  if (musicMode === "off") return;
  const c = ensure();
  if (!c) return;
  musicStep = 0;
  musicTimer = setInterval(musicTick, musicMode === "menu" ? 430 : 320);
  musicTick();
}

let lastShot = 0;
let lastImpact = -Infinity;
let lastCoin = -Infinity;
let coinCombo = 0;

export function sfx(name: SfxName) {
  try {
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
  } catch {
    // Sound is feedback only and must never block the action that caused it.
  }
}
