/**
 * GroupChip
 *
 * Mini badge flotante que aparece ENCIMA de cada cubo 3D cuando
 * pertenece a un grupo seleccionado.
 *
 * Props:
 *  - sample: { id, ghs_danger_class }
 *  - sgaColor: hex color
 */
import React from 'react';
import PropTypes from 'prop-types';
import { formatSampleId } from '../../utils/formatSampleId';
import { SURFACE, BLUR, RADIUS, PADDING, FONT } from '../../constants';

const GroupChip = ({ sample, sgaColor = '#38bdf8' }) => {
  if (!sample) return null;
  return (
    <div
      data-testid={`group-chip-${sample.id}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: PADDING.CHIP,
        background: SURFACE.BAR,
        backdropFilter: BLUR.MD,
        border: `1.5px solid ${sgaColor}`,
        borderRadius: RADIUS.LG - 2,
        fontFamily: 'monospace',
        fontSize: 10,
        fontWeight: FONT.ID_MONO.WEIGHT,
        color: '#f1f5f9',
        letterSpacing: FONT.ID_MONO.LETTER_SPACING,
        boxShadow: `0 2px 8px rgba(0,0,0,0.5), 0 0 8px ${sgaColor}40`,
        userSelect: 'none',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{
        width: 6, height: 6, borderRadius: 3, background: sgaColor,
        boxShadow: `0 0 4px ${sgaColor}`,
      }} />
      {formatSampleId(sample.id)}
    </div>
  );
};

GroupChip.propTypes = {
  sample: PropTypes.object,
  sgaColor: PropTypes.string,
};

export default GroupChip;
