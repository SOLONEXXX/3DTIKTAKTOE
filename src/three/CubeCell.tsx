import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Cell as CellValue, MarkerMaterial, MarkerShape } from '../game/types';
import { MarkerBlock } from './MarkerBlock';
import { MarkerGlyph } from './MarkerGlyph';

export type CellThreat = 'none' | 'win' | 'danger';

interface CubeCellProps {
  position: [number, number, number];
  value: CellValue;
  index: number;
  dimmed: boolean;
  interactive: boolean;
  isWinning: boolean;
  blocked: boolean;
  xColor: string;
  oColor: string;
  xShape: MarkerShape;
  oShape: MarkerShape;
  markerMaterial: MarkerMaterial;
  showGlyphs: boolean;
  threat: CellThreat;
  dragRef: RefObject<boolean>;
  onTap: (index: number) => void;
}

const CELL_SIZE = 0.82;
const boxGeometry = new THREE.BoxGeometry(CELL_SIZE, CELL_SIZE, CELL_SIZE);
const edgesGeometry = new THREE.EdgesGeometry(boxGeometry);
const outerEdgesGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(CELL_SIZE * 1.06, CELL_SIZE * 1.06, CELL_SIZE * 1.06));
const blockedBoxGeometry = new THREE.BoxGeometry(CELL_SIZE * 0.9, CELL_SIZE * 0.9, CELL_SIZE * 0.9);

const THREAT_COLORS: Record<Exclude<CellThreat, 'none'>, string> = {
  win: '#4dff9f',
  danger: '#ff4d5e',
};

/** Slow pulse so a threat ring reads as "look here" without being a strobe. */
function ThreatRing({ kind }: { kind: Exclude<CellThreat, 'none'> }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = (Math.sin(state.clock.elapsedTime * 3) + 1) / 2;
    mesh.scale.setScalar(0.92 + t * 0.16);
    const material = mesh.material as { opacity: number };
    material.opacity = 0.45 + t * 0.4;
  });

  return (
    <Billboard>
      <mesh ref={ref}>
        <ringGeometry args={[CELL_SIZE * 0.3, CELL_SIZE * 0.38, 28]} />
        <meshBasicMaterial color={THREAT_COLORS[kind]} transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </Billboard>
  );
}

export function CubeCell({
  position,
  value,
  index,
  dimmed,
  interactive,
  isWinning,
  blocked,
  xColor,
  oColor,
  xShape,
  oShape,
  markerMaterial,
  showGlyphs,
  threat,
  dragRef,
  onTap,
}: CubeCellProps) {
  const [hovered, setHovered] = useState(false);

  // Touchscreens fire pointerover on tap but never a matching pointerout on lift-off,
  // so a cell can get stuck "hovered" once the board stops being interactive.
  useEffect(() => {
    if (!interactive) setHovered(false);
  }, [interactive]);

  const isHot = hovered && interactive;
  const edgeOpacity = dimmed ? 0.03 : isHot ? 0.95 : 0.42;
  const glowOpacity = dimmed ? 0 : isHot ? 0.3 : 0;
  const fillOpacity = dimmed ? 0.004 : isHot ? 0.1 : 0.035;
  const markerOpacity = dimmed ? 0.12 : 1;

  const edgeColor = useMemo(() => new THREE.Color(isHot ? '#a9e8ff' : '#7f94c9'), [isHot]);

  if (blocked) {
    return (
      <group position={position}>
        <mesh geometry={blockedBoxGeometry}>
          <meshStandardMaterial color="#1a1e2c" roughness={0.9} transparent opacity={dimmed ? 0.12 : 0.85} />
        </mesh>
        <lineSegments geometry={edgesGeometry}>
          <lineBasicMaterial color="#ff4757" transparent opacity={dimmed ? 0.04 : 0.5} />
        </lineSegments>
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[CELL_SIZE * 0.62, 0.045, 0.045]} />
          <meshBasicMaterial color="#ff4757" transparent opacity={dimmed ? 0.08 : 0.75} />
        </mesh>
        <mesh rotation={[0, 0, -Math.PI / 4]}>
          <boxGeometry args={[CELL_SIZE * 0.62, 0.045, 0.045]} />
          <meshBasicMaterial color="#ff4757" transparent opacity={dimmed ? 0.08 : 0.75} />
        </mesh>
      </group>
    );
  }

  if (value) {
    const color = value === 'X' ? xColor : oColor;
    const shape = value === 'X' ? xShape : oShape;
    return (
      <group position={position}>
        <MarkerBlock
          color={color}
          shape={shape}
          material={markerMaterial}
          highlighted={isWinning}
          opacity={markerOpacity}
        />
        {showGlyphs && !dimmed && <MarkerGlyph player={value} />}
      </group>
    );
  }

  return (
    <group position={position}>
      {/*
        The invisible hit box exists only while this cell can actually be played. A dimmed
        cell used to keep its hit box and swallow the tap, which is what made the layer
        view look-only: every tap landed on a faded cell in front of the layer you were
        aiming at. Dropping the mesh entirely lets the ray pass straight through.
      */}
      {interactive && (
        <mesh
          onClick={(e) => {
            e.stopPropagation();
            if (dragRef.current) return;
            onTap(index);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            setHovered(false);
          }}
        >
          <boxGeometry args={[1.05, 1.05, 1.05]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
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
      {threat !== 'none' && !dimmed && <ThreatRing kind={threat} />}
    </group>
  );
}
