import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

// Crear el contexto
const AuthContext = createContext();

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// Provider del contexto
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar autenticación al montar el componente
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          // Verificar token con el servidor
          const response = await authAPI.getCurrentUser();
          const userData = response.data.user;

          // Solo permitir sesiones persistentes para administradores
          // Si es operador, forzar logout para mayor seguridad
          if (userData.role === 'admin') {
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            // Limpiar sesión de operador por seguridad
            localStorage.removeItem('auth_token');
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (_error) {
        // Token inválido, limpiar
        localStorage.removeItem('auth_token');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Función de login
  const login = async credentials => {
    try {
      setLoading(true);
      const response = await authAPI.login(credentials);

      const { user: userData, token } = response.data.data;

      // Guardar token
      localStorage.setItem('auth_token', token);

      // Actualizar estado
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

  // Función de logout
  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Función para resetear contraseña
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

  // Verificar si el usuario tiene un rol específico
  const hasRole = role => {
    return user?.role === role;
  };

  // Verificar si el usuario es admin
  const isAdmin = () => {
    return hasRole('admin');
  };

  // Valores del contexto
  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    resetPassword,
    hasRole,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
