import { useMemo, type RefObject } from 'react';
import { Line } from '@react-three/drei';
import { toCoords } from '../game/board';
import type { Board, BoardSize, MarkerMaterial, MarkerShape } from '../game/types';
import { cellPosition } from './layout';
import { CubeCell, type CellThreat } from './CubeCell';
import { VictoryPulse } from './VictoryPulse';

interface CubeGridProps {
  board: Board;
  size: BoardSize;
  winLine: number[];
  focusedLayer: number | null;
  interactive: boolean;
  blockedCells: ReadonlySet<number>;
  xColor: string;
  oColor: string;
  xShape: MarkerShape;
  oShape: MarkerShape;
  markerMaterial: MarkerMaterial;
  showGlyphs: boolean;
  /** Cells where the local player wins immediately. */
  winningCells: readonly number[];
  /** Cells where the opponent wins immediately. */
  dangerCells: readonly number[];
  /** Bumped on every new game/level — forces a clean remount so no cell keeps stale hover/animation state. */
  gameGeneration: number;
  dragRef: RefObject<boolean>;
  onTap: (index: number) => void;
}

export function CubeGrid({
  board,
  size,
  winLine,
  focusedLayer,
  interactive,
  blockedCells,
  xColor,
  oColor,
  xShape,
  oShape,
  markerMaterial,
  showGlyphs,
  winningCells,
  dangerCells,
  gameGeneration,
  dragRef,
  onTap,
}: CubeGridProps) {
  const winSet = useMemo(() => new Set(winLine), [winLine]);
  const winThreatSet = useMemo(() => new Set(winningCells), [winningCells]);
  const dangerSet = useMemo(() => new Set(dangerCells), [dangerCells]);

  const cells = useMemo(() => {
    const items: { index: number; position: [number, number, number]; y: number }[] = [];
    for (let i = 0; i < board.length; i++) {
      const [x, y, z] = toCoords(size, i);
      items.push({ index: i, position: cellPosition(size, x, y, z), y });
    }
    return items;
  }, [board.length, size]);

  const winLinePoints = useMemo(() => {
    if (winLine.length < 2) return null;
    const [x1, y1, z1] = toCoords(size, winLine[0]);
    const [x2, y2, z2] = toCoords(size, winLine[winLine.length - 1]);
    return [cellPosition(size, x1, y1, z1), cellPosition(size, x2, y2, z2)] as [
      [number, number, number],
      [number, number, number],
    ];
  }, [winLine, size]);

  const winCellPositions = useMemo(() => {
    return winLine.map((idx) => {
      const [x, y, z] = toCoords(size, idx);
      return cellPosition(size, x, y, z);
    });
  }, [winLine, size]);

  return (
    <group>
      {cells.map(({ index, position, y }) => {
        const inFocus = focusedLayer === null || focusedLayer === y;
        const threat: CellThreat = winThreatSet.has(index) ? 'win' : dangerSet.has(index) ? 'danger' : 'none';
        return (
          <CubeCell
            key={`${gameGeneration}-${index}`}
            position={position}
            value={board[index]}
            index={index}
            dimmed={!inFocus}
            interactive={interactive && inFocus}
            isWinning={winSet.has(index)}
            blocked={blockedCells.has(index)}
            xColor={xColor}
            oColor={oColor}
            xShape={xShape}
            oShape={oShape}
            markerMaterial={markerMaterial}
            showGlyphs={showGlyphs}
            threat={threat}
            dragRef={dragRef}
            onTap={onTap}
          />
        );
      })}
      {winLinePoints && <Line points={winLinePoints} color="#ffd35c" lineWidth={6} transparent opacity={0.9} />}
      {winCellPositions.length > 0 && <VictoryPulse positions={winCellPositions} />}
    </group>
  );
}
