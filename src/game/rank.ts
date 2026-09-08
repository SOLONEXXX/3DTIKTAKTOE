import type { Stats } from './store';

export interface RankTier {
  name: string;
  icon: string;
  minScore: number;
}

/** Local, device-only progression rank for online play — there's no server to run a
 * real matchmaking rating on, so this is derived from net wins on this device. */
const TIERS: RankTier[] = [
  { name: 'Unbewertet', icon: '⚪', minScore: -Infinity },
  { name: 'Bronze', icon: '🥉', minScore: 0 },
  { name: 'Silber', icon: '🥈', minScore: 5 },
  { name: 'Gold', icon: '🥇', minScore: 12 },
  { name: 'Platin', icon: '💎', minScore: 22 },
  { name: 'Meister', icon: '👑', minScore: 35 },
];

export function rankScore(stats: Stats): number {
  return stats.wins - stats.losses;
}

export function getRank(stats: Stats): RankTier {
  const score = rankScore(stats);
  let best = TIERS[0];
  for (const tier of TIERS) {
    if (score >= tier.minScore) best = tier;
  }
  return best;
}
