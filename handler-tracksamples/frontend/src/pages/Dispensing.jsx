import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Scissors, Package, Search } from 'lucide-react';

export default function Dispensing() {
  const [bulks, setBulks] = useState([]);
  const [marketLines, setMarketLines] = useState([]);
  const [selectedBulk, setSelectedBulk] = useState(null);
  const [subdivisions, setSubdivisions] = useState(1);
  const [weightPerSubdivision, setWeightPerSubdivision] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [bulksData, linesData] = await Promise.all([
        api.globalSamples.getAll(),
        api.marketLines.getAll()
      ]);
      setBulks(bulksData.filter(b => b.total_weight_grams > 0));
      setMarketLines(linesData);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const filteredBulks = bulks.filter(b => 
    !search || b.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDispense = async () => {
    if (!selectedBulk || !subdivisions || !weightPerSubdivision) return;

    const totalWeight = subdivisions * parseFloat(weightPerSubdivision);
    if (totalWeight > selectedBulk.total_weight_grams) {
      alert('Stock insuficiente');
      return;
    }

    setLoading(true);
    try {
      const result = await api.dispensedSamples.dispense(
        selectedBulk.id,
        subdivisions,
        parseFloat(weightPerSubdivision)
      );
      alert(result.message);
      setSelectedBulk(null);
      setSubdivisions(1);
      setWeightPerSubdivision('');
      loadData();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dispensación</h1>
        <p className="text-gray-500">Crear muestras individuales a partir de Bulk</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">Seleccionar Muestra Bulk</h3>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredBulks.map(bulk => (
              <div
                key={bulk.id}
                onClick={() => setSelectedBulk(bulk)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedBulk?.id === bulk.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-800">{bulk.name}</p>
                    <p className="text-sm text-gray-500">Lote: {bulk.lot}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">{bulk.total_weight_grams}g</p>
                    <p className="text-xs text-gray-500">disponible</p>
                  </div>
                </div>
              </div>
            ))}
            {filteredBulks.length === 0 && (
              <p className="text-center py-8 text-gray-500">No hay muestras disponibles</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Scissors className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">Configurar Dispensación</h3>
          </div>

          {selectedBulk ? (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Muestra seleccionada</p>
                <p className="font-medium text-gray-800">{selectedBulk.name}</p>
                <p className="text-sm text-gray-500">Stock disponible: {selectedBulk.total_weight_grams}g</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Subdivisiones</label>
                <input
                  type="number"
                  min="1"
                  value={subdivisions}
                  onChange={(e) => setSubdivisions(parseInt(e.target.value) || 1)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Peso por subdivisión (g)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={weightPerSubdivision}
                  onChange={(e) => setWeightPerSubdivision(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-gray-600">Peso total a dispensar:</span>
                  <span className="font-medium text-blue-600">
                    {subdivisions * (parseFloat(weightPerSubdivision) || 0)}g
                  </span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-gray-600">Stock restante:</span>
                  <span className="font-medium text-gray-800">
                    {selectedBulk.total_weight_grams - (subdivisions * (parseFloat(weightPerSubdivision) || 0))}g
                  </span>
                </div>
              </div>

              <button
                onClick={handleDispense}
                disabled={loading || !weightPerSubdivision}
                className="btn-primary w-full"
              >
                {loading ? 'Dispensando...' : 'Dispensar Muestras'}
              </button>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Scissors className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Seleccione una muestra Bulk para continuar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}