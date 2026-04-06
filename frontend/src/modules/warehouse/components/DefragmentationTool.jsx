import React, { useState } from 'react';
import { warehouseAPI } from '../../../services/api';
import {
  ArrowsRightLeftIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  PlayIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const DefragmentationTool = ({ shelfId, onMovementConfirmed, onFinished }) => {
  const [targetSize, setTargetSize] = useState('2x2x1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [plan, setPlan] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepLoading, setStepLoading] = useState(false);

  const handleCalculate = async () => {
    try {
      setLoading(true);
      setError(null);
      const [width, height, depth] = targetSize.split('x').map(Number);
      const response = await warehouseAPI.defragment(shelfId, { 
        target_width: width, 
        target_height: height,
        target_depth: depth || 1
      });
      
      setPlan(response.data.data);
      setCurrentStepIndex(0);
    } catch (err) {
      setError(err.message || 'Error al calcular desfragmentación');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmStep = async () => {
    if (!plan || !plan.moves[currentStepIndex]) return;
    
    const move = plan.moves[currentStepIndex];
    try {
      setStepLoading(true);
      await warehouseAPI.confirmDefragMove(shelfId, {
        sample_id: move.sampleId,
        from_x: move.details.from.x,
        from_y: move.details.from.y,
        from_z: move.details.from.z,
        to_x: move.details.to.x,
        to_y: move.details.to.y,
        to_z: move.details.to.z
      });

      // Notificar al padre para actualizar el mapa 3D
      if (onMovementConfirmed) onMovementConfirmed();

      if (currentStepIndex + 1 < plan.moves.length) {
        setCurrentStepIndex(currentStepIndex + 1);
      } else {
        // Plan completado
        setPlan(prev => ({ ...prev, finished: true }));
      }
    } catch (err) {
      setError(`Error al confirmar movimiento: ${err.message}`);
    } finally {
      setStepLoading(false);
    }
  };

  const reset = () => {
    setPlan(null);
    setError(null);
    setCurrentStepIndex(0);
  };

  return (
    <div className="card-glass border border-gray-700/50 rounded-2xl overflow-hidden animate-fade-in shadow-2xl">
      <div className="bg-surface-600/50 px-5 py-4 border-b border-gray-700/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-500/20 rounded-lg">
            <ArrowsRightLeftIcon className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h3 className="font-bold text-white leading-none">Desfragmentación</h3>
            <p className="text-xxs text-gray-400 mt-1 uppercase tracking-widest">Optimización de espacio</p>
          </div>
        </div>
        {plan && (
          <button onClick={reset} className="text-xs text-gray-400 hover:text-white transition-colors">
            Cancelar
          </button>
        )}
      </div>

      <div className="p-5">
        {!plan ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-300">
              ¿No hay espacio para una muestra grande? El sistema calculará los movimientos mínimos necesarios para crear un bloque contiguo.
            </p>
            
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-xxs font-bold text-gray-500 uppercase mb-2 ml-1">Espacio requerido</label>
                <select 
                  value={targetSize}
                  onChange={(e) => setTargetSize(e.target.value)}
                  className="w-full bg-surface-500 border border-gray-600 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 appearance-none cursor-pointer"
                >
                  <option value="1x1x1">1x1x1 (Pequeño)</option>
                  <option value="1x2x1">1x2x1 (Vertical)</option>
                  <option value="2x1x1">2x1x1 (Horizontal)</option>
                  <option value="2x2x1">2x2x1 (Grande)</option>
                  <option value="1x1x2">1x1x2 (Profundo)</option>
                  <option value="2x2x2">2x2x2 (Máximo)</option>
                </select>
              </div>
              <button
                onClick={handleCalculate}
                disabled={loading}
                className="mt-6 btn-primary py-2.5 px-6 flex items-center gap-2 shadow-glow-blue disabled:opacity-50"
              >
                {loading ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <PlayIcon className="w-5 h-5" />}
                Calcular
              </button>
            </div>
          </div>
        ) : plan.finished ? (
          <div className="text-center py-6 animate-scale-in">
            <div className="w-16 h-16 bg-success-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-10 h-10 text-success-400" />
            </div>
            <h4 className="text-lg font-bold text-white">Espacio Liberado</h4>
            <p className="text-sm text-gray-400 mt-2">
              Se ha creado con éxito el espacio de {targetSize} en:<br/>
              <span className="text-primary-400 font-mono">Columna {plan.freeBlock.x + 1}, Nivel {plan.freeBlock.y + 1}</span>
            </p>
            <button 
              onClick={() => { reset(); if (onFinished) onFinished(); }}
              className="mt-6 w-full btn-secondary py-2"
            >
              Cerrar Herramienta
            </button>
          </div>
        ) : plan.moves.length === 0 && plan.freeSpaceFound ? (
          <div className="text-center py-4">
            <InformationCircleIcon className="w-12 h-12 text-info-400 mx-auto mb-3" />
            <p className="text-sm text-gray-300">Ya existe un espacio de {targetSize} disponible en:</p>
            <p className="text-lg font-bold text-primary-400 mt-1">Columna {plan.freeBlock.x + 1}, Nivel {plan.freeBlock.y + 1}</p>
            <button onClick={reset} className="mt-5 w-full btn-secondary py-2">Entendido</button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase">Progreso del plan</span>
              <span className="text-xs text-primary-400 font-bold">{currentStepIndex + 1} de {plan.moves.length} movimientos</span>
            </div>
            <div className="w-full bg-surface-500 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-primary-500 h-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(14,165,233,0.5)]"
                style={{ width: `${((currentStepIndex) / plan.moves.length) * 100}%` }}
              />
            </div>

            <div className="bg-surface-500/50 border border-primary-500/20 rounded-xl p-4 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-full -mr-12 -mt-12 pointer-events-none"></div>
               
               <p className="text-xs font-bold text-primary-400 mb-2 uppercase flex items-center gap-2">
                 <PlayIcon className="w-3.5 h-3.5" />
                 Instrucción Actual
               </p>
               <p className="text-white font-medium text-sm leading-relaxed">
                 {plan.moves[currentStepIndex].instruction}
               </p>
               
               <div className="mt-4 pt-4 border-t border-gray-700/50 flex gap-4 text-xxs">
                 <div className="flex-1">
                   <p className="text-gray-500 uppercase mb-1">Muestra</p>
                   <p className="text-gray-300 font-bold truncate">{plan.moves[currentStepIndex].sampleName}</p>
                 </div>
                 <div className="px-3 border-l border-gray-700/50">
                   <p className="text-gray-500 uppercase mb-1">Tamaño</p>
                   <p className="text-gray-300 font-bold">{plan.moves[currentStepIndex].details.dimensions}</p>
                 </div>
               </div>
            </div>

            <button
              onClick={handleConfirmStep}
              disabled={stepLoading}
              className="w-full btn-primary py-3 font-bold text-sm shadow-glow-blue flex items-center justify-center gap-2"
            >
              {stepLoading ? (
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  Confirmar este movimiento
                </>
              )}
            </button>
            <p className="text-[10px] text-center text-gray-500 italic">
              * Mueva físicamente la muestra en el anaquel y luego presione confirmar.
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-danger-500/10 border border-danger-500/20 rounded-xl flex items-start gap-3 animate-shake">
            <ExclamationCircleIcon className="w-5 h-5 text-danger-400 shrink-0" />
            <p className="text-xs text-danger-400 font-medium">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DefragmentationTool;
