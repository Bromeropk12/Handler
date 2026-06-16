/**
 * GroupDragGhost
 *
 * Componente R3F que renderiza una "sombra fantasma" del grupo
 * arrastrándose. Se posiciona siguiendo el currentOffset del
 * useGroupDrag y muestra todas las muestras del grupo con
 * validación visual:
 *   - Halo cian translúcido: válido (drop OK)
 *   - Halo rojo + cursor not-allowed: inválido
 *   - Halo gris: desconocido
 *
 * NO es interactivo — es puramente visual.
 *
 * Props:
 *   - dragState: { isDragging, currentOffset: {dx,dy,dz}, hoveredCell, hoveredValidity, hoveredConflicts }
 *   - groupSamples: Array<sample> (con positions absolutas)
 *   - shelfDims: { cols, depth }
 *   - onShake: () => void  (callback para shake animation)
 *   - reducedMotion: boolean
 */
import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { useFrame } from '@react-three/fiber';
import { LEVEL_HEIGHT } from './Shared3DComponents';

const GroupDragGhost = ({
  dragState,
  groupSamples = [],
  shelfDims = { cols: 10, depth: 10 },
  reducedMotion = false,
}) => {
  const groupRef = useRef();
  const haloRef = useRef();

  useFrame((state) => {
    if (!groupRef.current) return;
    const pulse = !reducedMotion
      ? 0.85 + Math.sin(state.clock.elapsedTime * 3) * 0.15
      : 1;
    if (haloRef.current) {
      haloRef.current.material.opacity = 0.4 * pulse;
    }
    groupRef.current.position.y = reducedMotion
      ? 0
      : Math.sin(state.clock.elapsedTime * 2.5) * 0.05;
  });

  if (!dragState?.isDragging) return null;
  if (groupSamples.length === 0) return null;

  const { cols, depth } = shelfDims;
  const offX = -cols / 2;
  const offZ = -depth / 2;
  const validity = dragState.hoveredValidity;

  // Color del halo por validez
  const haloColor = validity === 'invalid' ? '#ef4444' : validity === 'valid' ? '#10b981' : '#64748b';

  return (
    <group ref={groupRef}>
      {groupSamples.map((s) => {
        const w = s.width || 1;
        const d = s.depth || s.height || 1;
        const px = offX + s.position_x + w / 2 + (dragState.currentOffset?.dx || 0);
        const pz = offZ + (s.position_z || 0) + d / 2 + (dragState.currentOffset?.dz || 0);
        const py = (s.position_y || 0) * LEVEL_HEIGHT + (dragState.currentOffset?.dy || 0) * LEVEL_HEIGHT;

        return (
          <group key={s.id} position={[px, py, pz]}>
            {/* Ghost cube (semi-transparent) */}
            <mesh>
              <boxGeometry args={[w - 0.05, 0.78, d - 0.05]} />
              <meshStandardMaterial
                color={validity === 'invalid' ? '#7f1d1d' : '#0e7490'}
                transparent
                opacity={0.35}
                emissive={haloColor}
                emissiveIntensity={0.3}
                roughness={0.3}
                metalness={0.4}
                depthWrite={false}
              />
            </mesh>
            {/* SGA danger class ring (mini) */}
            {s.ghs_danger_class && (
              <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, 0.45, 0]}
              >
                <ringGeometry args={[Math.max(w, d) * 0.55, Math.max(w, d) * 0.6, 24]} />
                <meshBasicMaterial
                  color={s.ghs_danger_class === 'Toxic' ? '#a855f7'
                    : s.ghs_danger_class === 'Flammable' ? '#f97316'
                    : s.ghs_danger_class === 'Oxidizing' ? '#eab308'
                    : s.ghs_danger_class === 'Explosive' ? '#ef4444'
                    : s.ghs_danger_class === 'Corrosive' ? '#10b981'
                    : '#64748b'}
                  transparent
                  opacity={0.7}
                  depthWrite={false}
                />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Connector lines between group samples (only 2-3) */}
      {groupSamples.length >= 2 && groupSamples.length <= 3 && (
        <mesh ref={haloRef} position={[0, 0.05, 0]}>
          <ringGeometry args={[0.95, 1.0, 32]} />
          <meshBasicMaterial color={haloColor} transparent opacity={0.4} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
};

GroupDragGhost.propTypes = {
  dragState: PropTypes.object,
  groupSamples: PropTypes.array,
  shelfDims: PropTypes.shape({
    cols: PropTypes.number,
    depth: PropTypes.number,
  }),
  reducedMotion: PropTypes.bool,
};

export default GroupDragGhost;
