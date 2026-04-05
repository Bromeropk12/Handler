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
} from '@heroicons/react/24/outline';

const navItems = [
  {
    label: 'Dashboard',
    path: '/',
    icon: ChartBarIcon,
    exact: true,
  },
  {
    label: 'Muestras Globales',
    path: '/samples',
    icon: BeakerIcon,
  },
  {
    label: 'Almacén',
    path: '/warehouse',
    icon: BuildingStorefrontIcon,
  },
  {
    label: 'Dispensación',
    path: '/dispensing',
    icon: EyeDropperIcon,
  },
  {
    label: 'Despachos',
    path: '/dispatch',
    icon: TruckIcon,
  },
  {
    label: 'Movimientos',
    path: '/movements',
    icon: ClipboardDocumentListIcon,
  },
  {
    label: 'Proveedores',
    path: '/suppliers',
    icon: BuildingStorefrontIcon,
  },
];

const Sidebar = ({ collapsed, onToggle }) => {
  const { logout } = useAuth();
  const location = useLocation();

  const isActive = (path, exact) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={`
        fixed left-0 top-0 h-full z-40
        bg-surface-400 border-r border-gray-700/50
        flex flex-col transition-all duration-300 ease-out
        ${collapsed ? 'w-[4.5rem]' : 'w-64'}
      `}
    >
      {/* Logo Area */}
      <div className="h-16 flex items-center px-4 border-b border-gray-700/50 shrink-0">
        {collapsed ? (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 bg-handler-red rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">H</span>
            </div>
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
          {navItems.map(item => {
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
        <button
          onClick={logout}
          className={`sidebar-item w-full text-gray-500 hover:text-danger-400 ${collapsed ? 'justify-center px-0' : ''}`}
          title={collapsed ? 'Cerrar sesión' : undefined}
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-surface-300 border border-gray-700 
                   rounded-full flex items-center justify-center text-gray-400 hover:text-white
                   hover:bg-surface-200 transition-all duration-200 z-50 shadow-md"
      >
        {collapsed ? (
          <ChevronRightIcon className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeftIcon className="w-3.5 h-3.5" />
        )}
      </button>
    </aside>
  );
};

export default Sidebar;
