import React, { useState, useEffect } from 'react';
import { BeakerIcon, Search, PlusCircle, CheckCircle2, Box, Info, AlertTriangle, Ruler, Tag, Edit3, X, Save } from 'lucide-react';
import { samplesAPI, dispensingAPI } from '../../services/api';
import Modal from '../../components/Modal';
import LabelPrint from './components/LabelPrint';

const API_BASE = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : 'http://localhost:3001';

const PICTO_FILES = {
  'Explosivo':                  'explos.webp',
  'Inflamable':                 'flamme.webp',
  'Comburente':                 'rondflam.webp',
  'Gas Bajo Presión':           'bottle.webp',
  'Corrosivo':                  'acid_red.webp',
  'Toxicidad Aguda':            'skull.webp',
  'Irritante':                  'exclam.webp',
  'Toxicidad Crónica':          'silhouete.webp',
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
  const [labelBulk, setLabelBulk] = useState(null);

  useEffect(() => {
    loadSamples();
  }, []);

  const loadSamples = async () => {
    try {
      setLoading(true);
      const response = await samplesAPI.getBulkSamples({ limit: 200 });
      const samples = response.data?.data?.bulkSamples || [];
      setGlobalSamples(samples);
    } catch (err) {
      console.error('Error loading global samples:', err);
    } finally {
      setLoading(false);
    }
  };

  const pendingSamples = globalSamples.filter(s => s.total_units === 0);
  const dispensedSamples = globalSamples.filter(s => s.total_units > 0);
  const displayedSamples = showDispensed ? dispensedSamples : pendingSamples;
  const filteredSamples = displayedSamples.filter(s => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      (s.name || '').toLowerCase().includes(term) || 
      (s.lot || '').toLowerCase().includes(term) ||
      (s.supplier_name || '').toLowerCase().includes(term)
    );
  });

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
        number_of_units: parseInt(unitsToGenerate),
        weight_per_unit: parseFloat(weightPerUnit),
        child_dimensions: childDimensions
      });
      
      setSuccessData(resp.data.data.generated_samples || []);
      setDispensingResult(resp.data.data);
      setGlobalSamples(prev => prev.map(s => {
         if (s.id === selectedSample.id) {
           return { ...s, total_units: parseInt(unitsToGenerate), available_units: parseInt(unitsToGenerate) };
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
    loadSamples();
  };

  const handleSelectSample = (sample) => {
    if (successData) return;
    if (sample.total_units > 0) {
      // Si ya dispensada, seleccionar para ver info (no dispensar)
      setSelectedSample(sample);
      return;
    }
    setSelectedSample(sample);
    setUnitsToGenerate(1);
    setWeightPerUnit('');
    setChildDimensions('1x1x1');
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

          {/* Toggle pendientes / dispensadas */}
          <div className="flex bg-surface-900 rounded-lg p-1 gap-1">
            <button
              onClick={() => { setShowDispensed(false); setSelectedSample(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                !showDispensed ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Pendientes ({pendingSamples.length})
            </button>
            <button
              onClick={() => { setShowDispensed(true); setSelectedSample(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                showDispensed ? 'bg-green-500/20 text-green-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Ya Dispensadas ({dispensedSamples.length})
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

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
               <div className="py-10 text-center text-gray-500">Cargando Muestras...</div>
            ) : filteredSamples.length > 0 ? (
              filteredSamples.map(sample => {
                const isDispensed = sample.total_units > 0;
                const isSelected = selectedSample?.id === sample.id;
                return (
                  <div 
                    key={sample.id} 
                    onClick={() => handleSelectSample(sample)}
                    className={`p-4 rounded-xl border transition-colors cursor-pointer ${
                      isSelected 
                        ? isDispensed ? 'bg-green-500/15 border-green-500' : 'bg-blue-500/20 border-blue-500'
                        : isDispensed ? 'bg-surface-900/50 border-white/5 hover:border-green-500/30' 
                        : 'bg-surface-900 border-white/5 hover:border-white/20'
                    } ${successData ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-white text-lg">{sample.name}</h3>
                        <p className="text-xs text-gray-400 mt-1">Lote: {sample.lot}</p>
                        <p className="text-xs text-gray-500">{sample.supplier_name || ''}</p>
                      </div>
                      <div className="text-right">
                        {isDispensed ? (
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 size={14} className="text-green-500" />
                              <span className="text-green-400 text-xs font-medium">{sample.total_units} hijas</span>
                            </div>
                            <span className="text-[10px] text-gray-500">{sample.available_units} disponibles</span>
                          </div>
                        ) : (
                          <span className="text-xs text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded-full">
                            Pendiente
                          </span>
                        )}
                        <p className="text-[10px] text-gray-500 mt-1">
                          Bulk: {sample.total_weight_grams ? `${sample.total_weight_grams}g` : 'N/A'}
                        </p>
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
                        <a href={`${API_BASE}/${selectedSample.coa_file_path}`} target="_blank" rel="noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 font-medium">Ver PDF →</a>
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
                          alt={p} className="w-6 h-6 object-contain" onError={e => { e.target.style.display='none'; }} />
                        <span className="text-[8px] text-red-300">{p}</span>
                      </div>
                    ))}
                  </div>
                )}

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
                        className={`py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all ${
                          childDimensions === dim
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
                      type="number" 
                      min="1"
                      className="flex-1 w-full bg-surface-900 border border-white/10 rounded-lg p-4 font-mono text-2xl text-center text-white focus:border-brand-red focus:outline-none"
                      value={unitsToGenerate}
                      onChange={(e) => setUnitsToGenerate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Peso por Frasco (g)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0.1"
                      placeholder="Ej. 60"
                      className="flex-1 w-full bg-surface-900 border border-brand-red/30 rounded-lg p-4 font-mono text-2xl text-center text-white focus:border-brand-red focus:outline-none"
                      value={weightPerUnit}
                      onChange={(e) => setWeightPerUnit(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-2">Peso exacto de cada frasco hijo estandarizado.</p>
                  </div>
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
                    disabled={isSubmitting || unitsToGenerate <= 0}
                    className="w-full flex justify-center items-center gap-2 py-4 bg-brand-red hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-brand-red/20 transition-all"
                  >
                    <PlusCircle size={20} />
                    {isSubmitting ? 'Procesando...' : `Dispensar ${unitsToGenerate} Frascos Hijos`}
                  </button>
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
