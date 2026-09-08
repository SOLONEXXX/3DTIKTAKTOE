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
  { id: 'sunsetColors', label: 'Sonnenuntergang', unlockLevel: 10, xColor: '#ff8a3d', oColor: '#a855f7' },
  { id: 'toxic', label: 'Toxic', unlockLevel: 25, xColor: '#39ff88', oColor: '#ff2fd0' },
  { id: 'monochrome', label: 'Mono', unlockLevel: 60, xColor: '#f5f7ff', oColor: '#2b3252' },
  { id: 'gold', label: 'Gold', unlockLevel: 100, xColor: '#ffd35c', oColor: '#c9ccd6' },
];

export const SHAPES: ShapeDef[] = [
  { id: 'cube', label: 'Würfel', unlockLevel: 0 },
  { id: 'orb', label: 'Orb', unlockLevel: 5 },
  { id: 'diamond', label: 'Diamant', unlockLevel: 15 },
  { id: 'pyramid', label: 'Pyramide', unlockLevel: 35 },
  { id: 'figures', label: 'Figuren', unlockLevel: 50 },
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
