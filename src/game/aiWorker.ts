import { getBotMove } from './ai';
import type { Board, BoardSize, Difficulty, Player } from './types';

export interface AiRequest {
  board: Board;
  size: BoardSize;
  player: Player;
  difficulty: Difficulty;
  requestId: number;
}

export interface AiResponse {
  index: number | null;
  requestId: number;
}

self.onmessage = (event: MessageEvent<AiRequest>) => {
  const { board, size, player, difficulty, requestId } = event.data;
  const index = getBotMove(board, size, player, difficulty);
  const response: AiResponse = { index, requestId };
  (self as unknown as Worker).postMessage(response);
};
