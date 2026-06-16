import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { analyticsAPI } from '../../services/api';

// Módulos
import WelcomeBanner from './components/WelcomeBanner';
import ActiveAlertsBanners from './components/ActiveAlertsBanners';
import InventoryStatsWidget from './components/InventoryStatsWidget';
import OccupancyChart from './components/OccupancyChart';
import QuickActionsWidget from './components/QuickActionsWidget';
import RecentMovementsWidget from './components/RecentMovementsWidget';
import NetworkInfoWidget from './components/NetworkInfoWidget';

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartReady, setChartReady] = useState(false);
  const [stats, setStats] = useState({
    // Muestras Bulk
    totalBulkSamples: 0,
    pendingDispensing: 0,
    emptySamples: 0,
    availableSamples: 0,
    // Muestras Dispensadas
    totalDispensed: 0,
    storedCount: 0,
    dispatchedCount: 0,
    // Anaqueles
    totalShelves: 0,
    refrigeratedShelves: 0,
    ambientShelves: 0,
    // Ocupación
    totalPositions: 0,
    occupiedPositions: 0,
    freePositions: 0,
    avgOccupancy: 0,
    // Alertas
    expiredCount: 0,
    warningCount: 0,
    expiredSamples: [],
    warningSamples: [],
    // Otros
    marketLines: [],
    recentAlerts: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const { data } = await analyticsAPI.getDashboard();
        if (data) {
          setStats(data);
        }
      } catch (err) {
        console.error("Error cargando dashboard:", err);
        setError(err.message || 'Error al cargar los datos del dashboard');
      } finally {
        setLoading(false);
        // Pequeño delay para asegurar que el DOM y el contenedor del chart estén listos
        setTimeout(() => setChartReady(true), 150);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <LoadingSpinner size="large" text="Cargando métricas del dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
          <div className="shrink-0 w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          </div>
          <div>
            <p className="text-sm font-bold text-red-400">Error al cargar el dashboard</p>
            <p className="text-xs text-red-300/80 mt-1">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-2 text-xs font-medium text-red-300 hover:text-red-200 underline">
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <WelcomeBanner />

      <ActiveAlertsBanners stats={stats} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Columna Izquierda: Stats y Acciones (1/3) */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          <NetworkInfoWidget />
          <InventoryStatsWidget stats={stats} />
          <QuickActionsWidget />
        </div>

        {/* Columna Derecha: Gráfico y Movimientos (2/3) */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          <div className="card flex-1 flex flex-col">
            <div className="card-header border-b border-white/5 bg-surface-400/20">
              <h3 className="text-sm font-bold text-gray-200">Ocupación por Línea de Mercado</h3>
            </div>
            <div className="card-body p-4 flex-1">
              <OccupancyChart marketLines={stats.marketLines} chartReady={chartReady} />
            </div>
          </div>

          <div className="card">
            <div className="card-header border-b border-white/5 bg-surface-400/20">
              <h3 className="text-sm font-bold text-gray-200">Movimientos Recientes</h3>
            </div>
            <div className="card-body p-0">
              <RecentMovementsWidget alerts={stats.recentAlerts} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
