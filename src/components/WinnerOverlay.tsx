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
      return 'nach Zeitablauf';
    case 'resign':
      return 'durch Aufgabe';
    case 'opponent-left':
      return 'Gegner hat die Verbindung getrennt';
    default:
      return '';
  }
}

export function WinnerOverlay({ winner, reason, mode, localPlayer, onRematch, onMenu }: WinnerOverlayProps) {
  if (!reason) return null;

  let headline: string;
  let variant: 'win' | 'lose' | 'draw' = 'draw';
  if (reason === 'draw') {
    headline = 'Unentschieden!';
  } else if (winner) {
    const isLocalWinner = (mode === 'bot' || mode === 'online') && winner === localPlayer;
    const isLocalLoser = (mode === 'bot' || mode === 'online') && winner !== localPlayer;
    if (isLocalWinner) {
      headline = 'Du gewinnst! 🎉';
      variant = 'win';
    } else if (isLocalLoser) {
      headline = 'Verloren';
      variant = 'lose';
    } else {
      headline = `Spieler ${winner} gewinnt!`;
      variant = 'win';
    }
  } else {
    headline = 'Spiel beendet';
  }

  const detail = reasonLabel(reason);

  return (
    <div className="overlay">
      <div className={`overlay-card overlay-${variant}`}>
        <h2>{headline}</h2>
        {detail && <p className="overlay-detail">{detail}</p>}
        <div className="overlay-actions">
          {reason !== 'opponent-left' && (
            <button className="primary-btn" onClick={onRematch}>
              Rematch
            </button>
          )}
          <button className="primary-btn secondary" onClick={onMenu}>
            Hauptmenü
          </button>
        </div>
      </div>
    </div>
  );
}
