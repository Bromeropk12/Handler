import React, { useState, useEffect } from 'react';
import { BeakerIcon, Search, PlusCircle, CheckCircle2, Box, Info } from 'lucide-react';
import { samplesAPI, dispensingAPI } from '../../services/api';
import Modal from '../../components/Modal';

const DispensingPage = () => {
  const [globalSamples, setGlobalSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedSample, setSelectedSample] = useState(null);
  const [unitsToGenerate, setUnitsToGenerate] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    loadSamples();
  }, []);

  const loadSamples = async () => {
    try {
      setLoading(true);
      // Fetch only samples that have available_units and total_units = 0 to specifically show ones that haven't been dispensed yet 
      // or fetch all to allow adding more units. We'll fetch all available global samples.
      const response = await samplesAPI.getBulkSamples({ limit: 100 });
      setGlobalSamples(response.data.data.samples || []);
    } catch (err) {
      console.error('Error loading global samples:', err);
      alert('Error cargando muestras globales. Continúe con precaución.');
    } finally {
      setLoading(false);
    }
  };

  const filteredSamples = globalSamples.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.lot.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDispense = (e) => {
    e.preventDefault();
    if (!selectedSample || unitsToGenerate <= 0) return;
    setShowConfirmModal(true);
  };

  const executeDispense = async () => {
    try {
      setShowConfirmModal(false);
      setIsSubmitting(true);
      const resp = await dispensingAPI.dispense({
        global_sample_id: selectedSample.id,
        number_of_units: unitsToGenerate
      });
      
      setSuccessData(resp.data.data.generated_qr_codes);
      
      // Update local state temporarily so the user sees the new unit count
      setGlobalSamples(prev => prev.map(s => {
         if (s.id === selectedSample.id) {
           return { ...s, total_units: s.total_units + parseInt(unitsToGenerate), available_units: s.available_units + parseInt(unitsToGenerate) };
         }
         return s;
      }));
      
    } catch (err) {
      alert(err.message || 'Hubo un error en la dispensación');
    } finally {
      setIsSubmitting(false);
    }
  };

  const printQRCodes = () => {
    if (!successData) return;
    
    // Abrir ventana para imprimir los QRs y luego resetear todo
    const printWindow = window.open('', '_blank');
    const qrHTML = successData.map(qr => `
      <div style="border: 2px dashed #000; padding: 10px; margin: 10px; width: 250px; text-align: center; display: inline-block;">
        <h3 style="margin: 0; font-size: 14px;">Handler S.A.S</h2>
        <div style="font-weight: bold; font-family: monospace; font-size: 18px; margin: 10px 0;">${qr}</div>
        <div style="font-size: 12px;">${selectedSample.name} - Lote: ${selectedSample.lot}</div>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Imprimir Códigos Hijos</title>
        </head>
        <body>
          <h2>Lote de Impresión</h2>
          ${qrHTML}
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    
    // Reset state after printing
    setSuccessData(null);
    setSelectedSample(null);
    setUnitsToGenerate(1);
    setSearchTerm('');
  };

  const resetFlow = () => {
    setSuccessData(null);
    setSelectedSample(null);
    setUnitsToGenerate(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-sga text-white">Dispensación (Subdivisión)</h1>
        <p className="text-sm text-gray-400 mt-1">
          Toma una Muestra Global del sistema y subdivídela en "Hijos" individuales ingresando la cantidad de unidades.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LADO IZQUIERDO: Seleccion de Bulk */}
        <div className="bg-surface-800 p-6 rounded-2xl border border-white/5 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <Search size={24} />
            </div>
            <h2 className="text-lg font-medium text-white">1. Seleccionar Muestra Global</h2>
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
              filteredSamples.map(sample => (
                <div 
                  key={sample.id} 
                  onClick={() => !successData && setSelectedSample(sample)}
                  className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                    selectedSample?.id === sample.id 
                    ? 'bg-blue-500/20 border-blue-500' 
                    : 'bg-surface-900 border-white/5 hover:border-white/20'
                  } ${successData ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-white text-lg">{sample.name}</h3>
                      <p className="text-xs text-gray-400 mt-1">Lote: {sample.lot}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-blue-400 text-sm font-medium">{sample.total_units} Uds act.</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-gray-500">
                No se encontraron muestras globales.
              </div>
            )}
          </div>
        </div>

        {/* LADO DERECHO: Formulario de Subdivisión */}
        <div className="bg-surface-800 p-6 rounded-2xl border border-white/5 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="p-2 bg-brand-red/10 rounded-lg text-brand-red">
              <BeakerIcon size={24} />
            </div>
            <h2 className="text-lg font-medium text-white">2. Configurar "Hijos" a Generar</h2>
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
                    Se han generado y loggeado <strong>{successData.length}</strong> muestras en estado "Disponible" para el producto <strong>{selectedSample.name}</strong>.
                  </p>
                </div>
                
                <div className="flex flex-col gap-3 pt-4">
                  <button onClick={printQRCodes} className="py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors">
                    Imprimir Etiquetas QR
                  </button>
                  <button onClick={resetFlow} className="py-3 px-6 bg-surface-900 hover:bg-surface-700 text-gray-300 font-medium rounded-lg transition-colors">
                    Continuar Dispensando
                  </button>
                </div>
              </div>
            ) : (
              // PANTALLA DE FORMULARIO
              <form onSubmit={handleDispense} className="space-y-6 mt-4">
                <div className="p-4 bg-surface-900 border border-white/5 rounded-xl">
                  <h3 className="text-sm text-gray-400 mb-1">Muestra Seleccionada:</h3>
                  <p className="text-white font-medium text-lg">{selectedSample.name}</p>
                  <p className="text-xs text-gray-500 mt-1">Actualmente cuenta con {selectedSample.total_units} unidades registradas en su histórico.</p>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Cantidad de Frascos / Unidades a Dispensar</label>
                  <div className="flex gap-4">
                    <input 
                      type="number" 
                      min="1"
                      className="flex-1 bg-surface-900 border border-white/10 rounded-lg p-4 font-mono text-2xl text-center text-white focus:border-brand-red focus:outline-none"
                      value={unitsToGenerate}
                      onChange={(e) => setUnitsToGenerate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <button 
                    type="submit" 
                    disabled={isSubmitting || unitsToGenerate <= 0}
                    className="w-full flex justify-center items-center gap-2 py-4 bg-brand-red hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-brand-red/20 transition-all"
                  >
                    <PlusCircle size={20} />
                    {isSubmitting ? 'Procesando...' : `Generar ${unitsToGenerate} Códigos QR`}
                  </button>
                </div>
              </form>
            )
          ) : (
             <div className="py-20 text-center flex flex-col items-center justify-center text-gray-500">
               <Box size={48} className="mb-4 opacity-20" />
               <p>Selecciona una Muestra Global a tu izquierda</p>
               <p className="text-sm mt-2">para inicializar los frascos de este lote.</p>
             </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirmar Dispensación"
        footer={
          <>
            <button
              onClick={() => setShowConfirmModal(false)}
              className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={executeDispense}
              className="px-4 py-2 text-sm bg-brand-red text-white rounded-lg hover:bg-red-700 font-medium"
            >
              Confirmar y Generar QRs
            </button>
          </>
        }
      >
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Info className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white mb-2">
              Validación de Creación
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              ¿Está seguro que desea generar <strong>{unitsToGenerate}</strong> nuevas unidades hijas (subdivisiones físicas) para la muestra global <strong>{selectedSample?.name}</strong>?
              <br /><br />
              Esta acción registrará los nuevos contenedores en estado "disponible" localmente en la base de datos y permitirá la impresión de sus respectivas etiquetas QR.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DispensingPage;
