import React from 'react';
import { ArrowRightIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const MovementModeOverlay = ({ assignedCount, totalCount, onCancel, onConfirm, onChangeShelf, activeShelfName, nextUnassignedSampleId, assignments }) => {
  const isComplete = assignedCount === totalCount;
  
  // Find name of next sample to assign
  let currentSampleName = '';
  if (!isComplete && nextUnassignedSampleId) {
    const nextAssignment = assignments.find(a => a.sampleData.id === nextUnassignedSampleId);
    if (nextAssignment) {
      currentSampleName = nextAssignment.sampleData.name || nextAssignment.sampleData.global_sample_name;
    }
  }

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 pointer-events-none">
      <div className="bg-surface-600/90 backdrop-blur-xl border border-primary-500/50 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_20px_rgba(14,165,233,0.2)] pointer-events-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Progress ring */}
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" className="stroke-gray-700" strokeWidth="3" />
                <circle 
                  cx="18" cy="18" r="16" fill="none" 
                  className={isComplete ? "stroke-success-500" : "stroke-primary-500"} 
                  strokeWidth="3" strokeDasharray="100" 
                  strokeDashoffset={100 - (assignedCount / totalCount) * 100} 
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-white">
                <span className="text-sm font-black leading-none">{assignedCount}</span>
                <span className="text-[8px] text-gray-400 font-bold leading-none mt-0.5">/{totalCount}</span>
              </div>
            </div>
            
            {/* Instruction text */}
            <div>
              {isComplete ? (
                <>
                  <p className="text-success-400 font-bold text-sm uppercase tracking-wide">Asignación Completa</p>
                  <p className="text-white text-base">Revisa y confirma los movimientos</p>
                </>
              ) : (
                <>
                  <p className="text-primary-400 font-bold text-xs uppercase tracking-wider mb-1">
                    Anaquel actual: <span className="text-white">{activeShelfName}</span>
                  </p>
                  <p className="text-white text-sm">
                    Selecciona un espacio libre para <span className="font-black text-primary-300 px-1 py-0.5 bg-primary-500/20 rounded">{currentSampleName}</span>
                  </p>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!isComplete && (
              <button 
                onClick={onChangeShelf}
                className="text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl transition-all border border-white/10"
              >
                Cambiar Anaquel
              </button>
            )}
            
            <button 
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              title="Cancelar Movimiento"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
            
            <button 
              onClick={onConfirm}
              disabled={!isComplete}
              className={`py-2 px-6 rounded-xl flex items-center gap-2 font-bold transition-all ${
                isComplete 
                  ? 'bg-success-500 hover:bg-success-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isComplete ? <CheckIcon className="w-5 h-5" /> : <ArrowRightIcon className="w-5 h-5" />}
              {isComplete ? 'Confirmar' : 'Siguiente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovementModeOverlay;
