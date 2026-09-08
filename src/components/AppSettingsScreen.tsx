import { useState, type CSSProperties } from 'react';
import { useGameStore } from '../game/store';
import { audio } from '../game/audio';
import { BackIcon, SoundIcon } from './icons';
import { ToggleSwitch } from './ToggleSwitch';

export function AppSettingsScreen() {
  const musicVolume = useGameStore((s) => s.musicVolume);
  const sfxVolume = useGameStore((s) => s.sfxVolume);
  const musicEnabled = useGameStore((s) => s.musicEnabled);
  const sfxEnabled = useGameStore((s) => s.sfxEnabled);
  const hapticsEnabled = useGameStore((s) => s.hapticsEnabled);
  const accessibilityGlyphs = useGameStore((s) => s.accessibilityGlyphs);
  const playerName = useGameStore((s) => s.playerName);
  const stats = useGameStore((s) => s.stats);
  const cheatUnlockAll = useGameStore((s) => s.cheatUnlockAll);
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
        <button className="icon-btn" onClick={() => { audio.playClick(); goHome(); }} aria-label="Zurück">
          <BackIcon className="icon-btn-svg" />
        </button>
        <h1 className="settings-title">App-Einstellungen</h1>
        <div className="icon-btn-spacer" />
      </div>

      <div className="settings-scroll">
        <section className="menu-section">
          <h2>Name</h2>
          <input
            className="code-input name-input"
            value={playerName}
            maxLength={20}
            placeholder="Dein Name"
            onChange={(e) => setPlayerName(e.target.value)}
            onBlur={(e) => { if (!e.target.value.trim()) setPlayerName('Spieler'); }}
          />
          <p className="field-hint">Erscheint im Scoreboard des Level-Modus.</p>
        </section>

        <section className="menu-section">
          <div className="volume-row-header">
            <h2 className="no-margin">Musik</h2>
            <ToggleSwitch checked={musicEnabled} onChange={setMusicEnabled} label="Musik an/aus" />
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
            <h2 className="no-margin">Soundeffekte</h2>
            <ToggleSwitch checked={sfxEnabled} onChange={setSfxEnabled} label="Soundeffekte an/aus" />
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
            <h2 className="no-margin">Vibration</h2>
            <ToggleSwitch checked={hapticsEnabled} onChange={setHapticsEnabled} label="Vibration an/aus" />
          </div>
          <p className="field-hint">Kurzes haptisches Feedback bei Zügen, Sieg und Niederlage.</p>
        </section>

        <section className="menu-section">
          <div className="volume-row-header">
            <h2 className="no-margin">Barrierefreiheit</h2>
            <ToggleSwitch checked={accessibilityGlyphs} onChange={setAccessibilityGlyphs} label="X/O-Symbole an/aus" />
          </div>
          <p className="field-hint">
            Zeigt zusätzlich zur Farbe ein X- oder O-Symbol auf jedem Spielstein — hilfreich bei Farbenblindheit.
          </p>
        </section>

        <section className="menu-section">
          <h2>Statistik (vs. Bot)</h2>
          <div className="stats-row">
            <div className="stat-pill">
              <span className="stat-pill-value">{stats.wins}</span>
              <span className="stat-pill-label">Siege</span>
            </div>
            <div className="stat-pill">
              <span className="stat-pill-value">{stats.losses}</span>
              <span className="stat-pill-label">Niederlagen</span>
            </div>
            <div className="stat-pill">
              <span className="stat-pill-value">{stats.draws}</span>
              <span className="stat-pill-label">Unentschieden</span>
            </div>
          </div>
          <button
            className="link-btn"
            onClick={() => { audio.playClick(); resetStats(); }}
          >
            Statistik zurücksetzen
          </button>
        </section>

        <section className="menu-section">
          <h2>Code einlösen</h2>
          <div className="code-redeem-row">
            <input
              className="code-input"
              value={codeInput}
              maxLength={20}
              placeholder="Code eingeben"
              onChange={(e) => setCodeInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitCode(); }}
            />
            <button className="primary-btn secondary code-redeem-btn" onClick={submitCode} disabled={!codeInput.trim()}>
              Einlösen
            </button>
          </div>
          {codeFeedback === 'ok' && <p className="field-hint code-feedback-ok">Alles freigeschaltet! 🎉</p>}
          {codeFeedback === 'bad' && <p className="field-hint code-feedback-bad">Ungültiger Code.</p>}
          {cheatUnlockAll && <p className="field-hint code-feedback-ok">Creative Coder aktiv — alle Cosmetics freigeschaltet.</p>}
        </section>
      </div>
    </div>
  );
}
