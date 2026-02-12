
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import { IntelligenceTool } from './components/IntelligenceTool';
import CRMView from './components/CRMView';
import OperationsView from './components/OperationsView';
import AgendaView from './components/AgendaView';
import StatsView from './components/StatsView';
import TeamChat from './components/TeamChat';
import { PompinoLogo } from './components/PompinoLogo';
import { Lead, User, OperationLog, TransferRequest, ChatMessage, DirectTask, ChatChannel } from './types';
import HowToUseModal from './components/HowToUseModal';
import ReportIssueModal from './components/ReportIssueModal'; // New Import
import ActionCenter from './components/ActionCenter'; // Non-invasive notifications
import { PROJECT_CONFIG, getCredentials, getUserNames, isUserAdmin } from './projectConfig';

// Firebase Imports
import { db, collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, query, orderBy, limit, isConfigured } from './services/firebaseConfig';

const App: React.FC = () => {
  // Identity State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // App State
  const [activeTab, setActiveTab] = useState<'intelligence' | 'crm' | 'operations' | 'chat' | 'agenda' | 'stats'>('intelligence');
  const [activeFolder, setActiveFolder] = useState<string>('all');
  
  // View Scope: 'me' means my leads, or specific User name means viewing their folder
  const [viewScope, setViewScope] = useState<User | 'me'>('me'); 

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Modal States
  const [showHelp, setShowHelp] = useState(false);
  const [showReport, setShowReport] = useState(false); // New Report State
  
  // Action Center State (Non-invasive Agenda)
  const [showActionCenter, setShowActionCenter] = useState(false);
  
  // Direct Task State
  const [directTasks, setDirectTasks] = useState<DirectTask[]>([]);
  const [showTaskCreator, setShowTaskCreator] = useState(false);
  const [newTaskTarget, setNewTaskTarget] = useState<User>('');
  const [newTaskMessage, setNewTaskMessage] = useState('');

  // Data State
  const [savedLeads, setSavedLeads] = useState<Lead[]>([]);
  const [scrapedResults, setScrapedResults] = useState<Lead[]>([]); 
  const [operationsLog, setOperationsLog] = useState<OperationLog[]>([]);
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatChannels, setChatChannels] = useState<ChatChannel[]>([]);
  
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
  const sanitizeForFirestore = (data: any) => {
    return JSON.parse(JSON.stringify(data));
  };

  // --- GOOGLE ANALYTICS INJECTION ---
  useEffect(() => {
    const gaId = PROJECT_CONFIG.analyticsId || localStorage.getItem('pompino_ga_id');
    if (gaId && gaId.startsWith('G-') && !document.getElementById('ga-script')) {
        const script = document.createElement('script');
        script.id = 'ga-script';
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
        document.head.appendChild(script);

        const script2 = document.createElement('script');
        script2.id = 'ga-config';
        script2.innerHTML = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
        `;
        document.head.appendChild(script2);
        localStorage.setItem('pompino_ga_id', gaId);
    }
  }, []);

  // --- FIREBASE SYNCHRONIZATION ---

  useEffect(() => {
    if (!isConfigured) return;

    setDbError(null);
    setConnectionState('ok');

    // 1. Sync Leads (CRM)
    const qLeads = query(collection(db, "leads"));
    const unsubLeads = onSnapshot(qLeads, 
      (snapshot) => {
        const leadsData = snapshot.docs.map(doc => doc.data() as Lead);
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

        if (
            msg.includes("Cloud Firestore API") || 
            msg.includes("disabled") ||
            msg.includes("does not exist") || 
            msg.includes("not-found") ||
            code === 'not-found'
        ) {
            setConnectionState('missing_db');
        } else if (msg.includes("permission-denied") || code === 'permission-denied') {
            setConnectionState('permission_denied');
        } else {
            setDbError(msg);
            setConnectionState('unknown_error');
        }
        setIsCloudConnected(false);
      }
    );

    // 2. Sync Logs
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

    // 4. Sync Chat Messages
    const qChat = query(collection(db, "chat_messages"), orderBy("timestamp", "asc"), limit(200));
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

    // 6. Sync Chat Channels
    const qChannels = query(collection(db, "chat_channels"));
    const unsubChannels = onSnapshot(qChannels, (snapshot) => {
        const channelsData = snapshot.docs.map(doc => doc.data() as ChatChannel);
        
        // Seed Default Channels if empty
        if (channelsData.length === 0 && currentUser) {
            const seedChannels = [
                { id: 'general', name: 'General', createdBy: 'system', isSystem: true },
                { id: 'manolo', name: 'Que manolo no es mejor', createdBy: 'system', isSystem: true },
                { id: 'mujer', name: 'Hablemos de tu mujer', createdBy: 'system', isSystem: true },
            ];
            seedChannels.forEach(c => setDoc(doc(db, "chat_channels", c.id), c));
        } else {
            setChatChannels(channelsData);
        }
    });

    return () => {
      unsubLeads();
      unsubLogs();
      unsubReqs();
      unsubChat();
      unsubTasks();
      unsubChannels();
    };
  }, [retryCount, currentUser]);

  // Handle Chat Notifications Logic
  useEffect(() => {
      if (activeTab === 'chat') {
          setUnreadChatCount(0);
      }
  }, [activeTab, chatMessages]);

  useEffect(() => {
      if (activeTab !== 'chat' && chatMessages.length > 0) {
          const lastMsg = chatMessages[chatMessages.length - 1];
          if (Date.now() - lastMsg.timestamp < 3000) {
              setUnreadChatCount(prev => prev + 1);
          }
      }
  }, [chatMessages]);


  // Init Local Data
  useEffect(() => {
    const storedSearch = localStorage.getItem('pompino_b2b_search_v7');
    const storedUser = sessionStorage.getItem('pompino_user_session');

    if (storedSearch) setScrapedResults(JSON.parse(storedSearch));
    if (storedUser) {
        setCurrentUser(storedUser as User);
        // Show action center on restore session
        setShowActionCenter(true);
    }
  }, []);

  // Local Persistence for Scraping
  useEffect(() => { localStorage.setItem('pompino_b2b_search_v7', JSON.stringify(scrapedResults)); }, [scrapedResults]);

  // --- ACTIONS (Cloud) ---

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
        alert(`⛔ ACCESO DENEGADO\n\nEl lead "${existingLead.name}" ya está siendo gestionado por: ${ownerName}.`);
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
        whatsapp: lead.whatsapp || '',
        email: lead.email || '',
        notes: lead.notes || '',
        contactName: lead.contactName || '',
        sourceUrl: lead.sourceUrl || '',
        nextActionDate: '',
        lastContactDate: ''
    };

    try {
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
    if (window.confirm("¿CONFIRMAR ELIMINACIÓN DE REGISTRO DE LA NUBE?")) {
      await deleteDoc(doc(db, "leads", id));
      logAction('DELETE', `Eliminó registro: ${lead?.name || 'Desconocido'}`);
    }
  };

  const handleUpdateLead = async (id: string, updates: Partial<Lead>) => {
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
  const handleSendMessage = async (text: string, channelId: string) => {
    if (!currentUser) return;
    const msg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        text: text,
        sender: currentUser,
        timestamp: Date.now(),
        type: 'text',
        channelId: channelId
    };
    try {
        await setDoc(doc(db, "chat_messages", msg.id), sanitizeForFirestore(msg));
    } catch (e) { console.error("Error sending message", e); }
  };

  const handleCreateChannel = async (channelName: string) => {
      if (!currentUser) return;
      const id = channelName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const newChannel: ChatChannel = {
          id,
          name: channelName,
          createdBy: currentUser,
          isSystem: false
      };
      await setDoc(doc(db, "chat_channels", newChannel.id), newChannel);
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
  };

  const handleCompleteDirectTask = async (taskId: string) => {
      await updateDoc(doc(db, "direct_tasks", taskId), { status: 'completed', completedAt: Date.now() });
  };


  // --- Auth Flow ---
  const handleSelectUser = (user: User) => {
      // Direct Login - No Password
      setCurrentUser(user);
      setViewScope('me'); 
      sessionStorage.setItem('pompino_user_session', user);
      logAction('LOGIN', `Inicio de sesión en dispositivo`);
      setShowActionCenter(true);
  };


  // --- RENDERING ERRORS --- (Missing DB, Permission Denied, Setup)
  if (connectionState === 'missing_db') {
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
              <div className="max-w-2xl w-full bg-[#111] border border-red-500/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                   <div className="relative z-10">
                       <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4 flex items-center gap-3">
                           <span className="text-4xl">🛑</span> BASE DE DATOS INEXISTENTE
                       </h1>
                       <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-6">
                           <p className="text-red-400 font-bold uppercase text-xs mb-1">Causa del Bloqueo:</p>
                           <p className="text-white text-sm">El proyecto existe pero la base de datos Firestore NO ha sido creada aún.</p>
                       </div>
                       <button onClick={() => setRetryCount(p => p + 1)} className="px-8 py-4 bg-white text-black font-black uppercase text-sm rounded-xl hover:bg-gray-200 transition-colors shadow-lg shadow-white/10">
                               🔄 Ya la creé, Reintentar
                       </button>
                   </div>
              </div>
          </div>
      );
  }

  if (connectionState === 'permission_denied') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-[#111] border border-orange-500/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                 <div className="relative z-10">
                     <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4 flex items-center gap-3">
                         <span className="text-4xl">🔐</span> ACCESO DENEGADO
                     </h1>
                     <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl mb-6">
                         <p className="text-orange-400 font-bold uppercase text-xs mb-1">Causa del Bloqueo:</p>
                         <p className="text-white text-sm">Reglas de Seguridad bloqueando la conexión.</p>
                     </div>
                     <button onClick={() => setRetryCount(p => p + 1)} className="px-8 py-4 bg-white text-black font-black uppercase text-sm rounded-xl hover:bg-gray-200 transition-colors shadow-lg shadow-white/10">
                             Reglas Actualizadas, Reintentar 🔄
                     </button>
                 </div>
            </div>
        </div>
    );
  }

  if (!isConfigured) {
      return (
          <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
              <div className="max-w-2xl w-full bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                   <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4">Falta Configuración</h1>
                   <p className="text-white/60 mb-6 text-sm">Registra la App Web y copia las claves.</p>
              </div>
          </div>
      )
  }

  // LOGIN SCREEN
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 font-sans relative overflow-hidden">
        <HowToUseModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        {/* Removed glass-panel class and unnecessary shadows */}

        <div className="max-w-md w-full rounded-3xl p-8 md:p-12 text-center space-y-8 relative z-10 animate-in flex flex-col items-center">
          
          <div className="relative mb-8 group cursor-default">
            {/* Integrated Logo: Larger size, no glow/shadow effects */}
            <PompinoLogo className="w-80 h-80 text-white relative z-10" />
          </div>
          
          {dbError && (
             <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-left">
                 <p className="text-red-400 text-xs font-black uppercase mb-1">⚠️ Error de Base de Datos</p>
                 <p className="text-white/70 text-[10px] leading-relaxed">{dbError}</p>
             </div>
          )}

          <div className="w-full space-y-4 pt-4 animate-in fade-in slide-in-from-right duration-300">
             <p className="text-white/30 text-xs font-bold tracking-widest mb-6 uppercase">Selecciona tu perfil</p>
             <div className="grid gap-3 w-full">
               {userList.map((user) => (
                 <button
                   key={user}
                   onClick={() => handleSelectUser(user)}
                   className="h-14 w-full border border-white/10 rounded-xl hover:bg-white hover:text-black hover:border-white transition-all duration-300 group relative overflow-hidden bg-white/5"
                 >
                   <span className="relative z-10 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2">
                       {user}
                       {isUserAdmin(user) && (
                           <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded border border-white/10 text-white/60 group-hover:text-black/60 group-hover:border-black/10">ADMIN</span>
                       )}
                   </span>
                 </button>
               ))}
             </div>
             
             <button 
                onClick={() => setShowHelp(true)}
                className="text-[10px] text-white/20 hover:text-white font-bold uppercase tracking-widest mt-8 transition-colors"
             >
                 ¿Cómo funciona el sistema?
             </button>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN APP UI ---
  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-[#050505]">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        activeFolder={activeFolder}
        setActiveFolder={setActiveFolder}
        savedLeads={savedLeads}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        currentUser={currentUser}
        onLogout={() => { 
            setCurrentUser(null); 
            sessionStorage.removeItem('pompino_user_session'); 
            setShowActionCenter(false);
        }}
        viewScope={viewScope}
        setViewScope={setViewScope}
        unreadMessages={unreadChatCount}
        pendingTasksCount={0} // Managed by ActionCenter now
        onOpenTaskCreator={() => setShowTaskCreator(true)}
        onOpenHelp={() => setShowHelp(true)}
        onOpenReport={() => setShowReport(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative z-0 transition-all duration-300 lg:pl-72">
        {/* WARNING BANNER */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center animate-pulse">
            <p className="text-amber-400 text-[10px] md:text-xs font-black uppercase tracking-widest">
                estas usando un usuario abierto - Carga cosas y gestiona operaciones tranquilo - pelotudazo!!
            </p>
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden p-4 flex items-center justify-between border-b border-white/5 bg-[#050505]">
            <div className="flex items-center gap-2">
                <div className="w-24 h-12 flex items-center justify-center">
                    <PompinoLogo variant="full" className="w-full h-full text-white" />
                </div>
            </div>
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll p-4 md:p-8 relative">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none fixed"></div>
            
            <div className="relative z-10 max-w-7xl mx-auto w-full">
                
                {/* ACTION CENTER (Replaces Modal) */}
                {showActionCenter && (
                    <ActionCenter 
                        tasks={savedLeads.filter(l => l.owner === currentUser)}
                        directTasks={directTasks.filter(t => t.toUser === currentUser)}
                        user={currentUser}
                        onUpdateTask={handleUpdateLead}
                        onCompleteDirectTask={handleCompleteDirectTask}
                        onClose={() => setShowActionCenter(false)}
                    />
                )}

                {activeTab === 'intelligence' && (
                  <IntelligenceTool 
                    leads={scrapedResults} 
                    onUpdateLeads={setScrapedResults} 
                    onSaveToCRM={handleSaveToCRM}
                    allSavedLeads={savedLeads} // For ownership check
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

                {activeTab === 'operations' && isAdmin && (
                  <OperationsView 
                    logs={operationsLog} 
                    onBackup={() => {
                        const blob = new Blob([JSON.stringify(savedLeads, null, 2)], {type: 'application/json'});
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `pompino_backup_${new Date().toISOString()}.json`;
                        a.click();
                        logAction('CREATE', 'Descarga de Backup Manual');
                    }}
                    onRestore={() => {}} // Disabled in cloud mode
                    storageUsage={isCloudConnected ? "CLOUD" : "OFFLINE"}
                  />
                )}

                {activeTab === 'chat' && (
                    <TeamChat 
                        messages={chatMessages} 
                        channels={chatChannels}
                        currentUser={currentUser} 
                        onSendMessage={handleSendMessage} 
                        onCreateChannel={handleCreateChannel}
                    />
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

                {activeTab === 'stats' && isAdmin && (
                    <StatsView leads={savedLeads} currentUser={currentUser} />
                )}
            </div>
        </div>
      </main>

      {/* Task Creator Modal (Direct Tasks) */}
      {showTaskCreator && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
              <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95">
                  <h3 className="text-lg font-black text-white uppercase italic tracking-tighter mb-4 flex items-center gap-2">
                      <span className="text-xl">📢</span> Asignar Tarea
                  </h3>
                  <form onSubmit={handleCreateTask} className="space-y-4">
                      <div>
                          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 block">Destinatario</label>
                          <div className="grid grid-cols-2 gap-2">
                              {userList.filter(u => u !== currentUser).map(u => (
                                  <button
                                    key={u}
                                    type="button"
                                    onClick={() => setNewTaskTarget(u)}
                                    className={`h-10 rounded-xl text-xs font-bold uppercase transition-all ${newTaskTarget === u ? 'bg-rose-600 text-white shadow-lg' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                                  >
                                      {u}
                                  </button>
                              ))}
                          </div>
                      </div>
                      <div>
                           <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 block">Mensaje / Instrucción</label>
                           <textarea 
                              value={newTaskMessage}
                              onChange={(e) => setNewTaskMessage(e.target.value)}
                              placeholder="Ej: Llamar urgente a..."
                              className="w-full h-24 bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-rose-500 outline-none resize-none"
                           />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                          <button type="button" onClick={() => setShowTaskCreator(false)} className="px-4 py-2 text-xs font-bold text-white/40 hover:text-white uppercase">Cancelar</button>
                          <button type="submit" disabled={!newTaskTarget || !newTaskMessage} className="px-6 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-black uppercase rounded-xl transition-all shadow-lg">Enviar Tarea</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* MODALS */}
      <ReportIssueModal 
         isOpen={showReport} 
         onClose={() => setShowReport(false)} 
         currentUser={currentUser} 
      />
      <HowToUseModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
};

export default App;
