import React, { useState } from 'react';
import { UserPlusIcon, EyeIcon, EyeSlashIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';

const Field = ({ label, error, children }) => (
    <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">{label}</label>
        {children}
        {error && (
            <p className="flex items-center gap-1.5 text-red-400 text-xs mt-1.5">
                <ExclamationTriangleIcon className="w-3.5 h-3.5 shrink-0" /> {error}
            </p>
        )}
    </div>
);

const PasswordField = ({ label, value, onChange, error, placeholder }) => {
    const [show, setShow] = useState(false);
    return (
        <Field label={label} error={error}>
            <div className="relative">
                <input
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`w-full bg-surface-900 border rounded-xl px-4 py-2.5 pr-10 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 transition-all ${
                        error ? 'border-red-500/50 focus:ring-red-500/20' : 'border-white/8 focus:border-handler-red/50 focus:ring-handler-red/20'
                    }`}
                />
                <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                    {show ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
            </div>
        </Field>
    );
};

const ROLES = [
    { value: 'operator', label: '⚙️  Operador', desc: 'Acceso estándar al sistema' },
    { value: 'admin',    label: '🛡️  Administrador', desc: 'Control total del sistema' },
];

const CreateUserModal = ({ isOpen, onClose, formData, setFormData, errors, loading, onSubmit }) => (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md" noPadding>
        <div className="flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-500/15 border border-emerald-500/25 rounded-xl flex items-center justify-center">
                        <UserPlusIcon className="w-4.5 h-4.5 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-white">Crear Nuevo Usuario</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Agregar miembro al sistema</p>
                    </div>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/8 transition-all">
                    <XMarkIcon className="w-4 h-4" />
                </button>
            </div>

            <form onSubmit={onSubmit} className="px-6 py-5 space-y-4">
                {/* Username */}
                <Field label="Nombre de usuario" error={errors.username}>
                    <input
                        type="text"
                        value={formData.username}
                        onChange={e => setFormData(p => ({ ...p, username: e.target.value }))}
                        placeholder="ej: operador_luis"
                        className={`w-full bg-surface-900 border rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 transition-all ${
                            errors.username ? 'border-red-500/50 focus:ring-red-500/20' : 'border-white/8 focus:border-handler-red/50 focus:ring-handler-red/20'
                        }`}
                    />
                </Field>

                {/* Role selector cards */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Rol del usuario</label>
                    <div className="grid grid-cols-2 gap-2">
                        {ROLES.map(r => (
                            <button
                                key={r.value}
                                type="button"
                                onClick={() => setFormData(p => ({ ...p, role: r.value }))}
                                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                                    formData.role === r.value
                                        ? 'bg-handler-red/12 border-handler-red/40 ring-1 ring-handler-red/30'
                                        : 'bg-surface-900 border-white/8 hover:border-white/16'
                                }`}
                            >
                                <span className="text-sm font-semibold text-white">{r.label}</span>
                                <span className="text-xs text-gray-500 mt-0.5">{r.desc}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <PasswordField
                    label="Contraseña"
                    value={formData.password}
                    onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                    error={errors.password}
                    placeholder="••••••••"
                />
                <PasswordField
                    label="Confirmar contraseña"
                    value={formData.confirmPassword}
                    onChange={e => setFormData(p => ({ ...p, confirmPassword: e.target.value }))}
                    error={errors.confirmPassword}
                    placeholder="••••••••"
                />

                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-surface-700 hover:bg-surface-600 text-gray-300 font-medium text-sm rounded-xl border border-white/6 transition-all">
                        Cancelar
                    </button>
                    <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-900/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading ? <><LoadingSpinner size="sm" /> Creando...</> : <><UserPlusIcon className="w-4 h-4" /> Crear Usuario</>}
                    </button>
                </div>
            </form>
        </div>
    </Modal>
);

export default CreateUserModal;