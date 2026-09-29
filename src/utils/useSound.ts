import { useRef, useCallback } from "react";

export default function useSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      } catch (e) {
        /* silent fail */
      }
    }
    if (audioCtxRef.current?.state === "suspended") {
      audioCtxRef.current.resume();
    }
  }, []);

  // Authentic iPhone Haptic / Tock Click (crisp wood tap)
  const playIPhoneClick = useCallback(() => {
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const t = ctx.currentTime;

      // 1. Sharp high-frequency transient click (the "tick")
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(1950, t);
      osc1.frequency.exponentialRampToValueAtTime(800, t + 0.007);
      gain1.gain.setValueAtTime(0.001, t);
      gain1.gain.exponentialRampToValueAtTime(0.22, t + 0.002);
      gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.012);
      osc1.connect(gain1).connect(ctx.destination);
      osc1.start(t);
      osc1.stop(t + 0.015);

      // 2. Warm acoustic body resonance (the "tock")
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(360, t);
      osc2.frequency.exponentialRampToValueAtTime(120, t + 0.022);
      gain2.gain.setValueAtTime(0.001, t);
      gain2.gain.exponentialRampToValueAtTime(0.18, t + 0.003);
      gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);
      osc2.connect(gain2).connect(ctx.destination);
      osc2.start(t);
      osc2.stop(t + 0.03);
    } catch {}
  }, [initAudio]);

  // iOS Pop Chime
  const playPop = useCallback(() => {
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const t = ctx.currentTime;

      // Main Pop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(900, t);
      osc.frequency.exponentialRampToValueAtTime(1450, t + 0.04);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.16, t + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.12);

      // Sparkle
      const osc2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(2600, t);
      g2.gain.setValueAtTime(0.0001, t);
      g2.gain.exponentialRampToValueAtTime(0.04, t + 0.004);
      g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      osc2.connect(g2).connect(ctx.destination);
      osc2.start(t);
      osc2.stop(t + 0.06);
    } catch {}
  }, [initAudio]);

  // Soft airy iOS Whoosh
  const playSoftWhoosh = useCallback(() => {
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(360, t);
      osc.frequency.exponentialRampToValueAtTime(160, t + 0.12);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.035, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.16);
    } catch {}
  }, [initAudio]);

  return { initAudio, playPop, playSoftWhoosh, playIPhoneClick };
}
