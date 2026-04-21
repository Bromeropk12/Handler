import React, { useState, useEffect } from 'react';
import { warehouseAPI, suppliersAPI, shelfSuppliersAPI, marketLinesAPI } from '../../services/api';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, CheckIcon, CubeIcon } from '@heroicons/react/24/outline';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';

const ShelfManagement = () => {
  const [shelves, setShelves] = useState([]);
  const [marketLines, setMarketLines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingShelf, setEditingShelf] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    market_line_id: '',
    grid_width: 10,
    grid_height: 10,
    shelf_depth: 10,
    shelf_type: 'storage',
    supplier_ids: []
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [shelvesResp, mlResp, suppResp] = await Promise.all([
        warehouseAPI.getShelves({ limit: 200 }),
        marketLinesAPI.getAll(),
        suppliersAPI.getSuppliers()
      ]);
      setShelves(shelvesResp.data.data.shelves || []);
      setMarketLines(mlResp.data.data.marketLines || mlResp.data.data || []);
      setSuppliers(suppResp.data.data.suppliers || []);
    } catch (err) {
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = async (shelf = null) => {
    if (shelf) {
      setEditingShelf(shelf);
      try {
        const suppResp = await shelfSuppliersAPI.getByShelf(shelf.id);
        const supplierIds = (suppResp.data.data.suppliers || []).map(s => s.supplier_id);
        setFormData({
          name: shelf.name,
          market_line_id: shelf.market_line_id,
          grid_width: shelf.grid_width,
          grid_height: shelf.grid_height,
          shelf_depth: shelf.shelf_depth,
          shelf_type: shelf.shelf_type || 'storage',
          supplier_ids: supplierIds
        });
      } catch {
        setFormData({
          name: shelf.name,
          market_line_id: shelf.market_line_id,
          grid_width: shelf.grid_width,
          grid_height: shelf.grid_height,
          shelf_depth: shelf.shelf_depth,
          shelf_type: shelf.shelf_type || 'storage',
          supplier_ids: []
        });
      }
    } else {
      setEditingShelf(null);
      setFormData({
        name: '',
        market_line_id: marketLines[0]?.id || '',
        grid_width: 10,
        grid_height: 10,
        shelf_depth: 10,
        shelf_type: 'storage',
        supplier_ids: []
      });
    }
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingShelf(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.market_line_id) {
      setError('Nombre y línea de mercado son requeridos');
      return;
    }
    try {
      if (editingShelf) {
        await warehouseAPI.updateShelf(editingShelf.id, {
          name: formData.name,
          grid_width: formData.grid_width,
          grid_height: formData.grid_height,
          shelf_depth: formData.shelf_depth,
          shelf_type: formData.shelf_type
        });
        const existingSuppliers = await shelfSuppliersAPI.getByShelf(editingShelf.id);
        for (const s of (existingSuppliers.data.data.suppliers || [])) {
          await shelfSuppliersAPI.remove(s.id);
        }
        for (let i = 0; i < formData.supplier_ids.length; i++) {
          await shelfSuppliersAPI.add({
            shelf_id: editingShelf.id,
            supplier_id: formData.supplier_ids[i],
            is_primary: i === 0
          });
        }
        setSuccess('Anaquel actualizado exitosamente');
      } else {
        await warehouseAPI.createShelf(formData);
        setSuccess('Anaquel creado exitosamente');
      }
      handleCloseModal();
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    }
  };

  const handleDelete = async (shelf) => {
    if (!window.confirm(`Esta seguro de eliminar "${shelf.name}"?`)) return;
    try {
      await warehouseAPI.deleteShelf(shelf.id);
      setSuccess('Anaquel eliminado exitosamente');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar');
    }
  };

  const toggleSupplier = (supplierId) => {
    setFormData(prev => ({
      ...prev,
      supplier_ids: prev.supplier_ids.includes(supplierId)
        ? prev.supplier_ids.filter(id => id !== supplierId)
        : [...prev.supplier_ids, supplierId]
    }));
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><LoadingSpinner size="large" text="Cargando anaqueles..." /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestion de Anaqueles</h1>
          <p className="text-sm text-gray-400 mt-1">Administra los anaqueles del almacen y sus proveedores</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" /> Nuevo Anaquel
        </button>
      </div>

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 text-green-400">
          <CheckIcon className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{success}</span>
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
          <XMarkIcon className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shelves.length > 0 ? shelves.map(shelf => (
          <div key={shelf.id} className="bg-gray-900/50 rounded-xl border border-gray-800 p-5 hover:border-gray-700 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <CubeIcon className="w-5 h-5 text-primary-400" />
                <h3 className="font-bold text-white">{shelf.name}</h3>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => handleOpenModal(shelf)} className="p-1.5 text-gray-400 hover:text-primary-400 transition-colors">
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(shelf)} className="p-1.5 text-gray-400 hover:text-red-400 transition-colors">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-3">{shelf.market_line_name}</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                <p className="text-sm font-bold text-primary-400">{shelf.grid_width}</p>
                <p className="text-[10px] text-gray-500">Columnas</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                <p className="text-sm font-bold text-yellow-400">{shelf.grid_height}</p>
                <p className="text-[10px] text-gray-500">Niveles</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                <p className="text-sm font-bold text-green-400">{shelf.shelf_depth || 10}</p>
                <p className="text-[10px] text-gray-500">Profundidad</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Capacidad: {shelf.total_capacity || shelf.grid_width * shelf.grid_height * (shelf.shelf_depth || 10)}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                shelf.shelf_type === 'bulk_temporary' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              }`}>
                {shelf.shelf_type === 'bulk_temporary' ? 'Bulk Temporal' : 'Almacenamiento'}
              </span>
            </div>
            {shelf.occupied_count > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500">Ocupacion</span>
                  <span className="text-primary-400">{shelf.occupancy_percentage || 0}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1.5">
                  <div className="bg-primary-500 h-full rounded-full" style={{ width: `${shelf.occupancy_percentage || 0}%` }}></div>
                </div>
              </div>
            )}
          </div>
        )) : (
          <div className="col-span-full py-12 text-center text-gray-500">
            No hay anaqueles registrados
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={handleCloseModal} title={editingShelf ? 'Editar Anaquel' : 'Nuevo Anaquel'}
        footer={
          <>
            <button onClick={handleCloseModal} className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors">Cancelar</button>
            <button onClick={handleSubmit} className="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium">
              {editingShelf ? 'Actualizar' : 'Crear'}
            </button>
          </>
        }>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="Ej: BASF #1" autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Linea de Mercado</label>
            <select value={formData.market_line_id} onChange={e => setFormData({ ...formData, market_line_id: e.target.value })}
              className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500">
              <option value="">Seleccionar...</option>
              {marketLines.map(ml => <option key={ml.id} value={ml.id}>{ml.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Columnas (X)</label>
              <input type="text" inputMode="numeric" value={formData.grid_width} onChange={e => setFormData({ ...formData, grid_width: parseInt(e.target.value.replace(/\D/g, '')) || '' })}
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Niveles (Y)</label>
              <input type="text" inputMode="numeric" value={formData.grid_height} onChange={e => setFormData({ ...formData, grid_height: parseInt(e.target.value.replace(/\D/g, '')) || '' })}
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Profundidad (Z)</label>
              <input type="text" inputMode="numeric" value={formData.shelf_depth} onChange={e => setFormData({ ...formData, shelf_depth: parseInt(e.target.value.replace(/\D/g, '')) || '' })}
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Tipo de Anaquel</label>
            <select value={formData.shelf_type} onChange={e => setFormData({ ...formData, shelf_type: e.target.value })}
              className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500">
              <option value="storage">Almacenamiento</option>
              <option value="bulk_temporary">Bulk Temporal</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Proveedores</label>
            <div className="space-y-2 max-h-40 overflow-y-auto bg-gray-900/50 rounded-lg p-3 border border-gray-700">
              {suppliers.length > 0 ? suppliers.map(supplier => (
                <label key={supplier.id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-800/50 rounded-lg p-2 transition-colors">
                  <input type="checkbox" checked={formData.supplier_ids.includes(supplier.id)} onChange={() => toggleSupplier(supplier.id)}
                    className="w-4 h-4 rounded border-gray-600 text-primary-500 focus:ring-primary-500/50" />
                  <span className="text-sm text-gray-300">{supplier.name}</span>
                  {formData.supplier_ids.indexOf(supplier.id) === 0 && formData.supplier_ids.length > 0 && (
                    <span className="text-[10px] text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded">Principal</span>
                  )}
                </label>
              )) : (
                <p className="text-sm text-gray-500 text-center py-2">No hay proveedores registrados</p>
              )}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ShelfManagement;