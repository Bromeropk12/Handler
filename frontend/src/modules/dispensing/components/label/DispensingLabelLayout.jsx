import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import LabelPattern from './LabelPattern';
import PictogramDiamond from './PictogramDiamond';

const PRECAUTION_PHRASES = {
  'Explosivo': 'Peligro de explosión en masa. Evitar someter a choque, fricción o fuego.',
  'Inflamable': 'Líquido y vapores inflamables. Mantener alejado del calor, chispas y llamas al descubierto. No fumar.',
  'Comburente': 'Puede provocar o agravar un incendio; comburente. Mantener alejado de materiales combustibles.',
  'Gas Bajo Presión': 'Contiene gas a presión; peligro de explosión en caso de calentamiento. Proteger de la luz solar.',
  'Corrosivo': 'Provoca quemaduras graves en la piel y lesiones oculares graves. Usar guantes y equipo de protección.',
  'Toxicidad Aguda': 'Mortal en caso de ingestión, contacto con la piel o inhalación. No respirar polvos/humos/gases/nieblas/vapores.',
  'Irritante': 'Provoca irritación cutánea y ocular grave. Lavarse cuidadosamente después de la manipulación.',
  'Toxicidad Crónica': 'Provoca daños en los órganos tras exposiciones prolongadas o repetidas. Pedir instrucciones especiales antes del uso.',
  'Tóxico para Medio Ambiente': 'Muy tóxico para los organismos acuáticos, con efectos nocivos duraderos. Evitar su liberación al medio ambiente.'
};

const DispensingLabelLayout = ({ sample, bulkData }) => {
  const isPeligro = bulkData.signal_word === 'PELIGRO';
  // Sin Peligro: ghs_danger_class='Sin Riesgo', signal_word='ATENCION', sin pictogramas
  const isInerte = bulkData.ghs_danger_class === 'Sin Riesgo'
    && bulkData.signal_word === 'ATENCION'
    && (!bulkData.ghs_pictograms || bulkData.ghs_pictograms.length === 0);
  const pictograms = bulkData.ghs_pictograms || [];

  const precautionList = (bulkData.precaution_phrases && bulkData.precaution_phrases.length > 0)
    ? bulkData.precaution_phrases.map(ph => ph.text).slice(0, 4)
    : pictograms.map(p => PRECAUTION_PHRASES[p]).filter(Boolean).slice(0, 4);

  const numPrecautions = precautionList.length === 0 ? 2 : precautionList.length;
  // Ajuste inteligente y extremo del espacio para advertencias extremadamente largas (hasta 4 items)
  let pFontSize = '4.5pt';
  let pLineHeight = 1.25;
  let pMargin = '0.5mm';

  if (numPrecautions === 4) {
    pFontSize = '3.4pt';
    pLineHeight = 1.05;
    pMargin = '0.2mm';
  } else if (numPrecautions === 3) {
    pFontSize = '3.8pt';
    pLineHeight = 1.1;
    pMargin = '0.3mm';
  } else if (numPrecautions === 2) {
    pFontSize = '4.2pt';
    pLineHeight = 1.2;
    pMargin = '0.5mm';
  }

  const supplierLogoUrl = bulkData.supplier_logo_path
    ? `/${bulkData.supplier_logo_path}`
    : null;

  return (
    <div
      className="dispensing-label-grid"
      style={{
        width: '108mm',
        height: '46mm',
        display: 'grid',
        gridTemplateColumns: '36mm 36mm 36mm',
        gridTemplateRows: '10.5mm 10.5mm 10.5mm 10.5mm 4mm',
        border: '0.4mm solid #111827',
        background: '#ffffff',
        fontFamily: '"Inter", -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
        position: 'relative',
        boxSizing: 'border-box'
      }}
    >
      {/* ---------------- IZQUIERDA ---------------- */}
      {/* Logo Handler */}
      <div style={{
        gridColumn: 1, gridRow: '1 / span 2',
        borderRight: '0.3mm solid #e5e7eb',
        borderBottom: '0.5mm solid #111827',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.5mm 2.5mm', boxSizing: 'border-box',
        backgroundColor: '#ffffff'
      }}>
        <img
          src="/recursos/Logo-Handler.png"
          alt="HÄNDLER"
          style={{
            width: '100%', height: '100%',
            maxHeight: '15mm',
            objectFit: 'contain',
            filter: 'contrast(1.05)',
            transform: 'scale(1.05)'
          }}
        />
      </div>

      {/* Precauciones */}
      <div style={{
        gridColumn: 1, gridRow: '3 / span 2',
        borderRight: '0.3mm solid #e5e7eb',
        position: 'relative', boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column',
        padding: '1mm 1.5mm', // Padding hiper-reducido para maximizar espacio
        overflow: 'hidden'
      }}>
        <LabelPattern />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '0.5mm' }}>
          <div style={{
            fontSize: '10pt', fontWeight: 900, lineHeight: 1,
            marginBottom: '0.5mm', textAlign: 'center',
            color: isPeligro ? '#dc2626' : (isInerte ? '#1a1a1a' : '#ea580c'),
            letterSpacing: '-0.3pt', textTransform: 'uppercase'
          }}>
            {isInerte ? 'NO PELIGROSO' : (bulkData.signal_word || (isPeligro ? 'PELIGRO' : 'ATENCIÓN'))}
          </div>
          <ul style={{
            fontSize: pFontSize, lineHeight: pLineHeight, color: '#1f2937',
            listStyle: 'none', paddingLeft: 0, margin: 0, fontWeight: 500,
            display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1
          }}>
            {precautionList.map((phrase, i) => (
              <li key={i} style={{ paddingLeft: '2mm', textIndent: '-2mm', marginBottom: pMargin }}>
                <span style={{ color: isPeligro ? '#dc2626' : (isInerte ? '#1a1a1a' : '#ea580c'), fontWeight: 'bold' }}>•</span> {phrase}
              </li>
            ))}
            {precautionList.length === 0 && (
              <>
                <li style={{ paddingLeft: '2mm', textIndent: '-2mm', marginBottom: pMargin }}>
                  <span style={{ color: '#6b7280', fontWeight: 'bold' }}>•</span> Usar equipo de protección personal.
                </li>
                <li style={{ paddingLeft: '2mm', textIndent: '-2mm', marginBottom: pMargin }}>
                  <span style={{ color: '#6b7280', fontWeight: 'bold' }}>•</span> Lavar a fondo tras su manipulación.
                </li>
              </>
            )}
          </ul>
        </div>
      </div>

      {/* ---------------- CENTRO ---------------- */}
      <div style={{
        gridColumn: 2, gridRow: 1,
        borderRight: '0.3mm solid #e5e7eb',
        backgroundColor: '#ffffff'
      }}></div>

      {/* Franja de Color - Nombre de Producto */}
      <div style={{
        gridColumn: 2, gridRow: 2,
        backgroundColor: isPeligro ? '#dc2626' : (isInerte ? '#49d840' : '#eab308'),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0.5mm', boxSizing: 'border-box',
        borderRight: '0.3mm solid #e5e7eb',
        borderTop: '0.5mm solid #111827',
        borderBottom: '0.5mm solid #111827',
        boxShadow: 'inset 0 0 0 0.5mm rgba(255,255,255,0.15)' /* Reflex premium */
      }}>
        <span style={{
          fontSize: '7.5pt', fontWeight: 900,
          textTransform: 'uppercase', lineHeight: 1.1,
          letterSpacing: '0.5pt', textAlign: 'center',
          color: isPeligro ? '#ffffff' : '#111827',
          textShadow: isPeligro ? '0.2px 0.2px 0px rgba(0,0,0,0.2)' : 'none'
        }}>
          {bulkData.name}
        </span>
      </div>

      {/* Pictogramas GHS */}
      <div style={{
        gridColumn: 2, gridRow: '3 / span 2',
        borderRight: '0.3mm solid #e5e7eb',
        backgroundColor: '#ffffff',
        position: 'relative'
      }}>
        <PictogramDiamond pictograms={pictograms} />
      </div>


      {/* ---------------- DERECHA ---------------- */}
      {/* Área Código QR + Patrón */}
      <div style={{
        gridColumn: 3, gridRow: '1 / span 3',
        position: 'relative', boxSizing: 'border-box',
        borderBottom: '0.3mm solid #e5e7eb',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <LabelPattern />
        <div style={{
          position: 'relative', zIndex: 1,
          height: '100%', width: '100%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center'
        }}>
          {/* El Lote se ha omitido para dejar la zona del QR exclusivamente para el código de despacho */}
          <div style={{
            border: '0.4mm solid #111827',
            backgroundColor: 'white',
            padding: '1mm',
            boxShadow: '0.5mm 0.5mm 0 rgba(0,0,0,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <QRCodeSVG value={sample.qr_code} size={54} level="M" includeMargin={false} />
          </div>
          <div style={{
            fontSize: '4.5pt', color: '#111827',
            textAlign: 'center', marginTop: '1mm',
            fontFamily: '"SF Mono", "Roboto Mono", monospace', wordBreak: 'break-all',
            maxWidth: '32mm', lineHeight: 1.2, fontWeight: 'bold',
            backgroundColor: 'rgba(255,255,255,0.9)', padding: '0.5mm 1mm',
            border: '0.2mm solid #e5e7eb'
          }}>
            {sample.qr_code}
          </div>
        </div>
      </div>

      {/* Logo Proveedor */}
      <div style={{
        gridColumn: 3, gridRow: 4,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1mm 2mm', boxSizing: 'border-box',
        backgroundColor: '#ffffff'
      }}>
        {supplierLogoUrl ? (
          <img
            src={supplierLogoUrl}
            alt={bulkData.supplier_name}
            style={{
              width: '100%', height: '100%',
              maxHeight: '8mm', maxWidth: '32mm',
              objectFit: 'contain',
              filter: 'contrast(1.05)'
            }}
          />
        ) : bulkData.supplier_name ? (
          <div style={{
            fontSize: '6.5pt', fontWeight: 900, color: '#111827',
            textTransform: 'uppercase', letterSpacing: '0.5pt',
            textAlign: 'center', padding: '0 2mm'
          }}>
            {bulkData.supplier_name}
          </div>
        ) : null}
      </div>

      {/* ---------------- PIE DE PÁGINA ---------------- */}
      <div style={{
        gridColumn: '1 / span 3', gridRow: 5,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '4.5pt', color: '#ffffff', fontWeight: 700, letterSpacing: '0.2pt',
        backgroundColor: '#111827', boxSizing: 'border-box',
        textTransform: 'uppercase'
      }}>
        Handler Colombia · Carrera 97 No. 24 C - 23, Bodega 3
      </div>

    </div>
  );
};

export default DispensingLabelLayout;
