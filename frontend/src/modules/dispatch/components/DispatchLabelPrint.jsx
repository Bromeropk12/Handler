import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const DispatchLabelPrint = ({ data, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex bg-black/80 justify-center overflow-y-auto pt-10 pb-10">
      <div className="bg-white p-6 rounded-xl max-w-2xl w-full flex flex-col items-center gap-6 relative" style={{ minHeight: 'fit-content' }}>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-500 font-bold text-xl"
        >
          &times;
        </button>

        <h2 className="text-xl font-bold text-gray-800">Vista Previa - Etiqueta de Despacho (60mm x 30mm)</h2>
        <p className="text-sm text-gray-500 italic mb-4 text-center">
          Configure su impresora de etiquetas para un tamaño de papel de 60mm de ancho × 30mm de alto.<br/>
          Sin márgenes y escala al 100%.
        </p>
        
        {/* The visual preview of the label */}
        <div style={{ width: '60mm', height: '30mm' }} className="border border-dashed border-gray-400 bg-white shadow-sm flex items-center justify-center p-[2mm] text-black print-area">
          <div style={{ width: '56mm', height: '26mm' }} className="flex border border-black relative">
            
            {/* IZQUIERDA: Logo Handler y QR */}
            <div style={{ width: '18mm' }} className="flex flex-col items-center justify-between border-r border-black p-[2mm] pb-[1mm]">
              <div className="w-full flex items-center justify-center">
                <img src="/recursos/handler_logo.png" alt="Handler" className="max-w-full" style={{ filter: 'grayscale(100%)', maxHeight: '5mm' }} />
              </div>
              <div style={{ width: '13mm', height: '13mm' }} className="mt-[1mm]">
                <QRCodeSVG value={data.qr_code || ''} size={50} level="M" />
              </div>
            </div>

            {/* DERECHA: Info del Despacho */}
            <div style={{ width: '38mm' }} className="flex flex-col p-[1mm] justify-between relative bg-white">
              <div>
                <p style={{ fontSize: '7px', fontWeight: 'bold', lineHeight: '8px', textTransform: 'uppercase' }} className="text-center mb-[1mm]">
                  {data.product_name}
                </p>
                <div style={{ fontSize: '5px', lineHeight: '6.5px' }}>
                  <p><strong>LOTE:</strong> {data.lot}</p>
                  <p><strong>MFG:</strong> {data.manufacture_date ? new Date(data.manufacture_date).toLocaleDateString('es-CO') : 'N/A'}</p>
                  <p><strong>EXP:</strong> {data.expiration_date ? new Date(data.expiration_date).toLocaleDateString('es-CO') : 'N/A'}</p>
                </div>
              </div>
              <div style={{ fontSize: '4.5px', lineHeight: '5px', textAlign: 'center', borderTop: '0.5px solid black', paddingTop: '0.5mm' }}>
                Handler Colombia S.A.S.
              </div>
            </div>

          </div>
        </div>

        <div className="flex gap-4 mt-8 print:hidden">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
          >
            Cerrar
          </button>
          <button 
            onClick={handlePrint}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold flex items-center gap-2 shadow-lg"
          >
            Imprimir Etiqueta
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
            margin: 0;
            padding: 0;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 60mm;
            height: 30mm;
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 2mm !important;
          }
          @page {
            size: 60mm 30mm landscape;
            margin: 0;
          }
        }
      `}} />
    </div>
  );
};

export default DispatchLabelPrint;
