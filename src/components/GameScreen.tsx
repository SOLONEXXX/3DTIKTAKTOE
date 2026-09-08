import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../game/store';
import { fireWinConfetti } from '../game/confetti';
import { audio } from '../game/audio';
import { ClockDisplay } from './ClockDisplay';
import { WinnerOverlay } from './WinnerOverlay';
import { BackIcon, MenuIcon, UndoIcon } from './icons';
import { colorThemeDef } from '../game/cosmetics';
import { botPersona } from '../game/botPersona';
import type { Player } from '../game/types';

const Scene = lazy(() => import('../three/Scene').then((m) => ({ default: m.Scene })));

const LOW_TIME_MS = 20_000;

interface GameScreenProps {
  onExit: () => void;
}

function playerLabel(player: Player, mode: string, localPlayer: Player, botName: string): string {
  if (mode === 'local') return `Spieler ${player}`;
  if (mode === 'bot' || mode === 'campaign') return player === localPlayer ? 'Du' : botName;
  if (mode === 'online') return player === localPlayer ? 'Du' : 'Gegner';
  return player;
}

export function GameScreen({ onExit }: GameScreenProps) {
  const board = useGameStore((s) => s.board);
  const size = useGameStore((s) => s.size);
  const turn = useGameStore((s) => s.turn);
  const mode = useGameStore((s) => s.mode);
  const localPlayer = useGameStore((s) => s.localPlayer);
  const winner = useGameStore((s) => s.winner);
  const gameOverReason = useGameStore((s) => s.gameOverReason);
  const clock = useGameStore((s) => s.clock);
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
  const resign = useGameStore((s) => s.resign);
  const rematch = useGameStore((s) => s.rematch);
  const requestRematch = useGameStore((s) => s.requestRematch);
  const undo = useGameStore((s) => s.undo);
  const goHome = useGameStore((s) => s.goHome);

  const [focusedLayer, setFocusedLayer] = useState<number | null>(null);
  const [showOutcomeFx, setShowOutcomeFx] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
    if (localWins) fireWinConfetti();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameOverReason]);

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

  const statusText = useMemo(() => {
    if (gameOverReason) return 'Spiel beendet';
    if (mode === 'online' && online.status !== 'connected') {
      if (online.status === 'disconnected') return 'Gegner getrennt';
      return 'Verbinde…';
    }
    if ((mode === 'bot' || mode === 'campaign') && botThinking) return `${botName} überlegt…`;
    if (mode === 'local') return `${playerLabel(turn, mode, localPlayer, botName)} ist dran`;
    return myTurn ? 'Du bist dran' : `${playerLabel(turn, mode, localPlayer, botName)} ist dran`;
  }, [gameOverReason, mode, online, botThinking, turn, localPlayer, myTurn, botName]);

  const topPlayer: Player = mode === 'local' ? 'O' : otherOf(localPlayer);
  const bottomPlayer: Player = mode === 'local' ? 'X' : localPlayer;
  const theme = colorThemeDef(markerColorTheme);
  const isOnline = mode === 'online';
  const isCampaign = mode === 'campaign';
  const isLocal = mode === 'local';
  const xColor = isOnline ? (localPlayer === 'X' ? onlineMyColor : online.opponentColor ?? theme.xColor) : theme.xColor;
  const oColor = isOnline ? (localPlayer === 'O' ? onlineMyColor : online.opponentColor ?? theme.oColor) : theme.oColor;
  const xShape = isOnline ? (localPlayer === 'X' ? markerShape : online.opponentShape ?? markerShape) : markerShape;
  const oShape = isOnline ? (localPlayer === 'O' ? markerShape : online.opponentShape ?? markerShape) : markerShape;
  const canUndo = isLocal && history.length > 0 && !gameOverReason;

  const outcomeClass = useMemo(() => {
    if (!gameOverReason || !showOutcomeFx) return '';
    if (gameOverReason === 'draw') return 'outcome-draw';
    if (!winner) return '';
    if (mode === 'local') return 'outcome-win';
    return winner.winner === localPlayer ? 'outcome-win' : 'outcome-lose';
  }, [gameOverReason, showOutcomeFx, winner, mode, localPlayer]);

  return (
    <div className={`screen game-screen ${outcomeClass}`}>
      {isCampaign ? (
        <div className="game-topbar game-topbar-campaign">
          <span className="campaign-level-badge">Level {campaignLevelInPlay}</span>
          <div className="topbar-menu-anchor">
            <button
              className="icon-btn"
              onClick={() => { audio.playClick(); setMenuOpen((v) => !v); }}
              aria-label="Menü"
            >
              <MenuIcon className="icon-btn-svg" />
            </button>
            {menuOpen && (
              <div className="topbar-menu">
                <button
                  className="topbar-menu-item"
                  onClick={() => { audio.playClick(); setMenuOpen(false); rematch(); }}
                >
                  Level neu starten
                </button>
                {!gameOverReason && (
                  <button
                    className="topbar-menu-item"
                    onClick={() => { audio.playClick(); setMenuOpen(false); resign(); }}
                  >
                    Aufgeben
                  </button>
                )}
                <button
                  className="topbar-menu-item"
                  onClick={() => { audio.playClick(); setMenuOpen(false); goHome(); }}
                >
                  Hauptmenü
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="game-topbar">
          <button className="icon-btn" onClick={() => { audio.playClick(); onExit(); }} aria-label="Zurück zum Menü">
            <BackIcon className="icon-btn-svg" />
          </button>
          <span className="status-text">{statusText}</span>
          {mode === 'online' && online.roomCode && <span className="room-code-badge">{online.roomCode}</span>}
          {canUndo && (
            <button className="icon-btn" onClick={() => undo()} aria-label="Zug zurücknehmen">
              <UndoIcon className="icon-btn-svg" />
            </button>
          )}
          {mode !== 'online' && !gameOverReason && (
            <button className="icon-btn text-btn" onClick={() => { audio.playClick(); resign(); }}>
              Aufgeben
            </button>
          )}
        </div>
      )}

      {!isCampaign && (
        <ClockDisplay
          player={topPlayer}
          remainingMs={clock.remainingMs[topPlayer]}
          label={playerLabel(topPlayer, mode, localPlayer, botName)}
          active={clock.runningFor === topPlayer}
          low={clock.remainingMs[topPlayer] <= LOW_TIME_MS}
          color={topPlayer === 'X' ? xColor : oColor}
        />
      )}

      <div className={`scene-wrapper bg-${background} ${isCampaign ? 'scene-wrapper-campaign' : ''}`}>
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

      {!isCampaign && (
        <ClockDisplay
          player={bottomPlayer}
          remainingMs={clock.remainingMs[bottomPlayer]}
          label={playerLabel(bottomPlayer, mode, localPlayer, botName)}
          active={clock.runningFor === bottomPlayer}
          low={clock.remainingMs[bottomPlayer] <= LOW_TIME_MS}
          color={bottomPlayer === 'X' ? xColor : oColor}
        />
      )}

      <div className="layer-selector">
        <button className={`layer-btn ${focusedLayer === null ? 'selected' : ''}`} onClick={() => { audio.playClick(); setFocusedLayer(null); }}>
          Alle
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
        reason={gameOverReason}
        mode={mode}
        localPlayer={localPlayer}
        campaignLevel={campaignLevelInPlay}
        onRematch={requestRematch}
        onMenu={goHome}
      />
    </div>
  );
}

function otherOf(player: Player): Player {
  return player === 'X' ? 'O' : 'X';
}
