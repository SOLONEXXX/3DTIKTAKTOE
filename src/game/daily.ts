import type { BoardSize } from './types';

/**
 * Daily challenge + streak, and the survival ramp.
 *
 * The daily is fully deterministic from the calendar date, so every player on a given
 * day faces the exact same board, difficulty and handicap — that's what makes it worth
 * talking about, and it's the cheapest possible "come back tomorrow" hook for a game
 * with no server.
 */

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

/** Local-date key, e.g. "2026-09-15". Local, not UTC, so the reset lines up with the player's own day. */
export function todayKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function yesterdayKey(now: Date = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() - 1);
  return todayKey(d);
}

function seedFromKey(key: string): number {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export interface DailyChallenge {
  key: string;
  size: BoardSize;
  difficulty: number;
  blockedCells: Set<number>;
  /** Cosmetic label, e.g. "Tag 3 · Hart". */
  toughness: 'normal' | 'hard' | 'brutal';
}

export function dailyChallengeFor(key: string = todayKey()): DailyChallenge {
  const rand = mulberry32(seedFromKey(key));
  const size: BoardSize = rand() < 0.45 ? 3 : 4;
  // Dailies sit in the "clearly a real opponent" band — never trivial, never hopeless.
  const roll = rand();
  const difficulty = Math.round(55 + roll * 40);
  const toughness = difficulty >= 85 ? 'brutal' : difficulty >= 70 ? 'hard' : 'normal';

  const total = size ** 3;
  const blockedTarget = size === 3 ? Math.floor(rand() * 3) : Math.floor(rand() * 6);
  const corners = new Set<number>();
  for (const x of [0, size - 1]) {
    for (const y of [0, size - 1]) {
      for (const z of [0, size - 1]) {
        corners.add(x + y * size + z * size * size);
      }
    }
  }
  const candidates = Array.from({ length: total }, (_, i) => i).filter((i) => !corners.has(i));
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  return {
    key,
    size,
    difficulty,
    blockedCells: new Set(candidates.slice(0, blockedTarget)),
    toughness,
  };
}

/** New streak value after finishing today's challenge. */
export function advanceStreak(lastCompletedKey: string | null, currentStreak: number, now: Date = new Date()): number {
  if (lastCompletedKey === yesterdayKey(now)) return currentStreak + 1;
  if (lastCompletedKey === todayKey(now)) return currentStreak;
  return 1;
}

/** A streak only survives if the last completion was today or yesterday. */
export function streakStillAlive(lastCompletedKey: string | null, now: Date = new Date()): boolean {
  if (!lastCompletedKey) return false;
  return lastCompletedKey === todayKey(now) || lastCompletedKey === yesterdayKey(now);
}

// ---------------------------------------------------------------------------
// Survival

/** Bot strength for round N of a survival run (1-based). Round 12+ is perfect play. */
export function survivalDifficulty(round: number): number {
  return Math.min(100, Math.max(10, 18 + Math.max(0, round - 1) * 7));
}

/** Blocked cells creep in during the late rounds to keep the ramp going past 100% skill. */
export function survivalBlockedCount(round: number, size: BoardSize): number {
  if (round < 8) return 0;
  const step = Math.floor((round - 8) / 2) + 1;
  return Math.min(size === 3 ? 3 : 8, step);
}
