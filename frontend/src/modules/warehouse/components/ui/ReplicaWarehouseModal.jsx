import React, { useState, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, ContactShadows, Edges } from '@react-three/drei';
import * as THREE from 'three';
import {
  ArrowLeftIcon, XMarkIcon, CheckIcon, CubeIcon, ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { warehouseAPI } from '../../../../services/api';
import {
  BACKDROP, BLUR, RADIUS, BUTTON, ANIM, SURFACE,
} from '../../constants';
import { LEVEL_HEIGHT, getSGAColor, getColorByName, GridLines } from '../3d/Shared3DComponents';

// ─── LevelPlane: plano interactivo de nivel en la vista de estantería completa ─
const LevelPlane = ({ yIndex, totalCols, totalDepth, isSelected, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const active = isSelected || hovered;

  return (
    <group position={[0, yIndex * LEVEL_HEIGHT + 0.48, 0]}>
      {/* El slab clicable */}
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

      {/* Línea LED frontal brillante */}
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

// ─── FloorPanel: piso de soporte detallado para la vista de nivel ─────────────
const FloorPanel = ({ totalCols, totalDepth }) => (
  <group>
    {/* Losa de base */}
    <mesh position={[0, -0.12, 0]}>
      <boxGeometry args={[totalCols + 0.4, 0.15, totalDepth + 0.4]} />
      <meshStandardMaterial color="#080c16" metalness={0.7} roughness={0.3} />
      <Edges color="#1e3a5f" transparent opacity={0.4} />
    </mesh>

    {/* Superficie superior */}
    <mesh position={[0, -0.04, 0]}>
      <boxGeometry args={[totalCols + 0.3, 0.02, totalDepth + 0.3]} />
      <meshStandardMaterial color="#0d1829" metalness={0.9} roughness={0.1} />
    </mesh>

    {/* Líneas de cuadrícula */}
    <GridLines cols={totalCols} depth={totalDepth} />

    {/* Tira LED neón en el borde frontal */}
    <mesh position={[0, -0.03, totalDepth / 2 + 0.18]}>
      <boxGeometry args={[totalCols + 0.4, 0.03, 0.08]} />
      <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={1.2} />
    </mesh>

    {/* Pared posterior */}
    <mesh position={[0, 0.55, -totalDepth / 2 - 0.12]}>
      <boxGeometry args={[totalCols + 0.4, 1.3, 0.1]} />
      <meshStandardMaterial color="#030712" metalness={0.85} roughness={0.15} transparent opacity={0.95} />
      <Edges color="#0ea5e9" transparent opacity={0.5} />
    </mesh>

    {/* Paredes laterales delgadas */}
    {[-1, 1].map(side => (
      <mesh key={side} position={[side * (totalCols / 2 + 0.2), 0.4, 0]}>
        <boxGeometry args={[0.08, 1.1, totalDepth + 0.4]} />
        <meshStandardMaterial color="#020712" metalness={0.9} roughness={0.1} transparent opacity={0.5} />
        <Edges color="#0ea5e9" transparent opacity={0.4} />
      </mesh>
    ))}
  </group>
);

// ─── AisleShelfMesh: bloque en la vista de pasillo ───────────────────────────
const AisleShelfMesh = ({ shelf, position, index, isHovered, onHover, onClick }) => {
  const meshRef = useRef();
  const scaleVec = useRef(new THREE.Vector3());

  useFrame((state) => {
    if (!meshRef.current) return;
    const targetScale = isHovered ? 1.06 : 1;
    scaleVec.current.set(targetScale, targetScale, targetScale);
    meshRef.current.scale.lerp(scaleVec.current, 0.1);
    const t = state.clock.getElapsedTime();
    const floatY = position[1] + (isHovered ? 0.18 : 0) + Math.sin(t * 2 + index) * 0.04;
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, floatY, 0.1);
  });

  const bW = 1.6, bH = 4.0, bD = 1.4;
  const occ = shelf.occupancy_percentage || 0;
  const ledColor = occ > 85 ? '#ef4444' : occ > 60 ? '#f59e0b' : occ > 30 ? '#0ea5e9' : '#10b981';

  return (
    <group
      position={position}
      ref={meshRef}
      onPointerOver={(e) => { e.stopPropagation(); onHover(shelf.id); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { onHover(null); document.body.style.cursor = 'default'; }}
      onClick={(e) => { e.stopPropagation(); document.body.style.cursor = 'default'; onClick(shelf.id); }}
    >
      <group position={[0, bH / 2 - 1.5, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[bW, bH, bD]} />
          <meshPhysicalMaterial color="#cbd5e1" metalness={0.9} roughness={0.1} clearcoat={0.8} clearcoatRoughness={0.05} />
        </mesh>
        <mesh position={[0, 0, bD / 2 + 0.01]}>
          <planeGeometry args={[bW - 0.25, bH - 0.25]} />
          <meshPhysicalMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, bH / 2 - 0.12, bD / 2 + 0.02]}>
          <planeGeometry args={[bW - 0.5, 0.08]} />
          <meshStandardMaterial color={ledColor} emissive={ledColor} emissiveIntensity={isHovered ? 2.0 : 0.9} />
        </mesh>
      </group>
      <Html position={[0, bH + 0.2, 0]} center style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(9,13,22,0.92)',
          backdropFilter: 'blur(8px)',
          border: `1px solid ${isHovered ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
          padding: '5px 10px',
          borderRadius: 8,
          textAlign: 'center',
          minWidth: 90,
          whiteSpace: 'nowrap',
          transition: 'all 0.2s',
          transform: isHovered ? 'scale(1.06)' : 'scale(1)',
        }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: '#f8fafc', marginBottom: 1 }}>{shelf.name}</div>
          <div style={{ fontSize: 8, fontWeight: 800, color: ledColor }}>{occ}% OCUPADO</div>
        </div>
      </Html>
    </group>
  );
};

// ─── ShelfStructure: estructura metálica del anaquel ─────────────────────────
const ShelfStructure = ({ totalCols, totalDepth, totalLevels, dimmed = false }) => {
  const postH = totalLevels * LEVEL_HEIGHT + 0.2;
  const d = dimmed ? 0.03 : 1.0;
  const posts = [
    [-totalCols / 2 - 0.15, -totalDepth / 2 - 0.15],
    [ totalCols / 2 + 0.15, -totalDepth / 2 - 0.15],
    [-totalCols / 2 - 0.15,  totalDepth / 2 + 0.15],
    [ totalCols / 2 + 0.15,  totalDepth / 2 + 0.15],
  ];

  return (
    <group position={[0, -(totalLevels * LEVEL_HEIGHT) / 2 + 0.5, 0]}>
      {Array.from({ length: totalLevels + 1 }).map((_, i) => (
        <mesh key={`shelf-${i}`} position={[0, i * LEVEL_HEIGHT - 0.04, 0]}>
          <boxGeometry args={[totalCols + 0.35, 0.06, totalDepth + 0.35]} />
          <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.15} transparent opacity={dimmed ? 0.04 : 0.85} />
          <Edges color="#1e3a5f" transparent opacity={dimmed ? 0.02 : 0.6} />
        </mesh>
      ))}
      {posts.map(([px, pz], i) => (
        <mesh key={`post-${i}`} position={[px, postH / 2 - 0.5, pz]}>
          <boxGeometry args={[0.1, postH, 0.1]} />
          <meshStandardMaterial color="#020617" metalness={0.95} roughness={0.05} transparent opacity={d} />
          <Edges color="#0ea5e9" transparent opacity={dimmed ? 0.02 : 0.6} />
        </mesh>
      ))}
      <mesh position={[0, -0.06, 0]}>
        <boxGeometry args={[totalCols + 0.8, 0.04, totalDepth + 0.8]} />
        <meshStandardMaterial color="#020617" metalness={0.9} roughness={0.2} transparent opacity={d} />
      </mesh>
    </group>
  );
};



// ─── Panel HTML de niveles (fuera del Canvas) ─────────────────────────────────
const LevelSidePanel = ({ gridHeight, selectedLevelY, onSelectLevel, freeByLevel, assignedByLevel }) => {
  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0,
      width: 148,
      display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(180deg, rgba(10,14,26,0.97) 0%, rgba(7,10,20,0.97) 100%)',
      borderLeft: '1px solid rgba(255,255,255,0.06)',
      zIndex: 30,
      pointerEvents: 'auto',
    }}>
      {/* Header del panel */}
      <div style={{
        padding: '10px 12px 8px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 8, fontWeight: 900, color: '#64748b', letterSpacing: 0.8, textTransform: 'uppercase' }}>
          Seleccionar nivel
        </div>
        <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>
          {gridHeight} niveles disponibles
        </div>
      </div>

      {/* Lista de niveles — scroll libre */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '6px 8px',
        display: 'flex', flexDirection: 'column-reverse', // nivel 1 abajo, último arriba
        gap: 4,
        scrollbarWidth: 'thin',
        scrollbarColor: '#1e3a5f transparent',
      }}>
        {Array.from({ length: gridHeight }).map((_, i) => {
          const free = freeByLevel[i] || 0;
          const assigned = assignedByLevel[i] || 0;
          const isActive = selectedLevelY === i;

          return (
            <button
              key={i}
              onClick={() => onSelectLevel(i)}
              title={`Nivel ${i + 1}: ${free} espacios libres`}
              style={{
                background: isActive
                  ? 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.08) 100%)'
                  : 'rgba(255,255,255,0.02)',
                border: isActive
                  ? '1px solid rgba(16,185,129,0.5)'
                  : '1px solid rgba(255,255,255,0.04)',
                borderRadius: 8,
                padding: '7px 10px',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all 0.15s',
                boxShadow: isActive ? '0 0 14px rgba(16,185,129,0.18)' : 'none',
                flexShrink: 0,
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)';
                }
              }}
            >
              {/* Número de nivel */}
              <div style={{
                width: 24, height: 24, borderRadius: 6,
                background: isActive ? '#10b981' : '#1e293b',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 900, color: isActive ? '#fff' : '#64748b',
                flexShrink: 0,
                boxShadow: isActive ? '0 0 8px rgba(16,185,129,0.5)' : 'none',
              }}>
                {i + 1}
              </div>

              {/* Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <span style={{
                  fontSize: 9, fontWeight: 800,
                  color: isActive ? '#fff' : '#94a3b8',
                  letterSpacing: 0.3,
                }}>
                  Nivel {i + 1}
                </span>
                <span style={{
                  fontSize: 8, fontWeight: 700,
                  color: free > 0 ? '#34d399' : '#64748b',
                }}>
                  {free > 0 ? `${free} libres` : 'Lleno'}
                  {assigned > 0 && <span style={{ color: '#fde68a', marginLeft: 3 }}>· {assigned}✓</span>}
                </span>
              </div>

              {/* Indicador de estado */}
              {isActive && (
                <div style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: '#10b981', boxShadow: '0 0 8px #10b981',
                  flexShrink: 0, marginLeft: 'auto',
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Sugerencia de desplazamiento */}
      <div style={{
        padding: '6px 10px 8px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <div style={{ fontSize: 7, color: '#475569', fontWeight: 600, lineHeight: 1.3 }}>
          ↕ Desplázate para ver todos los niveles
        </div>
      </div>
    </div>
  );
};

// ─── Componente Principal ─────────────────────────────────────────────────────
export const ReplicaWarehouseModal = ({
  samples = [],
  currentShelfId,
  compatibleShelves = [],
  onClose,
  onSuccess,
}) => {
  // step: 'aisle' | 'shelf'
  // En 'shelf': el anaquel se ve completo siempre. selectedLevelY controla qué nivel muestra celdas.
  const [step, setStep] = useState('aisle');
  const [selectedShelfId, setSelectedShelfId] = useState(null);
  const [selectedLevelY, setSelectedLevelY] = useState(null);

  const [targetMapData, setTargetMapData] = useState(null);
  const [loadingShelfData, setLoadingShelfData] = useState(false);
  const [shelfError, setShelfError] = useState(null);

  const [assignedCells, setAssignedCells] = useState([]);

  const [hoveredShelfId, setHoveredShelfId] = useState(null);

  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState(null);
  const [groupPreviewData, setGroupPreviewData] = useState(null);

  // Cargar preview de compatibilidad SGA al cambiar el anaquel destino
  useEffect(() => {
    if (!selectedShelfId || samples.length === 0) {
      setGroupPreviewData(null);
      return;
    }
    const controller = new AbortController();
    warehouseAPI.previewGroupMove(currentShelfId, {
      target_shelf_id: selectedShelfId,
      sample_ids: samples.map(s => s.id),
    }, { signal: controller.signal })
      .then(res => {
        if (!controller.signal.aborted) setGroupPreviewData(res.data);
      })
      .catch(err => {
        if (err.name === 'AbortError' || err.name === 'CanceledError') return;
        console.error('Error loading group preview compatibility:', err);
      });
    return () => controller.abort();
  }, [selectedShelfId, currentShelfId, samples]);

  const previewCompatibilityMap = useMemo(() => {
    const map = new Map();
    if (groupPreviewData?.cells) {
      groupPreviewData.cells.forEach(c => {
        map.set(`${c.x},${c.y},${c.z}`, c.compatible);
      });
    }
    return map;
  }, [groupPreviewData]);

  // Dimensiones de muestra
  const sampleW = samples[0]?.width || 1;
  const sampleH = samples[0]?.height || 1;
  const sampleD = samples[0]?.depth || 1;
  const sampleGHS = samples[0]?.ghs_danger_class || 'Sin Riesgo';
  const ghsColor = getSGAColor(sampleGHS);

  // Cargar mapa al seleccionar anaquel
  useEffect(() => {
    if (!selectedShelfId) { setTargetMapData(null); setAssignedCells([]); return; }
    const controller = new AbortController();
    setLoadingShelfData(true);
    setShelfError(null);
    setAssignedCells([]);
    setSelectedLevelY(null);

    warehouseAPI.getShelfMap(selectedShelfId, { signal: controller.signal })
      .then(res => {
        if (!controller.signal.aborted) setTargetMapData(res.data);
      })
      .catch(err => {
        if (err.name === 'AbortError' || err.name === 'CanceledError') return;
        console.error('Error loading shelf map:', err);
        setShelfError('No se pudo cargar el entorno 3D del anaquel seleccionado');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingShelfData(false);
      });
    return () => controller.abort();
  }, [selectedShelfId]);

  const gridWidth  = targetMapData?.shelf?.grid_width  || 10;
  const gridHeight = targetMapData?.shelf?.grid_height || 10;
  const shelfDepth = targetMapData?.shelf?.shelf_depth || 10;

  const targetShelfName = compatibleShelves.find(s => s.id === selectedShelfId)?.name || 'Anaquel Destino';

  const externalSamples = useMemo(() => {
    if (!targetMapData) return [];
    return targetMapData.samples.filter(s =>
      s.status === 'stored' &&
      s.position_x !== null && s.position_y !== null && s.position_z !== null &&
      !samples.some(ms => ms.id === s.id)
    );
  }, [targetMapData, samples]);

  const occupiedSet = useMemo(() => {
    const s = new Set();
    externalSamples.forEach(sample => {
      const sw = sample.width || 1;
      const sh = sample.height || 1;
      const sd = sample.depth || 1;
      for (let dx = 0; dx < sw; dx++)
        for (let dy = 0; dy < sh; dy++)
          for (let dz = 0; dz < sd; dz++)
            s.add(`${sample.position_x + dx},${sample.position_y + dy},${sample.position_z + dz}`);
    });
    return s;
  }, [externalSamples]);

  const availableCells = useMemo(() => {
    if (!targetMapData) return [];
    const cells = [];
    for (let y = 0; y <= gridHeight - sampleH; y++) {
      for (let z = 0; z <= shelfDepth - sampleD; z++) {
        for (let x = 0; x <= gridWidth - sampleW; x++) {
          let isOccupied = false;
          outer:
          for (let dx = 0; dx < sampleW; dx++)
            for (let dy = 0; dy < sampleH; dy++)
              for (let dz = 0; dz < sampleD; dz++)
                if (occupiedSet.has(`${x + dx},${y + dy},${z + dz}`)) { isOccupied = true; break outer; }
          if (!isOccupied) cells.push({ x, y, z });
        }
      }
    }
    return cells;
  }, [targetMapData, occupiedSet, gridWidth, gridHeight, shelfDepth, sampleW, sampleH, sampleD]);

  const freeByLevel = useMemo(() => {
    const counts = {};
    availableCells.forEach(c => { counts[c.y] = (counts[c.y] || 0) + 1; });
    return counts;
  }, [availableCells]);

  const assignedByLevel = useMemo(() => {
    const counts = {};
    assignedCells.forEach(c => { counts[c.y] = (counts[c.y] || 0) + 1; });
    return counts;
  }, [assignedCells]);

  const checkAABBOverlap = (newCell) => {
    for (const cell of assignedCells) {
      if (
        newCell.x < cell.x + sampleW && newCell.x + sampleW > cell.x &&
        newCell.y < cell.y + sampleH && newCell.y + sampleH > cell.y &&
        newCell.z < cell.z + sampleD && newCell.z + sampleD > cell.z
      ) return true;
    }
    return false;
  };

  const handleCellClick = (pos) => {
    const index = assignedCells.findIndex(c => c.x === pos.x && c.y === pos.y && c.z === pos.z);
    if (index !== -1) {
      const copy = [...assignedCells];
      copy.splice(index, 1);
      setAssignedCells(copy);
      return;
    }
    if (assignedCells.length >= samples.length) return;
    if (checkAABBOverlap(pos)) return;
    setAssignedCells([...assignedCells, pos]);
  };

  const handleConfirm = async () => {
    if (assignedCells.length !== samples.length) return;
    setIsExecuting(true);
    setError(null);

    const sampleMoves = samples.map((sample, idx) => ({
      sample_id: sample.id,
      new_position_x: assignedCells[idx].x,
      new_position_y: assignedCells[idx].y,
      new_position_z: assignedCells[idx].z,
    }));

    try {
      await warehouseAPI.moveGroup(currentShelfId, {
        target_shelf_id: selectedShelfId,
        moves: sampleMoves,
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error committing group move:', err);
      setError(err.response?.data?.message || err.message || 'Error inesperado al mover');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div
      data-testid="replica-modal"
      style={{
        position: 'fixed', inset: 0,
        background: '#0a0d14',
        display: 'flex', flexDirection: 'column',
        zIndex: BACKDROP.Z_INDEX + 10,
        animation: ANIM.FADE_IN,
      }}
    >
      {/* ════ HEADER ════ */}
      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'linear-gradient(180deg, rgba(22,28,45,1) 0%, rgba(15,20,35,1) 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
        boxShadow: '0 1px 0 rgba(255,255,255,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {step !== 'aisle' && (
            <button
              onClick={() => {
                setStep('aisle');
                setSelectedShelfId(null);
                setSelectedLevelY(null);
                setAssignedCells([]);
              }}
              style={{
                ...BUTTON.GHOST,
                padding: '6px 10px',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              <ArrowLeftIcon style={{ width: 13, height: 13 }} /> Volver
            </button>
          )}
          <div>
            {/* Breadcrumb de pasos */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              {/* Paso 1 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%',
                  background: step === 'aisle' ? '#3b82f6' : '#10b981',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8, fontWeight: 900, color: '#fff',
                  boxShadow: step === 'aisle' ? '0 0 8px rgba(59,130,246,0.6)' : '0 0 6px rgba(16,185,129,0.4)',
                }}>
                  {step !== 'aisle' ? '✓' : '1'}
                </div>
                <span style={{ fontSize: 8, fontWeight: 700, color: step === 'aisle' ? '#93c5fd' : '#6ee7b7' }}>
                  Pasillo
                </span>
              </div>
              <div style={{ width: 14, height: 1, background: step !== 'aisle' ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)' }} />
              {/* Paso 2 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%',
                  background: step === 'shelf' ? '#eab308' : '#1e293b',
                  border: step === 'shelf' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8, fontWeight: 900, color: step === 'shelf' ? '#fff' : '#475569',
                  boxShadow: step === 'shelf' ? '0 0 8px rgba(234,179,8,0.5)' : 'none',
                }}>
                  2
                </div>
                <span style={{ fontSize: 8, fontWeight: 700, color: step === 'shelf' ? '#fde68a' : '#475569' }}>
                  Nivel y Celda
                </span>
              </div>
              {/* Indicador SGA */}
              <div style={{ marginLeft: 6 }}>
                <span style={{
                  padding: '2px 7px', borderRadius: 20,
                  fontSize: 8, fontWeight: 900, letterSpacing: 0.4,
                  background: `${ghsColor}15`,
                  border: `1px solid ${ghsColor}30`,
                  color: ghsColor,
                }}>
                  {sampleGHS}
                </span>
              </div>
            </div>
            <h2 style={{ fontSize: 14, fontWeight: 900, color: '#f8fafc', margin: 0, letterSpacing: 0.3 }}>
              {step === 'aisle' ? 'REUBICACIÓN 3D' : `REUBICACIÓN 3D — ${(targetMapData?.shelf?.market_line_name || '').toUpperCase()}`}
            </h2>
            <p style={{ fontSize: 9, color: '#64748b', margin: '2px 0 0', fontWeight: 700 }}>
              {step === 'aisle' && 'Paso 1 · Haz clic en el anaquel destino'}
              {step === 'shelf' && selectedLevelY === null && `${targetShelfName} · Selecciona un nivel del anaquel`}
              {step === 'shelf' && selectedLevelY !== null && `${targetShelfName} · Nivel ${selectedLevelY + 1} · Haz clic en las celdas verdes de cualquier nivel`}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#9ca3af', cursor: 'pointer', padding: 7,
            borderRadius: RADIUS.MD, transition: 'all 0.2s',
            display: 'flex', alignItems: 'center',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#e5e7eb'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
        >
          <XMarkIcon style={{ width: 20, height: 20 }} />
        </button>
      </div>

      {/* ════ BODY ════ */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>

        {/* ── COLUMNA IZQUIERDA: Checklist ── */}
        <div style={{
          width: 280, borderRight: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(12,16,30,0.98)',
          display: 'flex', flexDirection: 'column',
          padding: 14, boxSizing: 'border-box', flexShrink: 0,
        }}>
          <div style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 8, fontWeight: 800, color: '#64748b', letterSpacing: 0.5, textTransform: 'uppercase' }}>
              Muestras a Reubicar
            </span>
            <h3 style={{ fontSize: 13, fontWeight: 900, color: '#fff', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 5 }}>
              <CubeIcon style={{ width: 15, height: 15, color: ghsColor }} />
              {samples.length} Muestras
            </h3>
            <div style={{
              display: 'inline-flex', marginTop: 5, padding: '2px 8px', borderRadius: 4,
              background: `${ghsColor}15`, border: `1px solid ${ghsColor}30`,
              fontSize: 9, fontWeight: 800, color: ghsColor,
            }}>
              SGA: {sampleGHS}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5, paddingRight: 2 }}>
            {samples.map((s, idx) => {
              const assignment = assignedCells[idx];
              const isAssigned = !!assignment;
              return (
                <div key={s.id} style={{
                  background: isAssigned ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isAssigned ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: RADIUS.LG, padding: 9,
                  display: 'flex', flexDirection: 'column', gap: 4,
                  transition: 'all 0.25s',
                  boxShadow: isAssigned ? '0 0 10px rgba(16,185,129,0.07)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 6 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 800, color: '#f1f5f9',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160,
                    }}>
                      {s.global_sample_name || s.name}
                    </span>
                    <span style={{
                      width: 18, height: 18, borderRadius: '50%',
                      background: isAssigned ? '#10b981' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isAssigned ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 8, fontWeight: 900, flexShrink: 0,
                    }}>
                      {isAssigned ? <CheckIcon style={{ width: 10, height: 10 }} /> : idx + 1}
                    </span>
                  </div>
                  <div style={{ fontSize: 8, display: 'flex', gap: 4 }}>
                    <span style={{ color: '#475569', fontWeight: 600 }}>Origen:</span>
                    <span style={{ color: '#64748b' }}>Niv {(s.position_y ?? 0) + 1} · ({s.position_x}, {s.position_z})</span>
                  </div>
                  <div style={{
                    fontSize: 8, display: 'flex', gap: 4, padding: '3px 6px', borderRadius: 4,
                    background: isAssigned ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.05)',
                    color: isAssigned ? '#34d399' : '#f87171', fontWeight: 700,
                  }}>
                    <span>Destino:</span>
                    {isAssigned
                      ? <span>Niv {assignment.y + 1} · ({assignment.x}, {assignment.z})</span>
                      : <span>🔴 Sin asignar</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Panel inferior */}
          <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700 }}>Asignados:</span>
              <span style={{ fontSize: 12, fontWeight: 900, color: assignedCells.length === samples.length ? '#10b981' : '#facc15' }}>
                {assignedCells.length} / {samples.length}
              </span>
            </div>

            {/* Barra de progreso */}
            <div style={{ height: 3, background: 'rgba(255,255,255,0.04)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${samples.length > 0 ? (assignedCells.length / samples.length) * 100 : 0}%`,
                background: assignedCells.length === samples.length ? '#10b981' : '#facc15',
                boxShadow: `0 0 8px ${assignedCells.length === samples.length ? '#10b981' : '#facc15'}70`,
                transition: 'all 0.3s ease',
              }} />
            </div>

            {assignedCells.length < samples.length && step === 'shelf' && selectedLevelY !== null && (
              <div style={{
                display: 'flex', gap: 5,
                background: 'rgba(250,204,21,0.05)',
                border: '1px solid rgba(250,204,21,0.12)',
                borderRadius: RADIUS.LG, padding: '6px 9px',
              }}>
                <ExclamationTriangleIcon style={{ width: 13, height: 13, color: '#fbbf24', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 8, color: '#fbbf24', fontWeight: 600, lineHeight: 1.3 }}>
                  Haz clic en {samples.length - assignedCells.length} celda(s) verde(s) para completar la asignación.
                </span>
              </div>
            )}

            {step === 'shelf' && selectedLevelY === null && (
              <div style={{
                display: 'flex', gap: 5,
                background: 'rgba(56,189,248,0.05)',
                border: '1px solid rgba(56,189,248,0.12)',
                borderRadius: RADIUS.LG, padding: '6px 9px',
              }}>
                <span style={{ fontSize: 8, color: '#38bdf8', fontWeight: 600, lineHeight: 1.3 }}>
                  💡 Selecciona un nivel del anaquel para ver los espacios libres.
                </span>
              </div>
            )}

            {step === 'aisle' && (
              <div style={{
                display: 'flex', gap: 5,
                background: 'rgba(56,189,248,0.05)',
                border: '1px solid rgba(56,189,248,0.12)',
                borderRadius: RADIUS.LG, padding: '6px 9px',
              }}>
                <span style={{ fontSize: 8, color: '#38bdf8', fontWeight: 600, lineHeight: 1.3 }}>
                  💡 Haz clic en un anaquel del pasillo para comenzar.
                </span>
              </div>
            )}

            {error && (
              <div style={{
                display: 'flex', gap: 5,
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: RADIUS.LG, padding: '6px 9px',
              }}>
                <ExclamationTriangleIcon style={{ width: 13, height: 13, color: '#f87171', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 8, color: '#f87171', fontWeight: 600, lineHeight: 1.3 }}>{error}</span>
              </div>
            )}

            <button
              onClick={handleConfirm}
              disabled={assignedCells.length !== samples.length || loadingShelfData || isExecuting}
              style={{
                width: '100%',
                background: assignedCells.length === samples.length && !isExecuting ? BUTTON.PRIMARY_GREEN.GRADIENT : BUTTON.DISABLED.BG,
                border: assignedCells.length === samples.length && !isExecuting ? BUTTON.PRIMARY_GREEN.BORDER : 'none',
                color: assignedCells.length === samples.length && !isExecuting ? BUTTON.PRIMARY_GREEN.COLOR : BUTTON.DISABLED.COLOR,
                boxShadow: assignedCells.length === samples.length && !isExecuting ? BUTTON.PRIMARY_GREEN.SHADOW : 'none',
                padding: '10px', borderRadius: RADIUS.MD,
                fontSize: 10, fontWeight: 800,
                cursor: assignedCells.length === samples.length && !isExecuting ? 'pointer' : 'not-allowed',
                letterSpacing: 0.5, textTransform: 'uppercase', transition: 'all 0.2s',
              }}
            >
              {isExecuting ? 'Procesando...' : 'Confirmar Reubicación'}
            </button>
          </div>
        </div>

        {/* ── ÁREA CENTRAL: Canvas 3D ── */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>

          {/* Overlay de carga */}
          {loadingShelfData && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(4,6,12,0.90)',
              zIndex: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
            }}>
              <div className="animate-spin" style={{ width: 30, height: 30, border: '3px solid rgba(255,255,255,0.05)', borderTopColor: '#0ea5e9', borderRadius: '50%' }} />
              <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: 0.5 }}>Cargando mapa del anaquel...</span>
            </div>
          )}

          {/* Error de carga */}
          {shelfError && (
            <div style={{
              position: 'absolute', inset: 0, background: '#04060c', zIndex: 40,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24,
            }}>
              <ExclamationTriangleIcon style={{ width: 36, height: 36, color: '#ef4444' }} />
              <p style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 700, margin: 0 }}>{shelfError}</p>
              <button
                onClick={() => { setSelectedShelfId(null); setShelfError(null); }}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: RADIUS.MD, color: '#fff', padding: '7px 14px', cursor: 'pointer', fontSize: 10, fontWeight: 700 }}
              >
                Volver a la selección
              </button>
            </div>
          )}

          {/* Canvas 3D (Vista Pasillo) o Paneles Side-by-Side (Vista Anaquel) */}
          <div style={{ flex: 1, position: 'relative', display: 'flex', minHeight: 0 }}>
            {step === 'aisle' ? (
              <div style={{ flex: 1, position: 'relative' }}>
                <Canvas camera={{ position: [0, 2.5, 20], fov: 48 }} gl={{ alpha: true, antialias: true }}>
                  <ambientLight intensity={0.5} />
                  <directionalLight position={[10, 20, 15]} intensity={1.8} castShadow />
                  <directionalLight position={[-15, 10, -10]} intensity={0.9} color="#3b82f6" />
                  <pointLight position={[0, 8, 0]} intensity={0.6} color="#0ea5e9" />

                  <OrbitControls
                    makeDefault
                    enablePan={true}
                    enableZoom={true}
                    minDistance={3}
                    maxDistance={80}
                    target={[0, 2, 0]}
                  />

                  <group>
                    {compatibleShelves.map((shelf, index) => {
                      const spacingX = 5.2;
                      const totalWidth = (compatibleShelves.length - 1) * spacingX;
                      const px = -totalWidth / 2 + index * spacingX;
                      return (
                        <AisleShelfMesh
                          key={shelf.id}
                          shelf={shelf}
                          position={[px, 1.2, 0]}
                          index={index}
                          isHovered={hoveredShelfId === shelf.id}
                          onHover={setHoveredShelfId}
                          onClick={(id) => {
                            setSelectedShelfId(id);
                            setStep('shelf');
                          }}
                        />
                      );
                    })}
                    <ContactShadows position={[0, -0.01, 0]} opacity={0.6} scale={28} blur={2.0} far={6} />
                  </group>
                </Canvas>

                {/* HUD superior izquierdo para Vista Pasillo */}
                <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 30, pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: SURFACE.BAR, backdropFilter: BLUR.SM, padding: '4px 10px', borderRadius: RADIUS.PILL, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 8px #3b82f6' }} />
                    <span style={{ fontSize: 8, color: '#e2e8f0', fontWeight: 800, letterSpacing: 0.4 }}>
                      VISTA PASILLO · {compatibleShelves.length} ANAQUELES COMPATIBLES
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.04)', marginTop: 2 }}>
                    <span style={{ fontSize: 7, color: '#475569', fontWeight: 600 }}>
                      🖱 Arrastrar: rotar · Scroll: zoom · Clic der: desplazar
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              // Vista de Anaquel Seleccionado: Paneles Side-by-Side
              <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
                <div style={{ flex: 1, display: 'flex', gap: 16, padding: '16px 8px 16px 16px', boxSizing: 'border-box', minWidth: 0 }}>
                  
                  {/* ── PANEL IZQUIERDO: Estantería Completa ── */}
                  <div style={{
                    width: '40%',
                    borderRadius: 16,
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    background: 'radial-gradient(ellipse at 60% 20%, #0d1929 0%, #000000 100%)',
                    boxShadow: '0 4px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    {/* HUD superior izquierdo */}
                    <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 30, pointerEvents: 'none', display: 'flex', alignItems: 'start', gap: 6 }}>
                      <div style={{ width: 3, minHeight: 32, borderRadius: 99, background: 'linear-gradient(to bottom, #3b82f6, #38bdf8)', boxShadow: '0 0 8px rgba(56,189,248,0.5)', flexShrink: 0 }} />
                      <div>
                        <span style={{ fontSize: 7, fontWeight: 900, color: '#38bdf8', letterSpacing: 1, textTransform: 'uppercase' }}>
                          Navegador Global
                        </span>
                        <h4 style={{ fontSize: 11, fontWeight: 900, color: '#fff', margin: '2px 0 0', textTransform: 'uppercase' }}>
                          Estantería Completa
                        </h4>
                      </div>
                    </div>

                    <div style={{ flex: 1, position: 'relative' }}>
                      <Canvas
                        key={`shelf-left-${selectedShelfId}`}
                        camera={{
                          fov: 50,
                          position: [
                            gridWidth * 1.5,
                            gridHeight * LEVEL_HEIGHT * 0.45,
                            gridWidth * 0.9 + shelfDepth + 8,
                          ],
                        }}
                        gl={{ alpha: true, antialias: true }}
                      >
                        <ambientLight intensity={0.45} />
                        <directionalLight position={[8, 16, 10]} intensity={1.8} color="#ffffff" castShadow />
                        <directionalLight position={[-6, 8, -6]} intensity={0.4} color="#38bdf8" />
                        <pointLight position={[0, gridHeight + 2, 0]} intensity={0.5} color="#0ea5e9" distance={gridHeight * 4} />

                        <OrbitControls makeDefault enablePan enableZoom enableRotate minDistance={2} maxDistance={80} />

                        {/* Estructura metálica del estante */}
                        <ShelfStructure totalCols={gridWidth} totalDepth={shelfDepth} totalLevels={gridHeight} />

                        <group position={[0, -(gridHeight * LEVEL_HEIGHT) / 2 + 0.5, 0]}>
                          {/* Planos de nivel interactivos */}
                          {Array.from({ length: gridHeight }).map((_, i) => (
                            <LevelPlane
                              key={`lp-${i}`}
                              yIndex={i}
                              totalCols={gridWidth}
                              totalDepth={shelfDepth}
                              isSelected={selectedLevelY === i}
                              onClick={(y) => setSelectedLevelY(y)}
                            />
                          ))}

                          {/* Cubos de muestras atenuados/coloreados */}
                          {externalSamples.map(sample => {
                            const w = sample.width || 1;
                            const d = sample.depth || 1;
                            const px = -gridWidth / 2 + sample.position_x + w / 2;
                            const py = sample.position_y * LEVEL_HEIGHT + 0.4;
                            const pz = -shelfDepth / 2 + (sample.position_z || 0) + d / 2;
                            const isLevelSelected = selectedLevelY !== null;
                            const isCurrentLevel = selectedLevelY === sample.position_y;

                            const col = getColorByName(sample.global_sample_name || sample.name);
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
                                <mesh onClick={(e) => { e.stopPropagation(); setSelectedLevelY(sample.position_y); }}>
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
                    </div>
                  </div>

                  {/* ── PANEL DERECHO: Vista de Nivel ── */}
                  <div style={{
                    flex: 1,
                    borderRadius: 16,
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    background: 'radial-gradient(ellipse at 30% 80%, #090d1c 0%, #000000 100%)',
                    boxShadow: '0 4px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    
                    {/* HUD superior izquierdo */}
                    {selectedLevelY !== null && (
                      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 30, pointerEvents: 'none', display: 'flex', alignItems: 'start', gap: 6 }}>
                        <div style={{ width: 3, minHeight: 32, borderRadius: 99, background: 'linear-gradient(to bottom, #10b981, #34d399)', boxShadow: '0 0 8px rgba(52,211,153,0.5)', flexShrink: 0 }} />
                        <div>
                          <span style={{ fontSize: 7, fontWeight: 900, color: '#34d399', letterSpacing: 1, textTransform: 'uppercase' }}>
                            Vista de Nivel
                          </span>
                          <h4 style={{ fontSize: 11, fontWeight: 900, color: '#fff', margin: '2px 0 0', textTransform: 'uppercase' }}>
                            Nivel {selectedLevelY + 1}
                          </h4>
                        </div>
                      </div>
                    )}

                    {/* Leyenda inferior */}
                    {selectedLevelY !== null && (
                      <div style={{
                        position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
                        background: 'rgba(9, 13, 22, 0.65)', backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 20,
                        padding: '5px 14px', display: 'flex', gap: 12, zIndex: 30,
                        fontSize: 8, fontWeight: 700, color: '#94a3b8', whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(16,185,129,0.3)', border: '1px solid #10b981' }} />
                          <span>Disponible</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: ghsColor, boxShadow: `0 0 6px ${ghsColor}` }} />
                          <span>Asignado</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: '#ef4444', border: '1px solid #ef4444' }} />
                          <span>Ocupado / No Disponible</span>
                        </div>
                      </div>
                    )}

                    {selectedLevelY === null ? (
                      <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(9, 13, 22, 0.4)',
                        backdropFilter: 'blur(10px)',
                        zIndex: 25,
                      }}>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>🎯</div>
                        <p style={{ color: '#94a3b8', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, margin: 0 }}>
                          Seleccionar Nivel Destino
                        </p>
                        <p style={{ color: '#475569', fontSize: 8, fontWeight: 500, letterSpacing: 0.5, marginTop: 4 }}>
                          Elige un nivel en el panel derecho o haz clic en la estantería 3D
                        </p>
                      </div>
                    ) : (
                      <div style={{ flex: 1, position: 'relative' }}>
                        <Canvas
                          key={`shelf-right-${selectedShelfId}-${selectedLevelY}`}
                          camera={{
                            fov: 42,
                            position: [10, 7, 10],
                          }}
                          gl={{ alpha: true, antialias: true }}
                        >
                          <ambientLight intensity={0.55} />
                          <directionalLight position={[8, 14, 8]} intensity={1.6} color="#ffffff" />
                          <directionalLight position={[-6, 6, -8]} intensity={0.45} color="#38bdf8" />
                          <pointLight position={[0, 6, 0]} intensity={0.35} color="#0ea5e9" distance={30} />

                          <OrbitControls
                            makeDefault
                            enablePan enableZoom enableRotate
                            minDistance={2} maxDistance={60}
                            minPolarAngle={Math.PI / 8}
                            maxPolarAngle={Math.PI / 2.1}
                          />

                          <group position={[0, -0.5, 0]}>
                            {/* Piso detallado del nivel */}
                            <FloorPanel totalCols={gridWidth} totalDepth={shelfDepth} />

                            {/* Muestras existentes en el nivel (rojo sólido) */}
                            {externalSamples.filter(s => s.position_y === selectedLevelY).map(sample => {
                              const w = sample.width || 1;
                              const d = sample.depth || 1;
                              const px = -gridWidth / 2 + sample.position_x + w / 2;
                              const pz = -shelfDepth / 2 + (sample.position_z || 0) + d / 2;

                              return (
                                <group key={`occ-${sample.id}`} position={[px, 0.4, pz]}>
                                  <mesh castShadow>
                                    <boxGeometry args={[w - 0.08, LEVEL_HEIGHT - 0.2, d - 0.08]} />
                                    <meshStandardMaterial
                                      color="#ef4444"
                                      metalness={0.4}
                                      roughness={0.3}
                                      emissive="#ef4444"
                                      emissiveIntensity={0.25}
                                    />
                                  </mesh>
                                  <Edges color="#b91c1c" transparent opacity={0.6} />
                                </group>
                              );
                            })}

                            {/* Celdas libres y asignadas */}
                            {availableCells
                              .filter(c => c.y === selectedLevelY)
                              .map(c => {
                                const { x, z } = c;
                                const isAssigned = assignedCells.some(a => a.x === x && a.y === selectedLevelY && a.z === z);
                                const assignIdx = assignedCells.findIndex(a => a.x === x && a.y === selectedLevelY && a.z === z);
                                const isCompatible = previewCompatibilityMap.size === 0 || previewCompatibilityMap.get(`${x},${selectedLevelY},${z}`) !== false;

                                const px = -gridWidth / 2 + x + sampleW / 2;
                                const pz = -shelfDepth / 2 + z + sampleD / 2;
                                const cellH = LEVEL_HEIGHT - 0.18;
                                const canSelect = !isAssigned && isCompatible && assignedCells.length < samples.length;

                                const cellColor = isAssigned
                                  ? '#0ea5e9'
                                  : isCompatible
                                    ? '#10b981'
                                    : '#ef4444';

                                return (
                                  <group key={`cell-${x}-${z}`} position={[px, 0.4, pz]}>
                                    <mesh
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (isCompatible) {
                                          handleCellClick({ x, y: selectedLevelY, z });
                                        }
                                      }}
                                      onPointerOver={(e) => {
                                        e.stopPropagation();
                                        if (canSelect || isAssigned) {
                                          document.body.style.cursor = 'pointer';
                                        } else if (!isCompatible) {
                                          document.body.style.cursor = 'not-allowed';
                                        }
                                      }}
                                      onPointerOut={() => {
                                        document.body.style.cursor = 'default';
                                      }}
                                    >
                                      <boxGeometry args={[sampleW - 0.1, cellH, sampleD - 0.1]} />
                                      <meshPhysicalMaterial
                                        color={cellColor}
                                        transparent
                                        opacity={isAssigned ? 0.85 : isCompatible ? 0.28 : 0.4}
                                        emissive={cellColor}
                                        emissiveIntensity={isAssigned ? 0.7 : isCompatible ? 0.25 : 0.8}
                                        roughness={0.1}
                                        metalness={0.6}
                                        clearcoat={isAssigned ? 1.0 : 0}
                                        depthWrite={false}
                                      />
                                    </mesh>

                                    <mesh>
                                      <boxGeometry args={[sampleW - 0.1, cellH, sampleD - 0.1]} />
                                      <Edges
                                        color={isAssigned ? '#ffffff' : isCompatible ? '#10b981' : '#ef4444'}
                                        transparent
                                        opacity={isAssigned ? 0.7 : isCompatible ? 0.5 : 0.8}
                                      />
                                    </mesh>

                                    {isAssigned && (
                                      <Html position={[0, cellH / 2 + 0.12, 0]} center style={{ pointerEvents: 'none' }}>
                                        <div style={{
                                          background: '#0ea5e9', color: '#fff',
                                          width: 18, height: 18, borderRadius: '50%',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          fontSize: 9, fontWeight: 900,
                                          boxShadow: '0 0 10px rgba(14,165,233,0.9)',
                                          border: '1.5px solid #fff',
                                        }}>#{assignIdx + 1}</div>
                                      </Html>
                                    )}
                                  </group>
                                );
                              })}
                          </group>
                        </Canvas>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Panel lateral de niveles (HTML, fuera del Canvas) ── */}
                {step === 'shelf' && targetMapData && (
                  <LevelSidePanel
                    gridHeight={gridHeight}
                    selectedLevelY={selectedLevelY}
                    onSelectLevel={(y) => setSelectedLevelY(y)}
                    freeByLevel={freeByLevel}
                    assignedByLevel={assignedByLevel}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

ReplicaWarehouseModal.propTypes = {
  samples: PropTypes.array,
  currentShelfId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  compatibleShelves: PropTypes.array,
  onClose: PropTypes.func,
  onSuccess: PropTypes.func,
};

export default ReplicaWarehouseModal;
