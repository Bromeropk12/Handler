import React, { useState, useEffect } from 'react';
import { BeakerIcon, Search, PlusCircle, CheckCircle2, Box, Info, Ruler, Tag, Building2, Scale, FlaskConical } from 'lucide-react';
import { samplesAPI, dispensingAPI, warehouseAPI } from '../../services/api';
import Modal from '../../components/Modal';
import LabelPrint from './components/LabelPrint';

// URL base para recursos directos (logos, CoA, descargas).
// En dev: CRA proxy (package.json:"proxy") redirige todas las rutas relativas a localhost:3001.
// En producción: Express sirve todo desde el mismo origen — las URLs relativas funcionan nativamente.
const API_BASE = '';

const PICTO_FILES = {
  'Explosivo': 'explos.webp',
  'Inflamable': 'flamme.webp',
  'Comburente': 'rondflam.webp',
  'Gas Bajo Presión': 'bottle.webp',
  'Corrosivo': 'acid_red.webp',
  'Toxicidad Aguda': 'skull.webp',
  'Irritante': 'exclam.webp',
  'Toxicidad Crónica': 'silhouete.webp',
  'Tóxico para Medio Ambiente': 'Aquatic-pollut-red.png'
};

const DispensingPage = () => {
  const [globalSamples, setGlobalSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDispensed, setShowDispensed] = useState(false);

  const [selectedSample, setSelectedSample] = useState(null);
  const [unitsToGenerate, setUnitsToGenerate] = useState(1);
  const [weightPerUnit, setWeightPerUnit] = useState('');
  const [childDimensions, setChildDimensions] = useState('1x1x1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [dispensingResult, setDispensingResult] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showLabelPreview, setShowLabelPreview] = useState(false);
  const [labelSamples, setLabelSamples] = useState([]);
  const [availableShelves, setAvailableShelves] = useState([]);
  const [selectedShelfId, setSelectedShelfId] = useState('');
  const [labelBulk, setLabelBulk] = useState(null);
  const [reassignShelfId, setReassignShelfId] = useState('');
  const [reassignLoading, setReassignLoading] = useState(false);
  const [reassignMessage, setReassignMessage] = useState(null);

  const [marketLines, setMarketLines] = useState([]);
  const [selectedMarketLineId, setSelectedMarketLineId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [samplesResp, mlResp] = await Promise.all([
        samplesAPI.getBulkSamples({ limit: 1000 }), // Límite máximo permitido por backend
        samplesAPI.getMarketLines()
      ]);
      const samples = samplesResp.data?.data?.bulkSamples || [];
      setGlobalSamples(samples);
      setMarketLines(mlResp.data?.data?.marketLines || []);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const pendingSamples = globalSamples.filter(s => s.total_units === 0);
  const dispensedSamples = globalSamples.filter(s => s.total_units > 0);
  const displayedSamples = showDispensed ? dispensedSamples : pendingSamples;
  
  const filteredSamples = displayedSamples
    .filter(s => {
      // Filtrar siempre por línea de mercado seleccionada
      if (s.market_line_id !== selectedMarketLineId) return false;
      
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase().trim();
      return (
        (s.name || '').toLowerCase().includes(term) ||
        (s.lot || '').toLowerCase().includes(term) ||
        (s.supplier_name || '').toLowerCase().includes(term)
      );
    })
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  const handleDispense = (e) => {
    e.preventDefault();
    if (!selectedSample || unitsToGenerate <= 0) return;
    if (!weightPerUnit || parseFloat(weightPerUnit) <= 0) {
      alert('Debes ingresar un Peso por Frasco válido mayor a 0.');
      return;
    }
    if (!childDimensions) {
      alert('Debes seleccionar el tamaño del frasco hijo.');
      return;
    }
    setShowConfirmModal(true);
  };

  const executeDispense = async () => {
    try {
      setShowConfirmModal(false);
      setIsSubmitting(true);
      const resp = await dispensingAPI.dispense({
        global_sample_id: selectedSample.id,
        number_of_units: parseInt(unitsToGenerate, 10),
        weight_per_unit: parseFloat(weightPerUnit),
        child_dimensions: childDimensions,
        shelf_id: selectedShelfId || undefined
      });

      setSuccessData(resp.data.data.generated_samples || []);
      setDispensingResult(resp.data.data);
      setGlobalSamples(prev => prev.map(s => {
        if (s.id === selectedSample.id) {
          return { ...s, total_units: parseInt(unitsToGenerate, 10), available_units: parseInt(unitsToGenerate, 10) };
        }
        return s;
      }));
    } catch (err) {
      alert(err.message || 'Hubo un error en la dispensación');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Abrir etiquetas de una muestra recién dispensada
  const openNewLabels = () => {
    setLabelSamples(successData);
    setLabelBulk({
      name: selectedSample.name,
      lot: selectedSample.lot,
      expiration_date: selectedSample.expiration_date,
      manufacture_date: selectedSample.manufacture_date,
      supplier_name: dispensingResult.supplier_name || selectedSample.supplier_name,
      supplier_logo_path: dispensingResult.supplier_logo_path || selectedSample.supplier_logo_path,
      signal_word: dispensingResult.signal_word || selectedSample.signal_word || 'ATENCION',
      ghs_pictograms: dispensingResult.ghs_pictograms || selectedSample.ghs_pictograms || [],
      ghs_danger_class: selectedSample.ghs_danger_class,
      weight_per_unit: parseFloat(weightPerUnit),
    });
    setShowLabelPreview(true);
  };

  // Abrir etiquetas de una muestra ya dispensada (carga sus hijas del API)
  const openExistingLabels = async (sample) => {
    try {
      const resp = await dispensingAPI.getDispensedSamples({ global_sample_id: sample.id });
      const children = resp.data?.data?.samples || [];
      setLabelSamples(children.map(c => ({ qr_code: c.qr_code, weight_grams: c.weight_grams })));
      setLabelBulk({
        name: sample.name,
        lot: sample.lot,
        expiration_date: sample.expiration_date,
        manufacture_date: sample.manufacture_date,
        supplier_name: sample.supplier_name,
        supplier_logo_path: sample.supplier_logo_path,
        signal_word: sample.signal_word || 'ATENCION',
        ghs_pictograms: sample.ghs_pictograms || [],
        ghs_danger_class: sample.ghs_danger_class,
        weight_per_unit: children[0]?.weight_grams || 0,
      });
      setShowLabelPreview(true);
    } catch (err) {
      alert('No se pudieron cargar las muestras hijas: ' + (err.message || ''));
    }
  };

  const resetFlow = () => {
    setSuccessData(null);
    setDispensingResult(null);
    setSelectedSample(null);
    setUnitsToGenerate(1);
    setWeightPerUnit('');
    setChildDimensions('1x1x1');
    setSelectedShelfId('');
    setAvailableShelves([]);
    loadData();
  };

  const handleSelectSample = async (sample) => {
    if (successData) return;
    if (sample.total_units > 0) {
      setSelectedSample(sample);
      setReassignShelfId('');
      setReassignMessage(null);
      // Load compatible shelves for reassignment
      try {
        const resp = await warehouseAPI.getShelves({ limit: 200 });
        const all = resp.data?.data?.shelves || [];
        const filtered = sample.market_line_id
          ? all.filter(s => s.market_line_id === sample.market_line_id)
          : all;
        setAvailableShelves(filtered);
      } catch (_) { setAvailableShelves([]); }
      return;
    }
    setSelectedSample(sample);
    setUnitsToGenerate(1);
    setWeightPerUnit('');
    setChildDimensions('1x1x1');
    setSelectedShelfId('');
    setReassignShelfId('');
    setReassignMessage(null);
    // Load shelves filtered by this sample's market line
    try {
      const resp = await warehouseAPI.getShelves({ limit: 200 });
      const all = resp.data?.data?.shelves || [];
      const filtered = sample.market_line_id
        ? all.filter(s => s.market_line_id === sample.market_line_id)
        : all;
      setAvailableShelves(filtered);
    } catch (_) {
      setAvailableShelves([]);
    }
  };

  const handleReassignShelf = async () => {
    if (!reassignShelfId || !selectedSample) return;
    try {
      setReassignLoading(true);
      setReassignMessage(null);
      const resp = await dispensingAPI.reassignShelf({
        global_sample_id: selectedSample.id,
        shelf_id: reassignShelfId
      });
      setReassignMessage({ type: 'success', text: resp.data.message });
      setReassignShelfId('');
    } catch (err) {
      setReassignMessage({ type: 'error', text: err.response?.data?.message || err.message });
    } finally {
      setReassignLoading(false);
    }
  };

  const getDimensionLabel = (dim) => {
    const labels = {
      '1x1x1': 'Pequeño (1 celda)',
      '1x2x1': 'Alto (2 niveles)',
      '2x1x1': 'Ancho (2 columnas)',
      '2x2x1': 'Grande (2×2)',
    };
    return labels[dim] || dim;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-sga text-white">Dispensación (Subdivisión)</h1>
        <p className="text-sm text-gray-400 mt-1">
          Seleccione una Muestra Global pendiente y defina cuántos frascos hijos estandarizados generar.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LADO IZQUIERDO: Selección de Bulk */}
        <div className="bg-surface-800 p-6 rounded-2xl border border-white/5 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <Search size={24} />
            </div>
            <h2 className="text-lg font-medium text-white">1. Seleccionar Muestra Global</h2>
          </div>

          <div className="space-y-4">
            {/* Selector de línea de mercado */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Línea de Mercado *</label>
              <select
                value={selectedMarketLineId}
                onChange={e => {
                  setSelectedMarketLineId(e.target.value);
                  setSelectedSample(null);
                }}
                className="w-full bg-surface-900 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">— Seleccione una línea de mercado primero —</option>
                {marketLines.map(ml => (
                  <option key={ml.id} value={ml.id}>{ml.name}</option>
                ))}
              </select>
            </div>

            {selectedMarketLineId && (
              <>
                {/* Toggle pendientes / dispensadas */}
                <div className="flex bg-surface-900 rounded-lg p-1 gap-1">
                  <button
                    onClick={() => { setShowDispensed(false); setSelectedSample(null); }}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!showDispensed ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-gray-300'
                      }`}
                  >
                    Pendientes ({pendingSamples.filter(s => s.market_line_id === selectedMarketLineId).length})
                  </button>
                  <button
                    onClick={() => { setShowDispensed(true); setSelectedSample(null); }}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${showDispensed ? 'bg-green-500/20 text-green-400' : 'text-gray-500 hover:text-gray-300'
                      }`}
                  >
                    Ya Dispensadas ({dispensedSamples.filter(s => s.market_line_id === selectedMarketLineId).length})
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar por Nombre o Lote..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-surface-900 border border-white/10 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </>
            )}
          </div>

          <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2 max-h-[500px]">
            {loading ? (
              <div className="py-10 text-center text-gray-500">Cargando Muestras...</div>
            ) : !selectedMarketLineId ? (
              <div className="py-20 text-center flex flex-col items-center justify-center text-gray-500">
                <Box size={48} className="mb-4 opacity-20" />
                <p>Seleccione una línea de mercado para ver los productos</p>
                <p className="text-sm mt-2">Los productos se mostrarán en orden alfabético.</p>
              </div>
            ) : filteredSamples.length > 0 ? (
              filteredSamples.map(sample => {
                const isDispensed = sample.total_units > 0;
                const isSelected = selectedSample?.id === sample.id;
                return (
                  <div
                    key={sample.id}
                    onClick={() => handleSelectSample(sample)}
                    className={`relative p-4 rounded-xl border transition-all duration-200 cursor-pointer group ${isSelected
                      ? isDispensed
                        ? 'bg-green-500/15 border-green-500 shadow-md ring-1 ring-green-500/50'
                        : 'bg-blue-500/15 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                      : 'bg-surface-900 border-white/10 hover:bg-surface-800 hover:border-white/20 hover:shadow-lg'
                      } ${successData ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex justify-between items-center gap-3">
                      <div className="flex-1 min-w-0 flex items-center gap-3">
                        {/* Icon */}
                        <div className={`p-2.5 rounded-xl shrink-0 ${isDispensed ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'} ${isSelected ? 'bg-opacity-20' : ''}`}>
                          <FlaskConical size={20} />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-100 text-[15px] truncate group-hover:text-white transition-colors">
                            {sample.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <span className="text-gray-500 font-bold">L:</span>
                              <span className="font-mono text-gray-300 truncate max-w-[100px]">{sample.lot}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <Building2 size={10} className="text-gray-500" />
                              <span className="truncate max-w-[120px]">{sample.supplier_name || 'Sin proveedor'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right column: Status & Weight */}
                      <div className="flex flex-col items-end shrink-0 pl-3 border-l border-white/10">
                        {isDispensed ? (
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1 text-green-400">
                              <CheckCircle2 size={14} />
                              <span className="text-xs font-bold">{sample.total_units}</span>
                            </div>
                            <span className="text-[10px] text-gray-500 font-medium">
                              {sample.available_units} disp.
                            </span>
                          </div>
                        ) : (
                          <div className="px-2 py-0.5 rounded flex items-center gap-1.5 border border-amber-500/30 bg-amber-500/10 text-amber-400">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider">Pendiente</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1 mt-2">
                          <Scale size={10} className="text-gray-500" />
                          <span className="text-[10px] text-gray-400 font-mono font-medium">
                            {sample.total_weight_grams ? `${sample.total_weight_grams}g` : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-10 text-center text-gray-500">
                {showDispensed ? 'No hay muestras dispensadas aún.' : 'No hay muestras pendientes por dispensar.'}
              </div>
            )}
          </div>
        </div>

        {/* LADO DERECHO: Formulario o Info */}
        <div className="bg-surface-800 p-6 rounded-2xl border border-white/5 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="p-2 bg-brand-red/10 rounded-lg text-brand-red">
              <BeakerIcon size={24} />
            </div>
            <h2 className="text-lg font-medium text-white">2. Configurar Frascos Hijos</h2>
          </div>

          {selectedSample ? (
            successData ? (
              // PANTALLA DE ÉXITO
              <div className="text-center py-8 space-y-6 animate-fade-in">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 text-green-500">
                  <CheckCircle2 size={40} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">¡Dispensación Exitosa!</h3>
                  <p className="text-gray-400 mt-2 max-w-sm mx-auto">
                    Se han generado <strong>{successData.length}</strong> muestras hijas de <strong>{selectedSample.name}</strong>
                    ({weightPerUnit}g c/u, tamaño {getDimensionLabel(childDimensions)}).
                  </p>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <button onClick={openNewLabels} className="py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                    <Tag size={18} /> 🏷️ Generar e Imprimir Etiquetas
                  </button>
                  <button onClick={resetFlow} className="py-3 px-6 bg-surface-900 hover:bg-surface-700 text-gray-300 font-medium rounded-lg transition-colors">
                    Continuar
                  </button>
                </div>
              </div>
            ) : selectedSample.total_units > 0 ? (
              // ── VISTA DE MUESTRA YA DISPENSADA ──
              <div className="space-y-5 animate-fade-in">
                <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 size={18} className="text-green-400" />
                    <span className="text-green-400 font-semibold">Muestra ya dispensada</span>
                  </div>
                  <p className="text-white font-bold text-xl">{selectedSample.name}</p>
                  <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-white/10">
                    <div>
                      <p className="text-xs text-gray-500">Lote</p>
                      <p className="text-sm font-mono text-gray-200">{selectedSample.lot}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Unidades Hijas</p>
                      <p className="text-sm font-bold text-green-400">{selectedSample.total_units} total / {selectedSample.available_units} disponibles</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Proveedor</p>
                      <p className="text-sm text-gray-200">{selectedSample.supplier_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Señal</p>
                      <p className={`text-sm font-bold ${selectedSample.signal_word === 'PELIGRO' ? 'text-red-400' : 'text-amber-400'}`}>
                        {selectedSample.signal_word || 'ATENCION'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Vencimiento</p>
                      <p className="text-sm text-gray-200">{selectedSample.expiration_date ? new Date(selectedSample.expiration_date).toLocaleDateString('es-CO') : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">CoA</p>
                      {selectedSample.coa_file_path ? (
                        <a
                          href={`${API_BASE}/${selectedSample.coa_file_path}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 mt-0.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm border border-blue-500/40"
                        >
                          📄 Ver CoA PDF
                        </a>
                      ) : (
                        <span className="text-xs text-yellow-500">⚠ Sin CoA</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pictogramas */}
                {selectedSample.ghs_pictograms?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedSample.ghs_pictograms.map(p => (
                      <div key={p} className="flex flex-col items-center gap-1 p-2 bg-red-500/5 border border-red-500/15 rounded-lg">
                        <img src={`/recursos/pictogramas/${PICTO_FILES[p] || 'skull.webp'}`}
                          alt={p} className="w-6 h-6 object-contain" onError={e => { e.target.style.display = 'none'; }} />
                        <span className="text-[8px] text-red-300">{p}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Shelf Reassignment Panel */}
                <div className="border border-yellow-500/20 bg-yellow-500/5 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Box size={15} className="text-yellow-400" />
                    <span className="text-sm font-semibold text-yellow-300">Reasignar Anaquel de Destino</span>
                  </div>
                  <p className="text-xs text-gray-500">Mueve todas las muestras hijas almacenadas a un anaquel diferente de la misma línea de mercado.</p>
                  {availableShelves.length === 0 ? (
                    <p className="text-xs text-amber-400">⚠ No hay anaqueles compatibles con esta línea de mercado.</p>
                  ) : (
                    <div className="flex gap-2">
                      <select
                        value={reassignShelfId}
                        onChange={e => setReassignShelfId(e.target.value)}
                        className="flex-1 bg-surface-900 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-yellow-500 focus:outline-none"
                      >
                        <option value="">— Seleccionar nuevo anaquel —</option>
                        {availableShelves.map(s => (
                          <option key={s.id} value={s.id}>{s.name}{s.zone_name ? ` · ${s.zone_name}` : ''}</option>
                        ))}
                      </select>
                      <button
                        onClick={handleReassignShelf}
                        disabled={!reassignShelfId || reassignLoading}
                        className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-bold text-sm rounded-lg transition-colors"
                      >
                        {reassignLoading ? '...' : '↗ Mover'}
                      </button>
                    </div>
                  )}
                  {reassignMessage && (
                    <p className={`text-xs font-medium mt-1 ${reassignMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                      {reassignMessage.type === 'success' ? '✓' : '✗'} {reassignMessage.text}
                    </p>
                  )}
                </div>

                {/* Acción: imprimir etiquetas */}
                <button
                  onClick={() => openExistingLabels(selectedSample)}
                  className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Tag size={18} /> Ver / Imprimir Etiquetas de este Lote
                </button>
              </div>
            ) : (
              // FORMULARIO DE DISPENSACIÓN
              <form onSubmit={handleDispense} className="space-y-6 mt-4">
                <div className="p-4 bg-surface-900 border border-white/5 rounded-xl space-y-3">
                  <h3 className="text-sm text-gray-400 mb-1">Muestra Seleccionada:</h3>
                  <p className="text-white font-medium text-lg">{selectedSample.name}</p>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                    <div>
                      <p className="text-xs text-gray-500">Lote</p>
                      <p className="text-sm font-mono text-gray-300">{selectedSample.lot}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Clase SGA</p>
                      <p className="text-sm text-gray-300">{selectedSample.ghs_danger_class || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Peso Total del Bulk</p>
                      <p className="text-sm font-bold text-blue-400">{selectedSample.total_weight_grams ? `${selectedSample.total_weight_grams}g` : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">CoA</p>
                      <p className="text-sm text-gray-300">
                        {selectedSample.coa_file_path ? <span className="text-green-400">✓ Adjunto</span> : <span className="text-yellow-500">⚠ Falta</span>}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tamaño del frasco hijo */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                    <Ruler size={14} className="text-primary-400" />
                    Tamaño del Frasco Hijo (en el anaquel)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['1x1x1', '1x2x1', '2x1x1', '2x2x1'].map(dim => (
                      <button
                        key={dim}
                        type="button"
                        onClick={() => setChildDimensions(dim)}
                        className={`py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all ${childDimensions === dim
                          ? 'bg-primary-500/15 border-primary-500 text-primary-400'
                          : 'bg-surface-900 border-white/10 text-gray-400 hover:border-white/20'
                          }`}
                      >
                        <span className="font-mono text-xs">{dim}</span>
                        <span className="block text-[10px] mt-0.5 opacity-70">{getDimensionLabel(dim)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Cantidad de Frascos</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="flex-1 w-full bg-surface-900 border border-white/10 rounded-lg p-4 font-mono text-2xl text-center text-white focus:border-brand-red focus:outline-none"
                      value={unitsToGenerate}
                      onChange={(e) => setUnitsToGenerate(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Peso por Frasco (g)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Ej. 60"
                      className="flex-1 w-full bg-surface-900 border border-brand-red/30 rounded-lg p-4 font-mono text-2xl text-center text-white focus:border-brand-red focus:outline-none"
                      value={weightPerUnit}
                      onChange={(e) => setWeightPerUnit(e.target.value.replace(/,/g, '.').replace(/[^\d.]/g, ''))}
                    />
                    <p className="text-xs text-gray-500 mt-2">Peso exacto de cada frasco hijo estandarizado.</p>
                  </div>
                </div>

                {/* Shelf selector — filtered by market line */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                    <Box size={14} className="text-yellow-400" />
                    Anaquel de Destino *
                    {selectedSample?.market_line_name && (
                      <span className="ml-auto text-xs text-yellow-400/80 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                        Línea: {selectedSample.market_line_name}
                      </span>
                    )}
                  </label>
                  {availableShelves.length === 0 ? (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-400">
                      ⚠ No hay anaqueles disponibles para la línea de mercado de este producto. Crea uno primero en el módulo Anaqueles.
                    </div>
                  ) : (
                    <select
                      required
                      value={selectedShelfId}
                      onChange={e => setSelectedShelfId(e.target.value)}
                      className="w-full bg-surface-900 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-yellow-500 focus:outline-none"
                    >
                      <option value="">— Seleccionar anaquel —</option>
                      {availableShelves.map(shelf => (
                        <option key={shelf.id} value={shelf.id}>
                          {shelf.name}{shelf.zone_name ? ` · ${shelf.zone_name}` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {weightPerUnit && unitsToGenerate > 0 && (
                  <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl text-sm text-blue-300">
                    <p>📦 {unitsToGenerate} frascos × {weightPerUnit}g = <strong>{(unitsToGenerate * parseFloat(weightPerUnit || 0)).toFixed(1)}g</strong> total dispensado</p>
                    <p className="text-xs text-gray-500 mt-1">Tamaño en anaquel: {getDimensionLabel(childDimensions)}</p>
                  </div>
                )}

                <div className="pt-4 border-t border-white/10">
                  <button
                    type="submit"
                    disabled={isSubmitting || unitsToGenerate <= 0 || !selectedShelfId}
                    className="w-full flex justify-center items-center gap-2 py-4 bg-brand-red hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-brand-red/20 transition-all"
                  >
                    <PlusCircle size={20} />
                    {isSubmitting ? 'Procesando...' : `Dispensar ${unitsToGenerate} Frascos al Anaquel`}
                  </button>
                  {!selectedShelfId && availableShelves.length > 0 && (
                    <p className="text-xs text-center text-amber-400 mt-2">⚠ Debes seleccionar un anaquel de destino</p>
                  )}
                </div>
              </form>
            )
          ) : (
            <div className="py-20 text-center flex flex-col items-center justify-center text-gray-500">
              <Box size={48} className="mb-4 opacity-20" />
              <p>{showDispensed ? 'Selecciona una muestra dispensada para ver sus etiquetas.' : 'Selecciona una Muestra Global pendiente'}</p>
              <p className="text-sm mt-2">{showDispensed ? '' : 'para inicializar los frascos de este lote.'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirmar Dispensación"
        footer={
          <>
            <button onClick={() => setShowConfirmModal(false)} className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors">
              Cancelar
            </button>
            <button onClick={executeDispense} className="px-4 py-2 text-sm bg-brand-red text-white rounded-lg hover:bg-red-700 font-medium">
              Confirmar y Generar
            </button>
          </>
        }
      >
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Info className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white mb-2">Validación de Creación</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Se generarán <strong>{unitsToGenerate}</strong> frascos hijos de <strong>{weightPerUnit}g</strong> cada uno
              (tamaño {getDimensionLabel(childDimensions)}) para <strong>{selectedSample?.name}</strong>.
              <br /><br />
              <strong className="text-amber-400">⚠ Una vez dispensada, esta muestra global no podrá dispensarse nuevamente.</strong>
            </p>
          </div>
        </div>
      </Modal>

      {/* Label Preview/Print */}
      {showLabelPreview && labelBulk && (
        <LabelPrint
          samples={labelSamples}
          bulkData={labelBulk}
          onClose={() => setShowLabelPreview(false)}
        />
      )}
    </div>
  );
};

export default DispensingPage;
