import confetti from 'canvas-confetti';

const COLORS = ['#ff4757', '#3fa9ff', '#ffd35c', '#39ff88', '#a855f7', '#ff8a3d'];

let activeFrame: number | null = null;
let activeTimeout: ReturnType<typeof setTimeout> | null = null;

/** Stops any in-flight confetti animation loop — call this whenever the game screen is
 * left, so a burst never bleeds into the next screen and looks like a second animation. */
export function stopConfetti() {
  if (activeFrame !== null) {
    cancelAnimationFrame(activeFrame);
    activeFrame = null;
  }
  if (activeTimeout !== null) {
    clearTimeout(activeTimeout);
    activeTimeout = null;
  }
}

/** A proper confetti-cannon burst: a big center pop plus streams from both sides. */
export function fireWinConfetti() {
  stopConfetti();
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
    if (Date.now() < end) {
      activeFrame = requestAnimationFrame(frame);
    } else {
      activeFrame = null;
    }
  })();
}

/** A brief, single pop — used for Level-Modus, where wins come one after another and a
 * long multi-second cannon show gets in the way of immediately continuing. */
export function fireLevelConfetti() {
  stopConfetti();
  confetti({
    particleCount: 70,
    spread: 80,
    startVelocity: 38,
    scalar: 0.9,
    origin: { y: 0.4 },
    colors: COLORS,
  });
}
