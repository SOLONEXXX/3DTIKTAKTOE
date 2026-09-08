import confetti from 'canvas-confetti';

const COLORS = ['#ff4757', '#3fa9ff', '#ffd35c', '#39ff88', '#a855f7', '#ff8a3d'];

/** A proper confetti-cannon burst: a big center pop plus streams from both sides. */
export function fireWinConfetti() {
  const duration = 2200;
  const end = Date.now() + duration;

  confetti({
    particleCount: 160,
    spread: 100,
    startVelocity: 48,
    scalar: 1.1,
    origin: { y: 0.45 },
    colors: COLORS,
  });

  (function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 65, origin: { x: 0, y: 0.7 }, colors: COLORS, scalar: 0.9 });
    confetti({ particleCount: 5, angle: 120, spread: 65, origin: { x: 1, y: 0.7 }, colors: COLORS, scalar: 0.9 });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
