import { lazy, Suspense } from 'react';
import { useGameStore } from '../game/store';
import { audio } from '../game/audio';
import { useT } from '../game/i18n';
import { BackIcon, LockIcon } from './icons';
import { ShapeIcon } from './ShapeIcon';

const IdleCube = lazy(() => import('../three/IdleCube').then((m) => ({ default: m.IdleCube })));
import { COLOR_THEMES, SHAPES, SOLO_COLORS, colorThemeDef, isColorThemeUnlocked, isShapeUnlocked } from '../game/cosmetics';
import type { BackgroundTheme } from '../game/types';

const THEME_IDS: BackgroundTheme[] = [
  'nebula',
  'ocean',
  'sunset',
  'starfield',
  'aurora',
  'matrix',
  'lava',
  'crystal',
  'void',
  'sakura',
  'desert',
  'abyss',
  'plasma',
  'frost',
  'copper',
];

const THEME_LABELS: Record<BackgroundTheme, string> = {
  nebula: 'Nebel',
  ocean: 'Ozean',
  sunset: 'Sonnenuntergang',
  starfield: 'Sternenfeld',
  aurora: 'Aurora',
  matrix: 'Matrix',
  lava: 'Lava',
  crystal: 'Kristall',
  void: 'Leere',
  sakura: 'Sakura',
  desert: 'Wüste',
  abyss: 'Abgrund',
  plasma: 'Plasma',
  frost: 'Frost',
  copper: 'Kupfer',
};

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
  const t = useT();
  const previewAccent = colorThemeDef(markerColorTheme).xColor;

  return (
    <div className="screen cosmetics-screen">
      <div className="settings-topbar">
        <button className="icon-btn" onClick={() => { audio.playClick(); goHome(); }} aria-label={t('lobby.back')}>
          <BackIcon className="icon-btn-svg" />
        </button>
        <h1 className="settings-title">{t('cosmetics.title')}</h1>
        <div className="icon-btn-spacer" />
      </div>

      <div className={`cosmetics-preview bg-${background}`}>
        <Suspense fallback={null}>
          <IdleCube colorTheme={markerColorTheme} shape={markerShape} />
        </Suspense>
      </div>

      <div className="settings-scroll">
        <section className="menu-section">
          <h2>{t('cosmetics.background')}</h2>
          <div className="theme-grid">
            {THEME_IDS.map((id) => (
              <button
                key={id}
                className={`theme-card ${background === id ? 'selected' : ''}`}
                onClick={() => { audio.playClick(); setBackground(id); }}
              >
                <div className={`theme-swatch bg-${id}`} />
                <span>{THEME_LABELS[id]}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="menu-section">
          <h2>{t('cosmetics.colorTheme')}</h2>
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
                  {!unlocked && <span className="unlock-hint">{t('cosmetics.level', { n: c.unlockLevel })}</span>}
                </button>
              );
            })}
          </div>
        </section>

        <section className="menu-section">
          <h2>{t('cosmetics.myLook')}</h2>
          <p className="field-hint" style={{ margin: '0 0 10px' }}>
            {t('cosmetics.myLookHint')}
          </p>
          <div className="solo-color-grid">
            {SOLO_COLORS.map((c) => (
              <button
                key={c}
                className={`solo-color-swatch ${onlineMyColor === c ? 'selected' : ''}`}
                style={{ background: c }}
                onClick={() => { audio.playClick(); setOnlineMyColor(c); }}
                aria-label={c}
              />
            ))}
          </div>
        </section>

        <section className="menu-section">
          <h2>{t('cosmetics.shape')}</h2>
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
                  <div className="theme-swatch shape-swatch" style={{ color: previewAccent }}>
                    <ShapeIcon shape={s.id} className="shape-swatch-icon" />
                    {!unlocked && <LockIcon className="lock-icon" />}
                  </div>
                  <span>{s.label}</span>
                  {!unlocked && <span className="unlock-hint">{t('cosmetics.level', { n: s.unlockLevel })}</span>}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
