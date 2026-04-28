import React, { useState } from 'react';
import { KeyIcon, ShieldCheckIcon, UsersIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon, ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { authAPI } from '../services/api';
import { PERMISSION_MODULES, ALL_PERMISSION_KEYS, DEFAULT_PERMISSIONS, COLOR_MAP } from '../config/permissions';

// ─── Badges y Avatar ─────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg ${
        role === 'admin'
            ? 'bg-red-500/12 text-red-400 border border-red-500/20'
            : 'bg-blue-500/12 text-blue-400 border border-blue-500/20'
    }`}>
        <ShieldCheckIcon className="w-3 h-3" />
        {role === 'admin' ? 'Admin' : 'Operador'}
    </span>
);

const Avatar = ({ username }) => {
    const colors = ['from-handler-red to-handler-gold', 'from-blue-500 to-cyan-500', 'from-purple-500 to-pink-500', 'from-emerald-500 to-teal-500'];
    const color = colors[username.charCodeAt(0) % colors.length];
    return (
        <div className={`w-10 h-10 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center shadow-lg shrink-0`}>
            <span className="text-white font-black text-sm">{username.charAt(0).toUpperCase()}</span>
        </div>
    );
};

// ─── Toggle switch ────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange }) => (
    <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 transition-colors duration-200 cursor-pointer focus:outline-none
            ${checked ? 'bg-green-500 border-green-500' : 'bg-gray-600 border-gray-600'}`}
    >
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
);

// ─── Panel de permisos inline ─────────────────────────────────────────────────
const PermissionsPanel = ({ user, onSaved }) => {
    const [permissions, setPermissions] = useState(user.permissions || DEFAULT_PERMISSIONS(user.role));
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [expandedModules, setExpandedModules] = useState({});

    const activeCount = ALL_PERMISSION_KEYS.filter(k => permissions[k]).length;

    const toggleModule = (id) => setExpandedModules(p => ({ ...p, [id]: !p[id] }));

    const handleModuleToggle = (module, value) => {
        const upd = {};
        module.permissions.forEach(p => { upd[p.key] = value; });
        setPermissions(prev => ({ ...prev, ...upd }));
    };

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

    return (
        <div className="border-t border-white/6 bg-surface-900/60 px-5 py-4 space-y-4">
            {/* Cabecera del panel */}
            <div className="flex items-center gap-3 flex-wrap">
                <ShieldCheckIcon className="w-4 h-4 text-handler-red shrink-0" />
                <span className="text-white text-sm font-semibold">
                    Permisos de <strong>{user.username}</strong>
                    <span className="ml-2 text-gray-500 font-normal text-xs">({activeCount}/{ALL_PERMISSION_KEYS.length} activos)</span>
                </span>
                <div className="ml-auto flex gap-2 flex-wrap">
                    <button onClick={() => setPermissions(DEFAULT_PERMISSIONS(user.role))}
                        className="text-xs text-gray-400 hover:text-white border border-gray-700 px-2.5 py-1 rounded-lg hover:border-gray-500 transition-colors">
                        Defaults
                    </button>
                    <button onClick={() => { const all={}; ALL_PERMISSION_KEYS.forEach(k=>all[k]=true); setPermissions(all); }}
                        className="text-xs bg-green-600/20 text-green-300 border border-green-600/30 px-2.5 py-1 rounded-lg hover:bg-green-600/30 transition-colors">
                        Todo ✓
                    </button>
                    <button onClick={() => { const none={}; ALL_PERMISSION_KEYS.forEach(k=>none[k]=false); setPermissions(none); }}
                        className="text-xs bg-red-600/20 text-red-300 border border-red-600/30 px-2.5 py-1 rounded-lg hover:bg-red-600/30 transition-colors">
                        Ninguno ✗
                    </button>
                </div>
            </div>

            {error && <p className="text-red-400 text-xs bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>}

            {/* Módulos de permisos */}
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {PERMISSION_MODULES.map(module => {
                    const enabled = module.permissions.filter(p => permissions[p.key] === true).length;
                    const total = module.permissions.length;
                    const allOn = enabled === total;
                    const isOpen = expandedModules[module.id] !== false; // abierto por defecto
                    const colorClass = COLOR_MAP[module.color] || COLOR_MAP.blue;

                    return (
                        <div key={module.id} className="border border-white/6 rounded-xl overflow-hidden">
                            <div className="flex items-center gap-2 px-3 py-2 bg-surface-800/60 cursor-pointer select-none"
                                onClick={() => toggleModule(module.id)}>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${colorClass}`}>{module.label}</span>
                                <span className="text-gray-600 text-xs ml-auto">{enabled}/{total}</span>
                                <div onClick={e => e.stopPropagation()}>
                                    <Toggle checked={allOn} onChange={v => handleModuleToggle(module, v)} />
                                </div>
                                {isOpen ? <ChevronUpIcon className="w-3.5 h-3.5 text-gray-600" /> : <ChevronDownIcon className="w-3.5 h-3.5 text-gray-600" />}
                            </div>
                            {isOpen && (
                                <div className="divide-y divide-white/4">
                                    {module.permissions.map(perm => (
                                        <div key={perm.key} className="flex items-center gap-3 px-4 py-2 hover:bg-white/3">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-white font-medium">{perm.label}</p>
                                                <p className="text-xs text-gray-600 truncate">{perm.description}</p>
                                            </div>
                                            <Toggle
                                                checked={permissions[perm.key] === true}
                                                onChange={v => setPermissions(prev => ({ ...prev, [perm.key]: v }))}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Guardar */}
            <div className="flex items-center justify-end gap-3 pt-1">
                {saved && (
                    <span className="flex items-center gap-1 text-green-400 text-xs">
                        <CheckCircleIcon className="w-4 h-4" /> Guardado
                    </span>
                )}
                <button onClick={handleSave} disabled={saving}
                    className="bg-handler-red hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors">
                    {saving ? <><ArrowPathIcon className="w-3.5 h-3.5 animate-spin" /> Guardando...</> : <><CheckCircleIcon className="w-3.5 h-3.5" /> Guardar Permisos</>}
                </button>
            </div>
        </div>
    );
};

// ─── Tabla principal ──────────────────────────────────────────────────────────
const UserManagementTable = ({ users, currentUser, onChangePassword, onDeleteUser, onPermissionsSaved }) => {
    const [expandedPerms, setExpandedPerms] = useState(null);

    if (users.length === 0) return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-surface-800 rounded-2xl flex items-center justify-center mb-4 border border-white/6">
                <UsersIcon className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-400 mb-1">Sin resultados</h3>
            <p className="text-sm text-gray-600">Ajusta los filtros de búsqueda para encontrar usuarios</p>
        </div>
    );

    return (
        <div className="bg-surface-800/40 border border-white/6 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-white/6 bg-surface-900/50">
                {['Usuario', 'Rol', 'Permisos', 'Creado', 'Acciones'].map(h => (
                    <span key={h} className="text-xs font-bold text-gray-500 uppercase tracking-widest">{h}</span>
                ))}
            </div>

            <div className="divide-y divide-white/4">
                {users.map(user => {
                    const activePerms = ALL_PERMISSION_KEYS.filter(k => user.permissions?.[k]).length;
                    const isExpanded = expandedPerms === user.id;

                    return (
                        <div key={user.id}>
                            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-3.5 hover:bg-white/3 transition-colors group">
                                {/* Usuario */}
                                <div className="flex items-center gap-3 min-w-0">
                                    <Avatar username={user.username} />
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-semibold text-sm truncate">{user.username}</span>
                                            {user.id === currentUser?.id && (
                                                <span className="text-xs bg-blue-500/15 text-blue-400 px-1.5 py-0.5 rounded-md border border-blue-500/20 font-semibold shrink-0">Tú</span>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-600 font-mono">#{String(user.id).slice(0,8)}...</span>
                                    </div>
                                </div>

                                {/* Rol */}
                                <div><RoleBadge role={user.role} /></div>

                                {/* Permisos activos */}
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-white/6 rounded-full h-1.5">
                                        <div className="bg-handler-red h-1.5 rounded-full transition-all"
                                            style={{ width: `${(activePerms / ALL_PERMISSION_KEYS.length) * 100}%` }} />
                                    </div>
                                    <span className="text-xs text-gray-500 shrink-0">{activePerms}/{ALL_PERMISSION_KEYS.length}</span>
                                </div>

                                {/* Fecha */}
                                <div className="flex flex-col">
                                    <span className="text-gray-400 text-xs">{new Date(user.created_at).toLocaleDateString('es-ES')}</span>
                                    <span className="text-gray-600 text-xs">{new Date(user.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>

                                {/* Acciones */}
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setExpandedPerms(isExpanded ? null : user.id)}
                                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all
                                            ${isExpanded ? 'bg-handler-red/20 border-handler-red/40 text-red-300' : 'bg-surface-700 border-white/8 text-gray-300 hover:border-handler-red/30 hover:text-white'}`}
                                        title="Gestionar permisos">
                                        <ShieldCheckIcon className="w-3.5 h-3.5" />
                                        Permisos
                                        {isExpanded ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
                                    </button>
                                    <button onClick={() => onChangePassword(user)}
                                        className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-blue-400 text-xs font-semibold transition-all"
                                        title="Cambiar contraseña">
                                        <KeyIcon className="w-3.5 h-3.5" />
                                    </button>
                                    {user.id !== currentUser?.id && (
                                        <button onClick={() => onDeleteUser(user)}
                                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 text-xs font-semibold transition-all"
                                            title="Eliminar usuario">
                                            <TrashIcon className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Panel de permisos expandido */}
                            {isExpanded && (
                                <PermissionsPanel
                                    user={user}
                                    onSaved={(uid, perms) => {
                                        if (onPermissionsSaved) onPermissionsSaved(uid, perms);
                                    }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default UserManagementTable;