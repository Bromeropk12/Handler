import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BeakerIcon,
  BuildingStorefrontIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const QuickActionsWidget = () => {
  const navigate = useNavigate();
  
  const actions = [
    { label: 'Nueva Muestra', icon: BeakerIcon, path: '/samples', color: 'text-blue-400', bgHover: 'hover:border-blue-500/30 hover:bg-blue-500/5' },
    { label: 'Almacén 3D', icon: BuildingStorefrontIcon, path: '/warehouse', color: 'text-purple-400', bgHover: 'hover:border-purple-500/30 hover:bg-purple-500/5' },
    { label: 'Despachos', icon: ClockIcon, path: '/dispatch', color: 'text-amber-400', bgHover: 'hover:border-amber-500/30 hover:bg-amber-500/5' },
    { label: 'Movimientos', icon: ExclamationTriangleIcon, path: '/movements', color: 'text-green-400', bgHover: 'hover:border-green-500/30 hover:bg-green-500/5' },
  ];

  return (
    <div className="card">
      <div className="card-header border-b border-white/5 bg-surface-400/20">
        <h3 className="text-sm font-bold text-gray-200">Acciones Rápidas</h3>
      </div>
      <div className="card-body p-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {actions.map(action => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className={`flex flex-col items-center justify-center gap-2 p-4 bg-surface-300/30 rounded-xl 
                         border border-transparent transition-all duration-300 group ${action.bgHover}`}
            >
              <action.icon className={`w-7 h-7 ${action.color} group-hover:scale-110 transition-transform duration-300`} />
              <span className="text-xs font-bold text-gray-400 group-hover:text-white transition-colors">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickActionsWidget;
