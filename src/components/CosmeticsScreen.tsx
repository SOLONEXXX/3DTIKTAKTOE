import { lazy, Suspense } from 'react';
import { useGameStore } from '../game/store';
import { audio } from '../game/audio';
import { BackIcon, LockIcon } from './icons';

const IdleCube = lazy(() => import('../three/IdleCube').then((m) => ({ default: m.IdleCube })));
import { COLOR_THEMES, SHAPES, SOLO_COLORS, isColorThemeUnlocked, isShapeUnlocked } from '../game/cosmetics';
import type { BackgroundTheme } from '../game/types';

const THEMES: { id: BackgroundTheme; label: string }[] = [
  { id: 'nebula', label: 'Nebel' },
  { id: 'ocean', label: 'Ozean' },
  { id: 'sunset', label: 'Sonnenuntergang' },
  { id: 'starfield', label: 'Sternenfeld' },
  { id: 'aurora', label: 'Aurora' },
  { id: 'matrix', label: 'Matrix' },
  { id: 'lava', label: 'Lava' },
  { id: 'crystal', label: 'Kristall' },
  { id: 'void', label: 'Leere' },
  { id: 'sakura', label: 'Sakura' },
  { id: 'desert', label: 'Wüste' },
  { id: 'abyss', label: 'Abgrund' },
  { id: 'plasma', label: 'Plasma' },
  { id: 'frost', label: 'Frost' },
  { id: 'copper', label: 'Kupfer' },
];

export function CosmeticsScreen() {
  const background = useGameStore((s) => s.background);
  const setBackground = useGameStore((s) => s.setBackground);
  const markerColorTheme = useGameStore((s) => s.markerColorTheme);
  const setMarkerColorTheme = useGameStore((s) => s.setMarkerColorTheme);
  const markerShape = useGameStore((s) => s.markerShape);
  const setMarkerShape = useGameStore((s) => s.setMarkerShape);
  const onlineMyColor = useGameStore((s) => s.onlineMyColor);
  const setOnlineMyColor = useGameStore((s) => s.setOnlineMyColor);
  const campaignLevel3 = useGameStore((s) => s.campaignLevel3);
  const campaignLevel4 = useGameStore((s) => s.campaignLevel4);
  const campaignLevel = Math.max(campaignLevel3, campaignLevel4);
  const cheatUnlockAll = useGameStore((s) => s.cheatUnlockAll);
  const goHome = useGameStore((s) => s.goHome);

  return (
    <div className="screen cosmetics-screen">
      <div className="settings-topbar">
        <button className="icon-btn" onClick={() => { audio.playClick(); goHome(); }} aria-label="Zurück">
          <BackIcon className="icon-btn-svg" />
        </button>
        <h1 className="settings-title">Cosmetics</h1>
        <div className="icon-btn-spacer" />
      </div>

      <div className={`cosmetics-preview bg-${background}`}>
        <Suspense fallback={null}>
          <IdleCube colorTheme={markerColorTheme} shape={markerShape} />
        </Suspense>
      </div>

      <div className="settings-scroll">
        <section className="menu-section">
          <h2>Würfel-Hintergrund</h2>
          <div className="theme-grid">
            {THEMES.map((t) => (
              <button
                key={t.id}
                className={`theme-card ${background === t.id ? 'selected' : ''}`}
                onClick={() => { audio.playClick(); setBackground(t.id); }}
              >
                <div className={`theme-swatch bg-${t.id}`} />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="menu-section">
          <h2>Farbschema</h2>
          <div className="theme-grid">
            {COLOR_THEMES.map((c) => {
              const unlocked = cheatUnlockAll || isColorThemeUnlocked(c.id, campaignLevel);
              return (
                <button
                  key={c.id}
                  className={`theme-card ${markerColorTheme === c.id ? 'selected' : ''} ${!unlocked ? 'locked' : ''}`}
                  onClick={() => { if (unlocked) { audio.playClick(); setMarkerColorTheme(c.id); } }}
                  disabled={!unlocked}
                >
                  <div className="theme-swatch color-swatch" style={{ background: `linear-gradient(135deg, ${c.xColor}, ${c.oColor})` }}>
                    {!unlocked && <LockIcon className="lock-icon" />}
                  </div>
                  <span>{c.label}</span>
                  {!unlocked && <span className="unlock-hint">Level {c.unlockLevel}</span>}
                </button>
              );
            })}
          </div>
        </section>

        <section className="menu-section">
          <h2>Mein Look (Mehrspieler)</h2>
          <p className="field-hint" style={{ margin: '0 0 10px' }}>
            Nur deine eigene Farbe im Online-Modus — unabhängig vom Farbschema und ohne Einfluss auf deinen Gegner.
          </p>
          <div className="solo-color-grid">
            {SOLO_COLORS.map((c) => (
              <button
                key={c}
                className={`solo-color-swatch ${onlineMyColor === c ? 'selected' : ''}`}
                style={{ background: c }}
                onClick={() => { audio.playClick(); setOnlineMyColor(c); }}
                aria-label={`Meine Farbe: ${c}`}
              />
            ))}
          </div>
        </section>

        <section className="menu-section">
          <h2>Form</h2>
          <div className="theme-grid">
            {SHAPES.map((s) => {
              const unlocked = cheatUnlockAll || isShapeUnlocked(s.id, campaignLevel);
              return (
                <button
                  key={s.id}
                  className={`theme-card ${markerShape === s.id ? 'selected' : ''} ${!unlocked ? 'locked' : ''}`}
                  onClick={() => { if (unlocked) { audio.playClick(); setMarkerShape(s.id); } }}
                  disabled={!unlocked}
                >
                  <div className="theme-swatch shape-swatch">
                    {!unlocked && <LockIcon className="lock-icon" />}
                  </div>
                  <span>{s.label}</span>
                  {!unlocked && <span className="unlock-hint">Level {s.unlockLevel}</span>}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
