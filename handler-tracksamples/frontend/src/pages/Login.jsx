import { useState } from 'react';
import { api } from '../services/api';

export default function Login({ onLogin }) {
  const [isRecovery, setIsRecovery] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    secretPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await api.auth.login(formData.username, formData.password);
      api.setToken(data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      await api.auth.recovery(
        formData.username,
        formData.secretPassword,
        formData.newPassword,
        formData.confirmPassword
      );
      setError('');
      alert('Contraseña actualizada exitosamente. Por favor inicie sesión.');
      setIsRecovery(false);
      setFormData({ username: '', password: '', secretPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Händler</h1>
            <p className="text-gray-500 mt-1">TrackSamples</p>
          </div>

          {!isRecovery ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Ingrese su usuario"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Ingrese su contraseña"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>

              <button
                type="button"
                onClick={() => setIsRecovery(true)}
                className="w-full text-center text-sm text-gray-500 hover:text-blue-600"
              >
                ¿Olvidó su contraseña?
              </button>
            </form>
          ) : (
            <form onSubmit={handleRecovery} className="space-y-6">
              <button
                type="button"
                onClick={() => setIsRecovery(false)}
                className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1"
              >
                ← Volver al login
              </button>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Ingrese su usuario"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña Secreta</label>
                <input
                  type="password"
                  name="secretPassword"
                  value={formData.secretPassword}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Contraseña maestra"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nueva Contraseña</label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Nueva contraseña"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Contraseña</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Confirme la contraseña"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}