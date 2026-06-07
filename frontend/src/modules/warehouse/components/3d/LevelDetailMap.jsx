import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Edges } from '@react-three/drei';
import { GridLines, CameraController, SampleCube, EmptyCellTarget, getCellStatus } from './Shared3DComponents';

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
  
  // Movement props
  isSelectionMode,
  isMovementMode,
  isGroupDragMode = false,           // true cuando hay ≥2 muestras seleccionadas
  isGroupDragging = false,           // true durante el drag activo
  validityByKey = {},                // { 'x,y,z': 'valid'|'invalid'|'unknown' } del backend
  selectedSampleIds = new Set(),
  assignedTargets = [],
  onSampleClick,
  onEmptyCellClick,
  onSampleDragStart,                 // (sample, event) al iniciar drag-en-grupo

  // v2.0 — UI flotante sobre cubos
  movementMode = false,              // true durante "modo mover": oculta tooltips, ilumina celdas verde/rojo
  showTooltipFor = null,             // sample.id (number) del cubo cuyo tooltip debe estar visible
  showGroupChipFor = new Set(),      // Set<number> de ids que son parte del grupo seleccionado
  groupChipColor = '#38bdf8',
  onTooltipViewDetail,               // () => void
  onTooltipMove,                     // () => void
  onTooltipClose,                    // () => void
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

  // Compute empty cells for movement mode
  const emptyCells = [];
  if (isMovementMode) {
    const occupiedMap = new Set(levelSamples.map(s => `${s.position_x},${s.position_z || 0}`));
    
    // Also consider newly assigned targets as occupied in this view
    assignedTargets.forEach(target => {
      if (target.targetShelfId === mapData.shelf.id && target.y === selectedLevel) {
        occupiedMap.add(`${target.x},${target.z}`);
      }
    });

    for (let x = 0; x < totalCols; x++) {
      for (let z = 0; z < totalDepth; z++) {
        if (!occupiedMap.has(`${x},${z}`)) {
          emptyCells.push({ x, y: selectedLevel, z });
        }
      }
    }
  }

  const isSampleSelected = (id) => {
    if (selectedSampleIds instanceof Map) return selectedSampleIds.has(id);
    if (selectedSampleIds instanceof Set) return selectedSampleIds.has(id);
    if (Array.isArray(selectedSampleIds)) return selectedSampleIds.some(s => s.id === id);
    return false;
  };

  const isSampleAssigned = (id) => {
    return assignedTargets.some(t => t.sampleData?.id === id && t.targetShelfId !== null);
  };

  return (
    <div className="w-full h-full relative select-none flex" style={{ backgroundColor: '#060a12', background: 'radial-gradient(ellipse at 30% 80%, #090d1c 0%, #000000 100%)', isolation: 'isolate' }}>
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
          enablePan enableZoom={!isGroupDragging} enableRotate={!isGroupDragging}
          minDistance={2} maxDistance={30}
          minPolarAngle={Math.PI / 8}
          maxPolarAngle={Math.PI / 2.1}
        />

        <group position={[0, -0.5, 0]}>
          <FloorPanel totalCols={totalCols} totalDepth={totalDepth} />

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
            const isMultiSelected = isSelectionMode && isSampleSelected(sample.id);
            const isSourceOfMove = isMovementMode && isSampleSelected(sample.id) && !isSampleAssigned(sample.id);
            const isAssignedSource = isMovementMode && isSampleAssigned(sample.id);
            const isInGroupDrag = isGroupDragging && isMultiSelected;

            // Dim if not selected in selection mode, or if assigned in movement mode
            let isDimmed = !visible || (isFocusing && !isSelected && !isHovered);
            if (isSelectionMode && !isMultiSelected) isDimmed = true;
            if (isAssignedSource) isDimmed = true;

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
                isMultiSelected={isMultiSelected}
                isSourceOfMove={isSourceOfMove}
                isDimmed={isDimmed}
                isInGroupDrag={isInGroupDrag}
                status={status}
                ghsDangerClass={sample.ghs_danger_class}
                // v2.0 — UI flotante
                showTooltip={showTooltipFor === sample.id}
                showGroupChip={showGroupChipFor.has(sample.id)}
                movementMode={movementMode}
                groupChipColor={groupChipColor}
                onTooltipViewDetail={onTooltipViewDetail}
                onTooltipMove={onTooltipMove}
                onTooltipClose={onTooltipClose}
                onHover={(c) => setHoveredCell(c ? sample : null)}
                onClick={() => {
                  if (isSelectionMode || isMovementMode) {
                    if (onSampleClick) onSampleClick(sample);
                  } else {
                    setSelectedCell(isSelected ? null : sample);
                  }
                }}
                onDragStart={isInGroupDrag ? onSampleDragStart : undefined}
              />
            );
          })}

          {/* Render empty cell targets when moving */}
          {isMovementMode && emptyCells.map(cell => {
            const cellKey = `${cell.x},${cell.y ?? selectedLevel},${cell.z}`;
            const validityState = isGroupDragMode ? validityByKey[cellKey] : undefined;
            return (
              <EmptyCellTarget
                key={`empty-${cell.x}-${cell.z}`}
                x={cell.x}
                y={0}
                z={cell.z}
                offsetX={-totalCols / 2}
                offsetZ={-totalDepth / 2}
                validityState={validityState}
                onDrop={(pos) => onEmptyCellClick && onEmptyCellClick({ x: pos.x, y: selectedLevel, z: pos.z })}
              />
            );
          })}
        </group>
      </Canvas>

      {/* ── HUD: Level badge top-left (z-index 30 to always sit above R3F Html) ── */}
      <div className="absolute top-5 left-5 pointer-events-none flex items-start gap-3" style={{ zIndex: 30 }}>
        <div className="w-[3px] h-12 rounded-full bg-gradient-to-b from-sky-400 to-blue-500" style={{ boxShadow: '0 0 8px rgba(56,189,248,0.5)', flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: 3, color: '#38bdf8', textTransform: 'uppercase', margin: '0 0 2px' }}>Vista de Nivel</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#ffffff', margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>Nivel {selectedLevel + 1}</h3>
            <span style={{
              fontSize: 8, padding: '3px 8px', borderRadius: 20, fontWeight: 800, letterSpacing: 0.8,
              background: 'rgba(14, 165, 233, 0.1)', color: '#38bdf8', border: '1px solid rgba(14, 165, 233, 0.3)',
              backdropFilter: 'blur(8px)', whiteSpace: 'nowrap', textTransform: 'uppercase',
            }}>
              {levelSamples.length} {levelSamples.length === 1 ? 'muestra' : 'muestras'}
            </span>
          </div>
          <p style={{ fontSize: 9, color: '#475569', fontWeight: 500, letterSpacing: 0.5, margin: '4px 0 0' }}>{mapData.shelf.name} · {totalCols}×{totalDepth}</p>
        </div>
      </div>

      {/* ── Empty state overlay (z-index 25 – above canvas, below HUD) ── */}
      {levelSamples.length === 0 && (
        <div className="absolute pointer-events-none" style={{ inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 25 }}>
          <div style={{
            textAlign: 'center',
            background: 'rgba(9, 13, 22, 0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: 24,
            padding: '36px 56px',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          }}>
            <div style={{ fontSize: 38, marginBottom: 16, filter: 'drop-shadow(0 0 10px rgba(148, 163, 184, 0.15))' }}>📦</div>
            <p style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, margin: 0 }}>Nivel Vacío</p>
            <p style={{ color: '#64748b', fontSize: 10, fontWeight: 500, letterSpacing: 0.5, marginTop: 6, marginBottom: 0 }}>No hay muestras en este nivel</p>
          </div>
        </div>
      )}
    </div>
  );
};
