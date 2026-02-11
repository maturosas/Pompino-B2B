
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
      w-64 bg-black h-screen fixed top-0 border-r border-white/10 p-6 z-[60] flex flex-col transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="mb-10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0">
            <div className="w-4 h-4 bg-black rounded-sm"></div>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-black tracking-tighter text-white uppercase italic leading-none">POMPINO</h1>
            <p className="text-[8px] font-bold text-white/30 tracking-widest uppercase truncate">BZS BEBIDAS</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsOpen(false)}
          className="lg:hidden p-2 text-white/40 hover:text-white transition-colors"
          aria-label="Cerrar menú"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      
      <nav className="space-y-2 flex-1 overflow-y-auto">
        <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-4 px-2 italic">Control Panel</p>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`w-full text-left px-4 py-4 rounded-xl transition-all duration-200 group relative border flex items-center justify-between ${
              activeTab === tab.id 
                ? 'bg-white text-black border-white' 
                : 'text-white/40 hover:text-white border-transparent hover:bg-white/5'
            }`}
          >
            <div className="flex flex-col min-w-0">
              <span className="font-black text-[11px] uppercase tracking-wider">{tab.label}</span>
              <span className={`text-[7px] font-bold uppercase tracking-widest truncate ${activeTab === tab.id ? 'text-black/50' : 'text-white/10'}`}>
                {tab.desc}
              </span>
            </div>
            {tab.id === 'crm' && crmCount > 0 && (
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded shrink-0 ml-2 ${
                activeTab === tab.id ? 'bg-black text-white' : 'bg-white/10 text-white/50'
              }`}>
                {crmCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/5">
        <div className="p-4 rounded-xl bg-white/[0.02] text-center">
          <p className="text-[7px] font-black text-white/10 uppercase tracking-[0.3em] mb-1">Status</p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
            <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">Intel Core Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
