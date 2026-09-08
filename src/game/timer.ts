import type { Player, TimeControl } from './types';

export interface ClockState {
  remainingMs: Record<Player, number>;
  runningFor: Player | null;
  lastTickAt: number | null;
}

export function createClockState(timeControl: TimeControl): ClockState {
  return {
    remainingMs: { X: timeControl.initialMs, O: timeControl.initialMs },
    runningFor: null,
    lastTickAt: null,
  };
}

export function startClock(state: ClockState, player: Player, now: number): ClockState {
  return { ...state, runningFor: player, lastTickAt: now };
}

export function stopClock(state: ClockState): ClockState {
  return { ...state, runningFor: null, lastTickAt: null };
}

/** Advance the running clock to `now`, clamping at zero. */
export function tickClock(state: ClockState, now: number): ClockState {
  if (!state.runningFor || state.lastTickAt === null) return state;
  const elapsed = now - state.lastTickAt;
  const player = state.runningFor;
  const remaining = Math.max(0, state.remainingMs[player] - elapsed);
  return {
    ...state,
    remainingMs: { ...state.remainingMs, [player]: remaining },
    lastTickAt: now,
  };
}

/** Apply a move's increment and hand the running clock to the other player. */
export function switchClock(
  state: ClockState,
  finishedPlayer: Player,
  nextPlayer: Player,
  timeControl: TimeControl,
  now: number,
): ClockState {
  const ticked = tickClock(state, now);
  const withIncrement = {
    ...ticked,
    remainingMs: {
      ...ticked.remainingMs,
      [finishedPlayer]: ticked.remainingMs[finishedPlayer] + timeControl.incrementMs,
    },
  };
  return startClock(withIncrement, nextPlayer, now);
}

export function hasTimedOut(state: ClockState): Player | null {
  if (state.remainingMs.X <= 0) return 'X';
  if (state.remainingMs.O <= 0) return 'O';
  return null;
}

export function formatClock(ms: number): string {
  const clamped = Math.max(0, ms);
  const totalSeconds = Math.ceil(clamped / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${String(mins).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
