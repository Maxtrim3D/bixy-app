import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthUser } from '@/types';
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '@/constants/config';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  setAuth: (token: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: true,

  setAuth: async (token, user) => {
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    set({ token, user });
  },

  logout: async () => {
    await AsyncStorage.multiRemove([TOKEN_STORAGE_KEY, USER_STORAGE_KEY]);
    set({ token: null, user: null });
  },

  hydrate: async () => {
    try {
      const [token, userRaw] = await AsyncStorage.multiGet([TOKEN_STORAGE_KEY, USER_STORAGE_KEY]);
      const t = token[1];
      const u = userRaw[1] ? (JSON.parse(userRaw[1]) as AuthUser) : null;
      set({ token: t, user: u });
    } catch {
      set({ token: null, user: null });
    } finally {
      set({ isLoading: false });
    }
  },
}));
