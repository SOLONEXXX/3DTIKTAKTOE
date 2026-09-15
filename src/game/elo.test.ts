import { describe, expect, it } from 'vitest';
import {
  applyMatch,
  botDifficultyForRating,
  expectedScore,
  kFactor,
  PLACEMENT_GAMES,
  rankInfo,
  softResetRating,
  START_RATING,
  TIERS,
  tierIndexForRating,
} from './elo';

describe('expectedScore', () => {
  it('is 0.5 for equal ratings and symmetric between the two sides', () => {
    expect(expectedScore(1500, 1500)).toBeCloseTo(0.5, 6);
    expect(expectedScore(1600, 1400) + expectedScore(1400, 1600)).toBeCloseTo(1, 6);
  });

  it('gives the favourite a higher expectation', () => {
    expect(expectedScore(1800, 1200)).toBeGreaterThan(0.9);
  });
});

describe('kFactor', () => {
  it('is largest during placement and shrinks as rating climbs', () => {
    expect(kFactor(START_RATING, 0)).toBeGreaterThan(kFactor(START_RATING, PLACEMENT_GAMES));
    expect(kFactor(1300, 50)).toBeGreaterThan(kFactor(1900, 50));
    expect(kFactor(1900, 50)).toBeGreaterThan(kFactor(2400, 50));
  });
});

describe('applyMatch', () => {
  it('awards points for a win and deducts them for a loss', () => {
    const win = applyMatch(1500, 1500, 1, 50, 0, 0);
    const loss = applyMatch(1500, 1500, 0, 50, 0, 0);
    expect(win.delta).toBeGreaterThan(0);
    expect(loss.delta).toBeLessThan(0);
  });

  it('pays more for beating a stronger opponent than a weaker one', () => {
    const upset = applyMatch(1500, 1900, 1, 50, 0, 0);
    const expected = applyMatch(1500, 1100, 1, 50, 0, 0);
    expect(upset.delta).toBeGreaterThan(expected.delta);
  });

  it('adds a bonus for an ongoing win streak', () => {
    const plain = applyMatch(1500, 1500, 1, 50, 0, 0);
    const hot = applyMatch(1500, 1500, 1, 50, 4, 0);
    expect(hot.delta).toBeGreaterThan(plain.delta);
    expect(hot.streakBonus).toBeGreaterThan(0);
  });

  it('never drops a player out of a tier they have already reached', () => {
    const goldIndex = TIERS.findIndex((tier) => tier.id === 'gold');
    const goldFloor = TIERS[goldIndex].min;
    const result = applyMatch(goldFloor, 2200, 0, 50, 0, goldIndex);
    expect(result.newRating).toBe(goldFloor);
    expect(result.floored).toBe(true);
    expect(result.delta).toBe(0);
  });

  it('still moves the rating by at least a point in each direction', () => {
    const hopelessWin = applyMatch(2400, 800, 1, 50, 0, 0);
    expect(hopelessWin.delta).toBeGreaterThanOrEqual(1);
    const inevitableLoss = applyMatch(800, 2400, 0, 50, 0, 0);
    expect(inevitableLoss.delta).toBeLessThanOrEqual(-1);
  });
});

describe('rankInfo', () => {
  it('reports the right tier and counts divisions downwards', () => {
    expect(rankInfo(START_RATING).tier.id).toBe('bronze');
    const gold = TIERS.find((t) => t.id === 'gold')!;
    expect(rankInfo(gold.min).tier.id).toBe('gold');
    // The bottom of a tier is its lowest division (III), the top is division I.
    expect(rankInfo(gold.min).division).toBe(3);
    expect(rankInfo(gold.min + 199).division).toBe(1);
  });

  it('treats the top tier as open-ended', () => {
    const top = TIERS[TIERS.length - 1];
    const info = rankInfo(top.min + 500);
    expect(info.nextAt).toBeNull();
    expect(info.tier.id).toBe(top.id);
  });

  it('keeps tierIndexForRating consistent with the tier table', () => {
    expect(tierIndexForRating(0)).toBe(0);
    expect(tierIndexForRating(TIERS[3].min)).toBe(3);
    expect(tierIndexForRating(99999)).toBe(TIERS.length - 1);
  });
});

describe('season reset', () => {
  it('pulls ratings halfway back to the starting value', () => {
    expect(softResetRating(START_RATING)).toBe(START_RATING);
    expect(softResetRating(2200)).toBe(1600);
    expect(softResetRating(800)).toBe(900);
  });
});

describe('botDifficultyForRating', () => {
  it('rises with rating and stays inside the difficulty range', () => {
    expect(botDifficultyForRating(START_RATING)).toBeGreaterThanOrEqual(5);
    expect(botDifficultyForRating(600)).toBeGreaterThanOrEqual(5);
    expect(botDifficultyForRating(2400)).toBe(100);
    expect(botDifficultyForRating(1800)).toBeGreaterThan(botDifficultyForRating(1200));
  });
});
