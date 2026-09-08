import { lazy, Suspense } from 'react';
import { useGameStore } from '../game/store';
import { audio } from '../game/audio';
import { useT } from '../game/i18n';
import { PlayIcon, CosmeticsIcon, SettingsIcon, TrophyIcon } from './icons';

const IdleCube = lazy(() => import('../three/IdleCube').then((m) => ({ default: m.IdleCube })));

export function HomeScreen() {
  const t = useT();
  const background = useGameStore((s) => s.background);
  const markerColorTheme = useGameStore((s) => s.markerColorTheme);
  const markerShape = useGameStore((s) => s.markerShape);
  const campaignLevel3 = useGameStore((s) => s.campaignLevel3);
  const campaignLevel4 = useGameStore((s) => s.campaignLevel4);
  const bestCampaignLevel = Math.max(campaignLevel3, campaignLevel4);
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
        <Suspense fallback={null}>
          <IdleCube colorTheme={markerColorTheme} shape={markerShape} />
        </Suspense>
        <div className="home-backdrop-fade" />
      </div>

      <button className="app-settings-btn" onClick={click(goToAppSettings)} aria-label={t('appSettings.title')}>
        <SettingsIcon className="icon-btn-svg" />
      </button>

      <div className="home-content">
        <h1 className="game-title">
          <span>3D</span>
          <span className="game-title-accent">TIC·TAC·TOE</span>
        </h1>

        <div className="home-nav-wrap">
          <nav className="home-nav">
            <button className="nav-tile nav-tile-primary" onClick={click(playNow)}>
              <PlayIcon className="nav-icon" />
              <span className="nav-label">{t('home.play')}</span>
            </button>
            <button className="nav-tile" onClick={click(goToCampaign)}>
              <TrophyIcon className="nav-icon" />
              <span className="nav-label">{t('home.campaign')}</span>
              <span className="nav-badge">Lvl {bestCampaignLevel}</span>
            </button>
            <button className="nav-tile" onClick={click(goToCosmetics)}>
              <CosmeticsIcon className="nav-icon" />
              <span className="nav-label">{t('home.cosmetics')}</span>
            </button>
            <button className="nav-tile" onClick={click(goToSettings)}>
              <SettingsIcon className="nav-icon" />
              <span className="nav-label">{t('home.settings')}</span>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
