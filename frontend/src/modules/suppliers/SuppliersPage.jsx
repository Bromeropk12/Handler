import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, MapPin, Phone, Mail, Box } from 'lucide-react';
import { suppliersAPI } from '../../services/api';

const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    market_lines: '',
    phone: '',
    email: '',
    address: ''
  });

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const response = await suppliersAPI.getSuppliers();
      setSuppliers(response.data.data.suppliers);
    } catch (err) {
      console.error('Error al cargar proveedores', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenModal = (supplier = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        market_lines: supplier.market_lines || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || ''
      });
    } else {
      setEditingSupplier(null);
      setFormData({ name: '', market_lines: '', phone: '', email: '', address: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await suppliersAPI.updateSupplier(editingSupplier.id, formData);
      } else {
        await suppliersAPI.createSupplier(formData);
      }
      setIsModalOpen(false);
      loadSuppliers();
    } catch (err) {
      alert(err.message || 'Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este proveedor?')) {
      try {
        await suppliersAPI.deleteSupplier(id);
        loadSuppliers();
      } catch (err) {
        alert(err.message || 'Error al eliminar. Asegúrese de que no tenga muestras asociadas.');
      }
    }
  };

  const currentSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-sga text-white">Directorio de Proveedores</h1>
          <p className="text-sm text-gray-400 mt-1">Gestión de proveedores de materias primas</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-brand-red hover:bg-red-700 text-white rounded-lg transition-colors shadow-lg shadow-brand-red/20 font-medium"
        >
          <Plus size={18} />
          Nuevo Proveedor
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-surface-800 p-4 rounded-xl border border-white/5 flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por Razón Social..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-900 border border-white/10 rounded-lg text-white focus:border-brand-red focus:ring-1 focus:ring-brand-red transition-all"
          />
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-gray-400">Cargando proveedores...</div>
        ) : currentSuppliers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400">No hay proveedores registrados.</div>
        ) : (
          currentSuppliers.map(supplier => (
            <div key={supplier.id} className="bg-surface-800 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-900 flex items-center justify-center border border-white/5">
                    <Box className="text-brand-red" size={20} />
                  </div>
                  <div>
                    <h3 className="font-medium text-white truncate max-w-[200px]">{supplier.name}</h3>
                    <span className="text-xs text-gray-400">{supplier.market_lines || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(supplier)} className="p-1.5 hover:bg-surface-900 text-gray-400 hover:text-white rounded-md transition-colors"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(supplier.id)} className="p-1.5 hover:bg-surface-900 text-gray-400 hover:text-red-500 rounded-md transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
              
              <div className="space-y-3 mt-5">
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <Phone size={14} className="text-gray-500" />
                  <span>{supplier.phone || '-'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <Mail size={14} className="text-gray-500" />
                  <span>{supplier.email || '-'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <MapPin size={14} className="text-gray-500" />
                  <span className="truncate">{supplier.address || '-'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-800 rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-white/5">
              <h2 className="text-xl font-bold font-sga text-white">
                {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 flex flex-col">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Razón Social *</label>
                <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-surface-900 border border-white/10 rounded-lg p-3 text-white focus:border-brand-red" placeholder="Ej. Química ABC" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Líneas de Mercado</label>
                  <input type="text" name="market_lines" value={formData.market_lines} onChange={handleInputChange} className="w-full bg-surface-900 border border-white/10 rounded-lg p-3 text-white focus:border-brand-red" placeholder="Ej. Aseo, Cosméticos" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Teléfono</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full bg-surface-900 border border-white/10 rounded-lg p-3 text-white focus:border-brand-red" placeholder="+57 300 000 0000" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Correo Electrónico</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-surface-900 border border-white/10 rounded-lg p-3 text-white focus:border-brand-red" placeholder="contacto@ejemplo.com" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Dirección</label>
                <textarea name="address" value={formData.address} onChange={handleInputChange} className="w-full bg-surface-900 border border-white/10 rounded-lg p-3 text-white focus:border-brand-red min-h-[80px]" placeholder="Dirección principal" />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg text-gray-300 hover:bg-surface-900">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2.5 bg-brand-red hover:bg-red-700 text-white rounded-lg font-medium shadow-lg shadow-brand-red/20 transition-all">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliersPage;
