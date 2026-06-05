import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import LoginPage from './modules/auth/LoginPage';
import DashboardPage from './modules/dashboard/DashboardPage';
import SamplesPage from './modules/samples/SamplesPage';
import WarehousePage from './modules/warehouse/WarehousePage';
import ShelfManagement from './modules/warehouse/ShelfManagement';
import DispensingPage from './modules/dispensing/DispensingPage';
import DispatchPage from './modules/dispatch/DispatchPage';
import MovementsPage from './modules/movements/MovementsPage';
import SuppliersPage from './modules/suppliers/SuppliersPage';
import MarketLinesPage from './modules/market-lines/MarketLinesPage';
import BackupPage from './modules/backup/BackupPage';
import SettingsPage from './modules/settings/SettingsPage';
import UserManagementPage from './modules/users/UserManagementPage';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import SetupPage from './modules/setup/SetupPage';
import SystemNotificationBanner from './components/SystemNotificationBanner';
import { useServerEvents } from './hooks/useServerEvents';

// Admin-only route wrapper
const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-500">
        <LoadingSpinner size="large" text="Verificando permisos..." />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin()) return <Navigate to="/" replace />;
  return children;
};

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-500">
        <LoadingSpinner size="large" text="Verificando sesión..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Inline "No Access" screen — shown instead of redirecting to avoid infinite loops
const NoAccess = ({ permission }) => (
  <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4 text-center px-6">
    <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-2">
      <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    </div>
    <h2 className="text-xl font-bold text-white">Acceso Denegado</h2>
    <p className="text-gray-400 text-sm max-w-xs">
      No tienes permiso para acceder a este módulo.<br/>
      <span className="text-gray-600 text-xs font-mono mt-1 block">{permission}</span>
    </p>
    <p className="text-gray-600 text-xs">Contacta al administrador para solicitar acceso.</p>
  </div>
);

// Permission route wrapper — renders NoAccess inline instead of redirecting
const PermissionRoute = ({ children, requiredPermission }) => {
  const { hasPermission, loading } = useAuth();
  // Don't render anything while auth is loading (ProtectedRoute handles the spinner)
  if (loading) return null;
  if (!hasPermission(requiredPermission)) {
    return <NoAccess permission={requiredPermission} />;
  }
  return children;
};

// App content with routes + SSE notification banner
const AppWithNotifications = () => {
  const { notification, dismissNotification } = useServerEvents();
  return (
    <>
      <SystemNotificationBanner notification={notification} onDismiss={dismissNotification} />
      <AppContent />
    </>
  );
};
const AppContent = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Auth routes - no layout */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />

      {/* Protected routes with MainLayout */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<PermissionRoute requiredPermission="dashboard.view"><DashboardPage /></PermissionRoute>} />
        <Route path="/samples" element={<PermissionRoute requiredPermission="samples.view"><SamplesPage /></PermissionRoute>} />
        <Route path="/warehouse" element={<PermissionRoute requiredPermission="warehouse.view"><WarehousePage /></PermissionRoute>} />
        <Route path="/shelves" element={<PermissionRoute requiredPermission="warehouse.view"><ShelfManagement /></PermissionRoute>} />
        <Route path="/dispensing" element={<PermissionRoute requiredPermission="dispensing.view"><DispensingPage /></PermissionRoute>} />
        <Route path="/dispatch" element={<PermissionRoute requiredPermission="dispatch.view"><DispatchPage /></PermissionRoute>} />
        <Route path="/movements" element={<PermissionRoute requiredPermission="movements.view"><MovementsPage /></PermissionRoute>} />
        <Route path="/suppliers" element={<PermissionRoute requiredPermission="suppliers.view"><SuppliersPage /></PermissionRoute>} />
        <Route path="/market-lines" element={<PermissionRoute requiredPermission="market_lines.view"><MarketLinesPage /></PermissionRoute>} />
      </Route>

      {/* Backup — Solo administradores */}
      <Route
        path="/backup"
        element={
          <AdminRoute>
            <MainLayout />
          </AdminRoute>
        }
      >
        <Route index element={<BackupPage />} />
      </Route>

      {/* Configuración del sistema — Solo administradores */}
      <Route
        path="/settings"
        element={
          <AdminRoute>
            <MainLayout />
          </AdminRoute>
        }
      >
        <Route index element={<SettingsPage />} />
      </Route>

      {/* Usuarios — Solo administradores */}
      <Route
        path="/users"
        element={
          <AdminRoute>
            <MainLayout />
          </AdminRoute>
        }
      >
        <Route index element={<UserManagementPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Root App
const App = () => {
  const [needsSetup, setNeedsSetup] = React.useState(false);
  const [checkingSetup, setCheckingSetup] = React.useState(true);
  const [setupError, setSetupError] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) {
        console.warn('[App] checkSetup timed out, assuming setup complete');
        setCheckingSetup(false);
      }
    }, 8000);

    try {
      if (window.electronAPI && typeof window.electronAPI.checkSetup === 'function') {
        window.electronAPI.checkSetup().then(needs => {
          if (cancelled) return;
          clearTimeout(timeout);
          setNeedsSetup(needs);
          setCheckingSetup(false);
        }).catch(err => {
          if (cancelled) return;
          clearTimeout(timeout);
          console.error('[App] Error al verificar setup:', err);
          setSetupError(err.message || 'Error de comunicación con el sistema');
          setCheckingSetup(false);
        });
      } else {
        clearTimeout(timeout);
        setCheckingSetup(false);
      }
    } catch (err) {
      clearTimeout(timeout);
      console.error('[App] Error sincrónico en checkSetup:', err);
      setSetupError(err.message || 'Error al iniciar la aplicación');
      setCheckingSetup(false);
    }

    return () => { cancelled = true; clearTimeout(timeout); };
  }, []);

  if (setupError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-500 text-white p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-danger-200/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-danger-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Error de inicio</h2>
          <p className="text-gray-400 text-sm mb-4">{setupError}</p>
          <p className="text-gray-600 text-xs mb-6">Si el problema persiste, reinstala la aplicación o contacta a soporte.</p>
          <button onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-handler-red hover:bg-handler-red-light text-white rounded-lg transition-colors text-sm font-medium">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (checkingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-500 text-white">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-400 text-sm">Verificando estado del sistema...</p>
        </div>
      </div>
    );
  }

  if (needsSetup) {
    return <SetupPage onSetupComplete={() => setNeedsSetup(false)} />;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppWithNotifications />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
