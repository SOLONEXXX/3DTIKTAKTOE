import type { BoardSize } from '../game/types';

export const SPACING = 1.6;

/** Half a cell plus a little air, so the fit below never crops the outermost edges. */
const CELL_HALF = 0.55;

export function cellPosition(size: BoardSize, x: number, y: number, z: number): [number, number, number] {
  const offset = (size - 1) / 2;
  return [(x - offset) * SPACING, (y - offset) * SPACING, (z - offset) * SPACING];
}

/**
 * Camera distance that actually fits the board on screen.
 *
 * A perspective camera's `fov` is the *vertical* one, so on a portrait phone the
 * horizontal field of view is only a fraction of it (at 390×844 it is roughly a
 * quarter). Sizing the camera off the board alone — as this used to — put a 4×4×4
 * cube far wider than the visible frustum, which is why the board ran off both
 * edges of the screen. Fit against whichever axis is narrower instead.
 */
export function fitCameraDistance(size: BoardSize, aspect: number, fovDeg: number, focused = false): number {
  const halfExtent = ((size - 1) / 2) * SPACING + CELL_HALF;
  // The whole cube needs room to orbit corner-on. A focused layer is one slab thick, so
  // it can be framed a little tighter — the bigger win there is that the rig re-centres
  // on the slab, which is what makes the top and bottom layers comfortable to tap.
  const radius = halfExtent * (focused ? 1.4 : 1.52);
  const vHalf = (fovDeg * Math.PI) / 360;
  const hHalf = Math.atan(Math.tan(vHalf) * Math.max(0.1, aspect));
  return radius / Math.tan(Math.max(0.05, Math.min(vHalf, hHalf)));
}

/** World-space centre of one horizontal layer, or the cube's centre for "all layers". */
export function layerCenter(size: BoardSize, layer: number | null): [number, number, number] {
  if (layer === null) return [0, 0, 0];
  return [0, (layer - (size - 1) / 2) * SPACING, 0];
}
