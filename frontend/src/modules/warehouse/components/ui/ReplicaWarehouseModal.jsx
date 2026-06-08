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

// CameraController para ajustar dinámicamente la posición de la cámara según el paso actual
const CameraController = ({ step, gridWidth, gridHeight, shelfDepth }) => {
  const { camera, controls } = useThree();
  const animRef = useRef(false);
  const targetPos = useRef(new THREE.Vector3(0, 10, 25));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (step === 'aisle') {
      targetPos.current.set(0, 8, 22);
      targetLook.current.set(0, 1.5, 0);
    } else if (step === 'shelf') {
      const h = (gridHeight || 10) * LEVEL_HEIGHT;
      targetPos.current.set((gridWidth || 10) * 1.5, h * 0.6, (shelfDepth || 10) * 1.5 + 8);
      targetLook.current.set(0, h / 2 - 1.0, 0);
    } else if (step === 'level') {
      targetPos.current.set(0, (gridHeight || 10) * 0.4 + 4, (shelfDepth || 10) * 1.5 + 5);
      targetLook.current.set(0, 0.2, 0);
    }
    animRef.current = true;
  }, [step, gridWidth, gridHeight, shelfDepth]);

  useFrame(() => {
    if (!animRef.current || !controls) return;
    const dist = camera.position.distanceTo(targetPos.current);
    if (dist < 0.2) {
      animRef.current = false;
      controls.target.copy(targetLook.current);
      controls.update();
      return;
    }
    camera.position.lerp(targetPos.current, 0.08);
    controls.target.lerp(targetLook.current, 0.08);
    controls.update();
  });

  return null;
};

// Réplica 3D de un Anaquel Metálico en la vista general de pasillos
const AisleShelfMesh = ({ shelf, position, index, isHovered, onHover, onClick }) => {
  const meshRef = useRef();

  useFrame((state) => {
    if (!meshRef.current) return;
    const targetScale = isHovered ? 1.05 : 1;
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    
    // Suave oscilación de flotación
    const time = state.clock.getElapsedTime();
    const floatingY = position[1] + (isHovered ? 0.15 : 0) + Math.sin(time * 2 + index) * 0.04;
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, floatingY, 0.1);
  });

  const boxWidth = 1.6;
  const boxHeight = 4.0;
  const boxDepth = 1.4;

  const occupancy = shelf.occupancy_percentage || 0;
  let indicatorColor = '#10b981'; // Green
  if (occupancy > 85) indicatorColor = '#ef4444'; // Red
  else if (occupancy > 60) indicatorColor = '#f59e0b'; // Amber
  else if (occupancy > 30) indicatorColor = '#0ea5e9'; // Blue

  return (
    <group
      position={position}
      ref={meshRef}
      onPointerOver={(e) => { e.stopPropagation(); onHover(shelf.id); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { onHover(null); document.body.style.cursor = 'default'; }}
      onClick={(e) => { e.stopPropagation(); document.body.style.cursor = 'default'; onClick(shelf.id); }}
    >
      <group position={[0, boxHeight / 2 - 1.5, 0]}>
        {/* Cuerpo Principal Metálico */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[boxWidth, boxHeight, boxDepth]} />
          <meshPhysicalMaterial 
            color="#cbd5e1" 
            metalness={0.9} 
            roughness={0.15} 
            clearcoat={0.6}
            clearcoatRoughness={0.1}
          />
        </mesh>

        {/* Puertas / Marco oscuro frontal */}
        <mesh position={[0, 0, boxDepth / 2 + 0.01]}>
          <planeGeometry args={[boxWidth - 0.25, boxHeight - 0.25]} />
          <meshPhysicalMaterial 
            color="#0f172a" 
            metalness={0.8} 
            roughness={0.3} 
          />
        </mesh>
        
        {/* Línea divisoria central */}
        <mesh position={[0, 0, boxDepth / 2 + 0.015]}>
          <planeGeometry args={[0.015, boxHeight - 0.25]} />
          <meshBasicMaterial color="#000000" />
        </mesh>

        {/* LED de estado de ocupación */}
        <mesh position={[0, boxHeight / 2 - 0.12, boxDepth / 2 + 0.02]}>
          <planeGeometry args={[boxWidth - 0.5, 0.08]} />
          <meshStandardMaterial 
            color={indicatorColor} 
            emissive={indicatorColor} 
            emissiveIntensity={isHovered ? 1.8 : 0.8} 
          />
        </mesh>
      </group>

      <Html position={[0, boxHeight + 0.3, 0]} center style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(9, 13, 22, 0.9)',
          backdropFilter: 'blur(8px)',
          border: `1px solid ${isHovered ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.06)'}`,
          padding: '6px 12px',
          borderRadius: 8,
          boxShadow: SHADOW.TOOLTIP,
          textAlign: 'center',
          minWidth: 100,
          whiteSpace: 'nowrap',
          transition: 'all 0.2s',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: '#f8fafc', marginBottom: 2 }}>{shelf.name}</div>
          <div style={{ fontSize: 8, fontWeight: 800, color: indicatorColor }}>{occupancy}% OCUPADO</div>
        </div>
      </Html>
    </group>
  );
};

// Estructura visual de estantes y vigas (mismo diseño de la vista principal)
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

// Plano/Capa horizontal seleccionable de nivel
const LevelPlaneMesh = ({ yIndex, totalCols, totalDepth, isSelected, isHovered, onHover, onClick, assignedCount, freeCount }) => {
  const active = isSelected || isHovered;

  return (
    <group position={[0, yIndex * LEVEL_HEIGHT + 0.48, 0]}>
      <mesh
        onPointerOver={(e) => { e.stopPropagation(); onHover(yIndex); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { onHover(null); document.body.style.cursor = 'default'; }}
        onClick={(e) => { e.stopPropagation(); document.body.style.cursor = 'default'; onClick(yIndex); }}
      >
        <boxGeometry args={[totalCols + 0.3, 0.06, totalDepth + 0.3]} />
        <meshStandardMaterial
          color={isSelected ? '#10b981' : '#3b82f6'}
          transparent
          opacity={isSelected ? 0.22 : isHovered ? 0.14 : 0.02}
          emissive={isSelected ? '#10b981' : '#3b82f6'}
          emissiveIntensity={isSelected ? 0.5 : isHovered ? 0.3 : 0}
          depthWrite={false}
        />
      </mesh>

      {/* Halo de luz frontal */}
      {active && (
        <mesh position={[0, 0.03, -(totalDepth / 2 + 0.16)]}>
          <boxGeometry args={[totalCols + 0.38, 0.02, 0.05]} />
          <meshStandardMaterial
            color={isSelected ? '#10b981' : '#3b82f6'}
            emissive={isSelected ? '#10b981' : '#3b82f6'}
            emissiveIntensity={2}
            transparent
            opacity={0.95}
          />
        </mesh>
      )}

      {/* Indicador flotante en el nivel */}
      <Html position={[totalCols / 2 + 1.2, 0.1, 0]} center style={{ pointerEvents: 'none' }}>
        <div style={{
          background: isSelected ? 'rgba(16, 185, 129, 0.9)' : 'rgba(15, 23, 42, 0.85)',
          border: `1px solid ${isSelected ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 255, 255, 0.06)'}`,
          color: isSelected ? '#ffffff' : '#94a3b8',
          fontSize: 9,
          fontWeight: 900,
          padding: '2px 8px',
          borderRadius: 12,
          whiteSpace: 'nowrap',
          display: 'flex',
          gap: 6,
          boxShadow: SHADOW.TOOLTIP,
        }}>
          <span>NIVEL {yIndex + 1}</span>
          <span style={{ color: isSelected ? '#ffffff' : '#38bdf8' }}>
            {assignedCount > 0 ? `🎯 ${assignedCount} Asignado` : `${freeCount} libres`}
          </span>
        </div>
      </Html>
    </group>
  );
};

// Líneas de cuadrícula 2D sobre la rejilla
const GridLines = ({ cols, depth }) => {
  const lines = [];
  const hC = cols / 2, hD = depth / 2;
  for (let i = 0; i <= cols; i++) {
    lines.push(
      <line key={`gx-${i}`} position={[i - hC, 0.01, 0]}>
        <bufferGeometry><float32BufferAttribute attach="attributes-position" args={[new Float32Array([0,0,-hD,0,0,hD]),3]}/></bufferGeometry>
        <lineBasicMaterial color="#334155" transparent opacity={0.8} />
      </line>
    );
  }
  for (let i = 0; i <= depth; i++) {
    lines.push(
      <line key={`gz-${i}`} position={[0, 0.01, i - hD]}>
        <bufferGeometry><float32BufferAttribute attach="attributes-position" args={[new Float32Array([-hC,0,0,hC,0,0]),3]}/></bufferGeometry>
        <lineBasicMaterial color="#334155" transparent opacity={0.8} />
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

  // Estados de datos de anaquel seleccionado
  const [targetMapData, setTargetMapData] = useState(null);
  const [previewCells, setPreviewCells] = useState([]);
  const [loadingShelfData, setLoadingShelfData] = useState(false);
  const [shelfError, setShelfError] = useState(null);

  // Mapeo de muestras seleccionadas asignadas a coordenadas: [{ x, y, z }]
  const [assignedCells, setAssignedCells] = useState([]);

  // Hover states de 3D
  const [hoveredShelfId, setHoveredShelfId] = useState(null);
  const [hoveredLevelY, setHoveredLevelY] = useState(null);

  // Obtener dimensiones del tipo de muestras (las de samples[0])
  const sampleW = samples[0]?.width || 1;
  const sampleH = samples[0]?.height || 1;
  const sampleD = samples[0]?.depth || 1;
  const sampleGHS = samples[0]?.ghs_danger_class || 'Sin Riesgo';
  const ghsColor = getSGAColor(sampleGHS);

  // Cargar datos de anaquel destino al seleccionarlo
  useEffect(() => {
    if (!selectedShelfId) {
      setTargetMapData(null);
      setPreviewCells([]);
      setAssignedCells([]);
      return;
    }

    setLoadingShelfData(true);
    setShelfError(null);
    setAssignedCells([]); // Reiniciar asignaciones al cambiar de estante

    Promise.all([
      warehouseAPI.getShelfMap(selectedShelfId),
      warehouseAPI.previewGroupMove(currentShelfId, {
        target_shelf_id: selectedShelfId,
        sample_ids: samples.map(s => s.id)
      })
    ])
      .then(([mapRes, prevRes]) => {
        setTargetMapData(mapRes.data.data);
        setPreviewCells(prevRes.data.data.cells || []);
      })
      .catch((err) => {
        console.error("Error loading shelf 3D map/preview:", err);
        setShelfError("No se pudo cargar el entorno 3D del armario seleccionado");
      })
      .finally(() => {
        setLoadingShelfData(false);
      });
  }, [selectedShelfId, currentShelfId, samples]);

  // Dimensiones del anaquel objetivo
  const gridWidth = targetMapData?.shelf?.grid_width || 10;
  const gridHeight = targetMapData?.shelf?.grid_height || 10;
  const shelfDepth = targetMapData?.shelf?.shelf_depth || 10;

  // Encontrar el nombre del anaquel actual
  const targetShelfName = compatibleShelves.find(s => s.id === selectedShelfId)?.name || 'Armario Destino';

  // Organizar muestras externas por clave de coordenadas
  const externalSamplesMap = useMemo(() => {
    if (!targetMapData) return new Map();
    const m = new Map();
    targetMapData.samples.forEach(s => {
      // Excluir del mapa de colisiones del estante si la muestra es del grupo que se está moviendo
      const isPartofMovingGroup = samples.some(ms => ms.id === s.id);
      if (s.status === 'stored' && !isPartofMovingGroup) {
        m.set(`${s.position_x},${s.position_y},${s.position_z}`, s);
      }
    });
    return m;
  }, [targetMapData, samples]);

  // Agrupar celdas del preview por coordenada
  const previewCellsMap = useMemo(() => {
    const m = new Map();
    previewCells.forEach(c => {
      m.set(`${c.x},${c.y},${c.z}`, c);
    });
    return m;
  }, [previewCells]);

  // Contadores de celdas asignadas en cada nivel
  const assignedByLevel = useMemo(() => {
    const counts = {};
    assignedCells.forEach(cell => {
      counts[cell.y] = (counts[cell.y] || 0) + 1;
    });
    return counts;
  }, [assignedCells]);

  // Contadores de celdas vacías del preview en cada nivel
  const freePreviewByLevel = useMemo(() => {
    const counts = {};
    previewCells.forEach(cell => {
      if (cell.compatible) {
        counts[cell.y] = (counts[cell.y] || 0) + 1;
      }
    });
    return counts;
  }, [previewCells]);

  // Helper para verificar superposición física con otras celdas asignadas
  const checkAABBOverlap = (newCell) => {
    const b1 = { x: newCell.x, y: newCell.y, z: newCell.z, w: sampleW, h: sampleH, d: sampleD };
    for (const cell of assignedCells) {
      const b2 = { x: cell.x, y: cell.y, z: cell.z, w: sampleW, h: sampleH, d: sampleD };
      if (
        b1.x < b2.x + b2.w &&
        b1.x + b1.w > b2.x &&
        b1.y < b2.y + b2.h &&
        b1.y + b1.h > b2.y &&
        b1.z < b2.z + b2.d &&
        b1.z + b1.d > b2.z
      ) {
        return true;
      }
    }
    return false;
  };

  // Manejar click en celda
  const handleCellClick = (pos) => {
    // Buscar si ya está asignado para quitarlo
    const index = assignedCells.findIndex(c => c.x === pos.x && c.y === pos.y && c.z === pos.z);
    if (index !== -1) {
      const copy = [...assignedCells];
      copy.splice(index, 1);
      setAssignedCells(copy);
      return;
    }

    // No permitir más del tamaño del grupo
    if (assignedCells.length >= samples.length) return;

    // Verificar colisión interna del grupo (AABB)
    if (checkAABBOverlap(pos)) {
      return;
    }

    setAssignedCells([...assignedCells, pos]);
  };

  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState(null);

  // Confirmar reubicación total
  const handleConfirm = async () => {
    if (assignedCells.length !== samples.length) return;
    setIsExecuting(true);
    setError(null);

    // Mapear cada muestra del grupo a una celda asignada
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
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Error committing group move:", err);
      setError(err.response?.data?.message || "Ocurrió un error inesperado al realizar el movimiento de reubicación");
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
      {/* ════════════════════ HEADER ════════════════════ */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(9, 13, 22, 0.7)',
        backdropFilter: BLUR.MD,
        display: 'flex', alignItems: 'center', justifyContent: 'between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {step !== 'aisle' && (
            <button
              onClick={() => {
                if (step === 'level') setStep('shelf');
                else if (step === 'shelf') setStep('aisle');
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: RADIUS.MD,
                color: '#fff',
                padding: '8px 12px',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, fontWeight: 700,
                transition: 'all 0.2s',
              }}
            >
              <ArrowLeftIcon style={{ width: 14, height: 14 }} /> Volver
            </button>
          )}
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              Reubicación Visual 3D — Línea de Mercado: {targetMapData?.shelf?.market_line_name || '...'}
            </h2>
            <p style={{ fontSize: 11, color: '#64748b', margin: '3px 0 0', fontWeight: 600 }}>
              {step === 'aisle' && 'Paso 1: Haz clic en el armario metálico al que deseas mover el lote'}
              {step === 'shelf' && `Paso 2: Inspeccionando ${targetShelfName} · Selecciona el nivel de destino`}
              {step === 'level' && `Paso 3: ${targetShelfName} (Nivel ${selectedLevelY + 1}) · Haz clic en ${samples.length} celdas verdes vacías`}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', color: '#64748b',
            cursor: 'pointer', padding: 8, borderRadius: '50%',
            transition: 'all 0.2s', display: 'flex', alignItems: 'center',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'none'; }}
        >
          <XMarkIcon style={{ width: 22, height: 22 }} />
        </button>
      </div>

      {/* ════════════════════ BODY ════════════════════ */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        
        {/* ── COLUMNA IZQUIERDA: Checklist de Muestras ── */}
        <div style={{
          width: 320,
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(9, 13, 22, 0.4)',
          display: 'flex', flexDirection: 'column',
          padding: 20,
          boxSizing: 'border-box',
          flexShrink: 0,
        }}>
          <div style={{ marginBottom: 16 }}>
            <span style={{ ...FONT.LABEL_XS, color: '#94a3b8' }}>Muestras a Reubicar</span>
            <h3 style={{ fontSize: 15, fontWeight: 900, color: '#fff', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CubeIcon style={{ width: 18, height: 18, color: ghsColor }} /> {samples.length} Muestras
            </h3>
            <div style={{ display: 'inline-flex', marginTop: 8, padding: '2px 8px', borderRadius: 4, background: `${ghsColor}15`, border: `1px solid ${ghsColor}30`, fontSize: 10, fontWeight: 800, color: ghsColor }}>
              SGA: {sampleGHS}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
            {samples.map((s, idx) => {
              const assignment = assignedCells[idx];
              const isAssigned = !!assignment;

              return (
                <div
                  key={s.id}
                  style={{
                    background: isAssigned ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.01)',
                    border: `1px solid ${isAssigned ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.04)'}`,
                    borderRadius: RADIUS.LG,
                    padding: 12,
                    display: 'flex', flexDirection: 'column', gap: 6,
                    transition: 'all 0.3s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                      {s.global_sample_name || s.name}
                    </span>
                    <span style={{
                      width: 18, height: 18, borderRadius: '50%',
                      background: isAssigned ? '#10b981' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isAssigned ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 9, fontWeight: 900,
                    }}>
                      {isAssigned ? <CheckIcon style={{ width: 10, height: 10 }} /> : idx + 1}
                    </span>
                  </div>

                  <div style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: '#475569', fontWeight: 600 }}>Origen:</span>
                    <span style={{ color: '#64748b' }}>Niv {s.position_y + 1} · ({s.position_x}, {s.position_z})</span>
                  </div>

                  <div style={{
                    fontSize: 10, display: 'flex', alignItems: 'center', gap: 4,
                    marginTop: 2, padding: '4px 8px', borderRadius: 4,
                    background: isAssigned ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                    color: isAssigned ? '#34d399' : '#f87171',
                    fontWeight: 700,
                  }}>
                    <span>Destino:</span>
                    {isAssigned ? (
                      <span>Niv {assignment.y + 1} · ({assignment.x}, {assignment.z})</span>
                    ) : (
                      <span>🔴 Sin asignar</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Estado de selección global */}
          <div style={{
            marginTop: 20,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: 16,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>Lugares Asignados:</span>
              <span style={{ fontSize: 13, fontWeight: 900, color: assignedCells.length === samples.length ? '#10b981' : '#facc15' }}>
                {assignedCells.length} de {samples.length}
              </span>
            </div>

            {/* Barra de progreso visual */}
            <div style={{ height: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(assignedCells.length / samples.length) * 100}%`,
                background: assignedCells.length === samples.length ? '#10b981' : '#facc15',
                boxShadow: `0 0 10px ${assignedCells.length === samples.length ? '#10b981' : '#facc15'}60`,
                transition: 'all 0.3s ease',
              }} />
            </div>

            {assignedCells.length < samples.length && (
              <div style={{ display: 'flex', gap: 6, background: 'rgba(250, 204, 21, 0.05)', border: '1px solid rgba(250, 204, 21, 0.12)', borderRadius: RADIUS.LG, padding: '8px 12px' }}>
                <ExclamationTriangleIcon style={{ width: 16, height: 16, color: '#fbbf24', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 9, color: '#fbbf24', fontWeight: 600, lineheight: 1.3 }}>
                  Debes asignar exactamente {samples.length} espacios vacíos para poder aplicar el movimiento.
                </span>
              </div>
            )}

            {error && (
              <div style={{ display: 'flex', gap: 6, background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: RADIUS.LG, padding: '8px 12px' }}>
                <ExclamationTriangleIcon style={{ width: 16, height: 16, color: '#f87171', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 9, color: '#f87171', fontWeight: 600, lineheight: 1.3 }}>
                  {error}
                </span>
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
                padding: '12px',
                borderRadius: RADIUS.MD,
                fontSize: 12, fontWeight: 800,
                cursor: assignedCells.length === samples.length && !isExecuting ? 'pointer' : 'not-allowed',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                transition: 'all 0.2s',
              }}
            >
              {isExecuting ? 'Procesando...' : 'Confirmar Reubicación'}
            </button>
          </div>
        </div>

        {/* ── AREA CENTRAL: Lienzo 3D R3F ── */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
          
          {/* Overlay de Carga */}
          {loadingShelfData && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(4,6,12,0.85)',
              zIndex: 40,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 12,
            }}>
              <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.05)', borderTopColor: '#0ea5e9', borderRadius: '50%' }} />
              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700, letterSpacing: 0.5 }}>Calculando compatibilidad SGA en estante...</span>
            </div>
          )}

          {/* Mostrar Errores de Estante */}
          {shelfError && (
            <div style={{
              position: 'absolute', inset: 0,
              background: '#04060c',
              zIndex: 40,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 12,
              padding: 24,
            }}>
              <ExclamationTriangleIcon style={{ width: 40, height: 40, color: '#ef4444' }} />
              <p style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 700, margin: 0 }}>{shelfError}</p>
              <button
                onClick={() => setSelectedShelfId(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: RADIUS.MD,
                  color: '#fff',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: 12, fontWeight: 700,
                }}
              >
                Volver a la selección
              </button>
            </div>
          )}

          {/* 3D Canvas */}
          <div style={{ flex: 1, height: '100%', position: 'relative' }}>
            <Canvas camera={{ position: [0, 8, 22], fov: 40 }} gl={{ antialias: true }}>
              <color attach="background" args={['#050508']} />
              <fog attach="fog" args={['#050508', 15, 45]} />

              {/* Iluminación */}
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 20, 15]} intensity={1.8} castShadow />
              <directionalLight position={[-15, 10, -10]} intensity={1.0} color="#3b82f6" />
              <pointLight position={[0, 10, 0]} intensity={0.6} color="#0ea5e9" />

              <OrbitControls
                makeDefault
                enablePan={step === 'level'}
                enableZoom={true}
                minDistance={4}
                maxDistance={35}
                maxPolarAngle={Math.PI / 2 - 0.05}
              />

              <CameraController
                step={step}
                gridWidth={gridWidth}
                gridHeight={gridHeight}
                shelfDepth={shelfDepth}
              />

              {/* ───────────────── RENDER PASILLO (AISLE VIEW) ───────────────── */}
              {step === 'aisle' && (
                <group position={[0, 0, 0]}>
                  {compatibleShelves.map((shelf, index) => {
                    const spacingX = 5.0;
                    const totalWidth = (compatibleShelves.length - 1) * spacingX;
                    const originX = -totalWidth / 2;
                    const px = originX + index * spacingX;

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
                  <ContactShadows position={[0, -0.01, 0]} opacity={0.6} scale={25} blur={2.0} far={6} />
                </group>
              )}

              {/* ───────────────── RENDER ESTANTE (SHELF VIEW) ───────────────── */}
              {step === 'shelf' && targetMapData && (
                <group position={[0, 0, 0]}>
                  {/* Estructura metálica del anaquel */}
                  <ShelfStructure
                    totalCols={gridWidth}
                    totalDepth={shelfDepth}
                    totalLevels={gridHeight}
                  />

                  {/* Planos de nivel interactivos */}
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
                        onClick={(y) => {
                          setSelectedLevelY(y);
                          setStep('level');
                        }}
                        assignedCount={assignedByLevel[i] || 0}
                        freeCount={freePreviewByLevel[i] || 0}
                      />
                    ))}
                  </group>
                </group>
              )}

              {/* ───────────────── RENDER NIVEL (LEVEL GRID VIEW) ───────────────── */}
              {step === 'level' && targetMapData && (
                <group position={[0, 0, 0]}>
                  <GridLines cols={gridWidth} depth={shelfDepth} />

                  {/* Piso base de la cuadrícula */}
                  <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[gridWidth + 0.5, shelfDepth + 0.5]} />
                    <meshStandardMaterial color="#0b0f19" roughness={0.7} metalness={0.4} />
                  </mesh>

                  {/* 1. Muestras existentes ocupando espacio */}
                  {targetMapData.samples.map(sample => {
                    if (sample.position_y !== selectedLevelY || sample.status !== 'stored') return null;

                    const w = sample.width || 1;
                    const d = sample.depth || 1;
                    const px = -gridWidth / 2 + sample.position_x + w / 2;
                    const pz = -shelfDepth / 2 + (sample.position_z || 0) + d / 2;
                    
                    const isMovingSample = samples.some(ms => ms.id === sample.id);
                    if (isMovingSample) return null; // No renderizar en su origen

                    return (
                      <group key={`ext-${sample.id}`} position={[px, 0.32, pz]}>
                        <mesh>
                          <boxGeometry args={[w - 0.1, 0.6, d - 0.1]} />
                          <meshStandardMaterial
                            color="#334155"
                            transparent
                            opacity={0.7}
                            roughness={0.8}
                          />
                        </mesh>
                        {/* Pequeño texto identificador */}
                        <Html position={[0, 0.35, 0]} center style={{ pointerEvents: 'none' }}>
                          <span style={{ fontSize: 7, color: '#64748b', fontWeight: 700 }}>📦 Ocupado</span>
                        </Html>
                      </group>
                    );
                  })}

                  {/* 2. Celdas de previsualización (Verdes o Rojas según SGA) */}
                  {Array.from({ length: shelfDepth }).map((_, zIdx) => {
                    return Array.from({ length: gridWidth }).map((_, xIdx) => {
                      const key = `${xIdx},${selectedLevelY},${zIdx}`;
                      const cellPreview = previewCellsMap.get(key);
                      if (!cellPreview) return null;

                      // Si está ocupada por una muestra externa, no pintar celda verde/roja vacía
                      if (externalSamplesMap.has(key)) return null;

                      const isAssigned = assignedCells.some(c => c.x === xIdx && c.y === selectedLevelY && c.z === zIdx);
                      const assignmentIdx = assignedCells.findIndex(c => c.x === xIdx && c.y === selectedLevelY && c.z === zIdx);

                      const px = -gridWidth / 2 + xIdx + sampleW / 2;
                      const pz = -shelfDepth / 2 + zIdx + sampleD / 2;

                      const isCellCompatible = cellPreview.compatible;

                      let cellColor = isCellCompatible ? '#10b981' : '#ef4444';
                      if (isAssigned) cellColor = '#34d399';

                      return (
                        <group key={`cell-${xIdx}-${zIdx}`} position={[px, 0.01, pz]}>
                          {/* Plano de piso interactivo */}
                          <mesh
                            rotation={[-Math.PI / 2, 0, 0]}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isCellCompatible) {
                                handleCellClick({ x: xIdx, y: selectedLevelY, z: zIdx });
                              }
                            }}
                            onPointerOver={(e) => {
                              e.stopPropagation();
                              if (isCellCompatible) document.body.style.cursor = 'pointer';
                            }}
                            onPointerOut={() => {
                              document.body.style.cursor = 'default';
                            }}
                          >
                            <planeGeometry args={[sampleW - 0.08, sampleD - 0.08]} />
                            <meshStandardMaterial
                              color={cellColor}
                              transparent
                              opacity={isAssigned ? 0.7 : 0.25}
                              emissive={cellColor}
                              emissiveIntensity={isAssigned ? 1.0 : 0.15}
                            />
                          </mesh>

                          {/* Cubo fantasma / neón al estar asignada */}
                          {isAssigned && (
                            <mesh position={[0, 0.3, 0]}>
                              <boxGeometry args={[sampleW - 0.12, 0.6, sampleD - 0.12]} />
                              <meshPhysicalMaterial
                                color={ghsColor}
                                transparent
                                opacity={0.8}
                                roughness={0.1}
                                metalness={0.8}
                                emissive={ghsColor}
                                emissiveIntensity={0.6}
                                clearcoat={1.0}
                              />
                              <Edges color="#ffffff" transparent opacity={0.4} />
                            </mesh>
                          )}

                          {/* Etiqueta con número de orden */}
                          {isAssigned && (
                            <Html position={[0, 0.65, 0]} center style={{ pointerEvents: 'none' }}>
                              <div style={{
                                background: '#10b981',
                                color: '#fff',
                                width: 16, height: 16,
                                borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 9, fontWeight: 900,
                                boxShadow: '0 0 8px rgba(16,185,129,0.8)',
                                border: '1px solid #fff',
                              }}>
                                #{assignmentIdx + 1}
                              </div>
                            </Html>
                          )}

                          {/* Tooltip de incompatibilidad SGA */}
                          {!isCellCompatible && cellPreview.conflicts?.length > 0 && (
                            <Html position={[0, 0.1, 0]} center style={{ zIndexRange: [200, 100] }}>
                              <div className="opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none" style={{
                                background: 'rgba(239, 68, 68, 0.95)',
                                color: '#fff',
                                fontSize: 8,
                                padding: '4px 8px',
                                borderRadius: 4,
                                whiteSpace: 'nowrap',
                                boxShadow: SHADOW.TOOLTIP,
                                border: '1px solid rgba(255,255,255,0.1)',
                              }}>
                                ⚠️ Incompatible: {cellPreview.conflicts[0].reason}
                              </div>
                            </Html>
                          )}
                        </group>
                      );
                    });
                  })}
                </group>
              )}
            </Canvas>

            {/* ── HUD superior izquierdo (Información Contextual) ── */}
            <div style={{
              position: 'absolute', top: 20, left: 20,
              zIndex: 30, pointerEvents: 'none',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              {step === 'aisle' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(9, 13, 22, 0.65)', backdropFilter: BLUR.SM, padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 10px #3b82f6' }} />
                  <span style={{ fontSize: 10, color: '#e2e8f0', fontWeight: 800, letterSpacing: 0.5 }}>VISTA GENERAL DEL PASILLO (3D)</span>
                </div>
              )}
              {step === 'shelf' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(9, 13, 22, 0.65)', backdropFilter: BLUR.SM, padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#eab308', boxShadow: '0 0 10px #eab308' }} />
                  <span style={{ fontSize: 10, color: '#e2e8f0', fontWeight: 800, letterSpacing: 0.5 }}>DETALLE DE NIVELES: {targetShelfName}</span>
                </div>
              )}
              {step === 'level' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(9, 13, 22, 0.65)', backdropFilter: BLUR.SM, padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
                  <span style={{ fontSize: 10, color: '#e2e8f0', fontWeight: 800, letterSpacing: 0.5 }}>REJILLA 3D: NIVEL {selectedLevelY + 1} DE {targetShelfName}</span>
                </div>
              )}
            </div>

            {/* ── Leyenda de colores (Abajo Centro) ── */}
            <div style={{
              position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(9,13,22,0.8)', backdropFilter: BLUR.MD,
              border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20,
              padding: '6px 16px', display: 'flex', gap: 14, zIndex: 30,
              fontSize: 9, fontWeight: 700, color: '#94a3b8', whiteSpace: 'nowrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b98125', border: '1px solid #10b981' }} />
                <span>Compatible</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef444425', border: '1px solid #ef4444' }} />
                <span>SGA Incompatible</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#334155a0', border: '1px solid #475569' }} />
                <span>Ocupado</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: ghsColor, boxShadow: `0 0 6px ${ghsColor}` }} />
                <span>Lote Reubicado</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReplicaWarehouseModal;
