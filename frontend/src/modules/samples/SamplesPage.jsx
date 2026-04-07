import React, { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import { samplesAPI, warehouseAPI } from '../../services/api';
import {
  PlusIcon,
  BeakerIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CubeIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

const SamplesPage = () => {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSample, setSelectedSample] = useState(null);
  const [marketLines, setMarketLines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    market_line_id: '',
    ghs_danger_class: '',
    status: ''
  });
  const [coaFile, setCoaFile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    supplier_id: '',
    lot: '',
    expiration_date: '',
    manufacture_date: '',
    ghs_danger_class: '',
    market_line_id: '',
    dimensions: '1x1x1',
    weight_per_unit_grams: '',
    shelf_id: '',
    position_x: '',
    position_y: '',
    position_z: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [samplesResp, mlResp, suppResp, shelvesResp] = await Promise.all([
          samplesAPI.getBulkSamples(),
          samplesAPI.getMarketLines(),
          samplesAPI.getSuppliers(),
          warehouseAPI.getShelves({ limit: 200 })
        ]);
        setSamples(samplesResp.data?.data?.bulkSamples || samplesResp.data?.data?.samples || []);
        setMarketLines(mlResp.data?.data?.marketLines || []);
        setSuppliers(suppResp.data?.data?.suppliers || []);
        setShelves(shelvesResp.data?.data?.shelves || []);
      } catch (_err) {
        setSamples([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateSample = async () => {
    // Validaciones
    if (!formData.name || !formData.supplier_id || !formData.lot || !formData.expiration_date || !formData.manufacture_date || !formData.ghs_danger_class || !formData.market_line_id || !formData.weight_per_unit_grams) {
      alert('Todos los campos obligatorios deben ser completados');
      return;
    }
    if (new Date(formData.manufacture_date) > new Date(formData.expiration_date)) {
      alert('La fecha de manufactura no puede ser posterior a la fecha de vencimiento');
      return;
    }
    try {
      await samplesAPI.createBulkSample(formData, coaFile);
      setShowCreateModal(false);
      setCoaFile(null);
      setFormData({
        name: '', supplier_id: '', lot: '', expiration_date: '',
        manufacture_date: '', ghs_danger_class: '', market_line_id: '',
        dimensions: '1x1x1', weight_per_unit_grams: '',
        shelf_id: '', position_x: '', position_y: '', position_z: ''
      });
      // Recargar datos
      const samplesResp = await samplesAPI.getBulkSamples();
      setSamples(samplesResp.data?.data?.bulkSamples || samplesResp.data?.data?.samples || []);
    } catch (err) {
      alert(err.response?.data?.message || 'Error al crear la muestra');
    }
  };

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
      key: 'weight_per_unit_grams',
      label: 'Peso/Unidad',
      render: (val, row) => <span className="text-gray-300 font-mono text-xs">{val || row.weight_per_unit_grams ? `${row.weight_per_unit_grams}g` : 'N/A'}</span>,
    },
    {
      key: 'available_units',
      label: 'Uds. Disponibles',
      render: (val, row) => {
        const available = val ?? row.available_units ?? 0;
        const total = row.total_units ?? 0;
        return (
          <div className="text-right">
            <span className="text-green-400 font-mono font-bold">{available}</span>
            <span className="text-xs text-gray-500 block">/ {total} total</span>
          </div>
        );
      },
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
    if (!searchTerm && !filters.market_line_id && !filters.ghs_danger_class && !filters.status) return true;
    
    const term = searchTerm.toLowerCase();
    const matchesSearch = (
      (s.name || s.product_name || '').toLowerCase().includes(term) ||
      (s.lot || '').toLowerCase().includes(term) ||
      (s.supplier_name || '').toLowerCase().includes(term)
    );
    
    const matchesMarketLine = !filters.market_line_id || s.market_line_id === filters.market_line_id;
    const matchesDangerClass = !filters.ghs_danger_class || s.ghs_danger_class === filters.ghs_danger_class;
    
    let matchesStatus = true;
    if (filters.status === 'available') {
      matchesStatus = s.available_units > 0;
    } else if (filters.status === 'empty') {
      matchesStatus = s.available_units === 0;
    } else if (filters.status === 'expired') {
      const expDate = new Date(s.expiration_date);
      matchesStatus = expDate < new Date();
    } else if (filters.status === 'warning') {
      const expDate = new Date(s.expiration_date);
      const now = new Date();
      const daysUntil = Math.floor((expDate - now) / (1000 * 60 * 60 * 24));
      matchesStatus = daysUntil >= 0 && daysUntil <= 30;
    }
    
    return matchesSearch && matchesMarketLine && matchesDangerClass && matchesStatus;
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
          <button 
            onClick={() => setShowFilterModal(true)}
            className={`btn-ghost ${filters.market_line_id || filters.ghs_danger_class || filters.status ? 'text-blue-400' : ''}`}
          >
            <FunnelIcon className="w-4 h-4 mr-2" />
            Filtros
            {(filters.market_line_id || filters.ghs_danger_class || filters.status) && (
              <span className="ml-1 w-2 h-2 bg-blue-400 rounded-full inline-block"></span>
            )}
          </button>
          {(filters.market_line_id || filters.ghs_danger_class || filters.status) && (
            <button 
              onClick={() => setFilters({ market_line_id: '', ghs_danger_class: '', status: '' })}
              className="text-xs text-gray-400 hover:text-white"
            >
              Limpiar filtros
            </button>
          )}
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
            <button onClick={handleCreateSample} className="btn-primary">
              Crear Muestra
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre del Producto</label>
              <input className="input" placeholder="Ej: Vitamina C" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} />
            </div>
            <div>
              <label className="label">Lote</label>
              <input className="input" placeholder="Ej: LOT-2026-001" value={formData.lot} onChange={e => handleInputChange('lot', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Proveedor</label>
              <select className="select" value={formData.supplier_id} onChange={e => handleInputChange('supplier_id', e.target.value)}>
                <option value="">Seleccione...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Clase de Peligro SGA</label>
              <select className="select" value={formData.ghs_danger_class} onChange={e => handleInputChange('ghs_danger_class', e.target.value)}>
                <option value="">Seleccione...</option>
                <option>Sin Riesgo</option>
                <option>Inflamable</option>
                <option>Corrosivo</option>
                <option>Toxico</option>
                <option>Comburente</option>
                <option>Explosivo</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Peso por Unidad (g/ml)</label>
              <input type="number" className="input" placeholder="500" value={formData.weight_per_unit_grams} onChange={e => handleInputChange('weight_per_unit_grams', e.target.value)} />
            </div>
            <div>
              <label className="label">Fecha Manufactura</label>
              <input type="date" className="input" value={formData.manufacture_date} onChange={e => handleInputChange('manufacture_date', e.target.value)} />
            </div>
            <div>
              <label className="label">Fecha Vencimiento</label>
              <input type="date" className="input" value={formData.expiration_date} onChange={e => handleInputChange('expiration_date', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Línea de Mercado</label>
              <select className="select" value={formData.market_line_id} onChange={e => handleInputChange('market_line_id', e.target.value)}>
                <option value="">Seleccione...</option>
                {marketLines.map(ml => <option key={ml.id} value={ml.id}>{ml.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tamaño de la Muestra</label>
              <select className="select" value={formData.dimensions} onChange={e => handleInputChange('dimensions', e.target.value)}>
                <option value="1x1x1">Pequeño (1 unidad)</option>
                <option value="1x2x1">Alto (2 niveles)</option>
                <option value="2x1x1">Ancho (2 columnas)</option>
                <option value="2x2x1">Grande (2×2)</option>
                <option value="1x1x2">Profundo (2 profundidad)</option>
                <option value="1x2x2">Alto + Profundo</option>
                <option value="2x1x2">Ancho + Profundo</option>
                <option value="2x2x2">Máximo (2×2×2)</option>
              </select>
            </div>
          </div>
          {/* Ubicación en Anaquel */}
          <div className="border-t border-gray-700/50 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <CubeIcon className="w-4 h-4 text-primary-400" />
              <h4 className="text-sm font-medium text-gray-300">Ubicación en Anaquel (Opcional)</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Anaquel</label>
                <select className="select" value={formData.shelf_id} onChange={e => handleInputChange('shelf_id', e.target.value)}>
                  <option value="">Sin ubicación (pendiente)</option>
                  {shelves.map(s => <option key={s.id} value={s.id}>{s.name} ({s.market_line_name})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="label text-[10px]">Col (X)</label>
                  <input type="number" className="input text-sm" placeholder="0" min="0" value={formData.position_x} onChange={e => handleInputChange('position_x', e.target.value)} />
                </div>
                <div>
                  <label className="label text-[10px]">Nivel (Y)</label>
                  <input type="number" className="input text-sm" placeholder="0" min="0" value={formData.position_y} onChange={e => handleInputChange('position_y', e.target.value)} />
                </div>
                <div>
                  <label className="label text-[10px]">Prof (Z)</label>
                  <input type="number" className="input text-sm" placeholder="0" min="0" value={formData.position_z} onChange={e => handleInputChange('position_z', e.target.value)} />
                </div>
              </div>
            </div>
          </div>
          {/* Certificado de Análisis (CoA) */}
          <div className="border-t border-gray-700/50 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <DocumentArrowDownIcon className="w-4 h-4 text-green-400" />
              <h4 className="text-sm font-medium text-gray-300">Certificado de Análisis (CoA)</h4>
            </div>
            <div>
              <label className="label">Archivo PDF del CoA (Opcional)</label>
              <input
                type="file"
                accept=".pdf"
                onChange={e => setCoaFile(e.target.files[0] || null)}
                className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20 cursor-pointer"
              />
              {coaFile && (
                <p className="text-xs text-green-400 mt-1">✓ {coaFile.name} seleccionado</p>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedSample}
        onClose={() => setSelectedSample(null)}
        title="Detalle de Muestra"
        size="lg"
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
                <p className="text-xs text-gray-500">Peso por Unidad</p>
                <p className="text-sm font-medium text-gray-200">{selectedSample.weight_per_unit_grams ? `${selectedSample.weight_per_unit_grams}g` : 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Dimensiones</p>
                <p className="text-sm font-medium text-gray-200">{selectedSample.dimensions || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Unidades Disponibles</p>
                <p className="text-sm font-medium text-green-400">{selectedSample.available_units ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Unidades Totales</p>
                <p className="text-sm font-medium text-gray-200">{selectedSample.total_units ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Fecha de Manufactura</p>
                <p className="text-sm font-medium text-gray-200">{selectedSample.manufacture_date ? new Date(selectedSample.manufacture_date).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Fecha de Vencimiento</p>
                <p className="text-sm font-medium text-gray-200">{selectedSample.expiration_date ? new Date(selectedSample.expiration_date).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
            <div className="border-t border-gray-700 pt-4">
              <p className="text-xs text-gray-500 mb-2">Estado</p>
              {getStatusBadge(selectedSample)}
            </div>
            {/* Certificado CoA */}
            <div className="border-t border-gray-700 pt-4">
              <p className="text-xs text-gray-500 mb-2">Certificado de Análisis (CoA)</p>
              {selectedSample.coa_file_path ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-green-400 font-medium">✓ CoA adjunto</span>
                  <a
                    href={`${process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : 'http://localhost:3001'}/${selectedSample.coa_file_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-500/20 transition-colors"
                  >
                    <DocumentArrowDownIcon className="w-3.5 h-3.5" />
                    Ver / Descargar PDF
                  </a>
                </div>
              ) : (
                <span className="text-sm text-yellow-500">⚠ Sin CoA adjunto</span>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Filter Modal */}
      <Modal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="Filtrar Muestras"
        footer={
          <>
            <button onClick={() => setFilters({ market_line_id: '', ghs_danger_class: '', status: '' })} className="btn-secondary">
              Limpiar
            </button>
            <button onClick={() => setShowFilterModal(false)} className="btn-primary">
              Aplicar Filtros
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Línea de Mercado</label>
            <select 
              className="select" 
              value={filters.market_line_id} 
              onChange={e => setFilters(prev => ({ ...prev, market_line_id: e.target.value }))}
            >
              <option value="">Todas</option>
              {marketLines.map(ml => <option key={ml.id} value={ml.id}>{ml.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Clase de Peligro SGA</label>
            <select 
              className="select" 
              value={filters.ghs_danger_class} 
              onChange={e => setFilters(prev => ({ ...prev, ghs_danger_class: e.target.value }))}
            >
              <option value="">Todas</option>
              <option>Sin Riesgo</option>
              <option>Inflamable</option>
              <option>Corrosivo</option>
              <option>Toxico</option>
              <option>Comburente</option>
              <option>Explosivo</option>
            </select>
          </div>
          <div>
            <label className="label">Estado</label>
            <select 
              className="select" 
              value={filters.status} 
              onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="">Todos</option>
              <option value="available">Con unidades disponibles</option>
              <option value="empty">Sin unidades disponibles</option>
              <option value="expired">Vencidas</option>
              <option value="warning">Por vencer (30 días)</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SamplesPage;
