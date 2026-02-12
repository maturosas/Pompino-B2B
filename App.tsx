
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import { IntelligenceTool } from './components/IntelligenceTool';
import CRMView from './components/CRMView';
import OperationsView from './components/OperationsView';
import AgendaView from './components/AgendaView';
import StatsView from './components/StatsView';
import TeamChat from './components/TeamChat';
import { PompinoLogo } from './components/PompinoLogo';
import { Lead, User, OperationLog, TransferRequest, ChatMessage, DirectTask } from './types';
import HowToUseModal from './components/HowToUseModal';
import TaskReminderModal from './components/TaskReminderModal';
import { PROJECT_CONFIG, getCredentials, getUserNames, isUserAdmin } from './projectConfig';

// Firebase Imports
import { db, collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, query, orderBy, limit, isConfigured } from './services/firebaseConfig';

const App: React.FC = () => {
  // Identity State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Login State
  const [loginStep, setLoginStep] = useState<'user_select' | 'password'>('user_select');
  const [selectedUserForLogin, setSelectedUserForLogin] = useState<User | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // App State
  const [activeTab, setActiveTab] = useState<'intelligence' | 'crm' | 'operations' | 'chat' | 'agenda' | 'stats'>('intelligence');
  const [activeFolder, setActiveFolder] = useState<string>('all');
  
  // View Scope: 'me' means my leads, or specific User name means viewing their folder
  const [viewScope, setViewScope] = useState<User | 'me'>('me'); 

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Unified Help State (renamed from showLoginHelp to generic showHelp)
  const [showHelp, setShowHelp] = useState(false);
  
  // Task Reminder State
  const [userTasks, setUserTasks] = useState<Lead[]>([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  
  // Direct Task State
  const [directTasks, setDirectTasks] = useState<DirectTask[]>([]);
  const [showTaskCreator, setShowTaskCreator] = useState(false);
  const [newTaskTarget, setNewTaskTarget] = useState<User>('');
  const [newTaskMessage, setNewTaskMessage] = useState('');

  // Data State
  const [savedLeads, setSavedLeads] = useState<Lead[]>([]);
  const [scrapedResults, setScrapedResults] = useState<Lead[]>([]); // Scraped results stay local until saved
  const [operationsLog, setOperationsLog] = useState<OperationLog[]>([]);
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  
  // Chat Notifications
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Connectivity State
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<'ok' | 'missing_db' | 'permission_denied' | 'unknown_error'>('ok');
  
  // Retry mechanism
  const [retryCount, setRetryCount] = useState(0);

  // Get dynamic user list
  const userList = getUserNames();
  
  // Check Admin Role
  const isAdmin = currentUser ? isUserAdmin(currentUser) : false;

  // --- HELPER: DATA SANITIZATION ---
  // Firestore explota si le mandas 'undefined'. Esto lo convierte a JSON y vuelve a Objeto para limpiar undefineds.
  const sanitizeForFirestore = (data: any) => {
    return JSON.parse(JSON.stringify(data));
  };

  // --- GOOGLE ANALYTICS INJECTION ---
  useEffect(() => {
    // 1. Get ID from Config (Priority) or LocalStorage
    const gaId = PROJECT_CONFIG.analyticsId || localStorage.getItem('pompino_ga_id');
    
    // 2. Inject Script if not present
    if (gaId && gaId.startsWith('G-') && !document.getElementById('ga-script')) {
        console.log(`📡 Inicializando Google Analytics: ${gaId}`);
        
        // Tag Script
        const script = document.createElement('script');
        script.id = 'ga-script';
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
        document.head.appendChild(script);

        // Config Script
        const script2 = document.createElement('script');
        script2.id = 'ga-config';
        script2.innerHTML = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
        `;
        document.head.appendChild(script2);
        
        // Save to local storage just in case stats view needs it
        localStorage.setItem('pompino_ga_id', gaId);
    }
  }, []); // Run once on mount

  // --- FIREBASE SYNCHRONIZATION ---

  useEffect(() => {
    if (!isConfigured) return;

    // Reset error states on retry
    setDbError(null);
    setConnectionState('ok');

    // 1. Sync Leads (CRM)
    const qLeads = query(collection(db, "leads"));
    const unsubLeads = onSnapshot(qLeads, 
      (snapshot) => {
        const leadsData = snapshot.docs.map(doc => doc.data() as Lead);
        // Sort by savedAt locally to ensure order
        leadsData.sort((a,b) => (b.savedAt || 0) - (a.savedAt || 0));
        setSavedLeads(leadsData);
        setIsCloudConnected(true);
        setDbError(null);
        setConnectionState('ok');
      },
      (error) => {
        console.error("Firebase Leads Error:", error);
        const msg = error.message || error.toString();
        const code = (error as any).code;

        // Detección precisa del tipo de error
        if (
            msg.includes("Cloud Firestore API") || 
            msg.includes("disabled") ||
            msg.includes("does not exist") || 
            msg.includes("not-found") ||
            code === 'not-found'
        ) {
            setConnectionState('missing_db');
        } else if (msg.includes("permission-denied") || code === 'permission-denied') {
            // Si dice permission-denied PERO no habla de la API, es problema de reglas
            setConnectionState('permission_denied');
        } else {
            setDbError(msg);
            setConnectionState('unknown_error');
        }
        setIsCloudConnected(false);
      }
    );

    // 2. Sync Logs
    // Limit logs query if needed later, for now get all
    const qLogs = query(collection(db, "logs"), orderBy("timestamp", "desc"));
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
        const logsData = snapshot.docs.map(doc => doc.data() as OperationLog);
        setOperationsLog(logsData);
    });

    // 3. Sync Transfer Requests
    const qReqs = query(collection(db, "transfer_requests"));
    const unsubReqs = onSnapshot(qReqs, (snapshot) => {
        const reqsData = snapshot.docs.map(doc => doc.data() as TransferRequest);
        setTransferRequests(reqsData);
    });

    // 4. Sync Chat Messages (Limit to last 100)
    const qChat = query(collection(db, "chat_messages"), orderBy("timestamp", "asc"), limit(100));
    const unsubChat = onSnapshot(qChat, (snapshot) => {
        const msgs = snapshot.docs.map(doc => doc.data() as ChatMessage);
        setChatMessages(msgs);
    });

    // 5. Sync Direct Tasks
    const qTasks = query(collection(db, "direct_tasks"));
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
        const tasks = snapshot.docs.map(doc => doc.data() as DirectTask);
        setDirectTasks(tasks);
    });

    // Cleanup listeners on unmount
    return () => {
      unsubLeads();
      unsubLogs();
      unsubReqs();
      unsubChat();
      unsubTasks();
    };
  }, [retryCount]);

  // Handle Chat Notifications Logic
  useEffect(() => {
      if (activeTab === 'chat') {
          setUnreadChatCount(0);
      } else {
          // If messages change and tab is not chat, increment. 
      }
  }, [activeTab, chatMessages]);

  // We need to increment unread count inside the effect hook of chatMessages if tab is not chat
  useEffect(() => {
      if (activeTab !== 'chat' && chatMessages.length > 0) {
          // Check if the last message is recent (within last 2 seconds) to avoid counting initial load
          const lastMsg = chatMessages[chatMessages.length - 1];
          if (Date.now() - lastMsg.timestamp < 3000) {
              setUnreadChatCount(prev => prev + 1);
          }
      }
  }, [chatMessages]);


  // Init Local Data (Scraping History & Session)
  useEffect(() => {
    const storedSearch = localStorage.getItem('pompino_b2b_search_v7');
    const storedUser = sessionStorage.getItem('pompino_user_session');

    if (storedSearch) setScrapedResults(JSON.parse(storedSearch));
    if (storedUser) {
        // Simple session restore, assumes validation happened on initial login
        setCurrentUser(storedUser as User);
    }
  }, []);

  // Local Persistence for Scraping Only
  useEffect(() => { localStorage.setItem('pompino_b2b_search_v7', JSON.stringify(scrapedResults)); }, [scrapedResults]);

  // --- ACTIONS (Now writing to Cloud) ---

  const logAction = async (action: OperationLog['action'], details: string) => {
    if (!currentUser || !isCloudConnected) return;
    const newLog: OperationLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      user: currentUser,
      action,
      details,
      timestamp: Date.now()
    };
    
    try {
        await setDoc(doc(db, "logs", newLog.id), sanitizeForFirestore(newLog));
    } catch (e) { console.error("Error logging to cloud", e); }
  };

  const handleSaveToCRM = async (lead: Lead) => {
    if (!currentUser) return;

    const existingLead = savedLeads.find(l => l.id === lead.id || l.name === lead.name);
    
    if (existingLead) {
        const ownerName = existingLead.owner || 'Desconocido';
        alert(`⛔ ACCESO DENEGADO\n\nEl lead "${existingLead.name}" ya está siendo gestionado por: ${ownerName}.\n\nPuedes solicitar una transferencia desde el CRM.`);
        return;
    }

    const leadWithOwner: Lead = { 
        ...lead, 
        savedAt: Date.now(), 
        isClient: false, 
        status: 'frio', 
        owner: currentUser,
        priceList: 'regular',
        nextAction: 'call',
        // Asegurar que campos opcionales no sean undefined
        whatsapp: lead.whatsapp || '',
        email: lead.email || '',
        notes: lead.notes || '',
        contactName: lead.contactName || '',
        sourceUrl: lead.sourceUrl || '',
        nextActionDate: '',
        lastContactDate: ''
    };

    try {
        // IMPORTANTE: sanitizeForFirestore elimina los undefined que rompen firebase
        await setDoc(doc(db, "leads", lead.id), sanitizeForFirestore(leadWithOwner));
        logAction('CREATE', `Archivó prospecto: ${lead.name}`);
    } catch (e: any) { 
        console.error("Save Error", e);
        alert(`Error guardando en la nube: ${e.message}`); 
    }
  };

  const handleAddManualLead = async (lead: Lead) => {
    if (!currentUser) return;
    const finalLead = {
        ...lead, 
        owner: currentUser, 
        savedAt: Date.now(), 
        priceList: 'regular' as const,
        whatsapp: lead.whatsapp || '',
        email: lead.email || '',
        notes: lead.notes || '',
        contactName: lead.contactName || '',
    };
    
    try {
        await setDoc(doc(db, "leads", lead.id), sanitizeForFirestore(finalLead));
        logAction('CREATE', `Creó manualmente: ${lead.name}`);
    } catch(e: any) {
        alert(`Error creando lead manual: ${e.message}`);
    }
  };

  const handleImportLeads = async (newLeads: Lead[]) => {
      if (!currentUser) return;
      
      const uniqueLeads = newLeads.filter(newLead => 
          !savedLeads.some(existing => existing.name.toLowerCase() === newLead.name.toLowerCase())
      );
      
      if (uniqueLeads.length === 0) {
          alert("No se importaron leads: Todos duplicados.");
          return;
      }

      // Batch write simulation (Loop promises)
      const batchPromises = uniqueLeads.map(l => setDoc(doc(db, "leads", l.id), sanitizeForFirestore(l)));
      
      try {
        await Promise.all(batchPromises);
        const targetUser = uniqueLeads[0].owner;
        logAction('CREATE', `Importación masiva: ${uniqueLeads.length} leads asignados a ${targetUser}`);
        alert(`✅ ÉXITO CLOUD: ${uniqueLeads.length} leads sincronizados.`);
      } catch (e: any) {
          alert(`Error en importación masiva: ${e.message}`);
      }
  };

  const handleRemoveFromCRM = async (id: string) => {
    const lead = savedLeads.find(l => l.id === id);
    if (lead?.owner && lead.owner !== currentUser) {
        // Here we could add Admin logic, but basic delete is safer per user for now unless specifically requested
        // Let's allow admin to delete anything if needed, but keeping it simple first.
        // Actually, prompt says Mati "armar y desarmar", so Admin should be able to delete.
        // But the check is currently blocking.
    }

    if (window.confirm("¿CONFIRMAR ELIMINACIÓN DE REGISTRO DE LA NUBE?")) {
      await deleteDoc(doc(db, "leads", id));
      logAction('DELETE', `Eliminó registro: ${lead?.name || 'Desconocido'}`);
    }
  };

  const handleUpdateLead = async (id: string, updates: Partial<Lead>) => {
     // Find current lead to check for status changes logic
     const currentLead = savedLeads.find(l => l.id === id);
     if (!currentLead) return;

     const now = new Date().toISOString().split('T')[0];
     let autoUpdates: Partial<Lead> = {};
     
     if (updates.status || updates.notes || updates.nextAction || updates.priceList) {
         autoUpdates.lastContactDate = now;
     }

     const finalUpdates = { ...updates, ...autoUpdates };

     try {
         await updateDoc(doc(db, "leads", id), sanitizeForFirestore(finalUpdates));
         
         if (updates.status && updates.status !== currentLead.status) {
            logAction('STATUS_CHANGE', `Cambió estado de ${currentLead.name}: ${currentLead.status.toUpperCase()} -> ${updates.status?.toUpperCase()}`);
        }
     } catch (e) { console.error("Update failed", e); }
  };
  
  const handleDetailedUpdate = (id: string, updates: Partial<Lead>, context: string) => {
      handleUpdateLead(id, updates);
      if (!updates.status) {
        const leadName = savedLeads.find(l => l.id === id)?.name || 'Lead';
        logAction('UPDATE', `Editó ${context} en ${leadName}`);
      }
  };

  // --- Transfer System (Cloud) ---

  const handleRequestTransfer = async (lead: Lead) => {
      if (!currentUser || !lead.owner) return;
      
      const exists = transferRequests.find(r => r.leadId === lead.id && r.fromUser === currentUser && r.status === 'pending');
      if (exists) {
          alert("Ya hay una solicitud pendiente para este lead.");
          return;
      }

      const request: TransferRequest = {
          id: `req-${Date.now()}`,
          leadId: lead.id,
          leadName: lead.name,
          fromUser: currentUser,
          toUser: lead.owner,
          status: 'pending',
          timestamp: Date.now()
      };

      await setDoc(doc(db, "transfer_requests", request.id), sanitizeForFirestore(request));
      logAction('TRANSFER_REQUEST', `Solicitó traspaso de: ${lead.name} a ${lead.owner}`);
      alert(`Solicitud enviada a la nube.`);
  };

  const handleResolveTransfer = async (requestId: string, accepted: boolean) => {
      const request = transferRequests.find(r => r.id === requestId);
      if (!request) return;

      if (accepted) {
          await updateDoc(doc(db, "leads", request.leadId), { owner: request.fromUser, status: 'frio' });
          logAction('TRANSFER_ACCEPT', `Aceptó traspaso de ${request.leadName} a ${request.fromUser}`);
      }
      
      await updateDoc(doc(db, "transfer_requests", requestId), { status: accepted ? 'accepted' : 'rejected' });
  };

  // --- CHAT SYSTEM ---
  const handleSendMessage = async (text: string) => {
    if (!currentUser) return;
    const msg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        text: text,
        sender: currentUser,
        timestamp: Date.now(),
        type: 'text'
    };
    try {
        await setDoc(doc(db, "chat_messages", msg.id), sanitizeForFirestore(msg));
    } catch (e) { console.error("Error sending message", e); }
  };

  // --- DIRECT TASK SYSTEM ---
  const handleCreateTask = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUser || !newTaskMessage.trim() || !newTaskTarget) return;

      const task: DirectTask = {
          id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          fromUser: currentUser,
          toUser: newTaskTarget,
          message: newTaskMessage,
          status: 'pending',
          createdAt: Date.now()
      };

      await setDoc(doc(db, "direct_tasks", task.id), sanitizeForFirestore(task));
      setShowTaskCreator(false);
      setNewTaskMessage('');
      // No need to alert, UI updates automatically
  };

  const handleCompleteDirectTask = async (taskId: string) => {
      await updateDoc(doc(db, "direct_tasks", taskId), { status: 'completed', completedAt: Date.now() });
  };


  // --- Auth Flow ---
  
  const handleSelectUser = (user: User) => {
      setSelectedUserForLogin(user);
      setLoginStep('password');
      setLoginError('');
      setPasswordInput('');
  };

  const handleVerifyPassword = () => {
      if (!selectedUserForLogin) return;
      
      const credentials = getCredentials();
      const correctPassword = credentials[selectedUserForLogin];
      
      if (passwordInput === correctPassword) {
          // Success
          const user = selectedUserForLogin;
          setCurrentUser(user);
          setViewScope('me'); 
          sessionStorage.setItem('pompino_user_session', user);
          
          logAction('LOGIN', `Inicio de sesión en dispositivo`);
          
          const tasks = savedLeads.filter(l => 
              l.owner === user && 
              l.nextActionDate
          );
          setUserTasks(tasks);
          setShowTaskModal(true);
      } else {
          setLoginError('Contraseña incorrecta. Intente de nuevo.');
      }
  };

  // --- ERROR: DATABASE NOT CREATED ---
  if (connectionState === 'missing_db') {
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
              <div className="max-w-2xl w-full bg-[#111] border border-red-500/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                   <div className="relative z-10">
                       <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4 flex items-center gap-3">
                           <span className="text-4xl">🛑</span>
                           BASE DE DATOS INEXISTENTE
                       </h1>
                       <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-6">
                           <p className="text-red-400 font-bold uppercase text-xs mb-1">Causa del Bloqueo:</p>
                           <p className="text-white text-sm">El proyecto existe pero la base de datos Firestore NO ha sido creada aún.</p>
                       </div>
                       
                       <div className="space-y-4">
                           <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex gap-4 items-start ring-1 ring-white/10">
                               <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-white shrink-0">1</div>
                               <div>
                                   <p className="text-white text-sm mb-1 font-bold">Crear Base de Datos</p>
                                   <p className="text-white/50 text-xs mb-2">Entra a la consola y haz clic en <strong>"Crear base de datos"</strong>.</p>
                                   <a 
                                     href="https://console.firebase.google.com/project/pompino-b2b/firestore" 
                                     target="_blank" 
                                     className="inline-block mt-2 px-3 py-2 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30 text-xs font-bold hover:bg-indigo-500/30 transition-colors"
                                   >
                                     🔗 Ir a Firestore Console
                                   </a>
                               </div>
                           </div>

                           <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex gap-4 items-start">
                               <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-white shrink-0">2</div>
                               <div>
                                   <p className="text-white text-sm mb-1 font-bold">Seleccionar Modo de Prueba</p>
                                   <p className="text-white/50 text-xs">Es vital que selecciones <strong>"Comenzar en modo de prueba" (Test Mode)</strong> para que la app funcione sin configurar reglas complejas ahora.</p>
                               </div>
                           </div>
                       </div>
                       
                       <div className="mt-8 text-center">
                           <p className="text-white/30 text-xs mb-3">Una vez creada, espera 10 segundos y dale aquí:</p>
                           <button onClick={() => setRetryCount(p => p + 1)} className="px-8 py-4 bg-white text-black font-black uppercase text-sm rounded-xl hover:bg-gray-200 transition-colors shadow-lg shadow-white/10">
                               🔄 Ya la creé, Reintentar
                           </button>
                       </div>
                   </div>
              </div>
          </div>
      );
  }

  // --- ERROR: PERMISSION DENIED (RULES) ---
  if (connectionState === 'permission_denied') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-[#111] border border-orange-500/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                 <div className="relative z-10">
                     <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4 flex items-center gap-3">
                         <span className="text-4xl">🔐</span>
                         ACCESO DENEGADO
                     </h1>
                     <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl mb-6">
                         <p className="text-orange-400 font-bold uppercase text-xs mb-1">Causa del Bloqueo:</p>
                         <p className="text-white text-sm">La base de datos existe, pero las <strong>Reglas de Seguridad</strong> están bloqueando la conexión.</p>
                         <p className="text-white/50 text-xs mt-2">Seguramente seleccionaste "Modo de producción" al crearla.</p>
                     </div>
                     
                     <div className="space-y-4">
                         <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex gap-4 items-start">
                             <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-white shrink-0">1</div>
                             <div>
                                 <p className="text-white text-sm mb-1 font-bold">Ir a Reglas</p>
                                 <p className="text-white/50 text-xs mb-2">Entra a <a href="https://console.firebase.google.com/project/pompino-b2b/firestore/rules" target="_blank" className="text-indigo-400 underline">Firestore Rules</a>.</p>
                             </div>
                         </div>
                         <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex gap-4 items-start">
                             <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-white shrink-0">2</div>
                             <div>
                                 <p className="text-white text-sm mb-1 font-bold">Cambiar a Modo Público (Temporal)</p>
                                 <p className="text-white/50 text-xs mb-1">Borra todo lo que haya y pega esto:</p>
                                 <pre className="bg-black p-2 rounded text-[10px] text-green-400 font-mono mt-1 select-all">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
                                 </pre>
                             </div>
                         </div>
                         <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex gap-4 items-start">
                             <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-white shrink-0">3</div>
                             <div>
                                 <p className="text-white text-sm mb-1 font-bold">Publicar</p>
                                 <p className="text-white/50 text-xs">Dale al botón <strong>"Publicar"</strong> arriba a la derecha.</p>
                             </div>
                         </div>
                     </div>
                     
                     <div className="mt-8 text-center">
                         <button onClick={() => setRetryCount(p => p + 1)} className="px-8 py-4 bg-white text-black font-black uppercase text-sm rounded-xl hover:bg-gray-200 transition-colors shadow-lg shadow-white/10">
                             Reglas Actualizadas, Reintentar 🔄
                         </button>
                     </div>
                 </div>
            </div>
        </div>
    );
  }

  // --- SETUP MODE GUARD ---
  if (!isConfigured) {
      return (
          <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
              <div className="max-w-2xl w-full bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                   <div className="relative z-10">
                       <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4">
                           Falta 1 Paso: Generar Claves
                       </h1>
                       <p className="text-white/60 mb-6 text-sm">
                           Ya creaste el proyecto, pero aún no has registrado la App Web para obtener los códigos.
                       </p>

                       <div className="space-y-4">
                           <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                               <h3 className="text-white font-bold uppercase text-xs mb-2">Paso 1: Crear la App Web</h3>
                               <p className="text-white/50 text-xs mb-2">
                                   Estás en la pantalla correcta. Baja hasta el final donde dice <strong>"Tus apps"</strong>.
                               </p>
                               <p className="text-white/50 text-xs">
                                   Haz clic en el ícono circular que tiene este símbolo: <strong className="text-white bg-white/10 px-1 rounded">{`</>`}</strong> (Web). Ponle de nombre "Pompino" y dale a Registrar.
                               </p>
                           </div>
                           <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                               <h3 className="text-white font-bold uppercase text-xs mb-2">Paso 2: Copiar y Pegar</h3>
                               <p className="text-white/50 text-xs mb-2">
                                   Firebase te mostrará un código. Copia solo los valores de <code>firebaseConfig</code> (apiKey, etc) y pégalos en el archivo <code>services/firebaseConfig.ts</code>.
                               </p>
                           </div>
                           <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                               <h3 className="text-emerald-400 font-bold uppercase text-xs mb-2">Paso 3: Activar Base de Datos</h3>
                               <p className="text-white/50 text-xs">
                                   Después, en el menú lateral izquierdo, ve a <strong>"Compilación" {'>'} "Firestore Database"</strong> y haz clic en <strong>"Crear base de datos"</strong> (Elige Modo Prueba).
                               </p>
                           </div>
                       </div>
                       
                       <div className="mt-8 text-center text-white/30 text-xs font-mono animate-pulse">
                           Esperando actualización de archivo de configuración...
                       </div>
                   </div>
              </div>
          </div>
      )
  }

  // LOGIN SCREEN
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 font-sans relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-40"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-900/20 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-md w-full glass-panel rounded-3xl p-8 md:p-12 shadow-2xl text-center space-y-8 relative z-10 animate-in flex flex-col items-center">
          
          <div className="relative mb-4 group cursor-default">
            <div className="absolute inset-0 bg-indigo-500/30 blur-2xl rounded-full group-hover:bg-indigo-500/40 transition-all duration-500"></div>
            <PompinoLogo className="w-32 h-32 text-white relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
          </div>

          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white uppercase drop-shadow-lg">{PROJECT_CONFIG.appName}</h1>
            <p className="text-[11px] font-bold text-indigo-300 uppercase tracking-[0.3em] border-t border-white/10 pt-3 mt-3">{PROJECT_CONFIG.appSubtitle}</p>
          </div>
          
          {dbError && (
             <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-left">
                 <p className="text-red-400 text-xs font-black uppercase mb-1">⚠️ Error de Base de Datos</p>
                 <p className="text-white/70 text-[10px] leading-relaxed">{dbError}</p>
             </div>
          )}

          {loginStep === 'user_select' ? (
              <div className="w-full space-y-4 pt-4 animate-in fade-in slide-in-from-right duration-300">
                 <p className="text-white/50 text-xs font-medium tracking-wide mb-6">SELECCIONA TU PERFIL</p>
                 <div className="grid gap-3 w-full">
                   {userList.map((user) => (
                     <button
                       key={user}
                       onClick={() => handleSelectUser(user)}
                       className="h-14 w-full border border-white/10 rounded-xl hover:bg-white hover:text-black hover:border-white transition-all duration-300 group relative overflow-hidden bg-black/40 backdrop-blur-sm"
                     >
                       <span className="relative z-10 text-sm font-black uppercase tracking-widest">{user}</span>
                       <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                     </button>
                   ))}
                 </div>
              </div>
          ) : (
             <div className="w-full space-y-4 pt-4 animate-in fade-in slide-in-from-right duration-300">
                  <div className="relative flex items-center justify-center mb-6">
                      <button 
                        onClick={() => { setLoginStep('user_select'); setPasswordInput(''); setLoginError(''); }} 
                        className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                        title="Volver"
                      >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <div className="flex flex-col items-center">
                          <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-0.5">Ingresando como:</p>
                          <p className="text-2xl font-black text-white uppercase tracking-tight">{selectedUserForLogin}</p>
                      </div>
                  </div>
                  
                  <div className="space-y-3">
                      <input 
                        type="password" 
                        placeholder="Contraseña" 
                        value={passwordInput} 
                        onChange={(e) => { setPasswordInput(e.target.value); setLoginError(''); }}
                        onKeyDown={(e) => e.key === 'Enter' && handleVerifyPassword()}
                        autoFocus
                        className={`w-full h-14 bg-black/50 border rounded-xl px-5 text-center text-lg text-white outline-none transition-all ${loginError ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-indigo-500'}`}
                      />
                      {loginError && <p className="text-red-400 text-xs font-bold animate-pulse">{loginError}</p>}
                      
                      <button 
                        onClick={handleVerifyPassword}
                        className="w-full h-14 bg-white text-black font-black uppercase text-sm rounded-xl hover:bg-indigo-50 hover:text-indigo-900 transition-all shadow-lg shadow-white/10 tracking-widest mt-2"
                      >
                          Entrar al Sistema
                      </button>
                  </div>
             </div>
          )}
          
          <div className="pt-8 border-t border-white/5 w-full flex flex-col items-center gap-4">
             <button onClick={() => setShowHelp(true)} className="text-[10px] uppercase font-bold text-white/30 hover:text-white transition-colors flex items-center gap-2">
                 <span>❓</span> ¿Cómo funciona esto?
             </button>
             <p className={`text-[9px] uppercase tracking-widest flex items-center gap-2 ${isCloudConnected ? 'text-emerald-400/60' : 'text-white/20'}`}>
                 {isCloudConnected ? '🟢 Nube Conectada' : '⚪ Conectando a Firebase...'}
             </p>
          </div>
        </div>
        
        <HowToUseModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#050505] text-white selection:bg-indigo-500/30 selection:text-white overflow-x-hidden font-sans relative">
       <div className="fixed inset-0 bg-grid-pattern opacity-30 pointer-events-none z-0"></div>
       <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-900/10 blur-[100px] rounded-full pointer-events-none z-0"></div>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* --- MODALS --- */}

      <HowToUseModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      <TaskReminderModal 
        isOpen={showTaskModal} 
        onClose={() => setShowTaskModal(false)} 
        tasks={userTasks} 
        directTasks={directTasks.filter(t => t.toUser === currentUser)}
        user={currentUser} 
        onUpdateTask={handleUpdateLead} 
        onCompleteDirectTask={handleCompleteDirectTask}
      />
      
      {showTaskCreator && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
             <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
                  <h3 className="text-sm font-black text-white uppercase tracking-wide mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span> Asignar Tarea Directa
                  </h3>
                  <form onSubmit={handleCreateTask} className="space-y-4">
                      <div>
                          <label className="text-[10px] font-bold text-white/50 uppercase block mb-1">Destinatario</label>
                          <div className="grid grid-cols-2 gap-2">
                              {userList.filter(u => u !== currentUser).map(u => (
                                  <button 
                                    key={u} 
                                    type="button"
                                    onClick={() => setNewTaskTarget(u as User)}
                                    className={`py-2 rounded-lg text-[10px] font-bold uppercase border transition-all ${newTaskTarget === u ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-black/50 border-white/10 text-white/50 hover:bg-white/10'}`}
                                  >
                                      {u}
                                  </button>
                              ))}
                          </div>
                      </div>
                      <div>
                           <label className="text-[10px] font-bold text-white/50 uppercase block mb-1">Mensaje / Tarea</label>
                           <textarea 
                             value={newTaskMessage} 
                             onChange={(e) => setNewTaskMessage(e.target.value)}
                             placeholder="Ej: Revisar cliente zona norte..." 
                             className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-indigo-500 outline-none h-24 resize-none"
                             autoFocus
                           />
                      </div>
                      <div className="flex gap-2">
                          <button type="button" onClick={() => setShowTaskCreator(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 text-xs font-bold uppercase hover:bg-white/5">Cancelar</button>
                          <button type="submit" disabled={!newTaskMessage} className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase ${!newTaskMessage ? 'bg-white/10 text-white/20' : 'bg-white text-black hover:bg-indigo-50'}`}>Enviar Tarea</button>
                      </div>
                  </form>
             </div>
          </div>
      )}

      {/* --- SIDEBAR --- */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => { setActiveTab(tab); setIsSidebarOpen(false); }} 
        activeFolder={activeFolder}
        setActiveFolder={setActiveFolder}
        viewScope={viewScope}
        setViewScope={setViewScope}
        savedLeads={savedLeads}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        currentUser={currentUser}
        onLogout={() => { 
            logAction('LOGOUT', `Cierre de sesión de ${currentUser}`);
            setCurrentUser(null); 
            sessionStorage.removeItem('pompino_user_session'); 
            setLoginStep('user_select');
            setPasswordInput('');
        }}
        unreadMessages={unreadChatCount}
        pendingTasksCount={directTasks.filter(t => t.toUser === currentUser && t.status === 'pending').length}
        onOpenTaskCreator={() => setShowTaskCreator(true)}
        onOpenHelp={() => setShowHelp(true)}
      />
      
      <main className={`flex-1 flex flex-col min-h-screen relative z-10 transition-all duration-300 lg:ml-72 ${isSidebarOpen ? 'translate-x-72 lg:translate-x-0' : 'translate-x-0'}`}>
        <header className="px-4 md:px-8 py-4 lg:py-6 flex justify-between items-center border-b border-white/5 bg-[#050505]/90 backdrop-blur-xl sticky top-0 z-40 w-full">
          <div className="flex items-center gap-4 lg:gap-6 flex-1 min-w-0">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors shrink-0"
              aria-label="Abrir menú"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>

            <div className="flex items-center gap-4">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-white/[0.03] rounded-2xl border border-white/5 flex items-center justify-center shrink-0 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
                    <PompinoLogo className="w-6 h-6 md:w-8 md:h-8 text-white relative z-10" />
                </div>

                <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-white/40 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">
                            {activeTab === 'intelligence' ? 'Buscar Oportunidades' : activeTab === 'crm' ? 'Gestionar Oportunidades' : activeTab === 'chat' ? 'Intranet' : activeTab === 'agenda' ? 'Agenda Operativa' : activeTab === 'stats' ? 'Métricas & KPIs' : 'Operaciones'}
                        </span>
                        <span className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px] animate-pulse ${isCloudConnected ? 'bg-emerald-500 shadow-emerald-500' : 'bg-red-500 shadow-red-500'}`}></span>
                    </div>

                    <div className="flex items-baseline gap-2 md:gap-3">
                        <h1 className="text-xl md:text-3xl font-black italic tracking-tighter text-white uppercase leading-none drop-shadow-lg">
                            {PROJECT_CONFIG.appName}
                        </h1>
                        <div className="hidden md:block h-3 w-px bg-white/10 rotate-12"></div>
                        <span className="hidden md:inline text-indigo-400 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em]">
                            {PROJECT_CONFIG.appSubtitle}
                        </span>
                    </div>
                </div>
            </div>
          </div>
          
          <div className="flex-shrink-0 ml-4 pl-6 border-l border-white/5 hidden md:block">
            <div className="flex items-center gap-4 group cursor-default">
                <div className="text-right leading-tight">
                    <p className="text-[11px] font-black text-white uppercase tracking-widest group-hover:text-indigo-400 transition-colors">{currentUser}</p>
                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{isCloudConnected ? 'ONLINE' : 'OFFLINE'}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center font-black text-sm text-white shadow-inner relative overflow-hidden">
                    <span className="relative z-10">{currentUser.charAt(0)}</span>
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-transparent opacity-50 group-hover:opacity-80 transition-opacity"></div>
                </div>
            </div>
          </div>
        </header>

        <div className="p-3 md:p-6 lg:p-8 flex-1 w-full max-w-[1800px] mx-auto overflow-hidden">
          {dbError && (
             <div className="mb-4 bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center justify-between">
                 <span className="text-red-400 text-xs font-bold uppercase tracking-wide">⚠️ Error crítico: {dbError}</span>
             </div>
          )}
          
          {activeTab === 'agenda' && (
              <AgendaView 
                tasks={savedLeads.filter(l => l.owner === currentUser)} 
                directTasks={directTasks.filter(t => t.toUser === currentUser)}
                user={currentUser}
                onUpdateTask={handleUpdateLead}
                onCompleteDirectTask={handleCompleteDirectTask}
              />
          )}

          {activeTab === 'intelligence' && (
            <IntelligenceTool 
              leads={scrapedResults}
              onUpdateLeads={setScrapedResults}
              onSaveToCRM={handleSaveToCRM} 
              allSavedLeads={savedLeads}
              logAction={logAction}
              currentUser={currentUser}
            />
          )}
          {activeTab === 'crm' && (
            <CRMView 
              leads={savedLeads} 
              onRemove={handleRemoveFromCRM} 
              onUpdateLead={handleUpdateLead}
              onDetailedUpdate={handleDetailedUpdate}
              onAddManualLead={handleAddManualLead}
              onImportLeads={handleImportLeads}
              activeFolder={activeFolder}
              currentUser={currentUser}
              viewScope={viewScope}
              transferRequests={transferRequests}
              onResolveTransfer={handleResolveTransfer}
              onRequestTransfer={handleRequestTransfer}
            />
          )}
          
          {/* ADMIN ONLY VIEWS */}
          {activeTab === 'stats' && isAdmin && (
            <StatsView leads={savedLeads} currentUser={currentUser} />
          )}

          {activeTab === 'operations' && isAdmin && (
            <OperationsView 
                logs={operationsLog} 
                onBackup={() => {
                     const blob = new Blob([JSON.stringify({leads: savedLeads, logs: operationsLog}, null, 2)], { type: 'application/json' });
                     const url = URL.createObjectURL(blob);
                     const link = document.createElement('a');
                     link.href = url;
                     link.download = `POMPINO_CLOUD_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
                     link.click();
                }} 
                onRestore={() => alert("El sistema está en MODO NUBE. La restauración debe hacerse por el Administrador de Base de Datos (Mati).")} 
                storageUsage={isCloudConnected ? "CLOUD" : "OFFLINE"}
            />
          )}

          {activeTab === 'chat' && (
            <TeamChat 
                messages={chatMessages}
                currentUser={currentUser}
                onSendMessage={handleSendMessage}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
