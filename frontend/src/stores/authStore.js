import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export const useAuthStore = create()(
  immer((set, get) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

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
          const { user } = data.data;

          set({
            user,
            token: data.data.token || null,
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
          set({ error: null });
          return true;
        }
      } catch {
        // Token refresh failed
      }

      get().logout();
      return false;
    },

    setToken: (token) => set({ token }),
    setError: (error) => set({ error }),
    setLoading: (loading) => set({ isLoading: loading }),
  }))
);

export const useAuthUser = () => useAuthStore((state) => state.user);
export const useAuthToken = () => useAuthStore((state) => state.token);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
