import { getWinLines, otherPlayer } from './board';
import type { Board, BoardSize, Player } from './types';

export interface BoardThreats {
  /** Empty cells where `player` completes a line right now. */
  winning: number[];
  /** Empty cells where the opponent completes a line right now — i.e. must-block cells. */
  danger: number[];
}

/**
 * Both sides' immediate one-move completions.
 *
 * Shown in-game as rings on the board: a 3D grid hides "your opponent is one move from
 * winning" far too well, and players who lose to something they never saw coming churn.
 * Surfacing it also teaches the geometry, which is the whole skill of this game.
 */
export function findBoardThreats(
  board: Board,
  size: BoardSize,
  player: Player,
  blocked?: ReadonlySet<number>,
): BoardThreats {
  const opponent = otherPlayer(player);
  const winning = new Set<number>();
  const danger = new Set<number>();

  for (const line of getWinLines(size)) {
    let mine = 0;
    let theirs = 0;
    let emptyIndex = -1;
    let emptyCount = 0;

    for (const idx of line) {
      const cell = board[idx];
      if (cell === player) mine++;
      else if (cell === opponent) theirs++;
      else if (blocked?.has(idx)) {
        // A blocked cell can never be filled, so this line is dead.
        emptyCount = -1;
        break;
      } else {
        emptyCount++;
        emptyIndex = idx;
      }
    }

    if (emptyCount !== 1) continue;
    if (mine === size - 1 && theirs === 0) winning.add(emptyIndex);
    else if (theirs === size - 1 && mine === 0) danger.add(emptyIndex);
  }

  return { winning: [...winning], danger: [...danger] };
}
