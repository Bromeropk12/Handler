import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import { samplesAPI } from '../../services/api';
import {
  PlusIcon,
  BeakerIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  PencilSquareIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  CheckCircleIcon,
  DocumentCheckIcon,
  CloudArrowUpIcon,
  BarsArrowDownIcon,
} from '@heroicons/react/24/outline';

// URL base para recursos directos (logos, CoA, descargas).
// En dev: CRA proxy (package.json:"proxy") redirige todas las rutas relativas a localhost:3001.
// En producción: Express sirve todo desde el mismo origen — las URLs relativas funcionan nativamente.
const API_BASE = '';

// Mapeo de pictogramas GHS → archivos de imagen
const GHS_PICTOGRAM_MAP = {
  'Explosivo': { file: 'explos.webp', label: 'Explosivo' },
  'Inflamable': { file: 'flamme.webp', label: 'Inflamable' },
  'Comburente': { file: 'rondflam.webp', label: 'Comburente' },
  'Gas Bajo Presión': { file: 'bottle.webp', label: 'Gas Bajo Presión' },
  'Corrosivo': { file: 'acid_red.webp', label: 'Corrosivo' },
  'Toxicidad Aguda': { file: 'skull.webp', label: 'Toxicidad Aguda' },
  'Irritante': { file: 'exclam.webp', label: 'Irritante' },
  'Toxicidad Crónica': { file: 'silhouete.webp', label: 'Toxicidad Crónica' },
  'Tóxico para Medio Ambiente': { file: 'Aquatic-pollut-red.png', label: 'Medio Ambiente' },
};

const ALL_PICTOGRAMS = Object.keys(GHS_PICTOGRAM_MAP);

const SamplesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSample, setSelectedSample] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [marketLines, setMarketLines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filters, setFilters] = useState({
    market_line_id: '',
    ghs_danger_class: '',
    status: ''
  });
  const [coaFile, setCoaFile] = useState(null);
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100); // 100 items por página
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    supplier_id: '',
    lot: '',
    expiration_date: '',
    manufacture_date: '',
    ghs_danger_class: '',
    market_line_id: '',
    dimensions: '1x1x1',
    dispensed_size: '1x1x1',
    total_weight_grams: '',
    ghs_pictograms: [],
    signal_word: 'ATENCION',
  });

  const resetForm = () => {
    setFormData({
      name: '', supplier_id: '', lot: '', expiration_date: '',
      manufacture_date: '', ghs_danger_class: '', market_line_id: '',
      dimensions: '1x1x1', dispensed_size: '1x1x1', total_weight_grams: '',
      ghs_pictograms: [], signal_word: 'ATENCION',
    });
    setCoaFile(null);
  };

  const [sortAlphabetical, setSortAlphabetical] = useState(() => {
    return localStorage.getItem('handler_sort_alpha') === 'true';
  });

  // Sincronizar URL → estado (cuando navegan desde dashboard)
  useEffect(() => {
    const searchParam = searchParams.get('search');
    const filterParam = searchParams.get('filter');

    if (searchParam !== null && searchParam !== searchTerm) setSearchTerm(searchParam);
    if (filterParam) setFilters(prev => ({ ...prev, status: filterParam }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Sincronizar estado → URL (cuando el usuario escribe en el input)
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (searchTerm) {
      params.set('search', searchTerm);
    } else {
      params.delete('search');
    }
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const loadSamples = async (page = 1) => {
    try {
      setLoading(true);
      // Preparar parámetros incluyendo búsqueda y filtros
      const params = {
        limit: itemsPerPage,
        page: page,
      };

      if (searchTerm) params.search = searchTerm;
      if (filters.market_line_id) params.market_line_id = filters.market_line_id;
      if (filters.ghs_danger_class) params.ghs_danger_class = filters.ghs_danger_class;
      if (filters.status) params.status = filters.status;
      if (sortAlphabetical) params.sort = 'alphabetical';

      const [samplesResp, mlResp, suppResp] = await Promise.all([
        samplesAPI.getBulkSamples(params),
        samplesAPI.getMarketLines(),
        samplesAPI.getSuppliers(),
      ]);

      const samplesData = samplesResp.data?.bulkSamples || [];
      const pagination = samplesResp.data?.pagination || {};

      setSamples(samplesData);
      setCurrentPage(pagination.page || page);
      setTotalItems(pagination.total || 0);
      setTotalPages(pagination.totalPages || 1);
      setMarketLines(mlResp.data?.marketLines || []);
      setSuppliers(suppResp.data?.suppliers || []);
    } catch (err) {
      console.error('[SamplesPage] Error cargando muestras:', err);
      setSamples([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Recargar datos cuando cambia página, búsqueda o filtros
  useEffect(() => {
    const hasSearchOrFilters = searchTerm || filters.market_line_id || filters.ghs_danger_class || filters.status || sortAlphabetical;

    // Si hay búsqueda/filtros y no estamos en página 1, resetear
    if (hasSearchOrFilters && currentPage !== 1) {
      setCurrentPage(1);
      return;
    }

    // Cargar datos para la página actual
    loadSamples(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, filters, sortAlphabetical]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Paginación
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const togglePictogram = (pictogram) => {
    setFormData(prev => {
      const current = prev.ghs_pictograms || [];
      const newPictos = current.includes(pictogram)
        ? current.filter(p => p !== pictogram)
        : [...current, pictogram];
      return { ...prev, ghs_pictograms: newPictos };
    });
  };

  const handleCreateSample = async () => {
    if (!formData.name || !formData.supplier_id || !formData.lot || !formData.expiration_date || !formData.manufacture_date || !formData.ghs_danger_class || !formData.market_line_id || !formData.total_weight_grams) {
      alert('Todos los campos obligatorios deben ser completados');
      return;
    }
    if (new Date(formData.manufacture_date) > new Date(formData.expiration_date)) {
      alert('La fecha de manufactura no puede ser posterior a la fecha de vencimiento');
      return;
    }
    try {
      await samplesAPI.createBulkSample(formData);
      setShowCreateModal(false);
      resetForm();
      loadSamples();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Error al crear la muestra');
    }
  };

  const handleUpdateSample = async () => {
    if (!selectedSample) return;
    try {
      const dataToSend = { ...formData };
      // No enviar campos no editables internamente por el sistema
      delete dataToSend.total_units;
      delete dataToSend.available_units;

      await samplesAPI.updateBulkSample(selectedSample.id, dataToSend);

      setIsEditing(false);
      setSelectedSample(null);
      loadSamples();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Error al actualizar la muestra');
    }
  };

  const handleDeleteSample = async (sample) => {
    try {
      const resp = await samplesAPI.deleteBulkSample(sample.id, false);
      // Si requiere confirmación
      if (resp.data?.requires_confirmation) {
        setDeleteTarget(sample);
        setShowDeleteConfirm(true);
        return;
      }
      setSelectedSample(null);
      loadSamples();
    } catch (err) {
      if (err.response?.data?.requires_confirmation) {
        setDeleteTarget(sample);
        setShowDeleteConfirm(true);
        return;
      }
      alert(err.response?.data?.message || err.message || 'Error al eliminar');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await samplesAPI.deleteBulkSample(deleteTarget.id, true);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      setSelectedSample(null);
      loadSamples();
    } catch (err) {
      alert(err.message || 'Error al eliminar');
    }
  };

  const openDetailModal = (sample) => {
    setSelectedSample(sample);
    setIsEditing(false);
    // Prellenar form con datos actuales
    setFormData({
      name: sample.name || '',
      supplier_id: sample.supplier_id || '',
      lot: sample.lot || '',
      expiration_date: sample.expiration_date ? sample.expiration_date.split('T')[0] : '',
      manufacture_date: sample.manufacture_date ? sample.manufacture_date.split('T')[0] : '',
      ghs_danger_class: sample.ghs_danger_class || '',
      market_line_id: sample.market_line_id || '',
      dimensions: sample.dimensions || '1x1x1',
      dispensed_size: sample.dispensed_size || '1x1x1',
      total_weight_grams: sample.total_weight_grams || '',
      ghs_pictograms: sample.ghs_pictograms || [],
      signal_word: sample.signal_word || 'ATENCION',
      coa_file_path: sample.coa_file_path || '',
    });
  };

  const getSGABadge = (sgaClass) => {
    const map = {
      'Sin Riesgo': 'success',
      'Inflamable': 'warning',
      'Corrosivo': 'warning',
      'Tóxico': 'danger',
      'Toxico': 'danger',
      'Comburente': 'info',
      'Explosivo': 'danger',
    };
    return <Badge variant={map[sgaClass] || 'neutral'} dot>{sgaClass || 'N/A'}</Badge>;
  };

  const getStatusBadge = (sample) => {
    if (sample.total_units === 0 || sample.status === 'pending') {
      return <Badge variant="info" dot>Pendiente Dispensar</Badge>;
    }
    if (!sample.expiration_date) return <Badge variant="neutral">Sin fecha</Badge>;
    const expDate = new Date(sample.expiration_date);
    const now = new Date();
    const daysUntil = Math.floor((expDate - now) / (1000 * 60 * 60 * 24));
    if (daysUntil < 0) return <Badge variant="danger" dot>Vencida</Badge>;
    if (daysUntil <= 30) return <Badge variant="warning" dot>Por vencer</Badge>;
    return <Badge variant="success" dot>Activa ({sample.available_units}/{sample.total_units})</Badge>;
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
      key: 'total_weight_grams',
      label: 'Peso Total',
      render: (val) => <span className="text-gray-300 font-mono text-xs">{val ? `${val}g` : 'N/A'}</span>,
    },
    {
      key: 'available_units',
      label: 'Uds. Hijas',
      render: (val, row) => {
        const available = val ?? 0;
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
      key: 'signal_word',
      label: 'Señal',
      render: val => (
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${val === 'PELIGRO' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
          }`}>
          {val || 'ATENCION'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      render: (_val, row) => getStatusBadge(row),
    },
  ];

  const filteredSamples = samples;

  // Función para renderizar el checklist de pictogramas
  const renderPictogramChecklist = (selected, onToggle, disabled) => (
    <div className="grid grid-cols-3 gap-2">
      {ALL_PICTOGRAMS.map(picto => {
        const info = GHS_PICTOGRAM_MAP[picto];
        const isSelected = (selected || []).includes(picto);
        return (
          <div
            key={picto}
            className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all ${isSelected ? 'bg-red-500/10 border-red-500/50' : 'bg-surface-900 border-white/5 opacity-40 grayscale'} ${disabled ? '' : 'cursor-pointer hover:opacity-100'}`}
            onMouseDown={e => {
              // Prevenir que el browser haga scroll automático al hacer focus en este elemento
              e.preventDefault();
              if (!disabled) onToggle(picto);
            }}
          >
            <img
              src={`/recursos/pictogramas/${info.file}`}
              alt={picto}
              className="w-8 h-8 object-contain pointer-events-none"
            />
            <span className={`text-[9px] leading-tight font-medium pointer-events-none ${isSelected ? 'text-red-300' : 'text-gray-500'}`}>
              {info.label}
            </span>
          </div>
        );
      })}
    </div>
  );

  // Función para renderizar el formulario completo (reutilizado en crear y editar)
  const renderSampleForm = (isEdit = false) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Nombre del Producto *</label>
          <input className="input" placeholder="Ej: Vitamina C" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} />
        </div>
        <div>
          <label className="label">Lote *</label>
          <input className="input" placeholder="Ej: LOT-2026-001" value={formData.lot} onChange={e => handleInputChange('lot', e.target.value)}
            readOnly={isEdit} style={isEdit ? { opacity: 0.6, cursor: 'not-allowed' } : {}} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Proveedor *</label>
          <select className="select" value={formData.supplier_id} onChange={e => handleInputChange('supplier_id', e.target.value)}>
            <option value="">Seleccione...</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Clase de Peligro SGA *</label>
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

      {/* Palabra de señal */}
      <div>
        <label className="label">Palabra de Señal *</label>
        <div className="grid grid-cols-2 gap-3">
          {['PELIGRO', 'ATENCION'].map(word => (
            <button
              key={word}
              type="button"
              onClick={() => handleInputChange('signal_word', word)}
              className={`py-3 rounded-xl font-bold text-sm border-2 transition-all ${formData.signal_word === word
                ? word === 'PELIGRO'
                  ? 'bg-red-500/20 border-red-500 text-red-400'
                  : 'bg-amber-500/20 border-amber-500 text-amber-400'
                : 'bg-surface-900 border-white/10 text-gray-500 hover:border-white/20'
                }`}
            >
              {word === 'PELIGRO' ? '⚠ PELIGRO' : '⚡ ATENCIÓN'}
            </button>
          ))}
        </div>
      </div>

      {/* Pictogramas GHS */}
      <div className="border-t border-gray-700/50 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <ShieldExclamationIcon className="w-4 h-4 text-red-400" />
          <h4 className="text-sm font-medium text-gray-300">Pictogramas de Riesgo GHS</h4>
          {formData.ghs_pictograms?.length > 0 && (
            <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">
              {formData.ghs_pictograms.length} seleccionados
            </span>
          )}
        </div>
        {renderPictogramChecklist(formData.ghs_pictograms, togglePictogram, false)}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Peso Total del Bulk (g) *</label>
          <input type="text" inputMode="decimal" className="input" placeholder="5000" value={formData.total_weight_grams} onChange={e => handleInputChange('total_weight_grams', e.target.value.replace(/,/g, '.').replace(/[^\d.]/g, ''))} />
        </div>
        <div>
          <label className="label">Fecha Manufactura *</label>
          <input type="date" className="input" value={formData.manufacture_date} onChange={e => handleInputChange('manufacture_date', e.target.value)} />
        </div>
        <div>
          <label className="label">Fecha Vencimiento *</label>
          <input type="date" className="input" value={formData.expiration_date} onChange={e => handleInputChange('expiration_date', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Línea de Mercado *</label>
          <select className="select" value={formData.market_line_id} onChange={e => handleInputChange('market_line_id', e.target.value)}>
            <option value="">Seleccione...</option>
            {marketLines.map(ml => <option key={ml.id} value={ml.id}>{ml.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Tamaño del Producto Bulk</label>
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
        <div>
          <label className="label">📰 Tamaño frasco dispensado (Almacén 3D)</label>
          <select className="select" value={formData.dispensed_size} onChange={e => handleInputChange('dispensed_size', e.target.value)}>
            <option value="1x1x1">Pequeño (1 unidad)</option>
            <option value="1x2x1">Alto (2 niveles)</option>
            <option value="2x1x1">Ancho (2 columnas)</option>
            <option value="2x2x1">Grande (2×2)</option>
            <option value="1x1x2">Profundo (2 profundidad)</option>
            <option value="1x2x2">Alto + Profundo</option>
            <option value="2x1x2">Ancho + Profundo</option>
            <option value="2x2x2">Máximo (2×2×2)</option>
          </select>
          <p className="text-[10px] text-gray-500 mt-1">Representa el tamaño visual del frasco hijo en los anaqueles 3D al dispensar.</p>
        </div>
      </div>

      {/* CoA */}
      <div className="border-t border-gray-700/50 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <DocumentArrowDownIcon className="w-4 h-4 text-green-400" />
          <h4 className="text-sm font-medium text-gray-300">Certificado de Análisis (CoA)</h4>
        </div>

        {/* Mostrar CoA actual si existe y estamos editando */}
        {isEdit && selectedSample?.coa_file_path && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-green-500/5 border border-green-500/10 rounded-xl">
            <div className="shrink-0 w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
              <DocumentCheckIcon className="w-4 h-4 text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-green-400 font-bold uppercase tracking-wider">Ruta CoA Actual Registrada</p>
              <p className="text-[10px] text-gray-500 truncate">{selectedSample.coa_file_path}</p>
            </div>
            <button
              type="button"
              onClick={async () => {
                if (window.electronAPI && window.electronAPI.openLocalFile) {
                  const success = await window.electronAPI.openLocalFile(selectedSample.coa_file_path);
                  if (!success) alert('No se pudo abrir el archivo PDF.');
                } else {
                  window.open(`${API_BASE}/api/samples/${selectedSample.id}/coa`, '_blank');
                }
              }}
              className="px-3 py-1.5 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-500/20 transition-colors shrink-0"
            >
              Ver PDF
            </button>
          </div>
        )}

        {/* Input para nuevo archivo (Usado en Nuevo y en Editar como actualización) */}
        <div>
          <label className="label">
            {isEdit ? 'Actualizar / Cambiar Ruta CoA (Opcional)' : 'Ruta del Archivo CoA (Ej: \\\\servidor\\docs\\coa.pdf)'}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              className="input flex-1"
              placeholder="Ej: C:\Users\Documentos\CoA.pdf o \\Servidor\Docs\CoA.pdf"
              value={formData.coa_file_path || ''}
              onChange={e => handleInputChange('coa_file_path', e.target.value)}
            />
            <button
              type="button"
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs font-bold text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center justify-center shrink-0"
              onClick={async () => {
                if (window.electronAPI && window.electronAPI.selectFile) {
                  try {
                    const filePath = await window.electronAPI.selectFile();
                    if (filePath) {
                      handleInputChange('coa_file_path', filePath);
                    }
                  } catch (err) {
                    console.error('Error seleccionando archivo:', err);
                  }
                } else {
                  alert('El selector nativo solo está disponible en la aplicación de escritorio.');
                }
              }}
            >
              Examinar...
            </button>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">Pegue la ruta UNC de red o ruta local. El archivo se leerá directamente desde esa ubicación sin copiarse.</p>
        </div>
      </div>
    </div>
  );

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
        <button onClick={() => { resetForm(); setShowCreateModal(true); }} className="btn-primary">
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
          </button>
          <button
            onClick={() => {
              const newVal = !sortAlphabetical;
              setSortAlphabetical(newVal);
              localStorage.setItem('handler_sort_alpha', newVal ? 'true' : 'false');
            }}
            className={`btn-ghost ${sortAlphabetical ? 'text-blue-400 bg-blue-500/10' : ''}`}
            title="Ordenar alfabéticamente de la A a la Z (Persistente)"
          >
            <BarsArrowDownIcon className="w-4 h-4 mr-2" />
            {sortAlphabetical ? 'Orden: A-Z' : 'Ordenar A-Z'}
          </button>
          {(filters.market_line_id || filters.ghs_danger_class || filters.status) && (
            <button
              onClick={() => {
                setFilters({ market_line_id: '', ghs_danger_class: '', status: '' });
              }}
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
        onRowClick={row => openDetailModal(row)}
        emptyTitle="No hay muestras registradas"
        emptyDescription="Comience agregando su primera muestra global al sistema."
        emptyIcon={BeakerIcon}
      />

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="card-footer flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Mostrando <span className="font-semibold text-gray-200">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-semibold text-gray-200">{Math.min(currentPage * itemsPerPage, totalItems)}</span> de <span className="font-semibold text-gray-200">{totalItems}</span> muestras
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg bg-surface-700 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-600 transition-colors"
            >
              Anterior
            </button>

            {/* Números de página */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum
                      ? 'bg-primary-600 text-white'
                      : 'bg-surface-700 text-gray-300 hover:bg-surface-600'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg bg-surface-700 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-600 transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nueva Muestra Global"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleCreateSample} className="btn-primary">Crear Muestra</button>
          </>
        }
      >
        {renderSampleForm(false)}
      </Modal>

      {/* Detail / Edit Modal */}
      <Modal
        isOpen={!!selectedSample}
        onClose={() => { setSelectedSample(null); setIsEditing(false); }}
        title={isEditing ? "Editar Muestra Global" : "Detalle de Muestra Global"}
        size="lg"
        footer={
          <>
            {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)} className="btn-secondary">Cancelar</button>
                <button onClick={handleUpdateSample} className="btn-primary">
                  <CheckCircleIcon className="w-4 h-4 mr-1" />Guardar Cambios
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => selectedSample && handleDeleteSample(selectedSample)}
                  className="btn-ghost text-red-400 hover:text-red-300 mr-auto"
                >
                  <TrashIcon className="w-4 h-4 mr-1" />Eliminar
                </button>
                <button onClick={() => { setSelectedSample(null); setIsEditing(false); }} className="btn-secondary">Cerrar</button>
                <button onClick={() => setIsEditing(true)} className="btn-primary">
                  <PencilSquareIcon className="w-4 h-4 mr-1" />Editar
                </button>
              </>
            )}
          </>
        }
      >
        {selectedSample && !isEditing && (
          <div className="space-y-4">
            {/* Status badge prominente */}
            <div className="flex items-center gap-3">
              {getStatusBadge(selectedSample)}
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${selectedSample.signal_word === 'PELIGRO' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                {selectedSample.signal_word || 'ATENCION'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Producto</p>
                <p className="text-sm font-medium text-gray-200">{selectedSample.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Lote</p>
                <p className="text-sm font-medium text-gray-200 font-mono">{selectedSample.lot}</p>
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
                <p className="text-xs text-gray-500">Peso Total del Bulk</p>
                <p className="text-sm font-medium text-gray-200">{selectedSample.total_weight_grams ? `${selectedSample.total_weight_grams}g` : 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tamaño del Bulk</p>
                <p className="text-sm font-medium text-gray-200">{selectedSample.dimensions || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Muestras Hijas</p>
                <p className="text-sm font-medium text-green-400">{selectedSample.available_units ?? 0} / {selectedSample.total_units ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Línea de Mercado</p>
                <p className="text-sm font-medium text-gray-200">{selectedSample.market_line_name || 'N/A'}</p>
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

            {/* Pictogramas GHS */}
            {selectedSample.ghs_pictograms && selectedSample.ghs_pictograms.length > 0 && (
              <div className="border-t border-gray-700 pt-4">
                <p className="text-xs text-gray-500 mb-2">Pictogramas de Riesgo GHS</p>
                <div className="flex flex-wrap gap-2">
                  {selectedSample.ghs_pictograms.map(picto => {
                    const info = GHS_PICTOGRAM_MAP[picto];
                    if (!info) return null;
                    return (
                      <div key={picto} className="flex flex-col items-center gap-1 p-2 bg-red-500/5 border border-red-500/20 rounded-lg">
                        <img src={`${API_BASE}/recursos/pictogramas/${info.file}`} alt={picto} className="w-7 h-7" />
                        <span className="text-[8px] text-red-300 font-medium">{info.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CoA */}
            <div className="border-t border-gray-700 pt-4">
              <p className="text-xs text-gray-500 mb-2">Certificado de Análisis (CoA)</p>
              {selectedSample.coa_file_path ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-green-400 font-medium">✓ Ruta CoA vinculada</span>
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.electronAPI && window.electronAPI.openLocalFile) {
                        const success = await window.electronAPI.openLocalFile(selectedSample.coa_file_path);
                        if (!success) alert('No se pudo abrir el archivo PDF.');
                      } else {
                        window.open(`${API_BASE}/api/samples/${selectedSample.id}/coa`, '_blank');
                      }
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-500/20"
                  >
                    <DocumentArrowDownIcon className="w-3.5 h-3.5" />Abrir PDF desde la ruta
                  </button>
                </div>
              ) : (
                <span className="text-sm text-yellow-500">⚠ Sin CoA vinculado</span>
              )}
            </div>
          </div>
        )}

        {selectedSample && isEditing && renderSampleForm(true)}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}
        title="⚠ Confirmar Eliminación"
        footer={
          <>
            <button onClick={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }} className="btn-secondary">Cancelar</button>
            <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium">
              Sí, Eliminar Todo
            </button>
          </>
        }
      >
        <div className="flex gap-4">
          <div className="shrink-0 w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <p className="text-sm text-gray-300 leading-relaxed">
              La muestra <strong className="text-white">{deleteTarget?.name}</strong> (Lote: {deleteTarget?.lot}) tiene <strong className="text-red-400">{deleteTarget?.total_units || '?'}</strong> muestras hijas asociadas.
            </p>
            <p className="text-sm text-red-400 mt-2 font-medium">
              Eliminarla borrará TODAS las muestras hijas y sus posiciones en los anaqueles. Esta acción no se puede deshacer.
            </p>
          </div>
        </div>
      </Modal>

      {/* Filter Modal */}
      <Modal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="Filtrar Muestras"
        footer={
          <>
            <button onClick={() => setFilters({ market_line_id: '', ghs_danger_class: '', status: '' })} className="btn-secondary">Limpiar</button>
            <button onClick={() => setShowFilterModal(false)} className="btn-primary">Aplicar Filtros</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Línea de Mercado</label>
            <select className="select" value={filters.market_line_id} onChange={e => setFilters(prev => ({ ...prev, market_line_id: e.target.value }))}>
              <option value="">Todas</option>
              {marketLines.map(ml => <option key={ml.id} value={ml.id}>{ml.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Clase de Peligro SGA</label>
            <select className="select" value={filters.ghs_danger_class} onChange={e => setFilters(prev => ({ ...prev, ghs_danger_class: e.target.value }))}>
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
            <select className="select" value={filters.status} onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}>
              <option value="">Todos</option>
              <option value="pending">Pendiente por dispensar</option>
              <option value="dispensed">Ya dispensada / Almacenada</option>
              <option value="warning">Por Vencer (30 días)</option>
              <option value="expired">Vencidas</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SamplesPage;
