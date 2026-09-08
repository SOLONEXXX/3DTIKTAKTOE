import { useMemo, useState } from 'react';
import { useGameStore } from '../game/store';
import { Scene } from '../three/Scene';
import { ClockDisplay } from './ClockDisplay';
import { WinnerOverlay } from './WinnerOverlay';
import type { Player } from '../game/types';

const LOW_TIME_MS = 20_000;

interface GameScreenProps {
  onExit: () => void;
}

function playerLabel(player: Player, mode: string, localPlayer: Player): string {
  if (mode === 'local') return `Player ${player}`;
  if (mode === 'bot') return player === localPlayer ? 'You' : 'Bot';
  if (mode === 'online') return player === localPlayer ? 'You' : 'Opponent';
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
  const placeMark = useGameStore((s) => s.placeMark);
  const resign = useGameStore((s) => s.resign);
  const requestRematch = useGameStore((s) => s.requestRematch);
  const goToMenu = useGameStore((s) => s.goToMenu);

  const [focusedLayer, setFocusedLayer] = useState<number | null>(null);

  const myTurn = useMemo(() => {
    if (winner || gameOverReason) return false;
    if (mode === 'local') return true;
    if (mode === 'bot') return turn === localPlayer && !botThinking;
    if (mode === 'online') return turn === localPlayer && online.status === 'connected';
    return false;
  }, [winner, gameOverReason, mode, turn, localPlayer, botThinking, online.status]);

  const statusText = useMemo(() => {
    if (gameOverReason) return 'Game over';
    if (mode === 'online' && online.status !== 'connected') {
      if (online.status === 'disconnected') return 'Opponent disconnected';
      return 'Connecting…';
    }
    if (mode === 'bot' && botThinking) return 'Bot is thinking…';
    if (mode === 'local') return `${playerLabel(turn, mode, localPlayer)}'s turn`;
    return myTurn ? 'Your turn' : `${playerLabel(turn, mode, localPlayer)}'s turn`;
  }, [gameOverReason, mode, online, botThinking, turn, localPlayer, myTurn]);

  const topPlayer: Player = mode === 'local' ? 'O' : otherOf(localPlayer);
  const bottomPlayer: Player = mode === 'local' ? 'X' : localPlayer;

  return (
    <div className="screen game-screen">
      <div className="game-topbar">
        <button className="icon-btn" onClick={onExit} aria-label="Back to menu">
          ←
        </button>
        <span className="status-text">{statusText}</span>
        {mode === 'online' && online.roomCode && <span className="room-code-badge">{online.roomCode}</span>}
        {mode !== 'online' && !gameOverReason && (
          <button className="icon-btn text-btn" onClick={resign}>
            Resign
          </button>
        )}
      </div>

      <ClockDisplay
        player={topPlayer}
        remainingMs={clock.remainingMs[topPlayer]}
        label={playerLabel(topPlayer, mode, localPlayer)}
        active={clock.runningFor === topPlayer}
        low={clock.remainingMs[topPlayer] <= LOW_TIME_MS}
      />

      <div className="scene-wrapper">
        <Scene
          board={board}
          size={size}
          winLine={winner?.line ?? []}
          focusedLayer={focusedLayer}
          interactive={myTurn}
          onTap={placeMark}
        />
      </div>

      <ClockDisplay
        player={bottomPlayer}
        remainingMs={clock.remainingMs[bottomPlayer]}
        label={playerLabel(bottomPlayer, mode, localPlayer)}
        active={clock.runningFor === bottomPlayer}
        low={clock.remainingMs[bottomPlayer] <= LOW_TIME_MS}
      />

      <div className="layer-selector">
        <button className={`layer-btn ${focusedLayer === null ? 'selected' : ''}`} onClick={() => setFocusedLayer(null)}>
          All
        </button>
        {Array.from({ length: size }, (_, i) => (
          <button
            key={i}
            className={`layer-btn ${focusedLayer === i ? 'selected' : ''}`}
            onClick={() => setFocusedLayer(focusedLayer === i ? null : i)}
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
        onRematch={requestRematch}
        onMenu={goToMenu}
      />
    </div>
  );
}

function otherOf(player: Player): Player {
  return player === 'X' ? 'O' : 'X';
}
