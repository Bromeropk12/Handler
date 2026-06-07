/**
 * MovementModal
 *
 * Modal flotante centrado que confirma un movimiento (single o group)
 * antes de ejecutar la API.
 *
 * CAMBIOS CLAVE v2.1:
 *  - Calcula posiciones finales de TODAS las muestras del grupo
 *    usando offsets relativos al anchor → valida límites en el frontend
 *    antes de enviar al backend (evita errores 400 por fuera de rango).
 *  - Muestra una grilla interactiva de posiciones válidas del preview
 *    para que el usuario elija sin riesgo de error.
 *  - Indica claramente si el grupo NO cabe en la posición elegida.
 *
 * Props:
 *  - samples: Array<sample>
 *  - target: { x, y, z, shelfId, shelfName }
 *  - conflicts: Array
 *  - mapData: object|null
 *  - previewCells: Array<{x,y,z,compatible}> | null  (del backend preview)
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

/**
 * Dado un anchor (x,y,z) y las muestras del grupo, calcula las posiciones
 * finales de cada muestra aplicando offsets relativos.
 */
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

/**
 * Verifica si todas las posiciones del grupo están dentro de los límites.
 */
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

// ─── Componente ─────────────────────────────────────────────────────────────

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

  // ── Todos los hooks ANTES del return condicional (reglas de React) ──

  const isGroup = samples.length > 1;
  const isCrossShelf = !!(target?.shelfId && currentShelfId && target.shelfId !== currentShelfId);

  // Encontrar anaquel de destino
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

  // ── Calcular posiciones del grupo y validar límites ──
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

  // ── Calcular rango seguro para el anchor del grupo ──
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
      minX: -minDx,
      minY: -minDy,
      minZ: -minDz,
      maxX: gridWidth - sampleW - maxDx,
      maxY: gridHeight - sampleH - maxDy,
      maxZ: shelfDepth - sampleD - maxDz,
    };
  }, [samples, gridWidth, gridHeight, shelfDepth, isGroup]);

  // ── Obtener celdas válidas del preview ──
  const validPreviewCells = useMemo(() => {
    if (!previewCells) return [];
    return previewCells.filter(c => c.compatible);
  }, [previewCells]);

  const isPositionInPreview = useMemo(() => {
    if (!previewCells || previewCells.length === 0) return null;
    const cell = previewCells.find(
      c => c.x === target?.x && c.y === target?.y && c.z === target?.z
    );
    return cell ? cell.compatible : false;
  }, [previewCells, target?.x, target?.y, target?.z]);

  // ── Guarda: renderizar solo cuando hay datos ──
  if (!target || samples.length === 0) return null;

  // ── Validez final ──
  const hasBoundErrors = boundErrors.length > 0;
  const hasConflicts = conflicts.length > 0;
  const previewSaysInvalid = isPositionInPreview === false;
  const canExecute = !hasBoundErrors && !hasConflicts && !previewSaysInvalid && !isExecuting;
  const compatibleCount = samples.length - conflicts.length;

  return (
    <div
      data-testid="movement-modal"
      onClick={!isExecuting ? onCancel : undefined}
      style={{
        position: 'fixed', inset: 0,
        background: BACKDROP.BG,
        backdropFilter: BACKDROP.FILTER,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: BACKDROP.Z_INDEX,
        animation: ANIM.FADE_IN,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: SURFACE.PANEL,
          backdropFilter: BLUR.XL,
          border: `1px solid ${hasBoundErrors ? 'rgba(239,68,68,0.4)' : 'rgba(56, 189, 248, 0.3)'}`,
          borderRadius: RADIUS.XL,
          padding: PADDING.PANEL,
          width: 'min(600px, calc(100vw - 32px))',
          maxHeight: 'calc(100vh - 64px)',
          overflowY: 'auto',
          boxShadow: `${SHADOW.PANEL}, 0 0 0 1px ${hasBoundErrors ? 'rgba(239,68,68,0.1)' : 'rgba(56, 189, 248, 0.1)'} inset`,
          animation: ANIM.SLIDE_UP,
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          marginBottom: 16,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: RADIUS.MD + 2,
            background: hasBoundErrors
              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
              : 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 800, color: '#fff',
            flexShrink: 0,
          }}>{hasBoundErrors ? '⚠' : '→'}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{
              margin: 0, fontSize: FONT.HEADING_SM.SIZE,
              fontWeight: FONT.HEADING_SM.WEIGHT,
              color: FONT.HEADING_SM.COLOR,
              letterSpacing: 0.2,
            }}>Confirmar movimiento</h2>
            <p style={{
              margin: '3px 0 0', fontSize: 11, color: '#64748b', fontWeight: 600,
            }}>
              {samples.length === 1
                ? `Muestra ${formatSampleId(samples[0].id)}`
                : `${samples.length} muestras · batch atómico · posicionamiento en grupo`}
            </p>
          </div>
        </div>

        {/* Alerta de error de límites – la más importante */}
        {hasBoundErrors && (
          <div style={{
            marginBottom: 12,
            padding: '10px 12px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: RADIUS.SM,
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13 }}>⚠️</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#fca5a5' }}>
                El grupo no cabe en esta posición
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 10, color: '#f87171', lineHeight: 1.5 }}>
              Al mover el grupo en bloque, algunas muestras quedarían fuera de los límites del anaquel.
              {anchorBounds && (
                <> El anchor (primera muestra) debe estar entre{' '}
                  X: [{anchorBounds.minX}–{anchorBounds.maxX}],{' '}
                  Y: [{anchorBounds.minY}–{anchorBounds.maxY}],{' '}
                  Z: [{anchorBounds.minZ}–{anchorBounds.maxZ}].
                </>
              )}
            </p>
            {validPreviewCells.length > 0 && (
              <button
                onClick={() => setShowValidCells(v => !v)}
                style={{
                  alignSelf: 'flex-start',
                  padding: '4px 10px',
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: RADIUS.SM,
                  color: '#38bdf8',
                  fontSize: 10, fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {showValidCells ? '▲ Ocultar' : `▼ Ver ${validPreviewCells.length} posiciones válidas`}
              </button>
            )}
          </div>
        )}

        {/* Posiciones válidas del preview (collapsible) */}
        {showValidCells && validPreviewCells.length > 0 && (
          <div style={{
            marginBottom: 12,
            padding: '10px 12px',
            background: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: RADIUS.SM,
          }}>
            <p style={{ margin: '0 0 8px', fontSize: 9, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Posiciones válidas para el anchor (primera muestra)
            </p>
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 4,
              maxHeight: 120, overflowY: 'auto',
            }}>
              {validPreviewCells.slice(0, 50).map((c) => (
                <button
                  key={`${c.x}-${c.y}-${c.z}`}
                  onClick={() => {
                    if (onTargetChange) {
                      onTargetChange({ ...target, x: c.x, y: c.y, z: c.z });
                    }
                    setShowValidCells(false);
                  }}
                  style={{
                    padding: '3px 8px',
                    background: target.x === c.x && target.y === c.y && target.z === c.z
                      ? 'rgba(16, 185, 129, 0.3)'
                      : 'rgba(16, 185, 129, 0.1)',
                    border: `1px solid ${target.x === c.x && target.y === c.y && target.z === c.z
                      ? 'rgba(16, 185, 129, 0.6)'
                      : 'rgba(16, 185, 129, 0.2)'}`,
                    borderRadius: 6,
                    color: '#34d399',
                    fontSize: 10, fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ({c.x},{c.y},{c.z})
                </button>
              ))}
              {validPreviewCells.length > 50 && (
                <span style={{ fontSize: 9, color: '#64748b', alignSelf: 'center', fontWeight: 700 }}>
                  +{validPreviewCells.length - 50} más…
                </span>
              )}
            </div>
          </div>
        )}

        {/* Posiciones del grupo calculadas */}
        {isGroup && groupPositions.length > 0 && (
          <div style={{
            marginBottom: 12,
            padding: '8px 12px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: RADIUS.SM,
          }}>
            <p style={{ margin: '0 0 6px', fontSize: 9, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Posiciones calculadas del grupo ({samples.length} muestras)
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
                      background: outOfBounds ? 'rgba(239, 68, 68, 0.12)' : 'rgba(14, 165, 233, 0.08)',
                      border: `1px solid ${outOfBounds ? 'rgba(239,68,68,0.3)' : 'rgba(14,165,233,0.2)'}`,
                      borderRadius: 6,
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    <span style={{ fontSize: 9, fontWeight: 800, color: '#64748b' }}>#{i + 1}</span>
                    <span style={{
                      fontSize: 9, fontWeight: 700,
                      color: outOfBounds ? '#f87171' : '#7dd3fc',
                      fontFamily: 'monospace',
                    }}>
                      ({p.new_x},{p.new_y},{p.new_z})
                    </span>
                    {outOfBounds && <span style={{ fontSize: 9, color: '#f87171' }}>⚠</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Dynamic Target Selectors */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          borderRadius: RADIUS.MD,
          padding: 12,
          marginBottom: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{
              margin: 0, fontSize: 10, fontWeight: 800, color: '#94a3b8',
              letterSpacing: 0.5, textTransform: 'uppercase'
            }}>
              {isGroup ? 'Posición del Anchor (1ª muestra)' : 'Ajustar Ubicación de Destino'}
            </h3>
            {isGroup && anchorBounds && (
              <span style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>
                Rango válido: X[{anchorBounds.minX}–{anchorBounds.maxX}]
                · Y[{anchorBounds.minY}–{anchorBounds.maxY}]
                · Z[{anchorBounds.minZ}–{anchorBounds.maxZ}]
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {/* Dropdown de Anaquel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Anaquel</label>
              <select
                value={target.shelfId}
                onChange={(e) => {
                  const shelf = compatibleShelves.find(s => s.id === e.target.value);
                  if (shelf && onTargetChange) {
                    onTargetChange({
                      x: 0, y: 0, z: 0,
                      shelfId: shelf.id,
                      shelfName: shelf.name,
                    });
                  }
                }}
                style={{
                  background: 'rgba(9, 13, 22, 0.8)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: RADIUS.SM,
                  padding: '6px 8px',
                  color: '#fff',
                  fontSize: 11, fontWeight: 700,
                  outline: 'none',
                }}
              >
                {compatibleShelves.length > 0 ? (
                  compatibleShelves.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.id === currentShelfId ? '(actual)' : ''}
                    </option>
                  ))
                ) : (
                  <option value={target.shelfId}>{target.shelfName || 'Anaquel destino'}</option>
                )}
              </select>
            </div>

            {/* Dropdown de Nivel (Y) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Nivel (Y)</label>
              <select
                value={target.y}
                onChange={(e) => {
                  if (onTargetChange) {
                    onTargetChange({ ...target, y: parseInt(e.target.value, 10) });
                  }
                }}
                style={{
                  background: 'rgba(9, 13, 22, 0.8)',
                  border: `1px solid ${hasBoundErrors && (target.y < (anchorBounds?.minY ?? 0) || target.y > (anchorBounds?.maxY ?? gridHeight - 1)) ? 'rgba(239,68,68,0.4)' : 'rgba(56, 189, 248, 0.2)'}`,
                  borderRadius: RADIUS.SM,
                  padding: '6px 8px',
                  color: '#fff',
                  fontSize: 11, fontWeight: 700,
                  outline: 'none',
                }}
              >
                {Array.from({ length: gridHeight }).map((_, i) => {
                  const isInRange = !anchorBounds || (i >= anchorBounds.minY && i <= anchorBounds.maxY);
                  return (
                    <option key={i} value={i} disabled={isGroup && !isInRange}>
                      Nivel {i}{isGroup && !isInRange ? ' ⚠ fuera de rango' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {/* Selector de X */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Columna (X)</label>
              <select
                value={target.x}
                onChange={(e) => {
                  if (onTargetChange) {
                    onTargetChange({ ...target, x: parseInt(e.target.value, 10) });
                  }
                }}
                style={{
                  background: 'rgba(9, 13, 22, 0.8)',
                  border: `1px solid ${hasBoundErrors && (target.x < (anchorBounds?.minX ?? 0) || target.x > (anchorBounds?.maxX ?? gridWidth - 1)) ? 'rgba(239,68,68,0.4)' : 'rgba(56, 189, 248, 0.2)'}`,
                  borderRadius: RADIUS.SM,
                  padding: '6px 8px',
                  color: '#fff',
                  fontSize: 11, fontWeight: 700,
                  outline: 'none',
                }}
              >
                {Array.from({ length: gridWidth }).map((_, i) => {
                  const isInRange = !anchorBounds || (i >= anchorBounds.minX && i <= anchorBounds.maxX);
                  return (
                    <option key={i} value={i} disabled={isGroup && !isInRange}>
                      Columna {i}{isGroup && !isInRange ? ' ⚠' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Selector de Z */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Profundidad (Z)</label>
              <select
                value={target.z}
                onChange={(e) => {
                  if (onTargetChange) {
                    onTargetChange({ ...target, z: parseInt(e.target.value, 10) });
                  }
                }}
                style={{
                  background: 'rgba(9, 13, 22, 0.8)',
                  border: `1px solid ${hasBoundErrors && (target.z < (anchorBounds?.minZ ?? 0) || target.z > (anchorBounds?.maxZ ?? shelfDepth - 1)) ? 'rgba(239,68,68,0.4)' : 'rgba(56, 189, 248, 0.2)'}`,
                  borderRadius: RADIUS.SM,
                  padding: '6px 8px',
                  color: '#fff',
                  fontSize: 11, fontWeight: 700,
                  outline: 'none',
                }}
              >
                {Array.from({ length: shelfDepth }).map((_, i) => {
                  const isInRange = !anchorBounds || (i >= anchorBounds.minZ && i <= anchorBounds.maxZ);
                  return (
                    <option key={i} value={i} disabled={isGroup && !isInRange}>
                      Profundidad {i}{isGroup && !isInRange ? ' ⚠' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Sugerencia automática de posición válida */}
          {hasBoundErrors && validPreviewCells.length > 0 && (
            <button
              onClick={() => {
                const first = validPreviewCells[0];
                if (first && onTargetChange) {
                  onTargetChange({ ...target, x: first.x, y: first.y, z: first.z });
                }
              }}
              style={{
                padding: '6px 12px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: RADIUS.SM,
                color: '#34d399',
                fontSize: 10, fontWeight: 800,
                cursor: 'pointer',
                letterSpacing: 0.3,
                alignSelf: 'flex-start',
              }}
            >
              ✓ Auto-seleccionar primera posición válida ({validPreviewCells[0]?.x},{validPreviewCells[0]?.y},{validPreviewCells[0]?.z})
            </button>
          )}
        </div>

        {/* Body: mapa + meta */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: mapData ? '220px 1fr' : '1fr',
          gap: 12,
          marginBottom: 16,
        }}>
          {mapData && (
            <div style={{
              width: 220, height: 160, borderRadius: RADIUS.MD + 2,
              border: `1px solid ${hasBoundErrors ? 'rgba(239,68,68,0.3)' : 'rgba(56, 189, 248, 0.2)'}`,
              background: 'rgba(9, 13, 22, 0.5)',
              position: 'relative', overflow: 'hidden',
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <MetaRow
              label="Anchor"
              value={`(${target.x}, ${target.y}, ${target.z})`}
              mono
            />
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

            {/* Validity bar */}
            <div style={{ marginTop: 6 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 9, fontWeight: 800, letterSpacing: 0.4,
                color: (hasBoundErrors || previewSaysInvalid) ? '#f87171' : conflicts.length === 0 ? '#34d399' : '#f87171',
                marginBottom: 4,
              }}>
                <span>
                  {hasBoundErrors
                    ? '⚠ POSICIÓN INVÁLIDA – GRUPO FUERA DE RANGO'
                    : previewSaysInvalid
                      ? '⚠ CONFLICTO EN DESTINO'
                      : conflicts.length === 0
                        ? '✓ SIN CONFLICTOS'
                        : `⚠ ${conflicts.length} CONFLICTOS`}
                </span>
                <span style={{ color: '#64748b' }}>{compatibleCount}/{samples.length}</span>
              </div>
              <div style={{
                height: 4, borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.04)',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: hasBoundErrors ? '0%' : `${(compatibleCount / samples.length) * 100}%`,
                  height: '100%',
                  background: conflicts.length === 0 && !hasBoundErrors
                    ? 'linear-gradient(90deg, #34d399, #10b981)'
                    : 'linear-gradient(90deg, #f87171, #ef4444)',
                  transition: 'width 250ms ease',
                }} />
              </div>
            </div>

            {/* Error de API */}
            {error && (
              <div data-testid="movement-modal-error" style={{
                marginTop: 6, padding: '8px 10px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: RADIUS.SM,
                color: '#fca5a5',
                fontSize: 10, fontWeight: 700,
              }}>✕ {error}</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          justifyContent: 'flex-end',
          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          paddingTop: 12,
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
              cursor: isExecuting ? BUTTON.DISABLED.CURSOR : 'pointer',
              letterSpacing: BUTTON.GHOST.LETTER_SPACING,
              opacity: isExecuting ? 0.5 : 1,
            }}
          >✕ Cancelar</button>
          <button
            onClick={onConfirm}
            disabled={!canExecute}
            data-testid="movement-modal-confirm"
            title={hasBoundErrors ? `El grupo no cabe: ${boundErrors.join('; ')}` : undefined}
            style={{
              padding: BUTTON.PRIMARY_GREEN.PAD,
              background: canExecute
                ? BUTTON.PRIMARY_GREEN.GRADIENT
                : BUTTON.DISABLED.BG,
              border: BUTTON.PRIMARY_GREEN.BORDER,
              borderRadius: BUTTON.PRIMARY_GREEN.RADIUS,
              color: BUTTON.PRIMARY_GREEN.COLOR,
              fontSize: BUTTON.PRIMARY_GREEN.FONT_SIZE,
              fontWeight: BUTTON.PRIMARY_GREEN.FONT_WEIGHT,
              cursor: canExecute ? 'pointer' : BUTTON.DISABLED.CURSOR,
              letterSpacing: BUTTON.PRIMARY_GREEN.LETTER_SPACING,
              boxShadow: canExecute ? BUTTON.PRIMARY_GREEN.SHADOW : 'none',
            }}
          >{isExecuting ? '⟳ Ejecutando…' : hasBoundErrors ? '⚠ Posición inválida' : `→ Mover ${samples.length}`}</button>
        </div>
      </div>
    </div>
  );
};

const MetaRow = ({ label, value, mono = false }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
    <span style={{
      fontSize: 9, fontWeight: 800, color: '#64748b',
      letterSpacing: 0.4, textTransform: 'uppercase',
      flexShrink: 0, minWidth: 80,
    }}>{label}</span>
    <span style={{
      flex: 1, minWidth: 0,
      fontSize: 11, fontWeight: 700, color: '#cbd5e1',
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      fontFamily: mono ? 'monospace' : 'inherit',
    }}>{value}</span>
  </div>
);

export default MovementModal;
