import React, { useState, useEffect, useCallback } from 'react';
import { authAPI } from '../../services/api';
import { PERMISSION_MODULES, DEFAULT_PERMISSIONS, COLOR_MAP, ALL_PERMISSION_KEYS } from '../../config/permissions';
import {
  UsersIcon, PlusIcon, TrashIcon, ShieldCheckIcon,
  UserIcon, ArrowPathIcon, CheckCircleIcon, XCircleIcon,
  ChevronDownIcon, ChevronUpIcon, ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

// ─── Utilidades ───────────────────────────────────────────────────────────────
const Badge = ({ role }) => (
  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${role === 'admin' ? 'bg-handler-red/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}`}>
    {role === 'admin' ? 'Admin' : 'Operador'}
  </span>
);

const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={() => !disabled && onChange(!checked)}
    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 transition-colors duration-200 focus:outline-none
      ${checked ? 'bg-green-500 border-green-500' : 'bg-gray-600 border-gray-600'}
      ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200
      ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
  </button>
);

// ─── Checklist de Permisos ─────────────────────────────────────────────────
const PermissionChecklist = ({ permissions, onChange, disabled = false, targetRole }) => {
  const [expanded, setExpanded] = useState({});

  const toggleModule = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const handleModuleToggle = (module, value) => {
    const upd = {};
    module.permissions.forEach(p => { upd[p.key] = value; });
    onChange({ ...permissions, ...upd });
  };

  const countEnabled = (module) => module.permissions.filter(p => permissions[p.key] === true).length;

  return (
    <div className="space-y-2">
      {PERMISSION_MODULES.map(module => {
        const enabled = countEnabled(module);
        const total = module.permissions.length;
        const allOn = enabled === total;
        const isOpen = expanded[module.id] !== false;
        const colorClass = COLOR_MAP[module.color] || COLOR_MAP.blue;

        return (
          <div key={module.id} className="border border-gray-700/50 rounded-xl overflow-hidden">
            {/* Cabecera del módulo */}
            <div className="flex items-center gap-3 px-4 py-3 bg-surface-300/40 cursor-pointer select-none"
              onClick={() => toggleModule(module.id)}>
              <div className={`text-xs font-semibold px-2 py-0.5 rounded border ${colorClass}`}>
                {module.label}
              </div>
              <span className="text-gray-500 text-xs ml-auto">{enabled}/{total} activos</span>

              {/* Toggle: activar/desactivar todo el módulo */}
              <div onClick={e => e.stopPropagation()}>
                <Toggle
                  checked={allOn}
                  disabled={disabled}
                  onChange={v => handleModuleToggle(module, v)}
                />
              </div>
              {isOpen ? <ChevronUpIcon className="w-4 h-4 text-gray-500" /> : <ChevronDownIcon className="w-4 h-4 text-gray-500" />}
            </div>

            {/* Permisos individuales */}
            {isOpen && (
              <div className="divide-y divide-gray-800/50">
                {module.permissions.map(perm => (
                  <div key={perm.key} className="flex items-center gap-3 px-5 py-2.5 hover:bg-surface-300/20">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium">{perm.label}</p>
                      <p className="text-xs text-gray-500 truncate">{perm.description}</p>
                    </div>
                    <Toggle
                      checked={permissions[perm.key] === true}
                      disabled={disabled}
                      onChange={v => onChange({ ...permissions, [perm.key]: v })}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Modal Crear Usuario ───────────────────────────────────────────────────
const CreateUserModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ username: '', password: '', role: 'operator' });
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS('operator'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleChange = (role) => {
    setForm(f => ({ ...f, role }));
    setPermissions(DEFAULT_PERMISSIONS(role));
  };

  const handleSubmit = async () => {
    if (!form.username || !form.password) return setError('Usuario y contraseña son requeridos');
    setLoading(true);
    setError('');
    try {
      const res = await authAPI.createUser({ username: form.username, password: form.password, role: form.role });
      const newUserId = res.data.user.id;
      // Aplicar permisos personalizados si difieren del default
      await authAPI.setUserPermissions(newUserId, permissions);
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al crear usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-surface-400 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center gap-3 p-5 border-b border-gray-700 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-handler-red/20 flex items-center justify-center">
            <PlusIcon className="w-5 h-5 text-handler-red" />
          </div>
          <h2 className="text-white font-bold text-lg">Crear Nuevo Usuario</h2>
          <button onClick={onClose} className="ml-auto text-gray-500 hover:text-white">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 bg-red-900/30 border border-red-600/40 text-red-300 rounded-lg px-4 py-3 text-sm">
              <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          {/* Datos básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1.5 font-medium">Nombre de usuario</label>
              <input
                type="text" value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="ej: juan.garcia"
                className="w-full bg-surface-300 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-handler-red"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1.5 font-medium">Contraseña inicial</label>
              <input
                type="password" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Mínimo 8 caracteres"
                className="w-full bg-surface-300 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-handler-red"
              />
            </div>
          </div>

          {/* Rol */}
          <div>
            <label className="block text-sm text-gray-300 mb-2 font-medium">Rol base</label>
            <div className="flex gap-3">
              {['operator', 'admin'].map(r => (
                <button key={r} onClick={() => handleRoleChange(r)}
                  className={`flex-1 py-2.5 rounded-lg border font-medium text-sm transition-colors
                    ${form.role === r ? 'bg-handler-red/20 border-handler-red text-white' : 'border-gray-600 text-gray-400 hover:border-gray-500'}`}>
                  {r === 'admin' ? '🛡️ Administrador' : '👤 Operador'}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              El rol base carga los permisos predeterminados. Puedes personalizarlos abajo.
            </p>
          </div>

          {/* Checklist de permisos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm">Permisos ({ALL_PERMISSION_KEYS.filter(k => permissions[k]).length}/{ALL_PERMISSION_KEYS.length} activos)</h3>
              <div className="flex gap-2">
                <button onClick={() => { const all={}; ALL_PERMISSION_KEYS.forEach(k=>all[k]=true); setPermissions(all); }}
                  className="text-xs bg-green-600/20 text-green-300 border border-green-600/30 px-3 py-1 rounded-lg hover:bg-green-600/30">
                  Todo ✓
                </button>
                <button onClick={() => { const none={}; ALL_PERMISSION_KEYS.forEach(k=>none[k]=false); setPermissions(none); }}
                  className="text-xs bg-red-600/20 text-red-300 border border-red-600/30 px-3 py-1 rounded-lg hover:bg-red-600/30">
                  Ninguno ✗
                </button>
              </div>
            </div>
            <PermissionChecklist permissions={permissions} onChange={setPermissions} />
          </div>
        </div>

        <div className="p-5 border-t border-gray-700 flex gap-3 shrink-0">
          <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 bg-handler-red hover:bg-red-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2">
            {loading ? <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Creando...</> : <><PlusIcon className="w-4 h-4" /> Crear Usuario</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Panel de Permisos (inline en la lista) ──────────────────────────────────
const PermissionsPanel = ({ user, onSaved }) => {
  const [permissions, setPermissions] = useState(user.permissions || DEFAULT_PERMISSIONS(user.role));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const activeCount = ALL_PERMISSION_KEYS.filter(k => permissions[k]).length;

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await authAPI.setUserPermissions(user.id, permissions);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onSaved(user.id, permissions);
    } catch (err) {
      setError(err.message || 'Error al guardar permisos');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = () => {
    setPermissions(DEFAULT_PERMISSIONS(user.role));
  };

  return (
    <div className="border-t border-gray-700/50 bg-surface-500/30">
      <div className="p-5 space-y-4">
        {/* Header del panel */}
        <div className="flex items-center gap-3">
          <ShieldCheckIcon className="w-5 h-5 text-handler-red" />
          <span className="text-white font-semibold text-sm">
            Permisos de <strong>{user.username}</strong>
            <span className="ml-2 text-gray-400 font-normal text-xs">({activeCount}/{ALL_PERMISSION_KEYS.length} activos)</span>
          </span>
          <div className="ml-auto flex gap-2">
            <button onClick={resetToDefault}
              className="text-xs text-gray-400 hover:text-white border border-gray-600 px-3 py-1 rounded-lg hover:border-gray-500">
              Restaurar defaults
            </button>
            <button onClick={() => { const all={}; ALL_PERMISSION_KEYS.forEach(k=>all[k]=true); setPermissions(all); }}
              className="text-xs bg-green-600/20 text-green-300 border border-green-600/30 px-3 py-1 rounded-lg hover:bg-green-600/30">
              Todo ✓
            </button>
            <button onClick={() => { const none={}; ALL_PERMISSION_KEYS.forEach(k=>none[k]=false); setPermissions(none); }}
              className="text-xs bg-red-600/20 text-red-300 border border-red-600/30 px-3 py-1 rounded-lg hover:bg-red-600/30">
              Ninguno ✗
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
            <ExclamationTriangleIcon className="w-4 h-4" /> {error}
          </div>
        )}

        {/* Checklist */}
        <PermissionChecklist permissions={permissions} onChange={setPermissions} />

        {/* Botón guardar */}
        <div className="flex justify-end gap-3 pt-2">
          {saved && (
            <div className="flex items-center gap-1.5 text-green-400 text-sm">
              <CheckCircleIcon className="w-4 h-4" /> ¡Permisos guardados!
            </div>
          )}
          <button onClick={handleSave} disabled={saving}
            className="bg-handler-red hover:bg-red-700 disabled:opacity-50 text-white font-medium px-6 py-2 rounded-lg text-sm flex items-center gap-2">
            {saving ? <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Guardando...</> : <><CheckCircleIcon className="w-4 h-4" /> Guardar Permisos</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Página Principal ─────────────────────────────────────────────────────────
const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedUser, setExpandedUser] = useState(null);
  const [notification, setNotification] = useState(null);

  const notify = (type, msg) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authAPI.listUsers();
      setUsers(res.data.users);
    } catch (err) {
      notify('danger', err.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleDelete = async (user) => {
    if (!window.confirm(`¿Eliminar al usuario "${user.username}"?\nEsta acción no se puede deshacer.`)) return;
    try {
      await authAPI.deleteUser(user.id);
      notify('success', `Usuario "${user.username}" eliminado.`);
      loadUsers();
    } catch (err) {
      notify('danger', err.message || 'Error al eliminar usuario');
    }
  };

  const handlePermissionsSaved = (userId, newPerms) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, permissions: newPerms } : u));
    notify('success', 'Permisos actualizados en tiempo real ✓');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Modales */}
      {showCreate && (
        <CreateUserModal onClose={() => setShowCreate(false)} onCreated={loadUsers} />
      )}

      {/* Notificación flotante */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className={`flex items-center gap-3 border rounded-xl px-4 py-3 shadow-2xl text-sm
            ${notification.type === 'success' ? 'bg-green-900/80 border-green-600/50 text-green-200' : 'bg-red-900/80 border-red-600/50 text-red-200'}`}>
            {notification.type === 'success' ? <CheckCircleIcon className="w-5 h-5 shrink-0" /> : <XCircleIcon className="w-5 h-5 shrink-0" />}
            {notification.msg}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/30 to-blue-500/10 border border-blue-500/30 flex items-center justify-center">
          <UsersIcon className="w-7 h-7 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Gestión de Usuarios</h1>
          <p className="text-gray-400 text-sm">Crear, editar y controlar los permisos de cada usuario</p>
        </div>
        <div className="ml-auto flex gap-3">
          <button onClick={loadUsers} className="btn-secondary px-4 py-2 flex items-center gap-2">
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
          </button>
          <button onClick={() => setShowCreate(true)}
            className="bg-handler-red hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2">
            <PlusIcon className="w-4 h-4" /> Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl px-5 py-3 text-sm text-blue-200 flex items-start gap-3">
        <ShieldCheckIcon className="w-5 h-5 shrink-0 mt-0.5 text-blue-400" />
        <div>
          <strong>Control granular de permisos:</strong> Haga clic en el botón <strong>"Permisos"</strong> de cada usuario para ver y editar en detalle qué puede o no hacer.
          Los cambios se aplican <strong>en tiempo real</strong> (en la próxima acción del usuario, sin necesidad de reiniciar sesión).
        </div>
      </div>

      {/* Lista de usuarios */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <ArrowPathIcon className="w-8 h-8 text-handler-red animate-spin" />
        </div>
      ) : (
        <div className="bg-surface-400 border border-gray-700/50 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-700/50 flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-gray-400" />
            <span className="text-white font-semibold">Usuarios registrados</span>
            <span className="ml-auto text-xs text-gray-500">{users.length} usuario{users.length !== 1 ? 's' : ''}</span>
          </div>

          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-3">
              <UsersIcon className="w-12 h-12 opacity-30" />
              <p>No hay usuarios registrados</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700/30">
              {users.map(user => (
                <div key={user.id}>
                  {/* Fila del usuario */}
                  <div className="flex items-center gap-4 px-5 py-4 hover:bg-surface-300/20 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-surface-300 flex items-center justify-center shrink-0">
                      <UserIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">{user.username}</p>
                        <Badge role={user.role} />
                      </div>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {ALL_PERMISSION_KEYS.filter(k => user.permissions?.[k]).length}/{ALL_PERMISSION_KEYS.length} permisos activos ·
                        Creado: {new Date(user.created_at).toLocaleDateString('es-CO')}
                      </p>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors
                          ${expandedUser === user.id
                            ? 'bg-handler-red/20 border-handler-red/50 text-red-300'
                            : 'bg-surface-300 border-gray-600 text-gray-300 hover:border-gray-500'}`}>
                        <ShieldCheckIcon className="w-4 h-4" />
                        Permisos
                        {expandedUser === user.id ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
                      </button>
                      <button onClick={() => handleDelete(user)}
                        title="Eliminar usuario"
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Panel de permisos expandido */}
                  {expandedUser === user.id && (
                    <PermissionsPanel
                      user={user}
                      onSaved={handlePermissionsSaved}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
