import React from 'react';

const LabelPattern = () => {
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="poly-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          {/* Geometría Delaunay estéticamente moderna y sutil para empaques químicos */}
          
          <path d="M0 40 L20 0 L60 0 L80 40 L60 80 L20 80 Z" stroke="#d1d5db" strokeWidth="0.4" fill="none" opacity="0.8" />
          <path d="M20 0 L40 40 L60 0 M20 80 L40 40 L60 80" stroke="#d1d5db" strokeWidth="0.3" fill="none" opacity="0.6" />
          <path d="M0 40 L40 40 L80 40" stroke="#d1d5db" strokeWidth="0.2" strokeDasharray="2 2" fill="none" opacity="0.5" />
          <path d="M40 0 L40 80" stroke="#d1d5db" strokeWidth="0.2" strokeDasharray="1 3" fill="none" opacity="0.5" />
          
          {/* Nodos de intersección para toque tecnológico */}
          <circle cx="40" cy="40" r="1.5" fill="#9ca3af" opacity="0.7" />
          <circle cx="20" cy="0" r="1" fill="#9ca3af" opacity="0.6" />
          <circle cx="60" cy="0" r="1" fill="#9ca3af" opacity="0.6" />
          <circle cx="20" cy="80" r="1" fill="#9ca3af" opacity="0.6" />
          <circle cx="60" cy="80" r="1" fill="#9ca3af" opacity="0.6" />
          <circle cx="0" cy="40" r="1" fill="#9ca3af" opacity="0.6" />
          <circle cx="80" cy="40" r="1" fill="#9ca3af" opacity="0.6" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#poly-pattern)" />
    </svg>
  );
};

export default LabelPattern;
