import { formatClock } from '../game/timer';
import type { Player } from '../game/types';

interface ClockDisplayProps {
  player: Player;
  remainingMs: number;
  label: string;
  active: boolean;
  low: boolean;
}

export function ClockDisplay({ player, remainingMs, label, active, low }: ClockDisplayProps) {
  return (
    <div className={`clock clock-${player.toLowerCase()} ${active ? 'clock-active' : ''} ${low ? 'clock-low' : ''}`}>
      <span className="clock-label">{label}</span>
      <span className="clock-time">{formatClock(remainingMs)}</span>
    </div>
  );
}
