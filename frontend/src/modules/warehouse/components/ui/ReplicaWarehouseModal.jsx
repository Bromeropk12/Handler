import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, ContactShadows, Edges } from '@react-three/drei';
import * as THREE from 'three';
import {
  ArrowLeftIcon, XMarkIcon, CheckIcon, CubeIcon, ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { warehouseAPI } from '../../../../services/api';
import {
  BACKDROP, BLUR, RADIUS, BUTTON, FONT, ANIM, SHADOW
} from '../../constants';
import { LEVEL_HEIGHT, getSGAColor } from '../3d/Shared3DComponents';

// ─── Componentes 3D Auxiliares ──────────────────────────────────────────────────

// CameraController: anima suavemente la cámara entre pasos
const CameraController = ({ step, gridWidth, gridHeight, shelfDepth }) => {
  const { camera, controls } = useThree();
  const animating = useRef(false);
  const targetPos = useRef(new THREE.Vector3(0, 10, 25));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (step === 'aisle') {
      targetPos.current.set(0, 9, 24);
      targetLook.current.set(0, 1.5, 0);
    } else if (step === 'shelf') {
      const h = (gridHeight || 6) * LEVEL_HEIGHT;
      const w = (gridWidth || 10) * 1.2;
      const d = (shelfDepth || 10) * 1.4;
      targetPos.current.set(w * 0.5, h * 0.7 + 2, d + 6);
      targetLook.current.set(0, h / 2 - 0.5, 0);
    } else if (step === 'level') {
      const w = (gridWidth || 10);
      const d = (shelfDepth || 10);
      targetPos.current.set(w * 0.3, 8, d * 1.5 + 4);
      targetLook.current.set(0, 0, 0);
    }
    animating.current = true;
  }, [step, gridWidth, gridHeight, shelfDepth]);

  useFrame(() => {
    if (!animating.current || !controls) return;
    const dist = camera.position.distanceTo(targetPos.current);
    if (dist < 0.15) {
      animating.current = false;
      controls.target.copy(targetLook.current);
      controls.update();
      return;
    }
    camera.position.lerp(targetPos.current, 0.07);
    controls.target.lerp(targetLook.current, 0.07);
    controls.update();
  });

  return null;
};

// Bloque de anaquel en la vista de pasillo
const AisleShelfMesh = ({ shelf, position, index, isHovered, onHover, onClick }) => {
  const meshRef = useRef();

  useFrame((state) => {
    if (!meshRef.current) return;
    const targetScale = isHovered ? 1.06 : 1;
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
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
        {/* Cuerpo metálico */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[bW, bH, bD]} />
          <meshPhysicalMaterial color="#cbd5e1" metalness={0.9} roughness={0.15} clearcoat={0.6} clearcoatRoughness={0.1} />
        </mesh>
        {/* Frente oscuro */}
        <mesh position={[0, 0, bD / 2 + 0.01]}>
          <planeGeometry args={[bW - 0.25, bH - 0.25]} />
          <meshPhysicalMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* LED de ocupación */}
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

// Estructura metálica del anaquel (vigas y postes)
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
      {Array.from({ length: totalLevels + 1 }).map((_, i) => (
        <mesh key={`shelf-${i}`} position={[0, i * LEVEL_HEIGHT - 0.04, 0]}>
          <boxGeometry args={[totalCols + 0.35, 0.04, totalDepth + 0.35]} />
          <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.15} transparent opacity={0.7} />
          <Edges color="#1e3a5f" transparent opacity={0.5} />
        </mesh>
      ))}
      {posts.map(([px, pz], i) => (
        <mesh key={`post-${i}`} position={[px, postH / 2 - 0.5, pz]}>
          <boxGeometry args={[0.1, postH, 0.1]} />
          <meshStandardMaterial color="#020617" metalness={0.95} roughness={0.05} />
          <Edges color="#0ea5e9" transparent opacity={0.5} />
        </mesh>
      ))}
      <mesh position={[0, -0.06, 0]}>
        <boxGeometry args={[totalCols + 0.8, 0.04, totalDepth + 0.8]} />
        <meshStandardMaterial color="#020617" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
};

// Plano de nivel interactivo
const LevelPlaneMesh = ({ yIndex, totalCols, totalDepth, isSelected, isHovered, onHover, onClick, assignedCount, freeCount }) => {
  const active = isSelected || isHovered;

  return (
    <group position={[0, yIndex * LEVEL_HEIGHT + 0.48, 0]}>
      <mesh
        onPointerOver={(e) => { e.stopPropagation(); onHover(yIndex); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { onHover(null); document.body.style.cursor = 'default'; }}
        onClick={(e) => { e.stopPropagation(); onClick(yIndex); }}
      >
        <boxGeometry args={[totalCols + 0.3, 0.06, totalDepth + 0.3]} />
        <meshStandardMaterial
          color={isSelected ? '#10b981' : '#3b82f6'}
          transparent
          opacity={isSelected ? 0.22 : isHovered ? 0.14 : 0.03}
          emissive={isSelected ? '#10b981' : '#3b82f6'}
          emissiveIntensity={isSelected ? 0.5 : isHovered ? 0.3 : 0}
          depthWrite={false}
        />
      </mesh>

      {/* Halo frontal */}
      {active && (
        <mesh position={[0, 0.03, -(totalDepth / 2 + 0.16)]}>
          <boxGeometry args={[totalCols + 0.38, 0.02, 0.05]} />
          <meshStandardMaterial
            color={isSelected ? '#10b981' : '#3b82f6'}
            emissive={isSelected ? '#10b981' : '#3b82f6'}
            emissiveIntensity={2}
            transparent opacity={0.95}
          />
        </mesh>
      )}

      <Html position={[totalCols / 2 + 1.2, 0.1, 0]} center style={{ pointerEvents: 'none' }}>
        <div style={{
          background: isSelected ? 'rgba(16,185,129,0.9)' : 'rgba(15,23,42,0.85)',
          border: `1px solid ${isSelected ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.06)'}`,
          color: isSelected ? '#ffffff' : '#94a3b8',
          fontSize: 9, fontWeight: 900,
          padding: '2px 8px', borderRadius: 12,
          whiteSpace: 'nowrap', display: 'flex', gap: 6,
          boxShadow: SHADOW.TOOLTIP,
        }}>
          <span>NIVEL {yIndex + 1}</span>
          <span style={{ color: isSelected ? '#ffffff' : '#38bdf8' }}>
            {assignedCount > 0 ? `🎯 ${assignedCount} asign.` : `${freeCount} libres`}
          </span>
        </div>
      </Html>
    </group>
  );
};

// Líneas de cuadrícula
const GridLines = ({ cols, depth }) => {
  const lines = [];
  const hC = cols / 2, hD = depth / 2;
  for (let i = 0; i <= cols; i++) {
    lines.push(
      <line key={`gx-${i}`} position={[i - hC, 0.01, 0]}>
        <bufferGeometry><float32BufferAttribute attach="attributes-position" args={[new Float32Array([0,0,-hD,0,0,hD]),3]}/></bufferGeometry>
        <lineBasicMaterial color="#1e293b" transparent opacity={0.9} />
      </line>
    );
  }
  for (let i = 0; i <= depth; i++) {
    lines.push(
      <line key={`gz-${i}`} position={[0, 0.01, i - hD]}>
        <bufferGeometry><float32BufferAttribute attach="attributes-position" args={[new Float32Array([-hC,0,0,hC,0,0]),3]}/></bufferGeometry>
        <lineBasicMaterial color="#1e293b" transparent opacity={0.9} />
      </line>
    );
  }
  return <group>{lines}</group>;
};

// ─── Componente Principal ───────────────────────────────────────────────────────

export const ReplicaWarehouseModal = ({
  samples = [],
  currentShelfId,
  compatibleShelves = [],
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState('aisle'); // 'aisle' | 'shelf' | 'level'
  const [selectedShelfId, setSelectedShelfId] = useState(null);
  const [selectedLevelY, setSelectedLevelY] = useState(null);

  const [targetMapData, setTargetMapData] = useState(null);
  const [loadingShelfData, setLoadingShelfData] = useState(false);
  const [shelfError, setShelfError] = useState(null);

  // Celdas asignadas: [{ x, y, z }]
  const [assignedCells, setAssignedCells] = useState([]);

  const [hoveredShelfId, setHoveredShelfId] = useState(null);
  const [hoveredLevelY, setHoveredLevelY] = useState(null);

  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState(null);

  // Dimensiones de las muestras
  const sampleW = samples[0]?.width || 1;
  const sampleH = samples[0]?.height || 1;
  const sampleD = samples[0]?.depth || 1;
  const sampleGHS = samples[0]?.ghs_danger_class || 'Sin Riesgo';
  const ghsColor = getSGAColor(sampleGHS);

  // Cargar datos de anaquel al seleccionarlo — solo getShelfMap
  useEffect(() => {
    if (!selectedShelfId) {
      setTargetMapData(null);
      setAssignedCells([]);
      return;
    }
    setLoadingShelfData(true);
    setShelfError(null);
    setAssignedCells([]);

    warehouseAPI.getShelfMap(selectedShelfId)
      .then(res => {
        setTargetMapData(res.data.data);
      })
      .catch(err => {
        console.error('Error loading shelf map:', err);
        setShelfError('No se pudo cargar el entorno 3D del armario seleccionado');
      })
      .finally(() => setLoadingShelfData(false));
  }, [selectedShelfId]);

  // Dimensiones del anaquel objetivo
  const gridWidth  = targetMapData?.shelf?.grid_width  || 10;
  const gridHeight = targetMapData?.shelf?.grid_height || 10;
  const shelfDepth = targetMapData?.shelf?.shelf_depth || 10;

  const targetShelfName = compatibleShelves.find(s => s.id === selectedShelfId)?.name || 'Armario Destino';

  // Muestras externas del anaquel destino (excluye las que estamos moviendo)
  const externalSamples = useMemo(() => {
    if (!targetMapData) return [];
    return targetMapData.samples.filter(s =>
      s.status === 'stored' &&
      s.position_x !== null &&
      s.position_y !== null &&
      s.position_z !== null &&
      !samples.some(ms => ms.id === s.id)
    );
  }, [targetMapData, samples]);

  // Set de celdas ocupadas para lookup rápido (considera dimensiones)
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

  // Celdas disponibles calculadas localmente desde el mapa del anaquel
  // Muestra TODOS los espacios vacíos donde cabe una muestra
  const availableCells = useMemo(() => {
    if (!targetMapData) return [];
    const cells = [];

    for (let y = 0; y <= gridHeight - sampleH; y++) {
      for (let z = 0; z <= shelfDepth - sampleD; z++) {
        for (let x = 0; x <= gridWidth - sampleW; x++) {
          // Verificar que todas las celdas del AABB de la muestra estén libres
          let isOccupied = false;
          outer:
          for (let dx = 0; dx < sampleW; dx++) {
            for (let dy = 0; dy < sampleH; dy++) {
              for (let dz = 0; dz < sampleD; dz++) {
                if (occupiedSet.has(`${x + dx},${y + dy},${z + dz}`)) {
                  isOccupied = true;
                  break outer;
                }
              }
            }
          }
          if (!isOccupied) {
            cells.push({ x, y, z });
          }
        }
      }
    }
    return cells;
  }, [targetMapData, occupiedSet, gridWidth, gridHeight, shelfDepth, sampleW, sampleH, sampleD]);

  // Map para lookup O(1)
  const availableCellsMap = useMemo(() => {
    const m = new Map();
    availableCells.forEach(c => m.set(`${c.x},${c.y},${c.z}`, c));
    return m;
  }, [availableCells]);

  // Contadores de espacios libres por nivel
  const freeByLevel = useMemo(() => {
    const counts = {};
    availableCells.forEach(c => {
      counts[c.y] = (counts[c.y] || 0) + 1;
    });
    return counts;
  }, [availableCells]);

  // Contadores de asignaciones por nivel
  const assignedByLevel = useMemo(() => {
    const counts = {};
    assignedCells.forEach(c => {
      counts[c.y] = (counts[c.y] || 0) + 1;
    });
    return counts;
  }, [assignedCells]);

  // Verificar superposición con otras celdas ya asignadas
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
        background: '#04060c',
        display: 'flex', flexDirection: 'column',
        zIndex: BACKDROP.Z_INDEX + 10,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        animation: ANIM.FADE_IN,
      }}
    >
      {/* ════ HEADER ════ */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(9,13,22,0.7)',
        backdropFilter: BLUR.MD,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {step !== 'aisle' && (
            <button
              onClick={() => {
                if (step === 'level') setStep('shelf');
                else if (step === 'shelf') { setStep('aisle'); setSelectedShelfId(null); }
              }}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: RADIUS.MD, color: '#fff',
                padding: '6px 10px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 11, fontWeight: 700, transition: 'all 0.2s',
              }}
            >
              <ArrowLeftIcon style={{ width: 13, height: 13 }} /> Volver
            </button>
          )}
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              Reubicación 3D — {targetMapData?.shelf?.market_line_name || (compatibleShelves[0]?.market_line_name || '...')}
            </h2>
            <p style={{ fontSize: 10, color: '#64748b', margin: '2px 0 0', fontWeight: 600 }}>
              {step === 'aisle' && 'Paso 1 · Haz clic en el armario destino'}
              {step === 'shelf' && `Paso 2 · ${targetShelfName} · Selecciona el nivel`}
              {step === 'level' && `Paso 3 · ${targetShelfName} Nivel ${selectedLevelY + 1} · Selecciona ${samples.length - assignedCells.length} celda(s) más`}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 6, borderRadius: '50%', transition: 'all 0.2s', display: 'flex', alignItems: 'center' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'none'; }}
        >
          <XMarkIcon style={{ width: 20, height: 20 }} />
        </button>
      </div>

      {/* ════ BODY ════ */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>

        {/* ── COLUMNA IZQUIERDA: Checklist de Muestras ── */}
        <div style={{
          width: 300, borderRight: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(9,13,22,0.4)',
          display: 'flex', flexDirection: 'column',
          padding: 16, boxSizing: 'border-box', flexShrink: 0,
        }}>
          <div style={{ marginBottom: 12 }}>
            <span style={{ ...FONT.LABEL_XS, color: '#94a3b8' }}>Muestras a Reubicar</span>
            <h3 style={{ fontSize: 14, fontWeight: 900, color: '#fff', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 5 }}>
              <CubeIcon style={{ width: 16, height: 16, color: ghsColor }} />
              {samples.length} Muestras
            </h3>
            <div style={{ display: 'inline-flex', marginTop: 6, padding: '2px 8px', borderRadius: 4, background: `${ghsColor}15`, border: `1px solid ${ghsColor}30`, fontSize: 10, fontWeight: 800, color: ghsColor }}>
              SGA: {sampleGHS}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 2 }}>
            {samples.map((s, idx) => {
              const assignment = assignedCells[idx];
              const isAssigned = !!assignment;
              return (
                <div key={s.id} style={{
                  background: isAssigned ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.01)',
                  border: `1px solid ${isAssigned ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.04)'}`,
                  borderRadius: RADIUS.LG, padding: 10,
                  display: 'flex', flexDirection: 'column', gap: 5,
                  transition: 'all 0.3s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 170 }}>
                      {s.global_sample_name || s.name}
                    </span>
                    <span style={{
                      width: 18, height: 18, borderRadius: '50%',
                      background: isAssigned ? '#10b981' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isAssigned ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 8, fontWeight: 900, flexShrink: 0,
                    }}>
                      {isAssigned ? <CheckIcon style={{ width: 10, height: 10 }} /> : idx + 1}
                    </span>
                  </div>
                  <div style={{ fontSize: 9, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: '#475569', fontWeight: 600 }}>Origen:</span>
                    <span style={{ color: '#64748b' }}>Niv {(s.position_y ?? 0) + 1} · ({s.position_x}, {s.position_z})</span>
                  </div>
                  <div style={{
                    fontSize: 9, display: 'flex', alignItems: 'center', gap: 4,
                    marginTop: 1, padding: '3px 7px', borderRadius: 4,
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
          <div style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>Asignados:</span>
              <span style={{ fontSize: 13, fontWeight: 900, color: assignedCells.length === samples.length ? '#10b981' : '#facc15' }}>
                {assignedCells.length} / {samples.length}
              </span>
            </div>

            {/* Barra de progreso */}
            <div style={{ height: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${samples.length > 0 ? (assignedCells.length / samples.length) * 100 : 0}%`,
                background: assignedCells.length === samples.length ? '#10b981' : '#facc15',
                boxShadow: `0 0 10px ${assignedCells.length === samples.length ? '#10b981' : '#facc15'}60`,
                transition: 'all 0.3s ease',
              }} />
            </div>

            {assignedCells.length < samples.length && step === 'level' && (
              <div style={{ display: 'flex', gap: 5, background: 'rgba(250,204,21,0.05)', border: '1px solid rgba(250,204,21,0.12)', borderRadius: RADIUS.LG, padding: '7px 10px' }}>
                <ExclamationTriangleIcon style={{ width: 14, height: 14, color: '#fbbf24', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 9, color: '#fbbf24', fontWeight: 600, lineHeight: 1.3 }}>
                  Haz clic en {samples.length - assignedCells.length} celda(s) verde(s) para completar la asignación.
                </span>
              </div>
            )}

            {step === 'aisle' && (
              <div style={{ display: 'flex', gap: 5, background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.12)', borderRadius: RADIUS.LG, padding: '7px 10px' }}>
                <span style={{ fontSize: 9, color: '#38bdf8', fontWeight: 600, lineHeight: 1.3 }}>
                  💡 Haz clic en un anaquel del pasillo para comenzar la selección de destino.
                </span>
              </div>
            )}

            {error && (
              <div style={{ display: 'flex', gap: 5, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: RADIUS.LG, padding: '7px 10px' }}>
                <ExclamationTriangleIcon style={{ width: 14, height: 14, color: '#f87171', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 9, color: '#f87171', fontWeight: 600, lineHeight: 1.3 }}>{error}</span>
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
                padding: '11px', borderRadius: RADIUS.MD,
                fontSize: 11, fontWeight: 800,
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
              position: 'absolute', inset: 0, background: 'rgba(4,6,12,0.88)',
              zIndex: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
            }}>
              <div className="animate-spin" style={{ width: 30, height: 30, border: '3px solid rgba(255,255,255,0.05)', borderTopColor: '#0ea5e9', borderRadius: '50%' }} />
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: 0.5 }}>Cargando mapa del anaquel...</span>
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
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: RADIUS.MD, color: '#fff', padding: '7px 14px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
              >
                Volver a la selección
              </button>
            </div>
          )}

          {/* Canvas 3D */}
          <div style={{ flex: 1, height: '100%', position: 'relative' }}>
            <Canvas camera={{ position: [0, 9, 24], fov: 42 }} gl={{ antialias: true }}>
              <color attach="background" args={['#050508']} />
              <fog attach="fog" args={['#050508', 18, 50]} />

              <ambientLight intensity={0.55} />
              <directionalLight position={[10, 20, 15]} intensity={1.8} castShadow />
              <directionalLight position={[-15, 10, -10]} intensity={1.0} color="#3b82f6" />
              <pointLight position={[0, 10, 0]} intensity={0.6} color="#0ea5e9" />

              <OrbitControls
                makeDefault
                enablePan={true}
                enableZoom={true}
                minDistance={3}
                maxDistance={40}
                minPolarAngle={0}
                maxPolarAngle={Math.PI * 0.82}
              />

              <CameraController
                step={step}
                gridWidth={gridWidth}
                gridHeight={gridHeight}
                shelfDepth={shelfDepth}
              />

              {/* ── VISTA PASILLO ── */}
              {step === 'aisle' && (
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
                        onClick={(id) => { setSelectedShelfId(id); setStep('shelf'); }}
                      />
                    );
                  })}
                  <ContactShadows position={[0, -0.01, 0]} opacity={0.6} scale={28} blur={2.0} far={6} />
                </group>
              )}

              {/* ── VISTA NIVELES DEL ANAQUEL ── */}
              {step === 'shelf' && targetMapData && (
                <group>
                  <ShelfStructure totalCols={gridWidth} totalDepth={shelfDepth} totalLevels={gridHeight} />
                  <group position={[0, -(gridHeight * LEVEL_HEIGHT) / 2 + 0.5, 0]}>
                    {Array.from({ length: gridHeight }).map((_, i) => (
                      <LevelPlaneMesh
                        key={`lpm-${i}`}
                        yIndex={i}
                        totalCols={gridWidth}
                        totalDepth={shelfDepth}
                        isSelected={selectedLevelY === i}
                        isHovered={hoveredLevelY === i}
                        onHover={setHoveredLevelY}
                        onClick={(y) => { setSelectedLevelY(y); setStep('level'); }}
                        assignedCount={assignedByLevel[i] || 0}
                        freeCount={freeByLevel[i] || 0}
                      />
                    ))}
                  </group>
                </group>
              )}

              {/* ── VISTA CELDA / REJILLA ── */}
              {step === 'level' && targetMapData && (
                <group>
                  <GridLines cols={gridWidth} depth={shelfDepth} />

                  {/* Piso */}
                  <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[gridWidth + 0.5, shelfDepth + 0.5]} />
                    <meshStandardMaterial color="#0b0f19" roughness={0.7} metalness={0.4} />
                  </mesh>

                  {/* ── 1. Muestras OCUPADAS como bloques 3D visibles ── */}
                  {externalSamples.map(sample => {
                    if (sample.position_y !== selectedLevelY) return null;
                    const w = sample.width || 1;
                    const d = sample.depth || 1;
                    const px = -gridWidth / 2 + sample.position_x + w / 2;
                    const pz = -shelfDepth / 2 + (sample.position_z || 0) + d / 2;
                    const sampleColor = getSGAColor(sample.ghs_danger_class || 'Sin Riesgo');

                    return (
                      <group key={`occ-${sample.id}`} position={[px, 0.32, pz]}>
                        {/* Bloque principal */}
                        <mesh castShadow>
                          <boxGeometry args={[w - 0.06, 0.62, d - 0.06]} />
                          <meshPhysicalMaterial
                            color="#1e293b"
                            metalness={0.6}
                            roughness={0.4}
                            emissive="#0f172a"
                            emissiveIntensity={0.3}
                          />
                        </mesh>
                        {/* Borde de color SGA */}
                        <mesh position={[0, 0.32, 0]}>
                          <boxGeometry args={[w - 0.04, 0.06, d - 0.04]} />
                          <meshStandardMaterial color={sampleColor} emissive={sampleColor} emissiveIntensity={0.7} />
                        </mesh>
                        <Edges color="#334155" transparent opacity={0.6} />
                        {/* Etiqueta */}
                        <Html position={[0, 0.42, 0]} center style={{ pointerEvents: 'none' }}>
                          <div style={{
                            background: 'rgba(15,23,42,0.85)',
                            border: `1px solid ${sampleColor}40`,
                            color: '#94a3b8',
                            fontSize: 7, fontWeight: 800,
                            padding: '2px 5px', borderRadius: 4,
                            whiteSpace: 'nowrap',
                          }}>
                            📦 {sample.global_sample_name?.slice(0, 10) || 'Ocupado'}
                          </div>
                        </Html>
                      </group>
                    );
                  })}

                  {/* ── 2. Celdas DISPONIBLES (vacías) para selección ── */}
                  {availableCells
                    .filter(c => c.y === selectedLevelY)
                    .map(c => {
                      const { x, z } = c;
                      const isAssigned = assignedCells.some(a => a.x === x && a.y === selectedLevelY && a.z === z);
                      const assignIdx = assignedCells.findIndex(a => a.x === x && a.y === selectedLevelY && a.z === z);
                      const px = -gridWidth / 2 + x + sampleW / 2;
                      const pz = -shelfDepth / 2 + z + sampleD / 2;
                      const canSelect = !isAssigned && assignedCells.length < samples.length;

                      return (
                        <group key={`cell-${x}-${z}`} position={[px, 0.01, pz]}>
                          {/* Plano de piso clicable */}
                          <mesh
                            rotation={[-Math.PI / 2, 0, 0]}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCellClick({ x, y: selectedLevelY, z });
                            }}
                            onPointerOver={(e) => {
                              e.stopPropagation();
                              if (canSelect || isAssigned) document.body.style.cursor = 'pointer';
                            }}
                            onPointerOut={() => { document.body.style.cursor = 'default'; }}
                          >
                            <planeGeometry args={[sampleW - 0.06, sampleD - 0.06]} />
                            <meshStandardMaterial
                              color={isAssigned ? '#34d399' : '#10b981'}
                              transparent
                              opacity={isAssigned ? 0.75 : 0.22}
                              emissive={isAssigned ? '#34d399' : '#10b981'}
                              emissiveIntensity={isAssigned ? 0.9 : 0.15}
                            />
                          </mesh>

                          {/* Cubo fantasma neón al asignar */}
                          {isAssigned && (
                            <mesh position={[0, 0.32, 0]}>
                              <boxGeometry args={[sampleW - 0.1, 0.62, sampleD - 0.1]} />
                              <meshPhysicalMaterial
                                color={ghsColor}
                                transparent opacity={0.82}
                                roughness={0.1} metalness={0.8}
                                emissive={ghsColor} emissiveIntensity={0.6}
                                clearcoat={1.0}
                              />
                              <Edges color="#ffffff" transparent opacity={0.4} />
                            </mesh>
                          )}

                          {/* Número de orden */}
                          {isAssigned && (
                            <Html position={[0, 0.72, 0]} center style={{ pointerEvents: 'none' }}>
                              <div style={{
                                background: '#10b981', color: '#fff',
                                width: 16, height: 16, borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 9, fontWeight: 900,
                                boxShadow: '0 0 8px rgba(16,185,129,0.8)',
                                border: '1px solid #fff',
                              }}>#{assignIdx + 1}</div>
                            </Html>
                          )}
                        </group>
                      );
                    })}
                </group>
              )}
            </Canvas>

            {/* HUD superior izquierdo */}
            <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 30, pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {step === 'aisle' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(9,13,22,0.7)', backdropFilter: BLUR.SM, padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 10px #3b82f6' }} />
                  <span style={{ fontSize: 9, color: '#e2e8f0', fontWeight: 800, letterSpacing: 0.5 }}>VISTA GENERAL DEL PASILLO · {compatibleShelves.length} ANAQUELES</span>
                </div>
              )}
              {step === 'shelf' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(9,13,22,0.7)', backdropFilter: BLUR.SM, padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#eab308', boxShadow: '0 0 10px #eab308' }} />
                  <span style={{ fontSize: 9, color: '#e2e8f0', fontWeight: 800, letterSpacing: 0.5 }}>NIVELES DE {targetShelfName.toUpperCase()}</span>
                </div>
              )}
              {step === 'level' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(9,13,22,0.7)', backdropFilter: BLUR.SM, padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
                  <span style={{ fontSize: 9, color: '#e2e8f0', fontWeight: 800, letterSpacing: 0.5 }}>
                    NIVEL {selectedLevelY + 1} · {availableCells.filter(c => c.y === selectedLevelY).length} ESPACIOS LIBRES · {assignedCells.filter(c => c.y === selectedLevelY).length} ASIGNADOS
                  </span>
                </div>
              )}
            </div>

            {/* Leyenda inferior */}
            <div style={{
              position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(9,13,22,0.85)', backdropFilter: BLUR.MD,
              border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20,
              padding: '5px 14px', display: 'flex', gap: 12, zIndex: 30,
              fontSize: 8, fontWeight: 700, color: '#94a3b8', whiteSpace: 'nowrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(16,185,129,0.3)', border: '1px solid #10b981' }} />
                <span>Disponible</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399' }} />
                <span>Asignado</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1e293b', border: '1px solid #334155' }} />
                <span>Ocupado</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: ghsColor, boxShadow: `0 0 6px ${ghsColor}` }} />
                <span>Lote reubicado</span>
              </div>
            </div>

            {/* Botón "Ir al nivel anterior/siguiente" cuando está en level */}
            {step === 'level' && (
              <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 30, display: 'flex', gap: 6 }}>
                <button
                  disabled={selectedLevelY <= 0}
                  onClick={() => setSelectedLevelY(y => Math.max(0, y - 1))}
                  style={{
                    background: 'rgba(9,13,22,0.8)', backdropFilter: BLUR.SM,
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
                    color: selectedLevelY <= 0 ? '#334155' : '#94a3b8',
                    padding: '6px 10px', cursor: selectedLevelY <= 0 ? 'not-allowed' : 'pointer',
                    fontSize: 10, fontWeight: 700,
                  }}
                >▲ Nivel sup.</button>
                <button
                  disabled={selectedLevelY >= gridHeight - 1}
                  onClick={() => setSelectedLevelY(y => Math.min(gridHeight - 1, y + 1))}
                  style={{
                    background: 'rgba(9,13,22,0.8)', backdropFilter: BLUR.SM,
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
                    color: selectedLevelY >= gridHeight - 1 ? '#334155' : '#94a3b8',
                    padding: '6px 10px', cursor: selectedLevelY >= gridHeight - 1 ? 'not-allowed' : 'pointer',
                    fontSize: 10, fontWeight: 700,
                  }}
                >▼ Nivel inf.</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReplicaWarehouseModal;
