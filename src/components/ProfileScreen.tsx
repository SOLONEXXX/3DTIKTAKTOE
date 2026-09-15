import { useGameStore } from '../game/store';
import { audio } from '../game/audio';
import { useT } from '../game/i18n';
import { levelFromTotalXp } from '../game/progression';
import { rankInfo } from '../game/elo';
import { streakStillAlive } from '../game/daily';
import { BACKGROUNDS, COLOR_THEMES, MATERIALS, SHAPES, isUnlocked, type CosmeticKind } from '../game/cosmetics';
import { FlameIcon, SettingsIcon, StarIcon, SwordsIcon, TrophyIcon } from './icons';

function StatBlock({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="profile-stat" style={accent ? { ['--accent-override' as string]: accent } : undefined}>
      <span className="profile-stat-value">{value}</span>
      <span className="profile-stat-label">{label}</span>
    </div>
  );
}

export function ProfileScreen() {
  const t = useT();
  const playerName = useGameStore((s) => s.playerName);
  const totalXp = useGameStore((s) => s.totalXp);
  const stats = useGameStore((s) => s.stats);
  const onlineStats = useGameStore((s) => s.onlineStats);
  const rankedStats = useGameStore((s) => s.rankedStats);
  const rankedRating = useGameStore((s) => s.rankedRating);
  const campaignLevel3 = useGameStore((s) => s.campaignLevel3);
  const campaignLevel4 = useGameStore((s) => s.campaignLevel4);
  const stars3 = useGameStore((s) => s.stars3);
  const stars4 = useGameStore((s) => s.stars4);
  const survivalBest3 = useGameStore((s) => s.survivalBest3);
  const survivalBest4 = useGameStore((s) => s.survivalBest4);
  const dailyStreak = useGameStore((s) => s.dailyStreak);
  const dailyLastCompleted = useGameStore((s) => s.dailyLastCompleted);
  const ownedCosmetics = useGameStore((s) => s.ownedCosmetics);
  const peakTierIndex = useGameStore((s) => s.peakTierIndex);
  const cheatUnlockAll = useGameStore((s) => s.cheatUnlockAll);
  const goToScreen = useGameStore((s) => s.goToScreen);

  // "Collection" means everything you can actually equip, not just what you bought —
  // the starter items count too, otherwise a new player reads a flat zero.
  const collection = (() => {
    const ctx = {
      owned: ownedCosmetics,
      bestCampaignLevel: Math.max(campaignLevel3, campaignLevel4),
      peakTierIndex,
      cheatUnlockAll,
    };
    const pools: [CosmeticKind, { id: string }[]][] = [
      ['color', COLOR_THEMES],
      ['shape', SHAPES],
      ['material', MATERIALS],
      ['background', BACKGROUNDS],
    ];
    let unlocked = 0;
    let total = 0;
    for (const [kind, pool] of pools) {
      total += pool.length;
      for (const item of pool) if (isUnlocked(kind, item as never, ctx)) unlocked++;
    }
    return `${unlocked}/${total}`;
  })();

  const progress = levelFromTotalXp(totalXp);
  const rank = rankInfo(rankedRating);
  const totalStars =
    Object.values(stars3).reduce((a, b) => a + b, 0) + Object.values(stars4).reduce((a, b) => a + b, 0);
  const streak = streakStillAlive(dailyLastCompleted) ? dailyStreak : 0;
  const totalWins = stats.wins + onlineStats.wins + rankedStats.wins;

  return (
    <div className="screen tab-screen profile-screen">
      <div className="screen-head">
        <h1 className="screen-title">{t('tab.profile')}</h1>
      </div>

      <div className="profile-hero">
        <div className="profile-level-badge">{progress.level}</div>
        <div className="profile-hero-text">
          <span className="profile-name">{playerName || 'Spieler'}</span>
          <span className="profile-xp-line">
            {t('profile.xpLine', { into: progress.xpIntoLevel, need: progress.xpForNext })}
          </span>
          <span className="status-xp-track wide">
            <span className="status-xp-fill" style={{ width: `${Math.round(progress.progress * 100)}%` }} />
          </span>
        </div>
      </div>

      <div className="profile-grid">
        <StatBlock label={t('profile.totalWins')} value={totalWins} />
        <StatBlock label={t('profile.stars')} value={totalStars} accent="#ffd35c" />
        <StatBlock label={t('profile.rank')} value={rank.label} accent={rank.tier.color} />
        <StatBlock label={t('profile.streak')} value={streak} accent="#ff8a3d" />
      </div>

      <section className="menu-section">
        <h2>
          <TrophyIcon className="section-icon" /> {t('campaign.title')}
        </h2>
        <div className="profile-grid">
          <StatBlock label="3×3×3" value={t('cosmetics.level', { n: campaignLevel3 })} />
          <StatBlock label="4×4×4" value={t('cosmetics.level', { n: campaignLevel4 })} />
        </div>
      </section>

      <section className="menu-section">
        <h2>
          <FlameIcon className="section-icon" /> {t('survival.title')}
        </h2>
        <div className="profile-grid">
          <StatBlock label="3×3×3" value={survivalBest3} />
          <StatBlock label="4×4×4" value={survivalBest4} />
        </div>
      </section>

      <section className="menu-section">
        <h2>
          <SwordsIcon className="section-icon" /> {t('profile.record')}
        </h2>
        <div className="profile-record">
          <div className="profile-record-row">
            <span>{t('settings.modeBot')}</span>
            <span className="profile-record-value">
              {stats.wins}/{stats.losses}/{stats.draws}
            </span>
          </div>
          <div className="profile-record-row">
            <span>{t('ranked.title')}</span>
            <span className="profile-record-value">
              {rankedStats.wins}/{rankedStats.losses}/{rankedStats.draws}
            </span>
          </div>
          <div className="profile-record-row">
            <span>{t('settings.modeOnline')}</span>
            <span className="profile-record-value">
              {onlineStats.wins}/{onlineStats.losses}/{onlineStats.draws}
            </span>
          </div>
          <div className="profile-record-row">
            <span>
              <StarIcon className="inline-star" /> {t('profile.collection')}
            </span>
            <span className="profile-record-value">{collection}</span>
          </div>
        </div>
      </section>

      <div className="profile-actions">
        <button className="primary-btn secondary" onClick={() => { audio.playClick(); goToScreen('settings'); }}>
          <SettingsIcon className="icon-btn-svg inline-icon" />
          {t('settings.title')}
        </button>
        <button className="primary-btn secondary" onClick={() => { audio.playClick(); goToScreen('app-settings'); }}>
          <SettingsIcon className="icon-btn-svg inline-icon" />
          {t('appSettings.title')}
        </button>
      </div>
    </div>
  );
}
