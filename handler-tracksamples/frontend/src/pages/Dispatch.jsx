import { useState } from 'react';
import { api } from '../services/api';
import { Search, CheckCircle, FileText, Truck } from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Búsqueda FEFO', icon: Search },
  { id: 2, title: 'Validación QR', icon: CheckCircle },
  { id: 3, title: 'Confirmación', icon: Truck },
  { id: 4, title: 'Documentación', icon: FileText },
];

export default function Dispatch() {
  const [currentStep, setCurrentStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [fefoResults, setFefoResults] = useState([]);
  const [selectedSample, setSelectedSample] = useState(null);
  const [qrInput, setQrInput] = useState('');
  const [qrError, setQrError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dispatchResult, setDispatchResult] = useState(null);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      const results = await api.dispensedSamples.getByFefo(searchTerm);
      setFefoResults(results);
      if (results.length > 0) {
        setSelectedSample(results[0]);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const validateQR = () => {
    if (!qrInput.trim()) {
      setQrError('Ingrese el código QR');
      return;
    }
    if (qrInput.trim() === selectedSample?.qr_code) {
      setQrError('');
      setCurrentStep(3);
    } else {
      setQrError('El código QR no coincide con la muestra sugerida');
    }
  };

  const confirmDispatch = async () => {
    setLoading(true);
    try {
      const result = await api.dispensedSamples.dispatch(selectedSample.qr_code);
      setDispatchResult(result);
      setCurrentStep(4);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetDispatch = () => {
    setCurrentStep(1);
    setSearchTerm('');
    setFefoResults([]);
    setSelectedSample(null);
    setQrInput('');
    setQrError('');
    setDispatchResult(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Despachos</h1>
        <p className="text-gray-500">Stepper de 4 pasos para despacho validado</p>
      </div>

      <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm">
        {STEPS.map((step, idx) => (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center gap-2 ${currentStep >= step.id ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep > step.id ? 'bg-green-500 text-white' :
                currentStep === step.id ? 'bg-blue-600 text-white' :
                'bg-gray-200'
              }`}>
                {currentStep > step.id ? <CheckCircle className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
              </div>
              <span className="font-medium">{step.title}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`w-16 h-1 mx-4 ${currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'}`}></div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          {currentStep === 1 && (
            <>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Paso 1: Búsqueda y Algoritmo FEFO</h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Buscar producto por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="input-field flex-1"
                />
                <button onClick={handleSearch} disabled={loading} className="btn-primary">
                  Buscar
                </button>
              </div>
              {fefoResults.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Resultados ordenados por FEFO (primero el que vence más pronto):</p>
                  {fefoResults.map((sample, idx) => (
                    <div
                      key={sample.id}
                      onClick={() => setSelectedSample(sample)}
                      className={`p-3 rounded-lg border-2 cursor-pointer ${
                        selectedSample?.id === sample.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-800">{sample.name}</p>
                          <p className="text-sm text-gray-500">Lote: {sample.lot}</p>
                        </div>
                        <div className="text-right">
                          {idx === 0 && (
                            <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">FEFO</span>
                          )}
                          <p className="text-sm text-gray-500">Vence: {sample.expiration_date}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {selectedSample && (
                <button
                  onClick={() => setCurrentStep(2)}
                  className="btn-primary w-full mt-4"
                >
                  Continuar a Validación QR
                </button>
              )}
            </>
          )}

          {currentStep === 2 && (
            <>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Paso 2: Validación Física por QR</h3>
              <div className="p-4 bg-yellow-50 rounded-lg mb-4">
                <p className="text-sm text-yellow-800">
                  Escanee el código QR del producto o ingréselo manualmente.
                  El código debe coincidir con la muestra seleccionada.
                </p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Muestra seleccionada (FEFO):</p>
                <p className="font-medium text-gray-800">{selectedSample?.name}</p>
                <p className="text-sm text-gray-500">Lote: {selectedSample?.lot}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código QR</label>
                <input
                  type="text"
                  value={qrInput}
                  onChange={(e) => { setQrInput(e.target.value); setQrError(''); }}
                  placeholder="Escanee o ingrese el código QR"
                  className="input-field"
                />
                {qrError && <p className="text-red-500 text-sm mt-1">{qrError}</p>}
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setCurrentStep(1)} className="btn-secondary flex-1">
                  Atrás
                </button>
                <button onClick={validateQR} className="btn-primary flex-1">
                  Validar QR
                </button>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Paso 3: Confirmación de Despacho</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">Resumen del Lote</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-500">Producto:</span> <span className="font-medium">{selectedSample?.name}</span></div>
                    <div><span className="text-gray-500">Peso:</span> <span className="font-medium">{selectedSample?.weight_grams}g</span></div>
                    <div><span className="text-gray-500">Lote:</span> <span className="font-medium">{selectedSample?.lot}</span></div>
                    <div><span className="text-gray-500">Proveedor:</span> <span className="font-medium">{selectedSample?.provider}</span></div>
                    <div className="col-span-2"><span className="text-gray-500">Ubicación:</span> <span className="font-medium">{selectedSample?.shelf_name || 'N/A'}</span></div>
                  </div>
                </div>
                <button
                  onClick={confirmDispatch}
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? 'Confirmando...' : 'Confirmar Despacho'}
                </button>
                <button onClick={() => setCurrentStep(2)} className="btn-secondary w-full">
                  Atrás
                </button>
              </div>
            </>
          )}

          {currentStep === 4 && (
            <>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Paso 4: Documentación y CoA</h3>
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-800 mb-2">Despacho Confirmado</h4>
                <p className="text-gray-500 mb-4">El producto ha sido despachado exitosamente</p>
                <div className="p-4 bg-gray-50 rounded-lg text-left mb-4">
                  <p className="text-sm"><span className="font-medium">Producto:</span> {dispatchResult?.sample?.name}</p>
                  <p className="text-sm"><span className="font-medium">Lote:</span> {dispatchResult?.sample?.lot}</p>
                  <p className="text-sm"><span className="font-medium">Código QR:</span> {dispatchResult?.sample?.qr_code}</p>
                </div>
                <button onClick={resetDispatch} className="btn-primary">
                  Nuevo Despacho
                </button>
              </div>
            </>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Ayuda del Proceso</h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-medium">1</span>
              </div>
              <div>
                <p className="font-medium text-gray-800">Búsqueda FEFO</p>
                <p className="text-sm text-gray-500">El sistema encuentra el producto con fecha de vencimiento más próxima.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-medium">2</span>
              </div>
              <div>
                <p className="font-medium text-gray-800">Validación QR</p>
                <p className="text-sm text-gray-500">Escanee el código QR del producto físico para validar que es el correcto.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-medium">3</span>
              </div>
              <div>
                <p className="font-medium text-gray-800">Confirmación</p>
                <p className="text-sm text-gray-500">Revise y confirme los detalles del despacho antes de proceder.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-medium">4</span>
              </div>
              <div>
                <p className="font-medium text-gray-800">Documentación</p>
                <p className="text-sm text-gray-500">El sistema busca el archivo CoA (Certificate of Analysis) en el directorio configured.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}