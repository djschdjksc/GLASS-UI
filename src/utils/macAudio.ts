// High-Fidelity Apple macOS Sound Engine with custom MP3 support + Web Audio low-latency buffer
class MacSoundEngine {
  private ctx: AudioContext | null = null;
  private tapAudioBuffer: AudioBuffer | null = null;
  private isLoadingAudio: boolean = false;
  public enabled: boolean = true;

  constructor() {
    // Attempt early preload when window is available
    if (typeof window !== 'undefined') {
      window.addEventListener('pointerdown', () => this.initContext(), { once: true });
      window.addEventListener('keydown', () => this.initContext(), { once: true });
      this.loadCustomAudio('/sounds/tap-hover.mp3');
    }
  }

  private initContext(): AudioContext | null {
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

  // Preload custom mp3 sound into AudioBuffer for ultra-responsive 0ms playback
  public async loadCustomAudio(url: string) {
    if (this.tapAudioBuffer || this.isLoadingAudio) return;
    this.isLoadingAudio = true;
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const ctx = this.initContext() || new (window.AudioContext || (window as any).webkitAudioContext)();
      if (!this.ctx) this.ctx = ctx;
      this.ctx.decodeAudioData(
        arrayBuffer,
        (decoded) => {
          this.tapAudioBuffer = decoded;
          this.isLoadingAudio = false;
        },
        () => {
          this.isLoadingAudio = false;
        }
      );
    } catch {
      this.isLoadingAudio = false;
    }
  }

  // 1. Play Custom MP3 Sound on Hover with instantaneous zero-latency polyphony
  public playHover() {
    if (!this.enabled) return;
    try {
      const ctx = this.initContext();
      if (ctx && this.tapAudioBuffer) {
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        source.buffer = this.tapAudioBuffer;
        gain.gain.value = 0.55; // Crisp, balanced volume
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start(0);
        return;
      }
    } catch {}

    // Fallback: Web Audio synthesis if MP3 buffer is loading
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.022);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.025);
    } catch {}
  }

  // 2. Play tactile click sound on button press
  public playClick() {
    if (!this.enabled) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.035);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {}
  }

  // 3. Play Apple pleasant chime on success / save / export
  public playSuccess() {
    if (!this.enabled) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.04);
        gain.gain.setValueAtTime(0.06, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.04 + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.04);
        osc.stop(now + i * 0.04 + 0.14);
      });
    } catch {}
  }

  // 4. Play alert beep on error or warning
  public playBeep() {
    if (!this.enabled) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(320, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch {}
  }

  // 5. Play tactile pop sound
  public playPop() {
    this.playClick();
  }
}

export const macAudio = new MacSoundEngine();
