import React, { useState, useEffect, useCallback } from 'react';
import { backupAPI } from '../../services/api';
import {
  CircleStackIcon,
  ArrowPathIcon,
  CloudArrowUpIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  ClockIcon,
  FolderOpenIcon,
  ArrowDownTrayIcon,
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

// ─── Main Page ───────────────────────────────────────────────────────────────
const BackupPage = () => {
  const [status, setStatus]         = useState(null);
  const [backups, setBackups]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [actionLoading, setAction]  = useState('');
  const [notification, setNotif]    = useState(null);
  const [restoreTarget, setRestore] = useState(null);

  const notify = (type, msg) => {
    setNotif({ type, msg });
    setTimeout(() => setNotif(null), 6000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, listRes] = await Promise.all([
        backupAPI.getStatus(),
        backupAPI.listBackups(),
      ]);
      setStatus(statusRes.data.data);
      setBackups(listRes.data.data.backups);
    } catch (err) {
      notify('danger', err.message || 'Error al cargar información de backups');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Crear Backup ──────────────────────────────────────────────────────────
  const handleCreate = async () => {
    setAction('create');
    try {
      const res = await backupAPI.createBackup();
      const d = res.data.data;
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
    try {
      const res = await backupAPI.restoreBackup({ filename, password });
      setRestore(null);
      notify('success', res.data.message);
      loadData();
    } catch (err) {
      notify('danger', err.message || 'Error al restaurar el backup. Verifique su contraseña.');
    } finally {
      setAction('');
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

  // ── Sincronizar OneDrive ──────────────────────────────────────────────────
  const handleOneDrive = async () => {
    setAction('onedrive');
    try {
      const res = await backupAPI.syncToOneDrive();
      notify('success', res.data.message);
    } catch (err) {
      notify('danger', err.message || 'No se pudo sincronizar con OneDrive');
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
      {/* Modales */}
      {restoreTarget && (
        <RestoreModal
          backup={restoreTarget}
          onConfirm={handleRestore}
          onCancel={() => setRestore(null)}
          loading={actionLoading === 'restore'}
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
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-handler-red/30 to-handler-red/10 border border-handler-red/30 flex items-center justify-center">
          <CircleStackIcon className="w-7 h-7 text-handler-red" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Sistema de Backups</h1>
          <p className="text-gray-400 text-sm">Respaldo y restauración de la base de datos — Solo Administradores</p>
        </div>
      </div>

      {/* ── Aviso importante ── */}
      <Alert type="info">
        <p className="font-semibold mb-1">ℹ️ Cómo funciona el sistema de backups</p>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>El sistema genera un backup <strong>automático cada 20 días a las 12:00pm</strong> (hora Bogotá).</li>
          <li>Se conservan hasta <strong>3 backups</strong> (≈ 60 días de historial). El más antiguo se elimina automáticamente.</li>
          <li>Los backups se guardan en la carpeta <code className="bg-black/30 px-1 rounded text-xs">Handler/backups/</code> del programa.</li>
          <li>Puede sincronizarlos con <strong>OneDrive</strong> usando el botón de nube.</li>
        </ul>
      </Alert>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <ArrowPathIcon className="w-8 h-8 text-handler-red animate-spin" />
        </div>
      ) : (
        <>
          {/* ── Tarjetas de estado ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Backups guardados */}
            <div className="bg-surface-400 border border-gray-700/50 rounded-xl p-4 space-y-1">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Backups Guardados</p>
              <p className="text-3xl font-bold text-white">{status?.totalBackups ?? 0}<span className="text-gray-500 text-lg">/{status?.maxBackups ?? 3}</span></p>
            </div>
            {/* Último backup */}
            <div className="bg-surface-400 border border-gray-700/50 rounded-xl p-4 space-y-1 col-span-2">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Último Backup</p>
              <p className="text-white font-semibold text-sm">{formatDate(status?.lastBackup)}</p>
              <p className="text-gray-500 text-xs">{status?.daysSinceLast !== null ? `Hace ${status.daysSinceLast} día(s)` : 'Sin backups'}</p>
            </div>
            {/* Estado scheduler */}
            <div className={`border rounded-xl p-4 space-y-1 ${status?.isDue ? 'bg-amber-900/20 border-amber-600/40' : 'bg-green-900/20 border-green-600/40'}`}>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Estado</p>
              <p className={`font-bold text-sm ${status?.isDue ? 'text-amber-400' : 'text-green-400'}`}>
                {status?.isDue ? '⚠️ Backup pendiente' : '✅ Al día'}
              </p>
            </div>
          </div>

          {/* ── Acciones principales ── */}
          <div className="bg-surface-400 border border-gray-700/50 rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <ArrowDownTrayIcon className="w-5 h-5 text-handler-red" />
              Acciones de Backup
            </h2>
            <div className="flex flex-wrap gap-3">
              {/* Crear backup */}
              <button
                onClick={handleCreate}
                disabled={!!actionLoading}
                className="flex items-center gap-2 bg-handler-red hover:bg-red-700 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                {actionLoading === 'create'
                  ? <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  : <CircleStackIcon className="w-5 h-5" />}
                Crear Backup Ahora
              </button>

              {/* Sincronizar OneDrive */}
              <button
                onClick={handleOneDrive}
                disabled={!!actionLoading || !status?.oneDriveAvailable}
                title={!status?.oneDriveAvailable ? 'OneDrive no detectado en este equipo' : 'Copiar backups a OneDrive'}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                {actionLoading === 'onedrive'
                  ? <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  : <CloudArrowUpIcon className="w-5 h-5" />}
                {status?.oneDriveAvailable ? 'Sincronizar con OneDrive' : 'OneDrive no disponible'}
              </button>

              {/* Recargar */}
              <button
                onClick={loadData}
                disabled={loading}
                className="flex items-center gap-2 btn-secondary px-5 py-2.5"
              >
                <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </div>

            {/* Info OneDrive */}
            {status?.oneDriveAvailable && status?.oneDrivePath && (
              <p className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                <FolderOpenIcon className="w-4 h-4" />
                OneDrive detectado: <span className="text-blue-400">{status.oneDrivePath}</span>
              </p>
            )}
            {!status?.oneDriveAvailable && (
              <Alert type="warning">
                <strong>OneDrive no detectado.</strong> Para usar la sincronización en la nube, instale y configure OneDrive en Windows 11. Los backups locales seguirán funcionando con normalidad.
              </Alert>
            )}
          </div>

          {/* ── Tabla de backups ── */}
          <div className="bg-surface-400 border border-gray-700/50 rounded-xl overflow-hidden">
            <div className="p-5 border-b border-gray-700/50 flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-handler-red" />
              <h2 className="text-white font-semibold">Historial de Backups</h2>
              <span className="ml-auto text-xs text-gray-500">Máximo {status?.maxBackups ?? 3} archivos — ~60 días</span>
            </div>

            {backups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-3">
                <CircleStackIcon className="w-12 h-12 opacity-30" />
                <p>No hay backups disponibles</p>
                <p className="text-xs">Haga clic en "Crear Backup Ahora" para generar el primero.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700/30">
                {backups.map((b, idx) => (
                  <div
                    key={b.filename}
                    className={`flex items-center gap-4 px-5 py-4 hover:bg-surface-300/30 transition-colors ${b.isOldest && backups.length === 3 ? 'border-l-2 border-amber-500/50' : ''}`}
                  >
                    {/* Ícono */}
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${idx === 0 ? 'bg-green-500/20' : 'bg-gray-700/50'}`}>
                      <CircleStackIcon className={`w-5 h-5 ${idx === 0 ? 'text-green-400' : 'text-gray-400'}`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{b.filename}</p>
                      <p className="text-gray-400 text-xs">
                        {formatDate(b.createdAt)} · {b.sizeMB} MB
                        {idx === 0 && <span className="ml-2 bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded text-xs">Más reciente</span>}
                        {b.isOldest && backups.length === 3 && <span className="ml-2 bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded text-xs">Se eliminará en el próximo backup</span>}
                      </p>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setRestore(b)}
                        disabled={!!actionLoading}
                        title="Restaurar este backup"
                        className="flex items-center gap-1.5 text-xs bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-600/30 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <ArrowPathIcon className="w-4 h-4" />
                        Restaurar
                      </button>
                      <button
                        onClick={() => handleDelete(b.filename)}
                        disabled={!!actionLoading}
                        title="Eliminar este backup"
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
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

          {/* ── Información del scheduler ── */}
          <div className="bg-surface-400 border border-gray-700/50 rounded-xl p-5 space-y-2">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-blue-400" />
              Backup Automático
            </h3>
            <p className="text-gray-400 text-sm">{status?.schedulerInfo}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <span className="text-green-400">●</span>
                Intervalo: cada <strong className="text-white ml-1">{status?.intervalDays} días</strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-400">●</span>
                Hora programada: <strong className="text-white ml-1">12:00pm hora Bogotá</strong>
              </div>
              <div className="flex items-center gap-2">
                <FolderOpenIcon className="w-4 h-4" />
                <span className="text-xs text-gray-500 truncate">{status?.backupDir}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BackupPage;
