import React from 'react';

// Mapeo seguro de nombres GHS a archivos
export const PICTO_FILES = {
  'Explosivo':                  'explos.webp',
  'Inflamable':                 'flamme.webp',
  'Comburente':                 'rondflam.webp',
  'Gas Bajo Presión':           'bottle.webp',
  'Corrosivo':                  'acid_red.webp',
  'Toxicidad Aguda':            'skull.webp',
  'Irritante':                  'exclam.webp',
  'Toxicidad Crónica':          'silhouete.webp',
  'Tóxico para Medio Ambiente': 'Aquatic-pollut-red.png'
};

const PictogramDiamond = ({ pictograms }) => {
  if (!pictograms || pictograms.length === 0) return null;

  const activePictos = pictograms.slice(0, 4);

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', zIndex: 2
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: activePictos.length > 1 ? '1fr 1fr' : '1fr',
        gridTemplateRows: activePictos.length > 1 ? '1fr 1fr' : '1fr',
        gap: '0.6mm',
        transform: 'rotate(45deg)',
        justifyContent: 'center', alignContent: 'center',
      }}>
        {activePictos.map((picto, idx) => {
          const file = PICTO_FILES[picto];
          if (!file) return null;
          
          let gridColumn = 'auto';
          let gridRow = 'auto';

          // Layout en línea horizontal para 2 pictogramas
          if (activePictos.length === 2) {
            if (idx === 0) { gridColumn = 2; gridRow = 1; }
            if (idx === 1) { gridColumn = 1; gridRow = 2; }
          }

          return (
            <div key={picto} style={{
              gridColumn, gridRow,
              width: '7mm', height: '7mm',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '0.4mm solid #d32f2f',
              backgroundColor: 'white',
              boxSizing: 'border-box'
            }}>
              <img 
                src={`/recursos/pictogramas/${file}`}
                alt={picto}
                style={{
                  width: '5.2mm', height: '5.2mm',
                  transform: 'rotate(-45deg)',
                  objectFit: 'contain',
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PictogramDiamond;
