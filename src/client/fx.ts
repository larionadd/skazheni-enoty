// Tiny synthesized sound effects (no audio files to download) + haptics.
let ctx: AudioContext | null = null;
let muted = false;
try {
  muted = localStorage.getItem('enoty.muted') === '1';
} catch {
  /* ignore in restricted contexts */
}

export const isMuted = () => muted;
export function setMuted(m: boolean) {
  muted = m;
  try {
    localStorage.setItem('enoty.muted', m ? '1' : '0');
  } catch {
    /* ignore */
  }
}

function ac(): AudioContext | null {
  if (muted) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', gain = 0.15, slideTo?: number) {
  const a = ac();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, a.currentTime);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, a.currentTime + dur);
  g.gain.setValueAtTime(gain, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  o.connect(g).connect(a.destination);
  o.start();
  o.stop(a.currentTime + dur);
}

function noise(dur: number, gain = 0.4) {
  const a = ac();
  if (!a) return;
  const buf = a.createBuffer(1, a.sampleRate * dur, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
  const src = a.createBufferSource();
  const g = a.createGain();
  const f = a.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 900;
  src.buffer = buf;
  g.gain.value = gain;
  src.connect(f).connect(g).connect(a.destination);
  src.start();
}

export function vibrate(pattern: number | number[]) {
  if ('vibrate' in navigator) navigator.vibrate(pattern);
}

export const sfx = {
  card: () => tone(520, 0.08, 'triangle', 0.12, 780),
  draw: () => tone(300, 0.12, 'triangle', 0.12, 200),
  turn: () => {
    tone(660, 0.1, 'sine', 0.12);
    setTimeout(() => tone(880, 0.14, 'sine', 0.12), 110);
  },
  nope: () => tone(220, 0.25, 'sawtooth', 0.12, 110),
  tick: () => tone(1200, 0.03, 'square', 0.05),
  boom: () => {
    noise(1.2, 0.6);
    tone(120, 0.8, 'sine', 0.3, 40);
    vibrate([200, 80, 400]);
  },
  saved: () => {
    tone(440, 0.1, 'triangle', 0.15);
    setTimeout(() => tone(660, 0.1, 'triangle', 0.15), 100);
    setTimeout(() => tone(990, 0.2, 'triangle', 0.15), 200);
    vibrate([60, 40, 60]);
  },
  win: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.25, 'triangle', 0.15), i * 140)),
};
