import { useState } from 'react';
import type { GameOverReason } from '../game/store';
import type { GameMode, Player } from '../game/types';
import { audio } from '../game/audio';
import { useT } from '../game/i18n';
import { COLOR_THEMES, SHAPES } from '../game/cosmetics';
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

export function WinnerOverlay({ winner, reason, mode, localPlayer, campaignLevel, onRematch, onMenu }: WinnerOverlayProps) {
  const t = useT();
  const [shared, setShared] = useState(false);
  if (!reason) return null;

  const isCampaign = mode === 'campaign';
  let headline: string;
  let variant: 'win' | 'lose' | 'draw' = 'draw';
  let unlock: string | null = null;

  if (reason === 'draw') {
    headline = isCampaign ? t('winner.drawCampaign', { n: campaignLevel }) : t('winner.draw');
  } else if (winner) {
    const isLocalWinner = (mode === 'bot' || mode === 'online' || mode === 'campaign') && winner === localPlayer;
    const isLocalLoser = (mode === 'bot' || mode === 'online' || mode === 'campaign') && winner !== localPlayer;
    if (isLocalWinner) {
      variant = 'win';
      if (isCampaign) {
        headline = t('winner.winCampaign', { n: campaignLevel });
        const nextLevel = campaignLevel + 1;
        const color = COLOR_THEMES.find((c) => c.unlockLevel === nextLevel);
        const shape = SHAPES.find((s) => s.unlockLevel === nextLevel);
        unlock = color ? t('winner.unlockColor', { label: color.label }) : shape ? t('winner.unlockShape', { label: shape.label }) : null;
      } else {
        headline = t('winner.win');
      }
    } else if (isLocalLoser) {
      headline = isCampaign ? t('winner.loseCampaign', { n: campaignLevel }) : t('winner.lose');
      variant = 'lose';
    } else {
      headline = t('winner.winsGeneric', { p: winner });
      variant = 'win';
    }
  } else {
    headline = t('winner.gameOver');
  }

  const detail =
    reason === 'timeout' ? t('winner.reasonTimeout')
    : reason === 'resign' ? t('winner.reasonResign')
    : reason === 'opponent-left' ? t('winner.reasonOpponentLeft')
    : '';

  const rematchLabel = isCampaign
    ? variant === 'win'
      ? t('winner.nextLevel', { n: campaignLevel + 1 })
      : t('winner.retryLevel', { n: campaignLevel })
    : t('winner.rematch');

  const shareText = isCampaign ? t('winner.shareTextCampaign', { n: campaignLevel }) : t('winner.shareTextWin');

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
        {unlock && <p className="overlay-unlock">{t('winner.unlocked', { what: unlock })}</p>}
        <div className="overlay-actions">
          {reason !== 'opponent-left' && (
            <button className="primary-btn" onClick={() => { audio.playClick(); onRematch(); }}>
              {rematchLabel}
            </button>
          )}
          {variant === 'win' && (
            <button className="primary-btn secondary" onClick={handleShare}>
              <ShareIcon className="icon-btn-svg inline-icon" />
              {shared ? t('winner.shared') : t('winner.share')}
            </button>
          )}
          <button className="primary-btn secondary" onClick={() => { audio.playClick(); onMenu(); }}>
            {t('winner.menu')}
          </button>
        </div>
      </div>
    </div>
  );
}
