import React from 'react';
import { InboxIcon } from '@heroicons/react/24/outline';

const EmptyState = ({ 
  icon: Icon = InboxIcon, 
  title = 'Sin datos', 
  description = 'No hay información disponible.',
  action,
  actionLabel = 'Crear nuevo',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
      <div className="w-16 h-16 bg-surface-200 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-300 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-6">{description}</p>
      {action && (
        <button onClick={action} className="btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
