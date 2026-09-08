import { getBotMove } from './ai';
import type { Board, BoardSize, Difficulty, Player } from './types';
import type { AiRequest, AiResponse } from './aiWorker';

let worker: Worker | null = null;
let requestCounter = 0;
const pending = new Map<number, (index: number | null) => void>();

function getWorker(): Worker | null {
  if (worker) return worker;
  try {
    worker = new Worker(new URL('./aiWorker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<AiResponse>) => {
      const resolve = pending.get(event.data.requestId);
      if (resolve) {
        resolve(event.data.index);
        pending.delete(event.data.requestId);
      }
    };
    worker.onerror = () => {
      worker = null;
    };
  } catch {
    worker = null;
  }
  return worker;
}

export function requestBotMove(
  board: Board,
  size: BoardSize,
  player: Player,
  difficulty: Difficulty,
): Promise<number | null> {
  const activeWorker = getWorker();
  if (!activeWorker) {
    return Promise.resolve(getBotMove(board, size, player, difficulty));
  }

  const requestId = requestCounter++;
  const request: AiRequest = { board, size, player, difficulty, requestId };
  return new Promise((resolve) => {
    pending.set(requestId, resolve);
    activeWorker.postMessage(request);
  });
}
