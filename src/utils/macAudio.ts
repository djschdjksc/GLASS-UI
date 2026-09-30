// Authentic Apple macOS & iOS Sound System
// Pure Web Audio synthesized Apple UI sound cues with High-Volume Presence:
// - iOS Tock Click (crisp mechanical wood tap, loud & punchy)
// - Apple Subtle Hover Tick (audible tactile tick)
// - macOS Glass Chime (pleasant polyphonic crystal chime)
// - Apple Pop / Bubble (tactile selection)
// - Apple Trash / Swoosh (crumple/eject)
// - Apple Warning / Sosumi Alert (warm marimba alert)

class AppleAudioEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('pointerdown', () => this.initContext(), { once: true });
      window.addEventListener('keydown', () => this.initContext(), { once: true });
    }
  }

  public initContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // 1. Apple Audible Hover Tick (Punchy tactile tick on hover/focus)
  public playHover() {
    if (!this.enabled) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const t = ctx.currentTime;

      // Crisp audible iPhone haptic tap (Boosted from 0.045 to 0.28)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1750, t);
      osc.frequency.exponentialRampToValueAtTime(750, t + 0.016);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.exponentialRampToValueAtTime(0.28, t + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.016);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.02);
    } catch {}
  }

  // 2. Apple iOS Tock Button Click (Loud & Crisp mechanical click)
  public playClick() {
    if (!this.enabled) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const t = ctx.currentTime;

      // Sharp transient click (Boosted from 0.18 to 0.45)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1950, t);
      osc1.frequency.exponentialRampToValueAtTime(850, t + 0.008);
      gain1.gain.setValueAtTime(0.001, t);
      gain1.gain.exponentialRampToValueAtTime(0.45, t + 0.002);
      gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.015);
      osc1.connect(gain1).connect(ctx.destination);
      osc1.start(t);
      osc1.stop(t + 0.02);

      // Acoustic wood resonance body (Boosted from 0.14 to 0.38)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(400, t);
      osc2.frequency.exponentialRampToValueAtTime(130, t + 0.028);
      gain2.gain.setValueAtTime(0.001, t);
      gain2.gain.exponentialRampToValueAtTime(0.38, t + 0.004);
      gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.032);
      osc2.connect(gain2).connect(ctx.destination);
      osc2.start(t);
      osc2.stop(t + 0.035);
    } catch {}
  }

  // 3. Apple Glass Chime / Success (Pure crystal glass chime chord, clear & resonant)
  public playSuccess() {
    if (!this.enabled) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const t = ctx.currentTime;

      // Pure bell chime chord (1046Hz, 1318Hz, 1568Hz, 2093Hz) - Boosted from 0.06 to 0.22
      const freqs = [1046.50, 1318.51, 1567.98, 2093.00];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.032);

        gain.gain.setValueAtTime(0.001, t + idx * 0.032);
        gain.gain.exponentialRampToValueAtTime(0.22, t + idx * 0.032 + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.032 + 0.42);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t + idx * 0.032);
        osc.stop(t + idx * 0.032 + 0.45);
      });
    } catch {}
  }

  // 4. Apple Sosumi / Marimba Warning Alert (Classic warm macOS alert)
  public playBeep() {
    if (!this.enabled) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const t = ctx.currentTime;

      // Double marimba tap (Apple Alert chord) - Boosted from 0.12 to 0.38
      [0, 0.09].forEach((offset, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(idx === 0 ? 523.25 : 659.25, t + offset);
        osc.frequency.exponentialRampToValueAtTime(idx === 0 ? 490 : 620, t + offset + 0.14);

        gain.gain.setValueAtTime(0.001, t + offset);
        gain.gain.exponentialRampToValueAtTime(0.38, t + offset + 0.009);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.16);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t + offset);
        osc.stop(t + offset + 0.18);
      });
    } catch {}
  }

  // 5. Apple Pop (Bubble Pop for item select / switch)
  public playPop() {
    if (!this.enabled) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const t = ctx.currentTime;

      // Boosted from 0.14 to 0.40
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(1450, t + 0.045);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.exponentialRampToValueAtTime(0.40, t + 0.007);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    } catch {}
  }

  // 6. Apple Trash / Crumple Delete
  public playTrash() {
    if (!this.enabled) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const t = ctx.currentTime;

      // Boosted from 0.15 to 0.42
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.1);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.exponentialRampToValueAtTime(0.42, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    } catch {}
  }

  // 7. Apple Soft Airy Whoosh (Smooth slide / card flip)
  public playWhoosh() {
    if (!this.enabled) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const t = ctx.currentTime;

      // Boosted from 0.04 to 0.20
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(380, t);
      osc.frequency.exponentialRampToValueAtTime(150, t + 0.12);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.exponentialRampToValueAtTime(0.20, t + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.16);
    } catch {}
  }

  // 8. Warning & Error Alerts
  public playWarning() {
    this.playBeep();
  }

  public playError() {
    this.playBeep();
  }
}

export const macAudio = new AppleAudioEngine();
