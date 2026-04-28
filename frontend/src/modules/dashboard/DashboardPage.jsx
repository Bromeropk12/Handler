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

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
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
        if (data.success && data.data) {
          setStats(data.data);
        }
      } catch (_err) {
        console.error("Error cargando dashboard:", _err);
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

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <WelcomeBanner />

      <ActiveAlertsBanners stats={stats} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Columna Izquierda: Stats y Acciones (1/3) */}
        <div className="xl:col-span-1 flex flex-col gap-6">
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
