import { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { Board, BoardSize, MarkerShape } from '../game/types';
import { CubeGrid } from './CubeGrid';

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
  showGlyphs: boolean;
  gameGeneration: number;
  onTap: (index: number) => void;
}

const DRAG_THRESHOLD_PX = 6;

export function Scene({ board, size, winLine, focusedLayer, interactive, blockedCells, xColor, oColor, xShape, oShape, showGlyphs, gameGeneration, onTap }: SceneProps) {
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

  const cameraDistance = size * 2 + 2.5;

  return (
    <div ref={containerRef} className="scene-container">
      <Canvas
        camera={{ position: [cameraDistance * 0.7, cameraDistance * 0.55, cameraDistance * 0.9], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.65} />
        <directionalLight position={[6, 8, 5]} intensity={1.1} />
        <directionalLight position={[-6, -3, -5]} intensity={0.35} />
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
          showGlyphs={showGlyphs}
          gameGeneration={gameGeneration}
          dragRef={dragRef}
          onTap={onTap}
        />
        <OrbitControls
          enablePan={false}
          enableZoom
          minDistance={size * 1.4}
          maxDistance={size * 4.5}
          rotateSpeed={0.7}
          zoomSpeed={0.8}
          enableDamping
          dampingFactor={0.12}
        />
      </Canvas>
    </div>
  );
}
