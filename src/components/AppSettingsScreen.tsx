import { type CSSProperties } from 'react';
import { useGameStore } from '../game/store';
import { audio } from '../game/audio';
import { BackIcon, SoundIcon } from './icons';
import { ToggleSwitch } from './ToggleSwitch';

export function AppSettingsScreen() {
  const musicVolume = useGameStore((s) => s.musicVolume);
  const sfxVolume = useGameStore((s) => s.sfxVolume);
  const musicEnabled = useGameStore((s) => s.musicEnabled);
  const sfxEnabled = useGameStore((s) => s.sfxEnabled);
  const playerName = useGameStore((s) => s.playerName);
  const setMusicVolume = useGameStore((s) => s.setMusicVolume);
  const setSfxVolume = useGameStore((s) => s.setSfxVolume);
  const setMusicEnabled = useGameStore((s) => s.setMusicEnabled);
  const setSfxEnabled = useGameStore((s) => s.setSfxEnabled);
  const setPlayerName = useGameStore((s) => s.setPlayerName);
  const goHome = useGameStore((s) => s.goHome);

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
      </div>
    </div>
  );
}
