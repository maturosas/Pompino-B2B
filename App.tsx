
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
      setSavedLeads(prev => [{ ...lead, savedAt: Date.now(), isClient: false, status: 'discovered' }, ...prev]);
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
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[55] lg:hidden"
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
      
      <main className={`flex-1 flex flex-col min-h-screen relative z-10 transition-all duration-300 ${isSidebarOpen ? 'translate-x-64 blur-sm lg:translate-x-0 lg:blur-none' : 'translate-x-0'} lg:ml-64`}>
        <header className="px-4 lg:px-10 py-5 lg:py-7 flex justify-between items-center border-b border-white/10 bg-black sticky top-0 z-40 w-full overflow-hidden">
          <div className="flex items-center gap-4 lg:gap-8 flex-1 min-w-0">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-1 text-white hover:bg-white/10 rounded-lg transition-colors shrink-0"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex flex-col min-w-0">
              <div className="hidden md:flex items-center gap-4 mb-1">
                <span className="text-white/30 text-[9px] font-black uppercase tracking-[0.5em] whitespace-nowrap shrink-0">v7.5 High Speed</span>
                <div className="h-px w-8 bg-white/10"></div>
                <span className="text-white text-[9px] font-black uppercase tracking-[0.3em] whitespace-nowrap">
                  {activeTab === 'intelligence' ? 'Detección B2B' : 'Archivo de Inteligencia'}
                </span>
              </div>
              <h1 className="text-xl lg:text-3xl font-black text-white tracking-tighter uppercase italic leading-none truncate pr-2">
                POMPINO <span className="text-white/20">B2B</span>
              </h1>
            </div>
          </div>
          
          <div className="flex-shrink-0 ml-4 pl-4 lg:ml-8 lg:pl-8 border-l border-white/20">
            <p className="text-[10px] lg:text-[13px] font-black text-white uppercase tracking-[0.3em] italic whitespace-nowrap flex items-center gap-2">
              <span className="hidden sm:inline">BZS GRUPO</span> 
              <span className="text-white/40">BEBIDAS</span>
            </p>
          </div>
        </header>

        <div className="px-4 lg:px-10 py-6 lg:py-12 flex-1 w-full max-w-[1700px] mx-auto">
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

        <footer className="px-6 lg:px-10 py-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center bg-black gap-4 text-center">
          <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.5em] whitespace-nowrap">© 2025 • BZS GRUPO BEBIDAS • CORE INTEL</p>
          <div className="flex gap-8 text-[9px] font-black text-white/5 uppercase tracking-[0.3em] hidden sm:flex">
            <span className="whitespace-nowrap">Full 4K Optimized</span>
            <span className="whitespace-nowrap">API Native Protocol</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
