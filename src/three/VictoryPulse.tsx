import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';

function PulseRing({ position, offset }: { position: [number, number, number]; offset: number }) {
  const ref = useRef<Mesh>(null);

  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = ((state.clock.elapsedTime + offset) % 1.4) / 1.4;
    const scale = 0.5 + t * 1.8;
    mesh.scale.setScalar(scale);
    const material = mesh.material as { opacity: number };
    material.opacity = Math.max(0, 0.55 * (1 - t));
  });

  return (
    <mesh ref={ref} position={position} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.5, 0.035, 12, 32]} />
      <meshBasicMaterial color="#ffd35c" transparent opacity={0.5} />
    </mesh>
  );
}

export function VictoryPulse({ positions }: { positions: [number, number, number][] }) {
  return (
    <group>
      {positions.map((pos, i) => (
        <PulseRing key={i} position={pos} offset={i * 0.25} />
      ))}
    </group>
  );
}
