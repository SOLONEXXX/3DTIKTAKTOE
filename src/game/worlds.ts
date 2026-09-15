import type { BackgroundTheme, MarkerColorTheme, MarkerMaterial, MarkerShape } from './types';

export const LEVELS_PER_WORLD = 12;

export interface WorldDef {
  id: string;
  name: string;
  /** Backdrop shown on the level map card and used while playing levels of this world. */
  background: BackgroundTheme;
  accent: string;
  /** Cosmetic handed out for clearing the world's last level. */
  reward?:
    | { kind: 'color'; id: MarkerColorTheme }
    | { kind: 'shape'; id: MarkerShape }
    | { kind: 'material'; id: MarkerMaterial }
    | { kind: 'background'; id: BackgroundTheme };
}

/**
 * Twelve authored worlds of 12 levels each. Past the last one the list cycles with a
 * prestige numeral appended, so the ladder stays endless without ever showing an
 * unthemed level.
 */
export const WORLDS: WorldDef[] = [
  { id: 'nebula', name: 'Nebula', background: 'nebula', accent: '#6d8dff', reward: { kind: 'shape', id: 'orb' } },
  { id: 'ocean', name: 'Abyssal', background: 'ocean', accent: '#3fd0ff', reward: { kind: 'color', id: 'oceanic' } },
  { id: 'aurora', name: 'Aurora', background: 'aurora', accent: '#3febad', reward: { kind: 'material', id: 'glass' } },
  { id: 'matrix', name: 'Grid', background: 'matrix', accent: '#39ff88', reward: { kind: 'shape', id: 'prism' } },
  { id: 'synthwave', name: 'Synthwave', background: 'synthwave', accent: '#ff3fd0', reward: { kind: 'material', id: 'neon' } },
  { id: 'lava', name: 'Magma', background: 'lava', accent: '#ff6b2c', reward: { kind: 'color', id: 'ember' } },
  { id: 'frost', name: 'Glacier', background: 'frost', accent: '#bdf3ff', reward: { kind: 'shape', id: 'diamond' } },
  { id: 'sakura', name: 'Sakura', background: 'sakura', accent: '#ff8fd6', reward: { kind: 'material', id: 'marble' } },
  { id: 'circuit', name: 'Circuit', background: 'circuit', accent: '#7cf9ff', reward: { kind: 'shape', id: 'ring' } },
  { id: 'plasma', name: 'Plasma', background: 'plasma', accent: '#a855f7', reward: { kind: 'material', id: 'holo' } },
  { id: 'galaxy', name: 'Galaxis', background: 'galaxy', accent: '#8fa5ff', reward: { kind: 'shape', id: 'star' } },
  { id: 'void', name: 'Leere', background: 'void', accent: '#ffd35c', reward: { kind: 'material', id: 'metal' } },
];

export interface WorldInstance extends WorldDef {
  /** 0-based index across the endless ladder. */
  index: number;
  /** Display name including the prestige numeral once the list has cycled. */
  title: string;
  firstLevel: number;
  lastLevel: number;
  /** How many times the authored list has wrapped before this world. */
  prestige: number;
}

const ROMAN = ['', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

export function worldAt(index: number): WorldInstance {
  const safeIndex = Math.max(0, index);
  const def = WORLDS[safeIndex % WORLDS.length];
  const prestige = Math.floor(safeIndex / WORLDS.length);
  const numeral = prestige > 0 ? ` ${ROMAN[Math.min(prestige, ROMAN.length - 1)] || `x${prestige + 1}`}` : '';
  return {
    ...def,
    index: safeIndex,
    prestige,
    title: `${def.name}${numeral}`,
    firstLevel: safeIndex * LEVELS_PER_WORLD + 1,
    lastLevel: (safeIndex + 1) * LEVELS_PER_WORLD,
  };
}

export function worldIndexForLevel(level: number): number {
  return Math.floor((Math.max(1, level) - 1) / LEVELS_PER_WORLD);
}

export function worldForLevel(level: number): WorldInstance {
  return worldAt(worldIndexForLevel(level));
}

/** A world opens as soon as the player has reached any of its levels. */
export function isWorldUnlocked(index: number, highestLevel: number): boolean {
  return highestLevel >= index * LEVELS_PER_WORLD + 1;
}

/** The highest world the player should see on the map (current + one teaser). */
export function visibleWorldCount(highestLevel: number): number {
  return worldIndexForLevel(highestLevel) + 2;
}
