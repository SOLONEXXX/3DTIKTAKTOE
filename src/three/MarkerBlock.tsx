import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import type { Group, Mesh } from 'three';
import type { MarkerMaterial, MarkerShape } from '../game/types';
import { FigureMarker } from './FigureMarker';

const POP_DURATION = 0.32;

interface MarkerBlockProps {
  color: string;
  size?: number;
  opacity?: number;
  highlighted?: boolean;
  animate?: boolean;
  shape?: MarkerShape;
  material?: MarkerMaterial;
}

function ShapeGeometry({ shape, size }: { shape: MarkerShape; size: number }) {
  switch (shape) {
    case 'orb':
      return <sphereGeometry args={[size * 0.55, 24, 24]} />;
    case 'diamond':
      return <octahedronGeometry args={[size * 0.62, 0]} />;
    case 'pyramid':
      return <coneGeometry args={[size * 0.58, size * 0.85, 4]} />;
    case 'prism':
      return <cylinderGeometry args={[size * 0.6, size * 0.6, size * 0.75, 3]} />;
    case 'ring':
      return <torusGeometry args={[size * 0.42, size * 0.19, 16, 32]} />;
    case 'star':
      return <icosahedronGeometry args={[size * 0.58, 0]} />;
    case 'cube':
    default:
      return <boxGeometry args={[size, size, size]} />;
  }
}

interface SurfaceSpec {
  roughness: number;
  metalness: number;
  emissiveIntensity: number;
  opacity: number;
  /** Permanent glow sphere, independent of the win highlight. */
  aura: number;
  wireframeOverlay: boolean;
  /** Subtle vertical bob + shimmer, used by the hologram finish. */
  shimmer: boolean;
}

/**
 * Each finish is a distinct surface recipe rather than a recolour — that's what makes a
 * skin feel like a different object instead of the same cube in another palette.
 */
function surfaceFor(material: MarkerMaterial, highlighted: boolean, baseOpacity: number): SurfaceSpec {
  const glow = highlighted ? 1.3 : 0.55;
  switch (material) {
    case 'metal':
      return {
        roughness: 0.18,
        metalness: 0.95,
        emissiveIntensity: highlighted ? 0.8 : 0.18,
        opacity: baseOpacity,
        aura: 0,
        wireframeOverlay: false,
        shimmer: false,
      };
    case 'glass':
      return {
        roughness: 0.05,
        metalness: 0.1,
        emissiveIntensity: highlighted ? 1.5 : 0.9,
        opacity: baseOpacity * 0.5,
        aura: 0.12,
        wireframeOverlay: false,
        shimmer: false,
      };
    case 'neon':
      return {
        roughness: 0.9,
        metalness: 0,
        emissiveIntensity: highlighted ? 3.2 : 2.4,
        opacity: baseOpacity,
        aura: 0.28,
        wireframeOverlay: false,
        shimmer: false,
      };
    case 'holo':
      return {
        roughness: 0.4,
        metalness: 0.2,
        emissiveIntensity: highlighted ? 2.2 : 1.5,
        opacity: baseOpacity * 0.62,
        aura: 0.16,
        wireframeOverlay: true,
        shimmer: true,
      };
    case 'marble':
      return {
        roughness: 0.94,
        metalness: 0.02,
        emissiveIntensity: highlighted ? 0.6 : 0.1,
        opacity: baseOpacity,
        aura: 0,
        wireframeOverlay: false,
        shimmer: false,
      };
    case 'standard':
    default:
      return {
        roughness: 0.3,
        metalness: 0.2,
        emissiveIntensity: glow,
        opacity: baseOpacity,
        aura: 0,
        wireframeOverlay: false,
        shimmer: false,
      };
  }
}

export function MarkerBlock({
  color,
  size = 0.62,
  opacity = 1,
  highlighted = false,
  animate = true,
  shape = 'cube',
  material = 'standard',
}: MarkerBlockProps) {
  const groupRef = useRef<Group>(null);
  const shimmerRef = useRef<Mesh>(null);
  const elapsed = useRef(0);
  const done = useRef(!animate);

  const surface = useMemo(() => surfaceFor(material, highlighted, opacity), [material, highlighted, opacity]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (group && !done.current) {
      elapsed.current += delta;
      const t = Math.min(elapsed.current / POP_DURATION, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const overshoot = 1 + 0.22 * Math.sin(t * Math.PI);
      group.scale.setScalar(eased * overshoot);
      if (t >= 1) {
        group.scale.setScalar(1);
        done.current = true;
      }
    }
    if (surface.shimmer && shimmerRef.current) {
      const mat = shimmerRef.current.material as { opacity: number };
      mat.opacity = 0.18 + Math.sin(state.clock.elapsedTime * 3) * 0.12;
    }
  });

  if (shape === 'figures') {
    return (
      <group ref={groupRef} scale={animate ? 0.001 : 1}>
        <FigureMarker color={color} opacity={opacity} highlighted={highlighted} />
      </group>
    );
  }

  const transparent = surface.opacity < 1;
  const auraStrength = Math.max(surface.aura, highlighted ? 0.18 : 0);

  const decoration = (
    <>
      {auraStrength > 0 && (
        <mesh>
          <sphereGeometry args={[size * 0.92, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={auraStrength} depthWrite={false} />
        </mesh>
      )}
      {surface.wireframeOverlay && (
        <mesh ref={shimmerRef} scale={1.06}>
          <ShapeGeometry shape={shape} size={size} />
          <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.2} depthWrite={false} />
        </mesh>
      )}
    </>
  );

  const materialProps = {
    color,
    emissive: color,
    emissiveIntensity: surface.emissiveIntensity,
    roughness: surface.roughness,
    metalness: surface.metalness,
    transparent,
    opacity: surface.opacity,
  };

  if (shape === 'cube') {
    return (
      <group ref={groupRef} scale={animate ? 0.001 : 1}>
        <RoundedBox args={[size, size, size]} radius={size * 0.18} smoothness={3}>
          <meshStandardMaterial {...materialProps} />
        </RoundedBox>
        {decoration}
      </group>
    );
  }

  return (
    <group ref={groupRef} scale={animate ? 0.001 : 1}>
      <mesh rotation={shape === 'pyramid' ? [0, Math.PI / 4, 0] : [0, 0, 0]}>
        <ShapeGeometry shape={shape} size={size} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
      {decoration}
    </group>
  );
}
