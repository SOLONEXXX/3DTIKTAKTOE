import { useGameStore } from '../game/store';
import { audio } from '../game/audio';
import { levelFromTotalXp } from '../game/progression';
import { useT } from '../game/i18n';
import { SettingsIcon, ShardIcon } from './icons';

/** Persistent top bar on all menu screens: who you are, what you own, one settings door. */
export function StatusBar() {
  const t = useT();
  const totalXp = useGameStore((s) => s.totalXp);
  const shards = useGameStore((s) => s.shards);
  const playerName = useGameStore((s) => s.playerName);
  const goToScreen = useGameStore((s) => s.goToScreen);

  const progress = levelFromTotalXp(totalXp);

  return (
    <div className="status-bar">
      <button
        className="status-identity"
        onClick={() => { audio.playClick(); goToScreen('profile'); }}
      >
        <span className="status-level-badge">{progress.level}</span>
        <span className="status-identity-text">
          <span className="status-name">{playerName || 'Spieler'}</span>
          <span className="status-xp-track">
            <span className="status-xp-fill" style={{ width: `${Math.round(progress.progress * 100)}%` }} />
          </span>
        </span>
      </button>

      <div className="status-currency">
        <ShardIcon className="status-currency-icon" />
        <span>{shards.toLocaleString('de-DE')}</span>
      </div>

      <button
        className="icon-btn status-settings"
        onClick={() => { audio.playClick(); goToScreen('app-settings'); }}
        aria-label={t('appSettings.title')}
      >
        <SettingsIcon className="icon-btn-svg" />
      </button>
    </div>
  );
}
