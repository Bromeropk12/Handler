import React from 'react';
import { XMarkIcon, UsersIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const UserManagementHeader = ({ onClose }) => (
    <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-white/6">
        <div className="flex items-center gap-4">
            <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-handler-red to-handler-gold rounded-2xl flex items-center justify-center shadow-lg shadow-handler-red/30">
                    <UsersIcon className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-surface-900 flex items-center justify-center">
                    <ShieldCheckIcon className="w-3 h-3 text-white" />
                </div>
            </div>
            <div>
                <h1 className="text-xl font-black text-white tracking-tight">Centro de Control de Usuarios</h1>
                <p className="text-xs text-gray-500 mt-0.5">Gestión de acceso, roles y seguridad del sistema</p>
            </div>
        </div>
        <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/8 border border-transparent hover:border-white/10 transition-all duration-200"
        >
            <XMarkIcon className="w-5 h-5" />
        </button>
    </div>
);

export default UserManagementHeader;