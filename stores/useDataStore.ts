
import { create } from 'zustand';
import {
  db,
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  where,
  isConfigured,
  QueryConstraint,
  DocumentSnapshot,
} from '../services/firebaseConfig';
import {
  Lead,
  OperationLog,
  TransferRequest,
  DirectTask,
  User,
} from '../types';
import { useAuthStore } from './useAuthStore';
import { isUserAdmin } from '../projectConfig';

// =================================================================================================
// ZUSTAND STORE: Data State
// =================================================================================================
// Responsabilidad: Actuar como la capa de datos central de la aplicación.
// Este store gestiona todas las interacciones con la base de datos Firestore. Se encarga de
// la carga (fetching), creación, actualización y eliminación (CRUD) de leads, logs y tareas.
// También maneja estados relacionados con los datos como la paginación, los estados de carga
// y los errores de la base de datos.
// =================================================================================================

let listeners: (() => void)[] = [];

const safeJsonStringify = (obj: any, space?: number) => {
    const cache = new Set();
    return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (cache.has(value)) return; 
            cache.add(value);
        }
        return value;
    }, space);
};

const sanitizeForFirestore = (data: any) => {
    try {
      const jsonString = safeJsonStringify(data);
      if (jsonString) return JSON.parse(jsonString);
      return {};
    } catch (error) {
      console.error("Failed to sanitize object for Firestore:", error);
      return data;
    }
};

interface LoadLeadsFilters {
  sortKey?: string;
  sortOrder?: 'asc' | 'desc';
  viewScope?: User | 'me' | 'all';
  statusFilter?: string;
  dateFilterStart?: string;
  dateFilterEnd?: string;
  tagFilter?: string;
}

interface DataState {
  allLeads: Lead[];
  paginatedLeads: Lead[];
  lastLeadDoc: DocumentSnapshot | null;
  hasMoreLeads: boolean;
  isLeadsLoading: boolean;
  agendaLeads: Lead[];
  scrapedResults: Lead[];
  operationsLog: OperationLog[];
  directTasks: DirectTask[];
  connectionState: 'ok' | 'missing_db' | 'permission_denied' | 'unknown_error';
  dbError: string | null;

  initialize: () => void;
  cleanupListeners: () => void;
  fetchAllLeads: () => Promise<void>;
  loadLeads: (options?: { filters?: LoadLeadsFilters; reset?: boolean }) => Promise<void>;
  fetchAllLeadsForBackup: () => Promise<Lead[]>;
  logAction: (action: OperationLog['action'], details: string) => Promise<void>;
  saveToCRM: (lead: Lead) => Promise<void>;
  addManualLead: (lead: Partial<Lead>) => Promise<void>;
  removeFromCRM: (id: string) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  detailedUpdate: (id: string, updates: Partial<Lead>, context: string) => Promise<void>;
  reassignLead: (leadId: string, leadName: string, newOwner: User) => Promise<void>;
  createDirectTask: (toUser: User, message: string) => Promise<void>;
  completeDirectTask: (taskId: string) => Promise<void>;
  updateScrapedLeads: (leads: Lead[]) => void;
}

export const useDataStore = create<DataState>((set, get) => ({
  allLeads: [],
  paginatedLeads: [],
  lastLeadDoc: null,
  hasMoreLeads: true,
  isLeadsLoading: false,
  agendaLeads: [],
  scrapedResults: [],
  operationsLog: [],
  transferRequests: [],
  directTasks: [],
  connectionState: 'ok',
  dbError: null,

  initialize: () => {
    get().cleanupListeners();
    if (!isConfigured) {
      set({ connectionState: 'unknown_error', dbError: 'Firebase no está configurado.' });
      return;
    }
    
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return;
    const isAdmin = isUserAdmin(currentUser);

    const setupListener = <T>(collectionName: string, setter: (data: T[]) => void, constraints: QueryConstraint[] = []) => {
        // Apply user-based security for non-admins
        const finalConstraints = [...constraints];
        if (collectionName === 'leads' && !isAdmin) {
          finalConstraints.push(where('owner', '==', currentUser));
        }
        
        const q = query(collection(db, collectionName), ...finalConstraints);
        const unsub = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as T);
            setter(data);
            set({ connectionState: 'ok', dbError: null });
        }, (error) => {
            console.error(`Firebase ${collectionName} Error:`, error);
            const code = (error as any).code;
            if (code === 'not-found') set({ connectionState: 'missing_db' });
            else if (code === 'permission-denied') set({ connectionState: 'permission_denied' });
            else set({ connectionState: 'unknown_error', dbError: error.message });
        });
        listeners.push(unsub);
    };

    setupListener<OperationLog>('logs', (data) => set({ operationsLog: data }), [orderBy("timestamp", "desc")]);
    setupListener<DirectTask>('direct_tasks', (data) => set({ directTasks: data }));
    setupListener<Lead>('leads', (data) => set({ agendaLeads: data }), [where('nextActionDate', '!=', null)]);
    
    get().fetchAllLeads();
  },

  cleanupListeners: () => {
      listeners.forEach(unsub => unsub());
      listeners = [];
      set({ allLeads: [], paginatedLeads: [], agendaLeads: [], operationsLog: [], directTasks: [], lastLeadDoc: null, hasMoreLeads: true });
  },

  fetchAllLeads: async () => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return;
    const isAdmin = isUserAdmin(currentUser);
    
    try {
        const constraints = [orderBy('savedAt', 'desc')];
        if (!isAdmin) {
            constraints.unshift(where('owner', '==', currentUser));
        }
        
        const q = query(collection(db, 'leads'), ...constraints);
        const snapshot = await getDocs(q);
        const allLeadsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Lead));
        set({ allLeads: allLeadsData });
    } catch (error) {
        console.error("Error fetching all leads for stats:", error);
    }
  },

  loadLeads: async (options?: { filters?: LoadLeadsFilters; reset?: boolean }) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser || get().isLeadsLoading) return;
    const isAdmin = isUserAdmin(currentUser);
    
    const { filters = {}, reset = false } = options || {};
    if (!reset && !get().hasMoreLeads) return;
  
    set({ isLeadsLoading: true, dbError: null });
    
    const pageSize = 20;
    const constraints: QueryConstraint[] = [];

    // Enforce security: non-admins can only see their own leads, regardless of UI selection.
    const effectiveViewScope = isAdmin ? filters.viewScope : 'me';
  
    const viewScopeOwner = effectiveViewScope === 'me' ? currentUser : (effectiveViewScope && effectiveViewScope !== 'all' ? effectiveViewScope : null);
  
    if (viewScopeOwner) {
        constraints.push(where('owner', '==', viewScopeOwner));
    }
    if (filters.statusFilter && filters.statusFilter !== 'all') {
        constraints.push(where('status', '==', filters.statusFilter));
    }
    if (filters.dateFilterStart) {
        constraints.push(where('lastContactDate', '>=', filters.dateFilterStart));
    }
    if (filters.dateFilterEnd) {
        constraints.push(where('lastContactDate', '<=', filters.dateFilterEnd));
    }
    if (filters.tagFilter) {
        constraints.push(where('tags', 'array-contains', filters.tagFilter));
    }
    
    const sortKey = filters.sortKey || 'savedAt';
    const sortOrder = filters.sortOrder || 'desc';
  
    constraints.push(orderBy(sortKey, sortOrder));
  
    if (!reset && get().lastLeadDoc) {
      constraints.push(startAfter(get().lastLeadDoc));
    }
    constraints.push(limit(pageSize));
    
    try {
      const q = query(collection(db, 'leads'), ...constraints);
      const snapshot = await getDocs(q);
      const newLeads = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Lead));
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
  
      set(state => ({
        paginatedLeads: reset ? newLeads : [...state.paginatedLeads, ...newLeads],
        lastLeadDoc: lastVisible || null,
        hasMoreLeads: snapshot.docs.length === pageSize,
      }));
    } catch (error: any) {
        console.error("Error loading leads:", error);
        if (error.message && error.message.includes("query requires an index")) {
            const urlMatch = error.message.match(/https?:\/\/[^\s]+/);
            const url = urlMatch ? urlMatch[0] : 'NO_URL';
            
            if (error.message.includes("That index is currently building")) {
                const errorMessage = `INDEX_BUILDING::${url}`;
                set({ dbError: errorMessage });
            } else {
                const errorMessage = `INDEX_REQUIRED::${url}`;
                set({ dbError: errorMessage });
            }
        } else {
            set({ dbError: error.message });
        }
    } finally {
        set({ isLeadsLoading: false });
    }
  },

  fetchAllLeadsForBackup: async (): Promise<Lead[]> => {
    try {
        const q = query(collection(db, 'leads'), orderBy('savedAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Lead));
    } catch (error) {
        console.error("Error fetching all documents for backup:", error);
        return [];
    }
  },

  logAction: async (action, details) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return;
    const logEntry: Omit<OperationLog, 'id'> = { user: currentUser, action, details, timestamp: Date.now() };
    try {
      await setDoc(doc(collection(db, "logs"), `log-${Date.now()}`), logEntry);
    } catch (e) {
      console.error("Failed to log action:", e);
    }
  },

  saveToCRM: async (lead) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return;
    const newLead = sanitizeForFirestore({ ...lead, owner: currentUser, savedAt: Date.now(), lastContactDate: new Date().toISOString().split('T')[0], status: 'frio' });
    try {
        await setDoc(doc(db, "leads", newLead.id), newLead);
        set(state => ({ 
            paginatedLeads: [newLead as Lead, ...state.paginatedLeads],
            allLeads: [newLead as Lead, ...(state.allLeads || [])],
        }));
        get().logAction('CREATE', `Guardó nuevo lead: ${lead.name}`);
        get().fetchAllLeads(); // Refresh stats
    } catch (e) {
        console.error("Save to CRM failed:", e);
        set({ dbError: `Error al guardar: ${(e as Error).message}`});
    }
  },
  
  addManualLead: async (lead) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return;
    const leadId = `manual-${Date.now()}`;
    const newLeadData = sanitizeForFirestore({ ...lead, id: leadId, owner: currentUser, savedAt: Date.now(), lastContactDate: new Date().toISOString().split('T')[0], status: lead.status || 'frio' });
    try {
        await setDoc(doc(db, "leads", leadId), newLeadData);
        set(state => ({ 
            paginatedLeads: [newLeadData as Lead, ...state.paginatedLeads],
            allLeads: [newLeadData as Lead, ...(state.allLeads || [])],
        }));
        get().logAction('CREATE', `Creó lead manual: ${lead.name}`);
        get().fetchAllLeads(); // Refresh stats
    } catch (e) {
        console.error("Add manual lead failed:", e);
        set({ dbError: `Error al crear lead: ${(e as Error).message}`});
        throw e; // Re-throw to inform the caller component
    }
  },

  removeFromCRM: async (id: string) => {
    const lead = get().paginatedLeads.find(l => l.id === id) || (get().allLeads || []).find(l => l.id === id);
    if (window.confirm("¿CONFIRMAR ELIMINACIÓN?")) {
      try {
        await deleteDoc(doc(db, "leads", id));
        set(state => ({ 
            paginatedLeads: state.paginatedLeads.filter(l => l.id !== id),
            allLeads: (state.allLeads || []).filter(l => l.id !== id),
        }));
        get().logAction('DELETE', `Eliminó registro: ${lead?.name || 'ID:'+id}`);
        get().fetchAllLeads(); // Refresh stats
      } catch (e) {
          console.error("Remove from CRM failed:", e);
          set({ dbError: `Error al eliminar: ${(e as Error).message}`});
      }
    }
  },

  updateLead: async (id, updates) => {
     try {
         const finalUpdates = sanitizeForFirestore({ ...updates, lastContactDate: new Date().toISOString().split('T')[0] });
         await updateDoc(doc(db, "leads", id), finalUpdates);
         set(state => ({
             paginatedLeads: state.paginatedLeads.map(l => l.id === id ? { ...l, ...finalUpdates } : l),
             agendaLeads: state.agendaLeads.map(l => l.id === id ? { ...l, ...finalUpdates } : l),
             allLeads: (state.allLeads || []).map(l => l.id === id ? { ...l, ...finalUpdates } : l),
         }));
     } catch (e) {
         console.error("Update failed:", e);
         set({ dbError: `Error al actualizar: ${(e as Error).message}`});
     }
  },
  
  detailedUpdate: (id, updates, context) => {
      get().updateLead(id, updates);
      const leadName = get().paginatedLeads.find(l => l.id === id)?.name || 'Lead';
      get().logAction('UPDATE', `Editó ${context} en ${leadName}`);
  },

  reassignLead: async (leadId, leadName, newOwner) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return;
    try {
        await updateDoc(doc(db, "leads", leadId), { owner: newOwner });
        set(state => ({
            paginatedLeads: state.paginatedLeads.map(l => l.id === leadId ? { ...l, owner: newOwner } : l),
            agendaLeads: state.agendaLeads.map(l => l.id === leadId ? { ...l, owner: newOwner } : l),
            allLeads: (state.allLeads || []).map(l => l.id === leadId ? { ...l, owner: newOwner } : l),
        }));
        get().logAction('ADMIN_ASSIGN', `${currentUser} reasignó ${leadName} a ${newOwner}.`);
    } catch (e) {
        console.error("Reassignment failed:", e);
        set({ dbError: `Error al reasignar: ${(e as Error).message}`});
    }
  },

  createDirectTask: async (toUser, message) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return;
    const taskId = `task-${Date.now()}`;
    const task: DirectTask = { id: taskId, fromUser: currentUser, toUser, message, status: 'pending', createdAt: Date.now() };
    try {
      await setDoc(doc(db, "direct_tasks", taskId), task);
      get().logAction('ADMIN_ASSIGN', `Asignó tarea a ${toUser}`);
    } catch (e) {
      console.error("Create task failed:", e);
      set({ dbError: `Error al asignar tarea: ${(e as Error).message}`});
    }
  },

  completeDirectTask: async (taskId) => {
    try {
      await updateDoc(doc(db, "direct_tasks", taskId), { status: 'completed', completedAt: Date.now() });
    } catch (e) {
      console.error("Complete task failed:", e);
      set({ dbError: `Error al completar tarea: ${(e as Error).message}`});
    }
  },

  updateScrapedLeads: (leads) => {
    set({ scrapedResults: leads });
    localStorage.setItem('pompino_b2b_search_v7', safeJsonStringify(leads) || '[]');
  },
}));