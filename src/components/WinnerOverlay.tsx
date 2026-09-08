import { useState } from 'react';
import type { GameOverReason } from '../game/store';
import type { GameMode, Player } from '../game/types';
import { audio } from '../game/audio';
import { COLOR_THEMES, SHAPES } from '../game/cosmetics';
import { CAMPAIGN_MAX_LEVEL } from '../game/campaign';
import { ShareIcon } from './icons';

interface WinnerOverlayProps {
  winner: Player | null;
  reason: GameOverReason;
  mode: GameMode;
  localPlayer: Player;
  campaignLevel: number;
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

function unlockedAt(level: number): string | null {
  const color = COLOR_THEMES.find((c) => c.unlockLevel === level);
  if (color) return `Farbschema "${color.label}"`;
  const shape = SHAPES.find((s) => s.unlockLevel === level);
  if (shape) return `Form "${shape.label}"`;
  return null;
}

export function WinnerOverlay({ winner, reason, mode, localPlayer, campaignLevel, onRematch, onMenu }: WinnerOverlayProps) {
  const [shared, setShared] = useState(false);
  if (!reason) return null;

  const isCampaign = mode === 'campaign';
  let headline: string;
  let variant: 'win' | 'lose' | 'draw' = 'draw';
  let unlock: string | null = null;

  if (reason === 'draw') {
    headline = isCampaign ? `Unentschieden — Level ${campaignLevel} nochmal!` : 'Unentschieden!';
  } else if (winner) {
    const isLocalWinner = (mode === 'bot' || mode === 'online' || mode === 'campaign') && winner === localPlayer;
    const isLocalLoser = (mode === 'bot' || mode === 'online' || mode === 'campaign') && winner !== localPlayer;
    if (isLocalWinner) {
      variant = 'win';
      if (isCampaign) {
        headline = campaignLevel >= CAMPAIGN_MAX_LEVEL ? 'Alle 100 Level gemeistert! 🏆' : `Level ${campaignLevel} geschafft! 🎉`;
        unlock = unlockedAt(campaignLevel + 1);
      } else {
        headline = 'Du gewinnst! 🎉';
      }
    } else if (isLocalLoser) {
      headline = isCampaign ? `Verloren — Level ${campaignLevel} nochmal versuchen` : 'Verloren';
      variant = 'lose';
    } else {
      headline = `Spieler ${winner} gewinnt!`;
      variant = 'win';
    }
  } else {
    headline = 'Spiel beendet';
  }

  const detail = reasonLabel(reason);
  const rematchLabel = isCampaign
    ? variant === 'win' && campaignLevel < CAMPAIGN_MAX_LEVEL
      ? `Level ${campaignLevel + 1} →`
      : `Level ${campaignLevel} wiederholen`
    : 'Rematch';

  const shareText = isCampaign
    ? `Ich habe gerade Level ${campaignLevel} in 3D Tic-Tac-Toe geschafft! 🎉`
    : 'Ich habe gerade in 3D Tic-Tac-Toe gewonnen! 🎉';

  const handleShare = async () => {
    audio.playClick();
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch {
        // user cancelled the native share sheet — nothing to do
      }
      return;
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareText);
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    }
  };

  return (
    <div className="overlay">
      <div className={`overlay-card overlay-${variant}`}>
        <h2>{headline}</h2>
        {detail && <p className="overlay-detail">{detail}</p>}
        {unlock && <p className="overlay-unlock">🔓 Neu freigeschaltet: {unlock}</p>}
        <div className="overlay-actions">
          {reason !== 'opponent-left' && (
            <button className="primary-btn" onClick={() => { audio.playClick(); onRematch(); }}>
              {rematchLabel}
            </button>
          )}
          {variant === 'win' && (
            <button className="primary-btn secondary" onClick={handleShare}>
              <ShareIcon className="icon-btn-svg inline-icon" />
              {shared ? 'Kopiert!' : 'Teilen'}
            </button>
          )}
          <button className="primary-btn secondary" onClick={() => { audio.playClick(); onMenu(); }}>
            Hauptmenü
          </button>
        </div>
      </div>
    </div>
  );
}
