import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ExclamationTriangleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const ActiveAlertsBanners = ({ stats }) => {
  const navigate = useNavigate();

  if (stats.expiredCount === 0 && stats.warningCount === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Muestras Vencidas */}
      {stats.expiredCount > 0 && (
        <div className="card border-l-4 border-l-red-500 overflow-hidden shadow-lg shadow-red-500/5">
          <div className="card-header bg-red-500/5 border-b border-red-500/10 flex items-center justify-between py-3">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
              <h3 className="text-sm font-bold text-red-400">
                Muestras Vencidas ({stats.expiredCount})
              </h3>
            </div>
          </div>
          <div className="card-body p-0">
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {stats.expiredSamples?.slice(0, 5).map(sample => (
                <div
                  key={sample.id}
                  onClick={() => navigate(`/samples?search=${encodeURIComponent(sample.lot)}`)}
                  className="flex flex-col p-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors truncate pr-2">
                      {sample.name}
                    </span>
                    <span className="shrink-0 text-xs px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 font-bold">
                      hace {sample.days_expired} días
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                    <span>Lote: <span className="text-gray-400 font-mono">{sample.lot}</span></span>
                    <span>Prov: <span className="text-gray-400">{sample.supplier_name}</span></span>
                  </div>
                </div>
              ))}
            </div>
            {stats.expiredSamples?.length > 5 && (
              <button
                onClick={() => navigate('/samples?filter=expired')}
                className="w-full p-3 text-xs text-red-400 hover:text-red-300 font-bold bg-surface-400/30 hover:bg-surface-400/50 transition-colors"
              >
                Ver todas las {stats.expiredCount} muestras vencidas →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Muestras Próximas a Vencer */}
      {stats.warningCount > 0 && (
        <div className="card border-l-4 border-l-amber-500 overflow-hidden shadow-lg shadow-amber-500/5">
          <div className="card-header bg-amber-500/5 border-b border-amber-500/10 flex items-center justify-between py-3">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-bold text-amber-400">
                Próximas a Vencer ({stats.warningCount})
              </h3>
            </div>
          </div>
          <div className="card-body p-0">
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {stats.warningSamples?.slice(0, 5).map(sample => (
                <div
                  key={sample.id}
                  onClick={() => navigate(`/samples?search=${encodeURIComponent(sample.lot)}`)}
                  className="flex flex-col p-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors truncate pr-2">
                      {sample.name}
                    </span>
                    <span className="shrink-0 text-xs px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-bold">
                      en {sample.days_remaining} días
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                    <span>Lote: <span className="text-gray-400 font-mono">{sample.lot}</span></span>
                    <span>Vence: <span className="text-gray-400">{new Date(sample.expiration_date).toLocaleDateString('es-CO')}</span></span>
                  </div>
                </div>
              ))}
            </div>
            {stats.warningSamples?.length > 5 && (
              <button
                onClick={() => navigate('/samples?filter=warning')}
                className="w-full p-3 text-xs text-amber-400 hover:text-amber-300 font-bold bg-surface-400/30 hover:bg-surface-400/50 transition-colors"
              >
                Ver todas las {stats.warningCount} próximas a vencer →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveAlertsBanners;
