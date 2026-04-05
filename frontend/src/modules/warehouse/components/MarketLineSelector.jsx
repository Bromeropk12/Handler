import React, { useState, useEffect, useRef } from 'react';
import { samplesAPI, warehouseAPI } from '../../../services/api';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, ContactShadows, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

// Cámara Cúpula / Habitación por Línea de Mercado
const MarketLineChamber = ({ position, color, line, stats, index, onSelect }) => {
  const groupRef = useRef();
  const coreRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!coreRef.current) return;
    const time = state.clock.getElapsedTime();
    
    // El núcleo brillante late y rota
    coreRef.current.rotation.y += 0.01;
    coreRef.current.rotation.x = Math.sin(time * 0.5) * 0.2;
    coreRef.current.position.y = 1.5 + Math.sin(time * 2 + index) * 0.2;
    
    const targetScale = hovered ? 1.2 : 1;
    coreRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
  });

  const occupancyPct = stats.totalShelves > 0
    ? Math.round((stats.occupiedShelves / stats.totalShelves) * 100) : 0;

  return (
    <group 
      position={position}
      ref={groupRef}
    >
      {/* Estructura de la Habitación (Vaults separados) */}
      <group position={[0, 0, -2]}>
        {/* Pared Trasera */}
        <mesh position={[0, 3, -1.5]} receiveShadow castShadow>
          <boxGeometry args={[4.5, 6, 0.4]} />
          <meshStandardMaterial color="#1a1c23" metalness={0.9} roughness={0.4} />
        </mesh>
        
        {/* Pared Lateral Izquierda */}
        <mesh position={[-2.25, 3, 0]} receiveShadow castShadow>
          <boxGeometry args={[0.2, 6, 3]} />
          <meshStandardMaterial color="#111216" metalness={0.95} roughness={0.2} />
        </mesh>

        {/* Pared Lateral Derecha */}
        <mesh position={[2.25, 3, 0]} receiveShadow castShadow>
          <boxGeometry args={[0.2, 6, 3]} />
          <meshStandardMaterial color="#111216" metalness={0.95} roughness={0.2} />
        </mesh>

        {/* Techo de la Habitación */}
        <mesh position={[0, 6, 0]} receiveShadow castShadow>
          <boxGeometry args={[4.7, 0.2, 3.4]} />
          <meshStandardMaterial color="#0f1013" metalness={0.8} roughness={0.5} />
        </mesh>
        
        {/* Luces perimetrales de la habitación (tira LED) */}
        <mesh position={[0, 5.8, -1.25]}>
          <boxGeometry args={[4.4, 0.05, 0.05]} />
          <meshBasicMaterial color={color} />
        </mesh>
        <pointLight position={[0, 5, -1]} distance={15} intensity={0.8} color={color} />
      </group>

      {/* Plataforma Sensorial en el piso */}
      <mesh position={[0, 0.1, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.5, 1.8, 0.2, 32]} />
        <meshStandardMaterial color="#2a2d34" metalness={0.9} roughness={0.2} />
      </mesh>
      
      {/* Anillo de energía en la plataforma base */}
      <mesh position={[0, 0.21, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 1.3, 32]} />
        <meshBasicMaterial color={hovered ? '#ffffff' : color} transparent opacity={0.6} />
      </mesh>

      {/* Elemento Interactivo Central (Núcleo) / Sensor */}
      <group 
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
        onClick={() => { document.body.style.cursor = 'default'; onSelect(line); }}
      >
        <mesh ref={coreRef} castShadow>
          <octahedronGeometry args={[0.7, 0]} />
          {/* Cristal holográfico levitando */}
          <meshPhysicalMaterial 
            color={color} 
            transparent 
            opacity={0.85}
            metalness={0.8}
            roughness={0.1}
            emissive={color}
            emissiveIntensity={hovered ? 0.8 : 0.3}
          />
        </mesh>

        {/* Hitbox invisible más grande para facilitar el clic */}
        <mesh position={[0, 1.5, 0]} visible={false}>
          <boxGeometry args={[2.5, 4, 3]} />
        </mesh>
      </group>

      {/* Pantalla Holográfica Flotante frente a la Habitación */}
      <Html position={[0, 4.0, 1.5]} center zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
        <div className={`transition-all duration-500 transform ${hovered ? 'scale-105 opacity-100 translate-y-[-5px]' : 'scale-95 opacity-0'} bg-surface-700/80 backdrop-blur-md border border-gray-500/20 p-3 rounded-lg w-52 text-center`}>
          <div className="flex justify-center mb-2">
            <span className="px-2 py-0.5 rounded-sm text-[8px] font-medium tracking-widest uppercase bg-black/40 text-gray-300">
              Sector {index + 1}
            </span>
          </div>
          
          <h3 className="text-sm font-semibold text-white tracking-wide mb-3" style={{ color }}>{line.name}</h3>
          
          <div className="flex justify-between items-center text-xs border-y border-gray-600/30 py-2 mb-2">
            <div className="flex flex-col items-start px-2">
              <span className="text-gray-500 font-medium mb-0.5 text-[10px] uppercase">Ocupación</span>
              <span className="text-gray-200">{stats.occupiedShelves}<span className="text-gray-600 text-[10px]">/{stats.totalShelves}</span></span>
            </div>
            <div className="w-[1px] h-6 bg-gray-600/20"></div>
            <div className="flex flex-col items-end px-2">
              <span className="text-gray-500 font-medium mb-0.5 text-[10px] uppercase">Muestras</span>
              <span className="text-white font-medium">{stats.totalSamples}</span>
            </div>
          </div>
          
          <div className="bg-black/30 rounded-full h-1 w-full overflow-hidden mb-1">
            <div className="h-full transition-all duration-1000" style={{ width: `${occupancyPct}%`, backgroundColor: color }}>
            </div>
          </div>
          
          {hovered && (
            <div className="mt-3 text-white/80 py-1.5 w-full flex justify-center items-center gap-1 text-[10px] uppercase tracking-widest transition-all">
              Examinar <ArrowRightIcon className="w-3 h-3" />
            </div>
          )}
        </div>
      </Html>
    </group>
  );
};

const MarketLineSelector = ({ onSelectMarketLine }) => {
  const [marketLines, setMarketLines] = useState([]);
  const [shelfStats, setShelfStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const mlResponse = await samplesAPI.getMarketLines();
        const lines = mlResponse.data.data.marketLines;

        const statsMap = {};
        await Promise.all(
          lines.map(async (line) => {
            try {
              const shelfResponse = await warehouseAPI.getShelves({ market_line_id: line.id, limit: 200 });
              const shelves = shelfResponse.data.data.shelves;
              statsMap[line.id] = {
                totalShelves: shelves.length,
                occupiedShelves: shelves.filter(s => s.occupancy_percentage > 0).length,
                totalSamples: shelves.reduce((acc, s) => acc + (s.occupied_count || 0), 0),
              };
            } catch {
              statsMap[line.id] = { totalShelves: 0, occupiedShelves: 0, totalSamples: 0 };
            }
          })
        );

        setMarketLines(lines);
        setShelfStats(statsMap);
      } catch (_err) {
        setError('Error al cargar las líneas de mercado');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-[500px]">
        <LoadingSpinner size="large" text="Iniciando arquitectura 3D del complejo..." />
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-20 text-danger-300 font-bold">{error}</div>;
  }

  const colorMap = {
    'Cosmética': '#ec4899', // Pink
    'Farmacéutica': '#0ea5e9', // Blue
    'Industrial': '#f59e0b' // Amber
  };

  return (
    <div className="relative w-full h-[70vh] min-h-[600px] rounded-2xl overflow-hidden bg-black/80 border border-gray-700/50 shadow-2xl animate-fade-in shadow-[0_0_50px_rgba(0,0,0,0.5)] cursor-move">
      <Canvas camera={{ position: [0, 8, 20], fov: 40 }}>
        <color attach="background" args={['#050508']} />
        <fog attach="fog" args={['#050508', 15, 50]} />
        
        {/* Iluminación Dramática de Película para Metales */}
        <ambientLight intensity={0.6} />
        <spotLight position={[0, 20, 10]} angle={0.8} penumbra={0.7} intensity={2.0} castShadow />
        {/* Luces puntuales distantes simulando reflejos */}
        <pointLight position={[-15, 10, -5]} intensity={1.5} color="#4338ca" />
        <pointLight position={[15, 10, -5]} intensity={1.5} color="#db2777" />
        
        {/* Polvo estelar (simula partículas suspendidas en este gran complejo) */}
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

        <group position={[0, -2, 0]}>
          {marketLines.map((line, index) => {
            const stats = shelfStats[line.id] || { totalShelves: 0, occupiedShelves: 0, totalSamples: 0 };
            const rawColor = colorMap[line.name] || '#10b981';
            
            // Distribuir en línea X con un gran espaciado para formar cuartos grandes (5.5)
            const spacing = 5.5;
            const originX = -((marketLines.length - 1) * spacing) / 2;
            const px = originX + (index * spacing);

            return (
              <MarketLineChamber 
                key={line.id} 
                position={[px, 0, 0]} 
                color={rawColor} 
                line={line} 
                stats={stats} 
                index={index} 
                onSelect={onSelectMarketLine} 
              />
            );
          })}

          <ContactShadows position={[0, 0.01, 0]} opacity={0.6} scale={40} blur={2.5} far={10} />
          
          {/* Suelo del Complejo Altamente Reflectivo */}
          <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[150, 100]} />
            <meshStandardMaterial color="#0A0B10" roughness={0.1} metalness={0.95} />
          </mesh>
          <gridHelper args={[150, 100, '#1f2937', '#0f111a']} position={[0, 0.005, 0]} />
        </group>

        <OrbitControls 
          enablePan={false} 
          enableZoom={true} 
          minDistance={10}
          maxDistance={35}
          maxPolarAngle={Math.PI / 2 - 0.05} 
          minPolarAngle={0.2}
        />
      </Canvas>

      {/* HUD 2D superpuesto */}
      <div className="absolute top-8 left-8 pointer-events-none z-10 w-full">
        <h2 className="text-3xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] tracking-[0.2em] uppercase flex items-center gap-3">
          Complejo Central
          <div className="h-0.5 max-w-[300px] flex-1 bg-gradient-to-r from-white/70 to-transparent"></div>
        </h2>
        <p className="text-gray-400 text-sm tracking-[0.3em] font-medium uppercase mt-2">Selección de Sector // Terminal Primaria</p>
      </div>
      
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-10">
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-black tracking-[0.2em] text-gray-300 bg-black/80 backdrop-blur-md px-6 py-2.5 rounded-full border border-gray-600/50 shadow-[0_0_30px_rgba(0,0,0,0.8)] uppercase">
            Arrastra (Click Secundario) para Rotar Cámaras
          </span>
        </div>
      </div>
    </div>
  );
};

export default MarketLineSelector;
