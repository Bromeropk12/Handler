import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { warehouseAPI } from '../../../services/api';
import LoadingSpinner from '../../../components/LoadingSpinner';
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  CubeIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowsRightLeftIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  ChartBarIcon,
  WrenchIcon,
  ArrowsPointingOutIcon
} from '@heroicons/react/24/outline';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import DefragmentationTool from './DefragmentationTool';

// SampleMesh Component
const SampleMesh = ({ cell, x, z, offsetX, offsetZ, isSelected, isDimmed, onHover, onClick, status }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const targetY = isSelected ? 0.8 + Math.sin(state.clock.elapsedTime * 2) * 0.1 : (hovered && !isDimmed ? 0.3 : 0.1);
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.1);
    const material = meshRef.current.material;
    if (material) {
      material.opacity = THREE.MathUtils.lerp(material.opacity, isDimmed ? 0.1 : 1, 0.1);
      material.transparent = true;
    }
  });

  const width = cell.width || 1;
  const depth = cell.depth || cell.height || 1;
  const px = offsetX + x + width / 2;
  const pz = offsetZ + z + depth / 2;

  let color = '#0ea5e9';
  if (status === 'expired') color = '#ef4444';
  if (status === 'warning') color = '#f59e0b';
  if (isSelected) color = '#38bdf8';

  return (
    <group position={[px, 0.1, pz]}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover(cell); }}
      onPointerOut={(e) => { setHovered(false); onHover(null); }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh ref={meshRef}>
        <boxGeometry args={[width - 0.1, 0.8, depth - 0.1]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.5} emissive={color}
          emissiveIntensity={isSelected ? 0.5 : (hovered ? 0.2 : 0)} />
      </mesh>
      {isSelected && (
        <Html position={[0, 1.2, 0]} center zIndexRange={[100, 0]}>
          <div className="bg-gray-900/95 backdrop-blur-xl border border-primary-500/30 rounded-xl p-4 w-64 shadow-2xl pointer-events-auto">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-primary-400 text-sm truncate">{cell.name}</h4>
              <button onClick={(e) => { e.stopPropagation(); onClick(); }} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-1 text-xs text-gray-300">
              <p>Lote: <span className="text-white font-medium">{cell.lot}</span></p>
              <p>Peso: <span className="text-white font-medium">{cell.weight_grams}g</span></p>
              <p>SGA: <span className="text-white font-medium">{cell.ghs_danger_class || 'N/A'}</span></p>
              <p>Vence: <strong className={status === 'expired' ? 'text-red-400' : ''}>{cell.expiration_date?.substring(0,10)}</strong></p>
              <p className="text-gray-500 font-mono">Pos: X:{cell.position_x + 1} Y:{cell.position_y + 1} Z:{(cell.position_z || 0) + 1}</p>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

// GridLines Component
const GridLines = ({ cols, depth }) => {
  const lines = [];
  const halfCols = cols / 2;
  const halfDepth = depth / 2;
  for (let i = 0; i <= cols; i++) {
    lines.push(
      <line key={`x-${i}`} position={[i - halfCols, 0.01, 0]}>
        <bufferGeometry><float32BufferAttribute attach="attributes-position" args={[new Float32Array([0, 0, -halfDepth, 0, 0, halfDepth]), 3]} /></bufferGeometry>
        <lineBasicMaterial color="#2a2d3a" />
      </line>
    );
  }
  for (let i = 0; i <= depth; i++) {
    lines.push(
      <line key={`z-${i}`} position={[0, 0.01, i - halfDepth]}>
        <bufferGeometry><float32BufferAttribute attach="attributes-position" args={[new Float32Array([-halfCols, 0, 0, halfCols, 0, 0]), 3]} /></bufferGeometry>
        <lineBasicMaterial color="#2a2d3a" />
      </line>
    );
  }
  return <group>{lines}</group>;
};

// AxisLabels Component
const AxisLabels = ({ cols, depth }) => (
  <group>
    <Html position={[cols / 2 + 1.5, 0, 0]} center>
      <div className="text-[10px] font-bold text-blue-400 bg-black/60 px-2 py-1 rounded border border-blue-500/30">X → Columna</div>
    </Html>
    <Html position={[0, 0, depth / 2 + 1.5]} center>
      <div className="text-[10px] font-bold text-green-400 bg-black/60 px-2 py-1 rounded border border-green-500/30">Z → Profundidad</div>
    </Html>
  </group>
);

// EmptyState3D Component
const EmptyState3D = ({ shelfName, totalCols, totalDepth, totalLevels }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900/80 to-gray-800/80">
    <div className="text-center animate-fade-in px-8">
      <div className="w-28 h-28 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-gray-600">
        <CubeIcon className="w-14 h-14 text-gray-500" />
      </div>
      <h4 className="text-2xl font-bold text-gray-200 mb-2">Anaquel Vacío</h4>
      <p className="text-sm text-gray-400 max-w-sm mx-auto mb-6">
        No hay muestras colocadas en <strong className="text-primary-400">{shelfName}</strong>.
      </p>
      <div className="grid grid-cols-3 gap-3 mb-6 max-w-xs mx-auto">
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-primary-400">{totalCols}</p>
          <p className="text-[10px] text-gray-500 uppercase">Columnas</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-yellow-400">{totalLevels}</p>
          <p className="text-[10px] text-gray-500 uppercase">Niveles</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-green-400">{totalDepth}</p>
          <p className="text-[10px] text-gray-500 uppercase">Profundidad</p>
        </div>
      </div>
      <p className="text-xs text-gray-600">Usa la herramienta de dispensación para agregar muestras</p>
    </div>
  </div>
);

// ==========================================
// ShelfMap3D - Componente Principal con Layout 3-6-3
// ==========================================
const ShelfMap3D = ({ selectedShelf, onBack }) => {
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [selectedDepth, setSelectedDepth] = useState(0);
  const [selectedCell, setSelectedCell] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [showExpired, setShowExpired] = useState(true);
  const [showWarnings, setShowWarnings] = useState(true);
  const [showDefragTool, setShowDefragTool] = useState(false);
  const [cameraView, setCameraView] = useState('default');
  const canvasContainerRef = useRef(null);

  const fetchMapData = useCallback(async () => {
    if (!selectedShelf) return;
    try {
      setLoading(true);
      const response = await warehouseAPI.getShelfMap(selectedShelf.id);
      setMapData(response.data.data);
      setError(null);
    } catch (_err) {
      setError('Error al cargar el mapa del anaquel');
    } finally {
      setLoading(false);
    }
  }, [selectedShelf]);

  useEffect(() => { fetchMapData(); }, [fetchMapData]);

  // Navegación por scroll
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container || !mapData) return;
    const handleWheel = (e) => {
      e.preventDefault();
      if (e.shiftKey) {
        const totalDepth = mapData.shelf.shelf_depth || 10;
        setSelectedDepth(prev => e.deltaY > 0 ? Math.min(totalDepth - 1, prev + 1) : Math.max(0, prev - 1));
      } else {
        const totalLevels = mapData.shelf.grid_height || 10;
        setSelectedLevel(prev => e.deltaY > 0 ? Math.min(totalLevels - 1, prev + 1) : Math.max(0, prev - 1));
      }
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [mapData]);

  // Matriz 3D
  const gridMatrix3D = useMemo(() => {
    if (!mapData) return null;
    if (mapData.grid_matrix_3d) return mapData.grid_matrix_3d;
    const levels = mapData.shelf.grid_height || 10;
    const depth = mapData.shelf.shelf_depth || 10;
    const cols = mapData.shelf.grid_width || 10;
    const matrix = Array(levels).fill(null).map(() => Array(depth).fill(null).map(() => Array(cols).fill(null)));
    mapData.samples.forEach(sample => {
      const startX = sample.position_x, startY = sample.position_y, startZ = sample.position_z || 0;
      const w = sample.width || 1, h = sample.height || 1, d = sample.depth || 1;
      for (let y = startY; y < startY + h && y < levels; y++) {
        for (let z = startZ; z < startZ + d && z < depth; z++) {
          for (let x = startX; x < startX + w && x < cols; x++) {
            matrix[y][z][x] = {
              sample_id: sample.id,
              is_main_cell: x === startX && y === startY && z === startZ,
              ...(x === startX && y === startY && z === startZ ? {
                name: sample.global_sample_name, lot: sample.lot, weight_grams: sample.weight_grams,
                ghs_danger_class: sample.ghs_danger_class, expiration_date: sample.expiration_date,
                qr_code: sample.qr_code, position_x: sample.position_x, position_y: sample.position_y,
                position_z: sample.position_z || 0, width: w, height: h, depth: d
              } : {}),
            };
          }
        }
      }
    });
    return matrix;
  }, [mapData]);

  const currentDepthGrid = useMemo(() => (gridMatrix3D?.[selectedLevel] || [])[selectedDepth] || [], [gridMatrix3D, selectedLevel, selectedDepth]);

  // Estadísticas del ANAQUEL COMPLETO (no solo del nivel actual)
  const shelfStats = useMemo(() => {
    if (!mapData) return { occupied: 0, free: 0, expired: 0, warning: 0, occupancyPercent: 0, totalCapacity: 0 };
    const totalCapacity = mapData.shelf.total_capacity || (mapData.shelf.grid_width || 10) * (mapData.shelf.grid_height || 10) * (mapData.shelf.shelf_depth || 10);
    const totalSamples = mapData.samples.length;
    let expired = 0, warning = 0;
    const now = new Date();
    mapData.samples.forEach(s => {
      const exp = new Date(s.expiration_date);
      if (exp < now) expired++;
      else if (exp < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)) warning++;
    });
    return {
      occupied: totalSamples,
      free: Math.max(0, totalCapacity - totalSamples),
      expired,
      warning,
      occupancyPercent: totalCapacity > 0 ? Math.round((totalSamples / totalCapacity) * 100) : 0,
      totalCapacity
    };
  }, [mapData]);

  const getCellStatus = cell => {
    if (!cell) return 'empty';
    const now = new Date(), exp = new Date(cell.expiration_date);
    if (exp < now) return 'expired';
    if (exp < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)) return 'warning';
    return 'occupied';
  };

  const shouldShowCell = cell => {
    if (!cell) return true;
    const status = getCellStatus(cell);
    if (status === 'expired' && !showExpired) return false;
    if (status === 'warning' && !showWarnings) return false;
    return true;
  };

  const getCameraPosition = () => {
    switch (cameraView) {
      case 'top': return [0, 15, 0];
      case 'front': return [0, 2, 15];
      default: return [0, 8, 12];
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><LoadingSpinner size="large" text={`Cargando ${selectedShelf?.name}...`} /></div>;
  if (error) return (
    <div className="text-center py-20">
      <ExclamationTriangleIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
      <h3 className="text-lg font-semibold text-gray-300 mb-1">Error de conexión</h3>
      <p className="text-sm text-gray-500 mb-4">{error}</p>
      <div className="flex items-center justify-center gap-3">
        <button onClick={fetchMapData} className="btn-primary">Reintentar</button>
        <button onClick={onBack} className="btn-secondary">Volver</button>
      </div>
    </div>
  );

  const totalLevels = mapData.shelf.grid_height || 10;
  const totalDepth = mapData.shelf.shelf_depth || 10;
  const totalCols = mapData.shelf.grid_width || 10;
  const totalSamples = mapData.samples.length;
  const occupancyPercent = mapData.shelf.total_capacity > 0 ? Math.round((totalSamples / mapData.shelf.total_capacity) * 100) : 0;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* HEADER */}
      <div className="flex items-center justify-between bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-lg transition-colors"><ArrowLeftIcon className="w-5 h-5 text-gray-400" /></button>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><CubeIcon className="w-6 h-6 text-primary-400" />{selectedShelf?.name}</h2>
            <p className="text-xs text-gray-400">{selectedShelf?.provider && `${selectedShelf.provider} • `}{mapData.shelf.market_line_name || 'Sin línea'} • {totalCols}×{totalLevels}×{totalDepth} • {totalSamples} muestras • {occupancyPercent}% ocupado</p>
          </div>
        </div>
        <button onClick={fetchMapData} className="p-2 hover:bg-gray-800 rounded-lg transition-colors" title="Actualizar"><ArrowPathIcon className="w-5 h-5 text-gray-400" /></button>
      </div>

      {/* LAYOUT 3-6-3 */}
      <div className="grid grid-cols-12 gap-4 items-start">
        {/* PANEL IZQUIERDO (3 cols) */}
        <div className="col-span-3 space-y-4">
          {/* Selector Nivel (Y) */}
          <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-200 text-sm flex items-center gap-1.5"><ChartBarIcon className="w-4 h-4 text-yellow-400" />Nivel (Y)</h3>
              <span className="text-xs font-mono text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded">{selectedLevel + 1}/{totalLevels}</span>
            </div>
            <div className="flex flex-col items-center gap-1 max-h-64 overflow-y-auto">
              {Array.from({ length: totalLevels }).reverse().map((_, i) => {
                const levelIndex = totalLevels - 1 - i;
                const isSelected = levelIndex === selectedLevel;
                const itemsInLevel = mapData.samples.filter(s => s.position_y === levelIndex).length;
                return (
                  <button key={levelIndex} onClick={() => setSelectedLevel(levelIndex)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-all duration-200 ${isSelected ? 'bg-primary-500/20 text-primary-300 font-bold border border-primary-500/50' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 border border-transparent'}`}>
                    <span className="font-mono">{levelIndex + 1}</span>
                    {itemsInLevel > 0 && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary-400' : 'bg-gray-600'}`}></span>}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-3">
              <button onClick={() => setSelectedLevel(Math.max(0, selectedLevel - 1))} disabled={selectedLevel === 0} className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30"><ChevronDownIcon className="w-4 h-4" /></button>
              <span className="text-[10px] text-gray-600">Scroll ↑↓</span>
              <button onClick={() => setSelectedLevel(Math.min(totalLevels - 1, selectedLevel + 1))} disabled={selectedLevel === totalLevels - 1} className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30"><ChevronUpIcon className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Selector Profundidad (Z) */}
          <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-200 text-sm flex items-center gap-1.5"><InformationCircleIcon className="w-4 h-4 text-green-400" />Profundidad (Z)</h3>
              <span className="text-xs font-mono text-green-400 bg-green-500/10 px-2 py-0.5 rounded">{selectedDepth + 1}/{totalDepth}</span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {Array.from({ length: totalDepth }).map((_, i) => {
                const isSelected = i === selectedDepth;
                const itemsInDepth = mapData.samples.filter(s => (s.position_z || 0) === i).length;
                return (
                  <button key={i} onClick={() => setSelectedDepth(i)}
                    className={`w-full aspect-square flex flex-col items-center justify-center rounded-lg text-[9px] transition-all duration-200 ${isSelected ? 'bg-green-500/20 text-green-300 font-bold border border-green-500/50' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 border border-transparent'}`}
                    title={`Profundidad ${i + 1}${itemsInDepth > 0 ? ` (${itemsInDepth})` : ''}`}>
                    {i + 1}
                    {itemsInDepth > 0 && <span className="w-1 h-1 rounded-full bg-green-500 mt-0.5"></span>}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-3">
              <button onClick={() => setSelectedDepth(Math.max(0, selectedDepth - 1))} disabled={selectedDepth === 0} className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30"><ChevronLeftIcon className="w-4 h-4" /></button>
              <span className="text-[10px] text-gray-600">Shift+Scroll</span>
              <button onClick={() => setSelectedDepth(Math.min(totalDepth - 1, selectedDepth + 1))} disabled={selectedDepth === totalDepth - 1} className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30"><ChevronRightIcon className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {/* CANVAS CENTRAL (6 cols) */}
        <div className="col-span-6">
          <div className="bg-gray-900/50 rounded-xl border border-gray-700/50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
              <div>
                <h3 className="font-semibold text-gray-200 text-sm flex items-center gap-2"><CubeIcon className="w-4 h-4 text-primary-400" />Vista Isométrica 3D</h3>
                <p className="text-xs text-gray-500 mt-0.5">Nivel {selectedLevel + 1} • Profundidad {selectedDepth + 1} • Columnas {totalCols}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-gray-800/50 rounded-lg p-1">
                  <button onClick={() => setCameraView('default')} className={`p-1.5 rounded ${cameraView === 'default' ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400 hover:text-white'}`} title="Default"><ArrowsPointingOutIcon className="w-4 h-4" /></button>
                  <button onClick={() => setCameraView('top')} className={`p-1.5 rounded ${cameraView === 'top' ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400 hover:text-white'}`} title="Superior"><EyeIcon className="w-4 h-4" /></button>
                  <button onClick={() => setCameraView('front')} className={`p-1.5 rounded ${cameraView === 'front' ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400 hover:text-white'}`} title="Frontal"><ChartBarIcon className="w-4 h-4" /></button>
                </div>
                <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-1.5">
                  <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={showExpired} onChange={e => setShowExpired(e.target.checked)} className="w-3 h-3 rounded" /><span className="text-xs text-gray-400">Vencidas</span></label>
                  <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={showWarnings} onChange={e => setShowWarnings(e.target.checked)} className="w-3 h-3 rounded" /><span className="text-xs text-gray-400">Alertas</span></label>
                </div>
              </div>
            </div>

            <div ref={canvasContainerRef} className="relative bg-black/40 min-h-[550px] cursor-move">
              {mapData.samples.length === 0 ? (
                <EmptyState3D shelfName={selectedShelf?.name} totalCols={totalCols} totalDepth={totalDepth} totalLevels={totalLevels} />
              ) : (
                <Canvas camera={{ position: getCameraPosition(), fov: 45 }}>
                  <color attach="background" args={['#0f0f13']} />
                  <ambientLight intensity={0.5} />
                  <directionalLight position={[10, 20, 10]} intensity={1.5} />
                  <directionalLight position={[-10, 10, -10]} intensity={0.3} color="#38bdf8" />
                  <OrbitControls enablePan enableZoom enableRotate minPolarAngle={Math.PI / 6} maxPolarAngle={Math.PI / 2.2} minAzimuthAngle={-Math.PI / 3} maxAzimuthAngle={Math.PI / 3} />
                  <group position={[0, -0.5, 0]}>
                    <mesh position={[0, -0.1, 0]}><boxGeometry args={[totalCols, 0.2, totalDepth]} /><meshStandardMaterial color="#1f222e" roughness={0.9} metalness={0.1} /></mesh>
                    <GridLines cols={totalCols} depth={totalDepth} />
                    <mesh position={[0, 0.4, -totalDepth / 2 - 0.1]}><boxGeometry args={[totalCols, 1.2, 0.2]} /><meshStandardMaterial color="#111827" metalness={0.8} roughness={0.4} /></mesh>
                    <mesh position={[0, 0, totalDepth / 2 + 0.05]}><boxGeometry args={[totalCols, 0.05, 0.1]} /><meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.5} /></mesh>
                    <AxisLabels cols={totalCols} depth={totalDepth} />
                    {currentDepthGrid.map((cell, x) => {
                      if (!cell || !cell.is_main_cell) return null;
                      const isFocusingOne = Boolean(selectedCell || hoveredCell);
                      const isSelected = selectedCell?.x === x && selectedCell?.level === selectedLevel && selectedCell?.z === selectedDepth;
                      const isVisible = shouldShowCell(cell);
                      const isDimmed = !isVisible || (isFocusingOne && !isSelected && !(hoveredCell?.x === x && hoveredCell?.z === selectedDepth));
                      return (
                        <SampleMesh key={`${x}-${selectedDepth}`} cell={cell} x={x} z={selectedDepth} offsetX={-totalCols / 2} offsetZ={-totalDepth / 2} isSelected={isSelected} isDimmed={isDimmed} status={getCellStatus(cell)}
                          onHover={(cellData) => setHoveredCell(cellData ? { x, z: selectedDepth, level: selectedLevel, cell: cellData } : null)}
                          onClick={() => setSelectedCell(isSelected ? null : { x, z: selectedDepth, level: selectedLevel, cell })} />
                      );
                    })}
                  </group>
                </Canvas>
              )}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-gray-400 bg-black/60 px-3 py-1.5 rounded-lg border border-gray-700/50">📍 X:{selectedCell?.x !== undefined ? selectedCell.x + 1 : '-'} Y:{selectedCell?.level !== undefined ? selectedCell.level + 1 : '-'} Z:{selectedCell?.z !== undefined ? selectedCell.z + 1 : '-'}</span>
                  <span className="text-xs font-mono text-gray-500 bg-black/60 px-3 py-1.5 rounded-lg border border-gray-700/50">📷 {cameraView === 'default' ? 'Default' : cameraView === 'top' ? 'Superior' : 'Frontal'}</span>
                </div>
                <span className="text-xs text-gray-600 bg-black/60 px-3 py-1.5 rounded-lg border border-gray-700/50">WebGL 3D • Arrastra para rotar</span>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL DERECHO (3 cols) */}
        <div className="col-span-3 space-y-4">
          {/* Estadísticas */}
          <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
            <h3 className="font-semibold text-gray-200 text-sm flex items-center gap-1.5 mb-3"><ChartBarIcon className="w-4 h-4 text-blue-400" />Estadísticas</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1"><span className="text-gray-400">Ocupación</span><span className="text-primary-400 font-mono">{shelfStats.occupancyPercent}%</span></div>
                <div className="w-full bg-gray-800 rounded-full h-2"><div className="bg-primary-500 h-full rounded-full transition-all duration-500" style={{ width: `${shelfStats.occupancyPercent}%` }}></div></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-800/50 rounded-lg p-2 text-center"><p className="text-lg font-bold text-blue-400">{shelfStats.occupied}</p><p className="text-[10px] text-gray-500 uppercase">Ocupadas</p></div>
                <div className="bg-gray-800/50 rounded-lg p-2 text-center"><p className="text-lg font-bold text-gray-400">{shelfStats.free}</p><p className="text-[10px] text-gray-500 uppercase">Libres</p></div>
                {shelfStats.warning > 0 && <div className="bg-gray-800/50 rounded-lg p-2 text-center"><p className="text-lg font-bold text-yellow-400">{shelfStats.warning}</p><p className="text-[10px] text-gray-500 uppercase">Alertas</p></div>}
                {shelfStats.expired > 0 && <div className="bg-gray-800/50 rounded-lg p-2 text-center"><p className="text-lg font-bold text-red-400">{shelfStats.expired}</p><p className="text-[10px] text-gray-500 uppercase">Vencidas</p></div>}
              </div>
            </div>
          </div>

          {/* Muestra Seleccionada */}
          {selectedCell?.cell && (
            <div className="bg-gray-900/50 rounded-xl p-4 border border-primary-500/30 animate-fade-in">
              <h3 className="font-semibold text-gray-200 text-sm flex items-center gap-1.5 mb-3"><CubeIcon className="w-4 h-4 text-primary-400" />Muestra Seleccionada</h3>
              <div className="space-y-2 text-xs">
                <p className="text-primary-400 font-bold truncate">{selectedCell.cell.name}</p>
                <div className="space-y-1 text-gray-400">
                  <p>Lote: <span className="text-white">{selectedCell.cell.lot}</span></p>
                  <p>Peso: <span className="text-white">{selectedCell.cell.weight_grams}g</span></p>
                  <p>SGA: <span className="text-white">{selectedCell.cell.ghs_danger_class}</span></p>
                  <p>Vence: <span className={getCellStatus(selectedCell.cell) === 'expired' ? 'text-red-400' : 'text-white'}>{selectedCell.cell.expiration_date?.substring(0,10)}</span></p>
                  <p className="font-mono text-gray-500">Pos: X:{selectedCell.x + 1} Y:{selectedCell.level + 1} Z:{selectedCell.z + 1}</p>
                </div>
              </div>
            </div>
          )}

          {/* Herramientas */}
          <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
            <h3 className="font-semibold text-gray-200 text-sm flex items-center gap-1.5 mb-3"><WrenchIcon className="w-4 h-4 text-gray-400" />Herramientas</h3>
            <button onClick={() => setShowDefragTool(!showDefragTool)}
              className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 text-sm ${showDefragTool ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-white border border-gray-700/50'}`}>
              <ArrowsRightLeftIcon className="w-4 h-4" />Desfragmentar
            </button>
          </div>
        </div>
      </div>

      {/* LEYENDA */}
      <div className="flex items-center justify-center gap-6 py-3 bg-gray-900/30 rounded-xl border border-gray-700/30">
        {[{ color: 'bg-blue-500', label: 'Ocupado' }, { color: 'bg-yellow-500', label: 'Por vencer' }, { color: 'bg-red-500 animate-pulse', label: 'Vencido' }, { color: 'bg-gray-700', label: 'Libre' }, { color: 'border-2 border-primary-500', label: 'Seleccionado' }].map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded ${item.color}`}></div>
            <span className="text-xs text-gray-400">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Defragmentation Tool */}
      {showDefragTool && (
        <div className="fixed right-4 top-20 w-96 z-50 animate-slide-in-right">
          <DefragmentationTool shelfId={selectedShelf.id} onMovementConfirmed={fetchMapData} onFinished={() => setShowDefragTool(false)} />
        </div>
      )}
    </div>
  );
};

export default ShelfMap3D;