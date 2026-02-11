
import React from 'react';

interface SidebarProps {
  activeTab: 'intelligence' | 'crm';
  setActiveTab: (tab: 'intelligence' | 'crm') => void;
  crmCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, crmCount }) => {
  const tabs = [
    { id: 'intelligence', label: 'RASTREO', desc: 'Buscador B2B' },
    { id: 'crm', label: 'ARCHIVO', desc: 'Base de Datos' },
  ];

  return (
    <aside className="w-64 bg-black h-screen fixed left-0 top-0 border-r border-white/20 p-8 z-50 flex flex-col">
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-black rounded-sm"></div>
          </div>
          <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">POMPINO</h1>
        </div>
        <p className="text-[9px] font-bold text-white/30 tracking-[0.4em] uppercase">BZS GRUPO BEBIDAS</p>
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

      <div className="mt-auto">
        <div className="p-5 border border-white/10 rounded-2xl bg-white/[0.02] text-center">
          <p className="text-[8px] font-black text-white/10 uppercase tracking-[0.4em] mb-2">Powered by</p>
          <p className="text-[10px] font-black text-white/60 uppercase tracking-widest italic">BZS GRUPO BEBIDAS</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Intel Core v6.5</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
