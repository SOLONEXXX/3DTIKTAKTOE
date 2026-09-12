import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useGameStore, isUnlimitedTimeControl } from '../game/store';
import { fireWinConfetti, fireLevelConfetti, stopConfetti } from '../game/confetti';
import { audio } from '../game/audio';
import { formatClock } from '../game/timer';
import { useT } from '../game/i18n';
import { WinnerOverlay } from './WinnerOverlay';
import { BackIcon, UndoIcon } from './icons';
import { colorThemeDef } from '../game/cosmetics';
import { botPersona } from '../game/botPersona';

const Scene = lazy(() => import('../three/Scene').then((m) => ({ default: m.Scene })));

const LOW_TIME_MS = 20_000;

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
  const onlineMyColor = useGameStore((s) => s.onlineMyColor);
  const accessibilityGlyphs = useGameStore((s) => s.accessibilityGlyphs);
  const difficulty = useGameStore((s) => s.difficulty);
  const campaignLevelInPlay = useGameStore((s) => s.campaignLevelInPlay);
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

  useEffect(() => {
    if (gameOverReason) {
      setShowOutcomeFx(true);
      const timeout = window.setTimeout(() => setShowOutcomeFx(false), 1400);
      return () => window.clearTimeout(timeout);
    }
  }, [gameOverReason]);

  // Hold the win/lose modal back for a beat on a real 3-/4-in-a-row finish, so the
  // winning line stays visible on the board (glowing, pulsing) long enough to actually
  // see which combination decided the game before the overlay covers it up. Draws,
  // timeouts, resignations etc. have no line to show, so those pop up immediately.
  // Level-Modus keeps this brief since a run there is many quick games in a row.
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

  useEffect(() => {
    if (!gameOverReason || !winner) return;
    const localWins = mode === 'local' || winner.winner === localPlayer;
    if (localWins) {
      if (isCampaign) fireLevelConfetti();
      else fireWinConfetti();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameOverReason]);

  // Never let a burst bleed into whatever screen comes next.
  useEffect(() => () => stopConfetti(), []);

  const myTurn = useMemo(() => {
    if (winner || gameOverReason) return false;
    if (mode === 'local') return true;
    if (mode === 'bot' || mode === 'campaign') return turn === localPlayer && !botThinking;
    if (mode === 'online') return turn === localPlayer && online.status === 'connected';
    return false;
  }, [winner, gameOverReason, mode, turn, localPlayer, botThinking, online.status]);

  const botName = useMemo(() => {
    const persona = botPersona(difficulty);
    return `${persona.emoji} ${persona.name}`;
  }, [difficulty]);

  const theme = colorThemeDef(markerColorTheme);
  const xColor = isOnline ? (localPlayer === 'X' ? onlineMyColor : online.opponentColor ?? theme.xColor) : theme.xColor;
  const oColor = isOnline ? (localPlayer === 'O' ? onlineMyColor : online.opponentColor ?? theme.oColor) : theme.oColor;
  const xShape = isOnline ? (localPlayer === 'X' ? markerShape : online.opponentShape ?? markerShape) : markerShape;
  const oShape = isOnline ? (localPlayer === 'O' ? markerShape : online.opponentShape ?? markerShape) : markerShape;
  const canUndo = isLocal && history.length > 0 && !gameOverReason;
  const showClock = !isCampaign && !isUnlimitedTimeControl(activeTimeControl);

  // Center HUD label — always either the campaign level or whose turn it is, in plain
  // white text, per mode, unified across every game mode.
  const centerLabel = useMemo(() => {
    if (isCampaign) return t('cosmetics.level', { n: campaignLevelInPlay }).toUpperCase();
    if (isOnline && online.status !== 'connected') {
      return online.status === 'disconnected' ? t('game.disconnected') : t('game.connecting');
    }
    if (isLocal) return (turn === 'X' ? t('game.playerX') : t('game.playerO')).toUpperCase();
    if (mode === 'bot') {
      if (turn === localPlayer) return t('game.you').toUpperCase();
      return botThinking ? t('game.thinking', { name: botName }).toUpperCase() : botName.toUpperCase();
    }
    // online, connected
    return (turn === localPlayer ? t('game.you') : t('game.opponent')).toUpperCase();
  }, [isCampaign, isOnline, isLocal, online.status, turn, localPlayer, mode, botThinking, botName, campaignLevelInPlay, t]);

  const turnKey = `${mode}-${turn}-${campaignLevelInPlay}-${botThinking}`;

  const outcomeClass = useMemo(() => {
    if (!gameOverReason || !showOutcomeFx) return '';
    if (gameOverReason === 'draw') return 'outcome-draw';
    if (!winner) return '';
    if (mode === 'local') return 'outcome-win';
    return winner.winner === localPlayer ? 'outcome-win' : 'outcome-lose';
  }, [gameOverReason, showOutcomeFx, winner, mode, localPlayer]);

  const handleBack = () => {
    audio.playClick();
    exitGame();
  };

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
            showGlyphs={accessibilityGlyphs}
            gameGeneration={gameGeneration}
            onTap={placeMark}
          />
        </Suspense>
      </div>

      <div className="hud-top">
        <button className="icon-btn hud-back" onClick={handleBack} aria-label={t('lobby.back')}>
          <BackIcon className="icon-btn-svg" />
        </button>

        <div className="hud-center" key={turnKey}>
          <div className="hud-center-label">{centerLabel}</div>
          {isOnline && online.roomCode && <div className="hud-center-sub">{online.roomCode}</div>}
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
        <button className={`layer-btn ${focusedLayer === null ? 'selected' : ''}`} onClick={() => { audio.playClick(); setFocusedLayer(null); }}>
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
