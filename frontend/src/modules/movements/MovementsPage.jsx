import React, { useState, useEffect, useCallback } from 'react';
import { movementsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ArrowDownTrayIcon, FunnelIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';

// ---------------------------------------------------------------------------
// Tablas de traducción para el campo "details"
// ---------------------------------------------------------------------------

/** Descripción legible en español por cada valor del campo "type" */
const DETAIL_TYPE_DESCRIPTIONS = {
  bulk_creation:       'Muestra global creada — pendiente por dispensar.',
  bulk_update:         'Datos de la muestra global actualizados.',
  bulk_deletion:       'Muestra global eliminada junto con sus muestras hijas.',
  subdivision:         'Dispensación: bulk subdividido en unidades hijas.',
  dispatch:            'Muestra hija despachada al cliente.',
  sample_placement:    'Muestra colocada en anaquel.',
  sample_movement:     'Muestra reubicada dentro del anaquel.',
  sample_removal:      'Muestra retirada del anaquel.',
  shelf_creation:      'Nuevo anaquel creado.',
  shelf_update:        'Datos del anaquel actualizados.',
  shelf_deletion:      'Anaquel eliminado.',
  defragmentation_move:'Reorganización automática de muestras (desfragmentación).',
};

/** Nombres amigables en español para campos técnicos en inglés */
const FIELD_LABELS = {
  name:               'Nombre',
  provider:           'Proveedor',
  grid_width:         'Ancho de grilla',
  grid_height:        'Alto de grilla',
  shelf_depth:        'Profundidad',
  shelf_type:         'Tipo de anaquel',
  market_line_id:     'Línea de mercado',
  dimensions:         'Dimensiones',
  dispensed_size:     'Tamaño dispensado',
  total_weight_grams: 'Peso total (g)',
  ghs_danger_class:   'Clase de peligro GHS',
  expiration_date:    'Fecha de vencimiento',
  manufacture_date:   'Fecha de manufactura',
  ghs_pictograms:     'Pictogramas GHS',
  signal_word:        'Palabra de señal',
  lot:                'Lote',
  supplier_id:        'Proveedor',
  supplier_ids:       'Proveedores',
  coa_file_path:      'Archivo CoA',
};

/**
 * Convierte el objeto `details` de cualquier movimiento en texto legible en español.
 * Cubre todos los patrones generados por el backend.
 * @param {object|string|null} details
 * @returns {string|null}
 */
const formatDetails = (details) => {
  if (!details) return null;

  // Parsear si llega como string JSON
  if (typeof details === 'string') {
    try { details = JSON.parse(details); } catch { return details; }
  }
  if (typeof details !== 'object' || details === null) return String(details);

  const parts = [];

  // 1. Descripción del tipo de operación
  if (details.type && DETAIL_TYPE_DESCRIPTIONS[details.type]) {
    parts.push(DETAIL_TYPE_DESCRIPTIONS[details.type]);
  } else if (details.info) {
    parts.push(details.info);
  }

  // 2. Campos modificados (array de keys)
  if (Array.isArray(details.changes) && details.changes.length > 0) {
    const fieldList = details.changes.map(k => FIELD_LABELS[k] ?? k).join(', ');
    parts.push(`Campos modificados: ${fieldList}.`);
  }

  // 3. Métricas de dispensación
  if (details.units_generated !== undefined) {
    parts.push(`${details.units_generated} unidades generadas${details.weight_per_unit !== undefined ? ` de ${details.weight_per_unit}g c/u` : ''}.`);
  }

  // 4. Métricas de eliminación
  if (details.child_count !== undefined) {
    parts.push(`${details.child_count} muestras hijas eliminadas.`);
  }
  if (details.total_weight !== undefined) {
    parts.push(`Peso total del bulk: ${details.total_weight}g.`);
  }

  // 5. Anaquel y tamaño de grilla
  if (details.grid_size) {
    parts.push(`Grilla: ${details.grid_size}.`);
  }
  if (details.shelf_name) {
    parts.push(`Anaquel: "${details.shelf_name}".`);
  }
  if (details.moves_count !== undefined) {
    parts.push(`${details.moves_count} posiciones reorganizadas.`);
  }

  // 6. Posiciones en almacén 3D
  if (details.position) {
    const p = details.position;
    parts.push(`Posición asignada: columna ${p.x ?? '?'}, fila ${p.y ?? '?'}, nivel ${p.z ?? '?'}.`);
  }
  if (details.from_position) {
    const f = details.from_position;
    const t = details.to_position;
    parts.push(
      t
        ? `Movida de (${f.x},${f.y},${f.z}) → (${t.x},${t.y},${t.z}).`
        : `Retirada de posición (${f.x ?? '?'},${f.y ?? '?'},${f.z ?? '?'}).`
    );
  }

  // 7. Despacho — código QR
  if (details.qr_code) {
    parts.push(`Código QR: ${details.qr_code}.`);
  }

  // 8. Gestión de usuarios (auth)
  if (details.old_username && details.new_username) {
    parts.push(`Nombre de usuario cambiado de "${details.old_username}" a "${details.new_username}".`);
  } else if (details.new_username) {
    parts.push(`Nuevo usuario creado: "${details.new_username}"${details.new_role ? ` con rol "${details.new_role}"` : ''}.`);
  }
  if (details.target_username) {
    parts.push(`Usuario afectado: "${details.target_username}".`);
  }
  if (details.deleted_username) {
    parts.push(`Usuario eliminado: "${details.deleted_username}".`);
  }
  if (details.ip) {
    parts.push(`IP: ${details.ip}.`);
  }

  return parts.length > 0 ? parts.join(' ') : null;
};

// ---------------------------------------------------------------------------
// Colores de badge por tipo de acción
// ---------------------------------------------------------------------------
const ACTION_BADGE_CLASSES = {
  created:              'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  dispensed:            'bg-sky-500/10 text-sky-400 border-sky-500/20',
  stored:               'bg-violet-500/10 text-violet-400 border-violet-500/20',
  moved:                'bg-amber-500/10 text-amber-400 border-amber-500/20',
  dispatched:           'bg-orange-500/10 text-orange-400 border-orange-500/20',
  expired:              'bg-red-500/10 text-red-400 border-red-500/20',
  updated:              'bg-blue-500/10 text-blue-400 border-blue-500/20',
  deleted:              'bg-red-600/10 text-red-300 border-red-600/20',
  password_reset:       'bg-pink-500/10 text-pink-400 border-pink-500/20',
  user_created:         'bg-teal-500/10 text-teal-400 border-teal-500/20',
  admin_password_change:'bg-purple-500/10 text-purple-400 border-purple-500/20',
  password_change:      'bg-purple-500/10 text-purple-400 border-purple-500/20',
  username_change:      'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  user_deleted:         'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

const EMPTY_FILTERS = {
  action_type: '',
  start_date:  '',
  end_date:    '',
  sample_id:   '',
  user_id:     '',
};

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
const MovementsPage = () => {
  const [movements,     setMovements]     = useState([]);
  const [movementTypes, setMovementTypes] = useState([]);
  const [summary,       setSummary]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [filters,       setFilters]       = useState(EMPTY_FILTERS);
  const [pagination,    setPagination]    = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [showFilters,   setShowFilters]   = useState(false);
  const [exporting,     setExporting]     = useState(false);
  const { hasPermission } = useAuth();

  // ── Carga de datos ──────────────────────────────────────────────────────

  const fetchMovements = useCallback(async (page = 1, currentFilters = EMPTY_FILTERS) => {
    try {
      setLoading(true);
      const response = await movementsAPI.getMovements({ ...currentFilters, page, limit: 50 });
      setMovements(response.data.data.movements || []);
      setPagination(response.data.data.pagination);
    } catch (err) {
      console.error('Error al cargar movimientos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTypes = async () => {
    try {
      const response = await movementsAPI.getMovementTypes();
      setMovementTypes(response.data.data.types || []);
    } catch (err) {
      console.error('Error al cargar tipos:', err);
    }
  };

  const fetchSummary = useCallback(async (currentFilters = EMPTY_FILTERS) => {
    try {
      const response = await movementsAPI.getMovementsSummary(currentFilters);
      setSummary(response.data.data);
    } catch (err) {
      console.error('Error al cargar resumen:', err);
    }
  }, []);

  useEffect(() => {
    fetchMovements();
    fetchTypes();
    fetchSummary();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    fetchMovements(1, filters);
    fetchSummary(filters);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS);
    fetchMovements(1, EMPTY_FILTERS);
    fetchSummary(EMPTY_FILTERS);
    setShowFilters(false);
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const response = await movementsAPI.exportToCSV(filters);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `movimientos_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al exportar CSV:', err);
    } finally {
      setExporting(false);
    }
  };

  // ── Helpers de render ────────────────────────────────────────────────────

  const getMovementLabel = (type) =>
    movementTypes.find(t => t.value === type)?.label ?? type;

  const formatDate = (dateString) =>
    dateString
      ? new Date(dateString).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })
      : '—';

  const getActionBadgeClass = (type) =>
    ACTION_BADGE_CLASSES[type] ?? 'bg-blue-500/10 text-blue-400 border-blue-500/20';

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="large" text="Cargando movimientos..." />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div className="module-header mb-0">
          <h2 className="module-title">Historial de Movimientos</h2>
          <p className="module-subtitle">Trazabilidad completa de todas las operaciones del sistema</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(true)}
            className={`btn-secondary flex items-center gap-2 ${hasActiveFilters ? 'ring-1 ring-blue-500/50 text-blue-400' : ''}`}
          >
            <FunnelIcon className="w-4 h-4" />
            Filtros{hasActiveFilters ? ' •' : ''}
          </button>
          {hasPermission('movements.export') && (
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="btn-primary flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              {exporting ? 'Exportando…' : 'Exportar CSV'}
            </button>
          )}
        </div>
      </div>

      {/* Resumen */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Por tipo */}
          <div className="card-glass p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Por Tipo</h3>
            <div className="space-y-2">
              {summary.by_type.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">{getMovementLabel(item.action_type)}</span>
                  <span className="text-sm font-bold text-white tabular-nums">{item.count}</span>
                </div>
              ))}
              {summary.by_type.length === 0 && <p className="text-xs text-gray-600">Sin datos</p>}
            </div>
          </div>

          {/* Por usuario */}
          <div className="card-glass p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Top Usuarios</h3>
            <div className="space-y-2">
              {summary.by_user.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">{item.username}</span>
                  <span className="text-sm font-bold text-white tabular-nums">{item.count}</span>
                </div>
              ))}
              {summary.by_user.length === 0 && <p className="text-xs text-gray-600">Sin datos</p>}
            </div>
          </div>

          {/* Por muestra */}
          <div className="card-glass p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Muestras por Tipo</h3>
            <div className="space-y-2">
              {summary.by_sample.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">{getMovementLabel(item.action_type)}</span>
                  <span className="text-sm font-bold text-white tabular-nums">{item.sample_count}</span>
                </div>
              ))}
              {summary.by_sample.length === 0 && <p className="text-xs text-gray-600">Sin datos</p>}
            </div>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="card-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-800/60 border-b border-gray-700/50">
              <tr>
                {['Fecha', 'Tipo', 'Muestra', 'Proveedor', 'Línea', 'Usuario', 'Detalles'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40">
              {movements.map((movement) => {
                const detailText = formatDetails(movement.details);
                return (
                  <tr key={movement.id} className="hover:bg-surface-700/30 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono whitespace-nowrap">
                      {formatDate(movement.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getActionBadgeClass(movement.action_type)}`}>
                        {getMovementLabel(movement.action_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-200">
                      {movement.sample_name
                        ? (
                          <>
                            {movement.sample_name}
                            {movement.sample_lot && (
                              <span className="block text-xs text-gray-500">Lote: {movement.sample_lot}</span>
                            )}
                          </>
                        )
                        : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {movement.supplier_name || <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {movement.market_line_name || <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {movement.user_name || <span className="text-gray-500 italic">Sistema</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 max-w-xs">
                      {detailText
                        ? <span title={detailText} className="line-clamp-2 leading-relaxed">{detailText}</span>
                        : <span className="text-gray-600">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {movements.length === 0 && (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <ClipboardDocumentListIcon className="w-10 h-10 text-gray-700" />
            <p className="text-gray-500 font-medium">No hay movimientos registrados</p>
            <p className="text-xs text-gray-600">Los movimientos aparecerán aquí cuando se realicen operaciones en el sistema.</p>
          </div>
        )}
      </div>

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Mostrando{' '}
            <span className="text-gray-200 font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span>
            {' – '}
            <span className="text-gray-200 font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span>
            {' de '}
            <span className="text-gray-200 font-medium">{pagination.total}</span> movimientos
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchMovements(pagination.page - 1, filters)}
              disabled={pagination.page === 1}
              className="px-3 py-1.5 rounded-lg bg-surface-700 text-gray-300 hover:bg-surface-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <span className="text-gray-400 px-1 tabular-nums">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchMovements(pagination.page + 1, filters)}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1.5 rounded-lg bg-surface-700 text-gray-300 hover:bg-surface-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Modal de filtros */}
      <Modal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filtrar Movimientos"
        footer={
          <>
            <button onClick={handleClearFilters} className="btn-secondary">Limpiar</button>
            <button onClick={handleApplyFilters} className="btn-primary">Aplicar Filtros</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Tipo de Movimiento</label>
            <select
              name="action_type"
              value={filters.action_type}
              onChange={handleFilterChange}
              className="select"
            >
              <option value="">Todos los tipos</option>
              {movementTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Fecha de Inicio</label>
              <input type="date" name="start_date" value={filters.start_date} onChange={handleFilterChange} className="input" />
            </div>
            <div>
              <label className="label">Fecha de Fin</label>
              <input type="date" name="end_date" value={filters.end_date} onChange={handleFilterChange} className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">ID de Muestra</label>
              <input type="text" name="sample_id" value={filters.sample_id} onChange={handleFilterChange} placeholder="Opcional" className="input" />
            </div>
            <div>
              <label className="label">ID de Usuario</label>
              <input type="text" name="user_id" value={filters.user_id} onChange={handleFilterChange} placeholder="Opcional" className="input" />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MovementsPage;
