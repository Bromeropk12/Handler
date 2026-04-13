import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Warehouse, 
  Scissors, 
  Truck, 
  History, 
  Settings, 
  LogOut,
  Beaker
} from 'lucide-react';

export default function Layout({ children, user, onLogout }) {
  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/bulk', icon: Package, label: 'Muestras Bulk' },
    { path: '/warehouse', icon: Warehouse, label: 'Almacén 2D' },
    { path: '/dispensing', icon: Scissors, label: 'Dispensación' },
    { path: '/dispatch', icon: Truck, label: 'Despachos' },
    { path: '/movements', icon: History, label: 'Movimientos' },
    { path: '/settings', icon: Settings, label: 'Configuración' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Beaker className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-800">Händler</h1>
              <p className="text-xs text-gray-500">TrackSamples</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-4 px-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-medium">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{user?.username}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}