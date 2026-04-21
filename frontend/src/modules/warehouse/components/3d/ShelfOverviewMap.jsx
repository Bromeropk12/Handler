import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { CameraController, getCellStatus, STATUS_COLORS, LEVEL_HEIGHT } from './Shared3DComponents';
import {
  ArrowsPointingOutIcon, EyeIcon, ChartBarIcon, ArrowPathIcon
} from '@heroicons/react/24/outline';

// ─── Interactive Level Plane ────────────────────────────────────────────────────
const LevelPlane = ({ yIndex, totalCols, totalDepth, isSelected, sampleCount, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const active = isSelected || hovered;

  return (
    <group position={[0, yIndex * LEVEL_HEIGHT + 0.48, 0]}>
      {/* The clickable slab */}
      <mesh
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e)  => { setHovered(false);  document.body.style.cursor = 'default'; }}
        onClick={(e) => { e.stopPropagation(); onClick(yIndex); }}
      >
        <boxGeometry args={[totalCols + 0.3, 0.07, totalDepth + 0.3]} />
        <meshStandardMaterial
          color={isSelected ? '#facc15' : '#60a5fa'}
          transparent opacity={isSelected ? 0.18 : hovered ? 0.12 : 0.01}
          emissive={isSelected ? '#facc15' : '#60a5fa'}
          emissiveIntensity={isSelected ? 0.4 : hovered ? 0.3 : 0}
          roughness={0.1} depthWrite={false}
        />
      </mesh>

      {/* Leading edge glow line */}
      {active && (
        <mesh position={[0, 0.04, -(totalDepth / 2 + 0.18)]}>
          <boxGeometry args={[totalCols + 0.4, 0.025, 0.07]} />
          <meshStandardMaterial
            color={isSelected ? '#facc15' : '#60a5fa'}
            emissive={isSelected ? '#facc15' : '#60a5fa'}
            emissiveIntensity={2}
            transparent opacity={0.9}
          />
        </mesh>
      )}

      {/* Level number badge floating on the left */}
      <Html position={[-totalCols / 2 - 1.1, 0, 0]} center>
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={(e) => { e.stopPropagation(); onClick(yIndex); }}
          style={{
            width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
            background: isSelected ? '#facc15' : hovered ? 'rgba(96,165,250,0.25)' : 'rgba(255,255,255,0.04)',
            color: isSelected ? '#000' : hovered ? '#93c5fd' : '#475569',
            border: isSelected ? '1px solid #facc15' : hovered ? '1px solid rgba(96,165,250,0.5)' : '1px solid rgba(255,255,255,0.08)',
            boxShadow: isSelected ? '0 0 14px rgba(250,204,21,0.5)' : 'none',
          }}
        >
          {yIndex + 1}
        </div>
      </Html>

      {/* Sample count badge on right (only when has samples) */}
      {sampleCount > 0 && (
        <Html position={[totalCols / 2 + 0.9, 0, 0]} center>
          <div style={{
            fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 10,
            background: isSelected ? 'rgba(250,204,21,0.2)' : 'rgba(14,165,233,0.15)',
            color: isSelected ? '#facc15' : '#38bdf8',
            border: `1px solid ${isSelected ? 'rgba(250,204,21,0.3)' : 'rgba(14,165,233,0.25)'}`,
            whiteSpace: 'nowrap',
          }}>
            {sampleCount}
          </div>
        </Html>
      )}
    </group>
  );
};

// ─── Overview Shelf Structure ───────────────────────────────────────────────────
const ShelfStructure = ({ totalCols, totalDepth, totalLevels }) => {
  const postH = totalLevels * LEVEL_HEIGHT + 0.2;
  const posts = [
    [-totalCols / 2 - 0.15, -totalDepth / 2 - 0.15],
    [ totalCols / 2 + 0.15, -totalDepth / 2 - 0.15],
    [-totalCols / 2 - 0.15,  totalDepth / 2 + 0.15],
    [ totalCols / 2 + 0.15,  totalDepth / 2 + 0.15],
  ];

  return (
    <group position={[0, -(totalLevels * LEVEL_HEIGHT) / 2 + 0.5, 0]}>
      {/* Horizontal shelves */}
      {Array.from({ length: totalLevels + 1 }).map((_, i) => (
        <mesh key={`shelf-${i}`} position={[0, i * LEVEL_HEIGHT - 0.04, 0]}>
          <boxGeometry args={[totalCols + 0.35, 0.04, totalDepth + 0.35]} />
          <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.15} transparent opacity={0.7} />
          <Edges color="#1e3a5f" transparent opacity={0.5} />
        </mesh>
      ))}

      {/* Corner posts */}
      {posts.map(([px, pz], i) => (
        <mesh key={`post-${i}`} position={[px, postH / 2 - 0.5, pz]}>
          <boxGeometry args={[0.1, postH, 0.1]} />
          <meshStandardMaterial color="#020617" metalness={0.95} roughness={0.05} />
          <Edges color="#0ea5e9" transparent opacity={0.5} />
        </mesh>
      ))}

      {/* Bottom base plate */}
      <mesh position={[0, -0.06, 0]}>
        <boxGeometry args={[totalCols + 0.8, 0.04, totalDepth + 0.8]} />
        <meshStandardMaterial color="#020617" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────────
export const ShelfOverviewMap = ({ mapData, selectedLevel, onSelectLevel }) => {
  const [cameraView, setCameraView] = useState('default');

  const totalLevels = mapData.shelf.grid_height || 10;
  const totalDepth  = mapData.shelf.shelf_depth || 10;
  const totalCols   = mapData.shelf.grid_width || 10;

  // Pre-compute sample counts per level for badges
  const sampleCountByLevel = {};
  mapData.samples.forEach(s => {
    sampleCountByLevel[s.position_y] = (sampleCountByLevel[s.position_y] || 0) + 1;
  });

  const targetPos =
    cameraView === 'front' ? new THREE.Vector3(0, 0, totalDepth * 2 + 8) :
    cameraView === 'top'   ? new THREE.Vector3(0.1, totalLevels * LEVEL_HEIGHT + 6, 0.1) :
                             new THREE.Vector3(totalCols * 1.4, totalLevels * LEVEL_HEIGHT * 0.7, totalDepth * 1.4 + 4);

  const CAMERA_VIEWS = [
    { id: 'default', Icon: ArrowsPointingOutIcon, label: 'Isométrica' },
    { id: 'top',     Icon: EyeIcon,               label: 'Cenital'    },
    { id: 'front',   Icon: ChartBarIcon,           label: 'Frontal'    },
  ];

  return (
    <div className="w-full h-full relative select-none flex" style={{ backgroundColor: '#060a12', background: 'radial-gradient(ellipse at 60% 20%, #0d1929 0%, #000000 100%)' }}>
      <Canvas className="w-full h-full" camera={{ fov: 45 }} gl={{ alpha: true, antialias: true }}>
        <CameraController view={cameraView} targetPosOverride={targetPos} />

        {/* Lighting */}
        <ambientLight intensity={0.45} />
        <directionalLight position={[8, 16, 10]} intensity={1.8} color="#ffffff" castShadow />
        <directionalLight position={[-6, 8, -6]} intensity={0.4} color="#38bdf8" />
        <pointLight position={[0, totalLevels + 2, 0]} intensity={0.5} color="#0ea5e9" distance={totalLevels * 4} />

        <OrbitControls makeDefault enablePan enableZoom enableRotate minDistance={3} maxDistance={40} />

        {/* Shelf skeleton */}
        <ShelfStructure totalCols={totalCols} totalDepth={totalDepth} totalLevels={totalLevels} />

        {/* Interactive level planes + sample cubes grouped per level */}
        <group position={[0, -(totalLevels * LEVEL_HEIGHT) / 2 + 0.5, 0]}>
          {Array.from({ length: totalLevels }).map((_, i) => (
            <LevelPlane
              key={`lp-${i}`}
              yIndex={i}
              totalCols={totalCols}
              totalDepth={totalDepth}
              isSelected={selectedLevel === i}
              sampleCount={sampleCountByLevel[i] || 0}
              onClick={onSelectLevel}
            />
          ))}

          {/* Mini sample cubes – color-coded by status, dimmed when another level selected */}
          {mapData.samples.map(sample => {
            const w   = sample.width || 1;
            const d   = sample.depth || 1;
            const px  = -totalCols / 2 + sample.position_x + w / 2;
            const py  = sample.position_y * LEVEL_HEIGHT + 0.4;
            const pz  = -totalDepth / 2 + (sample.position_z || 0) + d / 2;
            const dim = selectedLevel !== null && selectedLevel !== sample.position_y;
            const status = getCellStatus(sample);
            const col = STATUS_COLORS[status];

            return (
              <mesh
                key={sample.id}
                position={[px, py, pz]}
                onClick={(e) => { e.stopPropagation(); onSelectLevel(sample.position_y); }}
              >
                <boxGeometry args={[w - 0.15, 0.65, d - 0.15]} />
                <meshStandardMaterial
                  color={dim ? '#0f172a' : col}
                  emissive={dim ? '#000000' : col}
                  emissiveIntensity={dim ? 0 : 0.18}
                  roughness={0.3} metalness={0.4}
                  transparent opacity={dim ? 0.18 : 0.92}
                />
              </mesh>
            );
          })}
        </group>
      </Canvas>

      {/* ── HUD: Top-left label ── */}
      <div className="absolute top-5 left-6 pointer-events-none">
        <p className="text-[9px] font-bold tracking-[3px] text-primary-500 uppercase mb-0.5">Navegador Global</p>
        <h3 className="text-base font-bold text-gray-100 leading-tight">Estantería Completa</h3>
        <p className="text-[10px] text-gray-500 mt-1">Clic en un nivel para inspeccionar</p>
      </div>

      {/* ── HUD: Level pill when selected ── */}
      {selectedLevel !== null && (
        <div className="absolute top-5 right-5 flex items-center gap-2">
          <span
            className="text-[10px] font-bold px-3 py-1.5 rounded-full pointer-events-auto cursor-pointer transition-all"
            style={{ background: 'rgba(250,204,21,0.15)', border: '1px solid rgba(250,204,21,0.4)', color: '#facc15', boxShadow: '0 0 14px rgba(250,204,21,0.2)' }}
            onClick={() => onSelectLevel(null)}
          >
            Nivel {selectedLevel + 1} ✕
          </span>
        </div>
      )}

      {/* ── HUD: Camera toolbar ── */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1 pointer-events-auto"
        style={{ background: 'rgba(9,13,20,0.8)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 40, padding: '5px 8px' }}>
        {CAMERA_VIEWS.map(({ id, Icon, label }) => (
          <button
            key={id}
            title={label}
            onClick={() => setCameraView(id)}
            className="transition-all"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 30, border: 'none', cursor: 'pointer',
              background: cameraView === id ? 'rgba(14,165,233,0.2)' : 'transparent',
              color: cameraView === id ? '#38bdf8' : '#475569',
              boxShadow: cameraView === id ? '0 0 12px rgba(14,165,233,0.25)' : 'none',
              fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
            }}
          >
            <Icon style={{ width: 13, height: 13 }} />
            <span style={{ display: cameraView === id ? 'inline' : 'none' }}>{label}</span>
          </button>
        ))}
      </div>

      {/* ── Legend: status dots ── */}
      <div className="absolute bottom-5 right-5 flex flex-col gap-1.5 pointer-events-none">
        {[['occupied','#0ea5e9','Activa'], ['warning','#f59e0b','Por Vencer'], ['expired','#ef4444','Vencida']].map(([, col, lbl]) => (
          <div key={lbl} className="flex items-center gap-1.5">
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: col, boxShadow: `0 0 6px ${col}` }} />
            <span style={{ fontSize: 9, color: '#4b5563', fontWeight: 600 }}>{lbl}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
