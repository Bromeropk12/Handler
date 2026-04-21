import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertBanner from '../../components/AlertBanner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { analyticsAPI } from '../../services/api';
import {
  BeakerIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [chartReady, setChartReady] = useState(false);
  const [stats, setStats] = useState({
    marketLines: [],
    totalSamples: 0,
    totalShelves: 0,
    avgOccupancy: 0,
    expiredCount: 0,
    warningCount: 0,
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
        // Fallback or handle error
      } finally {
        setLoading(false);
        // Pequeño delay para asegurar que el DOM esté completamente renderizado
        setTimeout(() => setChartReady(true), 100);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="large" text="Cargando dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="card-glass p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-handler-red to-handler-gold" />
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white mb-1">
            Bienvenido a Handler TrackSamples
          </h2>
          <p className="text-gray-400 text-sm">
            Gestión inteligente de inventario de muestras químicas con trazabilidad SGA completa.
          </p>
        </div>
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-handler-red/5 rounded-full blur-2xl" />
      </div>

      {/* Alert Banner */}
      <AlertBanner />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={BeakerIcon}
          value={stats.totalSamples}
          title="Muestras Totales"
          subtitle="En el sistema"
          color="info"
          trend="up"
          trendValue="+12%"
        />
        <StatCard
          icon={BuildingStorefrontIcon}
          value={stats.totalShelves}
          title="Anaqueles"
          subtitle="Configurados"
          color="gold"
        />
        <StatCard
          icon={ChartBarIcon}
          value={`${stats.avgOccupancy}%`}
          title="Ocupación Promedio"
          subtitle="De celdas físicas reales"
          color="success"
        />
        <StatCard
          icon={ExclamationTriangleIcon}
          value={stats.expiredCount + stats.warningCount}
          title="Alertas Activas"
          subtitle={`${stats.expiredCount} vencidas, ${stats.warningCount} próximas`}
          color="danger"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Market Lines */}
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-white">Líneas de Mercado</h3>
          </div>
          <div className="card-body" style={{ height: '300px' }}>
            {stats.marketLines?.length > 0 && chartReady ? (
              <ResponsiveContainer width={300} height={300}>
                <BarChart
                  data={stats.marketLines}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#9ca3af"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    axisLine={{ stroke: '#4b5563' }}
                    tickLine={{ stroke: '#4b5563' }}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    axisLine={{ stroke: '#4b5563' }}
                    tickLine={{ stroke: '#4b5563' }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(55, 65, 81, 0.3)' }}
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '0.5rem',
                      color: '#f3f4f6',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                      fontSize: '12px'
                    }}
                    formatter={(value, name, props) => {
                      const data = props.payload;
                      return [
                        <div key="tooltip-content" className="space-y-1">
                          <div className="font-semibold text-white">{value}% Ocupado</div>
                          <div className="text-xs text-gray-400">
                            {data.occupiedPositions || 0} de {data.totalPositions || 0} posiciones
                          </div>
                          <div className="text-xs text-gray-400">
                            {data.shelves || 0} anaquel{data.shelves !== 1 ? 'es' : ''}
                          </div>
                        </div>,
                        'Ocupación'
                      ];
                    }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '0.25rem' }}
                    animationDuration={300}
                  />
                  <Bar
                    dataKey="occupancy"
                    radius={[6, 6, 0, 0]}
                    animationBegin={0}
                    animationDuration={1200}
                    animationEasing="ease-out"
                  >
                    {
                      stats.marketLines.map((entry, index) => {
                        // Enhanced color mapping with gradients
                        const colorMap = {
                          'bg-pink-500': 'url(#gradient-pink)',
                          'bg-blue-500': 'url(#gradient-blue)',
                          'bg-amber-500': 'url(#gradient-amber)',
                          'bg-green-500': 'url(#gradient-green)',
                          'bg-purple-500': 'url(#gradient-purple)'
                        };
                        const hexColor = colorMap[entry.color] || '#ef4444';
                        return <Cell key={`cell-${index}`} fill={hexColor} stroke={`rgba(255,255,255,0.1)`} strokeWidth={1} />;
                      })
                    }
                  </Bar>

                  {/* Gradient Definitions */}
                  <defs>
                    <linearGradient id="gradient-pink" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ec4899" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#be185d" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="gradient-blue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="gradient-amber" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#d97706" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="gradient-green" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#16a34a" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="gradient-purple" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#9333ea" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                No hay datos de ocupación disponibles
              </div>
            )}
          </div>
        </div>

        {/* Alerts */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-white">Alertas Recientes</h3>
          </div>
          <div className="card-body space-y-3">
            {stats.recentAlerts?.length > 0 ? stats.recentAlerts.map((alert, i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-surface-200 transition-colors">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${alert.type === 'danger' ? 'bg-danger-300' :
                  alert.type === 'warning' ? 'bg-warning-300' :
                    alert.type === 'success' ? 'bg-green-500' :
                      'bg-info-300'
                  }`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-300 leading-snug">{alert.text}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{alert.time}</p>
                </div>
              </div>
            )) : <p className="text-gray-500 text-sm">No hay movimientos recientes.</p>}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold text-white">Acciones Rápidas</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Nueva Muestra', icon: BeakerIcon, path: '/samples' },
              { label: 'Ver Almacén', icon: BuildingStorefrontIcon, path: '/warehouse' },
              { label: 'Despachos', icon: ClockIcon, path: '/dispatch' },
              { label: 'Alertas', icon: ExclamationTriangleIcon, path: '/' },
            ].map(action => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2 p-4 bg-surface-200 rounded-lg 
                           hover:bg-surface-100 hover:border-gray-600 border border-transparent
                           transition-all duration-200 group"
              >
                <action.icon className="w-6 h-6 text-gray-400 group-hover:text-handler-red transition-colors" />
                <span className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
