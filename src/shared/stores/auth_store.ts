import { create } from 'zustand';

export interface UserSession {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: UserSession | null;
  isAuthModalOpen: boolean;
  activeTab: 'login' | 'register';
  setUser: (user: UserSession | null) => void;
  logout: () => void;
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Load initial user session from localStorage if available
  let initialUser: UserSession | null = null;
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('fisokut_user');
    if (stored) {
      try {
        initialUser = JSON.parse(stored);
      } catch (e) {
        localStorage.removeItem('fisokut_user');
      }
    }
  }

  return {
    user: initialUser,
    isAuthModalOpen: false,
    activeTab: 'login',
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
  };
});
