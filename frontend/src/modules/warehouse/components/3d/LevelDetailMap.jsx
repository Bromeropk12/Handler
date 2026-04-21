import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Edges, Grid } from '@react-three/drei';
import { GridLines, AxisLabels, CameraController, SampleCube, getCellStatus } from './Shared3DComponents';

// ─── Floor Grid Panel ──────────────────────────────────────────────────────────
const FloorPanel = ({ totalCols, totalDepth }) => (
  <group>
    {/* Base slab */}
    <mesh position={[0, -0.12, 0]}>
      <boxGeometry args={[totalCols + 0.4, 0.15, totalDepth + 0.4]} />
      <meshStandardMaterial color="#080c16" metalness={0.7} roughness={0.3} />
      <Edges color="#1e3a5f" transparent opacity={0.4} />
    </mesh>

    {/* Top surface */}
    <mesh position={[0, -0.04, 0]}>
      <boxGeometry args={[totalCols + 0.3, 0.02, totalDepth + 0.3]} />
      <meshStandardMaterial color="#0d1829" metalness={0.9} roughness={0.1} />
    </mesh>

    {/* Grid lines */}
    <GridLines cols={totalCols} depth={totalDepth} />

    {/* Front edge neon strip */}
    <mesh position={[0, -0.03, totalDepth / 2 + 0.18]}>
      <boxGeometry args={[totalCols + 0.4, 0.03, 0.08]} />
      <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={1.2} />
    </mesh>

    {/* Back wall */}
    <mesh position={[0, 0.55, -totalDepth / 2 - 0.12]}>
      <boxGeometry args={[totalCols + 0.4, 1.3, 0.1]} />
      <meshStandardMaterial color="#030712" metalness={0.85} roughness={0.15} transparent opacity={0.95} />
      <Edges color="#0ea5e9" transparent opacity={0.5} />
    </mesh>

    {/* Side walls (thin) */}
    {[-1, 1].map(side => (
      <mesh key={side} position={[side * (totalCols / 2 + 0.2), 0.4, 0]}>
        <boxGeometry args={[0.08, 1.1, totalDepth + 0.4]} />
        <meshStandardMaterial color="#020712" metalness={0.9} roughness={0.1} transparent opacity={0.5} />
        <Edges color="#0ea5e9" transparent opacity={0.4} />
      </mesh>
    ))}
  </group>
);

// ─── Main Component ─────────────────────────────────────────────────────────────
export const LevelDetailMap = ({
  mapData, selectedLevel,
  selectedCell, setSelectedCell,
  hoveredCell,  setHoveredCell,
  cameraView,
  showExpired, showWarnings,
}) => {
  const totalCols   = mapData.shelf.grid_width  || 10;
  const totalDepth  = mapData.shelf.shelf_depth || 10;
  const levelSamples = mapData.samples.filter(s => s.position_y === selectedLevel);

  const shouldShow = (cell) => {
    const st = getCellStatus(cell);
    if (st === 'expired' && !showExpired) return false;
    if (st === 'warning' && !showWarnings) return false;
    return true;
  };

  const isFocusing = Boolean(selectedCell || hoveredCell);

  return (
    <div className="w-full h-full relative select-none flex" style={{ backgroundColor: '#060a12', background: 'radial-gradient(ellipse at 30% 80%, #090d1c 0%, #000000 100%)' }}>
      <Canvas className="w-full h-full" camera={{ fov: 42, position: [10, 7, 10] }} gl={{ alpha: true, antialias: true }}>
        <CameraController view={cameraView} />

        {/* Lighting */}
        <ambientLight intensity={0.55} />
        <directionalLight position={[8, 14, 8]} intensity={1.6} color="#ffffff" />
        <directionalLight position={[-6, 6, -8]} intensity={0.45} color="#38bdf8" />
        <pointLight position={[0, 6, 0]} intensity={0.35} color="#0ea5e9" distance={30} />

        {/* No z-lock on OrbitControls so user can freely inspect */}
        <OrbitControls
          makeDefault
          enablePan enableZoom enableRotate
          minDistance={2} maxDistance={30}
          minPolarAngle={Math.PI / 8}
          maxPolarAngle={Math.PI / 2.1}
        />

        <group position={[0, -0.5, 0]}>
          <FloorPanel totalCols={totalCols} totalDepth={totalDepth} />
          <AxisLabels cols={totalCols} depth={totalDepth} />

          {/* No samples message */}
          {levelSamples.length === 0 && (
            <group position={[0, 0.5, 0]}>
              {/* placeholder grid silhouette */}
            </group>
          )}

          {levelSamples.map(sample => {
            const cellData  = { ...sample, name: sample.global_sample_name };
            const status    = getCellStatus(cellData);
            const visible   = shouldShow(cellData);
            const isSelected = selectedCell?.id === sample.id;
            const isHovered  = hoveredCell?.id === sample.id;
            const isDimmed   = !visible || (isFocusing && !isSelected && !isHovered);

            return (
              <SampleCube
                key={sample.id}
                cell={cellData}
                x={sample.position_x}
                y={0}
                z={sample.position_z || 0}
                offsetX={-totalCols / 2}
                offsetZ={-totalDepth / 2}
                isSelected={isSelected}
                isDimmed={isDimmed}
                status={status}
                onHover={(c) => setHoveredCell(c ? sample : null)}
                onClick={() => setSelectedCell(isSelected ? null : sample)}
              />
            );
          })}
        </group>
      </Canvas>

      {/* ── HUD: Level badge top-left ── */}
      <div className="absolute top-5 left-6 pointer-events-none">
        <p className="text-[9px] font-bold tracking-[3px] text-primary-500 uppercase mb-0.5">Vista de Nivel</p>
        <h3 className="text-base font-bold text-gray-100 leading-tight flex items-center gap-2">
          Nivel {selectedLevel + 1}
          <span style={{
            fontSize: 9, padding: '2px 7px', borderRadius: 20, fontWeight: 700, letterSpacing: 0.5,
            background: 'rgba(14,165,233,0.15)', color: '#38bdf8', border: '1px solid rgba(14,165,233,0.3)'
          }}>
            {levelSamples.length} muestras
          </span>
        </h3>
        <p className="text-[10px] text-gray-500 mt-1">{mapData.shelf.name} · {totalCols}×{totalDepth}</p>
      </div>

      {/* ── Empty state overlay ── */}
      {levelSamples.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center" style={{ background: 'rgba(9,13,20,0.6)', backdropFilter: 'blur(12px)', borderRadius: 20, padding: '32px 48px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📦</div>
            <p style={{ color: '#4b5563', fontSize: 13, fontWeight: 600 }}>Nivel vacío</p>
            <p style={{ color: '#374151', fontSize: 11, marginTop: 4 }}>No hay muestras en este nivel</p>
          </div>
        </div>
      )}
    </div>
  );
};
