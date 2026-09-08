import { useMemo, useState, type RefObject } from 'react';
import * as THREE from 'three';
import type { Cell as CellValue } from '../game/types';
import { MarkerBlock } from './MarkerBlock';

interface CubeCellProps {
  position: [number, number, number];
  value: CellValue;
  index: number;
  dimmed: boolean;
  interactive: boolean;
  isWinning: boolean;
  dragRef: RefObject<boolean>;
  onTap: (index: number) => void;
}

const CELL_SIZE = 0.82;
const boxGeometry = new THREE.BoxGeometry(CELL_SIZE, CELL_SIZE, CELL_SIZE);
const edgesGeometry = new THREE.EdgesGeometry(boxGeometry);
const outerEdgesGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(CELL_SIZE * 1.06, CELL_SIZE * 1.06, CELL_SIZE * 1.06));

export function CubeCell({ position, value, index, dimmed, interactive, isWinning, dragRef, onTap }: CubeCellProps) {
  const [hovered, setHovered] = useState(false);
  const isHot = hovered && interactive;
  const edgeOpacity = dimmed ? 0.035 : isHot ? 0.95 : 0.42;
  const glowOpacity = dimmed ? 0 : isHot ? 0.3 : 0;
  const fillOpacity = dimmed ? 0.008 : isHot ? 0.1 : 0.035;
  const markerOpacity = dimmed ? 0.15 : 1;

  const edgeColor = useMemo(() => new THREE.Color(isHot ? '#a9e8ff' : '#7f94c9'), [isHot]);

  if (value) {
    return (
      <group position={position}>
        <MarkerBlock player={value} highlighted={isWinning} opacity={markerOpacity} />
      </group>
    );
  }

  return (
    <group position={position}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          if (dragRef.current || !interactive) return;
          onTap(index);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (interactive) setHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
        }}
      >
        <boxGeometry args={[1.05, 1.05, 1.05]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh geometry={boxGeometry}>
        <meshBasicMaterial color="#8fb0ff" transparent opacity={fillOpacity} depthWrite={false} />
      </mesh>
      <lineSegments geometry={edgesGeometry}>
        <lineBasicMaterial color={edgeColor} transparent opacity={edgeOpacity} />
      </lineSegments>
      {glowOpacity > 0 && (
        <lineSegments geometry={outerEdgesGeometry}>
          <lineBasicMaterial color="#c9f0ff" transparent opacity={glowOpacity} />
        </lineSegments>
      )}
    </group>
  );
}
