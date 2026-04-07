import React, { useState, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, Edges } from '@react-three/drei';
import * as THREE from 'three';

// ─── Status Helper ─────────────────────────────────────────────────────────────
export const getCellStatus = (cell) => {
  if (!cell || !cell.expiration_date) return 'occupied';
  const now = new Date();
  const exp = new Date(cell.expiration_date);
  if (exp < now) return 'expired';
  if (exp < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)) return 'warning';
  return 'occupied';
};

export const STATUS_COLORS = {
  occupied: '#0ea5e9',   // sky-500
  warning:  '#f59e0b',   // amber-500
  expired:  '#ef4444',   // red-500
  empty:    '#1e293b',
};

// Altura/Separación global entre niveles. Cámbialo aquí directamente si se ven muy juntos.
export const LEVEL_HEIGHT = 1.6;

// ─── Grid Lines ────────────────────────────────────────────────────────────────
export const GridLines = ({ cols, depth }) => {
  const lines = [];
  const hC = cols / 2, hD = depth / 2;
  for (let i = 0; i <= cols; i++) {
    lines.push(
      <line key={`gx-${i}`} position={[i - hC, 0.01, 0]}>
        <bufferGeometry><float32BufferAttribute attach="attributes-position" args={[new Float32Array([0,0,-hD,0,0,hD]),3]}/></bufferGeometry>
        <lineBasicMaterial color="#1a1f2e" transparent opacity={0.8} />
      </line>
    );
  }
  for (let i = 0; i <= depth; i++) {
    lines.push(
      <line key={`gz-${i}`} position={[0, 0.01, i - hD]}>
        <bufferGeometry><float32BufferAttribute attach="attributes-position" args={[new Float32Array([-hC,0,0,hC,0,0]),3]}/></bufferGeometry>
        <lineBasicMaterial color="#1a1f2e" transparent opacity={0.8} />
      </line>
    );
  }
  return <group>{lines}</group>;
};

// ─── Axis Labels ───────────────────────────────────────────────────────────────
export const AxisLabels = ({ cols, depth }) => (
  <group>
    <Html position={[cols / 2 + 2, 0.2, 0]} center>
      <div style={{ background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.3)', padding: '2px 8px', borderRadius: 6, color: '#38bdf8', fontSize: 10, fontWeight: 700, letterSpacing: 1, whiteSpace: 'nowrap' }}>
        X → Columna
      </div>
    </Html>
    <Html position={[0, 0.2, depth / 2 + 2]} center>
      <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', padding: '2px 8px', borderRadius: 6, color: '#34d399', fontSize: 10, fontWeight: 700, letterSpacing: 1, whiteSpace: 'nowrap' }}>
        Z → Profundidad
      </div>
    </Html>
  </group>
);

// ─── Camera Controller ─────────────────────────────────────────────────────────
// Only animates when `view` changes; after settling, lets OrbitControls take over.
export const CameraController = ({ view, targetPosOverride = null }) => {
  const { camera, controls } = useThree();
  const animRef = useRef(false);
  const targetRef = useRef(new THREE.Vector3(10, 8, 12));

  useEffect(() => {
    const t = new THREE.Vector3();
    if (targetPosOverride) {
      t.copy(targetPosOverride);
    } else {
      if (view === 'top')   t.set(0, 18, 1);
      else if (view === 'front') t.set(0, 3, 18);
      else                  t.set(10, 8, 12);
    }
    targetRef.current.copy(t);
    animRef.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  useFrame(() => {
    if (!animRef.current || !controls) return;
    const dist = camera.position.distanceTo(targetRef.current);
    if (dist < 0.15) { animRef.current = false; controls.update(); return; }
    camera.position.lerp(targetRef.current, 0.06);
    controls.target.lerp(new THREE.Vector3(0, 0, 0), 0.06);
    controls.update();
  });

  return null;
};

// ─── Sample Cube ───────────────────────────────────────────────────────────────
export const SampleCube = ({ cell, x, y, z, offsetX, offsetY = 0, offsetZ, isSelected, isDimmed, onHover, onClick, status }) => {
  const meshRef   = useRef();
  const ringRef   = useRef();
  const [hovered, setHovered] = useState(false);

  const color     = isSelected ? '#38bdf8' : STATUS_COLORS[status] || STATUS_COLORS.occupied;
  const width     = cell.width || 1;
  const depth     = cell.depth || cell.height || 1;
  const px        = offsetX + x + width / 2;
  const pz        = offsetZ + z + depth / 2;
  const baseY     = y * LEVEL_HEIGHT + offsetY;

  useFrame((state) => {
    if (!meshRef.current) return;
    const floatY = isSelected
      ? baseY + 0.25 + Math.sin(state.clock.elapsedTime * 2.5) * 0.07
      : hovered && !isDimmed ? baseY + 0.15 : baseY + 0.05;

    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, floatY, 0.12);
    meshRef.current.material.opacity = THREE.MathUtils.lerp(meshRef.current.material.opacity, isDimmed ? 0.06 : 0.95, 0.1);
    meshRef.current.material.emissiveIntensity = THREE.MathUtils.lerp(
      meshRef.current.material.emissiveIntensity,
      isSelected ? 0.55 : hovered ? 0.25 : 0.05,
      0.1
    );
    if (ringRef.current) {
      ringRef.current.material.opacity = THREE.MathUtils.lerp(ringRef.current.material.opacity, (isSelected || hovered) && !isDimmed ? 0.6 : 0, 0.12);
    }
  });

  const statusLabel = { occupied: 'Activa', warning: 'Por Vencer', expired: 'Vencida' };
  const statusTextColor = { occupied: '#34d399', warning: '#facc15', expired: '#f87171' };

  return (
    <group
      position={[px, 0.05, pz]}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; if (onHover) onHover(cell); }}
      onPointerOut={(e)  => { setHovered(false);  document.body.style.cursor = 'default'; if (onHover) onHover(null); }}
      onClick={(e)       => { e.stopPropagation(); if (onClick) onClick(); }}
    >
      {/* Glow ring on floor */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[Math.max(width, depth) * 0.5, Math.max(width, depth) * 0.72, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Main cube */}
      <mesh ref={meshRef} position={[0, 0.4, 0]}>
        <boxGeometry args={[width - 0.1, 0.8, depth - 0.1]} />
        <meshStandardMaterial
          color={color}
          roughness={0.25}
          metalness={0.55}
          emissive={color}
          emissiveIntensity={0.05}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* Tooltip when selected */}
      {isSelected && (
        <Html position={[0, 1.8, 0]} center zIndexRange={[100, 0]}>
          <div style={{
            background: 'rgba(9,13,20,0.97)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${color}40`,
            borderRadius: 14,
            padding: '14px 16px',
            width: 240,
            boxShadow: `0 8px 40px rgba(0,0,0,0.6), 0 0 20px ${color}20`,
            pointerEvents: 'auto',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: color, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>
                  {statusLabel[status] || 'Muestra'}
                </div>
                <div style={{ fontSize: 14, color: '#f1f5f9', fontWeight: 700, lineHeight: 1.2 }}>
                  {cell.name || cell.global_sample_name}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); if (onClick) onClick(); }}
                style={{ color: '#64748b', fontSize: 16, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}
              >✕</button>
            </div>

            {/* Data rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
              {[
                ['Lote',   cell.lot],
                ['Peso',   cell.weight_grams ? `${cell.weight_grams} g` : '—'],
                ['SGA',    cell.ghs_danger_class || 'N/A'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                  <span>{k}</span><strong style={{ color: '#e2e8f0' }}>{v}</strong>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 2 }}>
                <span>Vence</span>
                <strong style={{ color: statusTextColor[status] || '#e2e8f0' }}>
                  {cell.expiration_date?.substring(0, 10) || '—'}
                </strong>
              </div>
            </div>

            {/* Position badge */}
            <div style={{ marginTop: 10, padding: '4px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, textAlign: 'center', fontFamily: 'monospace', fontSize: 10, color: '#475569' }}>
              Pos: X:{(cell.position_x ?? x) + 1}  Y:{(cell.position_y ?? y) + 1}  Z:{((cell.position_z ?? z) || 0) + 1}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};
