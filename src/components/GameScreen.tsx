import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useGameStore, isUnlimitedTimeControl } from '../game/store';
import { fireWinConfetti, fireLevelConfetti, stopConfetti } from '../game/confetti';
import { audio } from '../game/audio';
import { formatClock } from '../game/timer';
import { useT } from '../game/i18n';
import { findBoardThreats } from '../game/threats';
import { WinnerOverlay } from './WinnerOverlay';
import { BackIcon, UndoIcon } from './icons';
import { colorThemeDef } from '../game/cosmetics';
import { botPersona } from '../game/botPersona';

const Scene = lazy(() => import('../three/Scene').then((m) => ({ default: m.Scene })));

const LOW_TIME_MS = 20_000;
const NO_THREATS: readonly number[] = [];

export function GameScreen() {
  const t = useT();
  const board = useGameStore((s) => s.board);
  const size = useGameStore((s) => s.size);
  const turn = useGameStore((s) => s.turn);
  const mode = useGameStore((s) => s.mode);
  const localPlayer = useGameStore((s) => s.localPlayer);
  const winner = useGameStore((s) => s.winner);
  const gameOverReason = useGameStore((s) => s.gameOverReason);
  const clock = useGameStore((s) => s.clock);
  const activeTimeControl = useGameStore((s) => s.activeTimeControl);
  const botThinking = useGameStore((s) => s.botThinking);
  const online = useGameStore((s) => s.online);
  const background = useGameStore((s) => s.background);
  const blockedCells = useGameStore((s) => s.blockedCells);
  const markerColorTheme = useGameStore((s) => s.markerColorTheme);
  const markerShape = useGameStore((s) => s.markerShape);
  const markerMaterial = useGameStore((s) => s.markerMaterial);
  const onlineMyColor = useGameStore((s) => s.onlineMyColor);
  const accessibilityGlyphs = useGameStore((s) => s.accessibilityGlyphs);
  const showThreats = useGameStore((s) => s.showThreats);
  const difficulty = useGameStore((s) => s.difficulty);
  const campaignLevelInPlay = useGameStore((s) => s.campaignLevelInPlay);
  const survivalRound = useGameStore((s) => s.survivalRound);
  const rankedOpponent = useGameStore((s) => s.rankedOpponent);
  const gameGeneration = useGameStore((s) => s.gameGeneration);
  const history = useGameStore((s) => s.history);
  const placeMark = useGameStore((s) => s.placeMark);
  const requestRematch = useGameStore((s) => s.requestRematch);
  const undo = useGameStore((s) => s.undo);
  const exitGame = useGameStore((s) => s.exitGame);
  const goHome = useGameStore((s) => s.goHome);

  const [focusedLayer, setFocusedLayer] = useState<number | null>(null);
  const [showOutcomeFx, setShowOutcomeFx] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);

  const isCampaign = mode === 'campaign';
  const isOnline = mode === 'online';
  const isLocal = mode === 'local';

  // A new game (or level) always starts from the full view again.
  useEffect(() => {
    setFocusedLayer(null);
  }, [gameGeneration]);

  useEffect(() => {
    if (gameOverReason) {
      setShowOutcomeFx(true);
      const timeout = window.setTimeout(() => setShowOutcomeFx(false), 1400);
      return () => window.clearTimeout(timeout);
    }
  }, [gameOverReason]);

  useEffect(() => {
    if (!gameOverReason || !winner) return;
    const localWins = mode === 'local' || winner.winner === localPlayer;
    if (localWins) {
      if (isCampaign) fireLevelConfetti();
      else fireWinConfetti();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameOverReason]);

  // Hold the result modal back so the winning line stays readable for a beat first.
  useEffect(() => {
    if (!gameOverReason) {
      setOverlayVisible(false);
      return;
    }
    if (gameOverReason !== 'line') {
      setOverlayVisible(true);
      return;
    }
    const revealDelay = isCampaign ? 900 : 1500;
    const timeout = window.setTimeout(() => setOverlayVisible(true), revealDelay);
    return () => window.clearTimeout(timeout);
  }, [gameOverReason, isCampaign]);

  useEffect(() => () => stopConfetti(), []);

  const myTurn = useMemo(() => {
    if (winner || gameOverReason) return false;
    if (mode === 'local') return true;
    if (mode === 'online') return turn === localPlayer && online.status === 'connected';
    return turn === localPlayer && !botThinking;
  }, [winner, gameOverReason, mode, turn, localPlayer, botThinking, online.status]);

  const botName = useMemo(() => {
    if (mode === 'ranked' && rankedOpponent) return `${rankedOpponent.name} · ${rankedOpponent.rating}`;
    const persona = botPersona(difficulty);
    return `${persona.emoji} ${persona.name}`;
  }, [difficulty, mode, rankedOpponent]);

  const theme = colorThemeDef(markerColorTheme);
  const xColor = isOnline ? (localPlayer === 'X' ? onlineMyColor : online.opponentColor ?? theme.xColor) : theme.xColor;
  const oColor = isOnline ? (localPlayer === 'O' ? onlineMyColor : online.opponentColor ?? theme.oColor) : theme.oColor;
  const xShape = isOnline ? (localPlayer === 'X' ? markerShape : online.opponentShape ?? markerShape) : markerShape;
  const oShape = isOnline ? (localPlayer === 'O' ? markerShape : online.opponentShape ?? markerShape) : markerShape;
  const canUndo = isLocal && history.length > 0 && !gameOverReason;
  const showClock = !isUnlimitedTimeControl(activeTimeControl);

  // One-move threats for whoever is on turn — only while that player can still act.
  const threats = useMemo(() => {
    if (!showThreats || gameOverReason || winner) return { winning: NO_THREATS, danger: NO_THREATS };
    const perspective = isLocal ? turn : localPlayer;
    if (!isLocal && turn !== localPlayer) return { winning: NO_THREATS, danger: NO_THREATS };
    return findBoardThreats(board, size, perspective, blockedCells);
  }, [showThreats, gameOverReason, winner, board, size, blockedCells, turn, localPlayer, isLocal]);

  const centerLabel = useMemo(() => {
    if (isCampaign) return t('cosmetics.level', { n: campaignLevelInPlay }).toUpperCase();
    if (mode === 'survival') return t('survival.round', { n: survivalRound }).toUpperCase();
    if (mode === 'daily') return t('daily.title').toUpperCase();
    if (isOnline && online.status !== 'connected') {
      return online.status === 'disconnected' ? t('game.disconnected') : t('game.connecting');
    }
    if (isLocal) return (turn === 'X' ? t('game.playerX') : t('game.playerO')).toUpperCase();
    if (isOnline) return (turn === localPlayer ? t('game.you') : t('game.opponent')).toUpperCase();
    if (turn === localPlayer) return t('game.you').toUpperCase();
    return botThinking ? t('game.thinking', { name: botName }).toUpperCase() : botName.toUpperCase();
  }, [isCampaign, isOnline, isLocal, mode, online.status, turn, localPlayer, botThinking, botName, campaignLevelInPlay, survivalRound, t]);

  const turnKey = `${mode}-${turn}-${campaignLevelInPlay}-${survivalRound}-${botThinking}`;

  const outcomeClass = useMemo(() => {
    if (!gameOverReason || !showOutcomeFx) return '';
    if (gameOverReason === 'draw') return 'outcome-draw';
    if (!winner) return '';
    if (mode === 'local') return 'outcome-win';
    return winner.winner === localPlayer ? 'outcome-win' : 'outcome-lose';
  }, [gameOverReason, showOutcomeFx, winner, mode, localPlayer]);

  return (
    <div className={`screen game-screen-fullscreen ${outcomeClass}`}>
      <div className={`scene-wrapper-full bg-${background}`}>
        <Suspense fallback={null}>
          <Scene
            board={board}
            size={size}
            winLine={winner?.line ?? []}
            focusedLayer={focusedLayer}
            interactive={myTurn}
            blockedCells={blockedCells}
            xColor={xColor}
            oColor={oColor}
            xShape={xShape}
            oShape={oShape}
            markerMaterial={markerMaterial}
            showGlyphs={accessibilityGlyphs}
            winningCells={threats.winning}
            dangerCells={threats.danger}
            gameGeneration={gameGeneration}
            onTap={placeMark}
          />
        </Suspense>
      </div>

      <div className="hud-top">
        <button
          className="icon-btn hud-back"
          onClick={() => { audio.playClick(); exitGame(); }}
          aria-label={t('lobby.back')}
        >
          <BackIcon className="icon-btn-svg" />
        </button>

        <div className="hud-center" key={turnKey}>
          <div className="hud-center-label">{centerLabel}</div>
          {isOnline && online.roomCode && <div className="hud-center-sub">{online.roomCode}</div>}
          {/* Ranked is a ladder — you should always see who you are being rated against. */}
          {mode === 'ranked' && rankedOpponent && (
            <div className="hud-center-sub">
              {rankedOpponent.name} · {rankedOpponent.rating}
            </div>
          )}
          {showClock && (
            <div className={`hud-center-clock ${clock.remainingMs[turn] <= LOW_TIME_MS ? 'low' : ''}`}>
              {formatClock(clock.remainingMs[turn])}
            </div>
          )}
        </div>

        {canUndo ? (
          <button className="icon-btn hud-undo" onClick={() => undo()} aria-label="Undo">
            <UndoIcon className="icon-btn-svg" />
          </button>
        ) : (
          <div className="icon-btn-spacer" />
        )}
      </div>

      <div className="hud-layer-selector">
        <button
          className={`layer-btn ${focusedLayer === null ? 'selected' : ''}`}
          onClick={() => { audio.playClick(); setFocusedLayer(null); }}
        >
          {t('game.all')}
        </button>
        {Array.from({ length: size }, (_, i) => (
          <button
            key={i}
            className={`layer-btn ${focusedLayer === i ? 'selected' : ''}`}
            onClick={() => { audio.playClick(); setFocusedLayer(focusedLayer === i ? null : i); }}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {focusedLayer !== null && !gameOverReason && (
        <div className="layer-hint">{t('game.layerHint', { n: focusedLayer + 1 })}</div>
      )}

      <WinnerOverlay
        winner={winner?.winner ?? null}
        reason={overlayVisible ? gameOverReason : null}
        mode={mode}
        localPlayer={localPlayer}
        campaignLevel={campaignLevelInPlay}
        onRematch={requestRematch}
        onMenu={goHome}
      />
    </div>
  );
}
