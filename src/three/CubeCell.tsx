import { useMemo, useState, type RefObject } from 'react';
import * as THREE from 'three';
import type { Cell as CellValue } from '../game/types';
import { Marker } from './Marker';

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

const boxGeometry = new THREE.BoxGeometry(0.78, 0.78, 0.78);
const edgesGeometry = new THREE.EdgesGeometry(boxGeometry);

export function CubeCell({ position, value, index, dimmed, interactive, isWinning, dragRef, onTap }: CubeCellProps) {
  const [hovered, setHovered] = useState(false);
  const emptyOpacity = dimmed ? 0.03 : hovered && interactive ? 0.6 : 0.28;
  const markerOpacity = dimmed ? 0.15 : 1;

  const lineColor = useMemo(() => new THREE.Color(hovered && interactive ? '#9fe3ff' : '#8892b0'), [hovered, interactive]);

  if (value) {
    return (
      <group position={position}>
        <Marker player={value} highlighted={isWinning} opacity={markerOpacity} />
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
      <lineSegments geometry={edgesGeometry}>
        <lineBasicMaterial color={lineColor} transparent opacity={emptyOpacity} />
      </lineSegments>
    </group>
  );
}
