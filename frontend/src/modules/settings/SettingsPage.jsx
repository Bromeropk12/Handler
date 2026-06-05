import React, { useState, useEffect, useCallback } from 'react';
import { settingsAPI } from '../../services/api';
import {
  Cog6ToothIcon,
  ArrowPathIcon,
  FolderOpenIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const Alert = ({ type = 'info', children, onClose }) => {
  const styles = {
    info:    'bg-blue-900/30 border-blue-500/50 text-blue-200',
    success: 'bg-green-900/30 border-green-500/50 text-green-200',
    warning: 'bg-amber-900/30 border-amber-500/50 text-amber-200',
    danger:  'bg-red-900/30 border-red-500/50 text-red-200',
  };
  const icons = {
    info:    <InformationCircleIcon className="w-5 h-5 shrink-0 text-blue-400" />,
    success: <CheckCircleIcon       className="w-5 h-5 shrink-0 text-green-400" />,
    warning: <ExclamationTriangleIcon className="w-5 h-5 shrink-0 text-amber-400" />,
    danger:  <XCircleIcon           className="w-5 h-5 shrink-0 text-red-400" />,
  };
  return (
    <div className={`flex items-start gap-3 border rounded-lg p-4 ${styles[type]}`}>
      {icons[type]}
      <div className="flex-1 text-sm">{children}</div>
      {onClose && (
        <button onClick={onClose} className="opacity-60 hover:opacity-100 text-xs">✕</button>
      )}
    </div>
  );
};

const SettingsPage = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [notification, setNotif] = useState(null);

  // Editable fields
  const [coaBaseDir, setCoaBaseDir] = useState('');
  const [isEditingCoa, setIsEditingCoa] = useState(false);

  const notify = (type, msg) => {
    setNotif({ type, msg });
    setTimeout(() => setNotif(null), 8000);
  };

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await settingsAPI.list();
      const data = res.data.data || {};
      setSettings(data);
      if (data.coa_base_dir) {
        setCoaBaseDir(data.coa_base_dir);
      }
    } catch (err) {
      notify('danger', err.message || 'Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const handleSaveCoaDir = async (e) => {
    e.preventDefault();
    if (!coaBaseDir.trim()) {
      notify('warning', 'La ruta del directorio CoA no puede estar vacía');
      return;
    }
    setSaving('coa');
    try {
      await settingsAPI.update('coa_base_dir', coaBaseDir.trim());
      notify('success', 'Directorio CoA actualizado. Los nuevos archivos se almacenarán en la ruta configurada.');
      setIsEditingCoa(false);
      loadSettings();
    } catch (err) {
      notify('danger', err.message || 'Error al guardar la configuración');
    } finally {
      setSaving('');
    }
  };

  const handleResetCoaDir = async () => {
    setSaving('coa');
    try {
      await settingsAPI.update('coa_base_dir', '');
      notify('success', 'Directorio CoA restablecido al valor por defecto (variable de entorno o uploads/coa)');
      setIsEditingCoa(false);
      setCoaBaseDir('');
      loadSettings();
    } catch (err) {
      notify('danger', err.message || 'Error al restablecer');
    } finally {
      setSaving('');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <Alert type={notification.type} onClose={() => setNotif(null)}>
            {notification.msg}
          </Alert>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-handler-red/30 to-handler-red/10 border border-handler-red/30 flex items-center justify-center">
            <Cog6ToothIcon className="w-7 h-7 text-handler-red" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Configuración del Sistema</h1>
            <p className="text-gray-400 text-sm">Ajustes globales de la aplicación — Solo Administradores</p>
          </div>
        </div>
        <button
          onClick={loadSettings}
          disabled={loading}
          className="btn-secondary px-4 py-2 flex items-center gap-2"
        >
          <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Recargar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <ArrowPathIcon className="w-8 h-8 text-handler-red animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">

            {/* CoA Directory Card */}
            <div className="bg-surface-400 border border-gray-700/50 rounded-xl overflow-hidden">
              <div className="p-5 border-b border-gray-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <FolderOpenIcon className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-white font-semibold">Certificados de Análisis (CoA)</h2>
                    <p className="text-gray-400 text-xs">Directorio de almacenamiento de PDFs de CoA</p>
                  </div>
                </div>
                {!isEditingCoa && (
                  <button
                    onClick={() => setIsEditingCoa(true)}
                    className="text-xs text-handler-red hover:underline"
                  >
                    Editar
                  </button>
                )}
              </div>

              <div className="p-5">
                {isEditingCoa ? (
                  <form onSubmit={handleSaveCoaDir} className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1.5 font-medium">
                        Ruta del directorio CoA
                      </label>
                      <input
                        type="text"
                        value={coaBaseDir}
                        onChange={e => setCoaBaseDir(e.target.value)}
                        placeholder="Ej: D:/CoA_Storage o ruta relativa como uploads/coa"
                        className="w-full bg-surface-300 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-handler-red font-mono text-sm"
                        autoFocus
                      />
                      <p className="text-[10px] text-gray-500 mt-1.5">
                        Ruta absoluta (ej: <code className="text-gray-400">D:/CoA_Storage</code>) o relativa al directorio del backend (ej: <code className="text-gray-400">uploads/coa</code>).
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setIsEditingCoa(false); setCoaBaseDir(settings.coa_base_dir || ''); }}
                        className="flex-1 text-xs bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleResetCoaDir}
                        disabled={!!saving}
                        className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Restablecer defecto
                      </button>
                      <button
                        type="submit"
                        disabled={!!saving || !coaBaseDir.trim()}
                        className="flex-1 text-xs bg-handler-red hover:bg-red-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {saving === 'coa' ? <ArrowPathIcon className="w-3 h-3 animate-spin" /> : null}
                        Guardar
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 px-4 bg-surface-300/50 rounded-lg border border-gray-700/30">
                      <div className="flex items-center gap-3">
                        <FolderOpenIcon className="w-5 h-5 text-amber-400/70" />
                        <div>
                          <p className="text-sm text-white font-mono">
                            {settings.coa_base_dir || 'Por defecto (env var o uploads/coa)'}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {settings.coa_base_dir ? 'Configurado en base de datos' : 'Usando valor por defecto del sistema'}
                          </p>
                        </div>
                      </div>
                      {settings.coa_base_dir && (
                        <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-medium">
                          Personalizado
                        </span>
                      )}
                    </div>
                    <Alert type="info">
                      <p className="text-xs leading-relaxed">
                        <strong className="text-blue-200">¿Cómo funciona?</strong> Los archivos PDF de CoA se almacenan en el directorio configurado arriba.
                        Los cambios aplican <strong>inmediatamente</strong> para nuevos archivos. Los CoA existentes permanecen en su ubicación original.
                        El sistema sirve los archivos desde la ruta configurada en la URL <code className="text-blue-300">/uploads/coa/</code>.
                      </p>
                    </Alert>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column: Info */}
          <div className="space-y-6">
            <div className="bg-surface-400 border border-gray-700/50 rounded-xl p-5 space-y-4">
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
                <InformationCircleIcon className="w-4 h-4 text-blue-400" />
                Información
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-700/30">
                  <span className="text-xs text-gray-400">Origen CoA</span>
                  <span className="text-xs text-white font-medium">
                    {settings.coa_base_dir ? 'Base de datos' : 'Env var / Defecto'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-700/30">
                  <span className="text-xs text-gray-400">Valor efectivo</span>
                  <span className="text-xs text-white font-mono">
                    {settings.coa_base_dir || '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-gray-400">Actualización</span>
                  <span className="text-xs text-gray-400">Inmediata</span>
                </div>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed italic mt-2">
                Los cambios en la configuración se aplican en caliente sin necesidad de reiniciar el servidor.
              </p>
            </div>

            {/* Status info card */}
            <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-5 flex gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                <Cog6ToothIcon className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h4 className="text-blue-200 text-sm font-bold mb-1">Almacenamiento</h4>
                <p className="text-blue-300/60 text-xs leading-relaxed">
                  Todas las configuraciones se persisten en la base de datos y son independientes del archivo <code className="text-blue-300">.env</code>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
