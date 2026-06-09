import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import {
    XMarkIcon, KeyIcon, CheckCircleIcon,
    ExclamationTriangleIcon, EyeIcon, EyeSlashIcon,
    ShieldCheckIcon, UserIcon
} from '@heroicons/react/24/outline';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';

const CHECKS = [
    { test: /.{8,}/, label: '8+ caracteres', short: '8+' },
    { test: /[A-Z]/, label: 'Mayúscula (A-Z)', short: 'A-Z' },
    { test: /[a-z]/, label: 'Minúscula (a-z)', short: 'a-z' },
    { test: /\d/, label: 'Número (0-9)', short: '0-9' },
    { test: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, label: 'Carácter especial', short: '#@!' },
];

const PasswordInput = ({ label, name, value, onChange, error, placeholder }) => {
    const [show, setShow] = useState(false);
    return (
        <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                {label}
            </label>
            <div className="relative">
                <input
                    type={show ? 'text' : 'password'}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    autoComplete="new-password"
                    className={`w-full bg-surface-900 border rounded-xl px-4 py-3 pr-11 text-white placeholder-gray-600 text-sm transition-all duration-200 focus:outline-none focus:ring-2 ${error
                        ? 'border-red-500/60 focus:ring-red-500/30'
                        : 'border-white/8 focus:border-primary-500/60 focus:ring-primary-500/20'
                        }`}
                />
                <button
                    type="button"
                    onClick={() => setShow(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                    {show ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
            </div>
            {error && (
                <p className="flex items-center gap-1.5 text-red-400 text-xs mt-1.5">
                    <ExclamationTriangleIcon className="w-3.5 h-3.5 shrink-0" />
                    {error}
                </p>
            )}
        </div>
    );
};

const UserSettings = ({ isOpen, onClose }) => {
    const { user, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState('password');
    const [passwordFormData, setPasswordFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [usernameFormData, setUsernameFormData] = useState({ newUsername: '', currentPassword: '' });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [errors, setErrors] = useState({});

    const handlePasswordInputChange = (e) => {
        const { name, value } = e.target;
        setPasswordFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
        if (message) setMessage(null);
    };

    const handleUsernameInputChange = (e) => {
        const { name, value } = e.target;
        setUsernameFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
        if (message) setMessage(null);
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setErrors({});

        const newErrors = {};
        if (!passwordFormData.currentPassword) newErrors.currentPassword = 'La contraseña actual es requerida';
        if (!passwordFormData.newPassword) newErrors.newPassword = 'La nueva contraseña es requerida';
        if (!passwordFormData.confirmPassword) newErrors.confirmPassword = 'La confirmación es requerida';
        if (passwordFormData.newPassword !== passwordFormData.confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden';

        // Solo validar fuerza de contraseña para operadores, no para admins
        if (user?.role === 'operator' && passwordFormData.newPassword) {
            const failed = CHECKS.filter(c => !c.test.test(passwordFormData.newPassword)).map(c => c.label);
            if (failed.length) newErrors.newPassword = failed.join(' · ');
        }

        if (Object.keys(newErrors).length) {
            setErrors(newErrors);
            setLoading(false);
            return;
        }

        try {
            await authAPI.changePassword({
                currentPassword: passwordFormData.currentPassword,
                newPassword: passwordFormData.newPassword,
                confirmPassword: passwordFormData.confirmPassword,
            });
            setMessage({ type: 'success', text: 'Contraseña actualizada correctamente' });
            setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(onClose, 2200);
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Error al cambiar contraseña' });
        } finally {
            setLoading(false);
        }
    };

    const handleUsernameSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setErrors({});

        const newErrors = {};
        if (!usernameFormData.newUsername) newErrors.newUsername = 'El nuevo nombre de usuario es requerido';
        if (!usernameFormData.currentPassword) newErrors.currentPassword = 'La contraseña actual es requerida';
        if (usernameFormData.newUsername.length < 3) newErrors.newUsername = 'El nombre de usuario debe tener al menos 3 caracteres';

        if (Object.keys(newErrors).length) {
            setErrors(newErrors);
            setLoading(false);
            return;
        }

        try {
            const response = await authAPI.changeUsername({
                newUsername: usernameFormData.newUsername,
                currentPassword: usernameFormData.currentPassword,
            });
            setMessage({ type: 'success', text: 'Nombre de usuario actualizado correctamente' });
            setUsernameFormData({ newUsername: '', currentPassword: '' });
            // Actualizar el contexto de auth para que sidebar refleje el nuevo nombre
            if (response.data?.data?.user) {
                updateUser(response.data.data.user);
            }
            setTimeout(onClose, 2200);
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Error al cambiar nombre de usuario' });
        } finally {
            setLoading(false);
        }
    };

    const passed = CHECKS.filter(c => c.test.test(passwordFormData.newPassword)).length;
    const strengthPct = (passed / CHECKS.length) * 100;
    const strengthColor = passed === 5 ? '#22c55e' : passed >= 3 ? '#eab308' : passed >= 1 ? '#f97316' : '#374151';
    const strengthLabel = passed === 5 ? 'Fuerte' : passed >= 3 ? 'Moderada' : passed >= 1 ? 'Débil' : '';

    return (
        <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
            <div className="flex flex-col">
                {/* ── HEADER ── */}
                <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-white/8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg flex items-center justify-center shadow-lg shadow-primary-900/40">
                            <KeyIcon className="w-4.5 h-4.5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white leading-none">Configuración de Cuenta</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Seguridad y credenciales</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/8 transition-all"
                    >
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                </div>

                {/* ── TABS (solo para admins) ── */}
                {user?.role === 'admin' && (
                    <div className="flex gap-1 px-6 pt-5 bg-surface-500">
                        {[
                            { id: 'password', label: 'Contraseña', icon: KeyIcon },
                            { id: 'username', label: 'Usuario', icon: UserIcon }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${activeTab === tab.id
                                    ? 'bg-primary-600 text-white shadow-lg'
                                    : 'text-gray-400 hover:text-white hover:bg-surface-600'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}

                <div className="px-6 py-5 space-y-5">
                    {/* ── USER CARD ── */}
                    <div className="flex items-center gap-3 bg-surface-800 border border-white/6 rounded-xl p-4">
                        <div className="w-11 h-11 bg-gradient-to-br from-handler-red to-handler-gold rounded-xl flex items-center justify-center shadow-lg text-white font-black text-lg">
                            {(user?.username || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold text-sm truncate">{user?.username}</p>
                            <p className="text-gray-500 text-xs capitalize">
                                {user?.role === 'admin' ? '🛡️ Administrador' : '⚙️ Operador'}
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium px-2.5 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                            Activo
                        </div>
                    </div>

                    {/* ── PASSWORD FORM ── */}
                    {activeTab === 'password' && (
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <PasswordInput
                                label="Contraseña actual"
                                name="currentPassword"
                                value={passwordFormData.currentPassword}
                                onChange={handlePasswordInputChange}
                                error={errors.currentPassword}
                                placeholder="••••••••"
                            />

                            <div className="space-y-2">
                                <PasswordInput
                                    label="Nueva contraseña"
                                    name="newPassword"
                                    value={passwordFormData.newPassword}
                                    onChange={handlePasswordInputChange}
                                    error={errors.newPassword}
                                    placeholder="••••••••"
                                />

                                {/* Strength meter - solo mostrar para operadores */}
                                {user?.role === 'operator' && passwordFormData.newPassword.length > 0 && (
                                    <div className="space-y-2 pt-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 bg-surface-900 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${strengthPct}%`, backgroundColor: strengthColor }}
                                                />
                                            </div>
                                            <span className="text-xs font-semibold ml-3" style={{ color: strengthColor }}>
                                                {strengthLabel}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-5 gap-1.5">
                                            {CHECKS.map((check, i) => {
                                                const ok = check.test.test(passwordFormData.newPassword);
                                                return (
                                                    <div
                                                        key={i}
                                                        className={`text-center py-1 rounded-md text-xs font-semibold transition-all duration-200 border ${ok
                                                                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                                                : 'bg-surface-900 border-white/5 text-gray-600'
                                                            }`}
                                                    >
                                                        {check.short}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <PasswordInput
                                label="Confirmar nueva contraseña"
                                name="confirmPassword"
                                value={passwordFormData.confirmPassword}
                                onChange={handlePasswordInputChange}
                                error={errors.confirmPassword}
                                placeholder="••••••••"
                            />

                            {/* Confirm match visual */}
                            {passwordFormData.newPassword && passwordFormData.confirmPassword && (
                                <div className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg border ${passwordFormData.newPassword === passwordFormData.confirmPassword
                                        ? 'bg-green-500/8 border-green-500/20 text-green-400'
                                        : 'bg-red-500/8 border-red-500/20 text-red-400'
                                    }`}>
                                    {passwordFormData.newPassword === passwordFormData.confirmPassword
                                        ? <><CheckCircleIcon className="w-4 h-4" /> Las contraseñas coinciden</>
                                        : <><ExclamationTriangleIcon className="w-4 h-4" /> Las contraseñas no coinciden</>
                                    }
                                </div>
                            )}

                            {/* Feedback message */}
                            {message && (
                                <div className={`flex items-center gap-2.5 p-3 rounded-xl border text-sm font-medium ${message.type === 'success'
                                        ? 'bg-green-600/10 border-green-600/20 text-green-400'
                                        : 'bg-red-600/10 border-red-600/20 text-red-400'
                                    }`}>
                                    {message.type === 'success'
                                        ? <CheckCircleIcon className="w-5 h-5 shrink-0" />
                                        : <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
                                    }
                                    {message.text}
                                </div>
                            )}

                            <div className="flex gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={loading}
                                    className="flex-1 py-2.5 bg-surface-700 hover:bg-surface-600 text-gray-300 hover:text-white font-medium text-sm rounded-xl border border-white/6 transition-all duration-200 disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || (user?.role === 'operator' && passed < 5)}
                                    className="flex-1 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-primary-900/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? <><LoadingSpinner size="sm" /> Actualizando...</> : 'Actualizar Contraseña'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ── USERNAME FORM (solo para admins) ── */}
                    {activeTab === 'username' && user?.role === 'admin' && (
                        <form onSubmit={handleUsernameSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                                    Nuevo nombre de usuario
                                </label>
                                <input
                                    type="text"
                                    name="newUsername"
                                    value={usernameFormData.newUsername}
                                    onChange={handleUsernameInputChange}
                                    placeholder="Ej: administrador"
                                    className={`w-full bg-surface-900 border rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm transition-all duration-200 focus:outline-none focus:ring-2 ${errors.newUsername
                                            ? 'border-red-500/60 focus:ring-red-500/30'
                                            : 'border-white/8 focus:border-primary-500/60 focus:ring-primary-500/20'
                                        }`}
                                />
                                {errors.newUsername && (
                                    <p className="flex items-center gap-1.5 text-red-400 text-xs mt-1.5">
                                        <ExclamationTriangleIcon className="w-3.5 h-3.5 shrink-0" />
                                        {errors.newUsername}
                                    </p>
                                )}
                            </div>

                            <PasswordInput
                                label="Contraseña actual"
                                name="currentPassword"
                                value={usernameFormData.currentPassword}
                                onChange={handleUsernameInputChange}
                                error={errors.currentPassword}
                                placeholder="••••••••"
                            />

                            {/* Feedback message */}
                            {message && (
                                <div className={`flex items-center gap-2.5 p-3 rounded-xl border text-sm font-medium ${message.type === 'success'
                                        ? 'bg-green-600/10 border-green-600/20 text-green-400'
                                        : 'bg-red-600/10 border-red-600/20 text-red-400'
                                    }`}>
                                    {message.type === 'success'
                                        ? <CheckCircleIcon className="w-5 h-5 shrink-0" />
                                        : <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
                                    }
                                    {message.text}
                                </div>
                            )}

                            <div className="flex gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={loading}
                                    className="flex-1 py-2.5 bg-surface-700 hover:bg-surface-600 text-gray-300 hover:text-white font-medium text-sm rounded-xl border border-white/6 transition-all duration-200 disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-primary-900/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? <><LoadingSpinner size="sm" /> Actualizando...</> : 'Actualizar Usuario'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Security note */}
                    <div className="flex items-start gap-2.5 bg-surface-900 border border-white/5 rounded-xl p-3">
                        <ShieldCheckIcon className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Las contraseñas se almacenan con cifrado <strong className="text-gray-400">bcrypt</strong>.
                            La sesión actual no se cerrará al cambiar la contraseña.
                        </p>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default UserSettings;