// PULSEORA Web Audio Sound Synthesis Engine
// Generates distinct synthetic tones for:
// 1. Network Disconnected (descending amber pulse)
// 2. Network Restored (pleasant ascending chime)
// 3. Critical Health Emergency Alert (rapid high-priority dual-tone siren)

class SoundAlertManager {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private volume: number = 0.8;

  constructor() {
    if (typeof window !== "undefined") {
      const savedEnabled = localStorage.getItem("pulseora_sound_enabled");
      if (savedEnabled !== null) this.soundEnabled = savedEnabled === "true";
      const savedVol = localStorage.getItem("pulseora_sound_volume");
      if (savedVol !== null) this.volume = parseFloat(savedVol);
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (typeof window !== "undefined") {
      localStorage.setItem("pulseora_sound_enabled", String(enabled));
    }
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (typeof window !== "undefined") {
      localStorage.setItem("pulseora_sound_volume", String(this.volume));
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  /**
   * Sound 1: Network Disconnected Warning
   * Distinct descending pulse: 480Hz -> 360Hz -> 280Hz.
   */
  public playNetworkDisconnectedSound() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.25);
    osc.frequency.setValueAtTime(440, now + 0.35);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.65);

    gain.gain.setValueAtTime(this.volume * 0.4, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.7);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.75);
  }

  /**
   * Sound 2: Network Restored Confirmation Chime
   * Pleasant ascending harmonic triad: C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz).
   */
  public playNetworkRestoredSound() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, idx) => {
      const now = ctx.currentTime + idx * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(this.volume * 0.35, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    });
  }

  /**
   * Sound 3: Critical Health Emergency Siren / Beep
   * Distinct, high-priority emergency alert: Rapid dual-tone alternating 880Hz and 740Hz.
   * Completely distinct from network failure tone.
   */
  public playCriticalEmergencySound() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    for (let i = 0; i < 3; i++) {
      const now = ctx.currentTime + i * 0.28;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(880, now); // A5 high urgent tone
      osc.frequency.setValueAtTime(740, now + 0.12);

      gain.gain.setValueAtTime(this.volume * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.24);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.26);
    }
  }
}

export const soundManager = new SoundAlertManager();
