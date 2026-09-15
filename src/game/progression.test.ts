import { describe, expect, it } from 'vitest';
import { levelFromTotalXp, matchRewards, xpForLevel } from './progression';
import { advanceStreak, dailyChallengeFor, streakStillAlive, survivalDifficulty, todayKey, yesterdayKey } from './daily';

describe('levelFromTotalXp', () => {
  it('starts at level 1 with no XP', () => {
    const progress = levelFromTotalXp(0);
    expect(progress.level).toBe(1);
    expect(progress.xpIntoLevel).toBe(0);
    expect(progress.progress).toBe(0);
  });

  it('levels up exactly at the threshold and keeps the remainder', () => {
    const need = xpForLevel(1);
    expect(levelFromTotalXp(need - 1).level).toBe(1);
    const justOver = levelFromTotalXp(need + 10);
    expect(justOver.level).toBe(2);
    expect(justOver.xpIntoLevel).toBe(10);
  });

  it('never reports progress outside 0..1', () => {
    for (let xp = 0; xp < 20000; xp += 137) {
      const progress = levelFromTotalXp(xp);
      expect(progress.progress).toBeGreaterThanOrEqual(0);
      expect(progress.progress).toBeLessThan(1);
    }
  });
});

describe('matchRewards', () => {
  it('pays out for a loss too, just less than for a win', () => {
    const win = matchRewards({ mode: 'bot', outcome: 'win' });
    const loss = matchRewards({ mode: 'bot', outcome: 'loss' });
    expect(loss.xp).toBeGreaterThan(0);
    expect(loss.shards).toBeGreaterThan(0);
    expect(win.xp).toBeGreaterThan(loss.xp);
  });

  it('adds itemised lines for first clears and stars', () => {
    const rewards = matchRewards({ mode: 'campaign', outcome: 'win', firstClear: true, stars: 3 });
    const keys = rewards.lines.map((line) => line.key);
    expect(keys).toContain('reward.firstClear');
    expect(keys).toContain('reward.stars');
    expect(rewards.xp).toBe(rewards.lines.reduce((sum, l) => sum + l.xp, 0));
  });

  it('scales survival payouts with the number of rounds survived', () => {
    const short = matchRewards({ mode: 'survival', outcome: 'loss', survivalRounds: 2 });
    const long = matchRewards({ mode: 'survival', outcome: 'loss', survivalRounds: 9 });
    expect(long.shards).toBeGreaterThan(short.shards);
  });
});

describe('daily challenge', () => {
  it('is identical for the same date and generally differs between dates', () => {
    const a = dailyChallengeFor('2026-09-15');
    const b = dailyChallengeFor('2026-09-15');
    expect(a.difficulty).toBe(b.difficulty);
    expect([...a.blockedCells].sort()).toEqual([...b.blockedCells].sort());

    const week = ['2026-09-16', '2026-09-17', '2026-09-18', '2026-09-19'].map((key) => dailyChallengeFor(key).difficulty);
    expect(new Set([a.difficulty, ...week]).size).toBeGreaterThan(1);
  });

  it('always lands in the "real opponent" difficulty band', () => {
    for (let day = 1; day <= 28; day++) {
      const challenge = dailyChallengeFor(`2026-09-${String(day).padStart(2, '0')}`);
      expect(challenge.difficulty).toBeGreaterThanOrEqual(55);
      expect(challenge.difficulty).toBeLessThanOrEqual(95);
    }
  });
});

describe('streaks', () => {
  it('extends when yesterday was completed and resets after a gap', () => {
    expect(advanceStreak(yesterdayKey(), 4)).toBe(5);
    expect(advanceStreak('2020-01-01', 4)).toBe(1);
    expect(advanceStreak(todayKey(), 4)).toBe(4);
  });

  it('considers a streak dead once nothing was played yesterday or today', () => {
    expect(streakStillAlive(todayKey())).toBe(true);
    expect(streakStillAlive(yesterdayKey())).toBe(true);
    expect(streakStillAlive('2020-01-01')).toBe(false);
    expect(streakStillAlive(null)).toBe(false);
  });
});

describe('survivalDifficulty', () => {
  it('starts gentle and reaches perfect play in the low teens', () => {
    expect(survivalDifficulty(1)).toBeLessThanOrEqual(20);
    expect(survivalDifficulty(6)).toBeGreaterThan(survivalDifficulty(3));
    expect(survivalDifficulty(13)).toBe(100);
  });
});
