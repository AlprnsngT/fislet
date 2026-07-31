import { create } from 'zustand';

export interface UserSession {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

interface AuthState {
  user: UserSession | null;
  isAuthModalOpen: boolean;
  activeTab: 'login' | 'register';
  initAuth: () => void;
  setUser: (user: UserSession | null) => void;
  logout: () => void;
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthModalOpen: false,
  activeTab: 'login',

  initAuth: () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('fisokut_user');
      if (stored) {
        try {
          const user = JSON.parse(stored);
          set({ user });
        } catch (e) {
          localStorage.removeItem('fisokut_user');
        }
      }
    }
  },

  setUser: (user) => {
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('fisokut_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('fisokut_user');
      }
    }
    set({ user });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fisokut_user');
    }
    set({ user: null });
  },

  openAuthModal: (tab = 'login') => set({ isAuthModalOpen: true, activeTab: tab }),
  closeAuthModal: () => set({ isAuthModalOpen: false }),
}));
