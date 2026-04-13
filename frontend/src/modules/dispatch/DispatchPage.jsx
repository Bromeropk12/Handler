import React, { useState, useEffect, useRef } from 'react';
import { Search, Box, AlertTriangle, FileText, CheckCircle2, QrCode, Camera, History, Calendar, LayoutGrid, ArrowRight, ArrowLeft, Printer, Download, Eye, Upload } from 'lucide-react';
import { dispatchAPI, samplesAPI } from '../../services/api';
import { Html5Qrcode } from 'html5-qrcode';
import Modal from '../../components/Modal';
import DispatchLabelPrint from './components/DispatchLabelPrint';

const API_BASE = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : 'http://localhost:3001';
// ==========================================
// Stepper de 4 Pasos para Despacho
// ==========================================
const STEPS = [
  { id: 1, title: 'Búsqueda FEFO', icon: Search, description: 'Buscar producto y ver recomendaciones' },
  { id: 2, title: 'Validación QR', icon: QrCode, description: 'Escanear o ingresar código QR' },
  { id: 3, title: 'Confirmación', icon: CheckCircle2, description: 'Revisar resumen del despacho' },
  { id: 4, title: 'Documentación', icon: FileText, description: 'Imprimir etiqueta y ver CoA' },
];

const DispatchPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const [scanCode, setScanCode] = useState('');
  const [dispatchStatus, setDispatchStatus] = useState(null);
  const [dispatchMessage, setDispatchMessage] = useState('');
  const [labelData, setLabelData] = useState(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingScanCode, setPendingScanCode] = useState('');
  const [cameraError, setCameraError] = useState(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [showLabelPreview, setShowLabelPreview] = useState(false);

  const html5QrCodeRef = useRef(null);

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const resp = await dispatchAPI.getHistory({ limit: 10 });
      setHistory(resp.data.data.history || []);
    } catch (err) {
      console.error('Error cargando historial', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchTerm) return;
    setLoading(true);
    try {
      const resp = await dispatchAPI.getFefoRecommendation({ product_name: searchTerm });
      const recs = resp.data.data.recommendations || [];
      setRecommendations(recs);
      if (recs.length > 0) {
        setSelectedRecommendation(recs[0]);
        setCurrentStep(2); // Avanzar al paso 2
      }
    } catch (err) {
      alert('Error buscando recomendaciones: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Cámara ──
  const startScanner = () => {
    setCameraError(null);
    setScannerActive(true);
    setTimeout(async () => {
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      try {
        if (!html5QrCodeRef.current) {
          html5QrCodeRef.current = new Html5Qrcode('qr-reader-dispatch');
        }
        await html5QrCodeRef.current.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            setScanCode(decodedText);
            stopScanner();
            if (recommendations.length > 0) setCurrentStep(3); // Avanzar al paso 3
          },
          () => {}
        );
      } catch (err) {
        let msg = 'No se pudo acceder a la cámara.';
        if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
          msg = '🔒 Permiso denegado. Ve a Configuración de Windows → Privacidad → Cámara.';
        } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
          msg = '📷 No se encontró ninguna cámara.';
        } else if (err?.name === 'NotReadableError') {
          msg = '⚠️ La cámara está ocupada en otra app.';
        } else if (err?.name === 'OverconstrainedError') {
          try {
            await html5QrCodeRef.current.start({ facingMode: 'user' }, config, (decodedText) => { setScanCode(decodedText); stopScanner(); if (recommendations.length > 0) setCurrentStep(3); }, () => {});
            return;
          } catch (err2) {
            msg = `No se pudo enlazar cámara. (${err2?.message || String(err2)})`;
          }
        }
        setCameraError(msg);
        setScannerActive(false);
      }
    }, 100);
  };

  const stopScanner = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().then(() => { html5QrCodeRef.current = null; setScannerActive(false); }).catch(() => { html5QrCodeRef.current = null; setScannerActive(false); });
    } else {
      setScannerActive(false);
    }
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) { html5QrCodeRef.current.stop().catch(() => {}); html5QrCodeRef.current = null; }
    };
  }, []);

  // ── Validación QR (Paso 2 → 3) ──
  const handleValidateQR = async () => {
    if (!scanCode) { alert('Ingrese o escanee un código QR'); return; }
    if (recommendations.length === 0) { alert('Busque un producto primero'); return; }

    const bestChoice = recommendations[0].qr_code;
    if (scanCode !== bestChoice) {
      setPendingScanCode(scanCode);
      setShowConfirmModal(true);
      return;
    }
    setCurrentStep(3); // Avanzar al paso 3
  };

  // ── Ejecutar Despacho (Paso 3 → 4) ──
  const executeDispatchAPI = async (code, expectedProductName) => {
    try {
      setLoading(true);
      const resp = await dispatchAPI.dispatch({ qr_code: code, expected_product_name: expectedProductName });
      setDispatchStatus('success');
      setDispatchMessage(resp.data.message);
      setLabelData({
        product_name: resp.data.data.product_name,
        lot: resp.data.data.lot,
        expiration_date: new Date(resp.data.data.expiration_date).toISOString().split('T')[0],
        manufacture_date: selectedRecommendation?.manufacture_date ? new Date(selectedRecommendation.manufacture_date).toISOString().split('T')[0] : '',
        coa_file_path: resp.data.data.coa_file_path || selectedRecommendation?.coa_file_path,
        shelf_name: resp.data.data.shelf_name,
        dispatched_by: resp.data.data.dispatched_by,
        dispatched_at: resp.data.data.dispatched_at,
        qr_code: resp.data.data.qr_code
      });
      setScanCode('');
      setShowConfirmModal(false);
      fetchHistory();
      setCurrentStep(4); // Avanzar al paso 4
    } catch (err) {
      setDispatchStatus('error');
      setDispatchMessage(err.message || 'Error al despachar la muestra');
      setShowConfirmModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDispatch = () => {
    executeDispatchAPI(scanCode, searchTerm);
  };

  // ── Imprimir Etiqueta ──
  const printLabel = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>Etiqueta de Despacho</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .label-box { border: 2px solid #000; padding: 20px; width: 400px; margin: 0 auto; text-align: center; }
        h2 { margin: 0 0 10px 0; color: #E30613; }
        h1 { margin: 0 0 20px 0; font-size: 24px; }
        .details { text-align: left; margin-bottom: 20px; font-size: 18px; }
        .details div { margin-bottom: 8px; }
      </style></head><body>
      <div class="label-box">
        <h2>Handler S.A.S</h2>
        <h1>${labelData.product_name}</h1>
        <div class="details">
          <div><strong>Lote:</strong> ${labelData.lot}</div>
          <div><strong>Vencimiento:</strong> ${labelData.expiration_date}</div>
          <div><strong>QR:</strong> ${labelData.qr_code}</div>
          <div><strong>Despachado por:</strong> ${labelData.dispatched_by}</div>
        </div>
        <div><em>Control de Calidad</em></div>
      </div>
      <script>window.print(); window.close();</script>
      </body></html>
    `);
  };

  // ── Descargar CoA ──
  const downloadCoA = () => {
    if (labelData?.coa_file_path) {
      const link = document.createElement('a');
      link.href = `http://localhost:3001/${labelData.coa_file_path}`;
      link.target = '_blank';
      link.download = `CoA_${labelData.lot}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('No hay certificado CoA adjunto para esta muestra.');
    }
  };

  // ── Resetear todo ──
  const resetAll = () => {
    setCurrentStep(1);
    setSearchTerm('');
    setRecommendations([]);
    setScanCode('');
    setDispatchStatus(null);
    setDispatchMessage('');
    setLabelData(null);
    setSelectedRecommendation(null);
    setShowLabelPreview(false);
  };

  // ── Renderizar Stepper Header ──
  const renderStepper = () => (
    <div className="flex items-center justify-between mb-8">
      {STEPS.map((step, index) => {
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;
        const Icon = step.icon;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center flex-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                isCompleted ? 'bg-green-500 text-white' : 
                isActive ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 
                'bg-gray-800 text-gray-500 border border-gray-700'
              }`}>
                {isCompleted ? <CheckCircle2 size={20} /> : <Icon size={20} />}
              </div>
              <p className={`text-xs mt-2 font-medium ${isActive ? 'text-white' : 'text-gray-500'}`}>{step.title}</p>
              <p className="text-[10px] text-gray-600 hidden sm:block">{step.description}</p>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 transition-colors duration-300 ${isCompleted ? 'bg-green-500' : 'bg-gray-800'}`}></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  // ── PASO 1: Búsqueda FEFO ──
  const renderStep1 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-white mb-1">Búsqueda FEFO</h2>
        <p className="text-sm text-gray-400">Busque el producto para ver las unidades ordenadas por fecha de vencimiento</p>
      </div>
      <form onSubmit={handleSearch} className="flex gap-3">
        <input type="text" placeholder="Nombre del producto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 bg-gray-900/50 border border-gray-700 rounded-xl p-4 text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors" />
        <button type="submit" disabled={loading} className="px-8 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors flex items-center gap-2">
          <Search size={18} /> Buscar
        </button>
      </form>
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {recommendations.length > 0 ? (
          <>
            <p className="text-sm text-gray-400">Unidades ordenadas por vencimiento (FEFO):</p>
            {recommendations.map((rec, index) => {
              const isExpired = rec.days_until_expiry < 0;
              const isWarning = rec.days_until_expiry >= 0 && rec.days_until_expiry <= 30;
              return (
                <div key={rec.dispensed_id} onClick={() => { setSelectedRecommendation(rec); setScanCode(rec.qr_code); }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    index === 0 ? 'bg-primary-500/5 border-primary-500/30 shadow-lg shadow-primary-500/5' : 'bg-gray-900/30 border-gray-800 hover:border-gray-700'
                  }`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-white font-mono text-base">{rec.qr_code}</h3>
                        {index === 0 && <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded font-medium border border-green-500/20">FEFO</span>}
                      </div>
                      <p className="text-sm font-medium text-gray-300">{rec.name}</p>
                    </div>
                    <span className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded-md font-medium">{rec.weight_per_unit_grams}g</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-800">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Calendar size={14} className={isExpired ? 'text-red-500' : isWarning ? 'text-yellow-500' : ''} />
                      <span className={isExpired ? 'text-red-400 font-medium' : isWarning ? 'text-yellow-400 font-medium' : ''}>
                        {new Date(rec.expiration_date).toLocaleDateString()}
                        {isExpired && ' (Vencido)'}
                        {isWarning && ` (${rec.days_until_expiry} días)`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <LayoutGrid size={14} className="text-primary-400" />
                      <span className="truncate" title={rec.shelf_name}>{rec.shelf_name}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <div className="py-12 text-center flex flex-col items-center justify-center text-gray-500">
            <Box size={48} className="mb-4 opacity-20" />
            <p>Busca un producto para ver la recomendación FEFO.</p>
          </div>
        )}
      </div>
      {recommendations.length > 0 && (
        <button onClick={() => setCurrentStep(2)} className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-colors flex items-center justify-center gap-2">
          Continuar al Escaneo <ArrowRight size={18} />
        </button>
      )}
    </div>
  );

  // ── PASO 2: Validación QR ──
  const renderStep2 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-white mb-1">Validación QR</h2>
        <p className="text-sm text-gray-400">Escaneé o ingrese el código QR de la muestra física</p>
      </div>
      {selectedRecommendation && (
        <div className="bg-primary-500/5 border border-primary-500/20 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Producto seleccionado:</p>
          <p className="text-sm font-bold text-white">{selectedRecommendation.name}</p>
          <p className="text-xs text-primary-400 font-mono mt-1">QR esperado: {selectedRecommendation.qr_code}</p>
        </div>
      )}
      <div>
        <div className="flex justify-between items-end mb-2">
          <label className="block text-sm text-gray-400">Código QR</label>
          <button type="button" onClick={() => scannerActive ? stopScanner() : startScanner()}
            className="text-xs flex items-center gap-1 text-primary-400 hover:text-primary-300 font-medium">
            <Camera size={14} /> {scannerActive ? 'Cerrar Cámara' : 'Abrir Cámara'}
          </button>
        </div>
        {scannerActive && (
          <div className="mb-4 bg-black p-2 rounded-xl border border-gray-700 overflow-hidden">
            <div id="qr-reader-dispatch" className="w-full"></div>
          </div>
        )}
        {cameraError && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-300 mb-1">Error de cámara</p>
              <p className="text-xs text-red-400">{cameraError}</p>
            </div>
          </div>
        )}
        <input type="text" autoFocus placeholder="Ej: HS-LOT-1234-1" value={scanCode} onChange={e => setScanCode(e.target.value.toUpperCase())}
          className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-4 font-mono text-xl text-center text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors" />
      </div>
      <div className="flex gap-3">
        <button onClick={() => setCurrentStep(1)} className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
          <ArrowLeft size={18} /> Atrás
        </button>
        <button onClick={handleValidateQR} className="flex-1 py-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-colors flex items-center justify-center gap-2">
          Validar QR <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );

  // ── PASO 3: Confirmación ──
  const renderStep3 = () => {
    const rec = selectedRecommendation || recommendations.find(r => r.qr_code === scanCode);
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white mb-1">Confirmación del Despacho</h2>
          <p className="text-sm text-gray-400">Revise los datos antes de confirmar</p>
        </div>
        {rec && (
          <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-800">
              <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center"><QrCode size={20} className="text-primary-400" /></div>
              <div>
                <p className="text-xs text-gray-400">Código QR</p>
                <p className="font-mono text-white font-bold">{scanCode}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400">Producto</p>
                <p className="text-sm font-medium text-white">{rec.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Lote</p>
                <p className="text-sm font-mono text-white">{rec.lot}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Vencimiento</p>
                <p className={`text-sm font-medium ${rec.days_until_expiry < 0 ? 'text-red-400' : 'text-white'}`}>
                  {new Date(rec.expiration_date).toLocaleDateString()}
                  {rec.days_until_expiry < 0 && ' (Vencido)'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Ubicación</p>
                <p className="text-sm text-white">{rec.shelf_name || 'Sin asignar'}</p>
              </div>
            </div>
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={() => setCurrentStep(2)} className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
            <ArrowLeft size={18} /> Atrás
          </button>
          <button onClick={handleConfirmDispatch} disabled={loading} className="flex-1 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 transition-colors flex items-center justify-center gap-2">
            {loading ? 'Procesando...' : 'Confirmar Despacho'} <CheckCircle2 size={18} />
          </button>
        </div>
      </div>
    );
  };

  // ── Modificar CoA ──
  const handleCoAUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedRecommendation?.global_sample_id) return;
    
    try {
      setLoading(true);
      await samplesAPI.updateBulkSampleWithCoA(selectedRecommendation.global_sample_id, {}, file);
      alert('Certificado de Análisis (CoA) adjuntado exitosamente al lote.');
      
      // Actualizamos solo el path
      const resp = await samplesAPI.getBulkSample(selectedRecommendation.global_sample_id);
      setLabelData(prev => ({ ...prev, coa_file_path: resp.data.data.coa_file_path }));
    } catch (err) {
      alert('Error al subir el CoA: ' + err.message);
    } finally {
      setLoading(false);
      e.target.value = ''; // clean input
    }
  };

  // ── PASO 4: Documentación ──
  const renderStep4 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} className="text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-1">Despacho Exitoso</h2>
        <p className="text-sm text-gray-400">{dispatchMessage}</p>
      </div>
      
      {labelData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Panel Etiqueta */}
          <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 space-y-4">
            <h3 className="font-medium text-white flex items-center gap-2"><Printer size={18} className="text-primary-400" />Etiqueta (Editables)</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Producto</label>
                <div className="w-full bg-gray-800 rounded-lg p-2 text-sm text-gray-300 pointer-events-none">{labelData.product_name}</div>
              </div>
              <div>
                <label className="text-xs text-brand-red mb-1 block font-medium">Lote *</label>
                <input type="text" value={labelData.lot} onChange={e => setLabelData(d => ({ ...d, lot: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-sm text-white focus:border-brand-red focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-brand-red mb-1 block font-medium">F. Manufactura *</label>
                  <input type="date" value={labelData.manufacture_date} onChange={e => setLabelData(d => ({ ...d, manufacture_date: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-sm text-white focus:border-brand-red focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-brand-red mb-1 block font-medium">F. Vencimiento *</label>
                  <input type="date" value={labelData.expiration_date} onChange={e => setLabelData(d => ({ ...d, expiration_date: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-sm text-white focus:border-brand-red focus:outline-none" />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button onClick={() => setShowLabelPreview(true)} className="w-full py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                <Printer size={16} /> Ver e Imprimir Etiqueta (3x6)
              </button>
            </div>
          </div>

          {/* Panel CoA */}
          <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 space-y-4">
            <h3 className="font-medium text-white flex items-center gap-2"><FileText size={18} className="text-blue-400" />Certificado CoA</h3>
            <p className="text-sm text-gray-400">Adjunte o revise el certificado de análisis asociado al lote de la muestra despachada.</p>
            
            <div className="p-4 border border-dashed border-gray-600 rounded-xl text-center space-y-2">
              {labelData.coa_file_path ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle2 size={32} className="text-green-500" />
                  <p className="text-sm text-green-400 font-medium">CoA Adjunto Correctamente</p>
                  <a href={`${API_BASE}/${labelData.coa_file_path}`} target="_blank" rel="noreferrer"
                    className="mt-2 py-2 px-4 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700 flex items-center gap-2 transition-colors">
                    <Eye size={16}/> Visualizar Documento
                  </a>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-4">
                  <AlertTriangle size={32} className="text-amber-500" />
                  <p className="text-sm text-amber-500 font-medium">El lote no tiene un CoA asignado</p>
                </div>
              )}
            </div>

            <div className="pt-2">
              <label className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer">
                <Upload size={16} />
                {labelData.coa_file_path ? 'Actualizar / Reemplazar CoA' : 'Examinar / Subir CoA'}
                <input type="file" accept="application/pdf" className="hidden" disabled={loading} onChange={handleCoAUpload} />
              </label>
            </div>
          </div>
        </div>
      )}
      
      <div className="pt-4">
        <button onClick={resetAll} className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-colors">
          Nuevo Despacho
        </button>
      </div>
    </div>
  );


  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Despachos Inteligentes</h1>
        <p className="text-sm text-gray-400 mt-1">Algoritmo FEFO estricto con validación QR e impresión de etiquetas</p>
      </div>

      {/* Stepper */}
      {renderStepper()}

      {/* Contenido Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Central - Stepper */}
        <div className="lg:col-span-8 bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>

        {/* Columna Derecha - Historial */}
        <div className="lg:col-span-4 bg-gray-900/50 p-6 rounded-2xl border border-gray-800 flex flex-col max-h-[600px]">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-800">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><History size={20} /></div>
            <h2 className="text-sm font-medium text-white">Historial Reciente</h2>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {loadingHistory ? (
              <div className="py-10 text-center text-gray-500 text-sm">Cargando...</div>
            ) : history.length > 0 ? (
              history.map((record) => (
                <div key={record.id} className="p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-mono text-gray-500 bg-gray-900 px-1.5 py-0.5 rounded">{record.qr_code}</span>
                    <span className="text-[10px] text-gray-500">{new Date(record.dispatched_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-300 leading-tight mb-1">{record.product_name}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Por: <span className="text-gray-400">{record.dispatched_by}</span></span>
                    <span className="truncate max-w-[80px]" title={record.shelf_name}>{record.shelf_name}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-gray-500 text-sm">No hay despachos recientes</div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Validación FEFO */}
      <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} title="Validación FEFO Detectada"
        footer={
          <>
            <button onClick={() => setShowConfirmModal(false)} className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors">Cancelar</button>
            <button onClick={() => executeDispatchAPI(pendingScanCode, searchTerm)} className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium">Autorizar Excepción</button>
          </>
        }>
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400"><AlertTriangle className="w-6 h-6" /></div>
          <div>
            <h3 className="text-sm font-medium text-white mb-2">Regla de negocio comprometida</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Está a punto de despachar <strong className="text-red-400 font-mono">{pendingScanCode}</strong>.
              El sistema detecta unidades con fecha de caducidad más temprana. Se recomienda agotar primero las existencias antiguas.
            </p>
          </div>
        </div>
      </Modal>

      {showLabelPreview && (
        <DispatchLabelPrint 
          data={labelData} 
          onClose={() => setShowLabelPreview(false)} 
        />
      )}
    </div>
  );
};

export default DispatchPage;
