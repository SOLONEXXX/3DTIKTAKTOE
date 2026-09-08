import { describe, expect, it } from 'vitest';
import { CAMPAIGN_MAX_LEVEL, campaignBlockedCells, campaignBlockedCount, campaignDifficulty } from './campaign';

describe('campaignDifficulty', () => {
  it('stays within 3..100 and never decreases as levels rise', () => {
    let prev = 0;
    for (let level = 1; level <= CAMPAIGN_MAX_LEVEL; level++) {
      const difficulty = campaignDifficulty(level);
      expect(difficulty).toBeGreaterThanOrEqual(3);
      expect(difficulty).toBeLessThanOrEqual(100);
      expect(difficulty).toBeGreaterThanOrEqual(prev);
      prev = difficulty;
    }
  });
});

describe('campaignBlockedCount', () => {
  it('has no blocked cells before each board size\'s configured start level', () => {
    expect(campaignBlockedCount(1, 3)).toBe(0);
    expect(campaignBlockedCount(40, 3)).toBe(0);
    expect(campaignBlockedCount(1, 4)).toBe(0);
    expect(campaignBlockedCount(30, 4)).toBe(0);
  });

  it('increases monotonically and caps at the configured maximum', () => {
    for (const size of [3, 4] as const) {
      let prev = 0;
      for (let level = 1; level <= CAMPAIGN_MAX_LEVEL; level++) {
        const count = campaignBlockedCount(level, size);
        expect(count).toBeGreaterThanOrEqual(prev);
        prev = count;
      }
      expect(prev).toBeLessThanOrEqual(size === 3 ? 5 : 10);
    }
  });
});

describe('campaignBlockedCells', () => {
  it('is deterministic for the same level and board size', () => {
    const a = campaignBlockedCells(60, 4);
    const b = campaignBlockedCells(60, 4);
    expect([...a].sort()).toEqual([...b].sort());
  });

  it('matches the count reported by campaignBlockedCount', () => {
    for (let level = 1; level <= CAMPAIGN_MAX_LEVEL; level += 11) {
      expect(campaignBlockedCells(level, 4).size).toBe(campaignBlockedCount(level, 4));
    }
  });

  it('never blocks a body-diagonal corner cell', () => {
    const size = 4;
    const corners = new Set<number>();
    for (const x of [0, size - 1]) {
      for (const y of [0, size - 1]) {
        for (const z of [0, size - 1]) {
          corners.add(x + y * size + z * size * size);
        }
      }
    }
    for (let level = 1; level <= CAMPAIGN_MAX_LEVEL; level += 7) {
      for (const cell of campaignBlockedCells(level, size)) {
        expect(corners.has(cell)).toBe(false);
      }
    }
  });
});
