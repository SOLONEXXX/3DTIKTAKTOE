import { create } from 'zustand';
import { applyMove, checkWinner, createBoard, isBoardFull, otherPlayer } from './board';
import { requestBotMove } from './aiClient';
import {
  createClockState,
  hasTimedOut,
  startClock,
  switchClock,
  tickClock,
  type ClockState,
} from './timer';
import { MultiplayerSession, type ConnectionStatus, type NetMessage } from './multiplayer';
import type { Board, BoardSize, Difficulty, GameMode, Player, TimeControl, WinResult } from './types';

export type Screen = 'menu' | 'lobby' | 'game';
export type GameOverReason = 'line' | 'draw' | 'timeout' | 'resign' | 'opponent-left' | null;

export function timeControlFromIndex(index: number): TimeControl {
  return TIME_PRESETS[index].timeControl;
}

export const TIME_PRESETS: { label: string; timeControl: TimeControl }[] = [
  { label: '1 min', timeControl: { initialMs: 60_000, incrementMs: 0 } },
  { label: '3 min', timeControl: { initialMs: 3 * 60_000, incrementMs: 2_000 } },
  { label: '5 min', timeControl: { initialMs: 5 * 60_000, incrementMs: 3_000 } },
  { label: '10 min', timeControl: { initialMs: 10 * 60_000, incrementMs: 5_000 } },
  { label: 'No clock', timeControl: { initialMs: 24 * 60 * 60_000, incrementMs: 0 } },
];

interface OnlineState {
  session: MultiplayerSession | null;
  status: ConnectionStatus;
  roomCode: string | null;
  isHost: boolean;
  statusDetail?: string;
}

interface GameState {
  screen: Screen;
  size: BoardSize;
  mode: GameMode;
  difficulty: Difficulty;
  timeControl: TimeControl;
  board: Board;
  turn: Player;
  localPlayer: Player;
  winner: WinResult | null;
  gameOverReason: GameOverReason;
  clock: ClockState;
  botThinking: boolean;
  moveCount: number;
  online: OnlineState;
  /** bumped on every new game/reset so async bot replies from a stale game can be ignored */
  gameGeneration: number;

  goToMenu: () => void;
  startLocalGame: (size: BoardSize, timeControl: TimeControl) => void;
  startBotGame: (size: BoardSize, difficulty: Difficulty, timeControl: TimeControl) => void;
  openOnlineLobby: () => void;
  startOnlineHost: (size: BoardSize, timeControl: TimeControl) => Promise<string>;
  startOnlineJoin: (code: string) => Promise<void>;
  leaveOnline: () => void;
  placeMark: (index: number) => void;
  __applyMove: (index: number) => void;
  resign: () => void;
  rematch: () => void;
  requestRematch: () => void;
  tick: () => void;
  __handleNetMessage: (message: NetMessage) => void;
}

function canPlayerAct(state: Pick<GameState, 'mode' | 'turn' | 'localPlayer' | 'winner' | 'botThinking' | 'online'>) {
  if (state.winner) return false;
  if (state.mode === 'bot' && state.turn !== state.localPlayer) return false;
  if (state.mode === 'bot' && state.botThinking) return false;
  if (state.mode === 'online' && state.turn !== state.localPlayer) return false;
  if (state.mode === 'online' && state.online.status !== 'connected') return false;
  return true;
}

function finishIfGameOver(
  board: Board,
  size: BoardSize,
): { winner: WinResult | null; reason: GameOverReason } {
  const winner = checkWinner(board, size);
  if (winner) return { winner, reason: 'line' };
  if (isBoardFull(board)) return { winner: null, reason: 'draw' };
  return { winner: null, reason: null };
}

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'menu',
  size: 4,
  mode: 'bot',
  difficulty: 'medium',
  timeControl: TIME_PRESETS[2].timeControl,
  board: createBoard(4),
  turn: 'X',
  localPlayer: 'X',
  winner: null,
  gameOverReason: null,
  clock: createClockState(TIME_PRESETS[2].timeControl),
  botThinking: false,
  moveCount: 0,
  gameGeneration: 0,
  online: { session: null, status: 'idle', roomCode: null, isHost: false },

  goToMenu: () => {
    get().online.session?.destroy();
    set({
      screen: 'menu',
      online: { session: null, status: 'idle', roomCode: null, isHost: false },
    });
  },

  startLocalGame: (size, timeControl) => {
    set((s) => ({
      screen: 'game',
      mode: 'local',
      size,
      timeControl,
      board: createBoard(size),
      turn: 'X',
      localPlayer: 'X',
      winner: null,
      gameOverReason: null,
      moveCount: 0,
      botThinking: false,
      clock: startClock(createClockState(timeControl), 'X', Date.now()),
      gameGeneration: s.gameGeneration + 1,
    }));
  },

  startBotGame: (size, difficulty, timeControl) => {
    set((s) => ({
      screen: 'game',
      mode: 'bot',
      size,
      difficulty,
      timeControl,
      board: createBoard(size),
      turn: 'X',
      localPlayer: 'X',
      winner: null,
      gameOverReason: null,
      moveCount: 0,
      botThinking: false,
      clock: startClock(createClockState(timeControl), 'X', Date.now()),
      gameGeneration: s.gameGeneration + 1,
    }));
  },

  openOnlineLobby: () => set({ screen: 'lobby' }),

  startOnlineHost: async (size, timeControl) => {
    const session = new MultiplayerSession({
      onStatusChange: (status, statusDetail) => {
        set((s) => ({ online: { ...s.online, status, statusDetail } }));
        if (status === 'connected') {
          const hostPlayer: Player = Math.random() < 0.5 ? 'X' : 'O';
          session.send({ type: 'init', hostPlayer, size, timeControl });
          set((s) => ({
            screen: 'game',
            mode: 'online',
            size,
            timeControl,
            board: createBoard(size),
            turn: 'X',
            localPlayer: hostPlayer,
            winner: null,
            gameOverReason: null,
            moveCount: 0,
            clock: startClock(createClockState(timeControl), 'X', Date.now()),
            gameGeneration: s.gameGeneration + 1,
          }));
        }
        if (status === 'disconnected' && get().screen === 'game') {
          set({ gameOverReason: 'opponent-left' });
        }
      },
      onMessage: (message) => get().__handleNetMessage(message as NetMessage),
    });
    set({ online: { session, status: 'waiting-for-peer', roomCode: null, isHost: true } });
    const code = await session.hostGame();
    set((s) => ({ online: { ...s.online, roomCode: code } }));
    return code;
  },

  startOnlineJoin: async (code) => {
    const session = new MultiplayerSession({
      onStatusChange: (status, statusDetail) => {
        set((s) => ({ online: { ...s.online, status, statusDetail } }));
        if (status === 'disconnected' && get().screen === 'game') {
          set({ gameOverReason: 'opponent-left' });
        }
      },
      onMessage: (message) => get().__handleNetMessage(message as NetMessage),
    });
    set({ online: { session, status: 'connecting', roomCode: code, isHost: false } });
    await session.joinGame(code);
  },

  leaveOnline: () => {
    get().online.session?.send({ type: 'resign', player: get().localPlayer });
    get().online.session?.destroy();
    set({
      screen: 'menu',
      online: { session: null, status: 'idle', roomCode: null, isHost: false },
    });
  },

  placeMark: (index) => {
    const state = get();
    if (!canPlayerAct(state)) return;
    if (state.board[index] !== null) return;
    get().__applyMove(index);
  },

  __applyMove: (index) => {
    const state = get();
    if (state.winner || state.gameOverReason) return;
    if (state.board[index] !== null) return;

    const player = state.turn;
    const board = applyMove(state.board, index, player);
    const next = otherPlayer(player);
    const { winner, reason } = finishIfGameOver(board, state.size);
    const now = Date.now();
    const clock = winner || reason ? tickClock(state.clock, now) : switchClock(state.clock, player, next, state.timeControl, now);

    set({
      board,
      turn: next,
      winner,
      gameOverReason: reason,
      clock,
      moveCount: state.moveCount + 1,
    });

    if (state.mode === 'online') {
      state.online.session?.send({ type: 'move', index, player });
    }

    if (!winner && !reason && state.mode === 'bot' && next !== state.localPlayer) {
      const generation = state.gameGeneration;
      set({ botThinking: true });
      requestBotMove(board, state.size, next, state.difficulty)
        .then((botIndex) => {
          const fresh = get();
          if (fresh.gameGeneration !== generation || botIndex === null) {
            set({ botThinking: false });
            return;
          }
          set({ botThinking: false });
          get().__applyMove(botIndex);
        })
        .catch(() => {
          set({ botThinking: false });
        });
    }
  },

  resign: () => {
    const state = get();
    if (state.winner || state.gameOverReason) return;
    set({ gameOverReason: 'resign', winner: { winner: otherPlayer(state.localPlayer), line: [] }, clock: tickClock(state.clock, Date.now()) });
    if (state.mode === 'online') {
      state.online.session?.send({ type: 'resign', player: state.localPlayer });
    }
  },

  rematch: () => {
    const state = get();
    set((s) => ({
      board: createBoard(state.size),
      turn: 'X',
      winner: null,
      gameOverReason: null,
      moveCount: 0,
      botThinking: false,
      clock: startClock(createClockState(state.timeControl), 'X', Date.now()),
      gameGeneration: s.gameGeneration + 1,
    }));
  },

  requestRematch: () => {
    const state = get();
    if (state.mode === 'online') {
      state.online.session?.send({ type: 'rematch-offer' });
    } else {
      state.rematch();
    }
  },

  tick: () => {
    const state = get();
    if (state.winner || state.gameOverReason) return;
    if (state.screen !== 'game') return;
    const clock = tickClock(state.clock, Date.now());
    const timedOutPlayer = hasTimedOut(clock);
    if (timedOutPlayer) {
      set({
        clock,
        gameOverReason: 'timeout',
        winner: { winner: otherPlayer(timedOutPlayer), line: [] },
      });
      return;
    }
    set({ clock });
  },

  // Internal — not part of the public component-facing API, but simplest to keep colocated.
  __handleNetMessage: (message: NetMessage) => {
    const state = get();
    if (message.type === 'init') {
      set({
        mode: 'online',
        size: message.size,
        timeControl: message.timeControl,
        localPlayer: otherPlayer(message.hostPlayer),
        board: createBoard(message.size),
        turn: 'X',
        winner: null,
        gameOverReason: null,
        moveCount: 0,
        screen: 'game',
        clock: startClock(createClockState(message.timeControl), 'X', Date.now()),
        gameGeneration: state.gameGeneration + 1,
      });
    } else if (message.type === 'move') {
      const board = applyMove(state.board, message.index, message.player);
      const next = otherPlayer(message.player);
      const { winner, reason } = finishIfGameOver(board, state.size);
      const now = Date.now();
      const clock = winner || reason
        ? tickClock(state.clock, now)
        : switchClock(state.clock, message.player, next, state.timeControl, now);
      set({ board, turn: next, winner, gameOverReason: reason, clock, moveCount: state.moveCount + 1 });
    } else if (message.type === 'resign') {
      set({ gameOverReason: 'resign', winner: { winner: otherPlayer(message.player), line: [] } });
    } else if (message.type === 'rematch-offer') {
      state.online.session?.send({ type: 'rematch-accept' });
      get().rematch();
    } else if (message.type === 'rematch-accept') {
      get().rematch();
    }
  },
}));
