import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { warehouseAPI } from '../../../services/api';
import LoadingSpinner from '../../../components/LoadingSpinner';
import {
  ArrowLeftIcon, ExclamationTriangleIcon, CubeIcon, ArrowPathIcon,
  EyeIcon, ChartBarIcon, ArrowsPointingOutIcon,
  BeakerIcon, ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import DefragmentationTool from './DefragmentationTool';
import { ShelfOverviewMap } from './3d/ShelfOverviewMap';
import { LevelDetailMap }   from './3d/LevelDetailMap';

// ─── Stat Pill ─────────────────────────────────────────────────────────────────
const StatPill = ({ label, value, color, icon: Icon }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1,
    padding: '10px 8px', borderRadius: 12,
    background: `${color}10`, border: `1px solid ${color}25`,
  }}>
    <span style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
    <span style={{ fontSize: 9, color: '#6b7280', fontWeight: 600, marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
  </div>
);

// ─── Main Component ─────────────────────────────────────────────────────────────
const ShelfMap3D = ({ selectedShelf, onBack }) => {
  const [mapData,        setMapData]        = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [selectedLevel,  setSelectedLevel]  = useState(null);
  const [selectedCell,   setSelectedCell]   = useState(null);
  const [hoveredCell,    setHoveredCell]    = useState(null);
  const [showExpired,    setShowExpired]    = useState(true);
  const [showWarnings,   setShowWarnings]   = useState(true);
  const [showDefragTool, setShowDefragTool] = useState(false);
  const [cameraView,     setCameraView]     = useState('default');

  const fetchMapData = useCallback(async () => {
    if (!selectedShelf) return;
    try {
      setLoading(true);
      const res = await warehouseAPI.getShelfMap(selectedShelf.id);
      setMapData(res.data.data);
      setError(null);
    } catch {
      setError('Error al cargar el mapa del anaquel');
    } finally {
      setLoading(false);
    }
  }, [selectedShelf]);

  useEffect(() => { fetchMapData(); }, [fetchMapData]);

  // Clear selected cell when level changes
  useEffect(() => { setSelectedCell(null); setHoveredCell(null); }, [selectedLevel]);

  const shelfStats = useMemo(() => {
    if (!mapData) return { occupied: 0, free: 0, expired: 0, warning: 0, occupancyPercent: 0 };
    const totalCapacity = mapData.shelf.total_capacity
      || (mapData.shelf.grid_width || 10) * (mapData.shelf.grid_height || 10) * (mapData.shelf.shelf_depth || 10);
    const now = new Date();
    let expired = 0, warning = 0;
    mapData.samples.forEach(s => {
      const exp = new Date(s.expiration_date);
      if (exp < now) expired++;
      else if (exp < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)) warning++;
    });
    const occupied = mapData.samples.length;
    return {
      occupied, free: Math.max(0, totalCapacity - occupied), expired, warning,
      occupancyPercent: totalCapacity > 0 ? Math.round((occupied / totalCapacity) * 100) : 0,
    };
  }, [mapData]);

  // ── Loading / Error states ──
  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <LoadingSpinner size="large" text={`Cargando ${selectedShelf?.name}…`} />
    </div>
  );
  if (error) return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <ExclamationTriangleIcon className="w-12 h-12 text-red-500/60" />
      <p className="text-gray-400 text-sm">{error}</p>
      <div className="flex gap-3">
        <button onClick={fetchMapData} className="btn-primary text-sm">Reintentar</button>
        <button onClick={onBack}       className="btn-secondary text-sm">Volver</button>
      </div>
    </div>
  );

  const totalLevels = mapData.shelf.grid_height || 10;
  const totalDepth  = mapData.shelf.shelf_depth || 10;
  const totalCols   = mapData.shelf.grid_width  || 10;

  const CAMERA_VIEWS = [
    { id: 'default', Icon: ArrowsPointingOutIcon, label: 'Angular'  },
    { id: 'top',     Icon: EyeIcon,               label: 'Cenital'  },
    { id: 'front',   Icon: ChartBarIcon,           label: 'Frontal'  },
  ];

  return (
    <div
      className="flex flex-col animate-fade-in"
      style={{ height: 'calc(100vh - 128px)', maxHeight: 'calc(100vh - 128px)', overflow: 'hidden' }}
    >
      {/* ════════════════════ HEADER ════════════════════ */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl transition-all hover:bg-white/5"
            style={{ border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <ArrowLeftIcon className="w-4 h-4 text-gray-400" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <CubeIcon className="w-5 h-5 text-primary-400" />
              <h2 className="text-lg font-bold text-white">{selectedShelf?.name}</h2>
              <span style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700,
                background: 'rgba(14,165,233,0.12)', color: '#38bdf8', border: '1px solid rgba(14,165,233,0.2)',
              }}>
                {totalCols}×{totalLevels}×{totalDepth}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {selectedShelf?.provider && `${selectedShelf.provider} · `}
              {mapData.shelf.market_line_name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Defrag toggle */}
          <button
            onClick={() => setShowDefragTool(v => !v)}
            className="px-3 py-1.5 text-xs font-bold rounded-xl transition-all"
            style={{
              background: showDefragTool ? 'rgba(14,165,233,0.2)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${showDefragTool ? 'rgba(14,165,233,0.4)' : 'rgba(255,255,255,0.08)'}`,
              color: showDefragTool ? '#38bdf8' : '#6b7280',
            }}
          >
            ⬡ Desfragmentar
          </button>
          <button onClick={fetchMapData} className="p-2 rounded-xl hover:bg-white/5 transition-all">
            <ArrowPathIcon className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* ════════════════════ BODY ════════════════════ */}
      <div className="flex flex-1 gap-4 min-h-0">

        {/* ── LEFT: Overview ── */}
        <div
          className="flex flex-col rounded-2xl overflow-hidden"
          style={{
            width: '40%', flexShrink: 0,
            border: '1px solid rgba(14,165,233,0.1)',
            background: 'radial-gradient(ellipse at 60% 20%, #0d1929 0%, #000000 100%)',
            boxShadow: '0 4px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)',
          }}
        >
          <ShelfOverviewMap
            mapData={mapData}
            selectedLevel={selectedLevel}
            onSelectLevel={setSelectedLevel}
          />
        </div>

        {/* ── RIGHT: Detail ── */}
        <div
          className="flex flex-col rounded-2xl overflow-hidden relative"
          style={{
            flex: 1,
            border: '1px solid rgba(14,165,233,0.1)',
            background: 'radial-gradient(ellipse at 30% 80%, #090d1c 0%, #000000 100%)',
            boxShadow: '0 4px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)',
          }}
        >
          {selectedLevel !== null ? (
            <>
              <LevelDetailMap
                mapData={mapData}
                selectedLevel={selectedLevel}
                selectedCell={selectedCell}
                setSelectedCell={setSelectedCell}
                hoveredCell={hoveredCell}
                setHoveredCell={setHoveredCell}
                cameraView={cameraView}
                showExpired={showExpired}
                showWarnings={showWarnings}
              />

              {/* ── Stats card (top-right overlay) ── */}
              <div
                className="absolute pointer-events-auto"
                style={{ top: 16, right: 16, width: 220, zIndex: 20 }}
              >
                <div style={{
                  background: 'rgba(9,13,20,0.88)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 16,
                  padding: 16,
                  boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
                }}>
                  {/* Occupancy bar */}
                  <div className="flex justify-between items-end mb-2">
                    <span style={{ fontSize: 9, color: '#4b5563', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Ocupación</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>
                      {shelfStats.occupancyPercent}<span style={{ fontSize: 12, color: '#4b5563' }}>%</span>
                    </span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginBottom: 12 }}>
                    <div style={{
                      height: '100%', borderRadius: 2, transition: 'width 1s ease',
                      width: `${shelfStats.occupancyPercent}%`,
                      background: shelfStats.occupancyPercent > 80 ? '#ef4444' : shelfStats.occupancyPercent > 50 ? '#f59e0b' : '#0ea5e9',
                    }} />
                  </div>

                  {/* Stat pills */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                    <StatPill label="Muestras"  value={shelfStats.occupied} color="#0ea5e9" />
                    <StatPill label="Libres"     value={shelfStats.free}    color="#475569" />
                    {shelfStats.expired  > 0 && <StatPill label="Vencidas"  value={shelfStats.expired}  color="#ef4444" />}
                    {shelfStats.warning  > 0 && <StatPill label="Alertas"   value={shelfStats.warning}  color="#f59e0b" />}
                  </div>
                </div>
              </div>

              {/* ── Bottom toolbar ── */}
              <div
                className="absolute pointer-events-auto"
                style={{
                  bottom: 16, left: '50%', transform: 'translateX(-50%)',
                  display: 'flex', alignItems: 'center', gap: 4, zIndex: 20,
                  background: 'rgba(9,13,20,0.88)', backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 40, padding: '6px 10px',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                }}
              >
                {/* Filter toggles */}
                {[
                  { key: 'expired',  color: '#ef4444', label: 'Vencidas',  state: showExpired,  set: setShowExpired  },
                  { key: 'warnings', color: '#f59e0b', label: 'Alertas',   state: showWarnings, set: setShowWarnings },
                ].map(({ key, color, label, state, set }) => (
                  <button
                    key={key}
                    onClick={() => set(v => !v)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '4px 10px', borderRadius: 30, border: 'none', cursor: 'pointer',
                      background: state ? `${color}18` : 'transparent',
                      opacity: state ? 1 : 0.4,
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: state ? `0 0 6px ${color}` : 'none' }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: state ? color : '#4b5563' }}>{label}</span>
                  </button>
                ))}

                {/* Divider */}
                <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.08)', margin: '0 4px' }} />

                {/* Camera views */}
                {CAMERA_VIEWS.map(({ id, Icon, label }) => (
                  <button
                    key={id}
                    title={label}
                    onClick={() => setCameraView(id)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 30, height: 30, borderRadius: '50%', border: 'none', cursor: 'pointer',
                      background:   cameraView === id ? 'rgba(14,165,233,0.2)' : 'transparent',
                      color:        cameraView === id ? '#38bdf8' : '#4b5563',
                      boxShadow:    cameraView === id ? '0 0 12px rgba(14,165,233,0.3)' : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Icon style={{ width: 14, height: 14 }} />
                  </button>
                ))}
              </div>
            </>
          ) : (
            /* ── Empty state: no level selected ── */
            <div className="flex-1 flex flex-col items-center justify-center" style={{ padding: 48 }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%', marginBottom: 20,
                background: 'rgba(14,165,233,0.06)',
                border: '1px solid rgba(14,165,233,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <BeakerIcon className="w-10 h-10 text-primary-500/40" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Seleccione un Nivel</h3>
              <p style={{ fontSize: 12, color: '#1f2937', textAlign: 'center', maxWidth: 260 }}>
                Haz clic en una de las bandejas del anaquel en la vista izquierda para inspeccionar en detalle.
              </p>
              <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
                {shelfStats.expired > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#ef4444' }}>
                    <ExclamationCircleIcon style={{ width: 14, height: 14 }} />
                    {shelfStats.expired} vencidas
                  </div>
                )}
                {shelfStats.warning > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#f59e0b' }}>
                    <ExclamationTriangleIcon style={{ width: 14, height: 14 }} />
                    {shelfStats.warning} por vencer
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Defrag Panel ── */}
      {showDefragTool && (
        <div className="fixed right-6 top-24 w-96 z-[100]" style={{ animation: 'slideInRight 0.25s ease' }}>
          <DefragmentationTool
            shelfId={selectedShelf.id}
            onMovementConfirmed={fetchMapData}
            onFinished={() => setShowDefragTool(false)}
          />
        </div>
      )}
    </div>
  );
};

export default ShelfMap3D;