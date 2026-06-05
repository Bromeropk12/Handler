import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { CameraController, LEVEL_HEIGHT, getColorByName } from './Shared3DComponents';


// ─── Interactive Level Plane ────────────────────────────────────────────────────
const LevelPlane = ({ yIndex, totalCols, totalDepth, isSelected, isHovered, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const active = isSelected || hovered || isHovered;

  return (
    <group position={[0, yIndex * LEVEL_HEIGHT + 0.48, 0]}>
      {/* The clickable slab */}
      <mesh
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={()  => { setHovered(false);  document.body.style.cursor = 'default'; }}
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
export const ShelfOverviewMap = ({ mapData, selectedLevel, onSelectLevel, isTargetPickerMode }) => {
  const [hoveredLevel, setHoveredLevel] = useState(null);

  const totalLevels = mapData.shelf.grid_height || 10;
  const totalDepth  = mapData.shelf.shelf_depth || 10;
  const totalCols   = mapData.shelf.grid_width || 10;

  // Pre-compute sample counts per level for badges
  const sampleCountByLevel = {};
  mapData.samples.forEach(s => {
    sampleCountByLevel[s.position_y] = (sampleCountByLevel[s.position_y] || 0) + 1;
  });

  const targetPos = new THREE.Vector3(totalCols * 1.8, totalLevels * LEVEL_HEIGHT * 0.75, totalDepth * 1.8 + 6);

  return (
    <div className="w-full h-full relative select-none flex" style={{ backgroundColor: '#060a12', background: 'radial-gradient(ellipse at 60% 20%, #0d1929 0%, #000000 100%)', flexDirection: 'row' }}>
      {/* ── Left Sidebar Level Select ── */}
      <div style={{
        width: 70,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '12px 0',
        borderRight: '1px solid rgba(255, 255, 255, 0.06)',
        background: 'rgba(9, 13, 22, 0.4)',
        backdropFilter: 'blur(10px)',
        zIndex: 35,
        boxSizing: 'border-box',
      }}>
        {/* Track title or label */}
        <span style={{ fontSize: 7, color: '#475569', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, transform: 'rotate(-90deg)', marginBottom: 12, whiteSpace: 'nowrap' }}>NIVELES</span>
        
        {/* Level buttons from totalLevels down to 1 */}
        {Array.from({ length: totalLevels }).map((_, idx) => {
          const yIndex = totalLevels - 1 - idx; // e.g. 9 down to 0
          const count = sampleCountByLevel[yIndex] || 0;
          const isSelected = selectedLevel === yIndex;
          
          const levelCapacity = totalCols * totalDepth;
          const freeSpace = levelCapacity - count;
          
          return (
            <button
              key={yIndex}
              onClick={() => onSelectLevel(isSelected ? null : yIndex)}
              onMouseEnter={() => setHoveredLevel(yIndex)}
              onMouseLeave={() => setHoveredLevel(null)}
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 900,
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                background: isSelected ? 'rgba(250, 204, 21, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                color: isSelected ? '#facc15' : '#64748b',
                border: isSelected ? '1px solid rgba(250, 204, 21, 0.8)' : '1px solid rgba(255, 255, 255, 0.05)',
                boxShadow: isSelected ? '0 0 12px rgba(250, 204, 21, 0.25)' : 'none',
              }}
            >
              <span>{yIndex + 1}</span>
              {/* Little count badge */}
              {(isTargetPickerMode ? freeSpace > 0 : count > 0) && (
                <span style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  fontSize: 7,
                  fontWeight: 900,
                  padding: '1px 4px',
                  borderRadius: 8,
                  background: isTargetPickerMode ? (freeSpace > 0 ? '#10b981' : '#ef4444') : (isSelected ? '#facc15' : '#0ea5e9'),
                  color: isSelected && !isTargetPickerMode ? '#000' : '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
                  border: '1px solid #060a12',
                }}>
                  {isTargetPickerMode ? freeSpace : count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Main Canvas Area ── */}
      <div style={{ flex: 1, height: '100%', position: 'relative' }}>
        <Canvas className="w-full h-full" camera={{ fov: 45 }} gl={{ alpha: true, antialias: true }}>
          <CameraController view="default" targetPosOverride={targetPos} />

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
                isHovered={hoveredLevel === i}
                onClick={onSelectLevel}
              />
            ))}

            {/* Mini sample cubes – color-coded by product name, dimmed when another level selected */}
            {mapData.samples.map(sample => {
              const w   = sample.width || 1;
              const d   = sample.depth || 1;
              const px  = -totalCols / 2 + sample.position_x + w / 2;
              const py  = sample.position_y * LEVEL_HEIGHT + 0.4;
              const pz  = -totalDepth / 2 + (sample.position_z || 0) + d / 2;
              const isLevelSelected = selectedLevel !== null;
              const isCurrentLevel = selectedLevel === sample.position_y;

              const col = getColorByName(sample.global_sample_name);
              let cubeColor = col;
              let cubeEmissive = col;
              let cubeEmissiveIntensity = 0.05;
              let cubeOpacity = 0.55;

              if (isLevelSelected) {
                if (isCurrentLevel) {
                  cubeOpacity = 0.95;
                  cubeEmissiveIntensity = 0.25;
                } else {
                  cubeColor = '#0f172a';
                  cubeEmissive = '#000000';
                  cubeEmissiveIntensity = 0;
                  cubeOpacity = 0.12;
                }
              }

              return (
                <group key={sample.id} position={[px, py, pz]}>
                  <mesh
                    onClick={(e) => { e.stopPropagation(); onSelectLevel(sample.position_y); }}
                  >
                    <boxGeometry args={[w - 0.15, 0.65, d - 0.15]} />
                    <meshStandardMaterial
                      color={cubeColor}
                      emissive={cubeEmissive}
                      emissiveIntensity={cubeEmissiveIntensity}
                      roughness={0.35}
                      metalness={0.45}
                      transparent
                      opacity={cubeOpacity}
                    />
                  </mesh>
                </group>
              );
            })}
          </group>
        </Canvas>

        {/* ── HUD: Top-left label ── */}
        <div className="absolute top-5 left-5 pointer-events-none flex flex-col" style={{ zIndex: 30 }}>
          <div style={{ display: 'flex', alignItems: 'start', gap: 3 }}>
            <div style={{ width: 3, minHeight: 40, borderRadius: 99, background: isTargetPickerMode ? 'linear-gradient(to bottom, #10b981, #34d399)' : 'linear-gradient(to bottom, #3b82f6, #38bdf8)', boxShadow: isTargetPickerMode ? '0 0 8px rgba(52,211,153,0.5)' : '0 0 8px rgba(56,189,248,0.5)', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: 3, color: isTargetPickerMode ? '#34d399' : '#38bdf8', textTransform: 'uppercase', margin: '0 0 2px' }}>
                {isTargetPickerMode ? 'Modo Reubicación' : 'Navegador Global'}
              </p>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: '#ffffff', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 1 }}>
                {isTargetPickerMode ? 'Seleccionar Nivel Destino' : 'Estantería Completa'}
              </h3>
              <p style={{ fontSize: 9, color: '#475569', fontWeight: 500, letterSpacing: 0.5, margin: 0 }}>
                {isTargetPickerMode ? 'Los números verdes indican espacios libres' : 'Clic en un nivel para inspeccionar'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Status Legend (Bottom Center) ── */}
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'rgba(9, 13, 22, 0.65)',
          backdropFilter: 'blur(20px)',
          padding: '6px 16px',
          borderRadius: 20,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
          zIndex: 30,
          pointerEvents: 'auto',
          whiteSpace: 'nowrap',
        }}>
          {[
            { key: 'A', col: '#0ea5e9', lbl: 'Activa' },
            { key: 'P', col: '#f59e0b', lbl: 'Alerta' },
            { key: 'V', col: '#ef4444', lbl: 'Vencida' },
          ].map(({ key, col, lbl }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: col,
                color: key === 'P' ? '#000000' : '#ffffff',
                fontSize: 7,
                fontWeight: 900,
                border: '1px solid rgba(255,255,255,0.7)',
                boxShadow: `0 0 6px ${col}30`,
              }}>
                {key}
              </div>
              <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700 }}>{lbl}</span>
            </div>
          ))}
          <span style={{ width: 1, height: 10, background: 'rgba(255, 255, 255, 0.1)' }} />
          <span style={{ fontSize: 8, color: '#64748b', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>Color: Producto</span>
        </div>

        {/* ── HUD: Level pill when selected ── */}
        {selectedLevel !== null && (
          <div className="absolute top-5 right-5 flex items-center gap-2" style={{ zIndex: 30 }}>
            <button
              className="text-[10px] font-black tracking-wider uppercase px-4 py-2 rounded-full pointer-events-auto cursor-pointer transition-all duration-300"
              style={{
                background: 'rgba(250, 204, 21, 0.12)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(250, 204, 21, 0.5)',
                color: '#facc15',
                boxShadow: '0 4px 15px rgba(250, 204, 21, 0.15), inset 0 0 10px rgba(250, 204, 21, 0.05)',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(250, 204, 21, 0.2)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(250, 204, 21, 0.3), inset 0 0 12px rgba(250, 204, 21, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(250, 204, 21, 0.12)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(250, 204, 21, 0.15), inset 0 0 10px rgba(250, 204, 21, 0.05)';
              }}
              onClick={() => onSelectLevel(null)}
            >
              Nivel {selectedLevel + 1} &nbsp;✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
