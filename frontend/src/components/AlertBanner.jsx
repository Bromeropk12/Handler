import React, { useState, useEffect } from 'react';
import { alertsAPI } from '../services/api';
import { ExclamationTriangleIcon, ClockIcon, CalendarIcon, XMarkIcon } from '@heroicons/react/24/outline';

const AlertBanner = ({ compact = false }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchSummary(controller);
    return () => controller.abort();
  }, []);

  const fetchSummary = async (controller) => {
    try {
      const resp = await alertsAPI.getSummary({ signal: controller?.signal });
      if (resp?.data) setSummary(resp.data);
    } catch (err) {
      if (err?.name !== 'CanceledError' && err?.code !== 'ERR_CANCELED') {
        console.error('Error cargando alertas:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading || !summary) return null;
  if (dismissed) return null;
  if (summary.counts.total === 0) return null;

  const { counts, top_alerts } = summary;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {counts.expired > 0 && (
          <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20">
            <ExclamationTriangleIcon className="w-3 h-3" />
            {counts.expired}
          </span>
        )}
        {counts.warning > 0 && (
          <span className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-full border border-yellow-500/20">
            <ClockIcon className="w-3 h-3" />
            {counts.warning}
          </span>
        )}
        {counts.caution > 0 && (
          <span className="flex items-center gap-1 text-xs text-orange-400 bg-orange-500/10 px-2 py-1 rounded-full border border-orange-500/20">
            <CalendarIcon className="w-3 h-3" />
            {counts.caution}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-900/80 border border-gray-700/50 rounded-xl overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {counts.expired > 0 && (
              <span className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20">
                <ExclamationTriangleIcon className="w-3 h-3" />
                {counts.expired} Vencidos
              </span>
            )}
            {counts.warning > 0 && (
              <span className="flex items-center gap-1 text-xs font-bold text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-full border border-yellow-500/20">
                <ClockIcon className="w-3 h-3" />
                {counts.warning} por vencer
              </span>
            )}
            {counts.caution > 0 && (
              <span className="flex items-center gap-1 text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-1 rounded-full border border-orange-500/20">
                <CalendarIcon className="w-3 h-3" />
                {counts.caution} precaución
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-gray-400 hover:text-white transition-colors">
            {expanded ? 'Ocultar' : 'Ver detalles'}
          </button>
          <button onClick={() => setDismissed(true)} className="text-gray-500 hover:text-white transition-colors">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top Alerts */}
      {expanded && top_alerts.length > 0 && (
        <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
          {top_alerts.map((alert) => {
            const isExpired = alert.alert_type === 'expired';
            const isWarning = alert.alert_type === 'warning';
            return (
              <div key={alert.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                isExpired ? 'bg-red-500/5 border-red-500/20' : 
                isWarning ? 'bg-yellow-500/5 border-yellow-500/20' : 
                'bg-orange-500/5 border-orange-500/20'
              }`}>
                <div className="flex items-center gap-3">
                  {isExpired ? (
                    <ExclamationTriangleIcon className="w-4 h-4 text-red-400" />
                  ) : isWarning ? (
                    <ClockIcon className="w-4 h-4 text-yellow-400" />
                  ) : (
                    <CalendarIcon className="w-4 h-4 text-orange-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-white">{alert.product_name}</p>
                    <p className="text-xs text-gray-500">Lote: {alert.lot} • {alert.shelf_name || 'Sin anaquel'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-mono font-bold ${
                    isExpired ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-orange-400'
                  }`}>
                    {isExpired ? `${Math.abs(alert.days_until_expiry)}d vencido` : `${alert.days_until_expiry}d restantes`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AlertBanner;