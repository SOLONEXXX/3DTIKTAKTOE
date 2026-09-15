import { describe, expect, it } from 'vitest';
import {
  CAMPAIGN_SOFT_CAP,
  campaignBlockedCells,
  campaignBlockedCount,
  campaignDifficulty,
  starsForWin,
  starTargets,
} from './campaign';

describe('campaignDifficulty', () => {
  it('stays within 3..100 and never decreases as levels rise', () => {
    let prev = 0;
    for (let level = 1; level <= 80; level++) {
      const difficulty = campaignDifficulty(level);
      expect(difficulty).toBeGreaterThanOrEqual(3);
      expect(difficulty).toBeLessThanOrEqual(100);
      expect(difficulty).toBeGreaterThanOrEqual(prev);
      prev = difficulty;
    }
  });

  it('hands out easy early wins but ramps into a real challenge within a handful of levels', () => {
    // The whole point of the curve: win the first couple, then start sweating.
    expect(campaignDifficulty(1)).toBeLessThanOrEqual(10);
    expect(campaignDifficulty(3)).toBeLessThan(30);
    expect(campaignDifficulty(5)).toBeGreaterThanOrEqual(25);
    expect(campaignDifficulty(8)).toBeGreaterThanOrEqual(45);
    expect(campaignDifficulty(12)).toBeGreaterThanOrEqual(60);
    expect(campaignDifficulty(20)).toBeGreaterThanOrEqual(80);
  });

  it('has effectively saturated by the soft cap and stays there for the endless tail', () => {
    expect(campaignDifficulty(CAMPAIGN_SOFT_CAP)).toBeGreaterThanOrEqual(95);
    expect(campaignDifficulty(500)).toBe(100);
  });
});

describe('campaignBlockedCount', () => {
  it('has no blocked cells before each board size\'s configured start level', () => {
    expect(campaignBlockedCount(1, 3)).toBe(0);
    expect(campaignBlockedCount(15, 3)).toBe(0);
    expect(campaignBlockedCount(1, 4)).toBe(0);
    expect(campaignBlockedCount(12, 4)).toBe(0);
  });

  it('increases monotonically and caps at the configured maximum', () => {
    for (const size of [3, 4] as const) {
      let prev = 0;
      for (let level = 1; level <= 200; level++) {
        const count = campaignBlockedCount(level, size);
        expect(count).toBeGreaterThanOrEqual(prev);
        prev = count;
      }
      expect(prev).toBe(size === 3 ? 4 : 12);
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
    for (let level = 1; level <= 90; level += 7) {
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
    for (let level = 1; level <= 90; level += 5) {
      for (const cell of campaignBlockedCells(level, size)) {
        expect(corners.has(cell)).toBe(false);
      }
    }
  });
});

describe('starsForWin', () => {
  it('awards three stars only for a near-perfect line', () => {
    expect(starsForWin(4, 3)).toBe(3);
    expect(starsForWin(5, 3)).toBe(2);
    expect(starsForWin(6, 3)).toBe(1);
    expect(starsForWin(12, 3)).toBe(1);
  });

  it('scales its thresholds with the board size', () => {
    expect(starsForWin(5, 4)).toBe(3);
    expect(starsForWin(6, 4)).toBe(2);
    expect(starsForWin(7, 4)).toBe(1);
    expect(starTargets(4)).toEqual({ two: 6, three: 5 });
  });
});
