import React, { useState, useEffect } from 'react';
import { warehouseAPI } from '../../../../services/api';
import Modal from '../../../../components/Modal';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import { CubeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const TargetShelfPicker = ({ isOpen, onClose, currentShelfId, marketLineId, onSelectTarget }) => {
  const [shelves, setShelves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShelves = async () => {
      try {
        setLoading(true);
        const res = await warehouseAPI.getShelves({ market_line_id: marketLineId });
        setShelves(res.data.data.shelves || []);
        setError(null);
      } catch (err) {
        setError('Error al cargar los anaqueles destino');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && marketLineId) {
      fetchShelves();
    }
  }, [isOpen, marketLineId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Seleccionar Anaquel Destino" maxWidth="max-w-4xl">
      <div className="p-4">
        {loading ? (
          <div className="py-12 flex justify-center"><LoadingSpinner text="Cargando anaqueles..." /></div>
        ) : error ? (
          <div className="p-4 bg-danger-500/10 border border-danger-500/20 rounded-xl text-danger-400 flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5" /> {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shelves.map(shelf => {
              const isCurrent = shelf.id === currentShelfId;
              const totalCapacity = shelf.total_capacity || (shelf.grid_width * shelf.grid_height * (shelf.shelf_depth || 1));
              const occupied = shelf.occupied_count || 0;
              const free = Math.max(0, totalCapacity - occupied);
              const occPercent = totalCapacity > 0 ? Math.round((occupied / totalCapacity) * 100) : 0;

              return (
                <div 
                  key={shelf.id}
                  onClick={() => !isCurrent && onSelectTarget(shelf)}
                  className={`relative p-5 rounded-xl border transition-all duration-200 ${
                    isCurrent 
                      ? 'bg-gray-900/40 border-gray-700/50 cursor-not-allowed opacity-70' 
                      : 'bg-surface-600 border-gray-600 hover:border-primary-500 hover:shadow-[0_0_20px_rgba(14,165,233,0.15)] cursor-pointer'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <CubeIcon className={`w-5 h-5 ${isCurrent ? 'text-gray-500' : 'text-primary-400'}`} />
                      <h3 className="font-bold text-white text-lg">{shelf.name}</h3>
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-1 rounded font-bold uppercase tracking-wider">
                        Actual
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>Libres: <strong className="text-white">{free}</strong></span>
                    <span>Ocupados: <strong className="text-white">{occupied}</strong></span>
                  </div>

                  <div className="w-full bg-gray-800 rounded-full h-1.5 mb-2">
                    <div 
                      className={`h-full rounded-full ${occPercent > 80 ? 'bg-danger-500' : occPercent > 50 ? 'bg-warning-500' : 'bg-primary-500'}`}
                      style={{ width: `${occPercent}%` }}
                    />
                  </div>
                  <div className="text-right text-[10px] text-gray-500 font-bold">{occPercent}% ocupación</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TargetShelfPicker;
