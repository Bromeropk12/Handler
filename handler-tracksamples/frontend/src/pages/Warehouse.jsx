import { useState, useEffect } from 'react';
import { api } from '../services/api';
import WarehouseGrid from '../components/WarehouseGrid';
import { Grid, RefreshCw, Package } from 'lucide-react';

export default function Warehouse() {
  const [marketLines, setMarketLines] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [selectedLine, setSelectedLine] = useState('');
  const [selectedShelf, setSelectedShelf] = useState('');
  const [samples, setSamples] = useState([]);
  const [selectedSample, setSelectedSample] = useState(null);
  const [loading, setLoading] = useState(false);
  const [organizing, setOrganizing] = useState(false);

  useEffect(() => {
    loadMarketLines();
  }, []);

  useEffect(() => {
    if (selectedLine) loadShelves();
  }, [selectedLine]);

  useEffect(() => {
    if (selectedShelf) loadSamples();
  }, [selectedShelf]);

  const loadMarketLines = async () => {
    try {
      const data = await api.marketLines.getAll();
      setMarketLines(data);
      if (data.length > 0) setSelectedLine(data[0].id);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadShelves = async () => {
    try {
      const data = await api.shelves.getAll(selectedLine);
      setShelves(data);
      if (data.length > 0) setSelectedShelf(data[0].id);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadSamples = async () => {
    setLoading(true);
    try {
      const data = await api.dispensedSamples.getAll(selectedShelf, 'stored');
      setSamples(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoOrganize = async () => {
    if (!selectedLine) return;
    setOrganizing(true);
    try {
      const result = await api.dispensedSamples.autoOrganize(selectedLine);
      alert(`Se organizaron ${result.organized} muestras`);
      loadSamples();
    } catch (error) {
      alert(error.message);
    } finally {
      setOrganizing(false);
    }
  };

  const handleCellClick = (sample) => {
    setSelectedSample(sample);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Almacén 2D</h1>
          <p className="text-gray-500">Visualización e interacción del almacén</p>
        </div>
        <button 
          onClick={handleAutoOrganize} 
          disabled={organizing}
          className="btn-primary flex items-center gap-2"
        >
          <RefreshCw className={`w-5 h-5 ${organizing ? 'animate-spin' : ''}`} />
          {organizing ? 'Organizando...' : 'Auto Organizar'}
        </button>
      </div>

      <div className="flex gap-4">
        <div className="w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">Línea de Mercado</label>
          <select
            value={selectedLine}
            onChange={(e) => setSelectedLine(e.target.value)}
            className="input-field"
          >
            {marketLines.map(line => (
              <option key={line.id} value={line.id}>{line.name}</option>
            ))}
          </select>
        </div>
        <div className="w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">Anaquel</label>
          <select
            value={selectedShelf}
            onChange={(e) => setSelectedShelf(e.target.value)}
            className="input-field"
          >
            {shelves.map(shelf => (
              <option key={shelf.id} value={shelf.id}>{shelf.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Grid className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">Vista 2D del Anaquel</h3>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <WarehouseGrid 
                samples={samples} 
                onCellClick={handleCellClick}
                selectedSample={selectedSample}
              />
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              {['Inflamable', 'Corrosivo', 'Tóxico', 'Comburente', 'Irritante', 'Sin Riesgo'].map(cls => (
                <div key={cls} className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded ${
                    cls === 'Inflamable' ? 'bg-red-500' :
                    cls === 'Corrosivo' ? 'bg-yellow-500' :
                    cls === 'Tóxico' ? 'bg-purple-500' :
                    cls === 'Comburente' ? 'bg-blue-500' :
                    cls === 'Irritante' ? 'bg-orange-500' :
                    'bg-green-500'
                  }`}></div>
                  <span className="text-xs text-gray-600">{cls}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalles de Muestra</h3>
          {selectedSample ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500">Nombre</p>
                <p className="font-medium text-gray-800">{selectedSample.sample_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Lote</p>
                <p className="font-medium text-gray-800">{selectedSample.lot}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Peso</p>
                <p className="font-medium text-gray-800">{selectedSample.weight_grams}g</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Código QR</p>
                <p className="font-mono text-sm text-gray-600 break-all">{selectedSample.qr_code}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Clase SGA</p>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  {selectedSample.ghs_danger_class || 'Sin clasificar'}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Posición</p>
                <p className="font-medium text-gray-800">
                  X: {selectedSample.position_x}, Y: {selectedSample.position_y}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Seleccione una muestra en el grid</p>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Leyenda de Dimensiones</h3>
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-600">1x1 (1 celda)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-600">1x2 (2 celdas)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-8 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-600">2x1 (2 celdas)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-600">2x2 (4 celdas)</span>
          </div>
        </div>
      </div>
    </div>
  );
}