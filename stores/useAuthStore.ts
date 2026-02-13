
import { create } from 'zustand';
import { useDataStore } from './useDataStore';
import { useAppStore } from './useAppStore';
import type { User } from '../types';

// =================================================================================================
// ZUSTAND STORE: Auth State
// =================================================================================================
// Responsabilidad: Gestionar la autenticación y la sesión del usuario.
// Este store mantiene la información del usuario actual (`currentUser`), maneja el
// flujo de inicio/cierre de sesión y persiste la sesión en `sessionStorage` para
// mantener al usuario conectado entre recargas de la página.
// =================================================================================================

interface AuthState {
  currentUser: User | null;
  selectUser: (user: User) => void;
  logout: () => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,

  initializeAuth: () => {
    const storedUser = sessionStorage.getItem('pompino_user_session');
    if (storedUser) {
      set({ currentUser: storedUser as User });
      // If a session exists, initialize data listeners
      useDataStore.getState().initialize();
      useAppStore.getState().setShowActionCenter(true);
    }
  },

  selectUser: (user: User) => {
    sessionStorage.setItem('pompino_user_session', user);
    set({ currentUser: user });
    
    // Initialize data listeners on new login
    useDataStore.getState().initialize();

    useAppStore.getState().setViewScope('me');
    useAppStore.getState().setActiveTab('home');
    useAppStore.getState().setShowActionCenter(true);
    
    // Log the action
    useDataStore.getState().logAction('LOGIN', `Inicio de sesión en dispositivo`);
  },

  logout: () => {
    const currentUser = useAuthStore.getState().currentUser;
    if (currentUser) {
        useDataStore.getState().logAction('LOGOUT', 'Cierre de sesión');
    }
    
    // Clean up data listeners to prevent memory leaks
    useDataStore.getState().cleanupListeners();

    sessionStorage.removeItem('pompino_user_session');
    set({ currentUser: null });
    useAppStore.getState().setShowActionCenter(false);
  },
}));