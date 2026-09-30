// Authentic Apple macOS & iOS Sound System
// Pure Web Audio synthesized Apple UI sound cues:
// - iOS Tock Click (crisp wood tap)
// - macOS Glass Chime (pleasant polyphonic glass bell)
// - Apple Pop / Bubble (tactile selection)
// - Apple Trash / Swoosh (crumple/eject)
// - Apple Warning / Sosumi Alert (pure warm marimba alert)

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

  // 1. Apple Subtle Hover Click (Ultra-light zero-latency haptic tick)
  public playHover() {
    if (!this.enabled) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const t = ctx.currentTime;

      // Soft iPhone haptic tap
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1600, t);
      osc.frequency.exponentialRampToValueAtTime(700, t + 0.012);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.045, t + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.012);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.015);
    } catch {}
  }

  // 2. Apple iOS Tock Button Click (Crisp wood-click haptic)
  public playClick() {
    if (!this.enabled) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const t = ctx.currentTime;

      // High tick
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1950, t);
      osc1.frequency.exponentialRampToValueAtTime(800, t + 0.007);
      gain1.gain.setValueAtTime(0.001, t);
      gain1.gain.exponentialRampToValueAtTime(0.18, t + 0.002);
      gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.012);
      osc1.connect(gain1).connect(ctx.destination);
      osc1.start(t);
      osc1.stop(t + 0.015);

      // Low resonance tock body
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(380, t);
      osc2.frequency.exponentialRampToValueAtTime(120, t + 0.022);
      gain2.gain.setValueAtTime(0.001, t);
      gain2.gain.exponentialRampToValueAtTime(0.14, t + 0.003);
      gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);
      osc2.connect(gain2).connect(ctx.destination);
      osc2.start(t);
      osc2.stop(t + 0.03);
    } catch {}
  }

  // 3. Apple Glass Chime / Success (Pure crystal glass chime chord: C6, E6, G6, B6)
  public playSuccess() {
    if (!this.enabled) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const t = ctx.currentTime;

      // Pure bell chime chord (1046Hz, 1318Hz, 1568Hz, 2093Hz)
      const freqs = [1046.50, 1318.51, 1567.98, 2093.00];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.03);

        gain.gain.setValueAtTime(0.0001, t + idx * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.06, t + idx * 0.03 + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.03 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t + idx * 0.03);
        osc.stop(t + idx * 0.03 + 0.38);
      });
    } catch {}
  }

  // 4. Apple Sosumi / Marimba Warning Alert (Classic macOS warning sound)
  public playBeep() {
    if (!this.enabled) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const t = ctx.currentTime;

      // Double marimba tap (Apple Alert chord)
      [0, 0.09].forEach((offset, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(idx === 0 ? 523.25 : 659.25, t + offset);
        osc.frequency.exponentialRampToValueAtTime(idx === 0 ? 490 : 620, t + offset + 0.12);

        gain.gain.setValueAtTime(0.0001, t + offset);
        gain.gain.exponentialRampToValueAtTime(0.12, t + offset + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.14);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t + offset);
        osc.stop(t + offset + 0.15);
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

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(1450, t + 0.04);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.14, t + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
    } catch {}
  }

  // 6. Apple Trash / Crumple Delete
  public playTrash() {
    if (!this.enabled) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const t = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.09);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.15, t + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    } catch {}
  }

  // 7. Apple Soft Airy Whoosh (Smooth slide / card flip)
  public playWhoosh() {
    if (!this.enabled) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const t = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(380, t);
      osc.frequency.exponentialRampToValueAtTime(150, t + 0.11);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.04, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.14);
    } catch {}
  }
}

export const macAudio = new AppleAudioEngine();
