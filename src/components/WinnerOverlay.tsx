import type { GameOverReason } from '../game/store';
import type { GameMode, Player } from '../game/types';

interface WinnerOverlayProps {
  winner: Player | null;
  reason: GameOverReason;
  mode: GameMode;
  localPlayer: Player;
  onRematch: () => void;
  onMenu: () => void;
}

function reasonLabel(reason: GameOverReason): string {
  switch (reason) {
    case 'timeout':
      return 'on time';
    case 'resign':
      return 'by resignation';
    case 'opponent-left':
      return 'opponent disconnected';
    default:
      return '';
  }
}

export function WinnerOverlay({ winner, reason, mode, localPlayer, onRematch, onMenu }: WinnerOverlayProps) {
  if (!reason) return null;

  let headline: string;
  if (reason === 'draw') {
    headline = "It's a draw!";
  } else if (winner) {
    const isLocalWinner = (mode === 'bot' || mode === 'online') && winner === localPlayer;
    const isLocalLoser = (mode === 'bot' || mode === 'online') && winner !== localPlayer;
    if (isLocalWinner) headline = 'You win!';
    else if (isLocalLoser) headline = 'You lose';
    else headline = `Player ${winner} wins!`;
  } else {
    headline = 'Game over';
  }

  const detail = reasonLabel(reason);

  return (
    <div className="overlay">
      <div className="overlay-card">
        <h2>{headline}</h2>
        {detail && <p className="overlay-detail">{detail}</p>}
        <div className="overlay-actions">
          {reason !== 'opponent-left' && (
            <button className="primary-btn" onClick={onRematch}>
              Rematch
            </button>
          )}
          <button className="primary-btn secondary" onClick={onMenu}>
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
