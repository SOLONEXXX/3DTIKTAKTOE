import { useGameStore } from '../game/store';
import { audio } from '../game/audio';
import { IdleCube } from '../three/IdleCube';
import { PlayIcon, CosmeticsIcon, SettingsIcon, TrophyIcon } from './icons';

export function HomeScreen() {
  const background = useGameStore((s) => s.background);
  const markerColorTheme = useGameStore((s) => s.markerColorTheme);
  const markerShape = useGameStore((s) => s.markerShape);
  const campaignLevel = useGameStore((s) => s.campaignLevel);
  const playNow = useGameStore((s) => s.playNow);
  const goToSettings = useGameStore((s) => s.goToSettings);
  const goToCosmetics = useGameStore((s) => s.goToCosmetics);
  const goToAppSettings = useGameStore((s) => s.goToAppSettings);
  const goToCampaign = useGameStore((s) => s.goToCampaign);

  const click = (fn: () => void) => () => {
    audio.playClick();
    fn();
  };

  return (
    <div className="screen home-screen">
      <div className={`home-backdrop bg-${background}`}>
        <IdleCube colorTheme={markerColorTheme} shape={markerShape} />
        <div className="home-backdrop-fade" />
      </div>

      <button className="app-settings-btn" onClick={click(goToAppSettings)} aria-label="App-Einstellungen">
        <SettingsIcon className="icon-btn-svg" />
      </button>

      <div className="home-content">
        <h1 className="game-title">
          <span>3D</span>
          <span className="game-title-accent">TIC·TAC·TOE</span>
        </h1>

        <nav className="home-nav">
          <button className="nav-tile nav-tile-primary" onClick={click(playNow)}>
            <PlayIcon className="nav-icon" />
            <span className="nav-label">Play</span>
          </button>
          <button className="nav-tile" onClick={click(goToCampaign)}>
            <TrophyIcon className="nav-icon" />
            <span className="nav-label">Level-Modus</span>
            <span className="nav-badge">Lvl {campaignLevel}</span>
          </button>
          <button className="nav-tile" onClick={click(goToCosmetics)}>
            <CosmeticsIcon className="nav-icon" />
            <span className="nav-label">Cosmetics</span>
          </button>
          <button className="nav-tile" onClick={click(goToSettings)}>
            <SettingsIcon className="nav-icon" />
            <span className="nav-label">Settings</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
