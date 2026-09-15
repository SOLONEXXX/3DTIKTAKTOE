import { useState } from 'react';
import { useGameStore, type GameOverReason } from '../game/store';
import type { GameMode, Player } from '../game/types';
import { audio } from '../game/audio';
import { useT } from '../game/i18n';
import { COLOR_THEMES, MATERIALS, SHAPES, BACKGROUNDS } from '../game/cosmetics';
import { rankInfo } from '../game/elo';
import { ShardIcon, ShareIcon, StarIcon } from './icons';

interface WinnerOverlayProps {
  winner: Player | null;
  reason: GameOverReason;
  mode: GameMode;
  localPlayer: Player;
  campaignLevel: number;
  onRematch: () => void;
  onMenu: () => void;
}

function cosmeticLabel(kind: string, id: string): string {
  const pools: Record<string, { id: string; label: string }[]> = {
    color: COLOR_THEMES,
    shape: SHAPES,
    material: MATERIALS,
    background: BACKGROUNDS,
  };
  return pools[kind]?.find((entry) => entry.id === id)?.label ?? id;
}

export function WinnerOverlay({ winner, reason, mode, localPlayer, campaignLevel, onRematch, onMenu }: WinnerOverlayProps) {
  const t = useT();
  const [shared, setShared] = useState(false);
  const result = useGameStore((s) => s.lastResult);
  const survivalBest3 = useGameStore((s) => s.survivalBest3);
  const survivalBest4 = useGameStore((s) => s.survivalBest4);
  const size = useGameStore((s) => s.size);
  const rating = useGameStore((s) => s.rankedRating);

  if (!reason) return null;

  const isCampaign = mode === 'campaign';
  const isSurvival = mode === 'survival';
  const isRanked = mode === 'ranked';
  const isDaily = mode === 'daily';

  const localWon = mode === 'local' ? true : winner === localPlayer;
  let headline: string;
  let variant: 'win' | 'lose' | 'draw' = 'draw';

  if (reason === 'draw') {
    headline = isCampaign ? t('winner.drawCampaign', { n: campaignLevel }) : t('winner.draw');
  } else if (winner) {
    if (mode === 'local') {
      headline = t('winner.winsGeneric', { p: winner });
      variant = 'win';
    } else if (localWon) {
      variant = 'win';
      if (isCampaign) headline = t('winner.winCampaign', { n: campaignLevel });
      else if (isSurvival) headline = t('survival.cleared', { n: result?.survivalRounds ?? 0 });
      else if (isDaily) headline = t('daily.cleared');
      else headline = t('winner.win');
    } else {
      variant = 'lose';
      if (isCampaign) headline = t('winner.loseCampaign', { n: campaignLevel });
      else if (isSurvival) headline = t('survival.over', { n: result?.survivalRounds ?? 0 });
      else headline = t('winner.lose');
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
    : isSurvival
      ? variant === 'win'
        ? t('survival.next')
        : t('survival.restart')
      : isRanked
        ? t('ranked.next')
        : t('winner.rematch');

  const shareText = isCampaign
    ? t('winner.shareTextCampaign', { n: campaignLevel })
    : isSurvival
      ? t('survival.share', { n: result?.survivalRounds ?? 0 })
      : t('winner.shareTextWin');

  const handleShare = async () => {
    audio.playClick();
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch {
        // user cancelled the native share sheet
      }
      return;
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareText);
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    }
  };

  const rewards = result?.rewards;
  const ratingChange = result?.rating ?? null;
  const survivalBest = size === 3 ? survivalBest3 : survivalBest4;

  return (
    <div className="overlay">
      <div className={`overlay-card overlay-${variant}`}>
        <h2>{headline}</h2>
        {detail && <p className="overlay-detail">{detail}</p>}

        {isCampaign && variant === 'win' && (
          <div className="overlay-stars">
            {[1, 2, 3].map((i) => (
              <StarIcon key={i} className={`overlay-star ${i <= (result?.stars ?? 0) ? 'filled' : ''}`} />
            ))}
          </div>
        )}

        {isSurvival && <p className="overlay-detail">{t('survival.best', { n: survivalBest })}</p>}

        {isRanked && ratingChange && (
          <div className="overlay-rating">
            <span className={`overlay-rating-delta ${ratingChange.delta >= 0 ? 'up' : 'down'}`}>
              {ratingChange.delta >= 0 ? '+' : ''}
              {ratingChange.delta}
            </span>
            <span className="overlay-rating-value">{rating}</span>
            <span className="overlay-rating-rank">{rankInfo(rating).label}</span>
            {ratingChange.floored && <span className="overlay-rating-floor">{t('ranked.floorSaved')}</span>}
          </div>
        )}

        {rewards && rewards.lines.length > 0 && (
          <div className="reward-list">
            {rewards.lines.map((line, i) => (
              <div className="reward-line" key={`${line.key}-${i}`}>
                <span className="reward-reason">{t(line.key, { n: line.amount ?? 0 })}</span>
                <span className="reward-values">
                  <span className="reward-xp">+{line.xp} XP</span>
                  <span className="reward-shards">
                    <ShardIcon className="reward-shard-icon" />
                    {line.shards}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}

        {result && result.levelUps > 0 && (
          <p className="overlay-levelup">{t('reward.levelUp', { n: result.newPlayerLevel })}</p>
        )}

        {result && result.unlocked.length > 0 && (
          <div className="overlay-unlocks">
            {result.unlocked.map((item) => (
              <p className="overlay-unlock" key={`${item.kind}:${item.id}`}>
                {t('winner.unlocked', { what: cosmeticLabel(item.kind, item.id) })}
              </p>
            ))}
          </div>
        )}

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
