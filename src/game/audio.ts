import type { Player } from './types';

interface BlipOptions {
  duration?: number;
  type?: OscillatorType;
  gain?: number;
  delay?: number;
}

const CHORD_PROGRESSION: number[][] = [
  [220.0, 261.63, 329.63, 392.0], // Am9
  [174.61, 220.0, 261.63, 329.63], // Fmaj7
  [130.81, 164.81, 196.0, 246.94], // Cmaj7
  [196.0, 246.94, 293.66, 329.63], // G6
];
const CHORD_DURATION_MS = 7000;

class SoundManager {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private padFilter: BiquadFilterNode | null = null;

  private musicVolume = 0.5;
  private sfxVolume = 0.7;
  private musicEnabled = true;
  private sfxEnabled = true;

  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private chordIndex = 0;
  private musicRunning = false;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicEnabled ? this.musicVolume : 0;
      this.padFilter = this.ctx.createBiquadFilter();
      this.padFilter.type = 'lowpass';
      this.padFilter.frequency.value = 1100;
      this.padFilter.connect(this.musicGain);
      this.musicGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxEnabled ? this.sfxVolume : 0;
      this.sfxGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  setMusicVolume(v: number) {
    this.musicVolume = v;
    if (this.ctx && this.musicGain) {
      this.musicGain.gain.setTargetAtTime(this.musicEnabled ? v : 0, this.ctx.currentTime, 0.05);
    }
  }

  setSfxVolume(v: number) {
    this.sfxVolume = v;
    if (this.ctx && this.sfxGain) {
      this.sfxGain.gain.setTargetAtTime(this.sfxEnabled ? v : 0, this.ctx.currentTime, 0.05);
    }
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (this.ctx && this.musicGain) {
      this.musicGain.gain.setTargetAtTime(enabled ? this.musicVolume : 0, this.ctx.currentTime, 0.05);
    }
    if (!enabled) this.stopMusic();
  }

  setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
    if (this.ctx && this.sfxGain) {
      this.sfxGain.gain.setTargetAtTime(enabled ? this.sfxVolume : 0, this.ctx.currentTime, 0.05);
    }
  }

  private blip(freq: number, opts: BlipOptions = {}) {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const { duration = 0.18, type = 'sine', gain = 0.5, delay = 0 } = opts;
    const t0 = ctx.currentTime + delay;

    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.linearRampToValueAtTime(gain, t0 + 0.012);
    env.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

    osc.connect(env);
    env.connect(this.sfxGain);
    osc.start(t0);
    osc.stop(t0 + duration + 0.03);
  }

  playPlace(player: Player) {
    if (player === 'X') this.blip(329.63, { type: 'triangle', duration: 0.15, gain: 0.4 });
    else this.blip(392.0, { type: 'triangle', duration: 0.15, gain: 0.4 });
  }

  playClick() {
    this.blip(880, { type: 'square', duration: 0.045, gain: 0.15 });
  }

  playWin() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => this.blip(f, { type: 'triangle', duration: 0.3, gain: 0.45, delay: i * 0.09 }));
  }

  playLose() {
    const notes = [392.0, 349.23, 293.66];
    notes.forEach((f, i) => this.blip(f, { type: 'sawtooth', duration: 0.38, gain: 0.28, delay: i * 0.15 }));
  }

  playDraw() {
    const notes = [440, 415.3];
    notes.forEach((f, i) => this.blip(f, { type: 'sine', duration: 0.22, gain: 0.28, delay: i * 0.17 }));
  }

  private playChord(freqs: number[], durationMs: number) {
    const ctx = this.ensureContext();
    if (!ctx || !this.padFilter) return;
    const t0 = ctx.currentTime;
    const durationS = durationMs / 1000;
    const attack = 1.6;
    const release = 2.2;

    for (const freq of freqs) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const detuned = ctx.createOscillator();
      detuned.type = 'sine';
      detuned.frequency.value = freq * 1.003;

      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t0);
      env.gain.linearRampToValueAtTime(0.14 / freqs.length + 0.02, t0 + attack);
      env.gain.setValueAtTime(0.14 / freqs.length + 0.02, t0 + durationS - release);
      env.gain.linearRampToValueAtTime(0.0001, t0 + durationS);

      osc.connect(env);
      detuned.connect(env);
      env.connect(this.padFilter);

      osc.start(t0);
      detuned.start(t0);
      osc.stop(t0 + durationS + 0.1);
      detuned.stop(t0 + durationS + 0.1);
    }
  }

  startMusic() {
    if (this.musicRunning || !this.musicEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.musicRunning = true;

    const advance = () => {
      this.playChord(CHORD_PROGRESSION[this.chordIndex % CHORD_PROGRESSION.length], CHORD_DURATION_MS + 400);
      this.chordIndex++;
    };
    advance();
    this.musicTimer = setInterval(advance, CHORD_DURATION_MS);
  }

  stopMusic() {
    this.musicRunning = false;
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const audio = new SoundManager();
