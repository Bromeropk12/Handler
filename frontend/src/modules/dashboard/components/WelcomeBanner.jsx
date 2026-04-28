import React from 'react';

const WelcomeBanner = () => {
  return (
    <div className="card-glass p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-handler-red to-handler-gold" />
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Dashboard
          </h2>
          <p className="text-gray-400 text-sm max-w-2xl">
            Vista general del inventario, ocupación 3D del almacén y estado de las muestras químicas.
          </p>
        </div>
      </div>
      <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-handler-red/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-8 -top-8 w-40 h-40 bg-handler-blue/10 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
};

export default WelcomeBanner;
