import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { warehouseAPI } from '../../../services/api';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const ShelfMesh = ({ position, shelf, index, onSelect }) => {
  const meshRef = useRef();
  const scaleVec = useRef(new THREE.Vector3());
  const [hovered, setHovered] = useState(false);

  // Status computation for colors
  const status = shelf.expired_count > 0 ? 'danger' 
    : shelf.near_expiry_count > 0 ? 'warning'
    : shelf.occupancy_percentage > 80 ? 'busy' : 'normal';
    
  let color = '#34d399'; // normal
  if (status === 'danger') color = '#ef4444';
  if (status === 'warning') color = '#f59e0b';
  if (status === 'busy') color = '#0ea5e9';

  useFrame((state) => {
    if (!meshRef.current) return;
    const targetScale = hovered ? 1.05 : 1;
    scaleVec.current.set(targetScale, targetScale, targetScale);
    meshRef.current.scale.lerp(scaleVec.current, 0.1);
    
    // Suave flotación
    const time = state.clock.getElapsedTime();
    const floatingY = position[1] + (hovered ? 0.2 : 0) + Math.sin(time * 2 + index) * 0.05;
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, floatingY, 0.1);
  });

  // Geometría de Armarios Metálicos (Cajas Rectangulares Verticales)
  const boxWidth = 1.6;
  const boxHeight = 4.0;
  const boxDepth = 1.4;

  return (
    <group 
      position={position}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
      onClick={() => { document.body.style.cursor = 'default'; onSelect(shelf); }}
      ref={meshRef}
    >
      <group position={[0, boxHeight / 2 - 1.5, 0]}>
        {/* Cuerpo Principal del Mueble Metálico Brillante */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[boxWidth, boxHeight, boxDepth]} />
          <meshPhysicalMaterial 
            color="#e2e8f0" 
            metalness={0.9} 
            roughness={0.15} 
            clearcoat={0.5}
            clearcoatRoughness={0.2}
          />
        </mesh>

        {/* Marco Frontal Oscuro (Detalle de cajón/bordes/puertas) */}
        <mesh position={[0, 0, boxDepth / 2 + 0.01]}>
          <planeGeometry args={[boxWidth - 0.3, boxHeight - 0.3]} />
          <meshPhysicalMaterial 
            color="#0f172a" 
            metalness={0.8} 
            roughness={0.3} 
            clearcoat={0.3}
          />
        </mesh>
        
        {/* Línea Divisoria Vertical Frontal Simulando Puertas Dobles */}
        <mesh position={[0, 0, boxDepth / 2 + 0.02]}>
          <planeGeometry args={[0.02, boxHeight - 0.3]} />
          <meshBasicMaterial color="#000000" />
        </mesh>

        {/* Panel Superior LED Integrado (Estado de Ocupación) */}
        <mesh position={[0, boxHeight / 2 - 0.1, boxDepth / 2 + 0.015]}>
          <planeGeometry args={[boxWidth - 0.6, 0.08]} />
          <meshStandardMaterial 
            color={color} 
            emissive={color} 
            emissiveIntensity={hovered ? 1.5 : 0.8} 
          />
        </mesh>
        
        {/* Halo de luz que emana del LED hacia adelante */}
        {hovered && (
          <pointLight position={[0, boxHeight / 2 - 0.1, boxDepth / 2 + 0.2]} distance={2} intensity={0.5} color={color} />
        )}
      </group>

      <Html position={[0, boxHeight + 0.5, 0]} center zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
        <div className={`transition-all duration-300 transform ${hovered ? 'scale-100 opacity-100 translate-y-[-10px] shadow-[0_0_40px_rgba(0,0,0,0.9)]' : 'scale-90 opacity-0'} bg-surface-600/95 backdrop-blur-2xl border border-gray-500/40 p-4 rounded-xl w-60 text-left`}>
          <div className="flex justify-between items-start mb-2 border-b border-gray-600/50 pb-2">
            <h3 className="text-sm font-black text-white drop-shadow-md uppercase tracking-wider">{shelf.name}</h3>
            <span className="text-[10px] bg-black/50 px-2 rounded text-gray-300 border border-gray-600">
              {shelf.provider || 'S/P'}
            </span>
          </div>
          
          <div className="space-y-1 text-xs mb-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Capacidad Total</span>
              <span className="text-white font-bold">{shelf.total_capacity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Muestras Físicas</span>
              <span className="text-white font-bold">{shelf.occupied_count || 0}</span>
            </div>
          </div>

          <div className="bg-gray-800/80 rounded-full h-1.5 w-full overflow-hidden mb-1">
            <div className="h-full" style={{ width: `${shelf.occupancy_percentage || 0}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}` }} />
          </div>
          <div className="text-right text-[10px] font-bold" style={{ color }}>{shelf.occupancy_percentage || 0}% LUGARES OCUPADOS</div>
          
          {hovered && (
            <div className="mt-3 bg-white/10 text-white py-1.5 rounded w-full flex justify-center items-center gap-1 text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition shadow-lg" style={{ boxShadow: `0 4px 15px ${color}30` }}>
              Inspeccionar Armario <ArrowRightIcon className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </Html>
    </group>
  );
};

const ShelfSelector = ({ selectedMarketLine, onSelectShelf, onBack }) => {
  const [shelves, setShelves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchShelves = async () => {
      if (!selectedMarketLine) return;
      try {
        setLoading(true);
        const response = await warehouseAPI.getShelves({ market_line_id: selectedMarketLine.id }, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setShelves(response.data.shelves);
      } catch (err) {
        if (err.name === 'AbortError' || err.name === 'CanceledError') return;
        setError('Error al cargar los armarios');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchShelves();
    return () => controller.abort();
  }, [selectedMarketLine]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-[500px]">
        <LoadingSpinner size="large" text={`Digitalizando sector ${selectedMarketLine?.name}...`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-danger-300 font-bold">
        {error}
        <br/><button onClick={onBack} className="mt-4 btn-secondary">Volver</button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[70vh] min-h-[600px] rounded-2xl overflow-hidden bg-black/80 border border-gray-700/50 shadow-2xl animate-fade-in shadow-[0_0_50px_rgba(0,0,0,0.5)]">
      <Canvas camera={{ position: [0, 10, 25], fov: 40 }} gl={{ antialias: true }}>
        <color attach="background" args={['#050508']} />
        <fog attach="fog" args={['#050508', 20, 60]} />
        
        {/* Iluminación Intensiva para maximizar brillo de metal */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 20, 10]} intensity={2.0} castShadow />
        <directionalLight position={[-15, 10, -10]} intensity={1.5} color="#38bdf8" />
        <spotLight position={[0, 15, 15]} angle={0.5} penumbra={0.5} intensity={2.5} color="#ffffff" castShadow />
        
        {/* Destellos perimetrales en azul y violeta simulando reflejos de la sala */}
        <pointLight position={[-10, 5, 5]} intensity={1.5} color="#4338ca" distance={20} />
        <pointLight position={[10, 5, 5]} intensity={1.5} color="#db2777" distance={20} />

        <group position={[0, 0, 0]}>
          {shelves.map((shelf, index) => {
            // Distribuir en cuadrícula (grid) espaciosa
            const cols = 5;
            const spacingX = 6.0;
            const spacingZ = 7.0;
            
            const col = index % cols;
            const row = Math.floor(index / cols);
            
            const totalWidth = (Math.min(shelves.length, cols) - 1) * spacingX;
            const originX = -totalWidth / 2;
            const numRows = Math.ceil(shelves.length / cols);
            const totalDepth = (numRows - 1) * spacingZ;
            const originZ = -totalDepth / 2;

            const px = originX + col * spacingX;
            const pz = originZ + row * spacingZ;

            return (
              <ShelfMesh 
                key={shelf.id} 
                position={[px, 1.5, pz]} 
                shelf={shelf} 
                index={index} 
                onSelect={onSelectShelf} 
              />
            );
          })}
          
          <ContactShadows position={[0, -0.01, 0]} opacity={0.6} scale={40} blur={2.5} far={10} />

          {/* Piso Reflejante del Laboratorio */}
          <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[100, 100]} />
            <meshStandardMaterial color="#0A0B10" roughness={0.15} metalness={0.9} />
          </mesh>
          <gridHelper args={[100, 100, '#374151', '#111827']} position={[0, 0, 0]} />
        </group>

        <OrbitControls 
          enablePan={true}
          enableZoom={true} 
          minDistance={10}
          maxDistance={40}
          maxPolarAngle={Math.PI / 2 - 0.05} 
          minPolarAngle={10 * (Math.PI/180)}
        />
      </Canvas>

      {/* Controles y UI 2D Opcional */}
      <div className="absolute top-6 left-6 pointer-events-none z-10 w-full">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="btn-ghost bg-black/60 backdrop-blur-md rounded-full p-2 hover:bg-white/10 pointer-events-auto border border-gray-700/50"
            title="Volver a los Hangares"
          >
            <ArrowLeftIcon className="w-6 h-6 text-white" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] tracking-[0.2em] uppercase">
              Sector // {selectedMarketLine?.name}
            </h2>
            <p className="text-gray-400 text-sm tracking-[0.2em] uppercase mt-1 font-medium">Batería de Armarios Metálicos</p>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-10">
        <span className="text-[10px] font-black tracking-[0.2em] text-gray-300 bg-black/80 backdrop-blur-md px-6 py-2.5 rounded-full border border-gray-600/50 shadow-[0_0_30px_rgba(0,0,0,0.8)] uppercase">
            Desplázate para Explorar el Entorno
        </span>
      </div>
    </div>
  );
};

ShelfSelector.propTypes = {
  selectedMarketLine: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string,
  }),
  onSelectShelf: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
};

export default ShelfSelector;
