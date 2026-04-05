import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { EyeIcon, EyeSlashIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const LoginPage = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData);
      if (!result.success) {
        setError(result.message);
      }
    } catch (_err) {
      setError('Error de conexión. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = e => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen flex bg-surface-500 overflow-hidden">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center bg-surface-400">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(227,6,19,0.4) 1px, transparent 0)`,
              backgroundSize: '32px 32px',
            }}
          />
        </div>
        
        {/* Red accent line - top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-handler-red via-handler-red to-handler-gold" />

        {/* Content */}
        <div className="relative z-10 text-center px-12 max-w-lg">
          <img
            src="/logo.png"
            alt="Händler"
            className="h-16 w-auto mx-auto mb-10 brightness-0 invert"
          />
          
          <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
            Sistema de Gestión de
            <span className="text-gradient-handler block mt-1">Muestras Químicas</span>
          </h2>
          
          <p className="text-gray-400 text-base leading-relaxed mb-8">
            Trazabilidad completa con estándares SGA. Control inteligente de inventario, 
            dispensación y despacho validado.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 justify-center">
            {['Trazabilidad SGA', 'QR Codes', 'Mapa 2D', 'FEFO'].map(feature => (
              <span
                key={feature}
                className="px-3 py-1.5 bg-surface-200 border border-gray-700/50 rounded-full text-xs text-gray-300 font-medium"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* Decorative gradient circle */}
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-handler-red/5 rounded-full blur-3xl" />
        <div className="absolute top-20 left-10 w-40 h-40 bg-handler-gold/5 rounded-full blur-2xl" />
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-fade-in-up">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <img
              src="/logo.png"
              alt="Händler"
              className="h-10 w-auto mx-auto mb-4 brightness-0 invert"
            />
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <div className="w-11 h-11 bg-handler-red/15 rounded-xl flex items-center justify-center mb-4">
              <LockClosedIcon className="w-5 h-5 text-handler-red" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Iniciar Sesión</h1>
            <p className="text-sm text-gray-500">Ingrese sus credenciales para acceder al sistema</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label htmlFor="login-username" className="label">Usuario</label>
              <input
                id="login-username"
                name="username"
                type="text"
                required
                autoComplete="username"
                value={formData.username}
                onChange={handleChange}
                className="input"
                placeholder="Ingrese su usuario"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="label">Contraseña</label>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input pr-11"
                  placeholder="Ingrese su contraseña"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-4.5 h-4.5" />
                  ) : (
                    <EyeIcon className="w-4.5 h-4.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-danger-50 border border-danger-200/30 rounded-lg px-4 py-3 animate-fade-in">
                <p className="text-sm text-danger-400">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-base font-semibold"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="small" />
                  <span>Iniciando sesión...</span>
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-600">
              Para recuperar su contraseña, contacte al administrador del sistema.
            </p>
          </div>

          <div className="mt-12 text-center">
            <p className="text-xs text-gray-700">
              © 2026 Handler S.A.S. — Sistema seguro de gestión
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
