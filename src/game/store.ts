import { create } from 'zustand';
import { applyMove, checkWinner, createBoard, isBoardFull, otherPlayer } from './board';
import { requestBotMove } from './aiClient';
import { botMoveDelayMs } from './ai';
import { campaignBlockedCells, campaignDifficulty, CAMPAIGN_BOARD_SIZE } from './campaign';
import { audio } from './audio';
import {
  createClockState,
  hasTimedOut,
  startClock,
  switchClock,
  tickClock,
  type ClockState,
} from './timer';
import { MultiplayerSession, type ConnectionStatus, type NetMessage } from './multiplayer';
import type {
  BackgroundTheme,
  Board,
  BoardSize,
  Difficulty,
  GameMode,
  MarkerColorTheme,
  MarkerShape,
  Player,
  TimeControl,
  WinResult,
} from './types';

export type Screen = 'home' | 'settings' | 'cosmetics' | 'app-settings' | 'campaign' | 'lobby' | 'game';
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

const UNLIMITED_TIME_CONTROL = TIME_PRESETS[4].timeControl;

const SETTINGS_KEY = 'ttt3d:settings:v2';

interface PersistedSettings {
  size: BoardSize;
  mode: GameMode;
  difficulty: Difficulty;
  timeControlIndex: number;
  background: BackgroundTheme;
  markerColorTheme: MarkerColorTheme;
  markerShape: MarkerShape;
  musicVolume: number;
  sfxVolume: number;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  playerName: string;
  campaignLevel: number;
}

function loadSettings(): Partial<PersistedSettings> {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<PersistedSettings>;
  } catch {
    return {};
  }
}

function saveSettings(patch: Partial<PersistedSettings>) {
  try {
    const current = loadSettings();
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...patch }));
  } catch {
    // Storage unavailable (private browsing, disabled) — settings just won't persist.
  }
}

const persisted = loadSettings();

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
  timeControlIndex: number;
  background: BackgroundTheme;
  markerColorTheme: MarkerColorTheme;
  markerShape: MarkerShape;
  musicVolume: number;
  sfxVolume: number;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  playerName: string;
  /** Persisted resume point / high-water mark — advances the instant a campaign win lands. */
  campaignLevel: number;
  /** The level number actually shown on the current game screen, stable until the next startCampaignLevel. */
  campaignLevelInPlay: number;
  activeTimeControl: TimeControl;
  board: Board;
  blockedCells: Set<number>;
  turn: Player;
  localPlayer: Player;
  winner: WinResult | null;
  gameOverReason: GameOverReason;
  clock: ClockState;
  botThinking: boolean;
  moveCount: number;
  lastMoveIndex: number | null;
  online: OnlineState;
  /** bumped on every new game/reset so async bot replies from a stale game can be ignored */
  gameGeneration: number;

  goHome: () => void;
  goToSettings: () => void;
  goToCosmetics: () => void;
  goToAppSettings: () => void;
  goToCampaign: () => void;
  setSize: (size: BoardSize) => void;
  setMode: (mode: GameMode) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  setTimeControlIndex: (index: number) => void;
  setBackground: (background: BackgroundTheme) => void;
  setMarkerColorTheme: (theme: MarkerColorTheme) => void;
  setMarkerShape: (shape: MarkerShape) => void;
  setMusicVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  setMusicEnabled: (enabled: boolean) => void;
  setSfxEnabled: (enabled: boolean) => void;
  setPlayerName: (name: string) => void;
  playNow: () => void;
  startLocalGame: (size: BoardSize, timeControl: TimeControl) => void;
  startBotGame: (size: BoardSize, difficulty: Difficulty, timeControl: TimeControl) => void;
  startCampaignLevel: (level?: number) => void;
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

function canPlayerAct(
  state: Pick<GameState, 'mode' | 'turn' | 'localPlayer' | 'winner' | 'botThinking' | 'online'>,
) {
  if (state.winner) return false;
  if ((state.mode === 'bot' || state.mode === 'campaign') && state.turn !== state.localPlayer) return false;
  if ((state.mode === 'bot' || state.mode === 'campaign') && state.botThinking) return false;
  if (state.mode === 'online' && state.turn !== state.localPlayer) return false;
  if (state.mode === 'online' && state.online.status !== 'connected') return false;
  return true;
}

function finishIfGameOver(
  board: Board,
  size: BoardSize,
  blocked: ReadonlySet<number>,
): { winner: WinResult | null; reason: GameOverReason } {
  const winner = checkWinner(board, size);
  if (winner) return { winner, reason: 'line' };
  if (isBoardFull(board, blocked)) return { winner: null, reason: 'draw' };
  return { winner: null, reason: null };
}

const DEFAULT_TIME_CONTROL_INDEX = 2;
const EMPTY_BLOCKED: ReadonlySet<number> = new Set();

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'home',
  size: persisted.size ?? 4,
  mode: persisted.mode ?? 'bot',
  difficulty: persisted.difficulty ?? 50,
  timeControlIndex: persisted.timeControlIndex ?? DEFAULT_TIME_CONTROL_INDEX,
  background: persisted.background ?? 'nebula',
  markerColorTheme: persisted.markerColorTheme ?? 'classic',
  markerShape: persisted.markerShape ?? 'cube',
  musicVolume: persisted.musicVolume ?? 0.5,
  sfxVolume: persisted.sfxVolume ?? 0.7,
  musicEnabled: persisted.musicEnabled ?? true,
  sfxEnabled: persisted.sfxEnabled ?? true,
  playerName: persisted.playerName ?? 'Spieler',
  campaignLevel: persisted.campaignLevel ?? 1,
  campaignLevelInPlay: persisted.campaignLevel ?? 1,
  activeTimeControl: timeControlFromIndex(persisted.timeControlIndex ?? DEFAULT_TIME_CONTROL_INDEX),
  board: createBoard(persisted.size ?? 4),
  blockedCells: EMPTY_BLOCKED as Set<number>,
  turn: 'X',
  localPlayer: 'X',
  winner: null,
  gameOverReason: null,
  clock: createClockState(timeControlFromIndex(persisted.timeControlIndex ?? DEFAULT_TIME_CONTROL_INDEX)),
  botThinking: false,
  moveCount: 0,
  lastMoveIndex: null,
  gameGeneration: 0,
  online: { session: null, status: 'idle', roomCode: null, isHost: false },

  goHome: () => {
    get().online.session?.destroy();
    audio.stopMusic();
    set({
      screen: 'home',
      online: { session: null, status: 'idle', roomCode: null, isHost: false },
    });
  },

  goToSettings: () => set({ screen: 'settings' }),
  goToCosmetics: () => set({ screen: 'cosmetics' }),
  goToAppSettings: () => set({ screen: 'app-settings' }),
  goToCampaign: () => set({ screen: 'campaign' }),

  setSize: (size) => {
    saveSettings({ size });
    set({ size });
  },
  setMode: (mode) => {
    saveSettings({ mode });
    set({ mode });
  },
  setDifficulty: (difficulty) => {
    saveSettings({ difficulty });
    set({ difficulty });
  },
  setTimeControlIndex: (timeControlIndex) => {
    saveSettings({ timeControlIndex });
    set({ timeControlIndex });
  },
  setBackground: (background) => {
    saveSettings({ background });
    set({ background });
  },
  setMarkerColorTheme: (markerColorTheme) => {
    saveSettings({ markerColorTheme });
    set({ markerColorTheme });
  },
  setMarkerShape: (markerShape) => {
    saveSettings({ markerShape });
    set({ markerShape });
  },
  setMusicVolume: (musicVolume) => {
    saveSettings({ musicVolume });
    audio.setMusicVolume(musicVolume);
    set({ musicVolume });
  },
  setSfxVolume: (sfxVolume) => {
    saveSettings({ sfxVolume });
    audio.setSfxVolume(sfxVolume);
    set({ sfxVolume });
  },
  setMusicEnabled: (musicEnabled) => {
    saveSettings({ musicEnabled });
    audio.setMusicEnabled(musicEnabled);
    set({ musicEnabled });
  },
  setSfxEnabled: (sfxEnabled) => {
    saveSettings({ sfxEnabled });
    audio.setSfxEnabled(sfxEnabled);
    set({ sfxEnabled });
  },
  setPlayerName: (playerName) => {
    const trimmed = playerName.trim().slice(0, 20) || 'Spieler';
    saveSettings({ playerName: trimmed });
    set({ playerName: trimmed });
  },

  playNow: () => {
    const state = get();
    const timeControl = timeControlFromIndex(state.timeControlIndex);
    if (state.mode === 'online') {
      set({ screen: 'lobby' });
    } else if (state.mode === 'bot') {
      state.startBotGame(state.size, state.difficulty, timeControl);
    } else {
      state.startLocalGame(state.size, timeControl);
    }
  },

  startLocalGame: (size, timeControl) => {
    audio.startMusic();
    set((s) => ({
      screen: 'game',
      mode: 'local',
      size,
      activeTimeControl: timeControl,
      board: createBoard(size),
      blockedCells: EMPTY_BLOCKED as Set<number>,
      turn: 'X',
      localPlayer: 'X',
      winner: null,
      gameOverReason: null,
      moveCount: 0,
      lastMoveIndex: null,
      botThinking: false,
      clock: startClock(createClockState(timeControl), 'X', Date.now()),
      gameGeneration: s.gameGeneration + 1,
    }));
  },

  startBotGame: (size, difficulty, timeControl) => {
    audio.startMusic();
    set((s) => ({
      screen: 'game',
      mode: 'bot',
      size,
      difficulty,
      activeTimeControl: timeControl,
      board: createBoard(size),
      blockedCells: EMPTY_BLOCKED as Set<number>,
      turn: 'X',
      localPlayer: 'X',
      winner: null,
      gameOverReason: null,
      moveCount: 0,
      lastMoveIndex: null,
      botThinking: false,
      clock: startClock(createClockState(timeControl), 'X', Date.now()),
      gameGeneration: s.gameGeneration + 1,
    }));
  },

  startCampaignLevel: (level) => {
    const state = get();
    const targetLevel = level ?? state.campaignLevel;
    const size = CAMPAIGN_BOARD_SIZE;
    const difficulty = campaignDifficulty(targetLevel);
    const blocked = campaignBlockedCells(targetLevel, size);
    audio.startMusic();
    set((s) => ({
      screen: 'game',
      mode: 'campaign',
      size,
      difficulty,
      campaignLevelInPlay: targetLevel,
      activeTimeControl: UNLIMITED_TIME_CONTROL,
      board: createBoard(size),
      blockedCells: blocked,
      turn: 'X',
      localPlayer: 'X',
      winner: null,
      gameOverReason: null,
      moveCount: 0,
      lastMoveIndex: null,
      botThinking: false,
      clock: startClock(createClockState(UNLIMITED_TIME_CONTROL), 'X', Date.now()),
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
          audio.startMusic();
          set((s) => ({
            screen: 'game',
            mode: 'online',
            size,
            activeTimeControl: timeControl,
            board: createBoard(size),
            blockedCells: EMPTY_BLOCKED as Set<number>,
            turn: 'X',
            localPlayer: hostPlayer,
            winner: null,
            gameOverReason: null,
            moveCount: 0,
            lastMoveIndex: null,
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
    audio.stopMusic();
    set({
      screen: 'home',
      online: { session: null, status: 'idle', roomCode: null, isHost: false },
    });
  },

  placeMark: (index) => {
    const state = get();
    if (!canPlayerAct(state)) return;
    if (state.board[index] !== null || state.blockedCells.has(index)) return;
    get().__applyMove(index);
  },

  __applyMove: (index) => {
    const state = get();
    if (state.winner || state.gameOverReason) return;
    if (state.board[index] !== null || state.blockedCells.has(index)) return;

    const player = state.turn;
    const board = applyMove(state.board, index, player);
    const next = otherPlayer(player);
    const { winner, reason } = finishIfGameOver(board, state.size, state.blockedCells);
    const now = Date.now();
    const clock = winner || reason
      ? tickClock(state.clock, now)
      : switchClock(state.clock, player, next, state.activeTimeControl, now);

    audio.playPlace(player);

    set({
      board,
      turn: next,
      winner,
      gameOverReason: reason,
      clock,
      moveCount: state.moveCount + 1,
      lastMoveIndex: index,
    });

    if (state.mode === 'online') {
      state.online.session?.send({ type: 'move', index, player });
    }

    if (winner || reason) {
      if (reason === 'draw') audio.playDraw();
      else if (winner) {
        const localWins = state.mode === 'local' || winner.winner === state.localPlayer;
        if (localWins) audio.playWin();
        else audio.playLose();
      }
      if (state.mode === 'campaign' && winner && winner.winner === state.localPlayer) {
        const nextLevel = state.campaignLevel + 1;
        saveSettings({ campaignLevel: nextLevel });
        set({ campaignLevel: nextLevel });
      }
      return;
    }

    if (state.mode === 'bot' || state.mode === 'campaign') {
      if (next !== state.localPlayer) {
        const generation = state.gameGeneration;
        set({ botThinking: true });
        const delay = new Promise<void>((resolve) => setTimeout(resolve, botMoveDelayMs(state.difficulty)));
        Promise.all([requestBotMove(board, state.size, next, state.difficulty, state.blockedCells), delay])
          .then(([botIndex]) => {
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
    }
  },

  resign: () => {
    const state = get();
    if (state.winner || state.gameOverReason) return;
    audio.playLose();
    set({ gameOverReason: 'resign', winner: { winner: otherPlayer(state.localPlayer), line: [] }, clock: tickClock(state.clock, Date.now()) });
    if (state.mode === 'online') {
      state.online.session?.send({ type: 'resign', player: state.localPlayer });
    }
  },

  rematch: () => {
    const state = get();
    if (state.mode === 'campaign') {
      state.startCampaignLevel(state.campaignLevel);
      return;
    }
    set((s) => ({
      board: createBoard(state.size),
      blockedCells: EMPTY_BLOCKED as Set<number>,
      turn: 'X',
      winner: null,
      gameOverReason: null,
      moveCount: 0,
      lastMoveIndex: null,
      botThinking: false,
      clock: startClock(createClockState(state.activeTimeControl), 'X', Date.now()),
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
      audio.startMusic();
      set({
        mode: 'online',
        size: message.size,
        activeTimeControl: message.timeControl,
        localPlayer: otherPlayer(message.hostPlayer),
        board: createBoard(message.size),
        blockedCells: EMPTY_BLOCKED as Set<number>,
        turn: 'X',
        winner: null,
        gameOverReason: null,
        moveCount: 0,
        lastMoveIndex: null,
        screen: 'game',
        clock: startClock(createClockState(message.timeControl), 'X', Date.now()),
        gameGeneration: state.gameGeneration + 1,
      });
    } else if (message.type === 'move') {
      const board = applyMove(state.board, message.index, message.player);
      const next = otherPlayer(message.player);
      const { winner, reason } = finishIfGameOver(board, state.size, state.blockedCells);
      const now = Date.now();
      const clock = winner || reason
        ? tickClock(state.clock, now)
        : switchClock(state.clock, message.player, next, state.activeTimeControl, now);
      audio.playPlace(message.player);
      if (reason === 'draw') audio.playDraw();
      else if (winner) {
        if (winner.winner === state.localPlayer) audio.playWin();
        else audio.playLose();
      }
      set({ board, turn: next, winner, gameOverReason: reason, clock, moveCount: state.moveCount + 1, lastMoveIndex: message.index });
    } else if (message.type === 'resign') {
      audio.playWin();
      set({ gameOverReason: 'resign', winner: { winner: otherPlayer(message.player), line: [] } });
    } else if (message.type === 'rematch-offer') {
      state.online.session?.send({ type: 'rematch-accept' });
      get().rematch();
    } else if (message.type === 'rematch-accept') {
      get().rematch();
    }
  },
}));

// Sync the audio module with whatever was persisted, so the very first sound played
// already respects the user's saved volume/mute preferences.
{
  const initial = useGameStore.getState();
  audio.setMusicVolume(initial.musicVolume);
  audio.setSfxVolume(initial.sfxVolume);
  audio.setMusicEnabled(initial.musicEnabled);
  audio.setSfxEnabled(initial.sfxEnabled);
}
