import React from 'react';
import { ArrowsRightLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';

const SampleMovementToolbar = ({ selectionCount, onMove, onClear }) => {
  if (selectionCount === 0) return null;

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-fade-in" style={{ animation: 'slideInUp 0.3s ease-out' }}>
      <div className="bg-surface-600/90 backdrop-blur-xl border border-primary-500/30 rounded-2xl p-3 shadow-[0_10px_40px_rgba(14,165,233,0.3)] flex items-center gap-6">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
            <span className="text-primary-400 font-black text-sm">{selectionCount}</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm">Muestras seleccionadas</p>
            <p className="text-gray-400 text-xs">Listas para ser reubicadas</p>
          </div>
        </div>
        
        <div className="w-px h-8 bg-gray-700"></div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={onClear}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            title="Deseleccionar todo"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={onMove}
            className="bg-primary-500 hover:bg-primary-600 text-white rounded-xl py-2 px-6 flex items-center gap-2 font-bold transition-all shadow-[0_0_15px_rgba(14,165,233,0.5)] hover:shadow-[0_0_25px_rgba(14,165,233,0.7)]"
          >
            <ArrowsRightLeftIcon className="w-5 h-5" />
            Reubicar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SampleMovementToolbar;
