import React from 'react';

const InventoryStatsWidget = ({ stats }) => {
  return (
    <div className="space-y-4">
      {/* Estado de Muestras Bulk */}
      <div className="card">
        <div className="card-header border-b border-white/5 bg-surface-400/20">
          <h3 className="text-sm font-bold text-gray-200">Inventario Global (Bulk)</h3>
        </div>
        <div className="card-body p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded-lg bg-surface-400/20 hover:bg-surface-400/40 transition-colors">
              <span className="text-sm text-gray-400 font-medium">Disponibles (con stock)</span>
              <span className="text-lg font-bold text-green-400">{stats.availableSamples}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-surface-400/20 hover:bg-surface-400/40 transition-colors">
              <span className="text-sm text-gray-400 font-medium">Pendientes por dispensar</span>
              <span className="text-lg font-bold text-amber-400">{stats.pendingDispensing}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-surface-400/20 hover:bg-surface-400/40 transition-colors">
              <span className="text-sm text-gray-400 font-medium">Vacías (agotadas)</span>
              <span className="text-lg font-bold text-red-400">{stats.emptySamples}</span>
            </div>
            <div className="pt-3 border-t border-gray-700/50 flex items-center justify-between px-2">
              <span className="text-sm font-bold text-gray-300">Total Bulk Registrados</span>
              <span className="text-xl font-black text-white">{stats.totalBulkSamples}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Configuración de Anaqueles */}
      <div className="card">
        <div className="card-header border-b border-white/5 bg-surface-400/20">
          <h3 className="text-sm font-bold text-gray-200">Capacidad Física 3D</h3>
        </div>
        <div className="card-body p-4">
          <div className="space-y-3">
            <div className="p-3 bg-surface-400/20 rounded-xl text-center">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Anaqueles Físicos</p>
              <p className="text-xl font-black text-blue-400">{stats.totalShelves}</p>
            </div>
            <div className="p-3 bg-surface-400/30 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400 font-medium">Total Posiciones</span>
                <span className="text-sm font-bold text-white">{stats.totalPositions.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400 font-medium">Disponibles Libres</span>
                <span className="text-sm font-bold text-green-400">{stats.freePositions.toLocaleString()}</span>
              </div>
              {/* Mini barra de progreso global */}
              <div className="mt-3 h-1.5 w-full bg-surface-600 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-500 rounded-full" 
                  style={{ width: `${Math.min(100, Math.max(0, stats.avgOccupancy))}%` }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryStatsWidget;
