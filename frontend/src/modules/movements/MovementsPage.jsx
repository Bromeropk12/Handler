import React, { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import { movementsAPI } from '../../services/api';
import {
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const MovementsPage = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchMovements = async () => {
      try {
        setLoading(true);
        const response = await movementsAPI.getMovements();
        setMovements(response.data?.data?.movements || []);
      } catch (_err) {
        // Show demo data on error
        setMovements([
          { id: 1, action: 'Creación Bulk', user: 'admin', product: 'Vitamina C', lot: 'LOT-2026-001', created_at: '2026-04-04T10:30:00Z' },
          { id: 2, action: 'Dispensación', user: 'admin', product: 'Ácido Cítrico', lot: 'LOT-2026-005', created_at: '2026-04-04T09:15:00Z' },
          { id: 3, action: 'Ubicación en anaquel', user: 'admin', product: 'Glicerina', lot: 'LOT-2026-012', created_at: '2026-04-03T16:45:00Z' },
          { id: 4, action: 'Despacho', user: 'operador1', product: 'Parafina', lot: 'LOT-2026-008', created_at: '2026-04-03T14:20:00Z' },
          { id: 5, action: 'Reubicación', user: 'admin', product: 'Sulfato de Zinc', lot: 'LOT-2026-003', created_at: '2026-04-02T11:00:00Z' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchMovements();
  }, []);

  const getActionBadge = action => {
    const map = {
      'Creación Bulk': 'info',
      'Dispensación': 'success',
      'Ubicación en anaquel': 'success',
      'Despacho': 'warning',
      'Reubicación': 'neutral',
    };
    return <Badge variant={map[action] || 'neutral'}>{action}</Badge>;
  };

  const columns = [
    {
      key: 'created_at',
      label: 'Fecha / Hora',
      render: val => (
        <span className="text-xs text-gray-400 font-mono">
          {val ? new Date(val).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
        </span>
      ),
    },
    {
      key: 'user',
      label: 'Usuario',
      render: val => <span className="text-gray-300 text-sm">{val || 'Sistema'}</span>,
    },
    {
      key: 'action',
      label: 'Acción',
      render: val => getActionBadge(val),
    },
    {
      key: 'product',
      label: 'Producto',
      render: val => <span className="text-gray-200 font-medium text-sm">{val || 'N/A'}</span>,
    },
    {
      key: 'lot',
      label: 'Lote',
      render: val => <span className="text-gray-400 font-mono text-xs">{val || 'N/A'}</span>,
    },
  ];

  const filteredMovements = movements.filter(m => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (m.product || '').toLowerCase().includes(term) ||
      (m.lot || '').toLowerCase().includes(term) ||
      (m.action || '').toLowerCase().includes(term) ||
      (m.user || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Module Header */}
      <div className="flex items-center justify-between">
        <div className="module-header mb-0">
          <h2 className="module-title">Movimientos</h2>
          <p className="module-subtitle">
            Log inmutable de trazabilidad — Todas las operaciones del sistema
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="btn-secondary"
        >
          <ArrowPathIcon className="w-4 h-4 mr-2" />
          Actualizar
        </button>
      </div>

      {/* Search Bar */}
      <div className="card-glass p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por producto, lote, acción o usuario..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input-with-icon input-sm"
            />
          </div>
          <button className="btn-ghost">
            <FunnelIcon className="w-4 h-4 mr-2" />
            Filtros
          </button>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredMovements}
        loading={loading}
        emptyTitle="No hay movimientos registrados"
        emptyDescription="Los movimientos aparecerán aquí cuando se realicen operaciones en el sistema."
        emptyIcon={ClipboardDocumentListIcon}
      />
    </div>
  );
};

export default MovementsPage;
