
import React from 'react';

interface SidebarProps {
  activeTab: 'intelligence' | 'crm';
  setActiveTab: (tab: 'intelligence' | 'crm') => void;
  crmCount: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, crmCount, isOpen, setIsOpen }) => {
  const tabs = [
    { id: 'intelligence', label: 'RASTREO', desc: 'Buscador B2B' },
    { id: 'crm', label: 'ARCHIVO', desc: 'Base de Datos' },
  ];

  return (
    <aside className={`
      w-64 bg-black h-screen fixed top-0 border-r border-white/20 p-8 z-[60] flex flex-col transition-all duration-300
      ${isOpen ? 'left-0 shadow-[0_0_100px_rgba(255,255,255,0.1)]' : '-left-64 lg:left-0'}
    `}>
      <div className="mb-12 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-black rounded-sm"></div>
            </div>
            <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">POMPINO</h1>
          </div>
          <p className="text-[9px] font-bold text-white/30 tracking-[0.4em] uppercase">BZS GRUPO BEBIDAS</p>
        </div>
        
        <button 
          onClick={() => setIsOpen(false)}
          className="lg:hidden p-2 text-white/40 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      
      <nav className="space-y-2 flex-1">
        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-4 px-3 italic">Operations Room</p>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`w-full text-left px-4 py-5 rounded-xl transition-all duration-200 group relative border ${
              activeTab === tab.id 
                ? 'bg-white text-black border-white' 
                : 'text-white/40 hover:text-white border-transparent hover:bg-white/5'
            }`}
          >
            <div className="flex flex-col">
              <span className="font-black text-[12px] uppercase tracking-wider">{tab.label}</span>
              <span className={`text-[8px] font-bold uppercase tracking-widest ${activeTab === tab.id ? 'text-black/50' : 'text-white/10'}`}>
                {tab.desc}
              </span>
            </div>
            {tab.id === 'crm' && crmCount > 0 && (
              <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black px-2 py-0.5 rounded ${
                activeTab === tab.id ? 'bg-black text-white' : 'bg-white/10 text-white/50'
              }`}>
                {crmCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-8">
        <div className="p-5 border border-white/10 rounded-2xl bg-white/[0.02] text-center">
          <p className="text-[8px] font-black text-white/10 uppercase tracking-[0.4em] mb-2">Powered by</p>
          <p className="text-[10px] font-black text-white/60 uppercase tracking-widest italic">BZS GRUPO BEBIDAS</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Intel Core v7.5</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
