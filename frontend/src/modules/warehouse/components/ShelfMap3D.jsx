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
import { useSampleMovement } from '../hooks/useSampleMovement';
import { useGroupDrag }     from '../hooks/useGroupDrag';
import { useGroupPreview }  from '../hooks/useGroupPreview';
import { useShelfStaleness } from '../hooks/useShelfStaleness';
import SampleMovementToolbar from './movement/SampleMovementToolbar';
import TargetShelfPicker from './movement/TargetShelfPicker';
import MovementConfirmModal from './movement/MovementConfirmModal';
import MovementModeOverlay from './movement/MovementModeOverlay';
import GroupDragGhost from './3d/GroupDragGhost'; // eslint-disable-line no-unused-vars
// GroupDragGhost: componente R3F (disponible para Módulo E / integración con mini-mapa)
import ShelfMiniMap3D from './minimap/ShelfMiniMap3D';
import BottomSheet from './bottom/BottomSheet';
import EmptyView from './bottom/EmptyView';
import SampleDetailView from './bottom/SampleDetailView';
import GroupView from './group/GroupView';

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
  const movement = useSampleMovement(() => {
    selection.clearSelection();
    fetchMapData();
  });
  const groupPreview = useGroupPreview();
  const { isStale } = useShelfStaleness(selectedShelf?.id, mapData);

  // Group flow state
  const [groupTarget, setGroupTarget] = useState(null); // {x,y,z,shelfId,shelfName}
  const [groupConfirmOpen, setGroupConfirmOpen] = useState(false);
  const [groupExecuting, setGroupExecuting] = useState(false);
  const [groupError, setGroupError] = useState(null);
  const [groupConflicts, setGroupConflicts] = useState([]);
  const [validationModal, setValidationModal] = useState(null);
  // { type: 'type'|'dimension'|'limit'|'status'|'multiShelf'|'partial', ...payload }

  // Cross-shelf mini-mapa state
  const [crossShelfData, setCrossShelfData] = useState(null); // mapData del anaquel destino
  const [crossShelfId, setCrossShelfId] = useState(null);
  const [crossShelfOpen, setCrossShelfOpen] = useState(false);

  // Listen for rejection events from useSampleSelection
  useEffect(() => {
    if (!selection.rejectionEvent) return;
    const ev = selection.rejectionEvent;
    setValidationModal(ev);
  }, [selection.rejectionEvent]);

  const isGroupMode = selection.count >= 2;

  const groupDrag = useGroupDrag({
    groupSamples: selection.selectedSamples,
    onChangeShelf: () => {
      // Cancel group drag if user changes shelf mid-drag
      groupPreview.clearCache();
    },
    onDropValid: (cell) => {
      const first = selection.selectedSamples[0];
      const targetShelfId = first?.shelf_id || selectedShelf?.id;
      const targetShelfName = selectedShelf?.name;
      setGroupTarget({ x: cell.x, y: cell.y, z: cell.z, shelfId: targetShelfId, shelfName: targetShelfName });
      setGroupConflicts(groupPreview.cache?.conflicts || []);
      setGroupConfirmOpen(true);
    },
  });

  // Trigger preview when hovered cell changes (only in group mode)
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

  // Si la selección del grupo se limpia, cerrar cross-shelf
  useEffect(() => {
    if (selection.count === 0) {
      setCrossShelfOpen(false);
      setCrossShelfData(null);
      setCrossShelfId(null);
    }
  }, [selection.count]);

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
            isTargetPickerMode={movement.mode === 'moving'}
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
                isSelectionMode={selection.count > 0}
                isMovementMode={movement.mode === 'moving'}
                isGroupDragMode={isGroupMode}
                isGroupDragging={groupDrag.dragState.isDragging}
                validityByKey={validityByKey}
                selectedSampleIds={selection.selectedSamples}
                assignedTargets={movement.assignments}
                onSampleClick={(sample) => {
                  if (movement.mode === 'idle') {
                    if (isGroupMode) {
                      // In group mode: a click also starts drag-en-grupo
                      groupDrag.startDrag(sample);
                    } else {
                      selection.toggleSample(sample);
                    }
                  } else if (movement.mode === 'moving') {
                    const isAssigned = movement.assignments.some(a => a.sampleData.id === sample.id && a.targetShelfId !== null);
                    if (isAssigned) movement.unassignTarget(sample.id);
                  }
                }}
                onSampleDragStart={(sample, evt) => {
                  groupDrag.startDrag(sample);
                  // capture mouse globally
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
                  if (isGroupMode && groupDrag.dragState.isDragging) {
                    // Group mode: hovering empty cell during drag → preview
                    groupDrag.setHoveredCell(pos, validityByKey[`${pos.x},${pos.y},${pos.z}`] || 'unknown');
                  } else if (movement.mode === 'moving' && movement.nextUnassignedSampleId) {
                    movement.assignTarget(movement.nextUnassignedSampleId, pos, movement.activeTargetShelf);
                  }
                }}
              />

              {/* ── Bottom Sheet (sample detail / group / confirm) ── */}
              <BottomSheet
                view={
                  selection.count >= 2 ? 'group' :
                  selection.count === 1 ? 'sample' :
                  'empty'
                }
                headerTitle={
                  selection.count === 0
                    ? 'Información de muestra'
                    : `${selection.count} muestras seleccionadas`
                }
                persistKey="detail"
                onClose={() => {
                  setSelectedCell(null);
                }}
              >
                {selection.count >= 2 ? (
                  <GroupView
                    samples={selection.selectedSamples}
                    selectionType={selection.selectionType}
                    rejection={selection.rejectionEvent}
                    isStale={isStale}
                    onRemoveSample={(id) => selection.toggleSample({ id })}
                    onClearAll={() => {
                      groupDrag.cancelDrag();
                      groupPreview.clearCache();
                      selection.clearSelection();
                    }}
                    onConfirm={() => {
                      if (!groupTarget) return;
                      setGroupConfirmOpen(true);
                    }}
                    onReplaceGroup={() => {
                      const newS = selection.rejectionEvent?.newSample;
                      selection.clearRejection();
                      selection.clearSelection();
                      if (newS) selection.toggleSample(newS);
                    }}
                    onDismissRejection={() => selection.clearRejection()}
                    crossShelfButton={
                      crossShelfOpen ? (
                        <button
                          onClick={() => {
                            setCrossShelfOpen(false);
                            setCrossShelfData(null);
                            setCrossShelfId(null);
                          }}
                          data-testid="group-cross-shelf-toggle"
                          style={{
                            padding: '6px 10px',
                            background: 'rgba(56,189,248,0.1)',
                            border: '1px solid rgba(56,189,248,0.3)',
                            borderRadius: 8,
                            color: '#38bdf8',
                            fontSize: 10, fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >↩ Anaquel origen</button>
                      ) : null
                    }
                  />
                ) : selection.count === 1 ? (
                  <SampleDetailView
                    sample={selection.selectedSamples[0]}
                    isInGroup={true}
                    isAlreadyInGroupOfOne={true}
                    onAddToGroup={() => {}}
                    onRemoveFromGroup={() => selection.toggleSample(selection.selectedSamples[0])}
                    onMoveSingle={() => {
                      movement.startMove([selection.selectedSamples[0]], selectedShelf);
                    }}
                    onClose={() => selection.clearSelection()}
                  />
                ) : selectedCell ? (
                  <SampleDetailView
                    sample={selectedCell}
                    isInGroup={false}
                    isAlreadyInGroupOfOne={false}
                    onAddToGroup={() => selection.toggleSample(selectedCell)}
                    onRemoveFromGroup={() => selection.toggleSample(selectedCell)}
                    onMoveSingle={() => {
                      movement.startMove([selectedCell], selectedShelf);
                      setSelectedCell(null);
                    }}
                    onClose={() => setSelectedCell(null)}
                  />
                ) : (
                  <EmptyView hasActiveSelection={false} />
                )}
              </BottomSheet>

              {/* Cross-shelf mini-mapa (visible durante group mode) */}
              {isGroupMode && crossShelfOpen && crossShelfData && (
                <ShelfMiniMap3D
                  mapData={crossShelfData}
                  target={groupTarget && groupTarget.shelfId === crossShelfId
                    ? { x: groupTarget.x, y: groupTarget.y, z: groupTarget.z }
                    : null}
                  validity={groupTarget && groupTarget.shelfId === crossShelfId
                    ? (validityByKey[`${groupTarget.x},${groupTarget.y},${groupTarget.z}`] || 'unknown')
                    : 'unknown'}
                  title={crossShelfData.shelf.name}
                  onSelectCell={(cell) => {
                    if (!crossShelfId) return;
                    setGroupTarget({
                      x: cell.x, y: cell.y, z: cell.z,
                      shelfId: crossShelfId,
                      shelfName: crossShelfData.shelf.name,
                    });
                    // Run preview against cross shelf
                    const first = selection.selectedSamples[0];
                    const sourceShelfId = first?.shelf_id || selectedShelf.id;
                    groupPreview.loadPreview(
                      sourceShelfId,
                      selection.selectedSamples.map(s => s.id),
                      crossShelfId
                    );
                  }}
                />
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

      {/* ── Movement Components ── */}
      {selection.count > 0 && movement.mode === 'idle' && (
        <SampleMovementToolbar 
          selectionCount={selection.count}
          onMove={() => movement.startMove(selection.selectedSamples, selectedShelf)}
          onClear={selection.clearSelection}
        />
      )}

      {movement.mode === 'moving' && (
        <MovementModeOverlay 
          assignedCount={movement.assignedCount}
          totalCount={movement.totalToAssign}
          onCancel={movement.cancelMove}
          onConfirm={movement.reviewMove}
          onChangeShelf={movement.openTargetPicker}
          activeShelfName={movement.activeTargetShelf?.name}
          nextUnassignedSampleId={movement.nextUnassignedSampleId}
          assignments={movement.assignments}
        />
      )}

      <TargetShelfPicker 
        isOpen={movement.mode === 'target-picker'}
        onClose={() => movement.changeTargetShelf(movement.activeTargetShelf)}
        currentShelfId={selectedShelf.id}
        marketLineId={mapData?.shelf?.market_line_id}
        onSelectTarget={(shelf) => movement.changeTargetShelf(shelf)}
      />

      <MovementConfirmModal
        isOpen={movement.mode === 'confirming'}
        onClose={() => movement.changeTargetShelf(movement.activeTargetShelf)}
        onConfirm={() => movement.confirmMove(selectedShelf.id)}
        assignments={movement.assignments}
        isExecuting={movement.isExecuting}
        errors={movement.executionErrors}
      />

      {/* ════════════════════ GROUP FLOW (drag-en-grupo) ════════════════════ */}

      {/* (v1.0.0 modales legacy reemplazados por BottomSheet contextual en el detail map) */}
    </div>
  );
};

export default ShelfMap3D;