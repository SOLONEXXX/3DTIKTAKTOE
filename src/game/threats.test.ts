import { describe, expect, it } from 'vitest';
import { createBoard, toIndex } from './board';
import { findBoardThreats } from './threats';

describe('findBoardThreats', () => {
  it('finds the cell that completes the player\'s own line', () => {
    const board = createBoard(3);
    board[toIndex(3, 0, 0, 0)] = 'X';
    board[toIndex(3, 1, 0, 0)] = 'X';

    const threats = findBoardThreats(board, 3, 'X');
    expect(threats.winning).toContain(toIndex(3, 2, 0, 0));
    expect(threats.danger).toHaveLength(0);
  });

  it('flags the cell the opponent would win on', () => {
    const board = createBoard(3);
    board[toIndex(3, 0, 1, 0)] = 'O';
    board[toIndex(3, 1, 1, 0)] = 'O';

    const threats = findBoardThreats(board, 3, 'X');
    expect(threats.danger).toContain(toIndex(3, 2, 1, 0));
    expect(threats.winning).toHaveLength(0);
  });

  it('ignores lines that both players have already contested', () => {
    const board = createBoard(3);
    board[toIndex(3, 0, 0, 0)] = 'X';
    board[toIndex(3, 1, 0, 0)] = 'O';

    const threats = findBoardThreats(board, 3, 'X');
    expect(threats.winning).toHaveLength(0);
    expect(threats.danger).toHaveLength(0);
  });

  it('treats a blocked cell as making the line dead', () => {
    const board = createBoard(3);
    board[toIndex(3, 0, 0, 0)] = 'X';
    board[toIndex(3, 1, 0, 0)] = 'X';
    const blocked = new Set([toIndex(3, 2, 0, 0)]);

    const threats = findBoardThreats(board, 3, 'X', blocked);
    expect(threats.winning).not.toContain(toIndex(3, 2, 0, 0));
  });

  it('spots threats along a body diagonal, which is the easy one to miss in 3D', () => {
    const board = createBoard(4);
    board[toIndex(4, 0, 0, 0)] = 'O';
    board[toIndex(4, 1, 1, 1)] = 'O';
    board[toIndex(4, 2, 2, 2)] = 'O';

    const threats = findBoardThreats(board, 4, 'X');
    expect(threats.danger).toContain(toIndex(4, 3, 3, 3));
  });
});
