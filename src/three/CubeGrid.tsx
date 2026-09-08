import { useMemo, type RefObject } from 'react';
import { Line } from '@react-three/drei';
import { toCoords } from '../game/board';
import type { Board, BoardSize, MarkerShape } from '../game/types';
import { cellPosition } from './layout';
import { CubeCell } from './CubeCell';
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
  showGlyphs: boolean;
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
  showGlyphs,
  gameGeneration,
  dragRef,
  onTap,
}: CubeGridProps) {
  const winSet = useMemo(() => new Set(winLine), [winLine]);

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
      {cells.map(({ index, position, y }) => (
        <CubeCell
          key={`${gameGeneration}-${index}`}
          position={position}
          value={board[index]}
          index={index}
          dimmed={focusedLayer !== null && focusedLayer !== y}
          interactive={interactive && (focusedLayer === null || focusedLayer === y)}
          isWinning={winSet.has(index)}
          blocked={blockedCells.has(index)}
          xColor={xColor}
          oColor={oColor}
          xShape={xShape}
          oShape={oShape}
          showGlyphs={showGlyphs}
          dragRef={dragRef}
          onTap={onTap}
        />
      ))}
      {winLinePoints && <Line points={winLinePoints} color="#ffd35c" lineWidth={6} transparent opacity={0.9} />}
      {winCellPositions.length > 0 && <VictoryPulse positions={winCellPositions} />}
    </group>
  );
}
