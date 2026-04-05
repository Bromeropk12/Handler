import React, { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import { samplesAPI } from '../../services/api';
import {
  PlusIcon,
  BeakerIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

const SamplesPage = () => {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSample, setSelectedSample] = useState(null);

  useEffect(() => {
    const fetchSamples = async () => {
      try {
        setLoading(true);
        const response = await samplesAPI.getBulkSamples();
        setSamples(response.data?.data?.samples || []);
      } catch (_err) {
        setSamples([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSamples();
  }, []);

  const getSGABadge = (sgaClass) => {
    const map = {
      'Sin Riesgo': 'success',
      'Inflamable': 'warning',
      'Corrosivo': 'warning',
      'Tóxico': 'danger',
      'Comburente': 'info',
      'Explosivo': 'danger',
    };
    return <Badge variant={map[sgaClass] || 'neutral'} dot>{sgaClass || 'N/A'}</Badge>;
  };

  const getStatusBadge = (sample) => {
    if (!sample.expiration_date) return <Badge variant="neutral">Sin fecha</Badge>;
    const expDate = new Date(sample.expiration_date);
    const now = new Date();
    const daysUntil = Math.floor((expDate - now) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return <Badge variant="danger" dot>Vencida</Badge>;
    if (daysUntil <= 30) return <Badge variant="warning" dot>Por vencer</Badge>;
    return <Badge variant="success" dot>Activa</Badge>;
  };

  const columns = [
    {
      key: 'name',
      label: 'Producto',
      render: (val, row) => (
        <div>
          <p className="font-medium text-gray-200">{val || row.product_name}</p>
          <p className="text-xs text-gray-500">Lote: {row.lot || 'N/A'}</p>
        </div>
      ),
    },
    {
      key: 'supplier_name',
      label: 'Proveedor',
      render: val => <span className="text-gray-300">{val || 'Sin asignar'}</span>,
    },
    {
      key: 'quantity_grams',
      label: 'Cantidad',
      render: val => <span className="text-gray-300 font-mono text-xs">{val ? `${val}g` : 'N/A'}</span>,
    },
    {
      key: 'ghs_danger_class',
      label: 'Clase SGA',
      render: val => getSGABadge(val),
    },
    {
      key: 'market_line_name',
      label: 'Línea',
      render: val => <span className="text-gray-400 text-xs">{val || 'N/A'}</span>,
    },
    {
      key: 'status',
      label: 'Estado',
      render: (_val, row) => getStatusBadge(row),
    },
  ];

  const filteredSamples = samples.filter(s => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (s.name || s.product_name || '').toLowerCase().includes(term) ||
      (s.lot || '').toLowerCase().includes(term) ||
      (s.supplier_name || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Module Header */}
      <div className="flex items-center justify-between">
        <div className="module-header mb-0">
          <h2 className="module-title">Muestras Globales</h2>
          <p className="module-subtitle">
            Gestión de materias primas (Bulk) con trazabilidad SGA
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Nueva Muestra
        </button>
      </div>

      {/* Filters Bar */}
      <div className="card-glass p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por nombre, lote o proveedor..."
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

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredSamples}
        loading={loading}
        onRowClick={row => setSelectedSample(row)}
        emptyTitle="No hay muestras registradas"
        emptyDescription="Comience agregando su primera muestra global al sistema."
        emptyIcon={BeakerIcon}
      />

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nueva Muestra Global"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowCreateModal(false)} className="btn-secondary">
              Cancelar
            </button>
            <button className="btn-primary">
              Crear Muestra
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre del Producto</label>
              <input className="input" placeholder="Ej: Vitamina C" />
            </div>
            <div>
              <label className="label">Lote</label>
              <input className="input" placeholder="Ej: LOT-2026-001" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Proveedor</label>
              <select className="select">
                <option value="">Seleccione...</option>
                <option>BASF</option>
                <option>Dow Chemical</option>
                <option>Merck</option>
              </select>
            </div>
            <div>
              <label className="label">Clase de Peligro SGA</label>
              <select className="select">
                <option value="">Seleccione...</option>
                <option>Sin Riesgo</option>
                <option>Inflamable</option>
                <option>Corrosivo</option>
                <option>Tóxico</option>
                <option>Comburente</option>
                <option>Explosivo</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Cantidad (g/ml)</label>
              <input type="number" className="input" placeholder="500" />
            </div>
            <div>
              <label className="label">Fecha Manufactura</label>
              <input type="date" className="input" />
            </div>
            <div>
              <label className="label">Fecha Vencimiento</label>
              <input type="date" className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Línea de Mercado</label>
              <select className="select">
                <option value="">Seleccione...</option>
                <option>Cosmética</option>
                <option>Farmacéutica</option>
                <option>Industrial</option>
              </select>
            </div>
            <div>
              <label className="label">Dimensiones (Ancho × Profundidad)</label>
              <select className="select">
                <option value="1x1">1×1</option>
                <option value="1x2">1×2</option>
                <option value="2x1">2×1</option>
                <option value="2x2">2×2</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedSample}
        onClose={() => setSelectedSample(null)}
        title="Detalle de Muestra"
        footer={
          <button onClick={() => setSelectedSample(null)} className="btn-secondary">
            Cerrar
          </button>
        }
      >
        {selectedSample && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Producto</p>
                <p className="text-sm font-medium text-gray-200">{selectedSample.name || selectedSample.product_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Lote</p>
                <p className="text-sm font-medium text-gray-200">{selectedSample.lot || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Proveedor</p>
                <p className="text-sm font-medium text-gray-200">{selectedSample.supplier_name || 'Sin asignar'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Clase SGA</p>
                {getSGABadge(selectedSample.ghs_danger_class)}
              </div>
              <div>
                <p className="text-xs text-gray-500">Cantidad</p>
                <p className="text-sm font-medium text-gray-200">{selectedSample.quantity_grams}g</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Estado</p>
                {getStatusBadge(selectedSample)}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SamplesPage;
