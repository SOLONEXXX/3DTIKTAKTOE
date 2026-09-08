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

function orderedCandidates(board: Board, size: BoardSize, player: Player, limit: number): number[] {
  const empties = getEmptyIndices(board);
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
): number {
  const result = checkWinner(board, size);
  if (result) {
    if (result.winner === aiPlayer) return WIN_SCORE + depth;
    return -WIN_SCORE - depth;
  }
  const empties = getEmptyIndices(board);
  if (depth === 0 || empties.length === 0) {
    return evaluateBoard(board, size, aiPlayer);
  }

  const current = maximizing ? aiPlayer : otherPlayer(aiPlayer);
  const candidates = orderedCandidates(board, size, current, candidateLimit);

  if (maximizing) {
    let value = -Infinity;
    for (const idx of candidates) {
      const child = applyMove(board, idx, current);
      value = Math.max(value, minimax(child, size, depth - 1, alpha, beta, false, aiPlayer, candidateLimit));
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }
    return value;
  } else {
    let value = Infinity;
    for (const idx of candidates) {
      const child = applyMove(board, idx, current);
      value = Math.min(value, minimax(child, size, depth - 1, alpha, beta, true, aiPlayer, candidateLimit));
      beta = Math.min(beta, value);
      if (alpha >= beta) break;
    }
    return value;
  }
}

interface DifficultyConfig {
  depth: number;
  candidateLimit: number;
  blockChance: number;
  randomness: number;
}

function configFor(difficulty: Difficulty, size: BoardSize): DifficultyConfig {
  if (difficulty === 'easy') {
    return { depth: 1, candidateLimit: size === 3 ? 27 : 16, blockChance: 0.5, randomness: 0.6 };
  }
  if (difficulty === 'medium') {
    return { depth: size === 3 ? 3 : 2, candidateLimit: size === 3 ? 14 : 10, blockChance: 1, randomness: 0.15 };
  }
  return { depth: size === 3 ? 5 : 3, candidateLimit: size === 3 ? 16 : 10, blockChance: 1, randomness: 0 };
}

function findImmediateWin(board: Board, size: BoardSize, player: Player): number | null {
  for (const idx of getEmptyIndices(board)) {
    const trial = applyMove(board, idx, player);
    if (checkWinner(trial, size)?.winner === player) return idx;
  }
  return null;
}

function findThreats(board: Board, size: BoardSize, opponent: Player): number[] {
  const threats: number[] = [];
  for (const idx of getEmptyIndices(board)) {
    const trial = applyMove(board, idx, opponent);
    if (checkWinner(trial, size)?.winner === opponent) threats.push(idx);
  }
  return threats;
}

export function getBotMove(board: Board, size: BoardSize, player: Player, difficulty: Difficulty): number | null {
  const empties = getEmptyIndices(board);
  if (empties.length === 0) return null;

  const config = configFor(difficulty, size);
  const opponent = otherPlayer(player);

  const winningMove = findImmediateWin(board, size, player);
  if (winningMove !== null) return winningMove;

  const threats = findThreats(board, size, opponent);
  if (threats.length > 0 && Math.random() < config.blockChance) {
    if (threats.length === 1) return threats[0];
    // Multiple simultaneous threats: search will pick the best available damage control.
  }

  if (difficulty === 'easy' && Math.random() < config.randomness) {
    return empties[Math.floor(Math.random() * empties.length)];
  }

  const candidates = orderedCandidates(board, size, player, config.candidateLimit);
  let bestScore = -Infinity;
  let bestMoves: number[] = [];

  for (const idx of candidates) {
    const child = applyMove(board, idx, player);
    const score = minimax(child, size, config.depth - 1, -Infinity, Infinity, false, player, config.candidateLimit);
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
