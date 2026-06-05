import React from 'react';
import Modal from '../../../../components/Modal';
import { ArrowRightIcon, CheckCircleIcon, ExclamationCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const MovementConfirmModal = ({ isOpen, onClose, onConfirm, assignments, isExecuting, errors }) => {
  const validAssignments = assignments.filter(a => a.targetShelfId !== null && a.x !== null);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={isExecuting ? () => {} : onClose} 
      title="Confirmar Movimientos" 
      maxWidth="max-w-4xl"
      footer={
        <>
          <button 
            onClick={onClose} 
            disabled={isExecuting}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            {errors.length > 0 ? 'Cerrar' : 'Cancelar'}
          </button>
          {errors.length === 0 && (
            <button 
              onClick={onConfirm} 
              disabled={isExecuting || validAssignments.length === 0}
              className="bg-primary-500 hover:bg-primary-600 text-white rounded-xl py-2 px-6 flex items-center gap-2 font-bold transition-all shadow-glow-blue disabled:opacity-50"
            >
              {isExecuting ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <CheckCircleIcon className="w-5 h-5" />}
              {isExecuting ? 'Ejecutando...' : 'Confirmar y Mover'}
            </button>
          )}
        </>
      }
    >
      <div className="p-2 space-y-4">
        {errors.length > 0 && (
          <div className="bg-danger-500/10 border border-danger-500/30 rounded-xl p-4">
            <h4 className="text-danger-400 font-bold flex items-center gap-2 mb-2">
              <ExclamationCircleIcon className="w-5 h-5" />
              Errores de ejecución
            </h4>
            <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
              {errors.map((err, idx) => (
                <li key={idx}><span className="font-bold">{err.sampleName}:</span> {err.error}</li>
              ))}
            </ul>
          </div>
        )}

        {errors.length === 0 && (
          <>
            <p className="text-sm text-gray-300">
              Se realizarán los siguientes {validAssignments.length} movimientos. Por favor verifique la información.
            </p>

            <div className="bg-surface-600 rounded-xl overflow-hidden border border-gray-700">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-3">Muestra</th>
                    <th className="px-4 py-3">Origen</th>
                    <th className="px-4 py-3 text-center"></th>
                    <th className="px-4 py-3">Destino</th>
                  </tr>
                </thead>
                <tbody>
                  {validAssignments.map((a, idx) => {
                    const sampleName = a.sampleData.name || a.sampleData.global_sample_name;
                    return (
                      <tr key={idx} className="border-b border-gray-700/50 last:border-0 hover:bg-gray-800/30">
                        <td className="px-4 py-3 font-medium text-white">{sampleName}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          Pos: ({a.sampleData.position_x + 1}, {a.sampleData.position_y + 1}, {(a.sampleData.position_z || 0) + 1})
                        </td>
                        <td className="px-4 py-3 flex justify-center text-primary-500">
                          <ArrowRightIcon className="w-4 h-4" />
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <div className="font-bold text-primary-400 mb-0.5">{a.targetShelfName}</div>
                          Pos: ({a.x + 1}, {a.y + 1}, {(a.z || 0) + 1})
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default MovementConfirmModal;
