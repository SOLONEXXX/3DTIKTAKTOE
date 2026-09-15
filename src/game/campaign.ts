import type { BoardSize } from './types';

/** Levels are endless; this is only the point where the difficulty curve has saturated. */
export const CAMPAIGN_SOFT_CAP = 45;
export const CAMPAIGN_SIZES: BoardSize[] = [3, 4];

interface BlockedConfig {
  startLevel: number;
  every: number;
  max: number;
}

// Blocked cells now start much earlier — they're the second difficulty axis once raw bot
// skill has saturated, and they make mid-game levels feel structurally different.
const BLOCKED_CONFIG: Record<BoardSize, BlockedConfig> = {
  3: { startLevel: 16, every: 6, max: 4 },
  4: { startLevel: 13, every: 4, max: 12 },
};

/** Deterministic PRNG (mulberry32) so a given level always generates the same layout. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Bot strength for a campaign level, as a saturating exponential.
 *
 * The old curve was linear-ish over 100 levels, so the first ~30 levels were all
 * near-random opponents — players won without learning anything and got bored.
 * This one gives a guaranteed-feeling win for the first two or three levels, a
 * noticeable opponent by level 5, a genuine challenge from level 8-10 on, and
 * near-perfect play past level 30 (where blocked cells take over as the ramp).
 *
 *   L1 ≈ 4%   L3 ≈ 21%   L5 ≈ 34%   L8 ≈ 50%   L12 ≈ 65%
 *   L16 ≈ 76%  L20 ≈ 84%  L30 ≈ 94%  L45 ≈ 98%
 */
export function campaignDifficulty(level: number): number {
  const clamped = Math.max(1, level);
  const value = 100 * (1 - Math.exp(-(clamped - 0.5) / 11));
  return Math.min(100, Math.max(3, Math.round(value)));
}

export function campaignBlockedCount(level: number, size: BoardSize): number {
  const cfg = BLOCKED_CONFIG[size];
  if (level < cfg.startLevel) return 0;
  return Math.min(cfg.max, Math.floor((level - cfg.startLevel) / cfg.every) + 1);
}

/** Deterministic set of blocked cell indices for a level, avoiding the 8 body-diagonal corners. */
export function campaignBlockedCells(level: number, size: BoardSize): Set<number> {
  const count = campaignBlockedCount(level, size);
  if (count === 0) return new Set();

  const total = size ** 3;
  const corners = new Set<number>();
  for (const x of [0, size - 1]) {
    for (const y of [0, size - 1]) {
      for (const z of [0, size - 1]) {
        corners.add(x + y * size + z * size * size);
      }
    }
  }

  const rand = mulberry32(level * 104729 + size * 7919 + 17);
  const candidates = Array.from({ length: total }, (_, i) => i).filter((i) => !corners.has(i));
  // Fisher-Yates shuffle with the seeded RNG for a reproducible-but-scattered layout.
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  return new Set(candidates.slice(0, count));
}

/**
 * Stars rate *how cleanly* a level was won, which is what gives finished levels a
 * reason to be replayed later once the player has actually gotten good.
 *
 *   ★     won at all
 *   ★★    won using at most size + 2 of your own stones
 *   ★★★   won using at most size + 1 of your own stones
 *
 * `ownStones` is how many stones the winner placed (a perfect line is exactly `size`).
 */
export function starsForWin(ownStones: number, size: BoardSize): number {
  if (ownStones <= size + 1) return 3;
  if (ownStones <= size + 2) return 2;
  return 1;
}

export function starTargets(size: BoardSize): { two: number; three: number } {
  return { two: size + 2, three: size + 1 };
}
