import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

interface FigureMarkerProps {
  color: string;
  opacity?: number;
  highlighted?: boolean;
}

export function FigureMarker({ color, opacity = 1, highlighted = false }: FigureMarkerProps) {
  const ref = useRef<Group>(null);
  const [seed] = useState(() => Math.random() * 10);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime + seed;
    ref.current.position.y = Math.sin(t * 1.6) * 0.05;
    ref.current.rotation.y = t * 0.6;
  });

  const transparent = opacity < 1;
  const emissiveIntensity = highlighted ? 1.15 : 0.4;

  return (
    <group ref={ref}>
      <mesh position={[0, -0.06, 0]}>
        <capsuleGeometry args={[0.15, 0.2, 4, 10]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
          roughness={0.45}
          transparent={transparent}
          opacity={opacity}
        />
      </mesh>
      <mesh position={[0, 0.24, 0]}>
        <sphereGeometry args={[0.135, 18, 18]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
          roughness={0.45}
          transparent={transparent}
          opacity={opacity}
        />
      </mesh>
      <mesh position={[-0.14, -0.02, 0]} rotation={[0, 0, 0.3]}>
        <capsuleGeometry args={[0.045, 0.16, 4, 6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} transparent={transparent} opacity={opacity} />
      </mesh>
      <mesh position={[0.14, -0.02, 0]} rotation={[0, 0, -0.3]}>
        <capsuleGeometry args={[0.045, 0.16, 4, 6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} transparent={transparent} opacity={opacity} />
      </mesh>
    </group>
  );
}
