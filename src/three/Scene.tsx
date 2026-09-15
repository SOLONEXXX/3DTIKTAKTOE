import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { Board, BoardSize, MarkerMaterial, MarkerShape } from '../game/types';
import { CubeGrid } from './CubeGrid';
import { fitCameraDistance, layerCenter } from './layout';

interface SceneProps {
  board: Board;
  size: BoardSize;
  winLine: number[];
  focusedLayer: number | null;
  interactive: boolean;
  blockedCells: ReadonlySet<number>;
  xColor: string;
  oColor: string;
  xShape: MarkerShape;
  oShape: MarkerShape;
  markerMaterial: MarkerMaterial;
  showGlyphs: boolean;
  winningCells: readonly number[];
  dangerCells: readonly number[];
  gameGeneration: number;
  onTap: (index: number) => void;
}

const DRAG_THRESHOLD_PX = 6;
const CAMERA_FOV = 45;
const VIEW_DIR = new THREE.Vector3(0.7, 0.55, 0.9).normalize();

interface OrbitLike {
  target: THREE.Vector3;
  update?: () => void;
}

/**
 * Frames the board and owns the orbit limits. Both have to come from the same
 * distance: the controls clamp the camera on every update, so limits derived from
 * the board size alone would pull a correctly framed camera straight back in.
 *
 * Focusing a layer also re-frames onto that slab, so the cells you can actually play
 * fill the screen instead of sitting small in the middle of a ghosted cube.
 */
function CameraRig({ size, focusedLayer }: { size: BoardSize; focusedLayer: number | null }) {
  const camera = useThree((state) => state.camera);
  const view = useThree((state) => state.size);
  const controlsRef = useRef<OrbitLike | null>(null);
  const goalRef = useRef<{ target: THREE.Vector3; distance: number } | null>(null);
  const settledRef = useRef(true);

  const aspect = view.width / Math.max(1, view.height);
  const fullDistance = useMemo(() => fitCameraDistance(size, aspect, CAMERA_FOV), [size, aspect]);

  const goal = useMemo(() => {
    const [x, y, z] = layerCenter(size, focusedLayer);
    return {
      target: new THREE.Vector3(x, y, z),
      distance: focusedLayer === null ? fullDistance : fitCameraDistance(size, aspect, CAMERA_FOV, true),
    };
  }, [size, aspect, focusedLayer, fullDistance]);

  useEffect(() => {
    const first = goalRef.current === null;
    goalRef.current = goal;
    settledRef.current = false;

    camera.near = 0.1;
    camera.far = fullDistance * 4;
    camera.updateProjectionMatrix();

    if (first) {
      // No previous framing to glide from — snap, so the first frame is already right.
      const controls = controlsRef.current;
      if (controls) controls.target.copy(goal.target);
      camera.position.copy(VIEW_DIR).multiplyScalar(goal.distance).add(goal.target);
      camera.lookAt(goal.target);
      controls?.update?.();
      settledRef.current = true;
    }
  }, [camera, goal, fullDistance]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    const target = goalRef.current;
    if (!controls || !target || settledRef.current) return;

    // Exponential ease, framerate independent. Once it lands the rig lets go entirely
    // so the player's own orbiting and pinch-zoom are never fought over.
    const k = 1 - Math.exp(-delta * 7);
    const offset = camera.position.clone().sub(controls.target);
    const nextLength = THREE.MathUtils.lerp(offset.length(), target.distance, k);

    controls.target.lerp(target.target, k);
    camera.position.copy(controls.target).add(offset.setLength(nextLength));
    controls.update?.();

    if (controls.target.distanceTo(target.target) < 0.01 && Math.abs(nextLength - target.distance) < 0.01) {
      settledRef.current = true;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef as never}
      enablePan={false}
      enableZoom
      minDistance={fullDistance * 0.35}
      maxDistance={fullDistance * 1.45}
      rotateSpeed={0.7}
      zoomSpeed={0.8}
      enableDamping
      dampingFactor={0.12}
    />
  );
}

export function Scene({
  board,
  size,
  winLine,
  focusedLayer,
  interactive,
  blockedCells,
  xColor,
  oColor,
  xShape,
  oShape,
  markerMaterial,
  showGlyphs,
  winningCells,
  dangerCells,
  gameGeneration,
  onTap,
}: SceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef(false);
  const downPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onDown = (e: PointerEvent) => {
      downPos.current = { x: e.clientX, y: e.clientY };
    };
    const onUp = (e: PointerEvent) => {
      const dx = e.clientX - downPos.current.x;
      const dy = e.clientY - downPos.current.y;
      dragRef.current = Math.hypot(dx, dy) > DRAG_THRESHOLD_PX;
    };

    el.addEventListener('pointerdown', onDown, true);
    el.addEventListener('pointerup', onUp, true);
    return () => {
      el.removeEventListener('pointerdown', onDown, true);
      el.removeEventListener('pointerup', onUp, true);
    };
  }, []);

  return (
    <div ref={containerRef} className="scene-container">
      <Canvas camera={{ position: [10, 8, 13], fov: CAMERA_FOV }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[6, 8, 5]} intensity={1.1} />
        <directionalLight position={[-6, -3, -5]} intensity={0.35} />
        {/* Rim + fill points so the metal and glass finishes actually catch highlights
            instead of reading as flat dark shapes under a single key light. */}
        <pointLight position={[0, 6, 6]} intensity={28} distance={22} color="#9fb3ff" />
        <pointLight position={[-5, -4, 4]} intensity={18} distance={20} color="#ff9fd6" />
        <CubeGrid
          board={board}
          size={size}
          winLine={winLine}
          focusedLayer={focusedLayer}
          interactive={interactive}
          blockedCells={blockedCells}
          xColor={xColor}
          oColor={oColor}
          xShape={xShape}
          oShape={oShape}
          markerMaterial={markerMaterial}
          showGlyphs={showGlyphs}
          winningCells={winningCells}
          dangerCells={dangerCells}
          gameGeneration={gameGeneration}
          dragRef={dragRef}
          onTap={onTap}
        />
        <CameraRig size={size} focusedLayer={focusedLayer} />
      </Canvas>
    </div>
  );
}
