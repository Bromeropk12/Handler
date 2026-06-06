/**
 * BottomSheet
 *
 * Contenedor inferior que ocupa la parte baja del detail map.
 * Soporta 3 estados:
 *  - collapsed: 40px strip
 *  - default: 50% del alto del detail map
 *  - expanded: 80% del alto del detail map
 *
 * Comportamiento:
 *  - Drag handle arriba permite arrastrar para ajustar fino
 *  - Click en handle cicla al siguiente estado
 *  - Snap a 3 puntos predefinidos
 *  - Persistencia de la altura en localStorage
 *  - Sin backdrop, sin position fixed (es absolute al contenedor padre)
 *
 * Props:
 *  - view: 'empty' | 'sample' | 'group' | 'confirm'
 *  - children: ReactNode (la vista actual)
 *  - onClose: () => void          ← botón X
 *  - headerTitle: string | null   ← título en header (opcional)
 *  - containerHeight: number      ← alto del contenedor padre (px)
 *  - minHeight: number            ← default 40 (px strip)
 *  - forceState: 'collapsed' | 'default' | 'expanded' | null  ← controlado externamente
 *  - onStateChange: (state) => void
 *  - persistKey: string           ← key de localStorage
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import BottomSheetHandle from './BottomSheetHandle';

const PERSIST_PREFIX = 'handler.bottomSheet.';
const COLLAPSED_PX = 40;

const BottomSheet = ({
  view = 'empty',
  children,
  onClose,
  headerTitle = null,
  containerHeight = 0,
  minHeight = COLLAPSED_PX,
  forceState = null,
  onStateChange,
  persistKey = 'default',
}) => {
  // Altura en píxeles (estado interno). Inicializa desde localStorage o 50% del contenedor.
  const [heightPx, setHeightPx] = useState(() => {
    try {
      const saved = localStorage.getItem(PERSIST_PREFIX + persistKey);
      if (saved) {
        const parsed = parseFloat(saved);
        if (!Number.isNaN(parsed) && parsed >= minHeight) return parsed;
      }
    } catch { /* localStorage no disponible */ }
    return containerHeight * 0.5 || 300;
  });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  // Persistir cambios de altura
  useEffect(() => {
    try {
      localStorage.setItem(PERSIST_PREFIX + persistKey, String(heightPx));
    } catch { /* ignore */ }
  }, [heightPx, persistKey]);

  // Snap points en píxeles (se recalculan cuando cambia containerHeight)
  const snapPoints = useMemo(() => {
    if (!containerHeight) return [minHeight, 300, 500];
    return [
      minHeight,
      Math.round(containerHeight * 0.5),
      Math.round(containerHeight * 0.8),
    ];
  }, [containerHeight, minHeight]);

  // Estado actual derivado de la altura
  const currentState = useMemo(() => {
    if (Math.abs(heightPx - snapPoints[0]) < 8) return 'collapsed';
    if (Math.abs(heightPx - snapPoints[2]) < 8) return 'expanded';
    return 'default';
  }, [heightPx, snapPoints]);

  // Notificar cambios de estado
  useEffect(() => {
    if (onStateChange) onStateChange(currentState);
  }, [currentState, onStateChange]);

  // Forzar estado desde fuera
  useEffect(() => {
    if (!forceState || !snapPoints[forceState === 'collapsed' ? 0 : forceState === 'expanded' ? 2 : 1]) return;
    const target = forceState === 'collapsed' ? snapPoints[0] : forceState === 'expanded' ? snapPoints[2] : snapPoints[1];
    setHeightPx(target);
  }, [forceState, snapPoints]);

  // Drag handlers
  const handleDragStart = useCallback(() => setIsDragging(true), []);
  const handleDragMove = useCallback((deltaY) => {
    setHeightPx((prev) => {
      const next = prev - deltaY; // drag up = sheet grows
      return Math.max(minHeight, next);
    });
  }, [minHeight]);
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    // Snap al punto más cercano
    setHeightPx((current) => {
      let closest = snapPoints[0];
      let minDist = Math.abs(current - closest);
      for (const sp of snapPoints) {
        const d = Math.abs(current - sp);
        if (d < minDist) { closest = sp; minDist = d; }
      }
      return closest;
    });
  }, [snapPoints]);

  // Cycle (click en handle)
  const handleCycle = useCallback(() => {
    setHeightPx((current) => {
      const idx = snapPoints.findIndex((sp) => Math.abs(current - sp) < 8);
      const nextIdx = (idx + 1) % snapPoints.length;
      return snapPoints[nextIdx];
    });
  }, [snapPoints]);

  // Si view === 'confirm' y no estamos expanded, expandir automáticamente
  useEffect(() => {
    if (view === 'confirm' && currentState !== 'expanded' && !isDragging) {
      setHeightPx(snapPoints[2]);
    }
  }, [view, currentState, isDragging, snapPoints]);

  const isCollapsed = currentState === 'collapsed';
  const showContent = !isCollapsed;

  return (
    <div
      ref={containerRef}
      data-testid="bottom-sheet"
      data-state={currentState}
      data-view={view}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: heightPx,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, rgba(9, 13, 22, 0.96) 0%, rgba(6, 10, 19, 0.98) 100%)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(56, 189, 248, 0.2)',
        boxShadow: '0 -12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
        zIndex: 30,
        transition: isDragging ? 'none' : 'height 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
      }}
    >
      {/* Drag handle */}
      <BottomSheetHandle
        onCycle={handleCycle}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        isDragging={isDragging}
      />

      {/* Header strip (visible en collapsed) */}
      {isCollapsed && (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          minHeight: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <div style={{
              width: 6, height: 6, borderRadius: 3,
              background: view === 'group' ? '#38bdf8' : '#64748b',
              boxShadow: view === 'group' ? '0 0 6px #38bdf8' : 'none',
            }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {headerTitle || 'Bottom sheet'}
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Expandir panel"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 6,
                color: '#94a3b8',
                fontSize: 10, fontWeight: 700,
                padding: '4px 10px',
                cursor: 'pointer',
                letterSpacing: 0.4,
              }}
            >▲ Expandir</button>
          )}
        </div>
      )}

      {/* Header (visible cuando no está colapsado) */}
      {!isCollapsed && headerTitle && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          flexShrink: 0,
        }}>
          <h3 style={{
            margin: 0, fontSize: 11, fontWeight: 800,
            color: '#94a3b8', letterSpacing: 1.2,
            textTransform: 'uppercase',
          }}>
            {headerTitle}
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Cerrar panel"
              style={{
                background: 'none', border: 'none',
                color: '#64748b', fontSize: 14,
                cursor: 'pointer', padding: '4px 8px',
                borderRadius: 4,
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
            >✕</button>
          )}
        </div>
      )}

      {/* Body */}
      {showContent && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: 0,
        }}>
          {children}
        </div>
      )}
    </div>
  );
};

export default BottomSheet;
