import React from 'react';
import { ShieldCheckIcon, LockClosedIcon, ServerIcon, ClockIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const INFO_ROWS = [
    { label: 'Hashing de contraseñas', value: 'bcrypt · 12 rounds', status: 'ok' },
    { label: 'Política de contraseñas', value: '8+ chars · May · Min · Núm · Esp', status: 'ok' },
    { label: 'Auditoría de movimientos', value: 'Logs completos habilitados', status: 'ok' },
    { label: 'Conexiones permitidas', value: 'Solo localhost (127.0.0.1)', status: 'info' },
    { label: 'Duración de sesión JWT', value: '8 horas máximo', status: 'info' },
    { label: 'Sesiones persistentes', value: 'Solo administradores', status: 'info' },
];

const TIPS = [
    { icon: LockClosedIcon, title: 'Contraseñas Robustas', desc: 'Usa contraseñas únicas y complejas en cada cuenta del sistema.', color: '#f59e0b' },
    { icon: ShieldCheckIcon, title: 'Mínimo Privilegio', desc: 'Asigna rol admin únicamente cuando sea estrictamente necesario.', color: '#3b82f6' },
    { icon: ServerIcon,      title: 'Auditoría Regular', desc: 'Revisa los logs de movimientos para detectar accesos irregulares.', color: '#22c55e' },
    { icon: ClockIcon,       title: 'Rotación de Claves', desc: 'Cambia las contraseñas de cuentas administrativas periódicamente.', color: '#a855f7' },
];

const UserManagementSecurity = () => (
    <div className="space-y-6">
        {/* Status grid */}
        <div className="bg-surface-800/40 border border-white/6 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/6">
                <div className="w-8 h-8 bg-handler-red/15 rounded-lg flex items-center justify-center">
                    <ShieldCheckIcon className="w-4 h-4 text-handler-red" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white">Estado de Seguridad del Sistema</h3>
                    <p className="text-xs text-gray-500">Configuración activa de políticas de acceso</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    Protegido
                </div>
            </div>
            <div className="divide-y divide-white/4">
                {INFO_ROWS.map((row, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-white/2 transition-colors">
                        <span className="text-sm text-gray-400">{row.label}</span>
                        <div className="flex items-center gap-2">
                            {row.status === 'ok'
                                ? <CheckCircleIcon className="w-4 h-4 text-green-400" />
                                : <ShieldCheckIcon className="w-4 h-4 text-blue-400" />
                            }
                            <span className={`text-xs font-semibold ${row.status === 'ok' ? 'text-green-400' : 'text-blue-400'}`}>
                                {row.value}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Tips */}
        <div>
            <div className="flex items-center gap-2 mb-3 px-1">
                <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Recomendaciones</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {TIPS.map(({ icon: Icon, title, desc, color }, i) => (
                    <div key={i} className="flex gap-3.5 p-4 bg-surface-800/40 border border-white/6 rounded-2xl hover:bg-surface-800/60 transition-colors">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                            <Icon className="w-4.5 h-4.5" style={{ color }} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white mb-0.5">{title}</p>
                            <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default UserManagementSecurity;