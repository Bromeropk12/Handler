import React from 'react';
import { 
  ArrowRightIcon, 
  PlusCircleIcon, 
  MinusCircleIcon, 
  ArrowPathIcon,
  ArchiveBoxIcon,
  TruckIcon
} from '@heroicons/react/24/outline';

const RecentMovementsWidget = ({ alerts }) => {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 p-6 text-center">
        <ArchiveBoxIcon className="w-12 h-12 text-surface-400 mb-3" />
        <p className="text-sm">No hay movimientos registrados recientemente.</p>
      </div>
    );
  }

  const getMovementIcon = (type) => {
    switch (type) {
      case 'created': return <PlusCircleIcon className="w-5 h-5 text-info-400" />;
      case 'dispensed': return <ArrowPathIcon className="w-5 h-5 text-warning-400" />;
      case 'dispatched': return <TruckIcon className="w-5 h-5 text-success-400" />;
      case 'deleted': return <MinusCircleIcon className="w-5 h-5 text-danger-400" />;
      default: return <ArrowRightIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getMovementBg = (type) => {
    switch (type) {
      case 'created': return 'bg-info-500/10 border-info-500/20';
      case 'dispensed': return 'bg-warning-500/10 border-warning-500/20';
      case 'dispatched': return 'bg-success-500/10 border-success-500/20';
      case 'deleted': return 'bg-danger-500/10 border-danger-500/20';
      default: return 'bg-surface-400/20 border-white/5';
    }
  };

  return (
    <div className="space-y-3 p-4">
      {alerts.map((alert, i) => (
        <div 
          key={i} 
          className={`flex items-start gap-3 p-3 rounded-xl border transition-all hover:bg-surface-300 ${getMovementBg(alert.type || (alert.text.includes('Nueva') ? 'created' : alert.text.includes('Subdivisión') ? 'dispensed' : alert.text.includes('Despacho') ? 'dispatched' : 'other'))}`}
        >
          <div className="mt-0.5 shrink-0">
            {getMovementIcon(alert.type || (alert.text.includes('Nueva') ? 'created' : alert.text.includes('Subdivisión') ? 'dispensed' : alert.text.includes('Despacho') ? 'dispatched' : 'other'))}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-200 leading-snug">{alert.text}</p>
            <p className="text-xs text-gray-500 mt-1 font-mono">{alert.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentMovementsWidget;
