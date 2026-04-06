import React, { useState, useEffect, useMemo, useRef } from 'react';
import { warehouseAPI } from '../../../services/api';
import LoadingSpinner from '../../../components/LoadingSpinner';
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CubeIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowsRightLeftIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import DefragmentationTool from './DefragmentationTool';

// Mesh individual para cada caja, permitiendo animación limpia
const SampleMesh = ({ cell, x, z, offsetX, offsetZ, isSelected, isDimmed, onHover, onClick, status }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  // Animar levitación
  useFrame((state) => {
    if (!meshRef.current) return;
    const targetY = isSelected ? 0.8 + Math.sin(state.clock.elapsedTime * 2) * 0.1 : (hovered && !isDimmed ? 0.3 : 0.1);
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.1);
    
    // Animar opacidad si está dimmed
    const material = meshRef.current.material;
    if (material) {
      const targetOpacity = isDimmed ? 0.1 : 1;
      material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity, 0.1);
      material.transparent = true;
    }
  });

  const width = cell.width || 1;
  const depth = cell.depth || cell.height || 1;
  
  // Posición real geométrica
  const px = offsetX + x + width / 2;
  const pz = offsetZ + z + depth / 2;

  // Colors
  let color = '#0ea5e9'; // Ocupado
  if (status === 'expired') color = '#ef4444';
  if (status === 'warning') color = '#f59e0b';
  
  if (isSelected) color = '#38bdf8'; // Resalte activo

  return (
    <group 
      position={[px, 0.1, pz]}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover(cell); }}
      onPointerOut={(e) => { setHovered(false); onHover(null); }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      <mesh ref={meshRef}>
        <boxGeometry args={[width - 0.1, 0.8, depth - 0.1]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.3} 
          metalness={0.5} 
          emissive={color}
          emissiveIntensity={isSelected ? 0.5 : (hovered ? 0.2 : 0)}
        />
      </mesh>
      
      {/* Etiqueta HTML 3D Flotante si está seleccionado */}
      {isSelected && (
        <Html position={[0, 1.2, 0]} center zIndexRange={[100, 0]}>
          <div className="bg-surface-600/90 backdrop-blur-xl border border-gray-500/30 rounded-xl p-4 w-64 shadow-2xl pointer-events-auto transform transition-all">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-primary-400 text-sm truncate">{cell.name}</h4>
              <button onClick={(e) => { e.stopPropagation(); onClick(); }} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-1 text-xs text-gray-300">
              <p>Lote: <span className="text-white font-medium">{cell.lot}</span></p>
              <p>Peso: <span className="text-white font-medium">{cell.weight_grams}g</span></p>
              <p>SGA: <span className="text-white font-medium">{cell.ghs_danger_class || 'N/A'}</span></p>
              <p>Vence: <strong className={status === 'expired' ? 'text-danger-400' : ''}>{cell.expiration_date?.substring(0,10)}</strong></p>
            </div>
            <button className="w-full mt-3 btn-primary py-1.5 text-xs shadow-glow-red">Gestionar</button>
          </div>
        </Html>
      )}
    </group>
  );
};

const ShelfMap3D = ({ selectedShelf, onBack }) => {
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 3D Specific State
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [selectedDepth, setSelectedDepth] = useState(0);
  
  const [selectedCell, setSelectedCell] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [showExpired, setShowExpired] = useState(true);
  const [showWarnings, setShowWarnings] = useState(true);
  const [showDefragTool, setShowDefragTool] = useState(false);

  const fetchMapData = async () => {
    if (!selectedShelf) return;
    try {
      setLoading(true);
      const response = await warehouseAPI.getShelfMap(selectedShelf.id);
      setMapData(response.data.data);
    } catch (_err) {
      setError('Error al cargar el mapa del anaquel');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, [selectedShelf]);

  // Construimos matriz 3D en el Frontend (Y x Z x X) desde grid_matrix_3d del backend
  const gridMatrix3D = useMemo(() => {
    if (!mapData) return null;
    // Usar la matriz 3D del backend si está disponible, sino construir manualmente
    if (mapData.grid_matrix_3d) return mapData.grid_matrix_3d;
    
    const levels = mapData.shelf.grid_height || 10;
    const depth = mapData.shelf.shelf_depth || 10;
    const cols = mapData.shelf.grid_width || 10;

    const matrix = Array(levels).fill(null).map(() =>
      Array(depth).fill(null).map(() => Array(cols).fill(null))
    );

    mapData.samples.forEach(sample => {
      const startX = sample.position_x;
      const startY = sample.position_y;
      const startZ = sample.position_z || 0;
      const width = sample.width || 1;
      const height = sample.height || 1;
      const sampleDepth = sample.depth || 1;

      for (let y = startY; y < startY + height && y < levels; y++) {
        for (let z = startZ; z < startZ + sampleDepth && z < depth; z++) {
          for (let x = startX; x < startX + width && x < cols; x++) {
            matrix[y][z][x] = {
              sample_id: sample.id,
              is_main_cell: x === startX && y === startY && z === startZ,
              ...(x === startX && y === startY && z === startZ ? {
                name: sample.global_sample_name,
                lot: sample.lot,
                weight_grams: sample.weight_grams,
                ghs_danger_class: sample.ghs_danger_class,
                expiration_date: sample.expiration_date,
                qr_code: sample.qr_code,
                position_x: sample.position_x,
                position_y: sample.position_y,
                position_z: sample.position_z || 0,
                width,
                height,
                depth: sampleDepth
              } : {}),
            };
          }
        }
      }
    });
    return matrix;
  }, [mapData]);

  const getCellStatus = cell => {
    if (!cell) return 'empty';
    const now = new Date();
    const exp = new Date(cell.expiration_date);
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



  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="large" text={`Cargando modelo 3D de ${selectedShelf?.name}...`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <ExclamationTriangleIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-300 mb-1">Error de conexión</h3>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => window.location.reload()} className="btn-primary">Reintentar</button>
          <button onClick={onBack} className="btn-secondary">Volver</button>
        </div>
      </div>
    );
  }

  const expiredCount = mapData.samples.filter(s => new Date(s.expiration_date) < new Date()).length;
  const warningCount = mapData.samples.filter(s => {
    const exp = new Date(s.expiration_date);
    const now = new Date();
    return exp >= now && exp < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }).length;

  const totalLevels = mapData.shelf.grid_height || 10;
  const totalDepth = mapData.shelf.shelf_depth || 10;
  const totalCols = mapData.shelf.grid_width || 10;
  
  // gridMatrix3D[y][z][x] - obtener el nivel y profundidad actuales
  const currentDepthGrid = (gridMatrix3D[selectedLevel] || [])[selectedDepth] || [];
  
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <CubeIcon className="w-6 h-6 text-primary-400" />
              Vista 3D — {selectedShelf?.name}
            </h2>
            <p className="text-sm text-gray-400">
              {selectedShelf?.provider && `${selectedShelf.provider} · `}
              {totalCols} Columnas × {totalLevels} Niveles × {totalDepth} Profundidad
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-4 card-glass px-4 py-2 rounded-xl">
            <div className="text-center px-3 border-r border-gray-700/50">
              <p className="text-lg font-bold text-white leading-none">{mapData.samples.length}</p>
              <p className="text-xxs text-gray-500 mt-1 uppercase tracking-wider">Muestras</p>
            </div>
            {expiredCount > 0 && (
              <div className="flex flex-col items-center px-3 border-r border-gray-700/50 text-danger-400">
                <p className="text-lg font-bold leading-none">{expiredCount}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ExclamationTriangleIcon className="w-3 h-3" />
                  <p className="text-xxs uppercase tracking-wider">Vencidas</p>
                </div>
              </div>
            )}
            {warningCount > 0 && (
              <div className="flex flex-col items-center px-3 text-warning-400">
                <p className="text-lg font-bold leading-none">{warningCount}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ClockIcon className="w-3 h-3" />
                  <p className="text-xxs uppercase tracking-wider">Alertas</p>
                </div>
              </div>
            )}
          </div>
          <button onClick={onBack} className="btn-ghost hover:bg-surface-500/50 transition-colors">
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Volver
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5 items-start">
        {/* Selector de Nivel (Eje Y) */}
        <div className="col-span-2 card p-4 flex flex-col items-center justify-between min-h-[500px]">
          <div className="text-center mb-4">
            <h3 className="font-semibold text-gray-200">Eje Y</h3>
            <p className="text-xs text-gray-500">Niveles</p>
          </div>
          
          <div className="flex flex-col items-center w-full gap-2 relative h-full">
            <button 
              onClick={() => setSelectedLevel(Math.min(totalLevels - 1, selectedLevel + 1))}
              disabled={selectedLevel === totalLevels - 1}
              className="p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400"
            >
              <ChevronUpIcon className="w-6 h-6" />
            </button>
            
            <div className="flex-1 flex flex-col justify-between w-full py-4 border-y border-gray-700/30">
              {Array.from({ length: totalLevels }).map((_, i) => {
                const isSelected = totalLevels - 1 - i === selectedLevel;
                const levelIndex = totalLevels - 1 - i;
                const displayLevel = levelIndex + 1; // UI en base 1
                // Check if this level has samples
                const itemsInLevel = mapData.samples.filter(s => s.position_y === levelIndex).length;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedLevel(levelIndex)}
                    className={`
                      w-full relative py-2 transition-all duration-300 rounded overflow-hidden group
                      ${isSelected 
                        ? 'bg-primary-500/20 text-primary-300 font-bold border border-primary-500/50 shadow-[0_0_15px_rgba(var(--color-primary-500),0.15)]' 
                        : 'text-gray-500 hover:text-gray-300 hover:bg-surface-400/50 border border-transparent'}
                    `}
                  >
                    <div className="relative z-10 flex items-center justify-between px-3">
                      <span>{displayLevel}</span>
                      {itemsInLevel > 0 && (
                        <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary-400' : 'bg-gray-600'}`}></div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <button 
              onClick={() => setSelectedLevel(Math.max(0, selectedLevel - 1))}
              disabled={selectedLevel === 0}
              className="p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400"
            >
              <ChevronDownIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="mt-6 border-t border-gray-700/30 pt-4 w-full">
            <div className="text-center mb-3">
              <h3 className="font-semibold text-gray-200 text-xs">Eje Z</h3>
              <p className="text-[10px] text-gray-500">Profundidad</p>
            </div>
            <div className="flex items-center justify-between gap-1 mb-2">
              <button 
                onClick={() => setSelectedDepth(Math.max(0, selectedDepth - 1))}
                disabled={selectedDepth === 0}
                className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <div className="flex-1 flex gap-1 justify-center flex-wrap">
                {Array.from({ length: totalDepth }).map((_, i) => {
                  const isSelected = i === selectedDepth;
                  const itemsInDepth = mapData.samples.filter(s => (s.position_z || 0) === i).length;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDepth(i)}
                      className={`
                        w-6 h-6 text-[9px] rounded transition-all duration-200
                        ${isSelected 
                          ? 'bg-primary-500/30 text-primary-300 font-bold border border-primary-500/50' 
                          : 'text-gray-500 hover:text-gray-300 hover:bg-surface-400/50 border border-transparent'}
                      `}
                      title={`Profundidad ${i + 1}${itemsInDepth > 0 ? ` (${itemsInDepth} muestras)` : ''}`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              <button 
                onClick={() => setSelectedDepth(Math.min(totalDepth - 1, selectedDepth + 1))}
                disabled={selectedDepth === totalDepth - 1}
                className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 border-t border-gray-700/30 pt-4 w-full">
            <button
               onClick={() => setShowDefragTool(!showDefragTool)}
               className={`w-full py-3 rounded-xl flex flex-col items-center justify-center gap-2 transition-all duration-300 border ${
                 showDefragTool 
                   ? 'bg-primary-500/10 border-primary-500/50 text-primary-400' 
                   : 'bg-surface-500/30 border-gray-700/50 text-gray-400 hover:bg-surface-500/50 hover:text-white'
               }`}
            >
              <ArrowsRightLeftIcon className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Optimizar</span>
            </button>
          </div>
        </div>

        {/* Top-Down Grid (Ejes X y Z) */}
        <div className={showDefragTool ? 'col-span-6 card p-6' : 'col-span-10 card p-6 animate-all duration-300'}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-200">Vista Isométrica 3D</h3>
              <p className="text-xs text-gray-500">Nivel actual: Nivel {selectedLevel + 1} · Profundidad: {selectedDepth + 1}</p>
            </div>
            
            <div className="flex items-center gap-4 bg-surface-500/30 px-4 py-2 rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={showExpired}
                  onChange={e => setShowExpired(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-surface-400 text-danger-400 focus:ring-danger-400/50 transition-colors cursor-pointer group-hover:border-danger-400/50"
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Vencidas</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={showWarnings}
                  onChange={e => setShowWarnings(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-surface-400 text-warning-400 focus:ring-warning-400/50 transition-colors cursor-pointer group-hover:border-warning-400/50"
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Alertas</span>
              </label>
            </div>
          </div>

          {/* WebGL 3D Canvas */}
          <div className="flex-1 rounded-xl overflow-hidden bg-black/40 border border-gray-700/50 relative shadow-2xl min-h-[600px] cursor-move">
            <Canvas camera={{ position: [0, 8, 12], fov: 45 }}>
              <color attach="background" args={['#0f0f13']} />
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 20, 10]} intensity={1.5} />
              <directionalLight position={[-10, 10, -10]} intensity={0.3} color="#38bdf8" />
              
              <OrbitControls
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                minPolarAngle={Math.PI / 6} /* No permitir ver totalmente desde arriba */
                maxPolarAngle={Math.PI / 2.2} /* Evitar rotar por debajo del piso */
                minAzimuthAngle={-Math.PI / 3} /* Restringir rotar totalmente hacia atrás, mantener foco en el frente */
                maxAzimuthAngle={Math.PI / 3}
              />
              
              <group position={[0, -0.5, 0]}>
                {/* Panel Base del Anaquel: X=width, Z=depth */}
                <mesh position={[0, -0.1, 0]}>
                  <boxGeometry args={[totalCols, 0.2, totalDepth]} />
                  <meshStandardMaterial color="#1f222e" roughness={0.9} metalness={0.1} />
                </mesh>
                
                {/* Pared de Fondo (Back wall) */}
                <mesh position={[0, 0.4, -totalDepth / 2 - 0.1]}>
                  <boxGeometry args={[totalCols, 1.2, 0.2]} />
                  <meshStandardMaterial color="#111827" metalness={0.8} roughness={0.4} />
                </mesh>

                {/* Borde Frontal Iluminado (Frente) */}
                <mesh position={[0, 0, totalDepth / 2 + 0.05]}>
                  <boxGeometry args={[totalCols, 0.05, 0.1]} />
                  <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.5} />
                </mesh>

                {/* Cuadricula Visual para Guía de Coordenadas */}
                <gridHelper 
                  args={[Math.max(totalCols, totalDepth), Math.max(totalCols, totalDepth), '#3b4252', '#2e3440']} 
                  position={[0, 0.01, 0]} 
                />

                {/* Renderizar Cajas / Muestras - currentDepthGrid[x] */}
                {currentDepthGrid.map((cell, x) => {
                  if (!cell || !cell.is_main_cell) return null;
                  const isFocusingOne = Boolean(selectedCell || hoveredCell);
                  const isSelected = selectedCell?.x === x && selectedCell?.level === selectedLevel && selectedCell?.z === selectedDepth;
                  const isVisible = shouldShowCell(cell);
                  const isDimmed = !isVisible || (isFocusingOne && !isSelected && !(hoveredCell?.x === x && hoveredCell?.z === selectedDepth));
                  
                  const offsetX = -totalCols / 2;
                  const offsetZ = -totalDepth / 2;

                  return (
                    <SampleMesh
                      key={`${x}-${selectedDepth}`}
                      cell={cell}
                      x={x}
                      z={selectedDepth}
                      offsetX={offsetX}
                      offsetZ={offsetZ}
                      isSelected={isSelected}
                      isDimmed={isDimmed}
                      status={getCellStatus(cell)}
                      onHover={(cellData) => setHoveredCell(cellData ? { x, z: selectedDepth, level: selectedLevel, cell: cellData } : null)}
                      onClick={() => setSelectedCell(isSelected ? null : { x, z: selectedDepth, level: selectedLevel, cell })}
                    />
                  );
                })}
              </group>
            </Canvas>
            
            <div className="absolute bottom-4 left-4 pointer-events-none">
              <span className="text-xs font-bold text-primary-500 bg-surface-600/80 backdrop-blur-md px-3 py-1.5 rounded border border-gray-700/50 shadow-lg flex items-center gap-2">
                <CubeIcon className="w-4 h-4" />
                Motor WebGL 3D • Arrastra para rotar cámara
              </span>
            </div>
            
            {/* Etiquetas Fijas de Dirección */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-black text-gray-500 tracking-widest bg-black/40 px-3 py-1 rounded-full uppercase pointer-events-none">Fondo</div>
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-[10px] font-black text-gray-400 tracking-widest bg-black/40 px-3 py-1 rounded-full uppercase pointer-events-none border border-gray-600/30 shadow-[0_0_15px_rgba(255,255,255,0.05)]">Frente del Anaquel</div>
          </div>
          
          {/* Legend */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm">
            {[
              { color: 'bg-surface-500/20 border border-gray-600', label: 'Libre' },
              { color: 'bg-info-500/80 shadow-[0_0_10px_rgba(6,182,212,0.3)]', label: 'Ocupado' },
              { color: 'bg-warning-500/80 shadow-[0_0_10px_rgba(245,158,11,0.3)]', label: 'Por vencer (<30d)' },
              { color: 'bg-danger-500/80 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse-slow border-danger-400', label: 'Vencido' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-md ${item.color} backdrop-blur-sm`} />
                <span className="text-gray-400 font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel lateral de Desfragmentación */}
        {showDefragTool && (
          <div className="col-span-4 animate-slide-in-right h-full">
            <DefragmentationTool 
              shelfId={selectedShelf.id}
              onMovementConfirmed={fetchMapData}
              onFinished={() => setShowDefragTool(false)}
            />
            
            <div className="mt-5 card p-4 bg-info-500/5 border-info-500/10">
              <div className="flex items-start gap-3">
                <InformationCircleIcon className="w-5 h-5 text-info-400 shrink-0" />
                <div>
                  <h5 className="text-xs font-bold text-info-400 uppercase mb-1 tracking-wider">Modo Desfragmentación</h5>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Siga el plan de movimientos para crear espacio contiguo. El modelo 3D se actualizará automáticamente después de cada confirmación.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Hover Tooltip flotante (solo sobre elementos sin seleccionar) */}
      {hoveredCell && hoveredCell.cell && (!selectedCell || selectedCell.cell.sample_id !== hoveredCell.cell.sample_id) && (
        <div
          className="fixed z-[100] px-4 py-3 bg-surface-600/90 backdrop-blur border border-gray-600 rounded-lg shadow-2xl pointer-events-none animate-fade-in"
          style={{ left: '50%', bottom: '15%', transform: 'translateX(-50%)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${
              getCellStatus(hoveredCell.cell) === 'expired' ? 'bg-danger-500 animate-pulse' : 
              getCellStatus(hoveredCell.cell) === 'warning' ? 'bg-warning-500' : 'bg-success-500'
            }`} />
            <p className="font-bold text-white text-sm">{hoveredCell.cell.name}</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
            <span>Lote: <span className="text-gray-300">{hoveredCell.cell.lot}</span></span>
            <span>Peso: <span className="text-gray-300">{hoveredCell.cell.weight_grams}g</span></span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Vence: <strong className={getCellStatus(hoveredCell.cell) === 'expired' ? 'text-danger-400' : 'text-gray-300'}>
              {hoveredCell.cell.expiration_date ? new Date(hoveredCell.cell.expiration_date).toLocaleDateString('es-CO') : 'N/A'}
            </strong>
          </p>
        </div>
      )}
    </div>
  );
};

export default ShelfMap3D;
