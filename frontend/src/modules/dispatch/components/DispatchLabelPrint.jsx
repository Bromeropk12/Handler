import React, { useRef, useState, useEffect } from 'react';

// Medidas exactas de Hoja Carta (Letter) en formato Vertical
const SHEET_WIDTH_MM = 215.9;
const SHEET_HEIGHT_MM = 279.4;

const DispatchMiniLayout = ({ data }) => {
  return (
    <div
      style={{
        width: '30mm',
        height: '15mm',
        border: '0.2mm solid #111827',
        background: '#ffffff',
        fontFamily: '"Inter", -apple-system, sans-serif',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
        boxSizing: 'border-box',
        padding: '1mm 1.5mm',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '0.4mm',
        overflow: 'hidden'
      }}
    >
      <div style={{ fontSize: '7.5pt', color: '#000000', lineHeight: 1.1, fontWeight: 800 }}>
        L: {data.lot}
      </div>
      <div style={{ fontSize: '6pt', color: '#1f2937', lineHeight: 1.1, fontWeight: 600 }}>
        F.M: {data.manufacture_date || 'N/A'}
      </div>
      <div style={{ fontSize: '6pt', color: '#1f2937', lineHeight: 1.1, fontWeight: 600 }}>
        F.V: {data.expiration_date}
      </div>
      <div style={{ fontSize: '7pt', color: '#000000', lineHeight: 1.1, fontWeight: 800 }}>
        Peso: {data.weight_grams}g
      </div>
    </div>
  );
};

const DispatchLabelPrint = ({ labelData, onClose }) => {
  const printRef = useRef(null);

  // Cuadrícula recomendada para 30x15 en Hoja Carta
  // 7 columnas de 30mm = 210mm (cabe en 215.9)
  // 18 filas de 15mm = 270mm (cabe en 279.4)
  const [cols, setCols] = useState(7);
  const [rows, setRows] = useState(18);
  const slotsPerPage = cols * rows;

  const [scale, setScale] = useState(1);
  const [copiesToAdd, setCopiesToAdd] = useState(1);

  // array plano con todos los slots
  const [slotsArray, setSlotsArray] = useState(() => {
    const initialSlots = cols * rows;
    const arr = Array(initialSlots).fill(null);
    if (labelData) arr[0] = labelData;
    return arr;
  });

  useEffect(() => {
    setSlotsArray(prev => {
      let copy = [...prev];
      while (copy.length > 0 && copy[copy.length - 1] === null) copy.pop();
      const newTotal = Math.max(Math.ceil(copy.length / slotsPerPage) * slotsPerPage, slotsPerPage);
      while (copy.length < newTotal) copy.push(null);
      return copy;
    });
  }, [slotsPerPage]);

  const handleAddCopies = () => {
    setSlotsArray(prev => {
      const active = prev.filter(Boolean);
      for (let i = 0; i < copiesToAdd; i++) {
        active.push(labelData);
      }
      const newTotal = Math.max(Math.ceil(active.length / slotsPerPage) * slotsPerPage, slotsPerPage);
      while (active.length < newTotal) active.push(null);
      return active;
    });
  };

  const [draggedIdx, setDraggedIdx] = useState(null);

  const handleDragStart = (e, idx) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', idx);
    setTimeout(() => e.target.classList.add('opacity-50'), 0);
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('opacity-50');
    setDraggedIdx(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) return;
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
    setSlotsArray(prev => {
      const active = prev.filter(Boolean);
      const newTotal = Math.max(Math.ceil(active.length / slotsPerPage) * slotsPerPage, slotsPerPage);
      while (active.length < newTotal) active.push(null);
      return active;
    });
  };

  const slotWidth = SHEET_WIDTH_MM / cols;
  const slotHeight = SHEET_HEIGHT_MM / rows;

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
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <base href="${window.location.origin}">
        <title>Impresión Hoja Despacho</title>
        <style>
          @page { size: 215.9mm 279.4mm; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Arial', sans-serif; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .sheet-page { width: 215.9mm; height: 279.4mm; overflow: hidden; page-break-after: always; }
          .sheet-page:last-child { page-break-after: avoid; }
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

  if (!labelData) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex p-4 overflow-hidden gap-6 font-sans">
      <div className="w-80 bg-surface-800 border border-white/10 rounded-2xl flex flex-col shadow-2xl overflow-hidden shrink-0">
        <div className="p-4 border-b border-surface-700 bg-surface-900">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            🖨️ Lienzo (Despacho)
          </h2>
          <p className="text-gray-400 text-xs mt-1">Arrastra y suelta. Solo Lote, Fechas y Peso (30x15mm).</p>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-widest border-b border-surface-700 pb-2">Multiplicador</h3>
            <div className="flex gap-2">
              <input 
                type="number" min="1" max="100" 
                value={copiesToAdd} onChange={e => setCopiesToAdd(Number(e.target.value) || 1)}
                className="w-full bg-surface-900 border border-white/10 rounded-md p-2 text-white text-sm"
              />
              <button 
                onClick={handleAddCopies}
                className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-md font-bold text-sm transition-colors"
              >
                Añadir Copias
              </button>
            </div>
          </div>

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
              Espacio disponible por slot: {(slotWidth).toFixed(1)} mm x {(slotHeight).toFixed(1)} mm
            </div>
          </div>

          <div className="space-y-3">
             <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-widest border-b border-surface-700 pb-2">Escalador</h3>
             <input 
                type="range" min="0.1" max="2" step="0.05"
                value={scale} onChange={(e) => setScale(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
             />
             <div className="text-xs text-green-400/90 bg-green-500/10 p-2 rounded border border-green-500/20">
                Tamaño renderizado: {(30 * scale).toFixed(1)} mm × {(15 * scale).toFixed(1)} mm
             </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-surface-700">
            <button 
              onClick={handleCompact}
              className="w-full flex items-center justify-center gap-2 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 hover:text-purple-300 border border-purple-500/20 rounded-lg transition-colors text-sm"
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

      <div className="flex-1 overflow-auto bg-[#18181b] rounded-2xl relative custom-scrollbar flex justify-center py-10 px-4 border border-white/5 shadow-2xl">
        <div ref={printRef} className="space-y-8 flex flex-col items-center w-max no-print-bg">
          {pages.map((page) => (
            <div key={page.pageNumber} className="relative group">
              <div className="no-print absolute -left-16 top-0 text-gray-500 font-mono text-sm uppercase tracking-widest rotate-180" style={{ writingMode: 'vertical-rl' }}>
                 Página {page.pageNumber}
              </div>

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
                {page.items.map((item, relativeSlotIdx) => {
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
                        border: '1px dashed #e2e8f0',
                        boxSizing: 'border-box',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isHovered ? 'rgba(59,130,246,0.03)' : item ? 'white' : 'rgba(248,250,252,0.6)',
                        cursor: 'grab'
                      }}
                      className="slot-cell group/slot transition-colors"
                    >
                      {item && (
                        <button 
                          onClick={() => handleRemoveItem(globalIdx)}
                          className="absolute z-50 top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover/slot:opacity-100 transition-opacity shadow-lg no-print text-xs"
                          title="Quitar"
                        >
                          ✕
                        </button>
                      )}

                      {item ? (
                         <div style={{ position: 'absolute', transform: `scale(${scale})`, transformOrigin: 'center center' }}>
                            <DispatchMiniLayout data={item} />
                         </div>
                      ) : (
                         <div style={{ fontSize: '7pt', color: '#cbd5e1', fontWeight: 'bold' }} className="no-print pointer-events-none">VACÍO</div>
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

export default DispatchLabelPrint;