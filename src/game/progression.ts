import type { GameMode } from './types';

/**
 * Meta progression: every single match has to hand back *something*, because the
 * "I always made progress" feeling is what carries a casual player from session two
 * into week two. Losses pay out too — just less.
 */

export interface RewardLine {
  /** i18n key for the reason this reward was granted. */
  key: string;
  xp: number;
  shards: number;
  /** Optional interpolation value (star count, round number, …). */
  amount?: number;
}

export interface MatchRewards {
  xp: number;
  shards: number;
  lines: RewardLine[];
}

export interface LevelProgress {
  level: number;
  xpIntoLevel: number;
  xpForNext: number;
  /** 0..1 within the current level. */
  progress: number;
}

/** XP needed to get from `level` to `level + 1`. Gentle early, steady later. */
export function xpForLevel(level: number): number {
  return 120 + Math.max(0, level - 1) * 60;
}

export function levelFromTotalXp(totalXp: number): LevelProgress {
  let level = 1;
  let remaining = Math.max(0, Math.floor(totalXp));
  // Cheap loop: even a very dedicated player stays in the low hundreds of levels.
  for (;;) {
    const need = xpForLevel(level);
    if (remaining < need) {
      return { level, xpIntoLevel: remaining, xpForNext: need, progress: need > 0 ? remaining / need : 0 };
    }
    remaining -= need;
    level += 1;
  }
}

export type MatchOutcome = 'win' | 'loss' | 'draw';

interface RewardInput {
  mode: GameMode;
  outcome: MatchOutcome;
  /** Campaign only: stars earned this attempt (0-3). */
  stars?: number;
  /** Campaign only: true the first time this level is cleared. */
  firstClear?: boolean;
  /** Survival only: how many rounds the run lasted. */
  survivalRounds?: number;
  /** Daily only: the streak length after this completion. */
  dailyStreak?: number;
}

const BASE: Record<MatchOutcome, { xp: number; shards: number }> = {
  win: { xp: 30, shards: 20 },
  draw: { xp: 14, shards: 8 },
  loss: { xp: 8, shards: 4 },
};

export function matchRewards(input: RewardInput): MatchRewards {
  const lines: RewardLine[] = [];
  const base = BASE[input.outcome];
  // Pass & play is scored as a draw because there is no "you" to win or lose, but
  // labelling it "draw" on the result card would just look like a bug to the player.
  const baseKey = input.mode === 'local' ? 'reward.base.local' : `reward.base.${input.outcome}`;
  lines.push({ key: baseKey, xp: base.xp, shards: base.shards });

  if (input.mode === 'ranked' && input.outcome === 'win') {
    lines.push({ key: 'reward.ranked', xp: 20, shards: 10 });
  }

  if (input.mode === 'campaign') {
    if (input.firstClear) {
      lines.push({ key: 'reward.firstClear', xp: 40, shards: 30 });
    }
    if (input.stars && input.stars > 0) {
      lines.push({ key: 'reward.stars', xp: 12 * input.stars, shards: 10 * input.stars, amount: input.stars });
    }
  }

  if (input.mode === 'survival' && input.survivalRounds) {
    lines.push({
      key: 'reward.survival',
      xp: 20 * input.survivalRounds,
      shards: 15 * input.survivalRounds,
      amount: input.survivalRounds,
    });
  }

  if (input.mode === 'daily' && input.outcome === 'win') {
    const streak = Math.max(1, input.dailyStreak ?? 1);
    const streakBonus = Math.min(5, streak);
    lines.push({ key: 'reward.daily', xp: 80, shards: 120 });
    if (streak > 1) {
      lines.push({ key: 'reward.dailyStreak', xp: 10 * streakBonus, shards: 25 * streakBonus, amount: streak });
    }
  }

  return {
    xp: lines.reduce((sum, l) => sum + l.xp, 0),
    shards: lines.reduce((sum, l) => sum + l.shards, 0),
    lines,
  };
}

/** Shards handed out for each player level gained. */
export function levelUpShards(newLevel: number): number {
  return 100 + newLevel * 25;
}
