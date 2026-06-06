/**
 * GroupToolbar
 *
 * Toolbar flotante que aparece cuando hay 2+ muestras seleccionadas.
 * Muestra:
 *  - Count del grupo (badge)
 *  - Nombre del producto + SGA (chip)
 *  - Botón "Cambiar anaquel" (cross-shelf): abre dropdown inline
 *  - Botón "Limpiar selección"
 *  - Hint: "Arrastra cualquier muestra del grupo para moverlas todas"
 *  - Indicador "stale" cuando useShelfStaleness lo reporta
 *
 * Props:
 *   - count: number
 *   - selectionType: {id, name, dangerClass, dimensions, lot}
 *   - onClear: () => void
 *   - isStale: boolean
 *   - currentShelfId: string|number
 *   - onCrossShelf: (targetShelfId) => void  ← carga mapData + abre mini-mapa
 *   - activeCrossShelfId: string|number|null  ← qué shelf cross está activo
 */
import React, { useState, useEffect, useRef } from 'react';
import { warehouseAPI } from '../../../../services/api';

const GroupToolbar = ({
  count = 0,
  selectionType,
  onClear,
  isStale = false,
  currentShelfId,
  onCrossShelf,
  activeCrossShelfId,
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [shelves, setShelves] = useState([]);
  const [loading, setLoading] = useState(false);
  const pickerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!pickerOpen) return undefined;
    const onClick = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setPickerOpen(false);
      }
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [pickerOpen]);

  const openPicker = async () => {
    setPickerOpen(true);
    if (shelves.length > 0) return;
    setLoading(true);
    try {
      // We need market_line_id; use currentShelf's. The parent should ideally
      // pass it, but for simplicity we fetch all shelves and filter.
      const res = await warehouseAPI.getShelves();
      const all = res?.data?.data?.shelves || res?.data?.data || [];
      // Excluir el actual
      setShelves(all.filter(s => s.id !== currentShelfId));
    } catch {
      setShelves([]);
    } finally {
      setLoading(false);
    }
  };

  if (count < 2) return null;

  return (
    <div
      style={{
        position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
        zIndex: 50,
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px',
        background: 'linear-gradient(180deg, rgba(11, 18, 32, 0.92) 0%, rgba(10, 15, 28, 0.92) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: 14,
        boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(56,189,248,0.1) inset',
        maxWidth: '92vw',
      }}
      role="toolbar" aria-label="Toolbar de grupo"
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '4px 10px',
        background: 'rgba(56, 189, 248, 0.12)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: 20,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: 4,
          background: '#38bdf8', boxShadow: '0 0 6px #38bdf8',
        }} />
        <span style={{ fontSize: 12, fontWeight: 800, color: '#38bdf8', letterSpacing: 0.4 }}>
          {count} muestras agrupadas
        </span>
      </div>

      {selectionType?.name && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span style={{
            fontSize: 12, fontWeight: 700, color: '#f1f5f9',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            maxWidth: 180,
          }}>
            {selectionType.name}
          </span>
          {selectionType.dangerClass && (
            <span style={{
              fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 10,
              background: 'rgba(168, 85, 247, 0.15)',
              color: '#c084fc',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              letterSpacing: 0.5, textTransform: 'uppercase',
            }}>{selectionType.dangerClass}</span>
          )}
        </div>
      )}

      <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#64748b', fontWeight: 600 }}>
        <span>🖱</span>
        <span>Arrastra para mover todas</span>
      </div>

      {isStale && (
        <>
          <div style={{ width: 1, height: 20, background: 'rgba(245, 158, 11, 0.2)' }} />
          <span style={{
            fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 8,
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#fbbf24',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            letterSpacing: 0.4, textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: 3,
              background: '#fbbf24',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
            Stale
          </span>
        </>
      )}

      {/* Cross-shelf button + inline dropdown */}
      <div ref={pickerRef} style={{ position: 'relative' }}>
        <button
          onClick={openPicker}
          title="Cambiar anaquel destino"
          style={{
            padding: '6px 10px',
            background: activeCrossShelfId
              ? 'rgba(56, 189, 248, 0.2)'
              : 'rgba(255,255,255,0.04)',
            border: `1px solid ${activeCrossShelfId ? 'rgba(56,189,248,0.5)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 8,
            color: activeCrossShelfId ? '#38bdf8' : '#94a3b8',
            fontSize: 10, fontWeight: 700,
            cursor: 'pointer', letterSpacing: 0.4,
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >⤢ {activeCrossShelfId ? 'Cross-shelf' : 'Cambiar anaquel'}</button>

        {pickerOpen && (
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 6,
            minWidth: 240, maxHeight: 320, overflowY: 'auto',
            background: 'rgba(9, 13, 22, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
            padding: 6,
            zIndex: 60,
          }}>
            <p style={{ margin: '4px 8px 6px', fontSize: 8, color: '#64748b', fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase' }}>
              Mover a otro anaquel
            </p>
            {loading ? (
              <div style={{ padding: 12, textAlign: 'center', fontSize: 10, color: '#94a3b8' }}>Cargando…</div>
            ) : shelves.length === 0 ? (
              <div style={{ padding: 12, textAlign: 'center', fontSize: 10, color: '#64748b' }}>No hay anaqueles disponibles</div>
            ) : (
              shelves.map(s => {
                const isActive = s.id === activeCrossShelfId;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setPickerOpen(false);
                      if (onCrossShelf) onCrossShelf(s.id, s);
                    }}
                    style={{
                      width: '100%', textAlign: 'left',
                      padding: '8px 10px', borderRadius: 6,
                      background: isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                      border: 'none',
                      color: isActive ? '#38bdf8' : '#cbd5e1',
                      fontSize: 11, fontWeight: isActive ? 800 : 600,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(56,189,248,0.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent'; }}
                  >
                    <span style={{ fontSize: 10, color: '#64748b' }}>▣</span>
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
                    <span style={{ fontSize: 9, color: '#475569', fontFamily: 'monospace' }}>
                      {s.grid_width || 10}×{s.grid_height || 10}×{s.shelf_depth || 10}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      <button
        onClick={onClear}
        title="Limpiar selección (Esc)"
        style={{
          padding: '6px 10px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8, color: '#94a3b8', fontSize: 10, fontWeight: 700,
          cursor: 'pointer', letterSpacing: 0.4,
          display: 'flex', alignItems: 'center', gap: 4,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
          e.currentTarget.style.color = '#f87171';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
          e.currentTarget.style.color = '#94a3b8';
        }}
      >✕ Limpiar</button>
    </div>
  );
};

export default GroupToolbar;
