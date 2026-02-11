
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import IntelligenceTool from './components/IntelligenceTool';
import CRMView from './components/CRMView';
import { Lead } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'intelligence' | 'crm'>('intelligence');
  const [savedLeads, setSavedLeads] = useState<Lead[]>([]);
  const [scrapedResults, setScrapedResults] = useState<Lead[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const storedCRM = localStorage.getItem('pompino_b2b_crm_v7');
    const storedSearch = localStorage.getItem('pompino_b2b_search_v7');
    if (storedCRM) setSavedLeads(JSON.parse(storedCRM));
    if (storedSearch) setScrapedResults(JSON.parse(storedSearch));
  }, []);

  useEffect(() => {
    localStorage.setItem('pompino_b2b_crm_v7', JSON.stringify(savedLeads));
  }, [savedLeads]);

  useEffect(() => {
    localStorage.setItem('pompino_b2b_search_v7', JSON.stringify(scrapedResults));
  }, [scrapedResults]);

  const handleSaveToCRM = (lead: Lead) => {
    if (!savedLeads.find(l => l.id === lead.id)) {
      setSavedLeads(prev => [{ ...lead, savedAt: Date.now(), isClient: false, status: 'frio' }, ...prev]);
    }
  };

  const handleAddManualLead = (lead: Lead) => {
    setSavedLeads(prev => [lead, ...prev]);
  };

  const handleRemoveFromCRM = (id: string) => {
    if (window.confirm("¿CONFIRMAR ELIMINACIÓN DE REGISTRO?")) {
      setSavedLeads(prev => prev.filter(l => l.id !== id));
    }
  };

  const handleUpdateLead = (id: string, updates: Partial<Lead>) => {
    setSavedLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  return (
    <div className="min-h-screen flex bg-black text-white selection:bg-white selection:text-black overflow-x-hidden">
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
        crmCount={savedLeads.length}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      
      <main className={`flex-1 flex flex-col min-h-screen relative z-10 transition-all duration-300 lg:ml-64 ${isSidebarOpen ? 'translate-x-64 lg:translate-x-0' : 'translate-x-0'}`}>
        <header className="px-4 lg:px-10 py-4 lg:py-6 flex justify-between items-center border-b border-white/10 bg-black/90 backdrop-blur-md sticky top-0 z-40 w-full">
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
                  {activeTab === 'intelligence' ? 'DETECCIÓN B2B' : 'ARCHIVO INTEL'}
                </span>
              </div>
              <h1 className="text-lg lg:text-2xl font-black text-white tracking-tighter uppercase italic leading-none truncate">
                POMPINO <span className="text-white/30 text-sm normal-case font-bold ml-1">by Mati Rosas</span>
              </h1>
            </div>
          </div>
          
          <div className="flex-shrink-0 ml-4 pl-4 border-l border-white/20 hidden md:block">
            <p className="text-[9px] lg:text-[10px] font-black text-white uppercase tracking-[0.2em] italic whitespace-nowrap">
              Tailored for <span className="text-white/40">Bzs Grupo bebidas</span>
            </p>
          </div>
        </header>

        <div className="p-4 lg:p-8 flex-1 w-full max-w-[1600px] mx-auto">
          {activeTab === 'intelligence' && (
            <IntelligenceTool 
              leads={scrapedResults}
              onUpdateLeads={setScrapedResults}
              onSaveToCRM={handleSaveToCRM} 
              savedIds={new Set(savedLeads.map(l => l.id))} 
            />
          )}
          {activeTab === 'crm' && (
            <CRMView 
              leads={savedLeads} 
              onRemove={handleRemoveFromCRM} 
              onUpdateLead={handleUpdateLead}
              onAddManualLead={handleAddManualLead}
            />
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
