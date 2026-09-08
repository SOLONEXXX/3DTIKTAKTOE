import { getBotMove } from './ai';
import type { Board, BoardSize, Difficulty, Player } from './types';

export interface AiRequest {
  board: Board;
  size: BoardSize;
  player: Player;
  difficulty: Difficulty;
  blockedCells: number[];
  requestId: number;
}

export interface AiResponse {
  index: number | null;
  requestId: number;
}

self.onmessage = (event: MessageEvent<AiRequest>) => {
  const { board, size, player, difficulty, blockedCells, requestId } = event.data;
  const blocked = blockedCells.length > 0 ? new Set(blockedCells) : undefined;
  const index = getBotMove(board, size, player, difficulty, blocked);
  const response: AiResponse = { index, requestId };
  (self as unknown as Worker).postMessage(response);
};
