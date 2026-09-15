import { useEffect, useState } from 'react';
import { useGameStore } from '../game/store';
import { audio } from '../game/audio';
import { useT } from '../game/i18n';
import { campaignBlockedCount, campaignDifficulty, starTargets } from '../game/campaign';
import { LEVELS_PER_WORLD, visibleWorldCount, worldAt, worldIndexForLevel } from '../game/worlds';
import { LockIcon, StarIcon } from './icons';
import { BoardSizeSwitch } from './BoardSizeSwitch';

function StarRow({ stars, className }: { stars: number; className?: string }) {
  return (
    <span className={`star-row ${className ?? ''}`}>
      {[1, 2, 3].map((i) => (
        <StarIcon key={i} className={`star-pip ${i <= stars ? 'filled' : ''}`} />
      ))}
    </span>
  );
}

export function LevelMapScreen() {
  const t = useT();
  const campaignBoardSize = useGameStore((s) => s.campaignBoardSize);
  const campaignLevel3 = useGameStore((s) => s.campaignLevel3);
  const campaignLevel4 = useGameStore((s) => s.campaignLevel4);
  const stars3 = useGameStore((s) => s.stars3);
  const stars4 = useGameStore((s) => s.stars4);
  const setCampaignBoardSize = useGameStore((s) => s.setCampaignBoardSize);
  const startCampaignLevel = useGameStore((s) => s.startCampaignLevel);

  const highestLevel = campaignBoardSize === 3 ? campaignLevel3 : campaignLevel4;
  const stars = campaignBoardSize === 3 ? stars3 : stars4;
  const [worldIndex, setWorldIndex] = useState(() => worldIndexForLevel(highestLevel));

  // Switching track re-centres the map on wherever that track actually is.
  useEffect(() => {
    setWorldIndex(worldIndexForLevel(highestLevel));
  }, [campaignBoardSize, highestLevel]);

  const world = worldAt(worldIndex);
  const worldCount = visibleWorldCount(highestLevel);
  const levels = Array.from({ length: LEVELS_PER_WORLD }, (_, i) => world.firstLevel + i);
  const worldStars = levels.reduce((sum, level) => sum + (stars[String(level)] ?? 0), 0);
  const totalStars = Object.values(stars).reduce((sum, value) => sum + value, 0);
  const targets = starTargets(campaignBoardSize);

  const play = (level: number) => {
    audio.playClick();
    startCampaignLevel(level, campaignBoardSize);
  };

  return (
    <div className="screen tab-screen level-map-screen">
      <div className="screen-head">
        <h1 className="screen-title">{t('campaign.title')}</h1>
        <span className="screen-head-meta">
          <StarIcon className="star-pip filled" /> {totalStars}
        </span>
      </div>

      <BoardSizeSwitch value={campaignBoardSize} onChange={(v) => { audio.playClick(); setCampaignBoardSize(v); }} />

      <div className="world-strip">
        {Array.from({ length: worldCount }, (_, i) => {
          const entry = worldAt(i);
          const unlocked = highestLevel >= entry.firstLevel;
          return (
            <button
              key={i}
              className={`world-chip bg-${entry.background} ${i === worldIndex ? 'selected' : ''} ${unlocked ? '' : 'locked'}`}
              onClick={() => { audio.playClick(); setWorldIndex(i); }}
              style={{ ['--world-accent' as string]: entry.accent }}
            >
              <span className="world-chip-index">{i + 1}</span>
              <span className="world-chip-name">{entry.title}</span>
              {!unlocked && <LockIcon className="world-chip-lock" />}
            </button>
          );
        })}
      </div>

      <div className={`world-banner bg-${world.background}`} style={{ ['--world-accent' as string]: world.accent }}>
        <div className="world-banner-inner">
          <span className="world-banner-name">{world.title}</span>
          <span className="world-banner-meta">
            {t('campaign.levelRange', { from: world.firstLevel, to: world.lastLevel })}
          </span>
          <span className="world-banner-stars">
            <StarIcon className="star-pip filled" /> {worldStars} / {LEVELS_PER_WORLD * 3}
          </span>
        </div>
      </div>

      <div className="level-grid">
        {levels.map((level) => {
          const unlocked = level <= highestLevel;
          const earned = stars[String(level)] ?? 0;
          const isCurrent = level === highestLevel;
          return (
            <button
              key={level}
              className={`level-tile ${unlocked ? '' : 'locked'} ${isCurrent ? 'current' : ''} ${earned > 0 ? 'cleared' : ''}`}
              disabled={!unlocked}
              onClick={() => unlocked && play(level)}
            >
              {unlocked ? (
                <>
                  <span className="level-tile-number">{level}</span>
                  <StarRow stars={earned} />
                </>
              ) : (
                <LockIcon className="level-tile-lock" />
              )}
            </button>
          );
        })}
      </div>

      <p className="field-hint level-map-hint">
        {t('campaign.starHint', { two: targets.two, three: targets.three })}
      </p>

      <div className="level-map-footer">
        <div className="level-preview">
          <span className="level-preview-item">
            <span className="level-preview-label">{t('campaign.botStrength')}</span>
            <span className="level-preview-value">{campaignDifficulty(highestLevel)}%</span>
          </span>
          {campaignBlockedCount(highestLevel, campaignBoardSize) > 0 && (
            <span className="level-preview-item">
              <span className="level-preview-label">{t('campaign.blockedCells')}</span>
              <span className="level-preview-value">{campaignBlockedCount(highestLevel, campaignBoardSize)}</span>
            </span>
          )}
        </div>
        <button className="primary-btn" onClick={() => play(highestLevel)}>
          {t('campaign.continue', { n: highestLevel })}
        </button>
      </div>
    </div>
  );
}
