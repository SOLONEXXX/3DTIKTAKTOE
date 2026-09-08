import type { BoardSize } from '../game/types';

interface BoardSizeSwitchProps {
  value: BoardSize;
  onChange: (size: BoardSize) => void;
}

export function BoardSizeSwitch({ value, onChange }: BoardSizeSwitchProps) {
  return (
    <div className="board-switch">
      <div className={`board-switch-thumb ${value === 4 ? 'thumb-right' : ''}`} />
      <button
        type="button"
        className={`board-switch-option ${value === 3 ? 'active' : ''}`}
        onClick={() => onChange(3)}
      >
        3×3×3
      </button>
      <button
        type="button"
        className={`board-switch-option ${value === 4 ? 'active' : ''}`}
        onClick={() => onChange(4)}
      >
        4×4×4
      </button>
    </div>
  );
}
