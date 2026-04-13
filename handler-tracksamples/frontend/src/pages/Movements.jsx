import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { History, Filter } from 'lucide-react';

export default function Movements() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadMovements();
  }, []);

  const loadMovements = async () => {
    try {
      const data = await api.movements.getAll();
      setMovements(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (actionType) => {
    const badges = {
      created: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Creado' },
      dispensed: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Dispensado' },
      auto_organized: { bg: 'bg-cyan-100', text: 'text-cyan-700', label: 'Auto Organizado' },
      relocated: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Reubicado' },
      dispatched: { bg: 'bg-green-100', text: 'text-green-700', label: 'Despachado' },
    };
    const badge = badges[actionType] || { bg: 'bg-gray-100', text: 'text-gray-700', label: actionType };
    return <span className={`px-2 py-1 ${badge.bg} ${badge.text} text-xs rounded-full`}>{badge.label}</span>;
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('es-CO', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const filteredMovements = movements.filter(m => 
    !filter || m.action_type.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Movimientos</h1>
          <p className="text-gray-500">Historial de trazabilidad del sistema</p>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Filtrar por tipo de acción..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Fecha/Hora</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Usuario</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Acción</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">ID Muestra</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Tipo</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <History className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No hay movimientos registrados</p>
                  </td>
                </tr>
              ) : (
                filteredMovements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(movement.timestamp)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {movement.username || 'Sistema'}
                    </td>
                    <td className="px-6 py-4">
                      {getActionBadge(movement.action_type)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                      {movement.sample_id?.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {movement.sample_type === 'global' ? 'Bulk' : 'Dispensada'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {movement.details ? JSON.stringify(movement.details) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}