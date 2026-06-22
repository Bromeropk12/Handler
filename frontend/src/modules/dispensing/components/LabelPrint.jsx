import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Search, Plus, X, ChevronDown, ChevronUp, Check } from 'lucide-react';
import DispensingLabelLayout from './label/DispensingLabelLayout';
import { dispensingAPI } from '../../../services/api';

const SHEET_WIDTH_MM = 215.9;
const SHEET_HEIGHT_MM = 279.4;

const LabelPrint = ({ labels, onClose }) => {
  const printRef = useRef(null);

  const [cols, setCols] = useState(2);
  const [rows, setRows] = useState(6);
  const slotsPerPage = cols * rows;

  const [scale, setScale] = useState(0.85);

  const [slotsArray, setSlotsArray] = useState(() => {
    const initialSlots = cols * rows;
    const total = Math.max(Math.ceil(labels.length / initialSlots) * initialSlots, initialSlots);
    const arr = Array(total).fill(null);
    labels.forEach((l, idx) => { arr[idx] = l; });
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
        <title>Impresión Hoja Pegatinas - Handler</title>
        <style>
          @page { size: 215.9mm 279.4mm; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Arial', sans-serif; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          img { image-rendering: -webkit-optimize-contrast; image-rendering: high-quality; }
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

  // ── Modal de búsqueda de etiquetas adicionales ──
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [selectedUnits, setSelectedUnits] = useState({});

  const searchProducts = useCallback(async (query) => {
    if (!query || query.trim().length < 1) {
      setSearchResults([]);
      return;
    }
    try {
      setSearchLoading(true);
      const resp = await dispensingAPI.searchLabelsForPrint(query);
      setSearchResults(resp.data?.products || []);
    } catch (err) {
      console.error('Error searching labels:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchProducts(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchProducts]);

  const toggleUnit = (productId, unit) => {
    setSelectedUnits(prev => {
      const key = `${productId}_${unit.id}`;
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = unit;
      }
      return next;
    });
  };

  const toggleProduct = (product) => {
    setSelectedUnits(prev => {
      const next = { ...prev };
      const allSelected = product.units.every(u => next[`${product.global_sample_id}_${u.id}`]);
      product.units.forEach(u => {
        const key = `${product.global_sample_id}_${u.id}`;
        if (allSelected) {
          delete next[key];
        } else {
          next[key] = u;
        }
      });
      return next;
    });
  };

  const addSelectedLabels = () => {
    const bulkDataMap = {};
    searchResults.forEach(p => {
      p.units.forEach(u => {
        bulkDataMap[`${p.global_sample_id}_${u.id}`] = {
          name: p.name,
          lot: p.lot,
          expiration_date: p.expiration_date,
          ghs_danger_class: p.ghs_danger_class,
          ghs_pictograms: p.ghs_pictograms,
          signal_word: p.signal_word,
          supplier_name: p.supplier_name,
          supplier_logo_path: p.supplier_logo_path,
          weight_per_unit: u.weight_grams || 0,
          precaution_phrases: p.precaution_phrases || [],
        };
      });
    });

    const newLabels = Object.values(selectedUnits).map(u => {
      const key = `${searchResults.find(p => p.units.some(uu => uu.id === u.id))?.global_sample_id}_${u.id}`;
      return {
        qr_code: u.qr_code,
        weight_grams: u.weight_grams,
        bulkData: bulkDataMap[key]
      };
    });

    setSlotsArray(prev => {
      let copy = [...prev];
      while (copy.length > 0 && copy[copy.length - 1] === null) copy.pop();
      copy.push(...newLabels);
      const newTotal = Math.max(Math.ceil(copy.length / slotsPerPage) * slotsPerPage, slotsPerPage);
      while (copy.length < newTotal) copy.push(null);
      return copy;
    });

    setSelectedUnits({});
    setSearchQuery('');
    setSearchResults([]);
    setShowAddModal(false);
  };

  const selectedCount = Object.keys(selectedUnits).length;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex p-4 overflow-hidden gap-6 font-sans">

      {/* PANEL IZQUIERDO: Controles */}
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
              📐 Celda física: {(slotWidth / 10).toFixed(2)} cm x {(slotHeight / 10).toFixed(2)} cm
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
              onClick={() => setShowAddModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-500 text-white hover:text-green-50 border border-green-500/30 rounded-lg transition-colors text-sm font-semibold"
            >
              <Plus size={16} /> Agregar Etiqueta de otro Producto
            </button>
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

      {/* PANEL DERECHO: Previsualización */}
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
                {page.items.map((label, relativeSlotIdx) => {
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
                        backgroundColor: isHovered ? 'rgba(59,130,246,0.03)' : label ? 'white' : 'rgba(248,250,252,0.6)',
                        cursor: 'grab'
                      }}
                      className="slot-cell group/slot transition-colors"
                    >
                      {label && (
                        <button
                          onClick={() => handleRemoveItem(globalIdx)}
                          className="absolute z-50 top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover/slot:opacity-100 transition-opacity shadow-lg no-print"
                          title="Quitar"
                        >
                          ✕
                        </button>
                      )}

                      {label ? (
                        <div style={{ width: '108mm', height: '46mm', position: 'absolute', transform: `scale(${scale})`, transformOrigin: 'center center' }}>
                          <div style={{ pointerEvents: 'none', height: '100%', width: '100%', overflow: 'hidden' }}>
                            <DispensingLabelLayout sample={label} bulkData={label.bulkData} />
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

      {/* MODAL: Agregar Etiquetas de Otro Producto */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-surface-800 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-surface-700 flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-lg">Agregar Etiquetas</h3>
                <p className="text-gray-400 text-xs mt-1">Busca un producto dispensado y selecciona las unidades específicas</p>
              </div>
              <button
                onClick={() => { setShowAddModal(false); setSearchQuery(''); setSearchResults([]); setSelectedUnits({}); }}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-surface-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 border-b border-surface-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar por nombre del producto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 bg-surface-900 border border-white/10 rounded-xl text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {searchLoading && (
                <div className="py-8 text-center text-gray-500 text-sm">Buscando productos...</div>
              )}
              {!searchLoading && searchQuery && searchResults.length === 0 && (
                <div className="py-8 text-center text-gray-500 text-sm">No se encontraron productos dispensados con ese nombre</div>
              )}
              {!searchLoading && !searchQuery && (
                <div className="py-8 text-center text-gray-500 text-sm">Escribe al menos 1 letra para buscar</div>
              )}
              {searchResults.map(product => {
                const isExpanded = expandedProduct === product.global_sample_id;
                const allSelected = product.units.every(u => selectedUnits[`${product.global_sample_id}_${u.id}`]);
                const someSelected = product.units.some(u => selectedUnits[`${product.global_sample_id}_${u.id}`]);
                const selectedInProduct = product.units.filter(u => selectedUnits[`${product.global_sample_id}_${u.id}`]).length;

                return (
                  <div key={product.global_sample_id} className="bg-surface-900 border border-white/10 rounded-xl overflow-hidden">
                    <div
                      className="p-3 flex items-center gap-3 cursor-pointer hover:bg-surface-800 transition-colors"
                      onClick={() => setExpandedProduct(isExpanded ? null : product.global_sample_id)}
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleProduct(product); }}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          allSelected ? 'bg-green-500 border-green-500' : someSelected ? 'bg-green-500/30 border-green-500' : 'border-gray-500'
                        }`}
                      >
                        {allSelected && <Check size={12} className="text-white" />}
                        {!allSelected && someSelected && <div className="w-2 h-2 bg-green-400 rounded-sm" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{product.name}</p>
                        <p className="text-gray-500 text-xs">Lote: {product.lot} · {product.units.length} unidades · {selectedInProduct > 0 ? `${selectedInProduct} seleccionadas` : ''}</p>
                      </div>

                      {isExpanded ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
                    </div>

                    {isExpanded && (
                      <div className="border-t border-white/5 p-2 grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto">
                        {product.units.map(unit => {
                          const isSelected = !!selectedUnits[`${product.global_sample_id}_${unit.id}`];
                          return (
                            <button
                              key={unit.id}
                              onClick={() => toggleUnit(product.global_sample_id, unit)}
                              className={`p-2 rounded-lg text-left text-xs transition-all border ${
                                isSelected
                                  ? 'bg-green-500/15 border-green-500 text-green-300'
                                  : 'bg-surface-800 border-white/5 text-gray-400 hover:border-white/20 hover:text-white'
                              }`}
                            >
                              <div className="font-mono font-bold text-[11px] truncate">{unit.qr_code}</div>
                              <div className="text-[10px] opacity-70 mt-0.5">{unit.weight_grams ? `${unit.weight_grams}g` : '—'}</div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-surface-700 flex items-center justify-between">
              <p className="text-sm text-gray-400">
                {selectedCount > 0 ? `${selectedCount} unidad(es) seleccionada(s)` : 'Selecciona unidades para agregar'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowAddModal(false); setSearchQuery(''); setSearchResults([]); setSelectedUnits({}); }}
                  className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={addSelectedLabels}
                  disabled={selectedCount === 0}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-lg transition-colors flex items-center gap-2"
                >
                  <Plus size={14} />
                  Agregar ({selectedCount})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabelPrint;
