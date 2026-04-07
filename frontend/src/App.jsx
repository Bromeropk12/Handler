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
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

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

// App content with routes
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
        <Route path="/" element={<DashboardPage />} />
        <Route path="/samples" element={<SamplesPage />} />
        <Route path="/warehouse" element={<WarehousePage />} />
        <Route path="/shelves" element={<ShelfManagement />} />
        <Route path="/dispensing" element={<DispensingPage />} />
        <Route path="/dispatch" element={<DispatchPage />} />
        <Route path="/movements" element={<MovementsPage />} />
        <Route path="/suppliers" element={<SuppliersPage />} />
        <Route path="/market-lines" element={<MarketLinesPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Root App
const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppContent />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
