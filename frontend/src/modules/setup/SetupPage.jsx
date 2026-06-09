import React, { useState } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';

const SetupPage = ({ onSetupComplete, isReconfiguring }) => {
  const [formData, setFormData] = useState({
    host: 'localhost',
    port: '5432',
    user: 'postgres',
    password: '',
    dbName: 'handler_track_samples',
    adminUsername: 'admin',
    adminPassword: '',
    adminName: 'Administrador'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.setupDatabase(formData);
        if (result.success) {
          onSetupComplete();
        } else {
          setError(result.error || 'Error desconocido al configurar la base de datos');
        }
      } else {
        setError('No se detectó el entorno de Electron.');
      }
    } catch (err) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-y-auto bg-surface-900 text-white p-4">
      <div className="min-h-full flex items-center justify-center">
        <div className="w-full max-w-md bg-surface-800 p-6 rounded-2xl border border-surface-700 shadow-xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">Configuración Inicial</h2>
          <p className="text-gray-400 text-sm mt-2">
            El sistema requiere conexión a PostgreSQL para funcionar. Por favor, ingresa las credenciales de tu servidor.
          </p>
        </div>

        {isReconfiguring && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-sm text-center">
            ⚠ La base de datos configurada actualmente no responde. Verifica que PostgreSQL esté instalado y accesible, o actualiza las credenciales aquí.
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Host</label>
              <input
                type="text"
                name="host"
                value={formData.host}
                onChange={handleChange}
                required
                className="w-full bg-surface-700 border border-surface-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Puerto</label>
              <input
                type="text"
                name="port"
                value={formData.port}
                onChange={handleChange}
                required
                className="w-full bg-surface-700 border border-surface-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Usuario de PostgreSQL</label>
            <input
              type="text"
              name="user"
              value={formData.user}
              onChange={handleChange}
              required
              className="w-full bg-surface-700 border border-surface-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Contraseña</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full bg-surface-700 border border-surface-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Nombre de la Base de Datos</label>
            <input
              type="text"
              name="dbName"
              value={formData.dbName}
              onChange={handleChange}
              required
              className="w-full bg-surface-700 border border-surface-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">Si no existe, se creará automáticamente.</p>
          </div>

          <div className="border-t border-surface-700 pt-4 mt-6">
            <p className="text-sm font-medium text-gray-400 mb-4">Cuenta de Administrador</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Usuario Admin</label>
                <input
                  type="text"
                  name="adminUsername"
                  value={formData.adminUsername}
                  onChange={handleChange}
                  required
                  className="w-full bg-surface-700 border border-surface-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Contraseña Admin</label>
                <input
                  type="password"
                  name="adminPassword"
                  value={formData.adminPassword}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="w-full bg-surface-700 border border-surface-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">Mínimo 8 caracteres.</p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <LoadingSpinner size="small" /> : 'Instalar y Continuar'}
          </button>
        </form>
      </div>
    </div>
    </div>
  );
};

export default SetupPage;
