import React from 'react';
import { UsersIcon, ShieldCheckIcon, UserGroupIcon, ClockIcon } from '@heroicons/react/24/outline';

const CARDS = [
    { key: 'total',     label: 'Total Usuarios',    icon: UsersIcon,       color: '#3b82f6', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.2)'  },
    { key: 'admins',    label: 'Administradores',   icon: ShieldCheckIcon, color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)'   },
    { key: 'operators', label: 'Operadores',         icon: UserGroupIcon,   color: '#22c55e', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)'   },
    { key: 'recent',    label: 'Nuevos (7 días)',    icon: ClockIcon,       color: '#a855f7', bg: 'rgba(168,85,247,0.08)',  border: 'rgba(168,85,247,0.2)'  },
];

const UserManagementStats = ({ stats }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CARDS.map(({ key, label, icon: Icon, color, bg, border }) => (
            <div
                key={key}
                className="rounded-2xl p-5 flex flex-col gap-3 transition-transform hover:-translate-y-0.5 duration-200"
                style={{ background: bg, border: `1px solid ${border}` }}
            >
                <div className="flex items-center justify-between gap-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}22` }}>
                        <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <span className="text-2xl font-black text-white truncate">{stats[key]}</span>
                </div>
                <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider leading-tight line-clamp-2">{label}</p>
            </div>
        ))}
    </div>
);

export default UserManagementStats;