import type { ComponentType, CSSProperties } from 'react';
import { TIME_PRESETS, useGameStore } from '../game/store';
import { audio } from '../game/audio';
import { useT } from '../game/i18n';
import { BoardSizeSwitch } from './BoardSizeSwitch';
import { BackIcon, BotIcon, DuoIcon, GlobeIcon } from './icons';
import type { GameMode } from '../game/types';

const MODES: { mode: GameMode; labelKey: string; hintKey: string; icon: ComponentType<{ className?: string }> }[] = [
  { mode: 'bot', labelKey: 'settings.modeBot', hintKey: 'settings.modeBotHint', icon: BotIcon },
  { mode: 'local', labelKey: 'settings.modeLocal', hintKey: 'settings.modeLocalHint', icon: DuoIcon },
  { mode: 'online', labelKey: 'settings.modeOnline', hintKey: 'settings.modeOnlineHint', icon: GlobeIcon },
];

export function SettingsScreen() {
  const t = useT();
  const size = useGameStore((s) => s.size);
  const mode = useGameStore((s) => s.mode);
  const difficulty = useGameStore((s) => s.difficulty);
  const timeControlIndex = useGameStore((s) => s.timeControlIndex);
  const setSize = useGameStore((s) => s.setSize);
  const setMode = useGameStore((s) => s.setMode);
  const setDifficulty = useGameStore((s) => s.setDifficulty);
  const setTimeControlIndex = useGameStore((s) => s.setTimeControlIndex);
  const playNow = useGameStore((s) => s.playNow);
  const goHome = useGameStore((s) => s.goHome);

  const difficultyLabel = (percent: number): string => {
    if (percent >= 95) return t('settings.diffUnbeatable');
    if (percent >= 70) return t('settings.diffHard');
    if (percent >= 40) return t('settings.diffMedium');
    if (percent >= 15) return t('settings.diffEasy');
    return t('settings.diffVeryEasy');
  };

  return (
    <div className="screen settings-screen">
      <div className="settings-topbar">
        <button className="icon-btn" onClick={() => { audio.playClick(); goHome(); }} aria-label={t('lobby.back')}>
          <BackIcon className="icon-btn-svg" />
        </button>
        <h1 className="settings-title">{t('settings.title')}</h1>
        <div className="icon-btn-spacer" />
      </div>

      <div className="settings-scroll">
        <section className="menu-section">
          <h2>{t('settings.board')}</h2>
          <BoardSizeSwitch value={size} onChange={(v) => { audio.playClick(); setSize(v); }} />
        </section>

        <section className="menu-section">
          <h2>{t('settings.mode')}</h2>
          <div className="option-column">
            {MODES.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.mode}
                  className={`option-btn wide with-icon ${mode === m.mode ? 'selected' : ''}`}
                  onClick={() => { audio.playClick(); setMode(m.mode); }}
                >
                  <Icon className="option-btn-icon" />
                  <span className="option-btn-text">
                    <span className="option-btn-label">{t(m.labelKey)}</span>
                    <span className="option-btn-hint">{t(m.hintKey)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {mode === 'bot' && (
          <section className="menu-section">
            <h2>{t('settings.difficulty')}</h2>
            <div className="difficulty-card">
              <div className="difficulty-readout">
                <span className="difficulty-percent">{difficulty}%</span>
                <span className="difficulty-word">{difficultyLabel(difficulty)}</span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                onPointerUp={() => audio.playClick()}
                className="difficulty-slider"
                style={{ '--pct': `${difficulty}%` } as CSSProperties}
              />
              <div className="difficulty-scale">
                <span>1%</span>
                <span>100%</span>
              </div>
            </div>
          </section>
        )}

        <section className="menu-section">
          <h2>{t('settings.timeControl')}</h2>
          <div className="option-row wrap">
            {TIME_PRESETS.map((preset, i) => (
              <button
                key={preset.label}
                className={`option-btn ${timeControlIndex === i ? 'selected' : ''}`}
                onClick={() => { audio.playClick(); setTimeControlIndex(i); }}
              >
                {i === TIME_PRESETS.length - 1 ? t('settings.timeNoClock') : preset.label}
              </button>
            ))}
          </div>
        </section>
      </div>

      <button className="primary-btn" onClick={() => { audio.playClick(); playNow(); }}>
        {mode === 'online' ? t('settings.continue') : t('settings.start')}
      </button>
    </div>
  );
}
