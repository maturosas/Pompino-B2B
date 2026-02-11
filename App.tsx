
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
      {/* Overlay para móvil cuando el sidebar está abierto */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[55] lg:hidden"
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
      
      <main className={`flex-1 flex flex-col min-h-screen relative z-10 transition-all duration-300 ${isSidebarOpen ? 'blur-sm lg:blur-none' : ''} lg:ml-64`}>
        <header className="px-4 lg:px-8 py-4 flex justify-between items-center lg:items-end border-b border-white/10 bg-black sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div>
              <div className="hidden sm:flex items-center gap-4 mb-1">
                <span className="text-white/20 text-[8px] font-black uppercase tracking-[0.5em]">Protocolo B2B v7.5</span>
                <div className="h-px w-8 bg-white/10"></div>
                <span className="text-white text-[8px] font-black uppercase tracking-[0.3em]">
                  {activeTab === 'intelligence' ? 'Detección Global' : 'Gestión de Activos'}
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tighter uppercase italic leading-none">
                POMPINO <span className="text-white/20">B2B</span>
              </h1>
            </div>
          </div>
          
          <div className="text-right pb-1">
            <p className="text-[9px] lg:text-[10px] font-black text-white uppercase tracking-widest italic">BZS GRUPO BEBIDAS</p>
          </div>
        </header>

        <div className="px-4 lg:px-8 py-6 flex-1 w-full max-w-[1600px] mx-auto overflow-x-hidden">
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

        <footer className="px-4 lg:px-8 py-4 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center bg-black gap-4 text-center sm:text-left">
          <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">© 2025 • BZS GRUPO BEBIDAS</p>
          <div className="flex gap-4 sm:gap-8 text-[8px] font-black text-white/5 uppercase tracking-widest">
            <span>Ultra Density Display</span>
            <span>Intel Core v7.5</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
