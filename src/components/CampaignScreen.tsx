import { useGameStore } from '../game/store';
import { audio } from '../game/audio';
import { campaignBlockedCount, campaignDifficulty, CAMPAIGN_MAX_LEVEL } from '../game/campaign';
import { BackIcon, TrophyIcon } from './icons';

export function CampaignScreen() {
  const campaignLevel = useGameStore((s) => s.campaignLevel);
  const playerName = useGameStore((s) => s.playerName);
  const startCampaignLevel = useGameStore((s) => s.startCampaignLevel);
  const goHome = useGameStore((s) => s.goHome);

  const difficulty = campaignDifficulty(campaignLevel);
  const blockedCount = campaignBlockedCount(campaignLevel);

  const start = () => {
    audio.playClick();
    startCampaignLevel(campaignLevel);
  };

  return (
    <div className="screen campaign-screen">
      <div className="settings-topbar">
        <button className="icon-btn" onClick={() => { audio.playClick(); goHome(); }} aria-label="Zurück">
          <BackIcon className="icon-btn-svg" />
        </button>
        <h1 className="settings-title">Level-Modus</h1>
        <div className="icon-btn-spacer" />
      </div>

      <div className="settings-scroll">
        <div className="campaign-hero">
          <TrophyIcon className="campaign-trophy" />
          <div className="campaign-level-number">Level {campaignLevel}</div>
          <div className="campaign-level-sub">von {CAMPAIGN_MAX_LEVEL}</div>
        </div>

        <div className="campaign-stats">
          <div className="campaign-stat">
            <span className="campaign-stat-label">Bot-Stärke</span>
            <span className="campaign-stat-value">{difficulty}%</span>
          </div>
          <div className="campaign-stat">
            <span className="campaign-stat-label">Gesperrte Felder</span>
            <span className="campaign-stat-value">{blockedCount > 0 ? blockedCount : '–'}</span>
          </div>
        </div>

        <section className="menu-section">
          <h2>Scoreboard</h2>
          <div className="scoreboard-row">
            <span className="scoreboard-name">{playerName}</span>
            <span className="scoreboard-level">Level {campaignLevel}</span>
          </div>
          <p className="field-hint">
            Aktuell nur lokal auf diesem Gerät gespeichert — ein geteiltes Online-Scoreboard kommt, sobald der
            Mehrspieler-Server steht.
          </p>
        </section>
      </div>

      <button className="primary-btn" onClick={start}>
        Level {campaignLevel} starten
      </button>
    </div>
  );
}
