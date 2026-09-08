import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import type { Group } from 'three';
import type { MarkerColorTheme, MarkerShape, Player } from '../game/types';
import { colorThemeDef } from '../game/cosmetics';
import { FigureMarker } from './FigureMarker';

const POP_DURATION = 0.32;

interface MarkerBlockProps {
  player: Player;
  size?: number;
  opacity?: number;
  highlighted?: boolean;
  animate?: boolean;
  colorTheme?: MarkerColorTheme;
  shape?: MarkerShape;
}

function ShapeGeometry({ shape, size }: { shape: MarkerShape; size: number }) {
  switch (shape) {
    case 'orb':
      return <sphereGeometry args={[size * 0.55, 24, 24]} />;
    case 'diamond':
      return <octahedronGeometry args={[size * 0.62, 0]} />;
    case 'pyramid':
      return <coneGeometry args={[size * 0.58, size * 0.85, 4]} />;
    case 'cube':
    default:
      return <boxGeometry args={[size, size, size]} />;
  }
}

export function MarkerBlock({
  player,
  size = 0.62,
  opacity = 1,
  highlighted = false,
  animate = true,
  colorTheme = 'classic',
  shape = 'cube',
}: MarkerBlockProps) {
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

  const theme = colorThemeDef(colorTheme);
  const color = player === 'X' ? theme.xColor : theme.oColor;
  const transparent = opacity < 1;
  const emissiveIntensity = highlighted ? 1.3 : 0.55;

  if (shape === 'figures') {
    return (
      <group ref={groupRef} scale={animate ? 0.001 : 1}>
        <FigureMarker color={color} opacity={opacity} highlighted={highlighted} />
      </group>
    );
  }

  if (shape === 'cube') {
    return (
      <group ref={groupRef} scale={animate ? 0.001 : 1}>
        <RoundedBox args={[size, size, size]} radius={size * 0.18} smoothness={3}>
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={emissiveIntensity}
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

  return (
    <group ref={groupRef} scale={animate ? 0.001 : 1}>
      <mesh rotation={shape === 'pyramid' ? [0, Math.PI / 4, 0] : [0, 0, 0]}>
        <ShapeGeometry shape={shape} size={size} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
          roughness={0.3}
          metalness={0.2}
          transparent={transparent}
          opacity={opacity}
        />
      </mesh>
    </group>
  );
}
