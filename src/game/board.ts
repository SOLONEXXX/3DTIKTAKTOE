import type { Board, BoardSize, Cell, Player, WinResult } from './types';

export function createBoard(size: BoardSize): Board {
  return new Array(size * size * size).fill(null) as Board;
}

export function toIndex(size: BoardSize, x: number, y: number, z: number): number {
  return x + y * size + z * size * size;
}

export function toCoords(size: BoardSize, index: number): [number, number, number] {
  const x = index % size;
  const y = Math.floor(index / size) % size;
  const z = Math.floor(index / (size * size));
  return [x, y, z];
}

/**
 * All 13 unique direction vectors through 3D space (opposite directions collapse
 * to the same line, so we only need half of the 26 neighbor directions).
 */
const DIRECTIONS: [number, number, number][] = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
  [1, 1, 0],
  [1, -1, 0],
  [1, 0, 1],
  [1, 0, -1],
  [0, 1, 1],
  [0, 1, -1],
  [1, 1, 1],
  [1, 1, -1],
  [1, -1, 1],
  [1, -1, -1],
];

const winLineCache = new Map<BoardSize, number[][]>();

/** Every straight line of `size` cells in a row, in any of the 13 axes/diagonals. */
export function getWinLines(size: BoardSize): number[][] {
  const cached = winLineCache.get(size);
  if (cached) return cached;

  const lines: number[][] = [];
  const inBounds = (v: number) => v >= 0 && v < size;

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        for (const [dx, dy, dz] of DIRECTIONS) {
          const endX = x + dx * (size - 1);
          const endY = y + dy * (size - 1);
          const endZ = z + dz * (size - 1);
          if (!inBounds(endX) || !inBounds(endY) || !inBounds(endZ)) continue;

          const line: number[] = [];
          for (let i = 0; i < size; i++) {
            line.push(toIndex(size, x + dx * i, y + dy * i, z + dz * i));
          }
          lines.push(line);
        }
      }
    }
  }

  winLineCache.set(size, lines);
  return lines;
}

export function checkWinner(board: Board, size: BoardSize): WinResult | null {
  const lines = getWinLines(size);
  for (const line of lines) {
    const first = board[line[0]];
    if (!first) continue;
    let allMatch = true;
    for (let i = 1; i < line.length; i++) {
      if (board[line[i]] !== first) {
        allMatch = false;
        break;
      }
    }
    if (allMatch) {
      return { winner: first, line };
    }
  }
  return null;
}

export function isBoardFull(board: Board, blocked?: ReadonlySet<number>): boolean {
  if (!blocked || blocked.size === 0) return board.every((cell) => cell !== null);
  return board.every((cell, i) => cell !== null || blocked.has(i));
}

export function getEmptyIndices(board: Board, blocked?: ReadonlySet<number>): number[] {
  const empties: number[] = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null && !blocked?.has(i)) empties.push(i);
  }
  return empties;
}

export function applyMove(board: Board, index: number, player: Player): Board {
  const next = board.slice();
  next[index] = player;
  return next;
}

export function otherPlayer(player: Player): Player {
  return player === 'X' ? 'O' : 'X';
}

export function cellAt(board: Board, size: BoardSize, x: number, y: number, z: number): Cell {
  return board[toIndex(size, x, y, z)];
}

const linesByCellCache = new Map<BoardSize, number[][][]>();

/** For each cell index, the list of win-lines (as index arrays) passing through it. */
export function getLinesByCell(size: BoardSize): number[][][] {
  const cached = linesByCellCache.get(size);
  if (cached) return cached;

  const lines = getWinLines(size);
  const byCell: number[][][] = Array.from({ length: size ** 3 }, () => []);
  for (const line of lines) {
    for (const idx of line) {
      byCell[idx].push(line);
    }
  }
  linesByCellCache.set(size, byCell);
  return byCell;
}
