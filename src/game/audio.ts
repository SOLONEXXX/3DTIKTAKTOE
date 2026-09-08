import type { Player } from './types';

export type MusicTrack = 'menu' | 'lobby' | 'match' | 'campaign';

interface BlipOptions {
  duration?: number;
  type?: OscillatorType;
  gain?: number;
  delay?: number;
}

interface TrackConfig {
  /** Chord progression, each entry a set of frequencies played together. */
  chords: number[][];
  chordDurationMs: number;
  waveform: OscillatorType;
  filterFreq: number;
  /** Overall loudness compensation so denser waveforms don't feel louder than sine pads. */
  level: number;
}

const TRACKS: Record<MusicTrack, TrackConfig> = {
  // Calm, airy pad for the home screen and settings/cosmetics menus.
  menu: {
    chords: [
      [220.0, 261.63, 329.63, 392.0], // Am9
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [130.81, 164.81, 196.0, 246.94], // Cmaj7
      [196.0, 246.94, 293.66, 329.63], // G6
    ],
    chordDurationMs: 7000,
    waveform: 'sine',
    filterFreq: 1100,
    level: 1,
  },
  // A little more open/suspenseful while waiting for an opponent to join.
  lobby: {
    chords: [
      [164.81, 220.0, 246.94, 311.13], // Esus-ish / E-C#-B-add
      [146.83, 185.0, 220.0, 293.66], // Dadd9-ish
      [130.81, 195.0, 246.94, 329.63], // Csus2-ish
      [174.61, 220.0, 261.63, 349.23], // Fadd9-ish
    ],
    chordDurationMs: 6000,
    waveform: 'sine',
    filterFreq: 1600,
    level: 1,
  },
  // Slightly more present/focused bed for actual matches (bot, pass & play, online).
  match: {
    chords: [
      [146.83, 174.61, 220.0, 293.66], // Dm9
      [116.54, 174.61, 220.0, 261.63], // Bbmaj7
      [174.61, 220.0, 261.63, 349.23], // Fmaj7
      [130.81, 164.81, 196.0, 261.63], // Cmaj7
    ],
    chordDurationMs: 6500,
    waveform: 'triangle',
    filterFreq: 1300,
    level: 0.85,
  },
  // Driving, slightly darker progression for the level campaign.
  campaign: {
    chords: [
      [164.81, 196.0, 246.94, 329.63], // Em
      [130.81, 196.0, 261.63, 329.63], // C
      [196.0, 246.94, 293.66, 392.0], // G
      [146.83, 220.0, 293.66, 369.99], // D
    ],
    chordDurationMs: 5200,
    waveform: 'triangle',
    filterFreq: 1900,
    level: 0.8,
  },
};

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
  private currentTrack: MusicTrack | null = null;
  private desiredTrack: MusicTrack | null = null;

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
    const wasSuspended = this.ctx.state === 'suspended';
    if (wasSuspended) {
      this.ctx.resume().then(() => this.resumeDesiredTrackIfNeeded()).catch(() => {});
    }
    return this.ctx;
  }

  /** Called after a (gesture-driven) context resume to catch up on music that couldn't play yet. */
  private resumeDesiredTrackIfNeeded() {
    if (this.desiredTrack && !this.musicTimer) {
      this.beginTrackLoop(this.desiredTrack);
    }
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
    else if (this.desiredTrack) this.beginTrackLoop(this.desiredTrack);
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
    // A click is always a real user gesture — the safest place to catch up on blocked music.
    this.resumeDesiredTrackIfNeeded();
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

  private playChord(freqs: number[], durationMs: number, waveform: OscillatorType, level: number) {
    const ctx = this.ensureContext();
    if (!ctx || !this.padFilter) return;
    const t0 = ctx.currentTime;
    const durationS = durationMs / 1000;
    const attack = 1.6;
    const release = 2.2;
    const peak = (0.14 / freqs.length + 0.02) * level;

    for (const freq of freqs) {
      const osc = ctx.createOscillator();
      osc.type = waveform;
      osc.frequency.value = freq;
      const detuned = ctx.createOscillator();
      detuned.type = waveform;
      detuned.frequency.value = freq * 1.003;

      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t0);
      env.gain.linearRampToValueAtTime(peak, t0 + attack);
      env.gain.setValueAtTime(peak, t0 + durationS - release);
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

  private beginTrackLoop(track: MusicTrack) {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    if (!this.musicEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const config = TRACKS[track];
    this.currentTrack = track;
    this.chordIndex = 0;

    if (this.padFilter) {
      this.padFilter.frequency.setTargetAtTime(config.filterFreq, ctx.currentTime, 1.2);
    }

    const advance = () => {
      const cfg = TRACKS[track];
      this.playChord(cfg.chords[this.chordIndex % cfg.chords.length], cfg.chordDurationMs + 400, cfg.waveform, cfg.level);
      this.chordIndex++;
    };
    advance();
    this.musicTimer = setInterval(advance, config.chordDurationMs);
  }

  getCurrentTrack(): MusicTrack | null {
    return this.currentTrack;
  }

  /** Switch to (or keep playing) the track appropriate for the current context. A no-op if it's already playing. */
  playTrack(track: MusicTrack) {
    this.desiredTrack = track;
    if (this.currentTrack === track && this.musicTimer) return;
    this.beginTrackLoop(track);
  }

  stopMusic() {
    this.currentTrack = null;
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const audio = new SoundManager();
