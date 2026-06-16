import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = useAuthStore.getState().token;
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        // El backend responde: { success, data: { user } }
        const response = await authAPI.getCurrentUser();
        const userData = response.data?.user || response.data;
        if (!userData || !userData.id) {
          throw new Error('Respuesta de usuario inválida');
        }
        setUser(userData);
        setIsAuthenticated(true);
      } catch (_error) {
        useAuthStore.getState().setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();

    // Polling en segundo plano para refrescar los permisos automáticamente cada 30 segundos
    const intervalId = setInterval(() => {
      const token = useAuthStore.getState().token;
      if (token) {
        authAPI.getCurrentUser()
          .then(response => {
            const userData = response.data?.user || response.data;
            if (userData && userData.id) {
              setUser(userData);
            }
          })
          .catch(() => {
            useAuthStore.getState().setToken(null);
            setUser(null);
            setIsAuthenticated(false);
          });
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  const updateUser = (userData) => {
    setUser(userData);
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      const userData = response.data?.user || response.data;
      if (!userData || !userData.id) throw new Error('Respuesta inválida');
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      return { success: false, message: error.message || 'Error al refrescar usuario' };
    }
  };

  const login = async credentials => {
    try {
      setLoading(true);
      const response = await authAPI.login(credentials);
      const { user: userData, token } = response.data;
      useAuthStore.getState().setToken(token);
      setUser(userData);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error al iniciar sesión',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    useAuthStore.getState().setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const resetPassword = async data => {
    try {
      setLoading(true);
      await authAPI.resetPassword(data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error al resetear contraseña',
      };
    } finally {
      setLoading(false);
    }
  };

  const hasRole = role => user?.role === role;
  const isAdmin = () => hasRole('admin');

  /**
   * Verificar si el usuario tiene un permiso específico.
   * Los admins SIEMPRE tienen todos los permisos (bypass total).
   * @param {string} permKey - ej: 'samples.delete'
   */
  const hasPermission = (permKey) => {
    if (!user) return false;
    // Admins always have full access regardless of permissions column
    if (user.role === 'admin') return true;
    const perms = user.permissions || {};
    return perms[permKey] === true;
  };

  const canAny = (...keys) => keys.some(k => hasPermission(k));
  const canAll = (...keys) => keys.every(k => hasPermission(k));

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    resetPassword,
    hasRole,
    isAdmin,
    hasPermission,
    canAny,
    canAll,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
