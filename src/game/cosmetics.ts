import type { BackgroundTheme, MarkerColorTheme, MarkerMaterial, MarkerShape, Rarity } from './types';

/**
 * The cosmetic catalogue.
 *
 * Every item has exactly one `source`, so a player can always answer "how do I get
 * that?" at a glance:
 *   default → owned from the start
 *   level   → clear a campaign level (free, guaranteed, paces the early game)
 *   world   → clear a whole world (the big, memorable unlocks)
 *   rank    → reach a ranked tier (prestige — cannot be bought)
 *   shop    → buy with shards (the sink that makes every match's payout matter)
 */

export type CosmeticKind = 'color' | 'shape' | 'material' | 'background';

export type CosmeticSource =
  | { kind: 'default' }
  | { kind: 'level'; level: number }
  | { kind: 'world'; world: number }
  | { kind: 'rank'; tierIndex: number; tierName: string }
  | { kind: 'shop'; price: number };

interface BaseDef {
  label: string;
  rarity: Rarity;
  source: CosmeticSource;
}

export interface ColorThemeDef extends BaseDef {
  id: MarkerColorTheme;
  xColor: string;
  oColor: string;
}

export interface ShapeDef extends BaseDef {
  id: MarkerShape;
}

export interface MaterialDef extends BaseDef {
  id: MarkerMaterial;
  description: string;
}

export interface BackgroundDef extends BaseDef {
  id: BackgroundTheme;
}

export const RARITY_ORDER: Rarity[] = ['common', 'rare', 'epic', 'legendary'];

export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#8d96bd',
  rare: '#4fc3ff',
  epic: '#c9a2ff',
  legendary: '#ffd35c',
};

export const RARITY_LABELS: Record<Rarity, string> = {
  common: 'Gewöhnlich',
  rare: 'Selten',
  epic: 'Episch',
  legendary: 'Legendär',
};

export const COLOR_THEMES: ColorThemeDef[] = [
  { id: 'classic', label: 'Klassisch', rarity: 'common', source: { kind: 'default' }, xColor: '#ff4757', oColor: '#3fa9ff' },
  { id: 'neon', label: 'Neon', rarity: 'common', source: { kind: 'level', level: 4 }, xColor: '#00f5ff', oColor: '#ff3fd0' },
  { id: 'oceanic', label: 'Tiefsee', rarity: 'rare', source: { kind: 'world', world: 1 }, xColor: '#2ef2c8', oColor: '#2f6cff' },
  { id: 'sunsetColors', label: 'Sonnenuntergang', rarity: 'common', source: { kind: 'shop', price: 450 }, xColor: '#ff8a3d', oColor: '#a855f7' },
  { id: 'forest', label: 'Wald', rarity: 'common', source: { kind: 'level', level: 10 }, xColor: '#7cff5a', oColor: '#8a5a2b' },
  { id: 'ember', label: 'Glut', rarity: 'rare', source: { kind: 'world', world: 5 }, xColor: '#ff7a18', oColor: '#ffe066' },
  { id: 'toxic', label: 'Toxic', rarity: 'rare', source: { kind: 'shop', price: 450 }, xColor: '#39ff88', oColor: '#ff2fd0' },
  { id: 'ice', label: 'Eis', rarity: 'rare', source: { kind: 'level', level: 18 }, xColor: '#bdf3ff', oColor: '#1e6fa8' },
  { id: 'sunrise', label: 'Morgenrot', rarity: 'rare', source: { kind: 'shop', price: 450 }, xColor: '#ffb86b', oColor: '#ff5f9e' },
  { id: 'candy', label: 'Candy', rarity: 'epic', source: { kind: 'shop', price: 900 }, xColor: '#ff8fd6', oColor: '#7fffd4' },
  { id: 'venom', label: 'Venom', rarity: 'epic', source: { kind: 'shop', price: 900 }, xColor: '#b6ff2e', oColor: '#7a2eff' },
  { id: 'inferno', label: 'Inferno', rarity: 'epic', source: { kind: 'shop', price: 900 }, xColor: '#ff3300', oColor: '#ffb300' },
  { id: 'midnight', label: 'Mitternacht', rarity: 'epic', source: { kind: 'level', level: 26 }, xColor: '#5b6cff', oColor: '#121a3a' },
  { id: 'monochrome', label: 'Mono', rarity: 'rare', source: { kind: 'level', level: 34 }, xColor: '#f5f7ff', oColor: '#2b3252' },
  { id: 'chrome', label: 'Chrom', rarity: 'legendary', source: { kind: 'shop', price: 1800 }, xColor: '#e8f0ff', oColor: '#7d8aa8' },
  { id: 'royal', label: 'Königlich', rarity: 'epic', source: { kind: 'rank', tierIndex: 2, tierName: 'Gold' }, xColor: '#c9a2ff', oColor: '#ffd35c' },
  { id: 'obsidian', label: 'Obsidian', rarity: 'legendary', source: { kind: 'rank', tierIndex: 4, tierName: 'Diamant' }, xColor: '#3a0d10', oColor: '#ff2f4f' },
  { id: 'bloodmoon', label: 'Blutmond', rarity: 'legendary', source: { kind: 'rank', tierIndex: 5, tierName: 'Meister' }, xColor: '#ff1744', oColor: '#2b0a12' },
  { id: 'gold', label: 'Gold', rarity: 'legendary', source: { kind: 'level', level: 60 }, xColor: '#ffd35c', oColor: '#c9ccd6' },
];

export const SHAPES: ShapeDef[] = [
  { id: 'cube', label: 'Würfel', rarity: 'common', source: { kind: 'default' } },
  { id: 'orb', label: 'Orb', rarity: 'common', source: { kind: 'world', world: 0 } },
  { id: 'prism', label: 'Prisma', rarity: 'rare', source: { kind: 'world', world: 3 } },
  { id: 'diamond', label: 'Diamant', rarity: 'rare', source: { kind: 'world', world: 6 } },
  { id: 'ring', label: 'Ring', rarity: 'epic', source: { kind: 'world', world: 8 } },
  { id: 'pyramid', label: 'Pyramide', rarity: 'rare', source: { kind: 'level', level: 22 } },
  { id: 'star', label: 'Kristallstern', rarity: 'epic', source: { kind: 'world', world: 10 } },
  { id: 'figures', label: 'Figuren', rarity: 'legendary', source: { kind: 'shop', price: 1800 } },
];

export const MATERIALS: MaterialDef[] = [
  { id: 'standard', label: 'Standard', description: 'Matt lackiert', rarity: 'common', source: { kind: 'default' } },
  { id: 'glass', label: 'Glas', description: 'Durchscheinend, weiches Leuchten', rarity: 'rare', source: { kind: 'world', world: 2 } },
  { id: 'neon', label: 'Neon', description: 'Selbstleuchtend mit Halo', rarity: 'epic', source: { kind: 'world', world: 4 } },
  { id: 'marble', label: 'Marmor', description: 'Matt poliert, kühl', rarity: 'rare', source: { kind: 'world', world: 7 } },
  { id: 'holo', label: 'Hologramm', description: 'Flimmernd, halbtransparent', rarity: 'epic', source: { kind: 'world', world: 9 } },
  { id: 'metal', label: 'Metall', description: 'Gebürstet, harte Glanzlichter', rarity: 'legendary', source: { kind: 'world', world: 11 } },
];

export const BACKGROUNDS: BackgroundDef[] = [
  { id: 'nebula', label: 'Nebel', rarity: 'common', source: { kind: 'default' } },
  { id: 'void', label: 'Leere', rarity: 'common', source: { kind: 'default' } },
  { id: 'starfield', label: 'Sternenfeld', rarity: 'common', source: { kind: 'level', level: 3 } },
  { id: 'mono', label: 'Graphit', rarity: 'common', source: { kind: 'shop', price: 250 } },
  { id: 'desert', label: 'Wüste', rarity: 'common', source: { kind: 'shop', price: 250 } },
  { id: 'sunset', label: 'Sonnenuntergang', rarity: 'common', source: { kind: 'shop', price: 250 } },
  { id: 'ocean', label: 'Ozean', rarity: 'common', source: { kind: 'level', level: 6 } },
  { id: 'aurora', label: 'Aurora', rarity: 'rare', source: { kind: 'level', level: 12 } },
  { id: 'crystal', label: 'Kristall', rarity: 'rare', source: { kind: 'level', level: 16 } },
  { id: 'matrix', label: 'Matrix', rarity: 'rare', source: { kind: 'shop', price: 450 } },
  { id: 'frost', label: 'Frost', rarity: 'rare', source: { kind: 'shop', price: 450 } },
  { id: 'emerald', label: 'Smaragd', rarity: 'rare', source: { kind: 'shop', price: 450 } },
  { id: 'lava', label: 'Lava', rarity: 'rare', source: { kind: 'level', level: 20 } },
  { id: 'abyss', label: 'Abgrund', rarity: 'rare', source: { kind: 'level', level: 24 } },
  { id: 'sakura', label: 'Sakura', rarity: 'epic', source: { kind: 'shop', price: 700 } },
  { id: 'copper', label: 'Kupfer', rarity: 'epic', source: { kind: 'shop', price: 700 } },
  { id: 'ember', label: 'Glutwolke', rarity: 'epic', source: { kind: 'shop', price: 700 } },
  { id: 'biohazard', label: 'Biohazard', rarity: 'epic', source: { kind: 'shop', price: 700 } },
  { id: 'plasma', label: 'Plasma', rarity: 'epic', source: { kind: 'shop', price: 900 } },
  { id: 'synthwave', label: 'Synthwave', rarity: 'epic', source: { kind: 'shop', price: 900 } },
  { id: 'circuit', label: 'Schaltkreis', rarity: 'epic', source: { kind: 'shop', price: 1200 } },
  { id: 'galaxy', label: 'Galaxis', rarity: 'legendary', source: { kind: 'shop', price: 1200 } },
  { id: 'prism', label: 'Prisma', rarity: 'legendary', source: { kind: 'shop', price: 1800 } },
  { id: 'royal', label: 'Krone', rarity: 'epic', source: { kind: 'rank', tierIndex: 2, tierName: 'Gold' } },
  { id: 'obsidian', label: 'Obsidian', rarity: 'legendary', source: { kind: 'rank', tierIndex: 4, tierName: 'Diamant' } },
];

// ---------------------------------------------------------------------------
// Lookups

export function colorThemeDef(id: MarkerColorTheme): ColorThemeDef {
  return COLOR_THEMES.find((t) => t.id === id) ?? COLOR_THEMES[0];
}

export function shapeDef(id: MarkerShape): ShapeDef {
  return SHAPES.find((s) => s.id === id) ?? SHAPES[0];
}

export function materialDef(id: MarkerMaterial): MaterialDef {
  return MATERIALS.find((m) => m.id === id) ?? MATERIALS[0];
}

export function backgroundDef(id: BackgroundTheme): BackgroundDef {
  return BACKGROUNDS.find((b) => b.id === id) ?? BACKGROUNDS[0];
}

/** Namespaced id used in the owned-items list, e.g. "shape:star". */
export function cosmeticKey(kind: CosmeticKind, id: string): string {
  return `${kind}:${id}`;
}

export interface OwnershipContext {
  owned: readonly string[];
  bestCampaignLevel: number;
  peakTierIndex: number;
  cheatUnlockAll: boolean;
}

export function isUnlocked(kind: CosmeticKind, item: BaseDef & { id: string }, ctx: OwnershipContext): boolean {
  if (ctx.cheatUnlockAll) return true;
  if (ctx.owned.includes(cosmeticKey(kind, item.id))) return true;
  switch (item.source.kind) {
    case 'default':
      return true;
    case 'level':
      return ctx.bestCampaignLevel >= item.source.level;
    case 'rank':
      return ctx.peakTierIndex >= item.source.tierIndex;
    case 'world':
    case 'shop':
      return false;
  }
}

/** Shop price, or null for items that cannot be bought. */
export function priceOf(item: BaseDef): number | null {
  return item.source.kind === 'shop' ? item.source.price : null;
}

/** Free, level-independent solid colors for the "my look" multiplayer picker. */
export const SOLO_COLORS: string[] = [
  '#ff4757', '#3fa9ff', '#39ff88', '#ff8a3d', '#a855f7', '#ffd35c',
  '#ff2fd0', '#00f5ff', '#f5f7ff', '#7cff5a', '#ff3300', '#bdf3ff',
];
