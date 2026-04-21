import React from 'react';
import { UserPlusIcon, UsersIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner';

const ACTIONS = [
    {
        icon: UserPlusIcon,
        title: 'Crear Usuario',
        description: 'Agregar nuevo miembro al sistema',
        key: 'create',
        gradient: 'from-emerald-600/15 to-emerald-800/10',
        border: 'border-emerald-500/20',
        iconBg: 'bg-emerald-500/15',
        iconColor: 'text-emerald-400',
        hoverBg: 'hover:from-emerald-600/25 hover:to-emerald-800/20',
        dot: '#22c55e'
    },
    {
        icon: UsersIcon,
        title: 'Gestionar Usuarios',
        description: 'Ver y editar cuentas existentes',
        key: 'manage',
        gradient: 'from-blue-600/15 to-blue-800/10',
        border: 'border-blue-500/20',
        iconBg: 'bg-blue-500/15',
        iconColor: 'text-blue-400',
        hoverBg: 'hover:from-blue-600/25 hover:to-blue-800/20',
        dot: '#3b82f6'
    },
    {
        icon: ArrowPathIcon,
        title: 'Actualizar Datos',
        description: 'Recargar información del servidor',
        key: 'refresh',
        gradient: 'from-purple-600/15 to-purple-800/10',
        border: 'border-purple-500/20',
        iconBg: 'bg-purple-500/15',
        iconColor: 'text-purple-400',
        hoverBg: 'hover:from-purple-600/25 hover:to-purple-800/20',
        dot: '#a855f7'
    }
];

const UserManagementQuickActions = ({ onCreateUser, onManageUsers, onRefresh, loading }) => {
    const handlers = { create: onCreateUser, manage: onManageUsers, refresh: onRefresh };

    return (
        <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-1">Acciones rápidas</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {ACTIONS.map(a => (
                    <button
                        key={a.key}
                        onClick={handlers[a.key]}
                        disabled={a.key === 'refresh' && loading}
                        className={`group flex items-center gap-4 p-4 bg-gradient-to-br ${a.gradient} ${a.hoverBg} border ${a.border} rounded-2xl transition-all duration-200 text-left disabled:opacity-60 hover:scale-[1.01] active:scale-[0.99]`}
                    >
                        <div className={`w-11 h-11 ${a.iconBg} rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                            {a.key === 'refresh' && loading
                                ? <LoadingSpinner size="sm" />
                                : <a.icon className={`w-5 h-5 ${a.iconColor}`} />
                            }
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold text-white text-[13px] sm:text-sm leading-tight">{a.title}</p>
                            <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 line-clamp-2 leading-snug">{a.description}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default UserManagementQuickActions;