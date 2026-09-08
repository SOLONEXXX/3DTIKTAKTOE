import { TIME_PRESETS } from '../game/store';
import type { BoardSize, Difficulty, GameMode } from '../game/types';

interface MainMenuProps {
  size: BoardSize;
  onSizeChange: (size: BoardSize) => void;
  mode: GameMode;
  onModeChange: (mode: GameMode) => void;
  difficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
  timeControlIndex: number;
  onTimeControlChange: (index: number) => void;
  onStart: () => void;
}

const MODE_LABELS: { mode: GameMode; label: string; hint: string }[] = [
  { mode: 'bot', label: 'Vs Bot', hint: 'Play the computer' },
  { mode: 'local', label: 'Pass & Play', hint: 'Two players, one device' },
  { mode: 'online', label: 'Online', hint: 'Play a friend remotely' },
];

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

export function MainMenu({
  size,
  onSizeChange,
  mode,
  onModeChange,
  difficulty,
  onDifficultyChange,
  timeControlIndex,
  onTimeControlChange,
  onStart,
}: MainMenuProps) {
  return (
    <div className="screen menu-screen">
      <h1 className="title">
        3D Tic-Tac-Toe
      </h1>
      <p className="subtitle">Spin the cube. Get {size} in a row, any direction.</p>

      <section className="menu-section">
        <h2>Board</h2>
        <div className="option-row">
          <button className={`option-btn ${size === 3 ? 'selected' : ''}`} onClick={() => onSizeChange(3)}>
            3×3×3
          </button>
          <button className={`option-btn ${size === 4 ? 'selected' : ''}`} onClick={() => onSizeChange(4)}>
            4×4×4
          </button>
        </div>
      </section>

      <section className="menu-section">
        <h2>Mode</h2>
        <div className="option-column">
          {MODE_LABELS.map((m) => (
            <button
              key={m.mode}
              className={`option-btn wide ${mode === m.mode ? 'selected' : ''}`}
              onClick={() => onModeChange(m.mode)}
            >
              <span className="option-btn-label">{m.label}</span>
              <span className="option-btn-hint">{m.hint}</span>
            </button>
          ))}
        </div>
      </section>

      {mode === 'bot' && (
        <section className="menu-section">
          <h2>Difficulty</h2>
          <div className="option-row">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                className={`option-btn ${difficulty === d ? 'selected' : ''}`}
                onClick={() => onDifficultyChange(d)}
              >
                {d[0].toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="menu-section">
        <h2>Time Control</h2>
        <div className="option-row wrap">
          {TIME_PRESETS.map((preset, i) => (
            <button
              key={preset.label}
              className={`option-btn ${timeControlIndex === i ? 'selected' : ''}`}
              onClick={() => onTimeControlChange(i)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </section>

      <button className="primary-btn" onClick={onStart}>
        {mode === 'online' ? 'Continue' : 'Start Game'}
      </button>
    </div>
  );
}
