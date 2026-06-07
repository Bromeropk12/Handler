import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import GroupChip from './GroupChip';
import SampleTooltip from './SampleTooltip';

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

// Mapeo SGA → color de anillo. Alineado con backend (sga-compatibility.js).
// 6 clases: tóxico, inflamable, oxidante, explosivo, corrosivo, misceláneo.
export const SGA_COLORS = {
  'Toxic':         '#a855f7',  // purple-500
  'Flammable':     '#f97316',  // orange-500
  'Oxidizing':     '#eab308',  // yellow-500
  'Explosive':     '#ef4444',  // red-500
  'Corrosive':     '#10b981',  // emerald-500
  'Miscellaneous': '#64748b',  // slate-500
  'Sin Riesgo':    '#38bdf8',  // sky-400
};
export const getSGAColor = (sgaClass) => SGA_COLORS[sgaClass] || SGA_COLORS['Sin Riesgo'];

export const getColorByName = (name) => {
  if (!name) return '#0ea5e9';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 75%, 50%)`;
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
    <Html position={[cols / 2 + 1.8, 0.1, 0]} center>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(9, 13, 20, 0.65)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)', padding: '4px 10px', borderRadius: 20,
        color: '#94a3b8', fontSize: 9, fontWeight: 800, letterSpacing: 1, whiteSpace: 'nowrap',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0ea5e9', boxShadow: '0 0 8px #0ea5e9' }} />
        X · COLUMNA
      </div>
    </Html>
    <Html position={[0, 0.1, depth / 2 + 1.8]} center>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(9, 13, 20, 0.65)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)', padding: '4px 10px', borderRadius: 20,
        color: '#94a3b8', fontSize: 9, fontWeight: 800, letterSpacing: 1, whiteSpace: 'nowrap',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
        Z · PROFUNDIDAD
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

// ─── Canvas Stamp Texture ───────────────────────────────────────────────────────
// Builds a CanvasTexture (no web-workers / no CSP issues) for the status stamp.
const makeStampTexture = (letter, bgColor, letterColor) => {
  const SIZE = 128;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  const cx = SIZE / 2, cy = SIZE / 2, r = SIZE / 2 - 6;

  // Filled circle background
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // White border ring
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 5, 0, Math.PI * 2);
  ctx.stroke();

  // Bold letter
  ctx.fillStyle = letterColor;
  ctx.font = `900 ${Math.floor(SIZE * 0.5)}px "Arial Black", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, cx, cy + 3);

  return new THREE.CanvasTexture(canvas);
};

// ─── Empty Cell Target ─────────────────────────────────────────────────────────
export const EmptyCellTarget = ({
  x, y = 0, z, offsetX, offsetY = 0, offsetZ,
  width = 1, depth = 1, onDrop,
  validityState,    // 'valid' | 'invalid' | 'unknown' | undefined
}) => {
  const [hovered, setHovered] = useState(false);

  // Color y cursor según validez (drag-en-grupo: green/red/grey).
  const palette = (() => {
    if (validityState === 'invalid') {
      return { color: '#ef4444', emissive: '#ef4444', cursor: 'not-allowed' };
    }
    if (validityState === 'valid') {
      return { color: '#10b981', emissive: '#10b981', cursor: 'grab' };
    }
    if (validityState === 'unknown') {
      return { color: '#64748b', emissive: '#475569', cursor: 'wait' };
    }
    return { color: '#10b981', emissive: '#10b981', cursor: 'pointer' };
  })();

  const px = offsetX + x + width / 2;
  const pz = offsetZ + z + depth / 2;
  const baseY = y * LEVEL_HEIGHT + offsetY;

  return (
    <group
      position={[px, baseY + 0.4, pz]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = palette.cursor;
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (validityState === 'invalid') return;
        if (onDrop) onDrop({ x, y, z });
      }}
    >
      <mesh>
        <boxGeometry args={[width - 0.1, 0.8, depth - 0.1]} />
        <meshStandardMaterial
          color={palette.color}
          transparent
          opacity={hovered ? 0.45 : 0.12}
          emissive={palette.emissive}
          emissiveIntensity={validityState === 'invalid' && hovered ? 1.2 : hovered ? 0.7 : 0.2}
          roughness={0.2}
        />
      </mesh>
      {/* Target indicator on top */}
      <mesh position={[0, 0.41, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.5, 0.5]} />
        <meshBasicMaterial color={palette.color} transparent opacity={hovered ? 0.85 : 0.3} wireframe />
      </mesh>
      {hovered && (
        <pointLight position={[0, 0.5, 0]} intensity={1} distance={2} color={palette.color} />
      )}
    </group>
  );
};

// ─── Sample Cube ───────────────────────────────────────────────────────────────
export const SampleCube = ({
  cell, x, y, z, offsetX, offsetY = 0, offsetZ,
  isSelected, isDimmed, onHover, onClick, status,
  isMultiSelected, isSourceOfMove,
  isInGroupDrag = false,        // true si esta muestra es parte del grupo que se está arrastrando
  onDragStart,                 // callback (sample) al iniciar drag
  ghsDangerClass,              // opcional, si el padre lo provee (más rápido que cell.ghs_danger_class)
  // v2.0 — UI flotante: tooltip sobre el cubo cuando está seleccionado, chip cuando es parte de un grupo
  showTooltip = false,          // true cuando el cubo está clickeado y debe mostrar SampleTooltip
  showGroupChip = false,        // true cuando el cubo es parte de un grupo seleccionado
  movementMode = false,         // true cuando estamos en modo "mover": no muestra tooltip
  onTooltipViewDetail,          // () => void
  onTooltipMove,                // () => void
  onTooltipClose,               // () => void
  groupChipColor,               // hex color del grupo (opcional, default sky)
}) => {
  // cubeGroupRef wraps both the cube mesh AND the 3D stamp so they animate in sync.
  const cubeGroupRef = useRef();
  const meshRef      = useRef();
  const ringRef      = useRef();
  const sgaRingRef   = useRef();
  const [hovered, setHovered] = useState(false);

  const isActiveSelection = isSelected || isMultiSelected;
  const color = isActiveSelection ? '#facc15' : getColorByName(cell.name || cell.global_sample_name);
  const width = cell.width || 1;
  const depth = cell.depth || cell.height || 1;
  const px    = offsetX + x + width / 2;
  const pz    = offsetZ + z + depth / 2;
  const baseY = y * LEVEL_HEIGHT + offsetY;

  useFrame((state) => {
    if (!cubeGroupRef.current) return;

    // Animate the whole cube+stamp group together
    const floatY = isActiveSelection
      ? baseY + 0.25 + Math.sin(state.clock.elapsedTime * 2.5) * 0.07
      : hovered && !isDimmed ? baseY + 0.15 : baseY + 0.05;

    cubeGroupRef.current.position.y = THREE.MathUtils.lerp(
      cubeGroupRef.current.position.y,
      floatY,
      0.12
    );

    // Material tweens on the cube mesh itself
    if (meshRef.current) {
      meshRef.current.material.opacity = THREE.MathUtils.lerp(
        meshRef.current.material.opacity,
        isDimmed ? 0.06 : 0.95,
        0.1
      );
      meshRef.current.material.emissiveIntensity = THREE.MathUtils.lerp(
        meshRef.current.material.emissiveIntensity,
        isActiveSelection ? 0.55 : hovered ? 0.25 : 0.05,
        0.1
      );
    }

    // Floor glow ring
    if (ringRef.current) {
      ringRef.current.material.opacity = THREE.MathUtils.lerp(
        ringRef.current.material.opacity,
        (isActiveSelection || hovered) && !isDimmed ? 0.6 : 0,
        0.12
      );
    }
  });

  const stampColor   = STATUS_COLORS[status] || STATUS_COLORS.occupied;
  const letterColor  = status === 'warning' ? '#000000' : '#ffffff';
  const statusLetter = status === 'warning' ? 'P' : status === 'expired' ? 'V' : 'A';

  // Canvas texture — created once per status/color combo, no workers needed
  const stampTexture = useMemo(
    () => makeStampTexture(statusLetter, stampColor, letterColor),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [statusLetter, stampColor, letterColor]
  );

  return (
    <group
      position={[px, 0, pz]}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true);  document.body.style.cursor = 'grab'; if (onHover) onHover(cell); }}
      onPointerOut={()  => { setHovered(false);  document.body.style.cursor = 'default'; if (onHover) onHover(null); }}
      onClick={(e)       => { e.stopPropagation(); if (onClick) onClick(); }}
      onPointerDown={(e) => {
        // Si la muestra es parte de un grupo y el padre provee onDragStart,
        // iniciamos drag-en-grupo. preventDefault evita que OrbitControls
        // capture el evento.
        if (onDragStart) {
          e.stopPropagation();
          if (e.target?.setPointerCapture) {
            try { e.target.setPointerCapture(e.pointerId); } catch { /* ignore */ }
          }
          onDragStart(cell, e);
        }
      }}
    >
      {/* ── SGA danger class ring (toroide fino encima del cubo) ── */}
      {!isDimmed && (ghsDangerClass || cell.ghs_danger_class) && (
        <mesh
          ref={sgaRingRef}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, baseY + 0.85, 0]}
        >
          <ringGeometry args={[
            Math.max(width, depth) * 0.55,
            Math.max(width, depth) * 0.62,
            32
          ]} />
          <meshBasicMaterial
            color={getSGAColor(ghsDangerClass || cell.ghs_danger_class)}
            transparent
            opacity={isInGroupDrag ? 0.95 : 0.6}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* ── Floor glow ring (stays on floor, not inside the animated group) ── */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[Math.max(width, depth) * 0.5, Math.max(width, depth) * 0.72, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* ── Animated group: cube mesh + 3D stamp move together ── */}
      <group ref={cubeGroupRef} position={[0, baseY + 0.05, 0]}>

        {/* Main cube — centred at y=0 inside this group, height=0.8 → top at y=+0.4 */}
        <mesh ref={meshRef}>
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

        {/* ── 3D Stamp: canvas texture on a flat plane — no workers, no CSP issue ── */}
        {!isDimmed && (
          <mesh position={[0, 0.425, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.46, 0.46]} />
            <meshStandardMaterial
              map={stampTexture}
              transparent
              roughness={0.25}
              metalness={0.45}
            />
          </mesh>
        )}
      </group>

      {/* ── Source of move indicator (animated arrow) ── */}
      {isSourceOfMove && (
        <mesh position={[0, baseY + 1.2, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.2, 0.4, 4]} />
          <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.8} />
        </mesh>
      )}

      {/* ── v2.0 — UI flotante sobre el cubo ──
          Cuando showTooltip=true, monta el SampleTooltip via <Html>
          anclado encima del cubo. Cuando showGroupChip=true, monta
          el GroupChip. Solo uno de los dos puede estar visible a la vez
          (el tooltip se oculta en movement mode y cuando hay grupo). */}

      {showGroupChip && !showTooltip && (
        <Html
          position={[0, baseY + 1.0, 0]}
          center
          zIndexRange={[80, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <GroupChipInline
            sample={cell}
            sgaColor={groupChipColor || (ghsDangerClass ? getSGAColor(ghsDangerClass) : (cell.ghs_danger_class ? getSGAColor(cell.ghs_danger_class) : '#38bdf8'))}
          />
        </Html>
      )}

      {showTooltip && !movementMode && !showGroupChip && (
        <Html
          position={[0, baseY + 1.0, 0]}
          center
          zIndexRange={[90, 0]}
          distanceFactor={8}
          style={{ pointerEvents: 'auto' }}
        >
          <SampleTooltip
            sample={cell}
            sgaColor={ghsDangerClass ? getSGAColor(ghsDangerClass) : (cell.ghs_danger_class ? getSGAColor(cell.ghs_danger_class) : '#38bdf8')}
            onViewDetail={onTooltipViewDetail}
            onMove={onTooltipMove}
            onClose={onTooltipClose}
          />
        </Html>
      )}
    </group>
  );
};

const GroupChipInline = GroupChip;
