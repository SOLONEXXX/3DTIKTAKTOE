import type { Player } from '../game/types';

const X_COLOR = '#ff5d73';
const O_COLOR = '#4fc3ff';

export function Marker({
  player,
  highlighted,
  opacity = 1,
}: {
  player: Player;
  highlighted?: boolean;
  opacity?: number;
}) {
  const emissiveIntensity = highlighted ? 1.4 : 0.5;
  const transparent = opacity < 1;

  if (player === 'X') {
    return (
      <group>
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.62, 0.16, 0.16]} />
          <meshStandardMaterial
            color={X_COLOR}
            emissive={X_COLOR}
            emissiveIntensity={emissiveIntensity}
            transparent={transparent}
            opacity={opacity}
          />
        </mesh>
        <mesh rotation={[0, 0, -Math.PI / 4]}>
          <boxGeometry args={[0.62, 0.16, 0.16]} />
          <meshStandardMaterial
            color={X_COLOR}
            emissive={X_COLOR}
            emissiveIntensity={emissiveIntensity}
            transparent={transparent}
            opacity={opacity}
          />
        </mesh>
      </group>
    );
  }

  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.26, 0.1, 16, 32]} />
      <meshStandardMaterial
        color={O_COLOR}
        emissive={O_COLOR}
        emissiveIntensity={emissiveIntensity}
        transparent={transparent}
        opacity={opacity}
      />
    </mesh>
  );
}
