import React from 'react';
import { MagnifyingGlassIcon, FunnelIcon, UserPlusIcon } from '@heroicons/react/24/outline';

const ROLES = [
    { value: 'all',      label: 'Todos los roles' },
    { value: 'admin',    label: 'Administradores' },
    { value: 'operator', label: 'Operadores' },
];

const UserManagementFilters = ({ searchTerm, setSearchTerm, roleFilter, setRoleFilter, onCreateUser }) => (
    <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
                type="text"
                placeholder="Buscar por nombre de usuario..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-800 border border-white/8 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-handler-red/50 focus:ring-1 focus:ring-handler-red/30 transition-all"
            />
        </div>

        {/* Role filter */}
        <div className="relative">
            <FunnelIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="appearance-none pl-10 pr-8 py-2.5 bg-surface-800 border border-white/8 rounded-xl text-sm text-white focus:outline-none focus:border-handler-red/50 focus:ring-1 focus:ring-handler-red/30 transition-all cursor-pointer"
            >
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
        </div>

        {/* Create button */}
        <button
            onClick={onCreateUser}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-handler-red to-red-700 hover:from-red-500 hover:to-handler-red text-white font-semibold text-sm rounded-xl shadow-lg shadow-handler-red/25 transition-all duration-200 hover:shadow-handler-red/40 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
        >
            <UserPlusIcon className="w-4 h-4" />
            Nuevo Usuario
        </button>
    </div>
);

export default UserManagementFilters;