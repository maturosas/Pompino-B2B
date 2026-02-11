
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import IntelligenceTool from './components/IntelligenceTool';
import CRMView from './components/CRMView';
import CreativeStudio from './components/CreativeStudio';
import { Lead } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'intelligence' | 'crm' | 'studio'>('intelligence');
  const [savedLeads, setSavedLeads] = useState<Lead[]>([]);
  const [scrapedResults, setScrapedResults] = useState<Lead[]>([]);

  // Load both collections on mount
  useEffect(() => {
    const storedCRM = localStorage.getItem('pompino_b2b_crm_v5');
    const storedSearch = localStorage.getItem('pompino_b2b_search_v5');
    
    if (storedCRM) {
      try {
        setSavedLeads(JSON.parse(storedCRM));
      } catch (e) {
        console.error("Failed to load CRM data", e);
      }
    }
    
    if (storedSearch) {
      try {
        setScrapedResults(JSON.parse(storedSearch));
      } catch (e) {
        console.error("Failed to load search data", e);
      }
    }
  }, []);

  // Save CRM leads on change
  useEffect(() => {
    localStorage.setItem('pompino_b2b_crm_v5', JSON.stringify(savedLeads));
  }, [savedLeads]);

  // Save Search results on change
  useEffect(() => {
    localStorage.setItem('pompino_b2b_search_v5', JSON.stringify(scrapedResults));
  }, [scrapedResults]);

  const handleSaveToCRM = (lead: Lead) => {
    if (!savedLeads.find(l => l.id === lead.id)) {
      setSavedLeads(prev => [{ 
        ...lead, 
        savedAt: Date.now(), 
        isClient: false, 
        contactName: lead.contactName || '',
        notes: lead.notes || '',
        status: 'discovered'
      }, ...prev]);
    }
  };

  const handleRemoveFromCRM = (id: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este lead de tu BASE DE DATOS?")) {
      setSavedLeads(prev => prev.filter(l => l.id !== id));
    }
  };

  const handleUpdateLead = (id: string, updates: Partial<Lead>) => {
    setSavedLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const handleSetScrapedResults = (results: Lead[]) => {
    setScrapedResults(results);
  };

  const savedIds = new Set(savedLeads.map(l => l.id));

  return (
    <div className="min-h-screen flex bg-black text-white selection:bg-blue-600/40">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        crmCount={savedLeads.length} 
      />
      
      <main className="ml-72 flex-1 min-h-screen flex flex-col relative overflow-hidden">
        {/* Glow Particles */}
        <div className="absolute top-[-15%] right-[-10%] w-[1300px] h-[1100px] bg-blue-600/10 blur-[220px] -z-10 glow-effect rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[900px] h-[900px] bg-indigo-900/15 blur-[200px] -z-10 rounded-full pointer-events-none"></div>

        <header className="px-12 py-8 flex justify-between items-center sticky top-0 bg-black/70 backdrop-blur-3xl z-40 border-b border-white/10">
          <div className="flex items-center gap-10">
            <div className="w-1.5 h-12 bg-gradient-to-b from-blue-600 via-blue-400 to-transparent rounded-full hidden sm:block shadow-[0_0_20px_rgba(59,130,246,0.3)]"></div>
            <div>
              <div className="flex items-center gap-4 mb-1">
                <span className="text-blue-400 text-[9px] font-black uppercase tracking-[0.6em] drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">ADMIN POMPINO B2B</span>
                <span className="text-white/20 text-[9px] font-bold">/</span>
                <span className="text-white/40 text-[9px] font-black uppercase tracking-[0.4em]">
                  {activeTab === 'intelligence' ? 'EXPLORADOR' : activeTab === 'crm' ? 'ARCHIVO' : 'STUDIO'}
                </span>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic drop-shadow-2xl">
                POMPINO B2B
              </h1>
            </div>
          </div>
          
          <div className="hidden lg:flex flex-col items-end gap-0.5">
            <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Partner Intelligence</div>
            <div className="text-[11px] font-black text-blue-500 uppercase tracking-widest drop-shadow-md">BZS GRUPO BEBIDAS</div>
          </div>
        </header>

        <div className="px-12 py-8 flex-1 max-w-[2000px] mx-auto w-full">
          {activeTab === 'intelligence' && (
            <IntelligenceTool 
              leads={scrapedResults}
              onUpdateLeads={handleSetScrapedResults}
              onSaveToCRM={handleSaveToCRM} 
              savedIds={savedIds} 
            />
          )}
          {activeTab === 'crm' && (
            <CRMView 
              leads={savedLeads} 
              onRemove={handleRemoveFromCRM} 
              onUpdateLead={handleUpdateLead} 
            />
          )}
          {activeTab === 'studio' && <CreativeStudio />}
        </div>

        <footer className="px-12 py-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-white/20 text-[9px] font-black uppercase tracking-[0.5em] gap-8 bg-[#030303]">
          <p>© 2024 POMPINO B2B • POWERED BY BZS GRUPO BEBIDAS</p>
          <div className="flex flex-wrap justify-center gap-10 items-center">
            <span className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-blue-600/30 rounded-full"></div>
              Engine v6.1 Stable
            </span>
            <span className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-blue-600/30 rounded-full"></div>
              LocalStorage Persistent
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
