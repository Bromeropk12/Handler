import React from 'react';
import { ChartBarIcon, UsersIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const TABS = [
    { id: 'overview', label: 'Resumen', icon: ChartBarIcon, desc: 'Vista general' },
    { id: 'users',    label: 'Usuarios', icon: UsersIcon,    desc: 'Gestionar miembros' },
    { id: 'security', label: 'Seguridad', icon: ShieldCheckIcon, desc: 'Políticas de acceso' },
];

const UserManagementTabs = ({ activeTab, setActiveTab }) => (
    <div className="flex gap-1 px-8 pt-5 border-b border-white/6">
        {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-2.5 px-5 py-3 rounded-t-xl font-medium text-sm transition-all duration-200 border-b-2 -mb-px ${
                        active
                            ? 'text-white border-handler-red bg-handler-red/8'
                            : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/4'
                    }`}
                >
                    <tab.icon className={`w-4 h-4 transition-colors ${active ? 'text-handler-red' : ''}`} />
                    {tab.label}
                </button>
            );
        })}
    </div>
);

export default UserManagementTabs;