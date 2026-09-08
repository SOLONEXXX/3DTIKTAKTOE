export type Player = 'X' | 'O';

export type Cell = Player | null;

export type BoardSize = 3 | 4;

/** Flat board array, index = x + y*size + z*size*size */
export type Board = Cell[];

export interface WinResult {
  winner: Player;
  line: number[];
}

export type GameMode = 'bot' | 'local' | 'online';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface TimeControl {
  /** starting time per player, in milliseconds */
  initialMs: number;
  /** increment added to the player's clock after their move, in milliseconds */
  incrementMs: number;
}

export interface Move {
  index: number;
  player: Player;
  atMs: number;
}
