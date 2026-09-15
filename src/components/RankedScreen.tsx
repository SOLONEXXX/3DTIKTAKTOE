import { useGameStore } from '../game/store';
import { audio } from '../game/audio';
import { useT } from '../game/i18n';
import { daysLeftInSeason, PLACEMENT_GAMES, rankInfo, seasonNumber, TIERS } from '../game/elo';
import { BoardSizeSwitch } from './BoardSizeSwitch';
import { SwordsIcon } from './icons';

export function RankedScreen() {
  const t = useT();
  const rating = useGameStore((s) => s.rankedRating);
  const rankedGames = useGameStore((s) => s.rankedGames);
  const rankedStats = useGameStore((s) => s.rankedStats);
  const rankedWinStreak = useGameStore((s) => s.rankedWinStreak);
  const peakTierIndex = useGameStore((s) => s.peakTierIndex);
  const size = useGameStore((s) => s.size);
  const setSize = useGameStore((s) => s.setSize);
  const startRankedMatch = useGameStore((s) => s.startRankedMatch);

  const rank = rankInfo(rating);
  const placementLeft = Math.max(0, PLACEMENT_GAMES - rankedGames);
  const played = rankedStats.wins + rankedStats.losses + rankedStats.draws;
  const winRate = played > 0 ? Math.round((rankedStats.wins / played) * 100) : 0;

  return (
    <div className="screen tab-screen ranked-screen">
      <div className="screen-head">
        <h1 className="screen-title">{t('ranked.title')}</h1>
        <span className="screen-head-meta">
          {t('ranked.season', { n: seasonNumber() })} · {t('ranked.daysLeft', { n: daysLeftInSeason() })}
        </span>
      </div>

      <div className="rank-hero" style={{ ['--rank-color' as string]: rank.tier.color }}>
        <div className="rank-emblem">{rank.tier.icon}</div>
        <div className="rank-label">{rank.label}</div>
        <div className="rank-rating">{rating}</div>
        {rank.nextAt !== null ? (
          <>
            <div className="rank-track">
              <div className="rank-track-fill" style={{ width: `${Math.round(rank.progress * 100)}%` }} />
            </div>
            <div className="rank-next">
              {/* Division I is the top of its tier, so the next step up is a whole league. */}
              {t(rank.division === 1 ? 'ranked.toNextTier' : 'ranked.toNext', { n: Math.max(0, rank.nextAt - rating) })}
            </div>
          </>
        ) : (
          <div className="rank-next">{t('ranked.top')}</div>
        )}
      </div>

      {placementLeft > 0 && (
        <div className="placement-banner">
          {t('ranked.placement', { n: placementLeft })}
        </div>
      )}

      <div className="ranked-stats">
        <div className="stat-pill">
          <span className="stat-pill-value">{rankedStats.wins}</span>
          <span className="stat-pill-label">{t('appSettings.wins')}</span>
        </div>
        <div className="stat-pill">
          <span className="stat-pill-value">{winRate}%</span>
          <span className="stat-pill-label">{t('ranked.winRate')}</span>
        </div>
        <div className="stat-pill">
          <span className="stat-pill-value">{rankedWinStreak}</span>
          <span className="stat-pill-label">{t('ranked.streak')}</span>
        </div>
      </div>

      <section className="menu-section">
        <h2>{t('settings.board')}</h2>
        <BoardSizeSwitch value={size} onChange={(v) => { audio.playClick(); setSize(v); }} />
      </section>

      <section className="menu-section">
        <h2>{t('ranked.tiers')}</h2>
        <div className="tier-ladder">
          {TIERS.map((tier, index) => (
            <div
              key={tier.id}
              className={`tier-row ${index === rank.tierIndex ? 'current' : ''} ${index <= peakTierIndex ? 'reached' : ''}`}
              style={{ ['--rank-color' as string]: tier.color }}
            >
              <span className="tier-icon">{tier.icon}</span>
              <span className="tier-name">{tier.name}</span>
              <span className="tier-min">{tier.min}+</span>
            </div>
          ))}
        </div>
        <p className="field-hint">{t('ranked.floorHint')}</p>
      </section>

      <button className="primary-btn ranked-play" onClick={() => { audio.playClick(); startRankedMatch(); }}>
        <SwordsIcon className="icon-btn-svg inline-icon" />
        {t('ranked.play')}
      </button>
      <p className="field-hint ranked-disclaimer">{t('ranked.cpuNote')}</p>
    </div>
  );
}
