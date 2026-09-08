import type { BoardSize } from '../game/types';

export const SPACING = 1.6;

export function cellPosition(size: BoardSize, x: number, y: number, z: number): [number, number, number] {
  const offset = (size - 1) / 2;
  return [(x - offset) * SPACING, (y - offset) * SPACING, (z - offset) * SPACING];
}
