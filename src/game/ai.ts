import { applyMove, checkWinner, getEmptyIndices, getWinLines, otherPlayer } from './board';
import type { Board, BoardSize, Difficulty, Player } from './types';

/** Score a single line from `player`'s perspective. Lines contested by both sides are dead (0). */
function lineWeight(count: number): number {
  return 10 ** (count - 1);
}

export function evaluateBoard(board: Board, size: BoardSize, player: Player): number {
  const opponent = otherPlayer(player);
  const lines = getWinLines(size);
  let score = 0;

  for (const line of lines) {
    let mine = 0;
    let theirs = 0;
    for (const idx of line) {
      const cell = board[idx];
      if (cell === player) mine++;
      else if (cell === opponent) theirs++;
    }
    if (mine > 0 && theirs > 0) continue;
    if (mine > 0) score += lineWeight(mine);
    else if (theirs > 0) score -= lineWeight(theirs);
  }

  return score;
}

const WIN_SCORE = 1e9;

function orderedCandidates(
  board: Board,
  size: BoardSize,
  player: Player,
  limit: number,
  blocked?: ReadonlySet<number>,
): number[] {
  const empties = getEmptyIndices(board, blocked);
  const scored = empties.map((idx) => {
    const trial = applyMove(board, idx, player);
    return { idx, score: evaluateBoard(trial, size, player) };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.idx);
}

function minimax(
  board: Board,
  size: BoardSize,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  aiPlayer: Player,
  candidateLimit: number,
  blocked: ReadonlySet<number> | undefined,
): number {
  const result = checkWinner(board, size);
  if (result) {
    if (result.winner === aiPlayer) return WIN_SCORE + depth;
    return -WIN_SCORE - depth;
  }
  const empties = getEmptyIndices(board, blocked);
  if (depth === 0 || empties.length === 0) {
    return evaluateBoard(board, size, aiPlayer);
  }

  const current = maximizing ? aiPlayer : otherPlayer(aiPlayer);
  const candidates = orderedCandidates(board, size, current, candidateLimit, blocked);

  if (maximizing) {
    let value = -Infinity;
    for (const idx of candidates) {
      const child = applyMove(board, idx, current);
      value = Math.max(value, minimax(child, size, depth - 1, alpha, beta, false, aiPlayer, candidateLimit, blocked));
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }
    return value;
  } else {
    let value = Infinity;
    for (const idx of candidates) {
      const child = applyMove(board, idx, current);
      value = Math.min(value, minimax(child, size, depth - 1, alpha, beta, true, aiPlayer, candidateLimit, blocked));
      beta = Math.min(beta, value);
      if (alpha >= beta) break;
    }
    return value;
  }
}

interface DifficultyConfig {
  depth: number;
  candidateLimit: number;
  winChance: number;
  blockChance: number;
  randomness: number;
}

function skillOf(difficulty: Difficulty): number {
  return Math.min(100, Math.max(1, difficulty)) / 100;
}

function configFor(difficulty: Difficulty, size: BoardSize): DifficultyConfig {
  const skill = skillOf(difficulty);
  const maxDepth = size === 3 ? 6 : 4;
  const minCandidates = 6;
  const maxCandidates = size === 3 ? 20 : 16;

  return {
    depth: Math.max(1, Math.round(1 + skill * (maxDepth - 1))),
    candidateLimit: Math.max(minCandidates, Math.round(minCandidates + skill * (maxCandidates - minCandidates))),
    // Taking a free win and blocking a loss are the two most basic competences, so they
    // saturate early — a "50%" bot that hands you the game by ignoring an open three
    // reads as broken, not as easy. Below ~30% it still blunders often, which is what
    // makes the first campaign levels a guaranteed confidence win.
    winChance: Math.min(1, 0.25 + skill * 1.6),
    blockChance: Math.min(1, 0.12 + skill * 1.45),
    // Squared falloff: weak bots play mostly noise, mid bots only occasionally drift,
    // strong bots effectively never throw a move away.
    randomness: (1 - skill) ** 2 * 0.65,
  };
}

/**
 * Late in a game the branching factor collapses, so a strong bot can afford to search
 * far deeper than its nominal difficulty allows. Without this, high-level opponents
 * still fumble won endgames, which is exactly where a player expects them to be sharp.
 */
function endgameDepth(emptyCount: number, size: BoardSize, skill: number): number | null {
  if (skill < 0.5) return null;
  if (size === 3 && emptyCount <= 12) return Math.min(emptyCount, 9);
  if (size === 4 && emptyCount <= 10) return Math.min(emptyCount, 6);
  return null;
}

/**
 * How long the bot should "think" before placing, in ms. Instant placement reads as
 * robotic and unfun — but a strong bot should still feel sharp and decisive, while a
 * weak one visibly hesitates (and still blunders anyway).
 */
export function botMoveDelayMs(difficulty: Difficulty): number {
  const skill = skillOf(difficulty);
  const maxDelay = 2200;
  const minDelay = 350;
  const base = maxDelay - skill * (maxDelay - minDelay);
  const jitter = (Math.random() - 0.5) * 300;
  return Math.max(200, Math.round(base + jitter));
}

function findImmediateWin(board: Board, size: BoardSize, player: Player, blocked?: ReadonlySet<number>): number | null {
  for (const idx of getEmptyIndices(board, blocked)) {
    const trial = applyMove(board, idx, player);
    if (checkWinner(trial, size)?.winner === player) return idx;
  }
  return null;
}

function findThreats(board: Board, size: BoardSize, opponent: Player, blocked?: ReadonlySet<number>): number[] {
  const threats: number[] = [];
  for (const idx of getEmptyIndices(board, blocked)) {
    const trial = applyMove(board, idx, opponent);
    if (checkWinner(trial, size)?.winner === opponent) threats.push(idx);
  }
  return threats;
}

export function getBotMove(
  board: Board,
  size: BoardSize,
  player: Player,
  difficulty: Difficulty,
  blocked?: ReadonlySet<number>,
): number | null {
  const empties = getEmptyIndices(board, blocked);
  if (empties.length === 0) return null;

  const config = configFor(difficulty, size);
  const opponent = otherPlayer(player);

  const winningMove = findImmediateWin(board, size, player, blocked);
  if (winningMove !== null && Math.random() < config.winChance) return winningMove;

  const threats = findThreats(board, size, opponent, blocked);
  if (threats.length > 0 && Math.random() < config.blockChance) {
    if (threats.length === 1) return threats[0];
    // Multiple simultaneous threats: search will pick the best available damage control.
  }

  if (Math.random() < config.randomness) {
    return empties[Math.floor(Math.random() * empties.length)];
  }

  const candidates = orderedCandidates(board, size, player, config.candidateLimit, blocked);
  const deepened = endgameDepth(empties.length, size, skillOf(difficulty));
  const searchDepth = Math.max(config.depth, deepened ?? 0);
  let bestScore = -Infinity;
  let bestMoves: number[] = [];

  for (const idx of candidates) {
    const child = applyMove(board, idx, player);
    const score = minimax(child, size, searchDepth - 1, -Infinity, Infinity, false, player, config.candidateLimit, blocked);
    if (score > bestScore) {
      bestScore = score;
      bestMoves = [idx];
    } else if (score === bestScore) {
      bestMoves.push(idx);
    }
  }

  if (bestMoves.length === 0) return empties[Math.floor(Math.random() * empties.length)];
  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}
