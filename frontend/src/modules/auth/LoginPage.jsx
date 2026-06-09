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

  const getFriendlyErrorMessage = (msg) => {
    const message = typeof msg === 'string' ? msg : '';
    
    // 1. Connection Refused / Network Error / Offline Backend
    if (message.toLowerCase().includes('network error') || message.toLowerCase().includes('networkerror') || message.toLowerCase().includes('econnrefused') || message.toLowerCase().includes('failed to fetch')) {
      return {
        title: 'Servidor Backend Offline',
        description: 'No se pudo conectar con el servidor backend (puerto 3001). Por favor, asegúrese de que el backend esté iniciado ejecutando el archivo "iniciar-sistema.bat" en la carpeta raíz del proyecto.',
        type: 'connection'
      };
    }
    
    // 2. Database Connection Error (Internal Server Error related to database)
    if (message.includes('database') || message.includes('db_') || message.includes('relation "') || message.toLowerCase().includes('internal server error') || message.includes('Error interno del servidor') || message.includes('pool') || message.includes('postgres')) {
      return {
        title: 'Error de Base de Datos Local',
        description: 'El servidor backend está activo, pero no se pudo conectar a la base de datos de PostgreSQL. Verifique que el contenedor Docker esté corriendo ejecutando "docker compose up -d" en la carpeta "database".',
        type: 'database'
      };
    }

    // 3. User doesn't exist
    if (message.includes('no está registrado') || message.includes('no existe') || message.includes('encontrado')) {
      return {
        title: 'Usuario no Registrado',
        description: 'El nombre de usuario ingresado no está registrado en el sistema. Por favor, verifique la ortografía.',
        type: 'credentials'
      };
    }

    // 4. Incorrect password
    if (message.includes('contraseña') || message.includes('incorrecta') || message.includes('password')) {
      return {
        title: 'Contraseña Incorrecta',
        description: 'La contraseña ingresada no es válida para este usuario. Por favor, intente nuevamente.',
        type: 'credentials'
      };
    }

    // 5. Circuit breaker abierto (servicio temporalmente no disponible)
    if (message.includes('temporalmente no disponible')) {
      return {
        title: 'Servicio Temporalmente No Disponible',
        description: 'El servicio de autenticación ha detectado múltiples fallos recientes. Por favor, espere unos segundos y vuelva a intentarlo.',
        type: 'security'
      };
    }

    // 6. Rate Limiting / Too many requests
    if (message.includes('Demasiadas solicitudes') || message.includes('rate') || message.includes('limiter')) {
      return {
        title: 'Demasiados Intentos',
        description: 'Se han realizado demasiadas solicitudes desde esta dirección IP. Por favor, espere unos minutos antes de volver a intentarlo.',
        type: 'security'
      };
    }

    // 6. Generic or fallback
    return {
      title: 'Error de Autenticación',
      description: message || 'Ocurrió un error inesperado al intentar iniciar sesión en el sistema.',
      type: 'generic'
    };
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData);
      if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message || 'Error de conexión. Intente nuevamente.');
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
        <div className="relative z-10 text-center px-8 w-full max-w-md flex flex-col items-center justify-center">
          <img
            src="/logo.png"
            alt="Händler"
            className="h-44 w-auto mb-10 brightness-0 invert object-contain hover:scale-105 transition-transform duration-500 drop-shadow-2xl"
          />

          <h2 className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2">
            Sistema de Gestión
          </h2>
          <h1 className="text-2xl font-extrabold text-white tracking-wide leading-none">
            <span className="text-gradient-handler">TrackSamples</span>
          </h1>
        </div>

        {/* Decorative gradient circle */}
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-handler-red/5 rounded-full blur-3xl" />
        <div className="absolute top-20 left-10 w-40 h-40 bg-handler-gold/5 rounded-full blur-2xl" />
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[340px] animate-fade-in-up">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <img
              src="/logo.png"
              alt="Händler"
              className="h-14 w-auto mx-auto mb-4 brightness-0 invert"
            />
          </div>

          {/* Form Header */}
          <div className="mb-8 text-center flex flex-col items-center">
            <div className="w-10 h-10 bg-handler-red/15 rounded-xl flex items-center justify-center mb-4">
              <LockClosedIcon className="w-5 h-5 text-handler-red" />
            </div>
            <h1 className="text-xl font-bold text-white mb-1">Iniciar Sesión</h1>
            <p className="text-xs text-gray-500">Ingrese sus credenciales para acceder</p>
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
            {error && (() => {
              const friendly = getFriendlyErrorMessage(error);
              return (
                <div className="bg-red-950/45 border border-red-500/35 rounded-xl p-4 animate-fade-in flex gap-3 items-start shadow-glow-red/5">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-bold text-red-200 mb-0.5">{friendly.title}</h4>
                    <p className="text-xs text-red-300/80 leading-relaxed">{friendly.description}</p>
                  </div>
                </div>
              );
            })()}

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
