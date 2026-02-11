
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import IntelligenceTool from './components/IntelligenceTool';
import CRMView from './components/CRMView';
import OperationsView from './components/OperationsView';
import { Lead, User, OperationLog } from './types';

const App: React.FC = () => {
  // Identity State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // App State
  const [activeTab, setActiveTab] = useState<'intelligence' | 'crm' | 'operations'>('intelligence');
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
            // Check for specific interesting updates to log
            if (updates.status && updates.status !== l.status) {
                logAction('STATUS_CHANGE', `Cambió estado de ${l.name}: ${l.status.toUpperCase()} -> ${updates.status.toUpperCase()}`);
            } else if (updates.notes && updates.notes !== l.notes) {
                 // Debounce logging for notes ideally, but for now simple log
                 // To avoid spam, we might only log significant changes, but let's log "Actualizó notas"
            }
            return { ...l, ...updates };
        }
        return l;
    }));
  };
  
  // Wrapper for generic update logging from detail panel
  const handleDetailedUpdate = (id: string, updates: Partial<Lead>, context: string) => {
      handleUpdateLead(id, updates);
      // We log generic updates here if not covered above
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
      <div className="min-h-screen bg-black flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl text-center space-y-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50"></div>
          
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter text-white uppercase">POMPINO</h1>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.4em]">By Mati Rosas</p>
          </div>

          <div className="space-y-4">
             <p className="text-white/60 text-xs font-mono mb-6">IDENTIFICACIÓN REQUERIDA</p>
             <div className="grid gap-3">
               {(['Mati', 'Diego', 'Gaston'] as User[]).map((user) => (
                 <button
                   key={user}
                   onClick={() => handleLogin(user)}
                   className="h-14 border border-white/10 rounded-xl hover:bg-white hover:text-black hover:border-white transition-all duration-300 group relative overflow-hidden"
                 >
                   <span className="relative z-10 text-sm font-black uppercase tracking-widest">{user}</span>
                   <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                 </button>
               ))}
             </div>
          </div>
          
          <div className="pt-8 border-t border-white/5">
             <p className="text-[8px] text-white/20 uppercase tracking-widest">BZS Grupo Bebidas • Internal Use Only</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-black text-white selection:bg-white selection:text-black overflow-x-hidden font-sans">
      {/* Overlay para móvil */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[55] lg:hidden transition-opacity duration-300"
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
      
      <main className={`flex-1 flex flex-col min-h-screen relative z-10 transition-all duration-300 lg:ml-64 ${isSidebarOpen ? 'translate-x-64 lg:translate-x-0' : 'translate-x-0'}`}>
        <header className="px-4 md:px-6 lg:px-10 py-4 lg:py-6 flex justify-between items-center border-b border-white/10 bg-black/90 backdrop-blur-md sticky top-0 z-40 w-full">
          <div className="flex items-center gap-3 lg:gap-8 flex-1 min-w-0">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-white hover:bg-white/10 rounded-lg transition-colors shrink-0"
              aria-label="Abrir menú"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex flex-col min-w-0">
              <div className="hidden sm:flex items-center gap-2 mb-1">
                <span className="text-white/30 text-[8px] font-black uppercase tracking-[0.3em] whitespace-nowrap">v8.0 Protocol</span>
                <div className="h-px w-4 bg-white/10"></div>
                <span className="text-white/60 text-[8px] font-black uppercase tracking-[0.2em] truncate">
                  {activeTab === 'intelligence' ? 'DETECCIÓN B2B' : activeTab === 'crm' ? 'ARCHIVO INTEL' : 'AUDITORÍA'}
                </span>
              </div>
              <h1 className="text-lg md:text-xl lg:text-2xl font-black text-white tracking-tighter uppercase italic leading-none truncate">
                POMPINO <span className="text-white/30 text-xs md:text-sm normal-case font-bold ml-1">by Mati Rosas</span>
              </h1>
            </div>
          </div>
          
          <div className="flex-shrink-0 ml-4 pl-4 border-l border-white/20 hidden md:block">
            <div className="flex items-center gap-2">
                <div className="text-right">
                    <p className="text-[9px] font-black text-white uppercase tracking-[0.2em]">{currentUser}</p>
                    <p className="text-[7px] font-bold text-white/40 uppercase tracking-widest">Online</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-black text-xs border border-white/10">
                    {currentUser.charAt(0)}
                </div>
            </div>
          </div>
        </header>

        <div className="p-3 md:p-6 lg:p-8 flex-1 w-full max-w-[1600px] mx-auto overflow-hidden">
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

        <footer className="px-6 lg:px-10 py-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center bg-black gap-4 text-center">
          <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">© 2025 • POMPINO by Mati Rosas • BZS GRUPO BEBIDAS</p>
          <div className="hidden sm:flex gap-6 text-[8px] font-black text-white/10 uppercase tracking-[0.2em]">
            <span>Tailored Experience</span>
            <span>v8.0 Optimized</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
