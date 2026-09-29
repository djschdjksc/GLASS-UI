import confetti from 'canvas-confetti';

/**
 * Trigger an epic multi-stage celebration explosion (Dhamaka)
 * with vibrant fireworks, cross-cannons, shimmering stars,
 * and a triumphant major chord audio arpeggio.
 */
export const triggerCelebrationBlast = () => {
  try {
    // 1. Triumphant Celebration Audio Chime (Major Chord Arpeggio: C5 -> E5 -> G5 -> C6)
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const startTime = audioCtx.currentTime + idx * 0.08;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.08, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    } catch {}

    // Festive high-contrast neon palette
    const vibrantColors = [
      '#10b981', // emerald green
      '#0071e3', // electric blue
      '#38bdf8', // sky cyan
      '#f59e0b', // amber gold
      '#ec4899', // hot pink
      '#8b5cf6', // royal purple
      '#eab308', // pure gold
      '#ffffff'  // diamond white
    ];

    // Stage 1: Big Center Cannon Blast (Instant Dhamaka)
    confetti({
      particleCount: 130,
      spread: 110,
      origin: { y: 0.6, x: 0.5 },
      colors: vibrantColors,
      startVelocity: 48,
      zIndex: 99999,
      scalar: 1.15
    });

    // Stage 2: Starburst & High Arc (150ms later)
    setTimeout(() => {
      confetti({
        particleCount: 90,
        spread: 360,
        origin: { y: 0.45, x: 0.5 },
        colors: vibrantColors,
        shapes: ['circle', 'star'],
        startVelocity: 36,
        zIndex: 99999,
        scalar: 1.3
      });
    }, 150);

    // Stage 3: Double Crossfire Cannons from Bottom Corners (300ms later)
    setTimeout(() => {
      // Left cannon shooting up-right
      confetti({
        particleCount: 75,
        angle: 60,
        spread: 75,
        origin: { x: 0.05, y: 0.8 },
        colors: vibrantColors,
        startVelocity: 55,
        zIndex: 99999
      });
      // Right cannon shooting up-left
      confetti({
        particleCount: 75,
        angle: 120,
        spread: 75,
        origin: { x: 0.95, y: 0.8 },
        colors: vibrantColors,
        startVelocity: 55,
        zIndex: 99999
      });
    }, 300);

    // Stage 4: Shimmering Gold & Silver Falling Streamers (500ms later)
    setTimeout(() => {
      confetti({
        particleCount: 70,
        spread: 130,
        origin: { y: 0.25, x: 0.5 },
        colors: ['#ffd700', '#ffb703', '#ffffff', '#38bdf8', '#10b981'],
        startVelocity: 26,
        decay: 0.92,
        scalar: 1.25,
        zIndex: 99999
      });
    }, 500);

  } catch (err) {
    console.error('Confetti celebration blast error:', err);
  }
};
