import { useGameStore } from '../game/store';
import { IdleCube } from '../three/IdleCube';
import { BackIcon } from './icons';
import type { BackgroundTheme } from '../game/types';

const THEMES: { id: BackgroundTheme; label: string }[] = [
  { id: 'nebula', label: 'Nebel' },
  { id: 'ocean', label: 'Ozean' },
  { id: 'sunset', label: 'Sonnenuntergang' },
  { id: 'starfield', label: 'Sternenfeld' },
  { id: 'void', label: 'Leere' },
];

export function CosmeticsScreen() {
  const background = useGameStore((s) => s.background);
  const setBackground = useGameStore((s) => s.setBackground);
  const goHome = useGameStore((s) => s.goHome);

  return (
    <div className="screen cosmetics-screen">
      <div className="settings-topbar">
        <button className="icon-btn" onClick={goHome} aria-label="Zurück">
          <BackIcon className="icon-btn-svg" />
        </button>
        <h1 className="settings-title">Cosmetics</h1>
        <div className="icon-btn-spacer" />
      </div>

      <div className={`cosmetics-preview bg-${background}`}>
        <IdleCube />
      </div>

      <div className="settings-scroll">
        <section className="menu-section">
          <h2>Würfel-Hintergrund</h2>
          <div className="theme-grid">
            {THEMES.map((t) => (
              <button
                key={t.id}
                className={`theme-card ${background === t.id ? 'selected' : ''}`}
                onClick={() => setBackground(t.id)}
              >
                <div className={`theme-swatch bg-${t.id}`} />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
