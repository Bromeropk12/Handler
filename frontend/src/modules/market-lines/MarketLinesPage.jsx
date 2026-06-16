import React, { useState, useEffect } from 'react';
import { marketLinesAPI } from '../../services/api';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';

const MarketLinesPage = () => {
  const [marketLines, setMarketLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLine, setEditingLine] = useState(null);
  const [formData, setFormData] = useState({ name: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchMarketLines();
  }, []);

  const fetchMarketLines = async () => {
    try {
      setLoading(true);
      const resp = await marketLinesAPI.getAll();
      setMarketLines(resp.data.marketLines || []);
    } catch (err) {
      setError('Error al cargar las líneas de mercado');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (line = null) => {
    if (line) {
      setEditingLine(line);
      setFormData({ name: line.name });
    } else {
      setEditingLine(null);
      setFormData({ name: '' });
    }
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingLine(null);
    setFormData({ name: '' });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('El nombre es requerido');
      return;
    }
    try {
      if (editingLine) {
        await marketLinesAPI.update(editingLine.id, { name: formData.name });
        setSuccess('Línea de mercado actualizada exitosamente');
      } else {
        await marketLinesAPI.create({ name: formData.name });
        setSuccess('Línea de mercado creada exitosamente');
      }
      handleCloseModal();
      fetchMarketLines();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    }
  };

  const handleDelete = async (line) => {
    if (!window.confirm(`¿Está seguro de eliminar "${line.name}"? Esta acción no se puede deshacer y requiere que no tenga anaqueles ni muestras asociadas.`)) {
      return;
    }
    try {
      await marketLinesAPI.delete(line.id);
      setSuccess('Línea de mercado eliminada exitosamente');
      fetchMarketLines();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><LoadingSpinner size="large" text="Cargando líneas de mercado..." /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Líneas de Mercado</h1>
          <p className="text-sm text-gray-400 mt-1">Gestiona las líneas de negocio del sistema</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" /> Nueva Línea
        </button>
      </div>

      {/* Mensajes */}
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

      {/* Tabla */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Nombre</th>
              <th className="text-center px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Anaqueles</th>
              <th className="text-center px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Muestras Bulk</th>
              <th className="text-center px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Muestras Dispensadas</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {marketLines.length > 0 ? marketLines.map(line => (
              <tr key={line.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-white">{line.name}</p>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-sm text-gray-400">{line.shelf_count || 0}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-sm text-gray-400">{line.bulk_count || 0}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-sm text-gray-400">{line.dispensed_count || 0}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleOpenModal(line)} className="p-2 text-gray-400 hover:text-primary-400 transition-colors" title="Editar">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(line)} className="p-2 text-gray-400 hover:text-red-400 transition-colors" title="Eliminar">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                  No hay líneas de mercado registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={handleCloseModal} title={editingLine ? 'Editar Línea de Mercado' : 'Nueva Línea de Mercado'}
        footer={
          <>
            <button onClick={handleCloseModal} className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors">Cancelar</button>
            <button onClick={handleSubmit} className="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium">
              {editingLine ? 'Actualizar' : 'Crear'}
            </button>
          </>
        }>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
            <input type="text" value={formData.name} onChange={e => setFormData({ name: e.target.value })}
              className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="Ej: Cosmética, Farmacéutica, Industrial..." autoFocus />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MarketLinesPage;