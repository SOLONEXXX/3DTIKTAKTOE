import { describe, expect, it } from 'vitest';
import { applyMove, checkWinner, createBoard, getWinLines, isBoardFull, toIndex } from './board';

describe('board', () => {
  it('creates an empty board of the right size', () => {
    const board = createBoard(3);
    expect(board).toHaveLength(27);
    expect(board.every((cell) => cell === null)).toBe(true);
  });

  it('counts the correct number of win lines for 3x3x3 and 4x4x4', () => {
    expect(getWinLines(3)).toHaveLength(49);
    expect(getWinLines(4)).toHaveLength(76);
  });

  it('detects a straight line win along a single axis', () => {
    let board = createBoard(3);
    board = applyMove(board, toIndex(3, 0, 0, 0), 'X');
    board = applyMove(board, toIndex(3, 1, 0, 0), 'X');
    board = applyMove(board, toIndex(3, 2, 0, 0), 'X');

    const result = checkWinner(board, 3);
    expect(result?.winner).toBe('X');
    expect([...(result?.line ?? [])].sort()).toEqual(
      [toIndex(3, 0, 0, 0), toIndex(3, 1, 0, 0), toIndex(3, 2, 0, 0)].sort(),
    );
  });

  it('detects a body-diagonal win through the center', () => {
    let board = createBoard(3);
    board = applyMove(board, toIndex(3, 0, 0, 0), 'O');
    board = applyMove(board, toIndex(3, 1, 1, 1), 'O');
    board = applyMove(board, toIndex(3, 2, 2, 2), 'O');

    expect(checkWinner(board, 3)?.winner).toBe('O');
  });

  it('does not report a winner for a mixed line', () => {
    let board = createBoard(3);
    board = applyMove(board, toIndex(3, 0, 0, 0), 'X');
    board = applyMove(board, toIndex(3, 1, 0, 0), 'O');
    board = applyMove(board, toIndex(3, 2, 0, 0), 'X');

    expect(checkWinner(board, 3)).toBeNull();
  });

  it('treats blocked cells as filled when checking for a full board', () => {
    const board = createBoard(3);
    const blocked = new Set([0, 1, 2]);
    const filled = board.map((_, i) => (blocked.has(i) ? null : 'X')) as typeof board;

    expect(isBoardFull(filled, blocked)).toBe(true);
    expect(isBoardFull(filled)).toBe(false);
  });
});
