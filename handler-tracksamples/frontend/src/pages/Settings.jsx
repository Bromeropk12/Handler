import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Settings as SettingsIcon, Save, Plus, Trash2 } from 'lucide-react';

export default function Settings() {
  const [marketLines, setMarketLines] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [newLineName, setNewLineName] = useState('');
  const [showLineModal, setShowLineModal] = useState(false);
  const [showShelfModal, setShowShelfModal] = useState(false);
  const [newShelf, setNewShelf] = useState({ name: '', market_line_id: '', total_capacity: 100 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [linesData, shelvesData] = await Promise.all([
        api.marketLines.getAll(),
        api.shelves.getAll()
      ]);
      setMarketLines(linesData);
      setShelves(shelvesData);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleCreateLine = async () => {
    if (!newLineName.trim()) return;
    setLoading(true);
    try {
      await api.marketLines.create({ name: newLineName });
      setNewLineName('');
      setShowLineModal(false);
      loadData();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLine = async (id) => {
    if (!confirm('¿Está seguro de eliminar esta línea de mercado?')) return;
    try {
      await api.marketLines.delete(id);
      loadData();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleCreateShelf = async () => {
    if (!newShelf.name || !newShelf.market_line_id) return;
    setLoading(true);
    try {
      await api.shelves.create(newShelf);
      setNewShelf({ name: '', market_line_id: '', total_capacity: 100 });
      setShowShelfModal(false);
      loadData();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShelf = async (id) => {
    if (!confirm('¿Está seguro de eliminar este anaquel?')) return;
    try {
      await api.shelves.delete(id);
      loadData();
    } catch (error) {
      alert(error.message);
    }
  };

  const getShelvesByLine = (lineId) => shelves.filter(s => s.market_line_id == lineId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Configuración</h1>
        <p className="text-gray-500">Administrar líneas de mercado y anaqueles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">Líneas de Mercado</h3>
            </div>
            <button onClick={() => setShowLineModal(true)} className="btn-primary text-sm py-2">
              <Plus className="w-4 h-4 mr-1" /> Nueva
            </button>
          </div>

          <div className="space-y-3">
            {marketLines.map(line => (
              <div key={line.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-800">{line.name}</span>
                <button 
                  onClick={() => handleDeleteLine(line.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {marketLines.length === 0 && (
              <p className="text-center py-4 text-gray-500">No hay líneas de mercado</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">Anaqueles por Línea</h3>
            </div>
            <button onClick={() => {
              setNewShelf({ ...newShelf, market_line_id: marketLines[0]?.id || '' });
              setShowShelfModal(true);
            }} className="btn-primary text-sm py-2">
              <Plus className="w-4 h-4 mr-1" /> Nuevo
            </button>
          </div>

          <div className="space-y-4">
            {marketLines.map(line => {
              const lineShelves = getShelvesByLine(line.id);
              return (
                <div key={line.id} className="border border-gray-200 rounded-lg p-3">
                  <h4 className="font-medium text-gray-800 mb-2">{line.name}</h4>
                  {lineShelves.length > 0 ? (
                    <div className="space-y-2">
                      {lineShelves.map(shelf => (
                        <div key={shelf.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-600">{shelf.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">Cap: {shelf.total_capacity}</span>
                            <button 
                              onClick={() => handleDeleteShelf(shelf.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Sin anaqueles</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showLineModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Nueva Línea de Mercado</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                value={newLineName}
                onChange={(e) => setNewLineName(e.target.value)}
                className="input-field"
                placeholder="Ej: Cosmética, Farmacéutica, Industrial"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowLineModal(false)} className="btn-secondary">Cancelar</button>
              <button onClick={handleCreateLine} disabled={loading} className="btn-primary">
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showShelfModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Nuevo Anaquel</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={newShelf.name}
                  onChange={(e) => setNewShelf({ ...newShelf, name: e.target.value })}
                  className="input-field"
                  placeholder="Ej: Anaquel A1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Línea de Mercado</label>
                <select
                  value={newShelf.market_line_id}
                  onChange={(e) => setNewShelf({ ...newShelf, market_line_id: e.target.value })}
                  className="input-field"
                >
                  <option value="">Seleccionar...</option>
                  {marketLines.map(line => (
                    <option key={line.id} value={line.id}>{line.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad Total</label>
                <input
                  type="number"
                  value={newShelf.total_capacity}
                  onChange={(e) => setNewShelf({ ...newShelf, total_capacity: parseInt(e.target.value) })}
                  className="input-field"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowShelfModal(false)} className="btn-secondary">Cancelar</button>
              <button onClick={handleCreateShelf} disabled={loading} className="btn-primary">
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}