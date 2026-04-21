import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import {
  BellIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import UserSettings from '../components/UserSettings';
import UserManagement from '../components/UserManagement';
import { alertsAPI } from '../services/api';

const routeTitles = {
  '/': { title: 'Dashboard', subtitle: 'Resumen general del sistema' },
  '/samples': { title: 'Muestras Globales', subtitle: 'Gestión de materias primas (Bulk)' },
  '/warehouse': { title: 'Almacén', subtitle: 'Mapa 3D y organización de anaqueles' },
  '/dispensing': { title: 'Dispensación', subtitle: 'Subdivisión de muestras con QR' },
  '/dispatch': { title: 'Despachos', subtitle: 'Proceso de despacho validado FEFO' },
  '/movements': { title: 'Movimientos', subtitle: 'Trazabilidad y log de operaciones' },
};

const Header = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [alertCount, setAlertCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
  };

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentRoute = routeTitles[location.pathname] || routeTitles['/'];

  useEffect(() => {
    const fetchAlertCount = async () => {
      try {
        const resp = await alertsAPI.getSummary();
        setAlertCount(resp.data.data.counts.expired + resp.data.data.counts.warning);
      } catch (err) {
        // Silenciar errores de alertas en header
      }
    };
    fetchAlertCount();
    // Actualizar cada 5 minutos
    const interval = setInterval(fetchAlertCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
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

        {/* Right: Notifications + User */}
        <div className="flex items-center gap-3">

          {/* Notifications */}
          <button className="btn-icon relative">
            <BellIcon className="w-5 h-5" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">{alertCount > 9 ? '9+' : alertCount}</span>
              </span>
            )}
          </button>

          {/* Divider */}
          <div className="h-8 w-px bg-gray-700/50 mx-1"></div>

          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700/50 transition-colors duration-200"
            >
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
              <ChevronDownIcon
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''
                  }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-surface-400 border border-gray-700/50 rounded-lg shadow-lg z-50">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowUserSettings(true);
                      setIsDropdownOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-700/50 transition-colors duration-200"
                  >
                    <Cog6ToothIcon className="w-4 h-4" />
                    Configuraciones
                  </button>
                  {isAdmin() && (
                    <button
                      onClick={() => {
                        setShowUserManagement(true);
                        setIsDropdownOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-700/50 transition-colors duration-200"
                    >
                      <UsersIcon className="w-4 h-4" />
                      Gestionar Usuarios
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-200 hover:bg-red-600/20 hover:text-red-400 transition-colors duration-200"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modals */}
      <UserSettings
        isOpen={showUserSettings}
        onClose={() => setShowUserSettings(false)}
      />

      {isAdmin() && (
        <UserManagement
          isOpen={showUserManagement}
          onClose={() => setShowUserManagement(false)}
        />
      )}
    </>
  );
};

export default Header;
