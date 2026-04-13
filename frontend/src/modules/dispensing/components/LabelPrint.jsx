import React, { useRef } from 'react';
import DispensingLabelLayout from './label/DispensingLabelLayout';

/**
 * LabelPrint — Gestor de Imprersión y Modal Previo para etiquetas de 46mm × 108mm
 */
const LabelPrint = ({ samples, bulkData, onClose }) => {
  const printRef = useRef(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    // Crear un iframe invisible para aislar la vista de impresión sin usar popups bloqueados por Electron
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <base href="${window.location.origin}">
        <title>Impresión Etiquetas Handler</title>
        <style>
          @page {
            size: 108mm 46mm;
            margin: 0;
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Arial', 'Helvetica', sans-serif; }
          img { image-rendering: -webkit-optimize-contrast; image-rendering: high-quality; }
          .dispensing-label-grid {
             page-break-after: always;
          }
          .dispensing-label-grid:last-child { 
             page-break-after: avoid; 
          }
          @media print {
            body { 
               -webkit-print-color-adjust: exact; 
               print-color-adjust: exact; 
            }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    doc.close();

    // Dar tiempo a cargar imágenes y ejecutar impresión segura desde el iframe
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      
      // Limpiar iframe después de 1 minuto para evitar consumo de memoria
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 60000);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
      {/* Barra de Controles */}
      <div className="no-print bg-surface-800 border border-white/10 rounded-xl p-4 mb-4 flex items-center gap-4 w-full max-w-3xl">
        <h3 className="text-white font-bold flex-1">
          🖨️ Vista previa de impresión — {samples.length} unidades
        </h3>
        <button 
          onClick={handlePrint}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors shadow-lg"
        >
          Imprimir Etiquetas
        </button>
        <button 
          onClick={onClose}
          className="px-4 py-2 bg-surface-900 hover:bg-surface-700 text-gray-300 border border-white/10 rounded-lg transition-colors"
        >
          Cerrar
        </button>
      </div>

      {/* Contenedor de visualización */}
      <div className="overflow-y-auto max-h-[80vh] w-full max-w-3xl space-y-4 pb-4 custom-scrollbar flex flex-col items-center">
        <div ref={printRef} className="shadow-2xl">
          {samples.map((sample) => (
            <DispensingLabelLayout 
              key={sample.qr_code} 
              sample={sample} 
              bulkData={bulkData} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LabelPrint;
