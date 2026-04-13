import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AlertTriangle, Package, Warehouse, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalBulk: 0,
    totalDispensed: 0,
    totalStored: 0,
    totalDispatched: 0,
    marketLines: [],
    alerts: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [bulkData, dispensedData] = await Promise.all([
        api.globalSamples.getAll(),
        api.dispensedSamples.getAll()
      ]);

      const expired = bulkData.filter(b => new Date(b.expiration_date) < new Date());
      const nearExpiry = bulkData.filter(b => {
        const expDate = new Date(b.expiration_date);
        const now = new Date();
        const daysUntilExpiry = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
      });

      const stored = dispensedData.filter(d => d.status === 'stored');
      const dispatched = dispensedData.filter(d => d.status === 'dispatched');

      const marketLineStats = {};
      stored.forEach(s => {
        const ml = s.market_line_name || 'Sin línea';
        if (!marketLineStats[ml]) marketLineStats[ml] = 0;
        marketLineStats[ml]++;
      });

      setStats({
        totalBulk: bulkData.length,
        totalDispensed: dispensedData.length,
        totalStored: stored.length,
        totalDispatched: dispatched.length,
        marketLines: Object.entries(marketLineStats).map(([name, count]) => ({ name, count })),
        alerts: [
          ...expired.map(b => ({ type: 'expired', product: b.name, lot: b.lot, message: 'Producto vencido' })),
          ...nearExpiry.map(b => ({ type: 'near_expiry', product: b.name, lot: b.lot, message: 'Vence en 30 días' }))
        ]
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500">Resumen del sistema de gestión de muestras</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Muestras Bulk</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalBulk}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Warehouse className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">En Almacén</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalStored}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Despachadas</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalDispatched}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Dispensado</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalDispensed}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Ocupación por Línea de Mercado</h3>
          {stats.marketLines.length > 0 ? (
            <div className="space-y-3">
              {stats.marketLines.map((ml) => {
                const percentage = stats.totalStored > 0 ? Math.round((ml.count / stats.totalStored) * 100) : 0;
                return (
                  <div key={ml.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{ml.name}</span>
                      <span className="text-gray-500">{ml.count} muestras ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay muestras en almacén</p>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Alertas</h3>
          {stats.alerts.length > 0 ? (
            <div className="space-y-3">
              {stats.alerts.map((alert, idx) => (
                <div 
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    alert.type === 'expired' ? 'bg-red-50' : 'bg-yellow-50'
                  }`}
                >
                  <AlertTriangle className={`w-5 h-5 ${alert.type === 'expired' ? 'text-red-600' : 'text-yellow-600'}`} />
                  <div>
                    <p className={`text-sm font-medium ${alert.type === 'expired' ? 'text-red-800' : 'text-yellow-800'}`}>
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-600">{alert.product} (Lote: {alert.lot})</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Sin alertas</p>
          )}
        </div>
      </div>
    </div>
  );
}