import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import {
  BellIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

const routeTitles = {
  '/': { title: 'Dashboard', subtitle: 'Resumen general del sistema' },
  '/samples': { title: 'Muestras Globales', subtitle: 'Gestión de materias primas (Bulk)' },
  '/warehouse': { title: 'Almacén', subtitle: 'Mapa 2D y organización de anaqueles' },
  '/dispensing': { title: 'Dispensación', subtitle: 'Subdivisión de muestras con QR' },
  '/dispatch': { title: 'Despachos', subtitle: 'Proceso de despacho validado FEFO' },
  '/movements': { title: 'Movimientos', subtitle: 'Trazabilidad y log de operaciones' },
};

const Header = () => {
  const { user } = useAuth();
  const location = useLocation();

  const currentRoute = routeTitles[location.pathname] || routeTitles['/'];

  return (
    <header className="h-16 bg-surface-400/80 backdrop-blur-md border-b border-gray-700/50 flex items-center justify-between px-6 shrink-0 z-30">
      {/* Left: Page Title */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-base font-semibold text-white leading-tight">
            {currentRoute.title}
          </h1>
          <p className="text-xs text-gray-500">{currentRoute.subtitle}</p>
        </div>
      </div>

      {/* Right: Search + Notifications + User */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-52 bg-surface-300 border border-gray-700/50 rounded-lg pl-9 pr-3 py-1.5 text-sm 
                       text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-1 
                       focus:ring-handler-red/50 focus:border-handler-red/50 transition-all"
          />
        </div>

        {/* Notifications */}
        <button className="btn-icon relative">
          <BellIcon className="w-5 h-5" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-handler-red rounded-full"></span>
        </button>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-700/50 mx-1"></div>

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-200 leading-tight">{user?.username || 'Usuario'}</p>
            <p className="text-xs text-gray-500 capitalize">
              {user?.role === 'admin' ? 'Administrador' : 'Operador'}
            </p>
          </div>
          <div className="w-8 h-8 bg-gradient-to-br from-handler-red to-handler-gold rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">
              {(user?.username || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
