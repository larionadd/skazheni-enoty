// Procedural Spooky-Cozy Halloween Web Audio Synthesizer
// Features: Theremin with Vibrato LFO, Haunted Harpsichord Chords & Pizzicato Walking Bass

class CozyAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.musicTimer = null;
    this.musicStep = 0;
    this.lastBounceTime = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    if (this.enabled && !this.musicTimer) {
      this.startAmbientMusic();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stopAmbientMusic();
    } else {
      this.init();
      this.startAmbientMusic();
      this.playCoin();
    }
    return this.enabled;
  }

  playTone(freq, type, duration, gainVal = 0.12, delay = 0, slideTo = null) {
    if (!this.enabled || !this.ctx || freq <= 0) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(gainVal, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  // Spooky Theremin note with real Vibrato LFO
  playTheremin(freq, duration, gainVal = 0.04, delay = 0, prevFreq = null) {
    if (!this.enabled || !this.ctx || freq <= 0) return;
    const now = this.ctx.currentTime + delay;

    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    if (prevFreq && prevFreq > 0) {
      osc.frequency.setValueAtTime(prevFreq, now);
      osc.frequency.exponentialRampToValueAtTime(freq, now + Math.min(0.09, duration * 0.4));
    } else {
      osc.frequency.setValueAtTime(freq, now);
    }

    // 6.2 Hz spooky vibrato
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(6.2, now);
    lfoGain.gain.setValueAtTime(freq * 0.022, now);

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(gainVal, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    lfo.start(now);
    osc.stop(now + duration + 0.03);
    lfo.stop(now + duration + 0.03);
  }

  // Haunted Harpsichord / Organ pluck with lowpass filter
  playHarpsichord(freq, duration, gainVal = 0.03, delay = 0) {
    if (!this.enabled || !this.ctx || freq <= 0) return;
    const now = this.ctx.currentTime + delay;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, now);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1900, now);
    filter.frequency.exponentialRampToValueAtTime(420, now + duration);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(gainVal, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playDrop() {
    this.init();
    this.playTone(320, "sine", 0.1, 0.1, 0, 175);
  }

  playBounce(speed) {
    if (!this.enabled || !this.ctx) return;
    const now = performance.now();
    if (now - this.lastBounceTime < 80) return;
    this.lastBounceTime = now;

    const vol = Math.min(0.05, Math.max(0.008, speed * 0.005));
    this.playTone(140 + Math.random() * 45, "triangle", 0.055, vol, 0, 88);
  }

  playMerge(tier, combo = 1) {
    this.init();
    // Harmonic minor / mysterious alchemy scale
    const scale = [
      220.0, 246.94, 261.63, 293.66, 329.63, 349.23, 415.3, 440.0, 493.88, 523.25,
      587.33, 659.25, 698.46, 830.61, 880.0, 987.77, 1046.5, 1174.66, 1318.5, 1396.9
    ];
    const baseIdx = Math.min(scale.length - 1, tier);
    const root = scale[baseIdx] * (1 + Math.min(4, combo - 1) * 0.04);

    this.playTone(root * 0.5, "triangle", 0.16, 0.11, 0, root);
    this.playTone(root, "sine", 0.25, 0.12, 0.02);
    this.playTone(root * 1.2, "sine", 0.28, 0.08, 0.055);
    this.playTone(root * 1.5, "triangle", 0.34, 0.08, 0.09);
  }

  playCoin() {
    this.init();
    this.playTone(987.77, "sine", 0.12, 0.11, 0);
    this.playTone(1318.51, "triangle", 0.24, 0.12, 0.065);
  }

  playQuestComplete() {
    this.init();
    // Spooky-triumphant A harmonic minor -> A major picardy third fanfare
    const notes = [440.0, 523.25, 659.25, 830.61, 880.0];
    notes.forEach((n, idx) => {
      this.playHarpsichord(n, 0.34, 0.055, idx * 0.065);
      this.playTone(n, "triangle", 0.34, 0.09, idx * 0.065);
    });
  }

  playLevelWin() {
    this.init();
    const notes = [440.0, 523.25, 659.25, 880.0, 659.25, 880.0, 1108.73];
    notes.forEach((n, idx) => {
      this.playHarpsichord(n, 0.4, 0.06, idx * 0.09);
      this.playTone(n, "sine", 0.42, 0.11, idx * 0.09);
    });
  }

  playSunrise() {
    this.init();
    this.isDaytime = true;
    // Warm sunny A-major morning arpeggio + morning bird trill
    const notes = [440.0, 554.37, 659.25, 880.0, 1108.73, 1318.51];
    notes.forEach((n, idx) => {
      this.playTone(n, "sine", 0.48, 0.1, idx * 0.085);
      this.playTone(n * 0.5, "triangle", 0.45, 0.06, idx * 0.085);
    });
  }

  playNightfall() {
    this.init();
    this.isDaytime = false;
    // Mysterious descending twilight chime into A harmonic minor
    const notes = [1046.5, 880.0, 830.61, 659.25, 523.25, 440.0];
    notes.forEach((n, idx) => {
      this.playHarpsichord(n, 0.36, 0.045, idx * 0.075);
      this.playTheremin(n, 0.38, 0.055, idx * 0.075, idx > 0 ? notes[idx - 1] : n);
    });
  }

  setDaytime(isDay) {
    this.isDaytime = Boolean(isDay);
  }

  playPotion(kind) {
    this.init();
    if (kind === "vortex") {
      // Arcane magnetic snap + rising ghostly arpeggio
      const notes = [220, 261.63, 329.63, 415.3, 523.25, 659.25, 880];
      notes.forEach((n, i) => {
        this.playTheremin(n, 0.25, 0.07, i * 0.04, i > 0 ? notes[i - 1] : n * 0.8);
      });
    } else if (kind === "bat") {
      this.playTone(680, "sine", 0.09, 0.1, 0, 980);
      this.playTone(840, "triangle", 0.12, 0.1, 0.07, 510);
      this.playTone(760, "sine", 0.15, 0.09, 0.14, 1120);
    } else if (kind === "dew") {
      const notes = [523.25, 659.25, 830.61, 1046.5, 1318.5];
      notes.forEach((n, i) => {
        this.playTone(n, "sine", 0.36, 0.1, i * 0.05);
      });
    }
  }

  playTickWarning() {
    if (!this.enabled || !this.ctx) return;
    this.playTone(780, "triangle", 0.045, 0.05, 0, 420);
  }

  startAmbientMusic() {
    if (this.musicTimer) return;

    // 32-step Halloween Night theme in A Harmonic Minor (A - B - C - D - E - F - G#)
    const bassLine = [
      110.0, 0, 164.81, 0, 110.0, 0, 164.81, 123.47,
      130.81, 0, 196.0, 0, 130.81, 0, 164.81, 0,
      146.83, 0, 220.0, 0, 116.54, 0, 174.61, 0,
      164.81, 0, 123.47, 0, 164.81, 146.83, 130.81, 123.47
    ];

    const chords = [
      [220.0, 261.63, 329.63], // Am
      [220.0, 261.63, 329.63],
      [174.61, 220.0, 261.63, 311.13], // F dim/maj7
      [146.83, 174.61, 220.0], // Dm
      [164.81, 207.65, 246.94, 293.66] // E7 (G# leading tone!)
    ];

    const thereminMelody = [
      440.0, 0, 523.25, 493.88, 440.0, 0, 415.3, 440.0,
      659.25, 0, 622.25, 659.25, 523.25, 0, 0, 0,
      587.33, 0, 698.46, 659.25, 587.33, 523.25, 493.88, 440.0,
      415.3, 493.88, 659.25, 0, 440.0, 0, 0, 0
    ];

    // Sunny Daytime Shop theme in warm A Major
    const dayMelody = [
      440.0, 0, 554.37, 659.25, 554.37, 0, 493.88, 440.0,
      659.25, 0, 739.99, 659.25, 554.37, 0, 0, 0,
      587.33, 0, 659.25, 739.99, 659.25, 554.37, 493.88, 440.0,
      493.88, 554.37, 659.25, 0, 440.0, 0, 0, 0
    ];

    let lastLeadFreq = 440.0;

    this.musicTimer = setInterval(() => {
      if (!this.enabled || !this.ctx || document.hidden) return;
      const step = this.musicStep % 32;
      this.musicStep++;

      if (this.isDaytime) {
        const dLead = dayMelody[step];
        if (dLead > 0) {
          this.playTone(dLead, "sine", 0.32, 0.038, 0);
          this.playTone(dLead * 0.5, "triangle", 0.25, 0.025, 0);
        }
        return;
      }

      // 1. Pizzicato Walking Bass
      const bNote = bassLine[step];
      if (bNote > 0) {
        this.playTone(bNote, "triangle", 0.19, 0.048, 0, bNote * 0.96);
      }

      // 2. Off-beat Haunted Harpsichord Stabs
      if (step % 4 === 2) {
        const chordIdx = Math.floor(step / 8) % chords.length;
        const chord = chords[chordIdx];
        chord.forEach((n, i) => {
          this.playHarpsichord(n, 0.16, 0.016, i * 0.012);
        });
      }

      // 3. Spooky Theremin Lead with Vibrato & Glide
      const lead = thereminMelody[step];
      if (lead > 0) {
        this.playTheremin(lead, 0.36, 0.028, 0, lastLeadFreq);
        lastLeadFreq = lead;
      }
    }, 225);
  }

  stopAmbientMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

window.cozyAudio = new CozyAudioEngine();

