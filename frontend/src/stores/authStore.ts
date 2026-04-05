import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'operator' | 'analyst';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: { username: string; password: string }) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  immer((set, get) => ({
    // Estado inicial
    user: null,
    token: localStorage.getItem('auth_token'),
    isAuthenticated: !!localStorage.getItem('auth_token'),
    isLoading: false,
    error: null,

    // Acciones
    login: async (credentials) => {
      set({ isLoading: true, error: null });

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          const { user, token } = data.data;

          localStorage.setItem('auth_token', token);

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return true;
        } else {
          set({
            error: data.message || 'Error de autenticación',
            isLoading: false,
          });
          return false;
        }
      } catch (error) {
        set({
          error: 'Error de conexión',
          isLoading: false,
        });
        return false;
      }
    },

    logout: () => {
      localStorage.removeItem('auth_token');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
      });
    },

    refreshToken: async () => {
      const currentToken = get().token;
      if (!currentToken) return false;

      try {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const { token } = data.data;

          localStorage.setItem('auth_token', token);

          set({ token, error: null });
          return true;
        }
      } catch (error) {
        // Token refresh failed
      }

      // If refresh fails, logout
      get().logout();
      return false;
    },

    setError: (error) => set({ error }),
    setLoading: (loading) => set({ isLoading: loading }),
  }))
);

// Selectors for optimized re-renders
export const useAuthUser = () => useAuthStore((state) => state.user);
export const useAuthToken = () => useAuthStore((state) => state.token);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);