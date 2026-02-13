
import { create } from 'zustand';
import type { User } from '../types';

// =================================================================================================
// ZUSTAND STORE: App State
// =================================================================================================
// Responsabilidad: Gestionar el estado global de la Interfaz de Usuario (UI).
// Este store controla elementos como la pestaña activa, la visibilidad de modales,
// el estado del menú lateral y los filtros de la vista del CRM. Mantiene la lógica
// de la UI separada de los datos de negocio y la autenticación.
// =================================================================================================

type AppTab = 'home' | 'intelligence' | 'crm' | 'operations' | 'agenda' | 'stats' | 'indices';

interface AppState {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  
  activeFolder: string;
  setActiveFolder: (folder: string) => void;
  
  viewScope: User | 'me' | 'all';
  setViewScope: (scope: User | 'me' | 'all') => void;
  
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  
  // Modals
  showHelp: boolean;
  setShowHelp: (show: boolean) => void;
  
  showReport: boolean;
  setShowReport: (show: boolean) => void;
  
  showActionCenter: boolean;
  setShowActionCenter: (show: boolean) => void;
  
  showTaskCreator: boolean;
  setShowTaskCreator: (show: boolean) => void;

  showAddLeadModal: boolean;
  setShowAddLeadModal: (show: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'home',
  setActiveTab: (tab) => set({ activeTab: tab }),

  activeFolder: 'all',
  setActiveFolder: (folder) => set({ activeFolder: folder }),
  
  viewScope: 'me',
  setViewScope: (scope) => set({ viewScope: scope }),

  isSidebarOpen: false,
  setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  
  showHelp: false,
  setShowHelp: (show) => set({ showHelp: show }),
  
  showReport: false,
  setShowReport: (show) => set({ showReport: show }),
  
  showActionCenter: false,
  setShowActionCenter: (show) => set({ showActionCenter: show }),
  
  showTaskCreator: false,
  setShowTaskCreator: (show) => set({ showTaskCreator: show }),

  showAddLeadModal: false,
  setShowAddLeadModal: (show) => set({ showAddLeadModal: show }),
}));