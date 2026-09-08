import { useGameStore } from '../game/store';
import { audio } from '../game/audio';
import { useT } from '../game/i18n';
import { campaignBlockedCount, campaignDifficulty } from '../game/campaign';
import { BackIcon, TrophyIcon } from './icons';
import { BoardSizeSwitch } from './BoardSizeSwitch';

export function CampaignScreen() {
  const t = useT();
  const campaignBoardSize = useGameStore((s) => s.campaignBoardSize);
  const campaignLevel3 = useGameStore((s) => s.campaignLevel3);
  const campaignLevel4 = useGameStore((s) => s.campaignLevel4);
  const playerName = useGameStore((s) => s.playerName);
  const setCampaignBoardSize = useGameStore((s) => s.setCampaignBoardSize);
  const startCampaignLevel = useGameStore((s) => s.startCampaignLevel);
  const goHome = useGameStore((s) => s.goHome);

  const campaignLevel = campaignBoardSize === 3 ? campaignLevel3 : campaignLevel4;
  const difficulty = campaignDifficulty(campaignLevel);
  const blockedCount = campaignBlockedCount(campaignLevel, campaignBoardSize);

  const start = () => {
    audio.playClick();
    startCampaignLevel(campaignLevel, campaignBoardSize);
  };

  return (
    <div className="screen campaign-screen">
      <div className="settings-topbar">
        <button className="icon-btn" onClick={() => { audio.playClick(); goHome(); }} aria-label={t('lobby.back')}>
          <BackIcon className="icon-btn-svg" />
        </button>
        <h1 className="settings-title">{t('campaign.title')}</h1>
        <div className="icon-btn-spacer" />
      </div>

      <div className="settings-scroll">
        <BoardSizeSwitch value={campaignBoardSize} onChange={(size) => { audio.playClick(); setCampaignBoardSize(size); }} />

        <div className="campaign-hero">
          <TrophyIcon className="campaign-trophy" />
          <div className="campaign-level-number">{t('cosmetics.level', { n: campaignLevel })}</div>
          <div className="campaign-level-sub">{t('campaign.of')} · {campaignBoardSize}×{campaignBoardSize}×{campaignBoardSize}</div>
        </div>

        <div className="campaign-stats">
          <div className="campaign-stat">
            <span className="campaign-stat-label">{t('campaign.botStrength')}</span>
            <span className="campaign-stat-value">{difficulty}%</span>
          </div>
          {blockedCount > 0 && (
            <div className="campaign-stat">
              <span className="campaign-stat-label">{t('campaign.blockedCells')}</span>
              <span className="campaign-stat-value">{blockedCount}</span>
            </div>
          )}
        </div>

        <section className="menu-section">
          <h2>{t('campaign.scoreboard')}</h2>
          <div className="scoreboard-row">
            <span className="scoreboard-name">{playerName}</span>
            <span className="scoreboard-level">3×3: Lvl {campaignLevel3}</span>
          </div>
          <div className="scoreboard-row" style={{ marginTop: 8 }}>
            <span className="scoreboard-name">{playerName}</span>
            <span className="scoreboard-level">4×4: Lvl {campaignLevel4}</span>
          </div>
          <p className="field-hint">{t('campaign.scoreboardHint')}</p>
        </section>
      </div>

      <button className="primary-btn" onClick={start}>
        {t('campaign.start', { n: campaignLevel })}
      </button>
    </div>
  );
}
