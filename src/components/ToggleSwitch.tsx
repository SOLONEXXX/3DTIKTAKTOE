import { audio } from '../game/audio';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`toggle-switch ${checked ? 'checked' : ''}`}
      onClick={() => {
        audio.playClick();
        onChange(!checked);
      }}
    >
      <span className="toggle-knob" />
    </button>
  );
}
