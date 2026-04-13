import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, MapPin, Phone, Mail, Check, Upload, Image, Package } from 'lucide-react';
import { suppliersAPI } from '../../services/api';

const MARKET_LINES = ['Cosmética', 'Industrial', 'Farmacéutica'];
const API_BASE = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : 'http://localhost:3001';

const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(null);
  const logoInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    market_lines: [],
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

  const handleMarketLineToggle = (line) => {
    setFormData(prev => {
      const currentLines = Array.isArray(prev.market_lines) ? prev.market_lines : [];
      const newLines = currentLines.includes(line)
        ? currentLines.filter(l => l !== line)
        : [...currentLines, line];
      return { ...prev, market_lines: newLines };
    });
  };

  const handleOpenModal = (supplier = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      const ml = supplier.market_lines;
      setFormData({
        name: supplier.name,
        market_lines: Array.isArray(ml) ? ml : (ml ? ml.split(',').map(s => s.trim()) : []),
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || ''
      });
    } else {
      setEditingSupplier(null);
      setFormData({ name: '', market_lines: [], phone: '', email: '', address: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        market_lines: Array.isArray(formData.market_lines) ? formData.market_lines : []
      };
      if (editingSupplier) {
        await suppliersAPI.updateSupplier(editingSupplier.id, dataToSend);
      } else {
        await suppliersAPI.createSupplier(dataToSend);
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

  const handleLogoUpload = async (supplierId, file) => {
    if (!file) return;
    if (file.type !== 'image/png') {
      alert('Solo se permiten archivos PNG');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo no debe superar 5MB');
      return;
    }
    try {
      setUploadingLogo(supplierId);
      await suppliersAPI.uploadLogo(supplierId, file);
      loadSuppliers();
    } catch (err) {
      alert(err.message || 'Error al subir logo');
    } finally {
      setUploadingLogo(null);
    }
  };

  const getLogoUrl = (supplier) => {
    // Si ya es una URL completa (raro)
    if (supplier.logo_url && supplier.logo_url.startsWith('http')) return supplier.logo_url;
    // Usar ruta relativa servida por el frontend (desde public/recursos)
    if (supplier.logo_url) return supplier.logo_url;
    if (supplier.logo_path) return `/${supplier.logo_path}`;
    return null;
  };

  const getInitials = (name) => {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  };

  const currentSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatMarketLines = (lines) => {
    if (Array.isArray(lines)) return lines;
    if (typeof lines === 'string') return lines.split(',').map(s => s.trim());
    return [];
  };

  const getMarketLineColor = (line) => {
    const colors = {
      'Cosmética': 'bg-pink-500/15 text-pink-400 border-pink-500/30',
      'Industrial': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      'Farmacéutica': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
    };
    return colors[line] || 'bg-gray-500/15 text-gray-400 border-gray-500/30';
  };

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
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Package size={14} />
          <span>{currentSuppliers.length} proveedores</span>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-gray-400">Cargando proveedores...</div>
        ) : currentSuppliers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400">No hay proveedores registrados.</div>
        ) : (
          currentSuppliers.map(supplier => {
            const logoUrl = getLogoUrl(supplier);
            const lines = formatMarketLines(supplier.market_lines);

            return (
              <div key={supplier.id} className="bg-surface-800 border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-all duration-300 group">
                {/* Logo Area */}
                <div className="relative bg-white/[0.03] p-6 flex items-center justify-center min-h-[120px] border-b border-white/5">
                  {logoUrl ? (
                    <img 
                      src={logoUrl} 
                      alt={`Logo ${supplier.name}`}
                      className="max-h-[80px] max-w-[180px] object-contain filter brightness-0 invert opacity-80 group-hover:opacity-100 transition-opacity"
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    />
                  ) : null}
                  <div 
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-red/20 to-brand-red/5 border border-brand-red/20 items-center justify-center text-brand-red font-bold text-xl ${logoUrl ? 'hidden' : 'flex'}`}
                  >
                    {getInitials(supplier.name)}
                  </div>

                  {/* Upload logo overlay */}
                  <button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/png';
                      input.onchange = (e) => handleLogoUpload(supplier.id, e.target.files[0]);
                      input.click();
                    }}
                    disabled={uploadingLogo === supplier.id}
                    className="absolute top-2 right-2 p-1.5 bg-surface-900/80 backdrop-blur-sm rounded-lg text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all border border-white/10 hover:border-white/20"
                    title="Cambiar logo (PNG 500×500)"
                  >
                    {uploadingLogo === supplier.id ? (
                      <div className="w-4 h-4 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload size={14} />
                    )}
                  </button>
                </div>

                {/* Info */}
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-white text-lg">{supplier.name}</h3>
                      {supplier.sample_count > 0 && (
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">{supplier.sample_count} muestras</span>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(supplier)} className="p-1.5 hover:bg-surface-900 text-gray-400 hover:text-white rounded-md transition-colors"><Edit2 size={15} /></button>
                      <button onClick={() => handleDelete(supplier.id)} className="p-1.5 hover:bg-surface-900 text-gray-400 hover:text-red-500 rounded-md transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </div>

                  {/* Market Lines badges */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {lines.map(line => (
                      <span key={line} className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getMarketLineColor(line)}`}>
                        {line}
                      </span>
                    ))}
                  </div>

                  {/* Contact info */}
                  <div className="space-y-2">
                    {supplier.phone && (
                      <div className="flex items-center gap-2.5 text-sm text-gray-400">
                        <Phone size={13} className="text-gray-600 shrink-0" />
                        <span>{supplier.phone}</span>
                      </div>
                    )}
                    {supplier.email && (
                      <div className="flex items-center gap-2.5 text-sm text-gray-400">
                        <Mail size={13} className="text-gray-600 shrink-0" />
                        <span className="truncate">{supplier.email}</span>
                      </div>
                    )}
                    {supplier.address && (
                      <div className="flex items-center gap-2.5 text-sm text-gray-400">
                        <MapPin size={13} className="text-gray-600 shrink-0" />
                        <span className="truncate">{supplier.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
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
              
              {/* Checklist de Líneas de Mercado */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Líneas de Mercado</label>
                <div className="grid grid-cols-1 gap-2 bg-surface-900 border border-white/10 rounded-lg p-3">
                  {MARKET_LINES.map(line => {
                    const isSelected = Array.isArray(formData.market_lines) && formData.market_lines.includes(line);
                    return (
                      <button
                        key={line}
                        type="button"
                        onClick={() => handleMarketLineToggle(line)}
                        className={`flex items-center gap-3 p-2.5 rounded-lg transition-all text-left ${
                          isSelected 
                            ? 'bg-brand-red/20 border border-brand-red/40 text-white' 
                            : 'bg-transparent border border-transparent text-gray-400 hover:bg-surface-800'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${
                          isSelected ? 'bg-brand-red border-brand-red' : 'border-gray-600'
                        }`}>
                          {isSelected && <Check size={14} className="text-white" />}
                        </div>
                        <span className="text-sm font-medium">{line}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Teléfono</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full bg-surface-900 border border-white/10 rounded-lg p-3 text-white focus:border-brand-red" placeholder="+57 300 000 0000" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Correo Electrónico</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-surface-900 border border-white/10 rounded-lg p-3 text-white focus:border-brand-red" placeholder="contacto@ejemplo.com" />
                </div>
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
                  {editingSupplier ? 'Actualizar' : 'Guardar'}
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
