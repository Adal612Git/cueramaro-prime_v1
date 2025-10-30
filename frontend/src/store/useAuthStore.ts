import { create } from 'zustand';

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MOSTRADOR';
};

type AuthState = {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
};

const storageKey = 'auth';

export const useAuthStore = create<AuthState>((set) => ({
  user: (() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed.user ?? null;
    } catch (e) {
      return null;
    }
  })(),
  token: (() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed.token ?? null;
    } catch (e) {
      return null;
    }
  })(),
  login: (user, token) => {
    localStorage.setItem(storageKey, JSON.stringify({ user, token }));
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem(storageKey);
    set({ user: null, token: null });
  }
}));

