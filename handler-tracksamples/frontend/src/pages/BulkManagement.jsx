import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Plus, Search, Edit, Trash2, AlertCircle } from 'lucide-react';

const GHS_CLASSES = ['Inflamable', 'Corrosivo', 'Tóxico', 'Comburente', 'Irritante', 'Sin Riesgo', 'Peróxidos', 'Explosivo'];
const DIMENSIONS = ['1x1', '1x2', '2x1', '2x2'];

export default function BulkManagement() {
  const [bulks, setBulks] = useState([]);
  const [marketLines, setMarketLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBulk, setEditingBulk] = useState(null);
  const [search, setSearch] = useState('');
  const [filterMarketLine, setFilterMarketLine] = useState('');

  const [formData, setFormData] = useState({
    name: '', provider: '', lot: '', manufacture_date: '', expiration_date: '',
    total_weight_grams: '', ghs_danger_class: '', market_line_id: '', dimensions: '1x1'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [bulksData, linesData] = await Promise.all([
        api.globalSamples.getAll(),
        api.marketLines.getAll()
      ]);
      setBulks(bulksData);
      setMarketLines(linesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBulk) {
        await api.globalSamples.update(editingBulk.id, formData);
      } else {
        await api.globalSamples.create(formData);
      }
      setShowModal(false);
      setEditingBulk(null);
      setFormData({
        name: '', provider: '', lot: '', manufacture_date: '', expiration_date: '',
        total_weight_grams: '', ghs_danger_class: '', market_line_id: '', dimensions: '1x1'
      });
      loadData();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleEdit = (bulk) => {
    setEditingBulk(bulk);
    setFormData({
      name: bulk.name, provider: bulk.provider, lot: bulk.lot,
      manufacture_date: bulk.manufacture_date, expiration_date: bulk.expiration_date,
      total_weight_grams: bulk.total_weight_grams, ghs_danger_class: bulk.ghs_danger_class || '',
      market_line_id: bulk.market_line_id, dimensions: bulk.dimensions || '1x1'
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar esta muestra?')) return;
    try {
      await api.globalSamples.delete(id);
      loadData();
    } catch (error) {
      alert(error.message);
    }
  };

  const filteredBulks = bulks.filter(b => {
    const matchesSearch = !search || b.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.provider?.toLowerCase().includes(search.toLowerCase()) || b.lot?.toLowerCase().includes(search.toLowerCase());
    const matchesLine = !filterMarketLine || b.market_line_id == filterMarketLine;
    return matchesSearch && matchesLine;
  });

  const getStatusBadge = (expirationDate) => {
    const expDate = new Date(expirationDate);
    const now = new Date();
    const days = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
    
    if (days < 0) return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Vencido</span>;
    if (days <= 30) return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Por vencer</span>;
    return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Vigente</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Muestras Bulk</h1>
          <p className="text-gray-500">Gestión de materias primas globales</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" /> Nueva Muestra
        </button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, proveedor o lote..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <select
          value={filterMarketLine}
          onChange={(e) => setFilterMarketLine(e.target.value)}
          className="input-field w-48"
        >
          <option value="">Todas las líneas</option>
          {marketLines.map(line => <option key={line.id} value={line.id}>{line.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Nombre</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Proveedor</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Lote</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Peso (g)</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Vencimiento</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">SGA</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Estado</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBulks.length === 0 ? (
                <tr><td colSpan="8" className="px-6 py-12 text-center text-gray-500">No hay muestras</td></tr>
              ) : (
                filteredBulks.map(bulk => (
                  <tr key={bulk.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{bulk.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{bulk.provider}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{bulk.lot}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{bulk.total_weight_grams}g</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{bulk.expiration_date}</td>
                    <td className="px-6 py-4">
                      {bulk.ghs_danger_class && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">{bulk.ghs_danger_class}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(bulk.expiration_date)}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleEdit(bulk)} className="text-blue-600 hover:text-blue-800 p-1"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(bulk.id)} className="text-red-600 hover:text-red-800 p-1 ml-2"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-6">{editingBulk ? 'Editar' : 'Nueva'} Muestra Bulk</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                <input type="text" value={formData.provider} onChange={(e) => setFormData({...formData, provider: e.target.value})} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lote</label>
                <input type="text" value={formData.lot} onChange={(e) => setFormData({...formData, lot: e.target.value})} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Manufactura</label>
                <input type="date" value={formData.manufacture_date} onChange={(e) => setFormData({...formData, manufacture_date: e.target.value})} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Vencimiento</label>
                <input type="date" value={formData.expiration_date} onChange={(e) => setFormData({...formData, expiration_date: e.target.value})} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Peso Total (g)</label>
                <input type="number" value={formData.total_weight_grams} onChange={(e) => setFormData({...formData, total_weight_grams: e.target.value})} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Línea de Mercado</label>
                <select value={formData.market_line_id} onChange={(e) => setFormData({...formData, market_line_id: e.target.value})} className="input-field" required>
                  <option value="">Seleccionar...</option>
                  {marketLines.map(line => <option key={line.id} value={line.id}>{line.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clase SGA</label>
                <select value={formData.ghs_danger_class} onChange={(e) => setFormData({...formData, ghs_danger_class: e.target.value})} className="input-field">
                  <option value="">Seleccionar...</option>
                  {GHS_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dimensiones</label>
                <select value={formData.dimensions} onChange={(e) => setFormData({...formData, dimensions: e.target.value})} className="input-field">
                  {DIMENSIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="col-span-2 flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => { setShowModal(false); setEditingBulk(null); }} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">{editingBulk ? 'Actualizar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}