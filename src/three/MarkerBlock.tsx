import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import type { Group } from 'three';
import type { Player } from '../game/types';

const COLORS: Record<Player, string> = {
  X: '#ff4757',
  O: '#3fa9ff',
};

const POP_DURATION = 0.32;

interface MarkerBlockProps {
  player: Player;
  size?: number;
  opacity?: number;
  highlighted?: boolean;
  animate?: boolean;
}

export function MarkerBlock({ player, size = 0.62, opacity = 1, highlighted = false, animate = true }: MarkerBlockProps) {
  const groupRef = useRef<Group>(null);
  const elapsed = useRef(0);
  const done = useRef(!animate);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group || done.current) return;
    elapsed.current += delta;
    const t = Math.min(elapsed.current / POP_DURATION, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    const overshoot = 1 + 0.22 * Math.sin(t * Math.PI);
    group.scale.setScalar(eased * overshoot);
    if (t >= 1) {
      group.scale.setScalar(1);
      done.current = true;
    }
  });

  const color = COLORS[player];
  const transparent = opacity < 1;

  return (
    <group ref={groupRef} scale={animate ? 0.001 : 1}>
      <RoundedBox args={[size, size, size]} radius={size * 0.18} smoothness={3}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={highlighted ? 1.3 : 0.55}
          roughness={0.3}
          metalness={0.2}
          transparent={transparent}
          opacity={opacity}
        />
      </RoundedBox>
      {highlighted && (
        <RoundedBox args={[size * 1.22, size * 1.22, size * 1.22]} radius={size * 0.2} smoothness={2}>
          <meshBasicMaterial color={color} transparent opacity={0.18} />
        </RoundedBox>
      )}
    </group>
  );
}
