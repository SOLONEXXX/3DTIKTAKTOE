import { useState, type CSSProperties } from 'react';
import { useGameStore } from '../game/store';
import { audio } from '../game/audio';
import { useT, LANGUAGES } from '../game/i18n';
import { BackIcon, SoundIcon } from './icons';
import { ToggleSwitch } from './ToggleSwitch';

export function AppSettingsScreen() {
  const t = useT();
  const language = useGameStore((s) => s.language);
  const musicVolume = useGameStore((s) => s.musicVolume);
  const sfxVolume = useGameStore((s) => s.sfxVolume);
  const musicEnabled = useGameStore((s) => s.musicEnabled);
  const sfxEnabled = useGameStore((s) => s.sfxEnabled);
  const hapticsEnabled = useGameStore((s) => s.hapticsEnabled);
  const accessibilityGlyphs = useGameStore((s) => s.accessibilityGlyphs);
  const playerName = useGameStore((s) => s.playerName);
  const stats = useGameStore((s) => s.stats);
  const cheatUnlockAll = useGameStore((s) => s.cheatUnlockAll);
  const setLanguage = useGameStore((s) => s.setLanguage);
  const setMusicVolume = useGameStore((s) => s.setMusicVolume);
  const setSfxVolume = useGameStore((s) => s.setSfxVolume);
  const setMusicEnabled = useGameStore((s) => s.setMusicEnabled);
  const setSfxEnabled = useGameStore((s) => s.setSfxEnabled);
  const setHapticsEnabled = useGameStore((s) => s.setHapticsEnabled);
  const setAccessibilityGlyphs = useGameStore((s) => s.setAccessibilityGlyphs);
  const setPlayerName = useGameStore((s) => s.setPlayerName);
  const resetStats = useGameStore((s) => s.resetStats);
  const redeemCode = useGameStore((s) => s.redeemCode);
  const goHome = useGameStore((s) => s.goHome);

  const [codeInput, setCodeInput] = useState('');
  const [codeFeedback, setCodeFeedback] = useState<'ok' | 'bad' | null>(null);

  const submitCode = () => {
    audio.playClick();
    const ok = redeemCode(codeInput);
    setCodeFeedback(ok ? 'ok' : 'bad');
    if (ok) setCodeInput('');
    window.setTimeout(() => setCodeFeedback(null), 2400);
  };

  return (
    <div className="screen settings-screen">
      <div className="settings-topbar">
        <button className="icon-btn" onClick={() => { audio.playClick(); goHome(); }} aria-label={t('lobby.back')}>
          <BackIcon className="icon-btn-svg" />
        </button>
        <h1 className="settings-title">{t('appSettings.title')}</h1>
        <div className="icon-btn-spacer" />
      </div>

      <div className="settings-scroll">
        <section className="menu-section">
          <h2>{t('appSettings.name')}</h2>
          <input
            className="code-input name-input"
            value={playerName}
            maxLength={20}
            placeholder={t('appSettings.namePlaceholder')}
            onChange={(e) => setPlayerName(e.target.value)}
            onBlur={(e) => { if (!e.target.value.trim()) setPlayerName('Spieler'); }}
          />
          <p className="field-hint">{t('appSettings.nameHint')}</p>
        </section>

        <section className="menu-section">
          <h2>{t('appSettings.language')}</h2>
          <div className="option-row">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                className={`option-btn ${language === lang.id ? 'selected' : ''}`}
                onClick={() => { audio.playClick(); setLanguage(lang.id); }}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </section>

        <section className="menu-section">
          <div className="volume-row-header">
            <h2 className="no-margin">{t('appSettings.music')}</h2>
            <ToggleSwitch checked={musicEnabled} onChange={setMusicEnabled} label={t('appSettings.music')} />
          </div>
          <div className="volume-row">
            <SoundIcon className="volume-icon" />
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(musicVolume * 100)}
              disabled={!musicEnabled}
              onChange={(e) => setMusicVolume(Number(e.target.value) / 100)}
              className="difficulty-slider"
              style={{ '--pct': `${Math.round(musicVolume * 100)}%` } as CSSProperties}
            />
          </div>
        </section>

        <section className="menu-section">
          <div className="volume-row-header">
            <h2 className="no-margin">{t('appSettings.sfx')}</h2>
            <ToggleSwitch checked={sfxEnabled} onChange={setSfxEnabled} label={t('appSettings.sfx')} />
          </div>
          <div className="volume-row">
            <SoundIcon className="volume-icon" />
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(sfxVolume * 100)}
              disabled={!sfxEnabled}
              onChange={(e) => {
                const v = Number(e.target.value) / 100;
                setSfxVolume(v);
              }}
              onPointerUp={() => audio.playClick()}
              className="difficulty-slider"
              style={{ '--pct': `${Math.round(sfxVolume * 100)}%` } as CSSProperties}
            />
          </div>
        </section>

        <section className="menu-section">
          <div className="volume-row-header">
            <h2 className="no-margin">{t('appSettings.haptics')}</h2>
            <ToggleSwitch checked={hapticsEnabled} onChange={setHapticsEnabled} label={t('appSettings.haptics')} />
          </div>
          <p className="field-hint">{t('appSettings.hapticsHint')}</p>
        </section>

        <section className="menu-section">
          <div className="volume-row-header">
            <h2 className="no-margin">{t('appSettings.accessibility')}</h2>
            <ToggleSwitch checked={accessibilityGlyphs} onChange={setAccessibilityGlyphs} label={t('appSettings.accessibility')} />
          </div>
          <p className="field-hint">{t('appSettings.accessibilityHint')}</p>
        </section>

        <section className="menu-section">
          <h2>{t('appSettings.statsTitle')}</h2>
          <div className="stats-row">
            <div className="stat-pill">
              <span className="stat-pill-value">{stats.wins}</span>
              <span className="stat-pill-label">{t('appSettings.wins')}</span>
            </div>
            <div className="stat-pill">
              <span className="stat-pill-value">{stats.losses}</span>
              <span className="stat-pill-label">{t('appSettings.losses')}</span>
            </div>
            <div className="stat-pill">
              <span className="stat-pill-value">{stats.draws}</span>
              <span className="stat-pill-label">{t('appSettings.draws')}</span>
            </div>
          </div>
          <button
            className="link-btn"
            onClick={() => { audio.playClick(); resetStats(); }}
          >
            {t('appSettings.resetStats')}
          </button>
        </section>

        <section className="menu-section">
          <h2>{t('appSettings.codeTitle')}</h2>
          <div className="code-redeem-row">
            <input
              className="code-input"
              value={codeInput}
              maxLength={20}
              placeholder={t('appSettings.codePlaceholder')}
              onChange={(e) => setCodeInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitCode(); }}
            />
            <button className="primary-btn secondary code-redeem-btn" onClick={submitCode} disabled={!codeInput.trim()}>
              {t('appSettings.codeRedeem')}
            </button>
          </div>
          {codeFeedback === 'ok' && <p className="field-hint code-feedback-ok">{t('appSettings.codeOk')}</p>}
          {codeFeedback === 'bad' && <p className="field-hint code-feedback-bad">{t('appSettings.codeBad')}</p>}
          {cheatUnlockAll && <p className="field-hint code-feedback-ok">{t('appSettings.cheatActive')}</p>}
        </section>
      </div>
    </div>
  );
}
