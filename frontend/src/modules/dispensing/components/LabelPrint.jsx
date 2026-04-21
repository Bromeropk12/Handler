import React, { useRef, useState, useEffect } from 'react';
import DispensingLabelLayout from './label/DispensingLabelLayout';

// Medidas exactas de Hoja Carta (Letter) en formato Vertical
const SHEET_WIDTH_MM = 215.9;
const SHEET_HEIGHT_MM = 279.4;

const LabelPrint = ({ samples, bulkData, onClose }) => {
  const printRef = useRef(null);

  // Configuración de la cuadrícula
  const [cols, setCols] = useState(2); // Formato de 2x3 o 3x3
  const [rows, setRows] = useState(3);
  const slotsPerPage = cols * rows;

  const [scale, setScale] = useState(0.85);

  // array plano con todos los slots de todas las hojas.
  // Empaquetamos las muestras al inicio, rellenando el resto de la hoja con 'null'
  const [slotsArray, setSlotsArray] = useState(() => {
    const initialSlots = cols * rows; // Por defecto: 6
    const total = Math.max(Math.ceil(samples.length / initialSlots) * initialSlots, initialSlots);
    const arr = Array(total).fill(null);
    samples.forEach((s, idx) => { arr[idx] = s; });
    return arr;
  });

  // Re-ajuste de la longitud del array si cambian columnas o filas
  useEffect(() => {
    setSlotsArray(prev => {
      let copy = [...prev];
      // Limpiamos los nulos finales
      while (copy.length > 0 && copy[copy.length - 1] === null) copy.pop();
      // Repademos al nuevo slotsPerPage
      const newTotal = Math.max(Math.ceil(copy.length / slotsPerPage) * slotsPerPage, slotsPerPage);
      while (copy.length < newTotal) copy.push(null);
      return copy;
    });
  }, [slotsPerPage]);

  // Eventos Drag and Drop
  const [draggedIdx, setDraggedIdx] = useState(null);

  const handleDragStart = (e, idx) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', idx);
    // Para suavizar la interfaz visual
    setTimeout(() => e.target.classList.add('opacity-50'), 0);
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('opacity-50');
    setDraggedIdx(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necesario para permitir el Drop
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    
    // Action: Swap de posiciones
    setSlotsArray(prev => {
      const newSlots = [...prev];
      const temp = newSlots[draggedIdx];
      newSlots[draggedIdx] = newSlots[targetIdx];
      newSlots[targetIdx] = temp;
      return newSlots;
    });
  };

  const handleRemoveItem = (idx) => {
    setSlotsArray(prev => {
      const copy = [...prev];
      copy[idx] = null;
      return copy;
    });
  };

  const handeAddEmptyPage = () => {
    setSlotsArray(prev => [...prev, ...Array(slotsPerPage).fill(null)]);
  };

  const handleCompact = () => {
    // Al comprimir, empujamos todo hacia arriba, borramos los huecos y el sistema purgará las hojas de sobra
    setSlotsArray(prev => {
      const active = prev.filter(Boolean);
      // Rellenamos hasta conformar al menos 1 página
      const newTotal = Math.max(Math.ceil(active.length / slotsPerPage) * slotsPerPage, slotsPerPage);
      while(active.length < newTotal) active.push(null);
      return active;
    });
  };

  // Cálculos visuales
  const slotWidth = SHEET_WIDTH_MM / cols;
  const slotHeight = SHEET_HEIGHT_MM / rows;

  // Agrupar visualmente en "Páginas" físicas
  const pages = [];
  for (let i = 0; i < slotsArray.length; i += slotsPerPage) {
    pages.push({
      pageNumber: pages.length + 1,
      items: slotsArray.slice(i, i + slotsPerPage),
      startIndex: i
    });
  }

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.width = '0'; iframe.height = '0'; iframe.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    // Bloque 100% borderless para que empalme perfecto en la impresora
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <base href="${window.location.origin}">
        <title>Impresión Hoja Pegatinas - Handler</title>
        <style>
          @page { size: 215.9mm 279.4mm; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Arial', sans-serif; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          img { image-rendering: -webkit-optimize-contrast; image-rendering: high-quality; }
          .sheet-page { width: 215.9mm; height: 279.4mm; overflow: hidden; page-break-after: always; }
          .sheet-page:last-child { page-break-after: avoid; }
          
          /* Esconder elementos de la interfaz interactiva durante la impresión física del documento */
          @media print {
            .no-print { display: none !important; }
            .slot-cell { border: none !important; background: transparent !important; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
      }, 60000);
    }, 800);
  };

  const totalActivas = slotsArray.filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex p-4 overflow-hidden gap-6 font-sans">
      
      {/* PANEL IZQUIERDO: Controles (Menú Lateral) */}
      <div className="w-80 bg-surface-800 border border-white/10 rounded-2xl flex flex-col shadow-2xl overflow-hidden shrink-0">
        <div className="p-4 border-b border-surface-700 bg-surface-900">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            🖨️ Lienzo Interactivo
          </h2>
          <p className="text-gray-400 text-xs mt-1">Arrastra y suelta (Drag & Drop) las etiquetas entre los espacios</p>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-widest border-b border-surface-700 pb-2">Matriz de Hoja</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Columnas</label>
                <input 
                  type="text" inputMode="numeric" 
                  value={cols} onChange={(e) => setCols(Number(e.target.value.replace(/\D/g, '')) || 1)}
                  className="w-full bg-surface-900 border border-white/10 rounded-md p-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Filas</label>
                <input 
                  type="text" inputMode="numeric" 
                  value={rows} onChange={(e) => setRows(Number(e.target.value.replace(/\D/g, '')) || 1)}
                  className="w-full bg-surface-900 border border-white/10 rounded-md p-2 text-white text-sm"
                />
              </div>
            </div>
            <div className="text-xs text-blue-400/80 bg-blue-500/10 p-2 rounded border border-blue-500/20">
              📐 Celda física: {(slotWidth/10).toFixed(2)} cm x {(slotHeight/10).toFixed(2)} cm
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-widest border-b border-surface-700 pb-2">Escalador</h3>
            <div>
              <div className="flex justify-between items-center mb-1">
                 <label className="text-xs text-gray-400 block">Tamaño Relativo</label>
                 <span className="text-xs bg-surface-900 px-2 py-0.5 rounded text-white">{Math.round(scale * 100)}%</span>
              </div>
              <input 
                type="range" min="0.1" max="1.5" step="0.01"
                value={scale} onChange={(e) => setScale(Number(e.target.value))}
                className="w-full accent-blue-500 hover:accent-blue-400 transition-all cursor-pointer"
              />
              <div className="mt-2 text-xs text-green-400/90 bg-green-500/10 p-2 rounded border border-green-500/20">
                📏 Tamaño real impreso: <strong>{((108 * scale) / 10).toFixed(2)} cm × {((46 * scale) / 10).toFixed(2)} cm</strong>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-surface-700">
            <button 
              onClick={handleCompact}
              className="w-full flex items-center justify-center gap-2 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 hover:text-purple-300 border border-purple-500/20 rounded-lg transition-colors text-sm"
              title="Organiza todas las etiquetas seguidas desde el primer bloque"
            >
              🔄 Compactar Etiquetas
            </button>
            <button 
              onClick={handeAddEmptyPage}
              className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-gray-600 hover:border-gray-400 text-gray-400 hover:text-white rounded-lg transition-colors text-sm"
            >
              + Añadir Página en Blanco
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-surface-700 bg-surface-900 grid grid-cols-2 gap-2">
          <button 
            onClick={onClose}
            className="w-full py-2.5 bg-surface-700 hover:bg-surface-600 text-white font-medium rounded-lg transition-colors text-sm"
          >
            Volver
          </button>
          <button 
            onClick={handlePrint}
            disabled={totalActivas === 0}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            Imprimir ({totalActivas})
          </button>
        </div>
      </div>

      {/* PANEL DERECHO: Previsualización Real (Lienzo Interactivo con Separación de Páginas) */}
      <div className="flex-1 overflow-auto bg-[#18181b] rounded-2xl relative custom-scrollbar flex justify-center py-10 px-4 border border-white/5 shadow-2xl">
        <div ref={printRef} className="space-y-8 flex flex-col items-center w-max no-print-bg">
          {pages.map((page) => (
            <div key={page.pageNumber} className="relative group">
              {/* Etiqueta Flotante Fuera del Lienzo de Impresión indicando el número de página */}
              <div className="no-print absolute -left-16 top-0 text-gray-500 font-mono text-sm uppercase tracking-widest rotate-180" style={{ writingMode: 'vertical-rl' }}>
                 Página {page.pageNumber}
              </div>

              {/* El contenedor .sheet-page es la hoja de papel físico Carta Blanca */}
              <div 
                className="sheet-page bg-white shadow-xl ring-1 ring-black/5"
                style={{
                  width: `${SHEET_WIDTH_MM}mm`,
                  height: `${SHEET_HEIGHT_MM}mm`,
                  display: 'grid',
                  gridTemplateColumns: `repeat(${cols}, ${slotWidth}mm)`,
                  gridTemplateRows: `repeat(${rows}, ${slotHeight}mm)`,
                  overflow: 'hidden'
                }}
              >
                {page.items.map((sample, relativeSlotIdx) => {
                  const globalIdx = page.startIndex + relativeSlotIdx;
                  const isHovered = draggedIdx !== null && draggedIdx !== globalIdx;
                  
                  return (
                    <div 
                      key={globalIdx}
                      draggable
                      onDragStart={(e) => handleDragStart(e, globalIdx)}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, globalIdx)}
                      style={{
                        width: `${slotWidth}mm`,
                        height: `${slotHeight}mm`,
                        border: '1px dashed #e2e8f0', // Líneas guía visuales (se esconden al imprimir)
                        boxSizing: 'border-box',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isHovered ? 'rgba(59,130,246,0.03)' : sample ? 'white' : 'rgba(248,250,252,0.6)',
                        cursor: 'grab'
                      }}
                      className="slot-cell group/slot transition-colors"
                    >
                      {/* Botón Borrar (Hover sobre el Slot) - No se inyecta en el objeto impreso porque solo reacciona con CSS in-app */}
                      {sample && (
                        <button 
                          onClick={() => handleRemoveItem(globalIdx)}
                          className="absolute z-50 top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover/slot:opacity-100 transition-opacity shadow-lg no-print"
                          title="Quitar"
                        >
                          ✕
                        </button>
                      )}

                      {sample ? (
                         <div style={{ width: '108mm', height: '46mm', position: 'absolute', transform: `scale(${scale})`, transformOrigin: 'center center' }}>
                           <div style={{ pointerEvents: 'none', height: '100%', width: '100%', overflow: 'hidden' }}>
                              <DispensingLabelLayout sample={sample} bulkData={bulkData} />
                           </div>
                         </div>
                      ) : (
                         <div style={{ fontSize: '9pt', color: '#cbd5e1', fontWeight: 'bold' }} className="no-print pointer-events-none">VACÍO</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LabelPrint;
