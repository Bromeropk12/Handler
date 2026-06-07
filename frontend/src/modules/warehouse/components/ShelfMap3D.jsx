import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { warehouseAPI } from '../../../services/api';
import LoadingSpinner from '../../../components/LoadingSpinner';
import {
  ArrowLeftIcon, ExclamationTriangleIcon, CubeIcon, ArrowPathIcon,
  BeakerIcon, ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import DefragmentationTool from './DefragmentationTool';
import { ShelfOverviewMap } from './3d/ShelfOverviewMap';
import { LevelDetailMap }   from './3d/LevelDetailMap';
import { useSampleSelection } from '../hooks/useSampleSelection';
import { useGroupDrag }     from '../hooks/useGroupDrag';
import { useGroupPreview }  from '../hooks/useGroupPreview';
import { useShelfStaleness } from '../hooks/useShelfStaleness';
import { useMovementMode } from '../hooks/useMovementMode';
import FloatingGroupBar from './ui/FloatingGroupBar';
import SampleDetailModal from './ui/SampleDetailModal';
import MovementModal from './ui/MovementModal';
import ToastReject from './ui/ToastReject';
import { getSGAColor } from './3d/Shared3DComponents';

// ─── Stat Pill ─────────────────────────────────────────────────────────────────
const StatPill = ({ label, value, color }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
    width: '100%', boxSizing: 'border-box',
    padding: '6px 8px', borderRadius: 8,
    background: 'rgba(255, 255, 255, 0.02)',
    borderLeft: `2.5px solid ${color}`,
    borderTop: '1px solid rgba(255, 255, 255, 0.04)',
    borderRight: '1px solid rgba(255, 255, 255, 0.04)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.02)',
  }}>
    <span style={{ fontSize: 13, fontWeight: 900, color: '#f1f5f9', lineHeight: 1.1 }}>{value}</span>
    <span style={{ fontSize: 7, color: '#64748b', fontWeight: 800, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
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
  const [showStats,      setShowStats]      = useState(true);

  const selection = useSampleSelection();
  const groupPreview = useGroupPreview();
  const { isStale } = useShelfStaleness(selectedShelf?.id, mapData);

  // v2.0 — modales y feedback (declarados antes de useMovementMode para que su onCancel los pueda referenciar)
  const [detailModalSample, setDetailModalSample] = useState(null);
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [movementModalError, setMovementModalError] = useState(null);
  const [movementExecuting, setMovementExecuting] = useState(false);
  const [toastReject, setToastReject] = useState(null);

  // ── v2.0 — Estado simplificado del flujo de movimiento ─────────────
  // movementMode es la nueva pieza clave: el usuario clickea "Mover"
  // (de un tooltip o del floating bar), entra en mode PICKING, las
  // celdas válidas se iluminan en verde, clickea una, modal confirma.
  const movementMode = useMovementMode({
    currentShelfId: selectedShelf?.id,
    onCancel: () => {
      setSelectedCell(null);
      setMovementModalOpen(false);
      setMovementModalError(null);
    },
  });

  // v2.0 — Cuando el toast de rechazo expira o se descarta
  const dismissRejection = useCallback(() => {
    setToastReject(null);
    selection.clearRejection();
  }, [selection]);

  useEffect(() => {
    if (!selection.rejectionEvent) return;
    setToastReject(selection.rejectionEvent);
  }, [selection.rejectionEvent]);

  const isGroupMode = selection.count >= 2;
  const isMoving = movementMode.isActive;

  // Estados para movimientos cross-shelf
  const [compatibleShelves, setCompatibleShelves] = useState([]);
  const [targetMapData, setTargetMapData] = useState(null);

  // Cargar anaqueles compatibles de la misma línea de mercado
  useEffect(() => {
    if (!isMoving || !selectedShelf?.id) {
      setCompatibleShelves([]);
      return;
    }
    warehouseAPI.getCompatibleShelves(selectedShelf.id)
      .then(res => {
        setCompatibleShelves(res.data.data || []);
      })
      .catch(() => {
        setCompatibleShelves([]);
      });
  }, [isMoving, selectedShelf?.id]);

  // Cargar dinámicamente el mapa 3D del anaquel de destino
  useEffect(() => {
    if (!movementMode.target?.shelfId) {
      setTargetMapData(null);
      return;
    }
    if (movementMode.target.shelfId === selectedShelf?.id) {
      setTargetMapData(mapData);
      return;
    }
    let active = true;
    warehouseAPI.getShelfMap(movementMode.target.shelfId)
      .then(res => {
        if (active) setTargetMapData(res.data.data);
      })
      .catch(() => {
        if (active) setTargetMapData(null);
      });
    return () => { active = false; };
  }, [movementMode.target?.shelfId, mapData, selectedShelf?.id]);

  const groupDrag = useGroupDrag({
    groupSamples: selection.selectedSamples,
    onChangeShelf: () => {
      groupPreview.clearCache();
    },
    onDropValid: (cell) => {
      const first = selection.selectedSamples[0];
      const targetShelfId = first?.shelf_id || selectedShelf?.id;
      const targetShelfName = selectedShelf?.name;
      movementMode.startMove(selection.selectedSamples);
      movementMode.selectTarget({
        x: cell.x, y: cell.y, z: cell.z,
        shelfId: targetShelfId,
        shelfName: targetShelfName,
      });
      setMovementModalOpen(true);
    },
  });

  // Trigger preview cuando hovered cell cambia durante drag-en-grupo
  useEffect(() => {
    if (!groupDrag.dragState.isDragging) return;
    if (!isGroupMode) return;
    const cell = groupDrag.dragState.hoveredCell;
    if (!cell) return;
    const first = selection.selectedSamples[0];
    const shelfId = first?.shelf_id || selectedShelf?.id;
    groupPreview.loadPreview(shelfId, selection.selectedSamples.map(s => s.id), shelfId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupDrag.dragState.hoveredCell?.x, groupDrag.dragState.hoveredCell?.y, groupDrag.dragState.hoveredCell?.z]);

  // v2.0 — Trigger preview al entrar en movement mode (click+click flow)
  useEffect(() => {
    if (!isMoving) return;
    if (movementMode.movingSamples.length === 0) return;
    const first = movementMode.movingSamples[0];
    const sourceShelfId = first?.shelf_id || selectedShelf?.id;
    const targetShelfId = movementMode.target?.shelfId || selectedShelf?.id;
    groupPreview.loadPreview(
      sourceShelfId,
      movementMode.movingSamples.map(s => s.id),
      targetShelfId
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMoving, movementMode.movingSamples[0]?.id, movementMode.target?.shelfId]);

  // Build validity map for LevelDetailMap
  const validityByKey = useMemo(() => {
    const out = {};
    if (groupPreview.cache?.cells) {
      groupPreview.cache.cells.forEach(c => {
        out[`${c.x},${c.y},${c.z}`] = c.compatible ? 'valid' : 'invalid';
      });
    }
    return out;
  }, [groupPreview.cache]);

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
            border: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'radial-gradient(ellipse at 60% 20%, #0d1929 0%, #000000 100%)',
            boxShadow: '0 4px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)',
          }}
        >
          <ShelfOverviewMap
            mapData={mapData}
            selectedLevel={selectedLevel}
            onSelectLevel={setSelectedLevel}
            isTargetPickerMode={isMoving}
          />
        </div>

        {/* ── RIGHT: Detail ── */}
        <div
          className="flex flex-col rounded-2xl overflow-hidden relative"
          style={{
            flex: 1,
            border: '1px solid rgba(255, 255, 255, 0.06)',
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
                cameraView="default"
                showExpired={showExpired}
                showWarnings={showWarnings}
                isSelectionMode={selection.count > 0 || isMoving}
                isMovementMode={isMoving}
                isGroupDragMode={isGroupMode}
                isGroupDragging={groupDrag.dragState.isDragging}
                validityByKey={validityByKey}
                selectedSampleIds={selection.selectedSamples}
                assignedTargets={[]}
                // v2.0 — UI flotante
                movementMode={isMoving}
                showTooltipFor={isMoving ? null : (selectedCell?.id ?? null)}
                showGroupChipFor={isMoving ? new Set() : new Set(selection.selectedSamples.map(s => s.id))}
                groupChipColor={
                  selection.selectionType?.dangerClass
                    ? getSGAColor(selection.selectionType.dangerClass)
                    : '#38bdf8'
                }
                onTooltipViewDetail={() => {
                  if (selectedCell) {
                    setDetailModalSample(selectedCell);
                    setSelectedCell(null);
                  }
                }}
                onTooltipAddToGroup={() => {
                  if (selectedCell) {
                    selection.toggleSample(selectedCell);
                    setSelectedCell(null);
                  }
                }}
                onTooltipMove={() => {
                  if (selectedCell) {
                    movementMode.startMove([selectedCell]);
                    setSelectedCell(null);
                  }
                }}
                onTooltipClose={() => setSelectedCell(null)}
                onSampleClick={(sample) => {
                  if (isMoving) {
                    return;
                  }
                  if (selection.count > 0) {
                    // Ya hay selección (1 o N): toggle en el grupo
                    selection.toggleSample(sample);
                    if (selectedCell) setSelectedCell(null);
                  } else {
                    // Sin selección: mostrar tooltip
                    setSelectedCell(sample);
                  }
                }}
                onSampleDragStart={(sample, evt) => {
                  if (!isGroupMode) return;
                  groupDrag.startDrag(sample);
                  const moveHandler = (e) => {
                    const dx = Math.round(e.movementX || 0);
                    const dy = Math.round(e.movementY || 0);
                    groupDrag.updateDrag({
                      dx: (groupDrag.dragState.currentOffset.dx || 0) + dx,
                      dy: (groupDrag.dragState.currentOffset.dy || 0) + dy,
                      dz: (groupDrag.dragState.currentOffset.dz || 0) + 0,
                    });
                  };
                  const upHandler = () => {
                    window.removeEventListener('mousemove', moveHandler);
                    window.removeEventListener('mouseup', upHandler);
                    groupDrag.endDrag();
                  };
                  window.addEventListener('mousemove', moveHandler);
                  window.addEventListener('mouseup', upHandler);
                  if (evt?.target?.setPointerCapture && evt.pointerId !== undefined) {
                    try { evt.target.setPointerCapture(evt.pointerId); } catch { /* ignore */ }
                  }
                }}
                onEmptyCellClick={(pos) => {
                  if (isMoving) {
                    movementMode.selectTarget({
                      x: pos.x,
                      y: pos.y !== undefined ? pos.y : selectedLevel,
                      z: pos.z,
                      shelfId: selectedShelf?.id,
                      shelfName: selectedShelf?.name,
                    });
                    setMovementModalOpen(true);
                    return;
                  }
                  if (isGroupMode && groupDrag.dragState.isDragging) {
                    groupDrag.setHoveredCell(pos, validityByKey[`${pos.x},${pos.y ?? selectedLevel},${pos.z}`] || 'unknown');
                  }
                }}
              />

              {/* ── v2.0 — UI flotante (no es un panel persistente) ── */}

              {/* FloatingGroupBar: aparece cuando hay 2+ muestras seleccionadas */}
              {isGroupMode && !isMoving && (
                <FloatingGroupBar
                  count={selection.count}
                  selectionType={selection.selectionType}
                  isStale={isStale}
                  onClear={() => {
                    groupDrag.cancelDrag();
                    groupPreview.clearCache();
                    selection.clearSelection();
                    setSelectedCell(null);
                  }}
                  onMoveGroup={() => {
                    if (isGroupMode) {
                      movementMode.startMove(selection.selectedSamples);
                      const anchor = selection.selectedSamples[0];
                      movementMode.selectTarget({
                        x: anchor.position_x || 0,
                        y: anchor.position_y || 0,
                        z: anchor.position_z || 0,
                        shelfId: anchor.shelf_id,
                        shelfName: selectedShelf?.name || '',
                      });
                      setMovementModalOpen(true);
                    }
                  }}
                />
              )}

              {/* Modal de detalle completo */}
              {detailModalSample && (
                <SampleDetailModal
                  sample={detailModalSample}
                  onClose={() => setDetailModalSample(null)}
                  onAddToGroup={() => {
                    const s = detailModalSample;
                    setDetailModalSample(null);
                    if (s) {
                      selection.toggleSample(s);
                    }
                  }}
                  onMoveSingle={() => {
                    const s = detailModalSample;
                    setDetailModalSample(null);
                    if (s) {
                      movementMode.startMove([s]);
                    }
                  }}
                />
              )}

              {/* Modal de confirmación de movimiento */}
              {movementModalOpen && movementMode.target && (
                <MovementModal
                  samples={movementMode.movingSamples}
                  target={movementMode.target}
                  conflicts={movementMode.conflicts}
                  mapData={targetMapData || mapData}
                  isExecuting={movementExecuting}
                  error={movementModalError}
                  currentShelfId={selectedShelf?.id}
                  compatibleShelves={compatibleShelves}
                  onTargetChange={movementMode.selectTarget}
                  onCancel={() => {
                    setMovementModalOpen(false);
                    setMovementModalError(null);
                    movementMode.cancel();
                  }}
                  onConfirm={async () => {
                    if (!movementMode.target) return;
                    setMovementExecuting(true);
                    setMovementModalError(null);
                    try {
                      const samples = movementMode.movingSamples;
                      const target = movementMode.target;
                      const sourceShelfId = samples[0]?.shelf_id || selectedShelf.id;
                      // Calcular posiciones por muestra usando anchor (primera muestra)
                      // para mantener el layout relativo del grupo
                      const anchor = samples[0];
                      const moves = samples.map(s => ({
                        sample_id: s.id,
                        new_position_x: (s.position_x || 0) - (anchor.position_x || 0) + target.x,
                        new_position_y: (s.position_y || 0) - (anchor.position_y || 0) + target.y,
                        new_position_z: (s.position_z || 0) - (anchor.position_z || 0) + target.z,
                      }));
                      await warehouseAPI.moveGroup(sourceShelfId, {
                        target_shelf_id: target.shelfId,
                        moves,
                      });
                      setMovementModalOpen(false);
                      movementMode.reset();
                      selection.clearSelection();
                      setSelectedCell(null);
                      await fetchMapData();
                    } catch (err) {
                      setMovementModalError(err.response?.data?.message || err.message || 'Error al mover');
                    } finally {
                      setMovementExecuting(false);
                    }
                  }}
                />
              )}

              {/* Toast de rechazo (auto-dismiss 3s) */}
              <ToastReject
                rejection={toastReject}
                onReplace={() => {
                  const newS = toastReject?.newSample;
                  setToastReject(null);
                  selection.clearRejection();
                  selection.clearSelection();
                  if (newS) selection.toggleSample(newS);
                }}
                onDismiss={dismissRejection}
              />

              {/* Indicador sutil de movement mode (bottom-center, pequeño) */}
              {isMoving && (
                <div
                  data-testid="movement-mode-indicator"
                  style={{
                    position: 'absolute', bottom: 20, left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '8px 14px',
                    background: 'rgba(56, 189, 248, 0.12)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    borderRadius: 12,
                    boxShadow: '0 4px 16px rgba(56, 189, 248, 0.3)',
                    zIndex: 25,
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontFamily: 'system-ui, sans-serif',
                    color: '#f1f5f9',
                    fontSize: 11, fontWeight: 700,
                    letterSpacing: 0.3,
                    animation: 'floatingBarIn 200ms ease-out',
                  }}
                >
                  <span style={{
                    width: 8, height: 8, borderRadius: 4, background: '#38bdf8',
                    boxShadow: '0 0 8px #38bdf8',
                    animation: 'pulse 1.2s ease-in-out infinite',
                  }} />
                  Modo mover activo · Click celda verde · Esc para cancelar
                </div>
              )}

              {/* ── Stats card (top-right overlay) ── */}
              {showStats ? (
                <div
                  className="absolute pointer-events-auto animate-fade-in"
                  style={{ top: 16, right: 16, width: 180, zIndex: 20 }}
                >
                  <div style={{
                    background: 'rgba(9, 13, 22, 0.75)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 12,
                    padding: 12,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                  }}>
                    {/* Occupancy bar */}
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-1.5">
                        <span style={{ fontSize: 8, color: '#94a3b8', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>OCUPACIÓN</span>
                        <button
                          onClick={() => setShowStats(false)}
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '50%',
                            color: '#64748b',
                            cursor: 'pointer',
                            width: 12,
                            height: 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 6,
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#ffffff';
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#64748b';
                            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                          }}
                          title="Minimizar telemetría"
                        >
                          ✕
                        </button>
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>
                        {shelfStats.occupancyPercent}<span style={{ fontSize: 9, color: '#64748b', fontWeight: 700 }}>%</span>
                      </span>
                    </div>
                    <div style={{ height: 3, borderRadius: 1.5, background: 'rgba(255,255,255,0.04)', overflow: 'hidden', marginBottom: 10 }}>
                      <div style={{
                        height: '100%', borderRadius: 1.5, transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        width: `${shelfStats.occupancyPercent}%`,
                        background: shelfStats.occupancyPercent > 80 ? '#ef4444' : shelfStats.occupancyPercent > 50 ? '#facc15' : '#0ea5e9',
                        boxShadow: shelfStats.occupancyPercent > 80 ? '0 0 10px rgba(239, 68, 68, 0.4)' : shelfStats.occupancyPercent > 50 ? '0 0 10px rgba(250, 204, 21, 0.4)' : '0 0 10px rgba(14, 165, 229, 0.4)',
                      }} />
                    </div>

                    {/* Stat pills in clean 2-column grid to prevent overflow */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4, marginBottom: 2 }}>
                      <StatPill label="Muestras"  value={shelfStats.occupied} color="#0ea5e9" />
                      <StatPill label="Libres"     value={shelfStats.free}    color="#475569" />
                      {shelfStats.expired  > 0 && <StatPill label="Vencidas"  value={shelfStats.expired}  color="#ef4444" />}
                      {shelfStats.warning  > 0 && <StatPill label="Alertas"   value={shelfStats.warning}  color="#facc15" />}
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowStats(true)}
                  className="absolute top-4 right-4 pointer-events-auto cursor-pointer flex items-center gap-2 transition-all duration-300 animate-fade-in"
                  style={{
                    zIndex: 20,
                    background: 'rgba(9, 13, 22, 0.75)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 20,
                    padding: '6px 12px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                    color: '#ffffff',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(14, 165, 233, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(9, 13, 22, 0.75)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  }}
                >
                  <span style={{ fontSize: 10 }}>📊</span>
                  <span style={{ fontSize: 8, fontWeight: 900, color: '#38bdf8', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                    Telemetría ({shelfStats.occupancyPercent}%)
                  </span>
                </button>
              )}

              {/* ── Bottom toolbar ── */}
              <div
                className="absolute pointer-events-auto flex items-center gap-4 animate-fade-in"
                style={{
                  bottom: 20, left: '50%', transform: 'translateX(-50%)',
                  zIndex: 20,
                  background: 'rgba(7, 10, 19, 0.75)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 30,
                  padding: '6px 16px',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
                }}
              >
                {/* Explanation text & Icon */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <span style={{ fontSize: 9, color: '#f8fafc', fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase' }}>Filtros</span>
                    <span style={{ fontSize: 7, color: '#475569', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>Estado</span>
                  </div>
                </div>

                {/* Sleek Palette Badge */}
                <span style={{
                  fontSize: 7,
                  fontWeight: 900,
                  padding: '3px 8px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, rgba(6,182,212,0.1) 0%, rgba(59,130,246,0.1) 100%)',
                  color: '#22d3ee',
                  border: '1px solid rgba(6,182,212,0.25)',
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(6,182,212,0.05)'
                }}>
                  🎨 Paleta: Producto
                </span>

                {/* Divider */}
                <div style={{ width: 1, height: 20, background: 'rgba(255, 255, 255, 0.08)' }} />

                {/* Filter toggles with letter badges */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { key: 'expired',  color: '#ef4444', letter: 'V', label: 'Vencidas',  state: showExpired,  set: setShowExpired, textCol: '#ffffff'  },
                    { key: 'warnings', color: '#facc15', letter: 'P', label: 'Alertas',   state: showWarnings, set: setShowWarnings, textCol: '#0f172a' },
                  ].map(({ key, color, letter, label, state, set, textCol }) => (
                    <button
                      key={key}
                      onClick={() => set(v => !v)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
                        background: state ? `${color}15` : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${state ? `${color}50` : 'rgba(255,255,255,0.04)'}`,
                        color: state ? '#f8fafc' : '#64748b',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: state ? `0 0 12px ${color}20` : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!state) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                          e.currentTarget.style.color = '#94a3b8';
                        } else {
                          e.currentTarget.style.boxShadow = `0 0 16px ${color}35`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!state) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)';
                          e.currentTarget.style.color = '#64748b';
                        } else {
                          e.currentTarget.style.boxShadow = `0 0 12px ${color}20`;
                        }
                      }}
                    >
                      <div style={{
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center',
                        width: 15, height: 15, borderRadius: '50%', background: color,
                        color: textCol, fontSize: 8, fontWeight: 900,
                        boxShadow: state ? `0 0 6px ${color}60` : 'none',
                        border: '1px solid rgba(255,255,255,0.2)'
                      }}>
                        {letter}
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.5 }}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* ── Empty state: no level selected ── */
            <div className="flex-1 flex flex-col items-center justify-center" style={{ padding: 48 }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%', marginBottom: 24,
                background: 'rgba(56, 189, 248, 0.03)',
                border: '1px solid rgba(56, 189, 248, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'inset 0 0 20px rgba(56, 189, 248, 0.05), 0 0 30px rgba(56, 189, 248, 0.02)',
              }}>
                <BeakerIcon className="w-8 h-8 text-sky-400/50" />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 900, color: '#f8fafc', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.5 }}>Seleccione un Nivel</h3>
              <p style={{ fontSize: 11, color: '#64748b', textAlign: 'center', maxWidth: 280, fontWeight: 500, lineHeight: 1.6 }}>
                Haz clic en una de las bandejas del anaquel en la vista izquierda para inspeccionar las muestras en detalle.
              </p>
              <div style={{ display: 'flex', gap: 20, marginTop: 32 }}>
                {shelfStats.expired > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#ef4444', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    <ExclamationCircleIcon style={{ width: 14, height: 14 }} />
                    {shelfStats.expired} Vencidas
                  </div>
                )}
                {shelfStats.warning > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#facc15', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    <ExclamationTriangleIcon style={{ width: 14, height: 14 }} />
                    {shelfStats.warning} Alertas
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