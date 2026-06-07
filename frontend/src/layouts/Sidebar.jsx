import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ChartBarIcon,
  BeakerIcon,
  BuildingStorefrontIcon,
  EyeDropperIcon,
  TruckIcon,
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Squares2X2Icon,
  CubeIcon,
  CircleStackIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  {
    label: 'Dashboard',
    path: '/',
    icon: ChartBarIcon,
    exact: true,
    permissionKey: 'dashboard.view',
  },
  {
    label: 'Muestras Globales',
    path: '/samples',
    icon: BeakerIcon,
    permissionKey: 'samples.view',
  },
  {
    label: 'Dispensación',
    path: '/dispensing',
    icon: EyeDropperIcon,
    permissionKey: 'dispensing.view',
  },
  {
    label: 'Despachos',
    path: '/dispatch',
    icon: TruckIcon,
    permissionKey: 'dispatch.view',
  },
  {
    label: 'Almacén',
    path: '/warehouse',
    icon: BuildingStorefrontIcon,
    permissionKey: 'warehouse.view',
  },
  {
    label: 'Anaqueles',
    path: '/shelves',
    icon: CubeIcon,
    permissionKey: 'warehouse.view',
  },
  {
    label: 'Movimientos',
    path: '/movements',
    icon: ClipboardDocumentListIcon,
    permissionKey: 'movements.view',
  },
  {
    label: 'Proveedores',
    path: '/suppliers',
    icon: Squares2X2Icon,
    permissionKey: 'suppliers.view',
  },
  {
    label: 'Líneas de Mercado',
    path: '/market-lines',
    icon: Squares2X2Icon,
    permissionKey: 'market_lines.view',
  },
];

const Sidebar = ({ collapsed, onToggle }) => {
  const { logout, isAdmin, hasPermission } = useAuth();
  const location = useLocation();

  const isActive = (path, exact) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Overlay para móviles cuando la sidebar está expandida */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 h-full z-40
          bg-surface-400 border-r border-gray-700/50
          flex flex-col transition-all duration-300 ease-out shadow-2xl
          ${collapsed ? 'w-[4.5rem]' : 'w-64'}
        `}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center px-4 border-b border-gray-700/50 shrink-0">
          {collapsed ? (
            <div className="w-full flex justify-center">
              <img
                src="/icohandler.png"
                alt="Händler"
                className="h-9 w-9 object-contain"
              />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Händler"
                className="h-7 w-auto brightness-0 invert"
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-hide py-4 px-3">
          <div className="space-y-1">
            {navItems.filter(item => !item.permissionKey || hasPermission(item.permissionKey)).map(item => {
              const Icon = item.icon;
              const active = isActive(item.path, item.exact);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`
                  ${active ? 'sidebar-item-active' : 'sidebar-item'}
                  ${collapsed ? 'justify-center px-0' : ''}
                `}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-handler-red' : ''}`} />
                  {!collapsed && (
                    <>
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto text-xxs bg-handler-gold/20 text-handler-gold px-1.5 py-0.5 rounded font-medium">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-gray-700/50 py-3 px-3 space-y-1 shrink-0">
          {/* Configuración — solo para administradores */}
          {isAdmin() && (
            <NavLink
              to="/settings"
              className={`
                ${isActive('/settings') ? 'sidebar-item-active' : 'sidebar-item'}
                ${collapsed ? 'justify-center px-0' : ''}
              `}
              title={collapsed ? 'Configuración' : undefined}
            >
              <Cog6ToothIcon className={`w-5 h-5 shrink-0 ${isActive('/settings') ? 'text-handler-red' : ''}`} />
              {!collapsed && <span className="truncate">Configuración</span>}
            </NavLink>
          )}

          {/* Backup — solo para administradores */}
          {isAdmin() && (
            <NavLink
              to="/backup"
              className={`
                ${isActive('/backup') ? 'sidebar-item-active' : 'sidebar-item'}
                ${collapsed ? 'justify-center px-0' : ''}
              `}
              title={collapsed ? 'Backups' : undefined}
            >
              <CircleStackIcon className={`w-5 h-5 shrink-0 ${isActive('/backup') ? 'text-handler-red' : ''}`} />
              {!collapsed && <span className="truncate">Backups</span>}
            </NavLink>
          )}

          <button
            onClick={logout}
            className={`sidebar-item w-full text-gray-500 hover:text-danger-400 ${collapsed ? 'justify-center px-0' : ''}`}
            title={collapsed ? 'Cerrar sesión' : undefined}
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>

        {/* Collapse Toggle - Más grande y visible */}
        <div className="absolute -right-4 top-20 z-50">
          <button
            onClick={onToggle}
            className="group relative w-8 h-12 bg-surface-400 border-2 border-gray-600/50
                       rounded-lg flex items-center justify-center text-gray-400 hover:text-white
                       hover:bg-surface-300 hover:border-handler-red/50 transition-all duration-300
                       shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {/* Indicador de estado */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-handler-red/0 to-handler-red/10
                            opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Icono principal */}
            <div className="relative z-10">
              {collapsed ? (
                <ChevronRightIcon className="w-4 h-4" />
              ) : (
                <ChevronLeftIcon className="w-4 h-4" />
              )}
            </div>

            {/* Tooltip visual */}
            <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-800
                            text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity
                            duration-300 pointer-events-none whitespace-nowrap border border-gray-600">
              {collapsed ? 'Expandir menú' : 'Colapsar menú'}
              <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-800"></div>
            </div>
          </button>

          {/* Indicador adicional cuando está colapsado */}
          {collapsed && (
            <div className="absolute -right-1 top-14 w-1 h-8 bg-gradient-to-b from-handler-red/50 to-transparent
                            rounded-r-full animate-pulse opacity-60"></div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
