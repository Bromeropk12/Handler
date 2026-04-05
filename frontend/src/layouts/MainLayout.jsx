import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden bg-surface-500">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'ml-[4.5rem]' : 'ml-64'
        }`}
      >
        {/* Header */}
        <Header />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="h-8 bg-surface-400/50 border-t border-gray-700/30 flex items-center justify-between px-6 shrink-0">
          <p className="text-xs text-gray-600">
            © 2026 Handler S.A.S. — Handler TrackSamples v1.0
          </p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-success-300 rounded-full animate-pulse-slow"></div>
            <span className="text-xs text-gray-600">Sistema activo</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;
