import React from 'react';

// Mapeo de nombres a archivos de ícono
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

/**
 * DiamondIcon: cuadrado con borde rojo girado 45° (rombo SGA).
 * El ícono se contra-rota -45° para mostrarse recto dentro del rombo.
 */
const DiamondIcon = ({ picto, boxMm, iconMm }) => {
  const file = PICTO_FILES[picto];
  if (!file) return null;
  return (
    <div style={{
      width:           `${boxMm}mm`,
      height:          `${boxMm}mm`,
      border:          '0.5mm solid #cc0000',
      backgroundColor: '#ffffff',
      transform:       'rotate(45deg)',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      boxSizing:       'border-box',
      flexShrink:      0,
    }}>
      <img
        src={`/recursos/pictogramas/${file}`}
        alt={picto}
        style={{
          width:     `${iconMm}mm`,
          height:    `${iconMm}mm`,
          transform: 'rotate(-45deg)',
          objectFit: 'contain',
          display:   'block',
        }}
      />
    </div>
  );
};

/**
 * DiamondCell: wrapper cuyo tamaño es el bounding-box VISUAL del rombo (= lado × √2).
 * Con gap=0 en el grid, las celdas se tocan exactamente en las esquinas N/S/E/W
 * de cada rombo, recreando el patrón de celosía del SGA oficial.
 *
 * Si `empty=true` actúa como espaciador invisible (para el patrón de 3 pictos).
 */
const DiamondCell = ({ picto, boxMm, iconMm, empty = false }) => {
  const wrapMm = (boxMm * Math.SQRT2).toFixed(2);
  return (
    <div style={{
      width:          `${wrapMm}mm`,
      height:         `${wrapMm}mm`,
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      flexShrink:     0,
    }}>
      {!empty && <DiamondIcon picto={picto} boxMm={boxMm} iconMm={iconMm} />}
    </div>
  );
};

/**
 * Área disponible: 36mm × 21mm  →  útil tras padding: ~34mm × 19mm
 *
 *  1 picto  → rombo único centrado            (box=11mm, wrap=15.6mm)
 *  2 pictos → fila de 2 rombos tocándose      (box=9.5mm, wrap=13.4mm → 26.8mm ancho)
 *  3 pictos → cuadrícula 2×2, esquina sup-izq VACÍA:
 *               [ ]  [◆]
 *               [◆]  [◆]
 *             (box=6.5mm, wrap=9.2mm → 18.4mm × 18.4mm)
 *  4 pictos → cuadrícula 2×2 completa:
 *               [◆]  [◆]
 *               [◆]  [◆]
 *             (box=6.5mm, wrap=9.2mm → 18.4mm × 18.4mm)
 */
const PictogramDiamond = ({ pictograms }) => {
  if (!pictograms || pictograms.length === 0) return null;

  const activePictos = pictograms.slice(0, 4);
  const count = activePictos.length;

  const outer = {
    width:          '100%',
    height:         '100%',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    overflow:       'hidden',
    padding:        '1mm',
    boxSizing:      'border-box',
  };

  /* ── 1 pictograma ─────────────────────────────────────────── */
  if (count === 1) {
    return (
      <div style={outer}>
        <DiamondCell picto={activePictos[0]} boxMm={11} iconMm={8} />
      </div>
    );
  }

  /* ── 2 pictogramas: fila horizontal, rombos tocándose ─────── */
  if (count === 2) {
    const boxMm = 9.5, iconMm = 6.5;
    return (
      <div style={outer}>
        <div style={{ display: 'flex', gap: 0 }}>
          <DiamondCell picto={activePictos[0]} boxMm={boxMm} iconMm={iconMm} />
          <DiamondCell picto={activePictos[1]} boxMm={boxMm} iconMm={iconMm} />
        </div>
      </div>
    );
  }

  /* ── 3 pictogramas: disposición en rombo (esquina inferior vacía) ─── */
  //      [Top]
  // [Left]   [Right]
  // Symmetrical layout forming the outline of a large diamond.
  if (count === 3) {
    const boxMm = 7.0, iconMm = 4.8;
    const wrap = boxMm * Math.SQRT2;
    const wNum = parseFloat(wrap.toFixed(2));
    const totalWidth = wNum * 2;
    const totalHeight = wNum * 1.5;

    return (
      <div style={outer}>
        <div style={{
          position: 'relative',
          width: `${totalWidth}mm`,
          height: `${totalHeight}mm`,
        }}>
          {/* Top */}
          <div style={{
            position: 'absolute',
            left: `${wNum / 2}mm`,
            top: 0,
            width: `${wNum}mm`,
            height: `${wNum}mm`,
          }}>
            <DiamondCell picto={activePictos[0]} boxMm={boxMm} iconMm={iconMm} />
          </div>

          {/* Left */}
          <div style={{
            position: 'absolute',
            left: 0,
            top: `${wNum / 2}mm`,
            width: `${wNum}mm`,
            height: `${wNum}mm`,
          }}>
            <DiamondCell picto={activePictos[1]} boxMm={boxMm} iconMm={iconMm} />
          </div>

          {/* Right */}
          <div style={{
            position: 'absolute',
            left: `${wNum}mm`,
            top: `${wNum / 2}mm`,
            width: `${wNum}mm`,
            height: `${wNum}mm`,
          }}>
            <DiamondCell picto={activePictos[2]} boxMm={boxMm} iconMm={iconMm} />
          </div>
        </div>
      </div>
    );
  }

  /* ── 4 pictogramas: disposición en rombo completa ───────────────── */
  //      [Top]
  // [Left]   [Right]
  //    [Bottom]
  // Full large diamond layout.
  if (count === 4) {
    const boxMm = 7.0, iconMm = 4.8;
    const wrap = boxMm * Math.SQRT2;
    const wNum = parseFloat(wrap.toFixed(2));
    const totalSize = wNum * 2;

    return (
      <div style={outer}>
        <div style={{
          position: 'relative',
          width: `${totalSize}mm`,
          height: `${totalSize}mm`,
        }}>
          {/* Top */}
          <div style={{
            position: 'absolute',
            left: `${wNum / 2}mm`,
            top: 0,
            width: `${wNum}mm`,
            height: `${wNum}mm`,
          }}>
            <DiamondCell picto={activePictos[0]} boxMm={boxMm} iconMm={iconMm} />
          </div>

          {/* Left */}
          <div style={{
            position: 'absolute',
            left: 0,
            top: `${wNum / 2}mm`,
            width: `${wNum}mm`,
            height: `${wNum}mm`,
          }}>
            <DiamondCell picto={activePictos[1]} boxMm={boxMm} iconMm={iconMm} />
          </div>

          {/* Right */}
          <div style={{
            position: 'absolute',
            left: `${wNum}mm`,
            top: `${wNum / 2}mm`,
            width: `${wNum}mm`,
            height: `${wNum}mm`,
          }}>
            <DiamondCell picto={activePictos[2]} boxMm={boxMm} iconMm={iconMm} />
          </div>

          {/* Bottom */}
          <div style={{
            position: 'absolute',
            left: `${wNum / 2}mm`,
            top: `${wNum}mm`,
            width: `${wNum}mm`,
            height: `${wNum}mm`,
          }}>
            <DiamondCell picto={activePictos[3]} boxMm={boxMm} iconMm={iconMm} />
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PictogramDiamond;
