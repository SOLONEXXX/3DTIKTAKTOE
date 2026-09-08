import { useGameStore } from '../game/store';
import { IdleCube } from '../three/IdleCube';
import { PlayIcon, CosmeticsIcon, SettingsIcon } from './icons';

export function HomeScreen() {
  const background = useGameStore((s) => s.background);
  const playNow = useGameStore((s) => s.playNow);
  const goToSettings = useGameStore((s) => s.goToSettings);
  const goToCosmetics = useGameStore((s) => s.goToCosmetics);

  return (
    <div className="screen home-screen">
      <div className={`home-backdrop bg-${background}`}>
        <IdleCube />
        <div className="home-backdrop-fade" />
      </div>

      <div className="home-content">
        <h1 className="game-title">
          <span>3D</span>
          <span className="game-title-accent">TIC·TAC·TOE</span>
        </h1>

        <nav className="home-nav">
          <button className="nav-tile nav-tile-primary" onClick={playNow}>
            <PlayIcon className="nav-icon" />
            <span className="nav-label">Play</span>
          </button>
          <button className="nav-tile" onClick={goToCosmetics}>
            <CosmeticsIcon className="nav-icon" />
            <span className="nav-label">Cosmetics</span>
          </button>
          <button className="nav-tile" onClick={goToSettings}>
            <SettingsIcon className="nav-icon" />
            <span className="nav-label">Settings</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
