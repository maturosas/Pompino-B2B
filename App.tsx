
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import IntelligenceTool from './components/IntelligenceTool';
import CRMView from './components/CRMView';
import OperationsView from './components/OperationsView';
import { PompinoLogo } from './components/PompinoLogo';
import { Lead, User, OperationLog } from './types';
import HowToUseModal from './components/HowToUseModal';

const App: React.FC = () => {
  // Identity State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // App State
  const [activeTab, setActiveTab] = useState<'intelligence' | 'crm' | 'operations'>('intelligence');
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLoginHelp, setShowLoginHelp] = useState(false);

  // Data State
  const [savedLeads, setSavedLeads] = useState<Lead[]>([]);
  const [scrapedResults, setScrapedResults] = useState<Lead[]>([]);
  const [operationsLog, setOperationsLog] = useState<OperationLog[]>([]);

  // Init Data from LocalStorage
  useEffect(() => {
    const storedCRM = localStorage.getItem('pompino_b2b_crm_v7');
    const storedSearch = localStorage.getItem('pompino_b2b_search_v7');
    const storedLogs = localStorage.getItem('pompino_b2b_logs_v1');
    const storedUser = sessionStorage.getItem('pompino_user_session');

    if (storedCRM) setSavedLeads(JSON.parse(storedCRM));
    if (storedSearch) setScrapedResults(JSON.parse(storedSearch));
    if (storedLogs) setOperationsLog(JSON.parse(storedLogs));
    if (storedUser) setCurrentUser(storedUser as User);
  }, []);

  // Persistence
  useEffect(() => { localStorage.setItem('pompino_b2b_crm_v7', JSON.stringify(savedLeads)); }, [savedLeads]);
  useEffect(() => { localStorage.setItem('pompino_b2b_search_v7', JSON.stringify(scrapedResults)); }, [scrapedResults]);
  useEffect(() => { localStorage.setItem('pompino_b2b_logs_v1', JSON.stringify(operationsLog)); }, [operationsLog]);

  // Logging System
  const logAction = (action: OperationLog['action'], details: string) => {
    if (!currentUser) return;
    const newLog: OperationLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      user: currentUser,
      action,
      details,
      timestamp: Date.now()
    };
    setOperationsLog(prev => [newLog, ...prev]);
  };

  // Actions
  const handleSaveToCRM = (lead: Lead) => {
    if (!savedLeads.find(l => l.id === lead.id)) {
      setSavedLeads(prev => [{ ...lead, savedAt: Date.now(), isClient: false, status: 'frio' }, ...prev]);
      logAction('CREATE', `Archivó prospecto: ${lead.name}`);
    }
  };

  const handleAddManualLead = (lead: Lead) => {
    setSavedLeads(prev => [lead, ...prev]);
    logAction('CREATE', `Creó manualmente: ${lead.name}`);
  };

  const handleRemoveFromCRM = (id: string) => {
    const lead = savedLeads.find(l => l.id === id);
    if (window.confirm("¿CONFIRMAR ELIMINACIÓN DE REGISTRO?")) {
      setSavedLeads(prev => prev.filter(l => l.id !== id));
      logAction('DELETE', `Eliminó registro: ${lead?.name || 'Desconocido'}`);
    }
  };

  const handleUpdateLead = (id: string, updates: Partial<Lead>) => {
    setSavedLeads(prev => prev.map(l => {
        if (l.id === id) {
            if (updates.status && updates.status !== l.status) {
                logAction('STATUS_CHANGE', `Cambió estado de ${l.name}: ${l.status.toUpperCase()} -> ${updates.status.toUpperCase()}`);
            }
            return { ...l, ...updates };
        }
        return l;
    }));
  };
  
  const handleDetailedUpdate = (id: string, updates: Partial<Lead>, context: string) => {
      handleUpdateLead(id, updates);
      if (!updates.status) {
        const leadName = savedLeads.find(l => l.id === id)?.name || 'Lead';
        logAction('UPDATE', `Editó ${context} en ${leadName}`);
      }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    sessionStorage.setItem('pompino_user_session', user);
    logAction('UPDATE', `Inicio de sesión en el sistema`);
  };

  // LOGIN SCREEN
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 font-sans relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-grid-pattern opacity-40"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-900/20 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-md w-full glass-panel rounded-3xl p-8 md:p-12 shadow-2xl text-center space-y-8 relative z-10 animate-in flex flex-col items-center">
          
          {/* Logo Area */}
          <div className="relative mb-4 group cursor-default">
            <div className="absolute inset-0 bg-indigo-500/30 blur-2xl rounded-full group-hover:bg-indigo-500/40 transition-all duration-500"></div>
            <PompinoLogo className="w-32 h-32 text-white relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
          </div>

          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white uppercase drop-shadow-lg">POMPINO</h1>
            <p className="text-[11px] font-bold text-indigo-300 uppercase tracking-[0.3em] border-t border-white/10 pt-3 mt-3">By Mati Rosas</p>
          </div>

          <div className="w-full space-y-4 pt-4">
             <p className="text-white/50 text-xs font-medium tracking-wide mb-6">SELECCIONA TU PERFIL DE ACCESO</p>
             <div className="grid gap-3 w-full">
               {(['Mati', 'Diego', 'Gaston'] as User[]).map((user) => (
                 <button
                   key={user}
                   onClick={() => handleLogin(user)}
                   className="h-14 w-full border border-white/10 rounded-xl hover:bg-white hover:text-black hover:border-white transition-all duration-300 group relative overflow-hidden bg-black/40 backdrop-blur-sm"
                 >
                   <span className="relative z-10 text-sm font-black uppercase tracking-widest">{user}</span>
                   <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                 </button>
               ))}
             </div>
          </div>
          
          <div className="pt-8 border-t border-white/5 w-full flex flex-col items-center gap-4">
             <button 
                onClick={() => setShowLoginHelp(true)}
                className="text-[10px] font-bold text-white/40 hover:text-white uppercase tracking-widest border-b border-transparent hover:border-white/50 transition-all pb-0.5"
             >
                ¿Cómo usar la plataforma?
             </button>
             <p className="text-[9px] text-white/20 uppercase tracking-widest">v8.2 • BZS Intelligence System</p>
          </div>
        </div>
        
        <HowToUseModal isOpen={showLoginHelp} onClose={() => setShowLoginHelp(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#050505] text-white selection:bg-indigo-500/30 selection:text-white overflow-x-hidden font-sans relative">
       {/* Global Background Effects */}
       <div className="fixed inset-0 bg-grid-pattern opacity-30 pointer-events-none z-0"></div>
       <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-900/10 blur-[100px] rounded-full pointer-events-none z-0"></div>

      {/* Overlay para móvil */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => { setActiveTab(tab); setIsSidebarOpen(false); }} 
        activeFolder={activeFolder}
        setActiveFolder={setActiveFolder}
        savedLeads={savedLeads}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        currentUser={currentUser}
        onLogout={() => { 
            logAction('UPDATE', 'Cierre de sesión');
            setCurrentUser(null); 
            sessionStorage.removeItem('pompino_user_session'); 
        }}
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

            {/* Brand Header Section */}
            <div className="flex items-center gap-4">
                {/* Logo Box */}
                <div className="w-12 h-12 md:w-14 md:h-14 bg-white/[0.03] rounded-2xl border border-white/5 flex items-center justify-center shrink-0 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
                    <PompinoLogo className="w-7 h-7 md:w-8 md:h-8 text-white relative z-10" />
                </div>

                {/* Text Layout */}
                <div className="flex flex-col justify-center">
                    {/* Top Row */}
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
                            {activeTab === 'intelligence' ? 'Buscador Inteligente' : activeTab === 'crm' ? 'Gestión CRM' : 'Operaciones'}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1] animate-pulse"></span>
                    </div>

                    {/* Bottom Row */}
                    <div className="flex items-baseline gap-3">
                        <h1 className="text-2xl md:text-3xl font-black italic tracking-tighter text-white uppercase leading-none drop-shadow-lg">
                            POMPINO
                        </h1>
                        <div className="h-3 w-px bg-white/10 rotate-12"></div>
                        <span className="text-indigo-400 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em]">
                            By Mati Rosas
                        </span>
                    </div>
                </div>
            </div>
          </div>
          
          {/* User Profile */}
          <div className="flex-shrink-0 ml-4 pl-6 border-l border-white/5 hidden md:block">
            <div className="flex items-center gap-4 group cursor-default">
                <div className="text-right leading-tight">
                    <p className="text-[11px] font-black text-white uppercase tracking-widest group-hover:text-indigo-400 transition-colors">{currentUser}</p>
                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Admin</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center font-black text-sm text-white shadow-inner relative overflow-hidden">
                    <span className="relative z-10">{currentUser.charAt(0)}</span>
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-transparent opacity-50 group-hover:opacity-80 transition-opacity"></div>
                </div>
            </div>
          </div>
        </header>

        <div className="p-3 md:p-6 lg:p-8 flex-1 w-full max-w-[1800px] mx-auto overflow-hidden">
          {activeTab === 'intelligence' && (
            <IntelligenceTool 
              leads={scrapedResults}
              onUpdateLeads={setScrapedResults}
              onSaveToCRM={handleSaveToCRM} 
              savedIds={new Set(savedLeads.map(l => l.id))}
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
              activeFolder={activeFolder}
            />
          )}
          {activeTab === 'operations' && (
            <OperationsView logs={operationsLog} />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
