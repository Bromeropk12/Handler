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
  
  // Settings state
  const [settings, setSettings] = useState({ interval_days: 20, hour: 12 });
  const [isEditingSettings, setIsEditing] = useState(false);

  const notify = (type, msg) => {
    setNotif({ type, msg });
    setTimeout(() => setNotif(null), 8000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, listRes, settingsRes] = await Promise.all([
        backupAPI.getStatus(),
        backupAPI.listBackups(),
        backupAPI.getSettings(),
      ]);
      setStatus(statusRes.data.data);
      setBackups(listRes.data.data.backups);
      setSettings(settingsRes.data.data);
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
        <p className="font-semibold mb-1">ℹ️ Cómo funciona el sistema de backups cloud</p>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>El sistema genera un backup <strong>automático según la configuración establecida</strong> (actualmente cada {status?.intervalDays} días).</li>
          <li>Los respaldos se guardan de forma segura en la base de datos de <strong>Supabase</strong>.</li>
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
                    <p className="text-[10px] text-gray-500 mt-1 italic">* Hora de Bogotá (UTC-5)</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button 
                      type="button"
                      onClick={() => { setIsEditing(false); setSettings({ interval_days: status.intervalDays, hour: status.hour }); }}
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
                    <span className="text-sm text-white font-medium">{status?.hour}:00 Bog</span>
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
                   Todos los respaldos están cifrados y almacenados en la infraestructura cloud de Supabase. 
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
