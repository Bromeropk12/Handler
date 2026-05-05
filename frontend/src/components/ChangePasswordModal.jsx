import React, { useState } from 'react';
import { KeyIcon, EyeIcon, EyeSlashIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';

const PasswordField = ({ label, value, onChange, error, placeholder }) => {
    const [show, setShow] = useState(false);
    return (
        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">{label}</label>
            <div className="relative">
                <input
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`w-full bg-surface-900 border rounded-xl px-4 py-2.5 pr-10 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 transition-all ${
                        error ? 'border-red-500/50 focus:ring-red-500/20' : 'border-white/8 focus:border-blue-500/50 focus:ring-blue-500/20'
                    }`}
                />
                <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                    {show ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
            </div>
            {error && (
                <p className="flex items-center gap-1.5 text-red-400 text-xs mt-1.5">
                    <ExclamationTriangleIcon className="w-3.5 h-3.5 shrink-0" /> {error}
                </p>
            )}
        </div>
    );
};

const ChangePasswordModal = ({ isOpen, onClose, user, formData, setFormData, errors, loading, onSubmit }) => (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md" noPadding>
        <div className="flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-500/15 border border-blue-500/25 rounded-xl flex items-center justify-center">
                        <KeyIcon className="w-4.5 h-4.5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-white">Cambiar Contraseña</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Usuario: <span className="text-blue-400 font-semibold">{user?.username}</span>
                        </p>
                    </div>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/8 transition-all">
                    <XMarkIcon className="w-4 h-4" />
                </button>
            </div>

            {/* User pill */}
            <div className="px-6 pt-5">
                <div className="flex items-center gap-3 bg-surface-800 border border-white/6 rounded-xl p-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-handler-red to-handler-gold rounded-lg flex items-center justify-center text-white font-black text-sm">
                        {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-white text-sm font-semibold">{user?.username}</p>
                        <p className="text-gray-500 text-xs capitalize">
                            {user?.role === 'admin' ? '🛡️ Administrador' : '⚙️ Operador'}
                        </p>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                        <KeyIcon className="w-3 h-3" />
                        Cambio forzado
                    </div>
                </div>
            </div>

            <form onSubmit={onSubmit} className="px-6 py-5 space-y-4">
                <PasswordField
                    label="Nueva contraseña"
                    value={formData.newPassword}
                    onChange={e => setFormData(p => ({ ...p, newPassword: e.target.value }))}
                    error={errors.newPassword}
                    placeholder="••••••••"
                />
                <PasswordField
                    label="Confirmar nueva contraseña"
                    value={formData.confirmPassword}
                    onChange={e => setFormData(p => ({ ...p, confirmPassword: e.target.value }))}
                    error={errors.confirmPassword}
                    placeholder="••••••••"
                />

                {/* Match indicator */}
                {formData.newPassword && formData.confirmPassword && (
                    <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg border ${
                        formData.newPassword === formData.confirmPassword
                            ? 'bg-green-500/8 border-green-500/20 text-green-400'
                            : 'bg-red-500/8 border-red-500/20 text-red-400'
                    }`}>
                        {formData.newPassword === formData.confirmPassword ? '✓ Las contraseñas coinciden' : '✕ Las contraseñas no coinciden'}
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-surface-700 hover:bg-surface-600 text-gray-300 font-medium text-sm rounded-xl border border-white/6 transition-all">
                        Cancelar
                    </button>
                    <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-900/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading ? <><LoadingSpinner size="sm" /> Actualizando...</> : <><KeyIcon className="w-4 h-4" /> Cambiar Contraseña</>}
                    </button>
                </div>
            </form>
        </div>
    </Modal>
);

export default ChangePasswordModal;