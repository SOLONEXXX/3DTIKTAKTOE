import type { MarkerColorTheme, MarkerShape } from './types';

export interface ColorThemeDef {
  id: MarkerColorTheme;
  label: string;
  unlockLevel: number;
  xColor: string;
  oColor: string;
}

export interface ShapeDef {
  id: MarkerShape;
  label: string;
  unlockLevel: number;
}

export const COLOR_THEMES: ColorThemeDef[] = [
  { id: 'classic', label: 'Klassisch', unlockLevel: 0, xColor: '#ff4757', oColor: '#3fa9ff' },
  { id: 'neon', label: 'Neon', unlockLevel: 6, xColor: '#00f5ff', oColor: '#ff3fd0' },
  { id: 'sunsetColors', label: 'Sonnenuntergang', unlockLevel: 12, xColor: '#ff8a3d', oColor: '#a855f7' },
  { id: 'forest', label: 'Wald', unlockLevel: 18, xColor: '#7cff5a', oColor: '#8a5a2b' },
  { id: 'toxic', label: 'Toxic', unlockLevel: 25, xColor: '#39ff88', oColor: '#ff2fd0' },
  { id: 'ice', label: 'Eis', unlockLevel: 32, xColor: '#bdf3ff', oColor: '#1e6fa8' },
  { id: 'candy', label: 'Candy', unlockLevel: 40, xColor: '#ff8fd6', oColor: '#7fffd4' },
  { id: 'inferno', label: 'Inferno', unlockLevel: 48, xColor: '#ff3300', oColor: '#ffb300' },
  { id: 'monochrome', label: 'Mono', unlockLevel: 60, xColor: '#f5f7ff', oColor: '#2b3252' },
  { id: 'royal', label: 'Königlich', unlockLevel: 72, xColor: '#c9a2ff', oColor: '#ffd35c' },
  { id: 'obsidian', label: 'Obsidian', unlockLevel: 85, xColor: '#3a0d10', oColor: '#ff2f4f' },
  { id: 'gold', label: 'Gold', unlockLevel: 100, xColor: '#ffd35c', oColor: '#c9ccd6' },
];

export const SHAPES: ShapeDef[] = [
  { id: 'cube', label: 'Würfel', unlockLevel: 0 },
  { id: 'orb', label: 'Orb', unlockLevel: 5 },
  { id: 'prism', label: 'Prisma', unlockLevel: 10 },
  { id: 'diamond', label: 'Diamant', unlockLevel: 15 },
  { id: 'ring', label: 'Ring', unlockLevel: 22 },
  { id: 'pyramid', label: 'Pyramide', unlockLevel: 35 },
  { id: 'star', label: 'Kristallstern', unlockLevel: 45 },
  { id: 'figures', label: 'Figuren', unlockLevel: 50 },
];

/** Free, level-independent solid colors for the "my look" multiplayer picker (opponent unaffected). */
export const SOLO_COLORS: string[] = [
  '#ff4757',
  '#3fa9ff',
  '#39ff88',
  '#ff8a3d',
  '#a855f7',
  '#ffd35c',
  '#ff2fd0',
  '#00f5ff',
  '#f5f7ff',
  '#7cff5a',
  '#ff3300',
  '#bdf3ff',
];

export function colorThemeDef(id: MarkerColorTheme): ColorThemeDef {
  return COLOR_THEMES.find((t) => t.id === id) ?? COLOR_THEMES[0];
}

export function shapeDef(id: MarkerShape): ShapeDef {
  return SHAPES.find((s) => s.id === id) ?? SHAPES[0];
}

export function isColorThemeUnlocked(id: MarkerColorTheme, bestLevel: number): boolean {
  return bestLevel >= colorThemeDef(id).unlockLevel;
}

export function isShapeUnlocked(id: MarkerShape, bestLevel: number): boolean {
  return bestLevel >= shapeDef(id).unlockLevel;
}
