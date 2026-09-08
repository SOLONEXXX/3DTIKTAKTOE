import type { BoardSize } from './types';

export const CAMPAIGN_MAX_LEVEL = 100;
export const CAMPAIGN_BOARD_SIZE: BoardSize = 4;
export const CAMPAIGN_BLOCKED_START_LEVEL = 31;
export const CAMPAIGN_MAX_BLOCKED = 10;

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

/** Bot difficulty percent for a given campaign level (1..100), easing in early and hard late. */
export function campaignDifficulty(level: number): number {
  const clamped = Math.min(CAMPAIGN_MAX_LEVEL, Math.max(1, level));
  const t = (clamped - 1) / (CAMPAIGN_MAX_LEVEL - 1);
  const eased = Math.pow(t, 1.25);
  return Math.round(3 + eased * 97);
}

export function campaignBlockedCount(level: number): number {
  if (level < CAMPAIGN_BLOCKED_START_LEVEL) return 0;
  return Math.min(CAMPAIGN_MAX_BLOCKED, Math.floor((level - CAMPAIGN_BLOCKED_START_LEVEL) / 5) + 1);
}

/** Deterministic set of blocked cell indices for a level, avoiding the 8 body-diagonal corners. */
export function campaignBlockedCells(level: number, size: BoardSize): Set<number> {
  const count = campaignBlockedCount(level);
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

  const rand = mulberry32(level * 104729 + 17);
  const candidates = Array.from({ length: total }, (_, i) => i).filter((i) => !corners.has(i));
  // Fisher-Yates shuffle with the seeded RNG for a reproducible-but-scattered layout.
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  return new Set(candidates.slice(0, count));
}
