import React from 'react';
import { KeyIcon, ShieldCheckIcon, UsersIcon, TrashIcon } from '@heroicons/react/24/outline';

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

const UserManagementTable = ({ users, currentUser, onChangePassword, onDeleteUser }) => {
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
            {/* Table header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-white/6 bg-surface-900/50">
                {['Usuario', 'Rol', 'Estado', 'Creado', 'Acción'].map(h => (
                    <span key={h} className="text-xs font-bold text-gray-500 uppercase tracking-widest">{h}</span>
                ))}
            </div>

            {/* Rows */}
            <div className="divide-y divide-white/4">
                {users.map(user => (
                    <div
                        key={user.id}
                        className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-3.5 hover:bg-white/3 transition-colors group"
                    >
                        {/* User */}
                        <div className="flex items-center gap-3 min-w-0">
                            <Avatar username={user.username} />
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-white font-semibold text-sm truncate">{user.username}</span>
                                    {user.id === currentUser?.id && (
                                        <span className="text-xs bg-blue-500/15 text-blue-400 px-1.5 py-0.5 rounded-md border border-blue-500/20 font-semibold shrink-0">Tú</span>
                                    )}
                                </div>
                                <span className="text-xs text-gray-600 font-mono">#{user.id}</span>
                            </div>
                        </div>

                        {/* Role */}
                        <div><RoleBadge role={user.role} /></div>

                        {/* Status */}
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shrink-0" />
                            <span className="text-green-400 text-xs font-semibold">Activo</span>
                        </div>

                        {/* Date */}
                        <div className="flex flex-col">
                            <span className="text-gray-400 text-xs">{new Date(user.created_at).toLocaleDateString('es-ES')}</span>
                            <span className="text-gray-600 text-xs">{new Date(user.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        {/* Action */}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                            <button
                                onClick={() => onChangePassword(user)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 rounded-lg text-blue-400 hover:text-blue-300 text-xs font-semibold transition-all duration-150"
                                title="Cambiar contraseña"
                            >
                                <KeyIcon className="w-3.5 h-3.5" />
                                Contraseña
                            </button>
                            {user.id !== currentUser?.id && (
                                <button
                                    onClick={() => onDeleteUser(user)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 rounded-lg text-red-400 hover:text-red-300 text-xs font-semibold transition-all duration-150"
                                    title="Eliminar usuario"
                                >
                                    <TrashIcon className="w-3.5 h-3.5" />
                                    Eliminar
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UserManagementTable;