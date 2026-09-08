import type { ComponentType, CSSProperties } from 'react';
import { TIME_PRESETS, useGameStore } from '../game/store';
import { audio } from '../game/audio';
import { BoardSizeSwitch } from './BoardSizeSwitch';
import { BackIcon, BotIcon, DuoIcon, GlobeIcon } from './icons';
import type { GameMode } from '../game/types';

const MODES: { mode: GameMode; label: string; hint: string; icon: ComponentType<{ className?: string }> }[] = [
  { mode: 'bot', label: 'Vs Bot', hint: 'Gegen den Computer', icon: BotIcon },
  { mode: 'local', label: 'Pass & Play', hint: 'Zwei Spieler, ein Gerät', icon: DuoIcon },
  { mode: 'online', label: 'Online', hint: 'Gegen einen Freund', icon: GlobeIcon },
];

function difficultyLabel(percent: number): string {
  if (percent >= 95) return 'Unschlagbar';
  if (percent >= 70) return 'Schwer';
  if (percent >= 40) return 'Mittel';
  if (percent >= 15) return 'Leicht';
  return 'Sehr leicht';
}

export function SettingsScreen() {
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

  return (
    <div className="screen settings-screen">
      <div className="settings-topbar">
        <button className="icon-btn" onClick={() => { audio.playClick(); goHome(); }} aria-label="Zurück">
          <BackIcon className="icon-btn-svg" />
        </button>
        <h1 className="settings-title">Einstellungen</h1>
        <div className="icon-btn-spacer" />
      </div>

      <div className="settings-scroll">
        <section className="menu-section">
          <h2>Spielfeld</h2>
          <BoardSizeSwitch value={size} onChange={(v) => { audio.playClick(); setSize(v); }} />
        </section>

        <section className="menu-section">
          <h2>Modus</h2>
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
                    <span className="option-btn-label">{m.label}</span>
                    <span className="option-btn-hint">{m.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {mode === 'bot' && (
          <section className="menu-section">
            <h2>Bot-Schwierigkeit</h2>
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
          <h2>Zeitkontrolle</h2>
          <div className="option-row wrap">
            {TIME_PRESETS.map((preset, i) => (
              <button
                key={preset.label}
                className={`option-btn ${timeControlIndex === i ? 'selected' : ''}`}
                onClick={() => { audio.playClick(); setTimeControlIndex(i); }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </section>
      </div>

      <button className="primary-btn" onClick={() => { audio.playClick(); playNow(); }}>
        {mode === 'online' ? 'Weiter' : 'Spiel starten'}
      </button>
    </div>
  );
}
