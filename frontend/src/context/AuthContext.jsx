import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

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
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const response = await authAPI.getCurrentUser();
          const userData = response.data.user;
          if (userData.role === 'admin') {
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('auth_token');
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (_error) {
        localStorage.removeItem('auth_token');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const updateUser = (userData) => {
    setUser(userData);
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      const userData = response.data.user;
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
      const { user: userData, token } = response.data.data;
      localStorage.setItem('auth_token', token);
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
    localStorage.removeItem('auth_token');
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
   * Los admins con todos los permisos explícitamente verdaderos siempre pasan.
   * @param {string} permKey - ej: 'samples.delete'
   */
  const hasPermission = (permKey) => {
    if (!user) return false;
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
