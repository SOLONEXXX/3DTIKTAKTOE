import { Billboard } from '@react-three/drei';
import type { Player } from '../game/types';

interface MarkerGlyphProps {
  player: Player;
  size?: number;
}

/**
 * Camera-facing X/O overlay drawn on top of a marker so the two players stay
 * distinguishable independent of color (accessibility for color-blind users) —
 * a Billboard keeps it legible no matter how the cube is rotated.
 */
export function MarkerGlyph({ player, size = 0.62 }: MarkerGlyphProps) {
  const barLength = size * 0.85;
  const barThickness = size * 0.16;
  const outlineExtra = size * 0.07;

  return (
    <Billboard position={[0, 0, size * 0.6]}>
      {player === 'X' ? (
        <>
          <mesh rotation={[0, 0, Math.PI / 4]} position={[0, 0, -0.005]}>
            <boxGeometry args={[barLength + outlineExtra, barThickness + outlineExtra, 0.01]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
          <mesh rotation={[0, 0, -Math.PI / 4]} position={[0, 0, -0.005]}>
            <boxGeometry args={[barLength + outlineExtra, barThickness + outlineExtra, 0.01]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[barLength, barThickness, 0.01]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh rotation={[0, 0, -Math.PI / 4]}>
            <boxGeometry args={[barLength, barThickness, 0.01]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[0, 0, -0.005]}>
            <ringGeometry args={[size * 0.24, size * 0.44 + outlineExtra, 32]} />
            <meshBasicMaterial color="#000000" side={2} />
          </mesh>
          <mesh>
            <ringGeometry args={[size * 0.26, size * 0.4, 32]} />
            <meshBasicMaterial color="#ffffff" side={2} />
          </mesh>
        </>
      )}
    </Billboard>
  );
}
