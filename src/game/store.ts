import { create } from 'zustand';
import { applyMove, checkWinner, createBoard, isBoardFull, otherPlayer } from './board';
import { requestBotMove } from './aiClient';
import { botMoveDelayMs } from './ai';
import { campaignBlockedCells, campaignDifficulty } from './campaign';
import { audio, type MusicTrack } from './audio';
import {
  createClockState,
  hasTimedOut,
  startClock,
  switchClock,
  tickClock,
  type ClockState,
} from './timer';
import { MultiplayerSession, type ConnectionStatus, type NetMessage } from './multiplayer';
import { haptics } from './haptics';
import { stopConfetti } from './confetti';
import type { Language } from './i18n';
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

export function trackForScreen(screen: Screen, mode: GameMode): MusicTrack {
  if (screen === 'lobby') return 'lobby';
  if (screen === 'game') return mode === 'campaign' ? 'campaign' : 'match';
  return 'menu';
}

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

/** True for the "no clock" preset (and for campaign, which always uses it) — the HUD
 * should render no time readout at all in that case, rather than a 24h countdown. */
export function isUnlimitedTimeControl(tc: TimeControl): boolean {
  return tc.initialMs === UNLIMITED_TIME_CONTROL.initialMs;
}

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
  campaignLevel3: number;
  campaignLevel4: number;
  campaignBoardSize: BoardSize;
  onlineMyColor: string;
  cheatUnlockAll: boolean;
  accessibilityGlyphs: boolean;
  hapticsEnabled: boolean;
  stats: Stats;
  onlineStats: Stats;
  language: Language;
}

export interface Stats {
  wins: number;
  losses: number;
  draws: number;
}

interface HistoryEntry {
  board: Board;
  turn: Player;
  lastMoveIndex: number | null;
  moveCount: number;
  clock: ClockState;
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
  opponentColor: string | null;
  opponentShape: MarkerShape | null;
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
  /** Persisted resume point / high-water mark per board size — advances the instant a campaign win lands. */
  campaignLevel3: number;
  campaignLevel4: number;
  /** Which campaign track is selected on the Level-Modus intro screen. */
  campaignBoardSize: BoardSize;
  /** The level number actually shown on the current game screen, stable until the next startCampaignLevel. */
  campaignLevelInPlay: number;
  /** Single personal color for online play, independent of the X/O paired theme used elsewhere. */
  onlineMyColor: string;
  /** "Creative Coder" cheat code (901399) — bypasses all cosmetic level-gating. */
  cheatUnlockAll: boolean;
  /** Accessibility: overlay a camera-facing X/O glyph on markers, independent of color. */
  accessibilityGlyphs: boolean;
  hapticsEnabled: boolean;
  stats: Stats;
  /** Local, device-only online win/loss record used to derive a "Rang" badge in the lobby. */
  onlineStats: Stats;
  language: Language;
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
  /** Undo stack for local pass-and-play games only. */
  history: HistoryEntry[];
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
  setCampaignBoardSize: (size: BoardSize) => void;
  setOnlineMyColor: (color: string) => void;
  redeemCode: (code: string) => boolean;
  setAccessibilityGlyphs: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  resetStats: () => void;
  setLanguage: (language: Language) => void;
  undo: () => void;
  exitGame: () => void;
  playNow: () => void;
  startLocalGame: (size: BoardSize, timeControl: TimeControl) => void;
  startBotGame: (size: BoardSize, difficulty: Difficulty, timeControl: TimeControl) => void;
  startCampaignLevel: (level?: number, size?: BoardSize) => void;
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
  __recordStat: (result: 'win' | 'loss' | 'draw', online?: boolean) => void;
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
  campaignLevel3: persisted.campaignLevel3 ?? 1,
  campaignLevel4: persisted.campaignLevel4 ?? 1,
  campaignBoardSize: persisted.campaignBoardSize ?? 4,
  campaignLevelInPlay: 1,
  onlineMyColor: persisted.onlineMyColor ?? '#ff4757',
  cheatUnlockAll: persisted.cheatUnlockAll ?? false,
  accessibilityGlyphs: persisted.accessibilityGlyphs ?? false,
  hapticsEnabled: persisted.hapticsEnabled ?? true,
  stats: persisted.stats ?? { wins: 0, losses: 0, draws: 0 },
  onlineStats: persisted.onlineStats ?? { wins: 0, losses: 0, draws: 0 },
  language: persisted.language ?? 'de',
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
  history: [],
  gameGeneration: 0,
  online: { session: null, status: 'idle', roomCode: null, isHost: false, opponentColor: null, opponentShape: null },

  goHome: () => {
    get().online.session?.destroy();
    stopConfetti();
    audio.playTrack('menu');
    set({
      screen: 'home',
      online: { session: null, status: 'idle', roomCode: null, isHost: false, opponentColor: null, opponentShape: null },
    });
  },

  goToSettings: () => {
    audio.playTrack('menu');
    set({ screen: 'settings' });
  },
  goToCosmetics: () => {
    audio.playTrack('menu');
    set({ screen: 'cosmetics' });
  },
  goToAppSettings: () => {
    audio.playTrack('menu');
    set({ screen: 'app-settings' });
  },
  goToCampaign: () => {
    audio.playTrack('menu');
    set({ screen: 'campaign' });
  },

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
    // Allow an empty/whitespace value while the user is actively editing the field —
    // forcing an immediate fallback to 'Spieler' here made the trailing "S" undeletable.
    // The fallback is applied on blur instead (see AppSettingsScreen).
    const next = playerName.slice(0, 20);
    saveSettings({ playerName: next });
    set({ playerName: next });
  },
  setCampaignBoardSize: (campaignBoardSize) => {
    saveSettings({ campaignBoardSize });
    set({ campaignBoardSize });
  },
  setOnlineMyColor: (onlineMyColor) => {
    saveSettings({ onlineMyColor });
    set({ onlineMyColor });
  },
  redeemCode: (code) => {
    if (code.trim() === '901399') {
      saveSettings({ cheatUnlockAll: true });
      set({ cheatUnlockAll: true });
      return true;
    }
    return false;
  },
  setAccessibilityGlyphs: (accessibilityGlyphs) => {
    saveSettings({ accessibilityGlyphs });
    set({ accessibilityGlyphs });
  },
  setHapticsEnabled: (hapticsEnabled) => {
    saveSettings({ hapticsEnabled });
    haptics.setEnabled(hapticsEnabled);
    set({ hapticsEnabled });
  },
  resetStats: () => {
    const stats: Stats = { wins: 0, losses: 0, draws: 0 };
    saveSettings({ stats });
    set({ stats });
  },
  setLanguage: (language) => {
    saveSettings({ language });
    set({ language });
  },
  undo: () => {
    const state = get();
    if (state.mode !== 'local') return;
    if (state.gameOverReason) return;
    const prev = state.history[state.history.length - 1];
    if (!prev) return;
    audio.playClick();
    set({
      board: prev.board,
      turn: prev.turn,
      lastMoveIndex: prev.lastMoveIndex,
      moveCount: prev.moveCount,
      clock: prev.clock,
      winner: null,
      gameOverReason: null,
      history: state.history.slice(0, -1),
    });
  },

  /** The single "back" action used by every game HUD — resigns an in-progress game
   * (so stats/opponents are notified) before returning home, or just goes home if the
   * game already ended naturally. */
  exitGame: () => {
    const state = get();
    if (!state.winner && !state.gameOverReason) {
      state.resign();
    }
    state.goHome();
  },

  playNow: () => {
    const state = get();
    const timeControl = timeControlFromIndex(state.timeControlIndex);
    if (state.mode === 'online') {
      audio.playTrack('lobby');
      set({ screen: 'lobby' });
    } else if (state.mode === 'bot') {
      state.startBotGame(state.size, state.difficulty, timeControl);
    } else {
      state.startLocalGame(state.size, timeControl);
    }
  },

  startLocalGame: (size, timeControl) => {
    audio.playTrack('match');
    const startingPlayer: Player = Math.random() < 0.5 ? 'X' : 'O';
    set((s) => ({
      screen: 'game',
      mode: 'local',
      size,
      activeTimeControl: timeControl,
      board: createBoard(size),
      blockedCells: EMPTY_BLOCKED as Set<number>,
      turn: startingPlayer,
      localPlayer: 'X',
      winner: null,
      gameOverReason: null,
      moveCount: 0,
      lastMoveIndex: null,
      botThinking: false,
      history: [],
      clock: startClock(createClockState(timeControl), startingPlayer, Date.now()),
      gameGeneration: s.gameGeneration + 1,
    }));
  },

  startBotGame: (size, difficulty, timeControl) => {
    audio.playTrack('match');
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
      history: [],
      clock: startClock(createClockState(timeControl), 'X', Date.now()),
      gameGeneration: s.gameGeneration + 1,
    }));
  },

  startCampaignLevel: (level, size) => {
    const state = get();
    const targetSize = size ?? state.campaignBoardSize;
    const targetLevel = level ?? (targetSize === 3 ? state.campaignLevel3 : state.campaignLevel4);
    const difficulty = campaignDifficulty(targetLevel);
    const blocked = campaignBlockedCells(targetLevel, targetSize);
    audio.playTrack('campaign');
    set((s) => ({
      screen: 'game',
      mode: 'campaign',
      size: targetSize,
      campaignBoardSize: targetSize,
      difficulty,
      campaignLevelInPlay: targetLevel,
      activeTimeControl: UNLIMITED_TIME_CONTROL,
      board: createBoard(targetSize),
      blockedCells: blocked,
      turn: 'X',
      localPlayer: 'X',
      winner: null,
      gameOverReason: null,
      moveCount: 0,
      lastMoveIndex: null,
      botThinking: false,
      history: [],
      clock: startClock(createClockState(UNLIMITED_TIME_CONTROL), 'X', Date.now()),
      gameGeneration: s.gameGeneration + 1,
    }));
  },

  openOnlineLobby: () => {
    audio.playTrack('lobby');
    set({ screen: 'lobby' });
  },

  startOnlineHost: async (size, timeControl) => {
    const session = new MultiplayerSession({
      onStatusChange: (status, statusDetail) => {
        set((s) => ({ online: { ...s.online, status, statusDetail } }));
        if (status === 'connected') {
          const hostPlayer: Player = Math.random() < 0.5 ? 'X' : 'O';
          session.send({ type: 'init', hostPlayer, size, timeControl });
          const s0 = get();
          session.send({ type: 'cosmetics', color: s0.onlineMyColor, shape: s0.markerShape });
          audio.playTrack('match');
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
            history: [],
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
    set({ online: { session, status: 'waiting-for-peer', roomCode: null, isHost: true, opponentColor: null, opponentShape: null } });
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
    set({ online: { session, status: 'connecting', roomCode: code, isHost: false, opponentColor: null, opponentShape: null } });
    await session.joinGame(code);
  },

  leaveOnline: () => {
    get().online.session?.send({ type: 'resign', player: get().localPlayer });
    get().online.session?.destroy();
    stopConfetti();
    audio.playTrack('menu');
    set({
      screen: 'home',
      online: { session: null, status: 'idle', roomCode: null, isHost: false, opponentColor: null, opponentShape: null },
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
    if (state.mode === 'local' || player === state.localPlayer) haptics.place();

    const history = state.mode === 'local'
      ? [...state.history, { board: state.board, turn: state.turn, lastMoveIndex: state.lastMoveIndex, moveCount: state.moveCount, clock: state.clock }]
      : state.history;

    set({
      board,
      turn: next,
      winner,
      gameOverReason: reason,
      clock,
      moveCount: state.moveCount + 1,
      lastMoveIndex: index,
      history,
    });

    if (state.mode === 'online') {
      state.online.session?.send({ type: 'move', index, player });
    }

    if (winner || reason) {
      if (reason === 'draw') {
        audio.playDraw();
        if (state.mode === 'bot') get().__recordStat('draw');
      } else if (winner) {
        const localWins = state.mode === 'local' || winner.winner === state.localPlayer;
        if (localWins) {
          audio.playWin();
          haptics.win();
        } else {
          audio.playLose();
          haptics.lose();
        }
        if (state.mode === 'bot') get().__recordStat(winner.winner === state.localPlayer ? 'win' : 'loss');
        if (state.mode === 'online') get().__recordStat(winner.winner === state.localPlayer ? 'win' : 'loss', true);
      }
      if (reason === 'draw' && state.mode === 'online') get().__recordStat('draw', true);
      if (state.mode === 'campaign' && winner && winner.winner === state.localPlayer) {
        if (state.size === 3) {
          const nextLevel = state.campaignLevel3 + 1;
          saveSettings({ campaignLevel3: nextLevel });
          set({ campaignLevel3: nextLevel });
        } else {
          const nextLevel = state.campaignLevel4 + 1;
          saveSettings({ campaignLevel4: nextLevel });
          set({ campaignLevel4: nextLevel });
        }
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
    haptics.lose();
    set({ gameOverReason: 'resign', winner: { winner: otherPlayer(state.localPlayer), line: [] }, clock: tickClock(state.clock, Date.now()) });
    if (state.mode === 'online') {
      state.online.session?.send({ type: 'resign', player: state.localPlayer });
      get().__recordStat('loss', true);
    }
    if (state.mode === 'bot') get().__recordStat('loss');
  },

  rematch: () => {
    stopConfetti();
    const state = get();
    if (state.mode === 'campaign') {
      state.startCampaignLevel(undefined, state.size);
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
      history: [],
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
      const localLost = timedOutPlayer === state.localPlayer;
      if (localLost) haptics.lose();
      else haptics.win();
      set({
        clock,
        gameOverReason: 'timeout',
        winner: { winner: otherPlayer(timedOutPlayer), line: [] },
      });
      if (state.mode === 'bot') get().__recordStat(localLost ? 'loss' : 'win');
      if (state.mode === 'online') get().__recordStat(localLost ? 'loss' : 'win', true);
      return;
    }
    set({ clock });
  },

  // Internal — not part of the public component-facing API, but simplest to keep colocated.
  __handleNetMessage: (message: NetMessage) => {
    const state = get();
    if (message.type === 'init') {
      audio.playTrack('match');
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
        history: [],
        screen: 'game',
        clock: startClock(createClockState(message.timeControl), 'X', Date.now()),
        gameGeneration: state.gameGeneration + 1,
      });
      state.online.session?.send({ type: 'cosmetics', color: state.onlineMyColor, shape: state.markerShape });
    } else if (message.type === 'cosmetics') {
      set((s) => ({ online: { ...s.online, opponentColor: message.color, opponentShape: message.shape } }));
    } else if (message.type === 'move') {
      const board = applyMove(state.board, message.index, message.player);
      const next = otherPlayer(message.player);
      const { winner, reason } = finishIfGameOver(board, state.size, state.blockedCells);
      const now = Date.now();
      const clock = winner || reason
        ? tickClock(state.clock, now)
        : switchClock(state.clock, message.player, next, state.activeTimeControl, now);
      audio.playPlace(message.player);
      if (reason === 'draw') {
        audio.playDraw();
        get().__recordStat('draw', true);
      } else if (winner) {
        if (winner.winner === state.localPlayer) audio.playWin();
        else audio.playLose();
        get().__recordStat(winner.winner === state.localPlayer ? 'win' : 'loss', true);
      }
      set({ board, turn: next, winner, gameOverReason: reason, clock, moveCount: state.moveCount + 1, lastMoveIndex: message.index });
    } else if (message.type === 'resign') {
      audio.playWin();
      get().__recordStat('win', true);
      set({ gameOverReason: 'resign', winner: { winner: otherPlayer(message.player), line: [] } });
    } else if (message.type === 'rematch-offer') {
      state.online.session?.send({ type: 'rematch-accept' });
      get().rematch();
    } else if (message.type === 'rematch-accept') {
      get().rematch();
    }
  },

  __recordStat: (result, online) => {
    const state = get();
    const key = online ? 'onlineStats' : 'stats';
    const stats: Stats = { ...state[key] };
    if (result === 'win') stats.wins += 1;
    else if (result === 'loss') stats.losses += 1;
    else stats.draws += 1;
    saveSettings({ [key]: stats });
    set({ [key]: stats } as Partial<GameState>);
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
  haptics.setEnabled(initial.hapticsEnabled);
}
