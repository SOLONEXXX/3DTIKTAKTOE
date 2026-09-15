/**
 * CUBE RATING — the ladder's custom Elo variant.
 *
 * Differences from textbook Elo, all of them deliberate retention choices:
 *
 *  1. Placement games use a very large K so new players reach their real bracket in
 *     ~10 matches instead of ~100. Nobody sticks around for a hundred mismatched games.
 *  2. K shrinks as rating rises, so the top of the ladder is stable and worth defending.
 *  3. Tier floors: once a tier is reached, rating can never fall back out of it. Losing
 *     a session should cost divisions, never a whole rank — that cliff is the single
 *     biggest quit trigger in competitive casual games.
 *  4. Win streaks pay a small bonus, so a hot session climbs visibly fast.
 *  5. Seasons soft-reset halfway to the mean, which re-opens the climb without erasing
 *     the player's proven skill.
 */

export const START_RATING = 1000;
export const PLACEMENT_GAMES = 10;

export interface Tier {
  id: string;
  name: string;
  icon: string;
  min: number;
  color: string;
  /** Grandmaster is open-ended and has no divisions. */
  divisions: number;
}

export const TIERS: Tier[] = [
  { id: 'bronze', name: 'Bronze', icon: '🥉', min: 0, color: '#c98f5a', divisions: 3 },
  { id: 'silver', name: 'Silber', icon: '🥈', min: 1200, color: '#c9ccd6', divisions: 3 },
  { id: 'gold', name: 'Gold', icon: '🥇', min: 1400, color: '#ffd35c', divisions: 3 },
  { id: 'platinum', name: 'Platin', icon: '💠', min: 1600, color: '#7cf9ff', divisions: 3 },
  { id: 'diamond', name: 'Diamant', icon: '💎', min: 1800, color: '#8fd6ff', divisions: 3 },
  { id: 'master', name: 'Meister', icon: '👑', min: 2000, color: '#c9a2ff', divisions: 3 },
  { id: 'grandmaster', name: 'Großmeister', icon: '🔥', min: 2200, color: '#ff5d73', divisions: 1 },
];

export interface RankInfo {
  tier: Tier;
  tierIndex: number;
  /** 1 = highest division inside the tier. Always 1 for Grandmaster. */
  division: number;
  label: string;
  /** Rating at which the next division/tier starts, or null at the very top. */
  nextAt: number | null;
  /** 0..1 progress towards the next division. */
  progress: number;
  /** Rating this player can never drop below again. */
  floor: number;
}

const ROMAN = ['', 'I', 'II', 'III'];

export function tierIndexForRating(rating: number): number {
  let index = 0;
  for (let i = 0; i < TIERS.length; i++) {
    if (rating >= TIERS[i].min) index = i;
  }
  return index;
}

export function rankInfo(rating: number): RankInfo {
  const tierIndex = tierIndexForRating(rating);
  const tier = TIERS[tierIndex];
  const next = TIERS[tierIndex + 1];

  if (!next) {
    return {
      tier,
      tierIndex,
      division: 1,
      label: tier.name,
      nextAt: null,
      progress: 1,
      floor: tier.min,
    };
  }

  const span = next.min - tier.min;
  const step = span / tier.divisions;
  const into = rating - tier.min;
  const divisionFromBottom = Math.min(tier.divisions - 1, Math.floor(into / step));
  const division = tier.divisions - divisionFromBottom;
  const divisionStart = tier.min + divisionFromBottom * step;
  const divisionEnd = divisionStart + step;

  return {
    tier,
    tierIndex,
    division,
    label: tier.divisions > 1 ? `${tier.name} ${ROMAN[division] ?? division}` : tier.name,
    nextAt: Math.round(divisionEnd),
    progress: Math.min(1, Math.max(0, (rating - divisionStart) / step)),
    floor: tier.min,
  };
}

export function kFactor(rating: number, gamesPlayed: number): number {
  if (gamesPlayed < PLACEMENT_GAMES) return 60;
  if (rating < 1400) return 32;
  if (rating < 1800) return 26;
  if (rating < 2200) return 20;
  return 16;
}

export function expectedScore(playerRating: number, opponentRating: number): number {
  return 1 / (1 + 10 ** ((opponentRating - playerRating) / 400));
}

export interface RatingChange {
  delta: number;
  newRating: number;
  expected: number;
  streakBonus: number;
  /** True when a tier floor absorbed part of the loss. */
  floored: boolean;
}

/**
 * @param score 1 = win, 0.5 = draw, 0 = loss
 * @param winStreak consecutive wins *before* this match
 * @param peakTierIndex highest tier ever reached — sets the floor
 */
export function applyMatch(
  rating: number,
  opponentRating: number,
  score: number,
  gamesPlayed: number,
  winStreak: number,
  peakTierIndex: number,
): RatingChange {
  const expected = expectedScore(rating, opponentRating);
  const k = kFactor(rating, gamesPlayed);
  let delta = Math.round(k * (score - expected));

  let streakBonus = 0;
  if (score === 1) {
    streakBonus = Math.min(12, Math.max(0, winStreak - 1) * 3);
    delta += streakBonus;
    if (delta < 1) delta = 1;
  } else if (score === 0 && delta > -1) {
    delta = -1;
  }

  const raw = rating + delta;
  const floor = TIERS[Math.min(peakTierIndex, TIERS.length - 1)].min;
  const newRating = Math.max(floor, raw);

  return {
    delta: newRating - rating,
    newRating,
    expected,
    streakBonus,
    floored: raw < floor,
  };
}

/** Bot strength that should feel like a ~50/50 match at this rating. */
export function botDifficultyForRating(rating: number): number {
  return Math.min(100, Math.max(5, Math.round(30 + (rating - START_RATING) * 0.055)));
}

const OPPONENT_NAMES = [
  'Kyra', 'Volt', 'Nox', 'Mira', 'Zeno', 'Ash', 'Juno', 'Rax', 'Eve', 'Onyx',
  'Sable', 'Pyx', 'Lumen', 'Vex', 'Tessa', 'Corvi', 'Nyx', 'Bolt', 'Ira', 'Quill',
];

export interface LadderOpponent {
  name: string;
  rating: number;
  difficulty: number;
}

/** Pick a plausible ladder opponent near the player's rating. */
export function matchmakeOpponent(playerRating: number): LadderOpponent {
  const spread = 140;
  const offset = Math.round((Math.random() * 2 - 1) * spread);
  const rating = Math.max(600, playerRating + offset);
  const name = OPPONENT_NAMES[Math.floor(Math.random() * OPPONENT_NAMES.length)];
  return { name, rating, difficulty: botDifficultyForRating(rating) };
}

// ---------------------------------------------------------------------------
// Seasons

export const SEASON_LENGTH_DAYS = 14;
const SEASON_EPOCH = Date.UTC(2026, 0, 5); // Monday
const DAY_MS = 24 * 60 * 60 * 1000;

export function seasonNumber(now: number = Date.now()): number {
  return Math.max(1, Math.floor((now - SEASON_EPOCH) / (SEASON_LENGTH_DAYS * DAY_MS)) + 1);
}

export function seasonEndsAt(now: number = Date.now()): number {
  const season = seasonNumber(now);
  return SEASON_EPOCH + season * SEASON_LENGTH_DAYS * DAY_MS;
}

export function daysLeftInSeason(now: number = Date.now()): number {
  return Math.max(0, Math.ceil((seasonEndsAt(now) - now) / DAY_MS));
}

/** Halfway pull back towards the starting rating when a new season begins. */
export function softResetRating(rating: number): number {
  return Math.round(START_RATING + (rating - START_RATING) * 0.5);
}
