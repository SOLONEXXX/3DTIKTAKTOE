export type Player = 'X' | 'O';

export type Cell = Player | null;

export type BoardSize = 3 | 4;

/** Flat board array, index = x + y*size + z*size*size */
export type Board = Cell[];

export interface WinResult {
  winner: Player;
  line: number[];
}

export type GameMode = 'bot' | 'local' | 'online' | 'campaign';

/** Bot strength as a percentage: 1 = near-random, 100 = unbeatable. */
export type Difficulty = number;

export type BackgroundTheme =
  | 'nebula'
  | 'ocean'
  | 'sunset'
  | 'starfield'
  | 'void'
  | 'aurora'
  | 'matrix'
  | 'lava'
  | 'crystal'
  | 'sakura'
  | 'desert'
  | 'abyss'
  | 'plasma'
  | 'frost'
  | 'copper';

export type MarkerColorTheme =
  | 'classic'
  | 'sunsetColors'
  | 'toxic'
  | 'monochrome'
  | 'gold'
  | 'neon'
  | 'ice'
  | 'inferno'
  | 'forest'
  | 'royal'
  | 'candy'
  | 'obsidian';

export type MarkerShape = 'cube' | 'orb' | 'diamond' | 'pyramid' | 'figures' | 'prism' | 'star' | 'ring';

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
