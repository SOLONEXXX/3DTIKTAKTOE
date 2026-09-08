import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import * as THREE from 'three';
import { cellPosition } from './layout';
import { MarkerBlock } from './MarkerBlock';
import type { Player } from '../game/types';

const SIZE = 4;
const DECOR: { x: number; y: number; z: number; player: Player }[] = [
  { x: 0, y: 0, z: 3, player: 'X' },
  { x: 3, y: 3, z: 0, player: 'O' },
  { x: 1, y: 2, z: 2, player: 'O' },
  { x: 2, y: 1, z: 1, player: 'X' },
  { x: 0, y: 3, z: 1, player: 'X' },
  { x: 3, y: 0, z: 2, player: 'O' },
];

const boxGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
const edgesGeometry = new THREE.EdgesGeometry(boxGeometry);

function SpinningRig() {
  const ref = useRef<Group>(null);
  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.13;
    ref.current.rotation.x = 0.32 + Math.sin(state.clock.elapsedTime * 0.15) * 0.1;
  });

  const cells: { key: string; position: [number, number, number] }[] = [];
  for (let x = 0; x < SIZE; x++) {
    for (let y = 0; y < SIZE; y++) {
      for (let z = 0; z < SIZE; z++) {
        cells.push({ key: `${x}-${y}-${z}`, position: cellPosition(SIZE, x, y, z) });
      }
    }
  }

  return (
    <group ref={ref}>
      {cells.map(({ key, position }) => (
        <lineSegments key={key} geometry={edgesGeometry} position={position}>
          <lineBasicMaterial color="#8fa5ff" transparent opacity={0.16} />
        </lineSegments>
      ))}
      {DECOR.map((d, i) => (
        <group key={i} position={cellPosition(SIZE, d.x, d.y, d.z)}>
          <MarkerBlock player={d.player} size={0.58} animate={false} />
        </group>
      ))}
    </group>
  );
}

export function IdleCube() {
  return (
    <Canvas camera={{ position: [6.5, 5.5, 8], fov: 42 }} gl={{ antialias: true, alpha: true }} dpr={[1, 1.6]}>
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 8, 5]} intensity={0.9} />
      <directionalLight position={[-6, -2, -4]} intensity={0.3} color="#6d8dff" />
      <SpinningRig />
    </Canvas>
  );
}
