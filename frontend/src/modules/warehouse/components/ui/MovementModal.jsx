/**
 * MovementModal v3.0 — Premium redesign
 *
 * Modal flotante centrado que confirma un movimiento (single o group)
 * antes de ejecutar la API.
 *
 * Props:
 *  - samples: Array<sample>
 *  - target: { x, y, z, shelfId, shelfName }
 *  - conflicts: Array
 *  - mapData: object|null
 *  - previewCells: Array<{x,y,z,compatible}> | null
 *  - isExecuting: boolean
 *  - error: string|null
 *  - currentShelfId: string
 *  - onCancel: () => void
 *  - onConfirm: () => void
 *  - compatibleShelves: Array
 *  - onTargetChange: (newTarget) => void
 */
import React, { useMemo, useState } from 'react';
import { formatSampleId } from '../../utils/formatSampleId';
import ShelfMiniMap3D from '../minimap/ShelfMiniMap3D';
import {
  SURFACE, BLUR, RADIUS, PADDING, BACKDROP, FONT, ANIM, SHADOW,
  BUTTON,
} from '../../constants';

// ─── Helpers ────────────────────────────────────────────────────────────────

function computeGroupPositions(samples, anchorX, anchorY, anchorZ) {
  if (!samples || samples.length === 0) return [];
  const firstSample = samples[0];
  const baseX = firstSample.position_x ?? 0;
  const baseY = firstSample.position_y ?? 0;
  const baseZ = firstSample.position_z ?? 0;

  return samples.map((s) => ({
    sample_id: s.id,
    new_x: (s.position_x ?? 0) - baseX + anchorX,
    new_y: (s.position_y ?? 0) - baseY + anchorY,
    new_z: (s.position_z ?? 0) - baseZ + anchorZ,
    w: s.width ?? 1,
    h: s.height ?? 1,
    d: s.depth ?? 1,
  }));
}

function validateGroupBounds(positions, gridWidth, gridHeight, shelfDepth) {
  const errors = [];
  for (const p of positions) {
    if (p.new_x < 0 || p.new_x + p.w > gridWidth)
      errors.push(`X=${p.new_x} fuera de rango [0, ${gridWidth - p.w}]`);
    if (p.new_y < 0 || p.new_y + p.h > gridHeight)
      errors.push(`Y=${p.new_y} fuera de rango [0, ${gridHeight - p.h}]`);
    if (p.new_z < 0 || p.new_z + p.d > shelfDepth)
      errors.push(`Z=${p.new_z} fuera de rango [0, ${shelfDepth - p.d}]`);
  }
  return [...new Set(errors)];
}

// ─── Selector de campo numérico ──────────────────────────────────────────────
const FieldSelect = ({ label, value, options, onChange, hasError, disabled }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label style={{
      fontSize: 8, fontWeight: 800, color: '#64748b',
      textTransform: 'uppercase', letterSpacing: 0.5,
    }}>
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value, 10))}
      disabled={disabled}
      style={{
        background: hasError ? 'rgba(239,68,68,0.06)' : 'rgba(9,13,22,0.85)',
        border: `1px solid ${hasError ? 'rgba(239,68,68,0.45)' : 'rgba(56,189,248,0.2)'}`,
        borderRadius: RADIUS.SM,
        padding: '7px 9px',
        color: hasError ? '#fca5a5' : '#e2e8f0',
        fontSize: 11, fontWeight: 700,
        outline: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'border-color 0.15s',
        width: '100%',
      }}
    >
      {options}
    </select>
  </div>
);

// ─── MetaRow ─────────────────────────────────────────────────────────────────
const MetaRow = ({ label, value, mono = false }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '5px 0',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
  }}>
    <span style={{
      fontSize: 8, fontWeight: 800, color: '#475569',
      letterSpacing: 0.5, textTransform: 'uppercase',
      flexShrink: 0, minWidth: 70,
    }}>
      {label}
    </span>
    <span style={{
      flex: 1, minWidth: 0,
      fontSize: 11, fontWeight: 700, color: '#cbd5e1',
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      fontFamily: mono ? 'monospace' : 'inherit',
    }}>
      {value}
    </span>
  </div>
);

// ─── Componente Principal ────────────────────────────────────────────────────
const MovementModal = ({
  samples = [],
  target,
  conflicts = [],
  mapData = null,
  previewCells = null,
  isExecuting = false,
  error = null,
  currentShelfId,
  onCancel,
  onConfirm,
  compatibleShelves = [],
  onTargetChange,
}) => {
  const [showValidCells, setShowValidCells] = useState(false);

  const isGroup = samples.length > 1;
  const isCrossShelf = !!(target?.shelfId && currentShelfId && target.shelfId !== currentShelfId);

  const targetShelf = compatibleShelves.find(s => s.id === target?.shelfId) || {
    id: target?.shelfId || currentShelfId,
    name: target?.shelfName || 'Anaquel actual',
    grid_width: mapData?.shelf?.grid_width || 10,
    grid_height: mapData?.shelf?.grid_height || 10,
    shelf_depth: mapData?.shelf?.shelf_depth || 10,
  };

  const gridWidth = targetShelf.grid_width || 10;
  const gridHeight = targetShelf.grid_height || 10;
  const shelfDepth = targetShelf.shelf_depth || 10;

  const groupPositions = useMemo(
    () => {
      if (!target || samples.length === 0) return [];
      return computeGroupPositions(samples, target.x, target.y, target.z);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [samples, target?.x, target?.y, target?.z]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const boundErrors = useMemo(
    () => isGroup ? validateGroupBounds(groupPositions, gridWidth, gridHeight, shelfDepth) : [],
    [groupPositions, gridWidth, gridHeight, shelfDepth, isGroup]
  );

  const anchorBounds = useMemo(() => {
    if (!isGroup || samples.length === 0) return null;
    const firstSample = samples[0];
    const baseX = firstSample.position_x ?? 0;
    const baseY = firstSample.position_y ?? 0;
    const baseZ = firstSample.position_z ?? 0;
    let minDx = 0, minDy = 0, minDz = 0;
    let maxDx = 0, maxDy = 0, maxDz = 0;
    const sampleW = firstSample.width ?? 1;
    const sampleH = firstSample.height ?? 1;
    const sampleD = firstSample.depth ?? 1;
    for (const s of samples) {
      const dx = (s.position_x ?? 0) - baseX;
      const dy = (s.position_y ?? 0) - baseY;
      const dz = (s.position_z ?? 0) - baseZ;
      if (dx < minDx) minDx = dx;
      if (dy < minDy) minDy = dy;
      if (dz < minDz) minDz = dz;
      if (dx > maxDx) maxDx = dx;
      if (dy > maxDy) maxDy = dy;
      if (dz > maxDz) maxDz = dz;
    }
    return {
      minX: -minDx, minY: -minDy, minZ: -minDz,
      maxX: gridWidth - sampleW - maxDx,
      maxY: gridHeight - sampleH - maxDy,
      maxZ: shelfDepth - sampleD - maxDz,
    };
  }, [samples, gridWidth, gridHeight, shelfDepth, isGroup]);

  const validPreviewCells = useMemo(() => {
    if (!previewCells) return [];
    return previewCells.filter(c => c.compatible);
  }, [previewCells]);

  const isPositionInPreview = useMemo(() => {
    if (!previewCells || previewCells.length === 0) return null;
    const cell = previewCells.find(c => c.x === target?.x && c.y === target?.y && c.z === target?.z);
    return cell ? cell.compatible : false;
  }, [previewCells, target?.x, target?.y, target?.z]);

  if (!target || samples.length === 0) return null;

  const hasBoundErrors = boundErrors.length > 0;
  const hasConflicts = conflicts.length > 0;
  const previewSaysInvalid = isPositionInPreview === false;
  const canExecute = !hasBoundErrors && !hasConflicts && !previewSaysInvalid && !isExecuting;
  const compatibleCount = samples.length - conflicts.length;
  const isValid = !hasBoundErrors && !previewSaysInvalid && conflicts.length === 0;

  return (
    <div
      data-testid="movement-modal"
      onClick={!isExecuting ? onCancel : undefined}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: BACKDROP.Z_INDEX,
        animation: ANIM.FADE_IN,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, rgba(14,20,36,0.99) 0%, rgba(9,13,22,0.99) 100%)',
          backdropFilter: BLUR.XL,
          border: `1px solid ${hasBoundErrors ? 'rgba(239,68,68,0.35)' : isValid ? 'rgba(16,185,129,0.25)' : 'rgba(56,189,248,0.2)'}`,
          borderRadius: RADIUS.XL,
          width: 'min(580px, calc(100vw - 32px))',
          maxHeight: 'calc(100vh - 64px)',
          overflowY: 'auto',
          boxShadow: hasBoundErrors
            ? '0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(239,68,68,0.1) inset'
            : isValid
              ? '0 24px 64px rgba(0,0,0,0.8), 0 0 30px rgba(16,185,129,0.08)'
              : '0 24px 64px rgba(0,0,0,0.8)',
          animation: ANIM.SLIDE_UP,
          scrollbarWidth: 'thin',
          scrollbarColor: '#1e293b transparent',
        }}
      >
        {/* Barra de estado de color en el top del modal */}
        <div style={{
          height: 3,
          borderRadius: `${RADIUS.XL}px ${RADIUS.XL}px 0 0`,
          background: hasBoundErrors
            ? 'linear-gradient(90deg, #ef4444, #f87171)'
            : isValid
              ? 'linear-gradient(90deg, #10b981, #34d399)'
              : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
          boxShadow: hasBoundErrors
            ? '0 0 12px rgba(239,68,68,0.5)'
            : isValid
              ? '0 0 12px rgba(16,185,129,0.5)'
              : '0 0 12px rgba(245,158,11,0.5)',
        }} />

        <div style={{ padding: '18px 22px' }}>
          {/* ── Header ── */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18,
          }}>
            {/* Ícono de estado */}
            <div style={{
              width: 44, height: 44, borderRadius: RADIUS.LG,
              background: hasBoundErrors
                ? 'linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(220,38,38,0.1) 100%)'
                : isValid
                  ? 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(5,150,105,0.1) 100%)'
                  : 'linear-gradient(135deg, rgba(14,165,233,0.2) 0%, rgba(99,102,241,0.1) 100%)',
              border: `1px solid ${hasBoundErrors ? 'rgba(239,68,68,0.3)' : isValid ? 'rgba(16,185,129,0.3)' : 'rgba(14,165,233,0.3)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, flexShrink: 0,
            }}>
              {hasBoundErrors ? '⚠️' : isValid ? '✅' : '📦'}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                {isGroup && (
                  <span style={{
                    padding: '2px 7px', borderRadius: 20,
                    fontSize: 8, fontWeight: 900, letterSpacing: 0.5,
                    background: 'rgba(139,92,246,0.15)',
                    border: '1px solid rgba(139,92,246,0.3)',
                    color: '#c4b5fd', textTransform: 'uppercase',
                  }}>
                    Grupo · {samples.length} muestras
                  </span>
                )}
                {isCrossShelf && (
                  <span style={{
                    padding: '2px 7px', borderRadius: 20,
                    fontSize: 8, fontWeight: 900, letterSpacing: 0.5,
                    background: 'rgba(251,191,36,0.15)',
                    border: '1px solid rgba(251,191,36,0.3)',
                    color: '#fde68a', textTransform: 'uppercase',
                  }}>
                    ↗ Entre anaqueles
                  </span>
                )}
                <span style={{
                  padding: '2px 7px', borderRadius: 20,
                  fontSize: 8, fontWeight: 900, letterSpacing: 0.5,
                  background: hasBoundErrors
                    ? 'rgba(239,68,68,0.12)'
                    : isValid
                      ? 'rgba(16,185,129,0.12)'
                      : 'rgba(245,158,11,0.12)',
                  border: `1px solid ${hasBoundErrors ? 'rgba(239,68,68,0.3)' : isValid ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                  color: hasBoundErrors ? '#fca5a5' : isValid ? '#6ee7b7' : '#fde68a',
                  textTransform: 'uppercase',
                }}>
                  {hasBoundErrors ? 'Posición inválida' : isValid ? 'Posición válida' : `${conflicts.length} conflicto(s)`}
                </span>
              </div>
              <h2 style={{
                margin: 0, fontSize: 15, fontWeight: 900,
                color: '#f8fafc', letterSpacing: 0.2,
              }}>
                Confirmar Movimiento
              </h2>
              <p style={{
                margin: '3px 0 0', fontSize: 10, color: '#64748b', fontWeight: 600,
              }}>
                {samples.length === 1
                  ? `Muestra ${formatSampleId(samples[0].id)}`
                  : `${samples.length} muestras · posicionamiento en bloque`}
              </p>
            </div>
          </div>

          {/* ── Alerta de error de límites ── */}
          {hasBoundErrors && (
            <div style={{
              marginBottom: 14,
              padding: '11px 14px',
              background: 'rgba(239,68,68,0.07)',
              border: '1px solid rgba(239,68,68,0.35)',
              borderRadius: RADIUS.LG,
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14 }}>⚠️</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#fca5a5' }}>
                  El grupo no cabe en esta posición
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 9, color: '#f87171', lineHeight: 1.5 }}>
                Al mover el grupo en bloque, algunas muestras quedarían fuera de los límites del anaquel.
                {anchorBounds && (
                  <> El anchor debe estar en X: [{anchorBounds.minX}–{anchorBounds.maxX}], Y: [{anchorBounds.minY}–{anchorBounds.maxY}], Z: [{anchorBounds.minZ}–{anchorBounds.maxZ}].</>
                )}
              </p>
              {validPreviewCells.length > 0 && (
                <button
                  onClick={() => setShowValidCells(v => !v)}
                  style={{
                    alignSelf: 'flex-start', padding: '4px 10px',
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    borderRadius: RADIUS.SM, color: '#34d399',
                    fontSize: 9, fontWeight: 800, cursor: 'pointer',
                  }}
                >
                  {showValidCells ? '▲ Ocultar' : `▼ Ver ${validPreviewCells.length} posiciones válidas`}
                </button>
              )}
            </div>
          )}

          {/* ── Posiciones válidas (collapsible) ── */}
          {showValidCells && validPreviewCells.length > 0 && (
            <div style={{
              marginBottom: 14, padding: '10px 12px',
              background: 'rgba(16,185,129,0.04)',
              border: '1px solid rgba(16,185,129,0.18)',
              borderRadius: RADIUS.LG,
            }}>
              <p style={{ margin: '0 0 8px', fontSize: 8, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Posiciones válidas para el anchor
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxHeight: 100, overflowY: 'auto' }}>
                {validPreviewCells.slice(0, 50).map((c) => (
                  <button
                    key={`${c.x}-${c.y}-${c.z}`}
                    onClick={() => {
                      if (onTargetChange) onTargetChange({ ...target, x: c.x, y: c.y, z: c.z });
                      setShowValidCells(false);
                    }}
                    style={{
                      padding: '3px 8px',
                      background: target.x === c.x && target.y === c.y && target.z === c.z
                        ? 'rgba(16,185,129,0.25)' : 'rgba(16,185,129,0.08)',
                      border: `1px solid ${target.x === c.x && target.y === c.y && target.z === c.z
                        ? 'rgba(16,185,129,0.5)' : 'rgba(16,185,129,0.18)'}`,
                      borderRadius: 6, color: '#34d399', fontSize: 9, fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'monospace', whiteSpace: 'nowrap',
                    }}
                  >
                    ({c.x},{c.y},{c.z})
                  </button>
                ))}
                {validPreviewCells.length > 50 && (
                  <span style={{ fontSize: 8, color: '#64748b', alignSelf: 'center', fontWeight: 700 }}>
                    +{validPreviewCells.length - 50} más…
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ── Posiciones calculadas del grupo ── */}
          {isGroup && groupPositions.length > 0 && (
            <div style={{
              marginBottom: 14, padding: '9px 12px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: RADIUS.LG,
            }}>
              <p style={{ margin: '0 0 7px', fontSize: 8, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Posiciones del grupo ({samples.length} muestras)
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {groupPositions.map((p, i) => {
                  const outOfBounds =
                    p.new_x < 0 || p.new_x + p.w > gridWidth ||
                    p.new_y < 0 || p.new_y + p.h > gridHeight ||
                    p.new_z < 0 || p.new_z + p.d > shelfDepth;
                  return (
                    <div
                      key={p.sample_id}
                      style={{
                        padding: '3px 8px',
                        background: outOfBounds ? 'rgba(239,68,68,0.1)' : 'rgba(14,165,233,0.07)',
                        border: `1px solid ${outOfBounds ? 'rgba(239,68,68,0.25)' : 'rgba(14,165,233,0.18)'}`,
                        borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      <span style={{ fontSize: 8, fontWeight: 800, color: '#64748b' }}>#{i + 1}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: outOfBounds ? '#f87171' : '#7dd3fc', fontFamily: 'monospace' }}>
                        ({p.new_x},{p.new_y},{p.new_z})
                      </span>
                      {outOfBounds && <span style={{ fontSize: 9, color: '#f87171' }}>⚠</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Controles de posición ── */}
          <div style={{
            background: 'rgba(255,255,255,0.015)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: RADIUS.LG, padding: '14px',
            marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: 9, fontWeight: 800, color: '#475569', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                {isGroup ? 'Posición del Anchor (1ª muestra)' : 'Ubicación Destino'}
              </h3>
              {isGroup && anchorBounds && (
                <span style={{ fontSize: 8, color: '#334155', fontWeight: 600 }}>
                  Rango válido: X[{anchorBounds.minX}–{anchorBounds.maxX}] · Y[{anchorBounds.minY}–{anchorBounds.maxY}] · Z[{anchorBounds.minZ}–{anchorBounds.maxZ}]
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {/* Dropdown de Anaquel */}
              <FieldSelect
                label="Anaquel"
                value={target.shelfId}
                onChange={(val) => {
                  const shelf = compatibleShelves.find(s => s.id === String(val));
                  if (shelf && onTargetChange) {
                    onTargetChange({ x: 0, y: 0, z: 0, shelfId: shelf.id, shelfName: shelf.name });
                  }
                }}
                options={
                  compatibleShelves.length > 0
                    ? compatibleShelves.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.id === currentShelfId ? '(actual)' : ''}
                        </option>
                      ))
                    : <option value={target.shelfId}>{target.shelfName || 'Anaquel destino'}</option>
                }
              />

              {/* Nivel Y */}
              <FieldSelect
                label="Nivel (Y)"
                value={target.y}
                onChange={(val) => onTargetChange && onTargetChange({ ...target, y: val })}
                hasError={hasBoundErrors && anchorBounds && (target.y < anchorBounds.minY || target.y > anchorBounds.maxY)}
                options={Array.from({ length: gridHeight }).map((_, i) => {
                  const isInRange = !anchorBounds || (i >= anchorBounds.minY && i <= anchorBounds.maxY);
                  return (
                    <option key={i} value={i} disabled={isGroup && !isInRange}>
                      Nivel {i}{isGroup && !isInRange ? ' ⚠' : ''}
                    </option>
                  );
                })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {/* Columna X */}
              <FieldSelect
                label="Columna (X)"
                value={target.x}
                onChange={(val) => onTargetChange && onTargetChange({ ...target, x: val })}
                hasError={hasBoundErrors && anchorBounds && (target.x < anchorBounds.minX || target.x > anchorBounds.maxX)}
                options={Array.from({ length: gridWidth }).map((_, i) => {
                  const isInRange = !anchorBounds || (i >= anchorBounds.minX && i <= anchorBounds.maxX);
                  return (
                    <option key={i} value={i} disabled={isGroup && !isInRange}>
                      Columna {i}{isGroup && !isInRange ? ' ⚠' : ''}
                    </option>
                  );
                })}
              />

              {/* Profundidad Z */}
              <FieldSelect
                label="Profundidad (Z)"
                value={target.z}
                onChange={(val) => onTargetChange && onTargetChange({ ...target, z: val })}
                hasError={hasBoundErrors && anchorBounds && (target.z < anchorBounds.minZ || target.z > anchorBounds.maxZ)}
                options={Array.from({ length: shelfDepth }).map((_, i) => {
                  const isInRange = !anchorBounds || (i >= anchorBounds.minZ && i <= anchorBounds.maxZ);
                  return (
                    <option key={i} value={i} disabled={isGroup && !isInRange}>
                      Prof. {i}{isGroup && !isInRange ? ' ⚠' : ''}
                    </option>
                  );
                })}
              />
            </div>

            {/* Auto-selección */}
            {hasBoundErrors && validPreviewCells.length > 0 && (
              <button
                onClick={() => {
                  const first = validPreviewCells[0];
                  if (first && onTargetChange) onTargetChange({ ...target, x: first.x, y: first.y, z: first.z });
                }}
                style={{
                  padding: '7px 14px', alignSelf: 'flex-start',
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.35)',
                  borderRadius: RADIUS.SM, color: '#34d399',
                  fontSize: 10, fontWeight: 800, cursor: 'pointer', letterSpacing: 0.3,
                }}
              >
                ✓ Auto-seleccionar primera posición válida ({validPreviewCells[0]?.x},{validPreviewCells[0]?.y},{validPreviewCells[0]?.z})
              </button>
            )}
          </div>

          {/* ── Vista previa (mapa) + metadata ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: mapData ? '200px 1fr' : '1fr',
            gap: 12, marginBottom: 16, alignItems: 'start',
          }}>
            {mapData && (
              <div style={{
                width: 200, height: 150, borderRadius: RADIUS.LG,
                border: `1px solid ${hasBoundErrors ? 'rgba(239,68,68,0.25)' : isValid ? 'rgba(16,185,129,0.2)' : 'rgba(56,189,248,0.15)'}`,
                background: 'rgba(5,8,18,0.6)',
                position: 'relative', overflow: 'hidden',
                flexShrink: 0,
              }}>
                <div style={{ position: 'absolute', inset: 0 }}>
                  <ShelfMiniMap3D
                    mapData={mapData}
                    target={{ x: target.x, y: target.y, z: target.z }}
                    validity={hasBoundErrors || previewSaysInvalid ? 'invalid' : conflicts.length === 0 ? 'valid' : 'invalid'}
                    title="Destino"
                    compact
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <MetaRow label="Anchor" value={`(${target.x}, ${target.y}, ${target.z})`} mono />
              <MetaRow
                label="Anaquel"
                value={
                  isCrossShelf ? (
                    <span>
                      <span style={{ color: '#fbbf24', fontWeight: 700 }}>↗</span>{' '}
                      {target.shelfName || target.shelfId}{' '}
                      <span style={{ color: '#64748b', fontSize: 9 }}>(cruzado)</span>
                    </span>
                  ) : (
                    <span style={{ color: '#cbd5e1' }}>{target.shelfName || 'mismo anaquel'}</span>
                  )
                }
              />
              {isGroup && (
                <MetaRow
                  label="Muestras"
                  value={
                    <span style={{ color: hasBoundErrors ? '#f87171' : '#34d399', fontWeight: 800 }}>
                      {hasBoundErrors
                        ? `⚠ ${groupPositions.filter(p => p.new_x < 0 || p.new_x + p.w > gridWidth || p.new_y < 0 || p.new_y + p.h > gridHeight || p.new_z < 0 || p.new_z + p.d > shelfDepth).length} fuera de rango`
                        : `✓ ${samples.length} caben correctamente`}
                    </span>
                  }
                />
              )}

              {/* Barra de compatibilidad */}
              <div style={{ marginTop: 10 }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontSize: 8, fontWeight: 900, letterSpacing: 0.4, marginBottom: 5,
                }}>
                  <span style={{ color: (hasBoundErrors || previewSaysInvalid) ? '#f87171' : conflicts.length === 0 ? '#34d399' : '#f87171' }}>
                    {hasBoundErrors
                      ? '⚠ POSICIÓN INVÁLIDA'
                      : previewSaysInvalid
                        ? '⚠ CONFLICTO EN DESTINO'
                        : conflicts.length === 0
                          ? '✓ SIN CONFLICTOS'
                          : `⚠ ${conflicts.length} CONFLICTOS`}
                  </span>
                  <span style={{ color: '#334155' }}>{compatibleCount}/{samples.length}</span>
                </div>
                <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                  <div style={{
                    width: hasBoundErrors ? '0%' : `${(compatibleCount / samples.length) * 100}%`,
                    height: '100%',
                    background: conflicts.length === 0 && !hasBoundErrors
                      ? 'linear-gradient(90deg, #34d399, #10b981)'
                      : 'linear-gradient(90deg, #f87171, #ef4444)',
                    transition: 'width 250ms ease',
                    boxShadow: conflicts.length === 0 && !hasBoundErrors ? '0 0 8px rgba(52,211,153,0.5)' : 'none',
                  }} />
                </div>
              </div>

              {/* Error de API */}
              {error && (
                <div data-testid="movement-modal-error" style={{
                  marginTop: 10, padding: '8px 10px',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: RADIUS.SM, color: '#fca5a5',
                  fontSize: 9, fontWeight: 700,
                }}>
                  ✕ {error}
                </div>
              )}
            </div>
          </div>

          {/* ── Footer de acciones ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            justifyContent: 'flex-end',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            paddingTop: 14,
          }}>
            <button
              onClick={onCancel}
              disabled={isExecuting}
              data-testid="movement-modal-cancel"
              style={{
                padding: BUTTON.GHOST.PAD,
                background: BUTTON.GHOST.BG,
                border: BUTTON.GHOST.BORDER,
                borderRadius: BUTTON.GHOST.RADIUS,
                color: BUTTON.GHOST.COLOR,
                fontSize: BUTTON.GHOST.FONT_SIZE,
                fontWeight: BUTTON.GHOST.FONT_WEIGHT,
                cursor: isExecuting ? 'not-allowed' : 'pointer',
                letterSpacing: BUTTON.GHOST.LETTER_SPACING,
                opacity: isExecuting ? 0.5 : 1,
                transition: 'all 0.15s',
              }}
            >
              ✕ Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={!canExecute}
              data-testid="movement-modal-confirm"
              title={hasBoundErrors ? `El grupo no cabe: ${boundErrors.join('; ')}` : undefined}
              style={{
                padding: BUTTON.PRIMARY_GREEN.PAD,
                background: canExecute ? BUTTON.PRIMARY_GREEN.GRADIENT : BUTTON.DISABLED.BG,
                border: canExecute ? BUTTON.PRIMARY_GREEN.BORDER : 'none',
                borderRadius: BUTTON.PRIMARY_GREEN.RADIUS,
                color: canExecute ? BUTTON.PRIMARY_GREEN.COLOR : BUTTON.DISABLED.COLOR,
                fontSize: BUTTON.PRIMARY_GREEN.FONT_SIZE,
                fontWeight: BUTTON.PRIMARY_GREEN.FONT_WEIGHT,
                cursor: canExecute ? 'pointer' : 'not-allowed',
                letterSpacing: BUTTON.PRIMARY_GREEN.LETTER_SPACING,
                boxShadow: canExecute ? BUTTON.PRIMARY_GREEN.SHADOW : 'none',
                transition: 'all 0.15s',
              }}
            >
              {isExecuting
                ? '⟳ Ejecutando…'
                : hasBoundErrors
                  ? '⚠ Posición inválida'
                  : `→ Confirmar Movimiento (${samples.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovementModal;
