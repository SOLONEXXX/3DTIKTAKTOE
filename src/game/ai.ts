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
  const maxDepth = size === 3 ? 5 : 4;
  const minCandidates = size === 3 ? 6 : 6;
  const maxCandidates = size === 3 ? 18 : 16;

  return {
    depth: Math.max(1, Math.round(1 + skill * (maxDepth - 1))),
    candidateLimit: Math.max(minCandidates, Math.round(minCandidates + skill * (maxCandidates - minCandidates))),
    // Weak bots often fail to notice a free win or an opponent's threat — that's what makes them feel beatable.
    winChance: 0.12 + skill * 0.88,
    blockChance: 0.05 + skill * 0.95,
    // Strong bots always trust the search; weak ones frequently just play something plausible-looking.
    randomness: (1 - skill) * 0.75,
  };
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
  let bestScore = -Infinity;
  let bestMoves: number[] = [];

  for (const idx of candidates) {
    const child = applyMove(board, idx, player);
    const score = minimax(child, size, config.depth - 1, -Infinity, Infinity, false, player, config.candidateLimit, blocked);
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
