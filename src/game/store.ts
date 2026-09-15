import { create } from 'zustand';
import { applyMove, checkWinner, createBoard, isBoardFull, otherPlayer } from './board';
import { requestBotMove } from './aiClient';
import { botMoveDelayMs } from './ai';
import { campaignBlockedCells, campaignDifficulty, starsForWin } from './campaign';
import { LEVELS_PER_WORLD, worldAt, worldIndexForLevel } from './worlds';
import { levelFromTotalXp, levelUpShards, matchRewards, type MatchOutcome, type MatchRewards } from './progression';
import {
  applyMatch,
  matchmakeOpponent,
  seasonNumber,
  softResetRating,
  START_RATING,
  tierIndexForRating,
  type LadderOpponent,
  type RatingChange,
} from './elo';
import { advanceStreak, dailyChallengeFor, survivalBlockedCount, survivalDifficulty, todayKey } from './daily';
import { cosmeticKey, type CosmeticKind } from './cosmetics';
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
  MarkerMaterial,
  MarkerShape,
  Player,
  TimeControl,
  WinResult,
} from './types';

export type Screen =
  | 'home'
  | 'levels'
  | 'ranked'
  | 'shop'
  | 'profile'
  | 'settings'
  | 'app-settings'
  | 'lobby'
  | 'game';

export type GameOverReason = 'line' | 'draw' | 'timeout' | 'resign' | 'opponent-left' | null;

export function trackForScreen(screen: Screen, mode: GameMode): MusicTrack {
  if (screen === 'lobby') return 'lobby';
  if (screen === 'game') return mode === 'campaign' || mode === 'daily' ? 'campaign' : 'match';
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

/** True for the "no clock" preset — the HUD renders no time readout at all in that case. */
export function isUnlimitedTimeControl(tc: TimeControl): boolean {
  return tc.initialMs === UNLIMITED_TIME_CONTROL.initialMs;
}

const SETTINGS_KEY = 'ttt3d:settings:v3';
const LEGACY_SETTINGS_KEY = 'ttt3d:settings:v2';

export interface Stats {
  wins: number;
  losses: number;
  draws: number;
}

export type StarMap = Record<string, number>;

interface PersistedSettings {
  size: BoardSize;
  mode: GameMode;
  difficulty: Difficulty;
  timeControlIndex: number;
  background: BackgroundTheme;
  markerColorTheme: MarkerColorTheme;
  markerShape: MarkerShape;
  markerMaterial: MarkerMaterial;
  musicVolume: number;
  sfxVolume: number;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  playerName: string;
  campaignLevel3: number;
  campaignLevel4: number;
  campaignBoardSize: BoardSize;
  stars3: StarMap;
  stars4: StarMap;
  onlineMyColor: string;
  cheatUnlockAll: boolean;
  accessibilityGlyphs: boolean;
  showThreats: boolean;
  hapticsEnabled: boolean;
  stats: Stats;
  onlineStats: Stats;
  language: Language;
  totalXp: number;
  shards: number;
  ownedCosmetics: string[];
  rankedRating: number;
  rankedGames: number;
  rankedWinStreak: number;
  peakTierIndex: number;
  rankedSeason: number;
  rankedStats: Stats;
  dailyLastCompleted: string | null;
  dailyStreak: number;
  survivalBest3: number;
  survivalBest4: number;
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
    const raw = localStorage.getItem(SETTINGS_KEY) ?? localStorage.getItem(LEGACY_SETTINGS_KEY);
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

/** Everything the end-of-match overlay needs to show what the player just earned. */
export interface MatchResultSummary {
  rewards: MatchRewards;
  stars: number;
  bestStars: number;
  firstClear: boolean;
  levelUps: number;
  newPlayerLevel: number;
  unlocked: { kind: CosmeticKind; id: string }[];
  rating: RatingChange | null;
  survivalRounds: number;
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
  markerMaterial: MarkerMaterial;
  musicVolume: number;
  sfxVolume: number;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  playerName: string;
  campaignLevel3: number;
  campaignLevel4: number;
  campaignBoardSize: BoardSize;
  campaignLevelInPlay: number;
  stars3: StarMap;
  stars4: StarMap;
  onlineMyColor: string;
  cheatUnlockAll: boolean;
  accessibilityGlyphs: boolean;
  showThreats: boolean;
  hapticsEnabled: boolean;
  stats: Stats;
  onlineStats: Stats;
  language: Language;

  // Meta progression
  totalXp: number;
  shards: number;
  ownedCosmetics: string[];

  // Ranked
  rankedRating: number;
  rankedGames: number;
  rankedWinStreak: number;
  peakTierIndex: number;
  rankedSeason: number;
  rankedStats: Stats;
  rankedOpponent: LadderOpponent | null;

  // Daily + survival
  dailyLastCompleted: string | null;
  dailyStreak: number;
  survivalRound: number;
  survivalBest3: number;
  survivalBest4: number;

  // Match runtime
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
  history: HistoryEntry[];
  online: OnlineState;
  gameGeneration: number;
  lastResult: MatchResultSummary | null;

  goHome: () => void;
  goToScreen: (screen: Screen) => void;
  setSize: (size: BoardSize) => void;
  setMode: (mode: GameMode) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  setTimeControlIndex: (index: number) => void;
  setBackground: (background: BackgroundTheme) => void;
  setMarkerColorTheme: (theme: MarkerColorTheme) => void;
  setMarkerShape: (shape: MarkerShape) => void;
  setMarkerMaterial: (material: MarkerMaterial) => void;
  setMusicVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  setMusicEnabled: (enabled: boolean) => void;
  setSfxEnabled: (enabled: boolean) => void;
  setPlayerName: (name: string) => void;
  setCampaignBoardSize: (size: BoardSize) => void;
  setOnlineMyColor: (color: string) => void;
  redeemCode: (code: string) => boolean;
  setAccessibilityGlyphs: (enabled: boolean) => void;
  setShowThreats: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setLanguage: (language: Language) => void;
  resetStats: () => void;
  buyCosmetic: (kind: CosmeticKind, id: string, price: number) => boolean;
  undo: () => void;
  exitGame: () => void;
  playNow: () => void;
  startLocalGame: (size: BoardSize, timeControl: TimeControl) => void;
  startBotGame: (size: BoardSize, difficulty: Difficulty, timeControl: TimeControl) => void;
  startCampaignLevel: (level?: number, size?: BoardSize) => void;
  startRankedMatch: () => void;
  startSurvivalRun: () => void;
  startDailyChallenge: () => void;
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
  __finishMatch: (outcome: MatchOutcome) => void;
}

function canPlayerAct(
  state: Pick<GameState, 'mode' | 'turn' | 'localPlayer' | 'winner' | 'botThinking' | 'online'>,
) {
  if (state.winner) return false;
  if (state.mode === 'local') return true;
  if (state.mode === 'online') {
    if (state.turn !== state.localPlayer) return false;
    return state.online.status === 'connected';
  }
  // Every other mode is "you versus a bot".
  if (state.turn !== state.localPlayer) return false;
  if (state.botThinking) return false;
  return true;
}

function isBotMode(mode: GameMode): boolean {
  return mode === 'bot' || mode === 'campaign' || mode === 'ranked' || mode === 'survival' || mode === 'daily';
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

const emptyOnline = (): OnlineState => ({
  session: null,
  status: 'idle',
  roomCode: null,
  isHost: false,
  opponentColor: null,
  opponentShape: null,
});

const emptyResult = (): MatchResultSummary => ({
  rewards: { xp: 0, shards: 0, lines: [] },
  stars: 0,
  bestStars: 0,
  firstClear: false,
  levelUps: 0,
  newPlayerLevel: 1,
  unlocked: [],
  rating: null,
  survivalRounds: 0,
});

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'home',
  size: persisted.size ?? 4,
  mode: persisted.mode ?? 'bot',
  difficulty: persisted.difficulty ?? 50,
  timeControlIndex: persisted.timeControlIndex ?? DEFAULT_TIME_CONTROL_INDEX,
  background: persisted.background ?? 'nebula',
  markerColorTheme: persisted.markerColorTheme ?? 'classic',
  markerShape: persisted.markerShape ?? 'cube',
  markerMaterial: persisted.markerMaterial ?? 'standard',
  musicVolume: persisted.musicVolume ?? 0.5,
  sfxVolume: persisted.sfxVolume ?? 0.7,
  musicEnabled: persisted.musicEnabled ?? true,
  sfxEnabled: persisted.sfxEnabled ?? true,
  playerName: persisted.playerName ?? 'Spieler',
  campaignLevel3: persisted.campaignLevel3 ?? 1,
  campaignLevel4: persisted.campaignLevel4 ?? 1,
  campaignBoardSize: persisted.campaignBoardSize ?? 4,
  campaignLevelInPlay: 1,
  stars3: persisted.stars3 ?? {},
  stars4: persisted.stars4 ?? {},
  onlineMyColor: persisted.onlineMyColor ?? '#ff4757',
  cheatUnlockAll: persisted.cheatUnlockAll ?? false,
  accessibilityGlyphs: persisted.accessibilityGlyphs ?? false,
  showThreats: persisted.showThreats ?? true,
  hapticsEnabled: persisted.hapticsEnabled ?? true,
  stats: persisted.stats ?? { wins: 0, losses: 0, draws: 0 },
  onlineStats: persisted.onlineStats ?? { wins: 0, losses: 0, draws: 0 },
  language: persisted.language ?? 'de',

  totalXp: persisted.totalXp ?? 0,
  shards: persisted.shards ?? 150,
  ownedCosmetics: persisted.ownedCosmetics ?? [],

  rankedRating: persisted.rankedRating ?? START_RATING,
  rankedGames: persisted.rankedGames ?? 0,
  rankedWinStreak: persisted.rankedWinStreak ?? 0,
  peakTierIndex: persisted.peakTierIndex ?? 0,
  rankedSeason: persisted.rankedSeason ?? seasonNumber(),
  rankedStats: persisted.rankedStats ?? { wins: 0, losses: 0, draws: 0 },
  rankedOpponent: null,

  dailyLastCompleted: persisted.dailyLastCompleted ?? null,
  dailyStreak: persisted.dailyStreak ?? 0,
  survivalRound: 0,
  survivalBest3: persisted.survivalBest3 ?? 0,
  survivalBest4: persisted.survivalBest4 ?? 0,

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
  online: emptyOnline(),
  lastResult: null,

  goHome: () => {
    get().online.session?.destroy();
    stopConfetti();
    audio.playTrack('menu');
    set({ screen: 'home', online: emptyOnline() });
  },

  goToScreen: (screen) => {
    audio.playTrack('menu');
    set({ screen });
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
  setMarkerMaterial: (markerMaterial) => {
    saveSettings({ markerMaterial });
    set({ markerMaterial });
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
    // Allow an empty value while the field is being edited; the fallback is applied on blur.
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
  setShowThreats: (showThreats) => {
    saveSettings({ showThreats });
    set({ showThreats });
  },
  setHapticsEnabled: (hapticsEnabled) => {
    saveSettings({ hapticsEnabled });
    haptics.setEnabled(hapticsEnabled);
    set({ hapticsEnabled });
  },
  setLanguage: (language) => {
    saveSettings({ language });
    set({ language });
  },
  resetStats: () => {
    const stats: Stats = { wins: 0, losses: 0, draws: 0 };
    saveSettings({ stats });
    set({ stats });
  },

  buyCosmetic: (kind, id, price) => {
    const state = get();
    const key = cosmeticKey(kind, id);
    if (state.ownedCosmetics.includes(key)) return false;
    if (state.shards < price) return false;
    const ownedCosmetics = [...state.ownedCosmetics, key];
    const shards = state.shards - price;
    saveSettings({ ownedCosmetics, shards });
    set({ ownedCosmetics, shards });
    audio.playWin();
    haptics.win();
    return true;
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

  /** Single "back" action for every game HUD: resign an in-progress game, then leave. */
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
    } else if (state.mode === 'local') {
      state.startLocalGame(state.size, timeControl);
    } else {
      state.startBotGame(state.size, state.difficulty, timeControl);
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
      lastResult: null,
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
      lastResult: null,
      rankedOpponent: null,
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
    const world = worldAt(worldIndexForLevel(targetLevel));
    audio.playTrack('campaign');
    set((s) => ({
      screen: 'game',
      mode: 'campaign',
      size: targetSize,
      campaignBoardSize: targetSize,
      difficulty,
      campaignLevelInPlay: targetLevel,
      background: world.background,
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
      lastResult: null,
      clock: startClock(createClockState(UNLIMITED_TIME_CONTROL), 'X', Date.now()),
      gameGeneration: s.gameGeneration + 1,
    }));
  },

  startRankedMatch: () => {
    const state = get();
    // A new season pulls everyone halfway back to the mean before the first match of it.
    const currentSeason = seasonNumber();
    let rating = state.rankedRating;
    let rankedGames = state.rankedGames;
    if (currentSeason !== state.rankedSeason) {
      rating = softResetRating(rating);
      rankedGames = 0;
      saveSettings({ rankedRating: rating, rankedSeason: currentSeason, rankedGames });
      set({ rankedRating: rating, rankedSeason: currentSeason, rankedGames, rankedWinStreak: 0 });
    }

    const opponent = matchmakeOpponent(rating);
    audio.playTrack('match');
    set((s) => ({
      screen: 'game',
      mode: 'ranked',
      size: s.size,
      difficulty: opponent.difficulty,
      rankedOpponent: opponent,
      activeTimeControl: UNLIMITED_TIME_CONTROL,
      board: createBoard(s.size),
      blockedCells: EMPTY_BLOCKED as Set<number>,
      turn: 'X',
      localPlayer: 'X',
      winner: null,
      gameOverReason: null,
      moveCount: 0,
      lastMoveIndex: null,
      botThinking: false,
      history: [],
      lastResult: null,
      clock: startClock(createClockState(UNLIMITED_TIME_CONTROL), 'X', Date.now()),
      gameGeneration: s.gameGeneration + 1,
    }));
  },

  startSurvivalRun: () => {
    const state = get();
    const round = state.gameOverReason === null && state.mode === 'survival' && state.survivalRound > 0
      ? state.survivalRound
      : 1;
    const difficulty = survivalDifficulty(round);
    const blockedCount = survivalBlockedCount(round, state.size);
    const blocked = blockedCount > 0 ? campaignBlockedCells(round * 13 + 7, state.size) : new Set<number>();
    audio.playTrack('match');
    set((s) => ({
      screen: 'game',
      mode: 'survival',
      difficulty,
      survivalRound: round,
      activeTimeControl: UNLIMITED_TIME_CONTROL,
      board: createBoard(s.size),
      blockedCells: blocked,
      turn: 'X',
      localPlayer: 'X',
      winner: null,
      gameOverReason: null,
      moveCount: 0,
      lastMoveIndex: null,
      botThinking: false,
      history: [],
      lastResult: null,
      clock: startClock(createClockState(UNLIMITED_TIME_CONTROL), 'X', Date.now()),
      gameGeneration: s.gameGeneration + 1,
    }));
  },

  startDailyChallenge: () => {
    const challenge = dailyChallengeFor();
    audio.playTrack('campaign');
    set((s) => ({
      screen: 'game',
      mode: 'daily',
      size: challenge.size,
      difficulty: challenge.difficulty,
      activeTimeControl: UNLIMITED_TIME_CONTROL,
      board: createBoard(challenge.size),
      blockedCells: challenge.blockedCells,
      turn: 'X',
      localPlayer: 'X',
      winner: null,
      gameOverReason: null,
      moveCount: 0,
      lastMoveIndex: null,
      botThinking: false,
      history: [],
      lastResult: null,
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
            lastResult: null,
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
    set({ online: { ...emptyOnline(), session, status: 'waiting-for-peer', isHost: true } });
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
    set({ online: { ...emptyOnline(), session, status: 'connecting', roomCode: code } });
    await session.joinGame(code);
  },

  leaveOnline: () => {
    get().online.session?.send({ type: 'resign', player: get().localPlayer });
    get().online.session?.destroy();
    stopConfetti();
    audio.playTrack('menu');
    set({ screen: 'home', online: emptyOnline() });
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
      const localWins = state.mode === 'local' || winner?.winner === state.localPlayer;
      if (reason === 'draw') {
        audio.playDraw();
        get().__finishMatch('draw');
      } else if (winner) {
        if (localWins) {
          audio.playWin();
          haptics.win();
        } else {
          audio.playLose();
          haptics.lose();
        }
        get().__finishMatch(localWins ? 'win' : 'loss');
      }
      return;
    }

    if (isBotMode(state.mode) && next !== state.localPlayer) {
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
  },

  resign: () => {
    const state = get();
    if (state.winner || state.gameOverReason) return;
    audio.playLose();
    haptics.lose();
    set({
      gameOverReason: 'resign',
      winner: { winner: otherPlayer(state.localPlayer), line: [] },
      clock: tickClock(state.clock, Date.now()),
    });
    if (state.mode === 'online') {
      state.online.session?.send({ type: 'resign', player: state.localPlayer });
    }
    get().__finishMatch('loss');
  },

  rematch: () => {
    stopConfetti();
    const state = get();
    if (state.mode === 'campaign') {
      state.startCampaignLevel(undefined, state.size);
      return;
    }
    if (state.mode === 'ranked') {
      state.startRankedMatch();
      return;
    }
    if (state.mode === 'survival') {
      state.startSurvivalRun();
      return;
    }
    if (state.mode === 'daily') {
      state.startDailyChallenge();
      return;
    }
    set((s) => ({
      board: createBoard(state.size),
      blockedCells: EMPTY_BLOCKED as Set<number>,
      turn: state.mode === 'local' ? (Math.random() < 0.5 ? 'X' : 'O') : 'X',
      winner: null,
      gameOverReason: null,
      moveCount: 0,
      lastMoveIndex: null,
      botThinking: false,
      history: [],
      lastResult: null,
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
      get().__finishMatch(localLost ? 'loss' : 'win');
      return;
    }
    set({ clock });
  },

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
        lastResult: null,
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
      set({ board, turn: next, winner, gameOverReason: reason, clock, moveCount: state.moveCount + 1, lastMoveIndex: message.index });
      if (reason === 'draw') {
        audio.playDraw();
        get().__finishMatch('draw');
      } else if (winner) {
        const localWins = winner.winner === state.localPlayer;
        if (localWins) audio.playWin();
        else audio.playLose();
        get().__finishMatch(localWins ? 'win' : 'loss');
      }
    } else if (message.type === 'resign') {
      audio.playWin();
      set({ gameOverReason: 'resign', winner: { winner: otherPlayer(message.player), line: [] } });
      get().__finishMatch('win');
    } else if (message.type === 'rematch-offer') {
      state.online.session?.send({ type: 'rematch-accept' });
      get().rematch();
    } else if (message.type === 'rematch-accept') {
      get().rematch();
    }
  },

  /**
   * Single place where a finished match turns into progress: stats, stars, campaign
   * advancement, XP/shards, ranked rating, survival streak, daily streak and any
   * cosmetics those unlock. Everything the result screen shows comes from here.
   */
  __finishMatch: (outcome) => {
    const state = get();
    const result = emptyResult();
    const patch: Partial<GameState> = {};
    const persistPatch: Partial<PersistedSettings> = {};

    // --- plain win/loss/draw counters -------------------------------------
    const bumpStats = (stats: Stats): Stats => ({
      wins: stats.wins + (outcome === 'win' ? 1 : 0),
      losses: stats.losses + (outcome === 'loss' ? 1 : 0),
      draws: stats.draws + (outcome === 'draw' ? 1 : 0),
    });

    if (state.mode === 'bot' || state.mode === 'campaign' || state.mode === 'survival' || state.mode === 'daily') {
      const stats = bumpStats(state.stats);
      patch.stats = stats;
      persistPatch.stats = stats;
    } else if (state.mode === 'online') {
      const onlineStats = bumpStats(state.onlineStats);
      patch.onlineStats = onlineStats;
      persistPatch.onlineStats = onlineStats;
    } else if (state.mode === 'ranked') {
      const rankedStats = bumpStats(state.rankedStats);
      patch.rankedStats = rankedStats;
      persistPatch.rankedStats = rankedStats;
    }

    const unlocked: { kind: CosmeticKind; id: string }[] = [];
    const owned = [...state.ownedCosmetics];
    const grant = (kind: CosmeticKind, id: string) => {
      const key = cosmeticKey(kind, id);
      if (owned.includes(key)) return;
      owned.push(key);
      unlocked.push({ kind, id });
    };

    // --- campaign: stars, level advance, world rewards --------------------
    if (state.mode === 'campaign') {
      const level = state.campaignLevelInPlay;
      const starKey = String(level);
      const starMap = state.size === 3 ? state.stars3 : state.stars4;
      const previousStars = starMap[starKey] ?? 0;

      if (outcome === 'win' && state.winner) {
        const ownStones = state.board.filter((cell) => cell === state.winner!.winner).length;
        result.stars = starsForWin(ownStones, state.size);
        result.bestStars = Math.max(previousStars, result.stars);
        result.firstClear = previousStars === 0;

        const nextStarMap = { ...starMap, [starKey]: result.bestStars };
        if (state.size === 3) {
          patch.stars3 = nextStarMap;
          persistPatch.stars3 = nextStarMap;
        } else {
          patch.stars4 = nextStarMap;
          persistPatch.stars4 = nextStarMap;
        }

        const highest = state.size === 3 ? state.campaignLevel3 : state.campaignLevel4;
        if (level >= highest) {
          const nextLevel = highest + 1;
          if (state.size === 3) {
            patch.campaignLevel3 = nextLevel;
            persistPatch.campaignLevel3 = nextLevel;
          } else {
            patch.campaignLevel4 = nextLevel;
            persistPatch.campaignLevel4 = nextLevel;
          }
        }

        // Finishing a world's last level hands out its signature cosmetic.
        if (level % LEVELS_PER_WORLD === 0) {
          const world = worldAt(worldIndexForLevel(level));
          if (world.reward) {
            const kindMap: Record<string, CosmeticKind> = {
              color: 'color',
              shape: 'shape',
              material: 'material',
              background: 'background',
            };
            grant(kindMap[world.reward.kind], world.reward.id);
          }
        }
      } else {
        result.bestStars = previousStars;
      }
    }

    // --- ranked: rating ---------------------------------------------------
    if (state.mode === 'ranked' && state.rankedOpponent) {
      const score = outcome === 'win' ? 1 : outcome === 'draw' ? 0.5 : 0;
      const change = applyMatch(
        state.rankedRating,
        state.rankedOpponent.rating,
        score,
        state.rankedGames,
        state.rankedWinStreak,
        state.peakTierIndex,
      );
      const rankedGames = state.rankedGames + 1;
      const rankedWinStreak = outcome === 'win' ? state.rankedWinStreak + 1 : 0;
      const peakTierIndex = Math.max(state.peakTierIndex, tierIndexForRating(change.newRating));

      result.rating = change;
      patch.rankedRating = change.newRating;
      patch.rankedGames = rankedGames;
      patch.rankedWinStreak = rankedWinStreak;
      patch.peakTierIndex = peakTierIndex;
      persistPatch.rankedRating = change.newRating;
      persistPatch.rankedGames = rankedGames;
      persistPatch.rankedWinStreak = rankedWinStreak;
      persistPatch.peakTierIndex = peakTierIndex;

      // Rank-gated cosmetics are handed over the moment the tier is first reached.
      if (peakTierIndex > state.peakTierIndex) {
        if (peakTierIndex >= 2) {
          grant('color', 'royal');
          grant('background', 'royal');
        }
        if (peakTierIndex >= 4) {
          grant('color', 'obsidian');
          grant('background', 'obsidian');
        }
        if (peakTierIndex >= 5) grant('color', 'bloodmoon');
      }
    }

    // --- survival ---------------------------------------------------------
    let survivalRounds = 0;
    if (state.mode === 'survival') {
      survivalRounds = outcome === 'win' ? state.survivalRound : Math.max(0, state.survivalRound - 1);
      result.survivalRounds = survivalRounds;
      if (outcome === 'win') {
        patch.survivalRound = state.survivalRound + 1;
        const currentBest = state.size === 3 ? state.survivalBest3 : state.survivalBest4;
        if (state.survivalRound > currentBest) {
          if (state.size === 3) {
            patch.survivalBest3 = state.survivalRound;
            persistPatch.survivalBest3 = state.survivalRound;
          } else {
            patch.survivalBest4 = state.survivalRound;
            persistPatch.survivalBest4 = state.survivalRound;
          }
        }
      } else {
        patch.survivalRound = 0;
      }
    }

    // --- daily ------------------------------------------------------------
    let dailyStreak = state.dailyStreak;
    if (state.mode === 'daily' && outcome === 'win' && state.dailyLastCompleted !== todayKey()) {
      dailyStreak = advanceStreak(state.dailyLastCompleted, state.dailyStreak);
      patch.dailyStreak = dailyStreak;
      patch.dailyLastCompleted = todayKey();
      persistPatch.dailyStreak = dailyStreak;
      persistPatch.dailyLastCompleted = todayKey();
    }

    // --- rewards ----------------------------------------------------------
    // Pass & play has no "you", so it pays a flat participation reward instead.
    const rewards = matchRewards({
      mode: state.mode,
      outcome: state.mode === 'local' ? 'draw' : outcome,
      stars: result.stars,
      firstClear: result.firstClear,
      survivalRounds: state.mode === 'survival' ? survivalRounds : undefined,
      dailyStreak: state.mode === 'daily' ? dailyStreak : undefined,
    });
    result.rewards = rewards;

    const beforeLevel = levelFromTotalXp(state.totalXp).level;
    const totalXp = state.totalXp + rewards.xp;
    const afterLevel = levelFromTotalXp(totalXp).level;
    result.levelUps = Math.max(0, afterLevel - beforeLevel);
    result.newPlayerLevel = afterLevel;

    let shards = state.shards + rewards.shards;
    for (let lvl = beforeLevel + 1; lvl <= afterLevel; lvl++) {
      shards += levelUpShards(lvl);
    }

    patch.totalXp = totalXp;
    patch.shards = shards;
    persistPatch.totalXp = totalXp;
    persistPatch.shards = shards;

    if (unlocked.length > 0) {
      patch.ownedCosmetics = owned;
      persistPatch.ownedCosmetics = owned;
    }
    result.unlocked = unlocked;

    patch.lastResult = result;
    saveSettings(persistPatch);
    set(patch as Partial<GameState>);
  },
}));

// Sync the audio/haptics modules with whatever was persisted.
{
  const initial = useGameStore.getState();
  audio.setMusicVolume(initial.musicVolume);
  audio.setSfxVolume(initial.sfxVolume);
  audio.setMusicEnabled(initial.musicEnabled);
  audio.setSfxEnabled(initial.sfxEnabled);
  haptics.setEnabled(initial.hapticsEnabled);
}
