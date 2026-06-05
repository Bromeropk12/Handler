/**
 * ShelfMiniMap3D
 *
 * Mini-mapa 3D lateral (220×300 px) usado durante drag-en-grupo
 * cross-shelf. Muestra el anaquel destino en miniatura con:
 *  - Grid isométrico
 *  - Muestras existentes como cubos pequeños coloreados por producto
 *  - Celda destino destacada con halo del SGA del grupo
 *  - Click-to-drop en cualquier celda libre
 *
 * Props:
 *   - mapData: { shelf, samples[] } del anaquel destino
 *   - target: { x, y, z } | null (celda destacada, null = ninguna)
 *   - validity: 'valid' | 'invalid' | 'unknown' (de useGroupPreview)
 *   - onSelectCell: (cell) => void
 *   - title?: string
 */
import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { LEVEL_HEIGHT, getColorByName } from '../3d/Shared3DComponents';

// ─── Floor Grid ────────────────────────────────────────────────────────────────
const MiniGrid = ({ cols, depth, highlightedCell, validity }) => {
  const lines = [];
  const hC = cols / 2, hD = depth / 2;

  for (let i = 0; i <= cols; i++) {
    lines.push(
      <line key={`gx-${i}`} position={[i - hC, 0.01, 0]}>
        <bufferGeometry>
          <float32BufferAttribute attach="attributes-position" args={[new Float32Array([0, 0, -hD, 0, 0, hD]), 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#1a1f2e" transparent opacity={0.8} />
      </line>
    );
  }
  for (let i = 0; i <= depth; i++) {
    lines.push(
      <line key={`gz-${i}`} position={[0, 0.01, i - hD]}>
        <bufferGeometry>
          <float32BufferAttribute attach="attributes-position" args={[new Float32Array([-hC, 0, 0, hC, 0, 0]), 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#1a1f2e" transparent opacity={0.8} />
      </line>
    );
  }

  // Highlighted target cell (drawn on the floor)
  if (highlightedCell) {
    const w = 1, d = 1;
    const px = -hC + highlightedCell.x + w / 2;
    const pz = -hD + (highlightedCell.z || 0) + d / 2;
    const py = (highlightedCell.y || 0) * LEVEL_HEIGHT;
    const color = validity === 'invalid' ? '#ef4444' : validity === 'valid' ? '#10b981' : '#64748b';
    lines.push(
      <mesh key="target-cell" position={[px, py + 0.02, pz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w * 0.9, d * 0.9]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>,
      <mesh key="target-ring" position={[px, py + 0.03, pz]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.45, 0.55, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>
    );
  }

  return <group>{lines}</group>;
};

// ─── Sample Block (mini) ───────────────────────────────────────────────────────
const MiniSample = ({ sample, offX, offZ }) => {
  const w = sample.width || 1;
  const d = sample.depth || sample.height || 1;
  const px = offX + sample.position_x + w / 2;
  const pz = offZ + (sample.position_z || 0) + d / 2;
  const py = (sample.position_y || 0) * LEVEL_HEIGHT + 0.3;
  const color = getColorByName(sample.global_sample_name || sample.name);

  return (
    <mesh position={[px, py, pz]}>
      <boxGeometry args={[w * 0.85, 0.4, d * 0.85]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
        roughness={0.4}
        metalness={0.3}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
};

// ─── Mini Shelf Structure (posts) ──────────────────────────────────────────────
const MiniStructure = ({ cols, depth, levels }) => {
  const postH = levels * LEVEL_HEIGHT + 0.2;
  const offX = -cols / 2;
  const offZ = -depth / 2;
  const posts = [
    [offX - 0.15, 0, offZ - 0.15],
    [offX + cols + 0.15, 0, offZ - 0.15],
    [offX - 0.15, 0, offZ + depth + 0.15],
    [offX + cols + 0.15, 0, offZ + depth + 0.15],
  ];
  return (
    <group>
      {posts.map((p, i) => (
        <mesh key={i} position={[p[0], postH / 2, p[2]]}>
          <boxGeometry args={[0.08, postH, 0.08]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {/* Floor slab */}
      <mesh position={[offX + cols / 2, -0.05, offZ + depth / 2]}>
        <boxGeometry args={[cols + 0.3, 0.05, depth + 0.3]} />
        <meshStandardMaterial color="#080c16" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
};

// ─── Scene Wrapper ─────────────────────────────────────────────────────────────
const MiniScene = ({ mapData, target, validity, onSelectCell }) => {
  const shelf = mapData.shelf;
  const cols = shelf.grid_width || 10;
  const depth = shelf.shelf_depth || 10;
  const levels = shelf.grid_height || 10;
  const offX = -cols / 2;
  const offZ = -depth / 2;
  const rigRef = useRef();

  useFrame((state) => {
    if (!rigRef.current) return;
    // Slow auto-rotation
    rigRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.25;
  });

  const handleClick = (event) => {
    if (!onSelectCell) return;
    event.stopPropagation();
    const point = event.point;
    // Snap to nearest cell
    const x = Math.round(point.x - offX - 0.5);
    const z = Math.round(point.z - offZ - 0.5);
    const y = target?.y ?? 0;
    if (x < 0 || x >= cols || z < 0 || z >= depth) return;
    onSelectCell({ x, y, z });
  };

  return (
    <group ref={rigRef}>
      <MiniStructure cols={cols} depth={depth} levels={levels} />
      <MiniGrid cols={cols} depth={depth} highlightedCell={target} validity={validity} />
      {mapData.samples.map((s) => (
        <MiniSample key={s.id} sample={s} offX={offX} offZ={offZ} />
      ))}
      {/* Click catcher (large invisible plane at mid-level) */}
      <mesh
        position={[0, target?.y * LEVEL_HEIGHT || 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleClick}
        visible={false}
      >
        <planeGeometry args={[cols, depth]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
};

// ─── Public Component ──────────────────────────────────────────────────────────
const ShelfMiniMap3D = ({
  mapData,
  target = null,
  validity = 'unknown',
  onSelectCell,
  title = 'Anaquel destino',
}) => {
  const [responsiveHidden, setResponsiveHidden] = useState(false);

  useEffect(() => {
    const check = () => setResponsiveHidden(window.innerWidth < 1280);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (responsiveHidden) return null;
  if (!mapData) return null;

  const cols = mapData.shelf.grid_width || 10;
  const depth = mapData.shelf.shelf_depth || 10;

  // Camera position: front-right isometric, scaled to fit
  const dist = Math.max(cols, depth) * 1.1;
  const cameraPos = [dist * 0.7, dist * 0.55, dist * 0.7];

  return (
    <div
      style={{
        position: 'absolute', top: 16, right: 16,
        width: 220, height: 300,
        zIndex: 40,
        background: 'rgba(9, 13, 22, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: 14,
        boxShadow: '0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(56,189,248,0.1) inset',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(56, 189, 248, 0.05)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: 3,
          background: '#38bdf8', boxShadow: '0 0 6px #38bdf8',
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 8, color: '#38bdf8', fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase' }}>
            Mini-mapa
          </p>
          <p style={{ margin: 0, fontSize: 10, color: '#f1f5f9', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title}
          </p>
        </div>
      </div>

      {/* 3D Canvas */}
      <div style={{ flex: 1, position: 'relative', background: 'radial-gradient(ellipse at 50% 100%, #0a0f1c 0%, #000 100%)' }}>
        <Canvas
          camera={{ position: cameraPos, fov: 30 }}
          gl={{ alpha: true, antialias: true }}
          style={{ width: '100%', height: '100%' }}
        >
          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 8, 5]} intensity={1.0} color="#ffffff" />
          <directionalLight position={[-4, 4, -4]} intensity={0.4} color="#38bdf8" />
          <MiniScene
            mapData={mapData}
            target={target}
            validity={validity}
            onSelectCell={onSelectCell}
          />
        </Canvas>
      </div>

      {/* Footer con target info */}
      <div style={{
        padding: '6px 10px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(0,0,0,0.3)',
        fontSize: 9, fontFamily: 'monospace',
        color: target ? '#38bdf8' : '#475569',
        fontWeight: 700,
        letterSpacing: 0.5,
      }}>
        {target
          ? `DEST: X:${target.x + 1} · Y:${target.y + 1} · Z:${(target.z ?? 0) + 1}`
          : 'Click en una celda'}
      </div>
    </div>
  );
};

export default ShelfMiniMap3D;
