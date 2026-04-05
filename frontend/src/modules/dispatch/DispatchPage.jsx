import React, { useState, useEffect, useRef } from 'react';
import { Search, Box, AlertTriangle, FileText, CheckCircle2, QrCode, Camera, History, Calendar, LayoutGrid } from 'lucide-react';
import { dispatchAPI } from '../../services/api';
import { Html5Qrcode } from 'html5-qrcode';
import Modal from '../../components/Modal';

const DispatchPage = () => {
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

  // Ref para la instancia de Html5Qrcode (patrón correcto según doc oficial 2026)
  const html5QrCodeRef = useRef(null);

  // Cargar historial al inicio
  useEffect(() => {
    fetchHistory();
  }, []);

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
    e.preventDefault();
    if (!searchTerm) return;
    
    setLoading(true);
    try {
      const resp = await dispatchAPI.getFefoRecommendation({ product_name: searchTerm });
      setRecommendations(resp.data.data.recommendations || []);
    } catch (err) {
      alert('Error buscando recomendaciones: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── FUNCIONES DE CÁMARA (patrón useRef + async/await según doc oficial 2026) ──

  const startScanner = () => {
    setCameraError(null);
    setScannerActive(true); // Mostrar el contenedor Inmediatamente

    // Esperamos 100ms para asegurar que React haya renderizado el <div id="qr-reader">
    // y el navegador aplique los estilos (width/height), ya que Html5Qrcode falla si es 0x0 o hidden.
    setTimeout(async () => {
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };

      try {
        if (!html5QrCodeRef.current) {
          html5QrCodeRef.current = new Html5Qrcode('qr-reader');
        }

        // Llamamos start directamente — dispara el prompt de medias de Electron
        await html5QrCodeRef.current.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            console.log('[Handler QR] ✅ Código detectado:', decodedText);
            setScanCode(decodedText);
            stopScanner();
          },
          () => { /* ignorar errores per-frame */ }
        );
      } catch (err) {
        console.error('[Handler QR] ❌ Error:', err);
        let msg = 'No se pudo acceder a la cámara.';

        if (err && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
          msg = '🔒 Permiso denegado. Ve a Configuración de Windows → Privacidad y seguridad → Cámara.';
        } else if (err && (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError')) {
          msg = '📷 No se encontró ninguna cámara conectada en este equipo.';
        } else if (err && err.name === 'NotReadableError') {
          msg = '⚠️ La cámara está ocupada en otra app. Ciérrala e intenta de nuevo.';
        } else if (err && err.name === 'OverconstrainedError') {
          // Si facingMode='environment' falla (desktop PC), intentamos con 'user'
          try {
            await html5QrCodeRef.current.start(
              { facingMode: 'user' },
              config,
              (decodedText) => { setScanCode(decodedText); stopScanner(); },
              () => {}
            );
            return; // éxito
          } catch (err2) {
            msg = 'Atención: No se pudo enlazar cámara frontal ni trasera. (' + (err2?.message || String(err2)) + ')';
          }
        } else {
          msg = `Error: ${err?.message || err?.name || String(err)}`;
        }

        setCameraError(msg);
        setScannerActive(false);
      }
    }, 100);
  };

  const stopScanner = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop()
        .then(() => {
          html5QrCodeRef.current = null;
          setScannerActive(false);
        })
        .catch(() => {
          html5QrCodeRef.current = null;
          setScannerActive(false);
        });
    } else {
      setScannerActive(false);
    }
  };

  // Limpiar la cámara al desmontar el componente
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
        html5QrCodeRef.current = null;
      }
    };
  }, []);

  const handleDispatch = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!scanCode || recommendations.length === 0) {
      alert("Por favor busque el producto primero para tenerlo referenciado a nivel FEFO.");
      return; 
    }
    
    if (recommendations.length > 0) {
      const bestChoice = recommendations[0].qr_code;
      if (scanCode !== bestChoice) {
        setPendingScanCode(scanCode);
        setShowConfirmModal(true);
        return;
      }
    }

    await executeDispatchAPI(scanCode, searchTerm);
  };

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
        coa_file_path: resp.data.data.coa_file_path
      });
      setScanCode('');
      setShowConfirmModal(false);
      
      // Actualizar recomendaciones y historial
      handleSearch({ preventDefault: () => {} });
      fetchHistory();
      
    } catch (err) {
      setDispatchStatus('error');
      setDispatchMessage(err.message || 'Error al despachar la muestra');
      setShowConfirmModal(false);
    } finally {
      setLoading(false);
    }
  };

  const printLabel = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Etiqueta de Despacho</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            .label-box { border: 2px solid #000; padding: 20px; width: 400px; margin: 0 auto; text-align: center; }
            h2 { margin: 0 0 10px 0; color: #E30613; }
            h1 { margin: 0 0 20px 0; font-size: 24px; }
            .details { text-align: left; margin-bottom: 20px; font-size: 18px; }
            .details div { margin-bottom: 8px; }
          </style>
        </head>
        <body>
          <div class="label-box">
             <h2>Handler S.A.S</h2>
             <h1>${labelData.product_name}</h1>
             <div class="details">
               <div><strong>Lote:</strong> ${labelData.lot}</div>
               <div><strong>Vencimiento:</strong> ${labelData.expiration_date}</div>
             </div>
             <div><em>Control de Calidad</em></div>
          </div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
  };

  const downloadCoA = () => {
    if (labelData.coa_file_path) {
      const link = document.createElement('a');
      link.href = `http://localhost:3001/${labelData.coa_file_path}`;
      link.target = '_blank';
      link.download = `CoA_${labelData.lot}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert("No hay certificado CoA adjunto para esta muestra.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-sga text-white">Despachos Inteligentes</h1>
        <p className="text-sm text-gray-400 mt-1">Algoritmo FEFO estricto para salida de mercancía, con impresión de etiquetas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Columna Izquierda: Búsqueda y Recomendaciones FEFO */}
        <div className="lg:col-span-5 bg-surface-800 p-6 rounded-2xl border border-white/5 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="p-2 bg-brand-gold/10 rounded-lg text-brand-gold">
              <Search size={24} />
            </div>
            <h2 className="text-lg font-medium text-white">1. Asistente FEFO</h2>
          </div>

          <form onSubmit={handleSearch} className="flex gap-3">
            <input 
              type="text" 
              placeholder="Nombre del producto..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 bg-surface-900 border border-white/10 rounded-lg p-3 text-white focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
            />
            <button type="submit" disabled={loading} className="px-6 bg-brand-gold hover:bg-yellow-600 text-black font-medium rounded-lg">
              Buscar
            </button>
          </form>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {recommendations.length > 0 ? (
              <>
                <p className="text-sm text-gray-400">Unidades ordenadas por vencimiento (FEFO):</p>
                {recommendations.map((rec, index) => {
                  const isExpired = rec.days_until_expiry < 0;
                  const isWarning = rec.days_until_expiry >= 0 && rec.days_until_expiry <= 30;
                  
                  return (
                  <div key={rec.child_id} className={`p-4 rounded-xl border transition-all ${
                    index === 0 
                      ? 'bg-surface-900 border-brand-red/40 shadow-lg shadow-brand-red/5' 
                      : 'bg-surface-900/50 border-white/5'
                  }`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-white font-mono text-base">{rec.qr_code}</h3>
                          {index === 0 && <span className="bg-brand-red/20 text-brand-red text-xs px-2 py-0.5 rounded font-medium border border-brand-red/20">Sugerido</span>}
                        </div>
                        <p className="text-sm font-medium text-gray-300">{rec.name}</p>
                      </div>
                      <div className="text-right">
                        <span className="bg-surface-800 text-gray-300 text-xs px-2 py-1 rounded-md font-medium border border-white/10">
                          {rec.weight_per_unit_grams}g
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/5">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Calendar size={14} className={isExpired ? 'text-red-500' : isWarning ? 'text-yellow-500' : ''}/>
                        <span className={isExpired ? 'text-red-400 font-medium' : isWarning ? 'text-yellow-400 font-medium' : ''}>
                          {new Date(rec.expiration_date).toLocaleDateString()}
                          {isExpired && ' (Vencido)'}
                          {isWarning && ` (${rec.days_until_expiry} días)`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <LayoutGrid size={14} className="text-brand-gold"/>
                        <span className="truncate" title={rec.shelf_name}>{rec.shelf_name}</span>
                      </div>
                    </div>
                  </div>
                )})}
              </>
            ) : (
              <div className="py-12 text-center flex flex-col items-center justify-center text-gray-500">
                <Box size={48} className="mb-4 opacity-20" />
                <p>Busca un producto para ver la recomendación FEFO.</p>
              </div>
            )}
          </div>
        </div>

        {/* Columna Central: Lectura y Emisión */}
        <div className="lg:col-span-4 bg-surface-800 p-6 rounded-2xl border border-white/5 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="p-2 bg-brand-red/10 rounded-lg text-brand-red">
              <QrCode size={24} />
            </div>
            <h2 className="text-lg font-medium text-white">2. Salida</h2>
          </div>

          <form onSubmit={handleDispatch} className="space-y-4">
            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="block text-sm text-gray-400">Código de Unidad (QR)</label>
                <button 
                  type="button" 
                  onClick={() => scannerActive ? stopScanner() : startScanner()}
                  className="text-xs flex items-center gap-1 text-brand-gold hover:text-yellow-400 font-medium"
                >
                  <Camera size={14} />
                  {scannerActive ? 'Cerrar Cámara' : 'Abrir Cámara'}
                </button>
              </div>

              <div className={`mb-4 bg-black p-2 rounded-lg border border-white/10 overflow-hidden shadow-inner ${scannerActive ? 'block' : 'hidden'}`}>
                <div id="qr-reader" className="w-full text-white"></div>
              </div>

              {/* Error de cámara: mensaje claro al operario */}
              {cameraError && (
                <div className="mb-4 p-4 bg-red-900/30 border border-red-500/40 rounded-lg flex items-start gap-3 animate-slide-up">
                  <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-300 mb-1">Error de cámara</p>
                    <p className="text-xs text-red-400 leading-relaxed">{cameraError}</p>
                    <p className="text-xs text-gray-500 mt-2">💡 Alternativa: escribe o pega el código QR manualmente en el campo inferior.</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Ej: SMPL-XYZ-123" 
                  value={scanCode}
                  onChange={e => setScanCode(e.target.value.toUpperCase())}
                  className="w-full bg-surface-900 border border-white/10 rounded-lg p-4 font-mono text-xl text-center text-white focus:border-brand-red"
                />
                <button type="submit" disabled={loading} className="w-full py-4 bg-brand-red hover:bg-red-700 text-white font-bold rounded-lg shadow-lg shadow-brand-red/20 transition-colors">
                  CONFIRMAR DESPACHO
                </button>
              </div>
            </div>
          </form>

          {dispatchStatus && (
            <div className={`p-4 rounded-lg flex items-start gap-3 animate-slide-up ${dispatchStatus === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
              {dispatchStatus === 'success' ? <CheckCircle2 size={20} className="shrink-0 mt-0.5" /> : <AlertTriangle size={20} className="shrink-0 mt-0.5" />}
              <span className="text-sm font-medium leading-relaxed">{dispatchMessage}</span>
            </div>
          )}

          {labelData && dispatchStatus === 'success' && (
            <div className="mt-8 border border-white/10 rounded-xl overflow-hidden animate-fade-in animate-slide-up">
              <div className="bg-surface-900 p-4 border-b border-white/10">
                <h3 className="font-medium text-white flex items-center gap-2">
                  <FileText size={18} className="text-brand-gold" />
                  Etiqueta y Documentación
                </h3>
              </div>
              <div className="p-4 space-y-4 bg-surface-800">
                 <div>
                   <label className="text-xs text-gray-400">Producto</label>
                   <input type="text" readOnly value={labelData.product_name} className="w-full bg-surface-900 border border-white/5 rounded p-2 text-white font-medium focus:outline-none" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-xs text-gray-400">Lote</label>
                     <input type="text" readOnly value={labelData.lot} className="w-full bg-surface-900 border border-white/5 rounded p-2 text-white focus:outline-none" />
                   </div>
                   <div>
                     <label className="text-xs text-gray-400">Vencimiento</label>
                     <input type="date" readOnly value={labelData.expiration_date} className="w-full bg-surface-900 border border-white/5 rounded p-2 text-gray-400 focus:outline-none" />
                   </div>
                 </div>
                 <div className="pt-4 flex flex-col gap-3">
                    <button onClick={printLabel} className="w-full py-2.5 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center justify-center gap-2">
                      <QrCode size={16} /> Imprimir Etiqueta
                    </button>
                    {labelData.coa_file_path && (
                      <button onClick={downloadCoA} className="w-full py-2.5 bg-surface-900 border border-white/10 text-white font-medium rounded-lg hover:border-white/20 transition-colors text-sm">
                        Descargar Certificado (CoA)
                      </button>
                    )}
                 </div>
              </div>
            </div>
          )}

        </div>

        {/* Columna Derecha: Historial Reciente */}
        <div className="lg:col-span-3 bg-surface-800 p-6 rounded-2xl border border-white/5 space-y-6 flex flex-col max-h-[85vh]">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <History size={24} />
            </div>
            <h2 className="text-lg font-medium text-white">Historial</h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {loadingHistory ? (
              <div className="py-10 text-center text-gray-500 text-sm">Cargando...</div>
            ) : history.length > 0 ? (
              history.map((record) => (
                <div key={record.id} className="p-3 bg-surface-900/50 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-mono text-gray-500 bg-surface-900 px-1.5 py-0.5 rounded">
                      {record.qr_code}
                    </span>
                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                      {new Date(record.dispatched_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-300 leading-tight mb-1">{record.product_name}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                     <span>Por: <span className="text-gray-400">{record.dispatched_by}</span></span>
                     <span className="truncate max-w-[80px]" title={record.shelf_name}>{record.shelf_name}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-gray-500 text-sm">
                No hay despachos recientes
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Validación FEFO */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Validación FEFO Detectada"
        footer={
          <>
            <button
              onClick={() => setShowConfirmModal(false)}
              className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
              Cancelar Despacho
            </button>
            <button
              onClick={() => executeDispatchAPI(pendingScanCode, searchTerm)}
              className="px-4 py-2 text-sm bg-brand-red text-white rounded-lg hover:bg-red-700 font-medium"
            >
              Autorizar Excepción
            </button>
          </>
        }
      >
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-brand-red/10 flex items-center justify-center text-brand-red">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white mb-2">
              Regla de negocio comprometida
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Está a punto de despachar el frasco <strong className="text-brand-red font-mono bg-brand-red/10 px-1 py-0.5 rounded">{pendingScanCode}</strong>.
            </p>
            <p className="text-sm text-gray-400 leading-relaxed mt-2">
              El sistema detecta que hay unidades de este producto con una fecha de caducidad más temprana en bodega (ver listado de recomendaciones). 
              Se recomienda agotar primero las existencias antiguas.
            </p>
            <p className="text-sm text-gray-300 font-medium mt-4">
              ¿Está seguro que cuenta con autorización para saltar el modelo FEFO (First Expired, First Out)?
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DispatchPage;
