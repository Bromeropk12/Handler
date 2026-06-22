import React, { useState, useEffect, useCallback, useRef } from 'react';
import { backupAPI } from '../../services/api';
import {
  CircleStackIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

// ─── Alert Banner ───────────────────────────────────────────────────────────
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

// ─── Confirm Restore Modal ───────────────────────────────────────────────────
const RestoreModal = ({ backup, onConfirm, onCancel, loading }) => {
  const [password, setPassword] = useState('');
  const [step, setStep] = useState(1); // 1=warning 2=password

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-surface-400 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-700">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">Restaurar Base de Datos</h2>
            <p className="text-gray-400 text-sm">{backup?.filename}</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {step === 1 && (
            <>
              <Alert type="danger">
                <p className="font-bold mb-2">⚠️ ADVERTENCIA CRÍTICA — Lea antes de continuar</p>
                <ul className="space-y-1 list-disc list-inside text-sm">
                  <li>Esta acción <strong>reemplazará TODOS los datos actuales</strong> de la base de datos.</li>
                  <li>Los datos registrados después de este backup <strong>se perderán permanentemente</strong>.</li>
                  <li>Se recomienda crear un backup del estado actual antes de restaurar.</li>
                  <li>El sistema se reiniciará automáticamente al finalizar.</li>
                </ul>
              </Alert>
              <Alert type="info">
                <p className="font-bold mb-1">✅ Cómo hacer una restauración correcta</p>
                <ol className="list-decimal list-inside text-sm space-y-1">
                  <li>Asegúrese de que ningún usuario esté usando el sistema.</li>
                  <li>Cree un backup del estado actual (botón "Crear Backup").</li>
                  <li>Confirme con su contraseña de administrador.</li>
                  <li>Espere a que el proceso finalice completamente.</li>
                  <li>Verifique los datos en el Dashboard.</li>
                </ol>
              </Alert>
              <div className="flex gap-3 pt-2">
                <button onClick={onCancel} className="btn-secondary flex-1">Cancelar</button>
                <button onClick={() => setStep(2)} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                  Entiendo el riesgo → Continuar
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <Alert type="warning">
                <strong>Confirmación requerida:</strong> Ingrese su contraseña de administrador para autorizar la restauración.
              </Alert>
              <div>
                <label className="block text-sm text-gray-300 mb-2 font-medium">
                  <ShieldCheckIcon className="w-4 h-4 inline mr-1" />
                  Contraseña de Administrador
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && password && onConfirm(backup.filename, password)}
                  placeholder="Ingrese su contraseña..."
                  className="w-full bg-surface-300 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-handler-red"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1">← Atrás</button>
                <button
                  onClick={() => onConfirm(backup.filename, password)}
                  disabled={!password || loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Restaurando...</> : '🔐 Confirmar Restauración'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Import Modal (file picker del navegador) ──────────────────────────────
const ImportModal = ({ onConfirm, onCancel, loading }) => {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const fileInputRef = useRef(null);

  const handleSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-surface-400 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-700">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <ArrowUpTrayIcon className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">Importar Backup</h2>
            <p className="text-gray-400 text-sm">Cargar un archivo .json desde cualquier carpeta de la PC</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <Alert type="info">
            <p className="font-semibold mb-1">¿Qué hace este botón?</p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Permite cargar un backup previamente exportado a una USB, disco de red o OneDrive personal.</li>
              <li>El archivo se valida y registra en la base de datos local sin reemplazar los backups existentes.</li>
              <li>La importación <strong>no restaura</strong> los datos — solo agrega el archivo a la lista. Para restaurar use "Restaurar" después.</li>
            </ul>
          </Alert>

          {/* File picker oculto + botón visible */}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={e => setFile(e.target.files?.[0] || null)}
            className="hidden"
          />
          <div>
            <label className="block text-sm text-gray-300 mb-2 font-medium">
              <ArrowUpTrayIcon className="w-4 h-4 inline mr-1" />
              Archivo de backup (.json)
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSelect}
                className="btn-secondary flex-1 text-left truncate"
              >
                {file ? (
                  <span className="text-white">{file.name} <span className="text-gray-500 text-xs">({(file.size / 1024 / 1024).toFixed(2)} MB)</span></span>
                ) : (
                  <span className="text-gray-500">Seleccionar archivo desde cualquier carpeta...</span>
                )}
              </button>
              {file && (
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="px-3 text-gray-500 hover:text-red-400"
                  title="Quitar archivo"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2 font-medium">
              <ShieldCheckIcon className="w-4 h-4 inline mr-1" />
              Contraseña de Administrador
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && file && password && onConfirm(file, password)}
              placeholder="Requerida para autorizar la importación"
              className="w-full bg-surface-300 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              autoFocus={!file}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onCancel} className="btn-secondary flex-1">Cancelar</button>
            <button
              onClick={() => onConfirm(file, password)}
              disabled={!file || !password || loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading
                ? <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Importando...</>
                : <><ArrowUpTrayIcon className="w-4 h-4" /> Importar Backup</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Restore Progress Overlay ───────────────────────────────────────────────
const RestoreProgressOverlay = ({ elapsed }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="bg-surface-400 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-8 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto">
          <ArrowPathIcon className="w-9 h-9 text-amber-400 animate-spin" />
        </div>
        <div>
          <h3 className="text-white font-bold text-lg">Restaurando base de datos...</h3>
          <p className="text-gray-400 text-sm mt-1">
            Este proceso puede tardar entre <strong className="text-white">30 y 90 segundos</strong>.<br />
            No cierre la aplicación.
          </p>
        </div>
        <div className="bg-surface-300 rounded-xl px-6 py-3">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Tiempo transcurrido</p>
          <p className="text-2xl font-mono font-bold text-amber-400">{elapsed}s</p>
        </div>
        <p className="text-gray-500 text-xs">
          ⚠️ La sesión se reiniciará automáticamente al finalizar
        </p>
      </div>
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
const BackupPage = () => {
  const [status, setStatus]         = useState(null);
  const [backups, setBackups]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [actionLoading, setAction]  = useState('');
  const [notification, setNotif]    = useState(null);
  const [restoreTarget, setRestore] = useState(null);
  const [restoreElapsed, setElapsed] = useState(0);
  const [importOpen, setImportOpen] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({ interval_days: 20, hour: 12, minutes: 0 });
  const [isEditingSettings, setIsEditing] = useState(false);

  // Local path state
  const [localPath, setLocalPath] = useState('');
  const [localPathLoading, setLocalPathLoading] = useState(false);
  const [editingPath, setEditingPath] = useState(false);
  const [tempPath, setTempPath] = useState('');

  const notify = (type, msg) => {
    setNotif({ type, msg });
    setTimeout(() => setNotif(null), 8000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, listRes, settingsRes, localPathRes] = await Promise.all([
        backupAPI.getStatus(),
        backupAPI.listBackups(),
        backupAPI.getSettings(),
        backupAPI.getLocalPath(),
      ]);
      setStatus(statusRes.data);
      setBackups(listRes.data.backups);
      setSettings(settingsRes.data);
      const resolvedPath = localPathRes.data?.path || statusRes.data?.storage?.localDir || '';
      setLocalPath(resolvedPath);
      setTempPath(resolvedPath);
    } catch (err) {
      notify('danger', err.message || 'Error al cargar información de backups');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setAction('settings');
    try {
      await backupAPI.updateSettings(settings);
      notify('success', 'Configuración de backup actualizada correctamente');
      setIsEditing(false);
      loadData();
    } catch (err) {
      notify('danger', err.message || 'Error al actualizar configuración');
    } finally {
      setAction('');
    }
  };

  const handleSavePath = async () => {
    setLocalPathLoading(true);
    try {
      await backupAPI.setLocalPath(tempPath);
      setLocalPath(tempPath);
      setEditingPath(false);
      notify('success', 'Ruta de backups actualizada correctamente');
      loadData();
    } catch (err) {
      notify('danger', err.message || 'Error al guardar la ruta');
    } finally {
      setLocalPathLoading(false);
    }
  };

  const handleSelectFolder = async () => {
    try {
      if (window.electronAPI && window.electronAPI.selectFolder) {
        const folder = await window.electronAPI.selectFolder();
        if (folder) {
          setTempPath(folder);
          setEditingPath(true);
        }
      }
    } catch (err) {
      notify('danger', 'No se pudo abrir el selector de carpetas');
    }
  };

  // ── Crear Backup ──────────────────────────────────────────────────────────
  const handleCreate = async () => {
    setAction('create');
    try {
      const res = await backupAPI.createBackup();
      const d = res.data;
      notify('success', `✅ Backup creado: ${d.filename} (${d.sizeMB} MB)${d.deletedOldBackups?.length ? ` — ${d.deletedOldBackups.length} backup(s) antiguo(s) eliminado(s)` : ''}`);
      loadData();
    } catch (err) {
      notify('danger', err.message || 'Error al crear el backup');
    } finally {
      setAction('');
    }
  };

  // ── Restaurar Backup ──────────────────────────────────────────────────────
  const handleRestore = async (filename, password) => {
    setAction('restore');
    setElapsed(0);
    setRestore(null); // Cerrar modal de confirmación

    // Iniciar contador de tiempo
    const startTime = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    try {
      const res = await backupAPI.restoreBackup({ filename, password });
      clearInterval(timer);
      setAction('');
      notify('success', `✅ ${res.data.message} — La sesión se cerrará en 3 segundos para aplicar los cambios.`);
      // Logout automático tras restaurar (los IDs de BD cambian)
      setTimeout(() => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/';
      }, 3000);
    } catch (err) {
      clearInterval(timer);
      setAction('');
      const msg = err.response?.data?.message || err.message || '';
      if (msg.toLowerCase().includes('contraseña') || msg.toLowerCase().includes('password')) {
        notify('danger', '❌ Contraseña incorrecta. La restauración fue cancelada por seguridad.');
      } else if (msg.toLowerCase().includes('timeout') || msg.toLowerCase().includes('network')) {
        notify('warning', '⚠️ La restauración tardó demasiado, pero puede haber completado en el servidor. Recarga la aplicación y verifica los datos antes de volver a intentar.');
      } else {
        notify('danger', `Error al restaurar: ${msg || 'Error desconocido. Intente de nuevo.'}`);
      }
    }
  };

  // ── Eliminar Backup ───────────────────────────────────────────────────────
  const handleDelete = async (filename) => {
    if (!window.confirm(`¿Está seguro de eliminar el backup "${filename}"?\nEsta acción no se puede deshacer.`)) return;
    setAction(`delete-${filename}`);
    try {
      await backupAPI.deleteBackup(filename);
      notify('success', `Backup "${filename}" eliminado.`);
      loadData();
    } catch (err) {
      notify('danger', err.message || 'Error al eliminar el backup');
    } finally {
      setAction('');
    }
  };

  // ── Importar Backup desde archivo .json ─────────────────────────────────
  const handleImport = async (file, password) => {
    setAction('import');
    try {
      const res = await backupAPI.importBackup(file, password);
      const d = res.data;
      notify('success', `✅ Backup importado: ${d.filename} (${d.sizeMB} MB)`);
      setImportOpen(false);
      loadData();
    } catch (err) {
      const msg = err.message || 'Error al importar el backup';
      if (msg.toLowerCase().includes('contraseña') || msg.toLowerCase().includes('password')) {
        notify('danger', '❌ Contraseña incorrecta. Importación cancelada.');
      } else if (msg.toLowerCase().includes('versión') || msg.toLowerCase().includes('version')) {
        notify('danger', `❌ ${msg} — Use un backup de esta misma versión del sistema.`);
      } else if (msg.toLowerCase().includes('json') || msg.toLowerCase().includes('estructura')) {
        notify('danger', `❌ Archivo inválido: ${msg}`);
      } else {
        notify('danger', `❌ ${msg}`);
      }
    } finally {
      setAction('');
    }
  };

  // ── Descargar Backup ─────────────────────────────────────────────────────
  const handleDownload = async (filename) => {
    setAction(`download-${filename}`);
    try {
      const res = await backupAPI.downloadBackup(filename);
      // Crear URL temporal y forzar descarga
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      notify('success', `Descarga iniciada: ${filename}`);
    } catch (err) {
      notify('danger', err.message || 'Error al descargar el backup');
    } finally {
      setAction('');
    }
  };



  // ── Formatear fechas ──────────────────────────────────────────────────────
  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Overlay bloqueante durante restauración */}
      {actionLoading === 'restore' && (
        <RestoreProgressOverlay elapsed={restoreElapsed} />
      )}

      {/* Modal de confirmación de restauración */}
      {restoreTarget && (
        <RestoreModal
          backup={restoreTarget}
          onConfirm={handleRestore}
          onCancel={() => setRestore(null)}
          loading={actionLoading === 'restore'}
        />
      )}

      {/* Modal de importacion de backup */}
      {importOpen && (
        <ImportModal
          onConfirm={handleImport}
          onCancel={() => setImportOpen(false)}
          loading={actionLoading === 'import'}
        />
      )}

      {/* Notificación */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <Alert type={notification.type} onClose={() => setNotif(null)}>
            {notification.msg}
          </Alert>
        </div>
      )}

      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-handler-red/30 to-handler-red/10 border border-handler-red/30 flex items-center justify-center">
            <CircleStackIcon className="w-7 h-7 text-handler-red" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Sistema de Backups</h1>
            <p className="text-gray-400 text-sm">Respaldo y restauración de la base de datos — Solo Administradores</p>
          </div>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="btn-secondary px-4 py-2 flex items-center gap-2"
        >
          <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Recargar
        </button>
      </div>

      {/* ── Aviso importante ── */}
      <Alert type="info">
        <p className="font-semibold mb-1">ℹ️ Cómo funciona el sistema de backups locales</p>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>El sistema genera un backup <strong>automático según la configuración establecida</strong> (actualmente cada {status?.intervalDays} días).</li>
          <li>Los respaldos se guardan de forma segura en la base de datos del <strong>servidor local</strong>.</li>
          <li>Se conservan hasta <strong>3 backups</strong>. El más antiguo se elimina automáticamente.</li>
          <li>Usted puede descargar o restaurar cualquier backup del historial en cualquier momento.</li>
        </ul>
      </Alert>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <ArrowPathIcon className="w-8 h-8 text-handler-red animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Columna Izquierda: Estado y Configuración */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Tarjetas de estado rápido */}
            <div className="space-y-4">
              <div className="bg-surface-400 border border-gray-700/50 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Último Backup</p>
                <p className="text-white font-bold">{formatDate(status?.lastBackup)}</p>
                <p className="text-gray-500 text-xs mt-1">
                  {status?.daysSinceLast !== undefined && status?.daysSinceLast !== null ? `Hace ${status?.daysSinceLast} día(s)` : 'Sin historial'}
                </p>
              </div>

              <div className={`border rounded-xl p-4 ${status?.isDue ? 'bg-amber-900/20 border-amber-600/40' : 'bg-green-900/20 border-green-600/40'}`}>
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Estado de Frecuencia</p>
                <p className={`font-bold ${status?.isDue ? 'text-amber-400' : 'text-green-400'}`}>
                  {status?.isDue ? '⚠️ Requiere Respaldo' : '✅ Protegido'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Siguiente en: {(status?.intervalDays || 0) - (status?.daysSinceLast || 0)} días</p>
              </div>
            </div>

            {/* Configuración del Scheduler */}

            {/* Ruta de Backups Locales */}
            <div className="bg-surface-400 border border-gray-700/50 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold flex items-center gap-2 text-sm uppercase tracking-wider">
                  📁 Carpeta de Backups
                </h3>
                {!editingPath && (
                  <button 
                    onClick={() => { setEditingPath(true); setTempPath(localPath); }}
                    className="text-xs text-handler-red hover:underline"
                  >
                    Editar
                  </button>
                )}
              </div>

              {editingPath ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Ruta de la carpeta:</label>
                    <input 
                      type="text"
                      value={tempPath}
                      onChange={e => setTempPath(e.target.value)}
                      placeholder="Ej: C:\Backups\Handler"
                      className="w-full bg-surface-300 border border-gray-600 rounded px-3 py-1.5 text-white text-sm font-mono"
                    />
                  </div>
                  {window.electronAPI && window.electronAPI.selectFolder && (
                    <button
                      type="button"
                      onClick={handleSelectFolder}
                      className="w-full text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 py-1.5 rounded flex items-center justify-center gap-2"
                    >
                      📂 Examinar carpetas...
                    </button>
                  )}
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => { setEditingPath(false); setTempPath(localPath); }}
                      className="flex-1 text-xs bg-gray-700 hover:bg-gray-600 text-white py-1.5 rounded"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleSavePath}
                      disabled={localPathLoading || !tempPath.trim()}
                      className="flex-1 text-xs bg-handler-red hover:bg-red-700 disabled:opacity-50 text-white py-1.5 rounded flex items-center justify-center gap-2"
                    >
                      {localPathLoading ? <ArrowPathIcon className="w-3 h-3 animate-spin" /> : 'Guardar ruta'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="bg-surface-300 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Ruta actual:</p>
                    <p className="text-white text-sm font-mono break-all">{localPath || 'No configurada'}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`w-2 h-2 rounded-full ${status?.storage?.localReady ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="text-gray-400">{status?.storage?.localReady ? 'Carpeta accesible' : 'Carpeta no encontrada'}</span>
                  </div>
                  {status?.storage?.onedriveDir && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`w-2 h-2 rounded-full ${status?.storage?.onedriveReady ? 'bg-blue-400' : 'bg-yellow-400'}`} />
                      <span className="text-gray-400">OneDrive: {status?.storage?.onedriveReady ? 'Sincronizando' : 'No disponible'}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Configuración del Scheduler */}
            <div className="bg-surface-400 border border-gray-700/50 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold flex items-center gap-2 text-sm uppercase tracking-wider">
                  <ClockIcon className="w-4 h-4 text-blue-400" />
                  Programación
                </h3>
                {!isEditingSettings && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-handler-red hover:underline"
                  >
                    Editar
                  </button>
                )}
              </div>

              {isEditingSettings ? (
                <form onSubmit={handleUpdateSettings} className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Cada cuántos días:</label>
                    <input 
                      type="number"
                      min="1"
                      max="365"
                      value={settings.interval_days || ''}
                      onChange={e => setSettings({...settings, interval_days: e.target.value === '' ? '' : parseInt(e.target.value)})}
                      className="w-full bg-surface-300 border border-gray-600 rounded px-3 py-1.5 text-white text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Hora (0-23):</label>
                      <input 
                        type="number"
                        min="0"
                        max="23"
                        value={settings.hour !== undefined ? settings.hour : ''}
                        onChange={e => setSettings({...settings, hour: e.target.value === '' ? '' : parseInt(e.target.value)})}
                        className="w-full bg-surface-300 border border-gray-600 rounded px-3 py-1.5 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Minutos (0-59):</label>
                      <input 
                        type="number"
                        min="0"
                        max="59"
                        value={settings.minutes !== undefined ? settings.minutes : 0}
                        onChange={e => setSettings({...settings, minutes: e.target.value === '' ? 0 : parseInt(e.target.value)})}
                        className="w-full bg-surface-300 border border-gray-600 rounded px-3 py-1.5 text-white text-sm"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 italic">* Hora de Bogotá (UTC-5)</p>
                  <div className="flex gap-2 pt-2">
                    <button 
                      type="button"
                      onClick={() => { setIsEditing(false); setSettings({ interval_days: status.intervalDays, hour: status.hour, minutes: status.minutes || 0 }); }}
                      className="flex-1 text-xs bg-gray-700 hover:bg-gray-600 text-white py-1.5 rounded"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      disabled={actionLoading === 'settings'}
                      className="flex-1 text-xs bg-handler-red hover:bg-red-700 text-white py-1.5 rounded flex items-center justify-center gap-2"
                    >
                      {actionLoading === 'settings' ? <ArrowPathIcon className="w-3 h-3 animate-spin" /> : 'Guardar'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-700/50">
                    <span className="text-sm text-gray-400">Frecuencia</span>
                    <span className="text-sm text-white font-medium">{status?.intervalDays} días</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-700/50">
                    <span className="text-sm text-gray-400">Hora programada</span>
                    <span className="text-sm text-white font-medium">{status?.hour}:{String(status?.minutes || 0).padStart(2, '0')} Bog</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed italic">
                    El sistema verificará cada hora si es el momento de realizar el respaldo automático basado en estos parámetros.
                  </p>
                </div>
              )}
            </div>

            {/* Acciones Rápidas */}
            <div className="bg-surface-400 border border-gray-700/50 rounded-xl p-5 space-y-3">
               <button
                  onClick={handleCreate}
                  disabled={!!actionLoading}
                  className="w-full flex items-center justify-center gap-2 bg-handler-red hover:bg-red-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors text-sm"
                >
                  {actionLoading === 'create'
                    ? <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    : <CircleStackIcon className="w-5 h-5" />}
                  Generar Respaldo Ahora
                </button>
               <button
                  onClick={() => setImportOpen(true)}
                  disabled={!!actionLoading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors text-sm"
                >
                  <ArrowUpTrayIcon className="w-5 h-5" />
                  Importar Backup desde archivo
                </button>
            </div>

          </div>

          {/* Columna Derecha: Historial */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface-400 border border-gray-700/50 rounded-xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-gray-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-handler-red" />
                  <h2 className="text-white font-semibold">Historial de Resguardos</h2>
                </div>
                <span className="text-[10px] uppercase tracking-tighter text-gray-500 bg-gray-800 px-2 py-1 rounded">
                  Max: {status?.maxBackups ?? 3} Archivos
                </span>
              </div>

              {backups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-4">
                  <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
                    <CircleStackIcon className="w-8 h-8 opacity-20" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-gray-400">Sin respaldos disponibles</p>
                    <p className="text-xs mt-1">Los backups automáticos aparecerán aquí.</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-700/30">
                  {backups.map((b, idx) => (
                    <div
                      key={b.filename}
                      className="group flex items-center gap-4 px-6 py-5 hover:bg-surface-300/20 transition-colors"
                    >
                      {/* Ícono de Estado */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${idx === 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-surface-300 border-gray-600'}`}>
                        <CircleStackIcon className={`w-5 h-5 ${idx === 0 ? 'text-green-400' : 'text-gray-400'}`} />
                      </div>

                      {/* Información del Backup */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-white text-sm font-bold truncate group-hover:text-handler-red transition-colors">{b.filename}</p>
                          {idx === 0 && (
                            <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Actual</span>
                          )}
                        </div>
                        <p className="text-gray-400 text-xs flex items-center gap-3">
                          <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3" /> {formatDate(b.createdAt)}</span>
                          <span className="flex items-center gap-1 font-mono uppercase opacity-70 tracking-widest">{b.sizeMB} MB</span>
                        </p>
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          onClick={() => setRestore(b)}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 px-4 py-2 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                        >
                          <ArrowPathIcon className="w-3.5 h-3.5" />
                          Restaurar
                        </button>
                        <button
                          onClick={() => handleDownload(b.filename)}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 px-3 py-2 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                          title="Descargar backup como archivo .json"
                        >
                          {actionLoading === `download-${b.filename}`
                            ? <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                            : <ArrowDownTrayIcon className="w-3.5 h-3.5" />}
                          Descargar
                        </button>
                        <button
                          onClick={() => handleDelete(b.filename)}
                          disabled={!!actionLoading}
                          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
                        >
                          {actionLoading === `delete-${b.filename}`
                            ? <ArrowPathIcon className="w-4 h-4 animate-spin" />
                            : <TrashIcon className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-5 flex gap-4">
               <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                 <ShieldCheckIcon className="w-6 h-6 text-blue-400" />
               </div>
               <div>
                 <h4 className="text-blue-200 text-sm font-bold mb-1">Seguridad de Datos</h4>
                 <p className="text-blue-300/60 text-xs leading-relaxed">
                   Todos los respaldos están almacenados localmente en el servidor. 
                   La restauración de datos requiere privilegios de administrador de sistema.
                 </p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupPage;
