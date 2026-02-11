
import React from 'react';

interface SidebarProps {
  activeTab: 'intelligence' | 'crm' | 'studio';
  setActiveTab: (tab: 'intelligence' | 'crm' | 'studio') => void;
  crmCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, crmCount }) => {
  const tabs = [
    { 
      id: 'intelligence', 
      label: 'Oportunidades', 
      desc: 'Búsqueda B2B',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      )
    },
    { 
      id: 'crm', 
      label: 'BASE DE DATOS', 
      desc: 'Gestión de Leads',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
      )
    },
    { 
      id: 'studio', 
      label: 'Creative Studio', 
      desc: 'Edición AI',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
      )
    },
  ];

  return (
    <div className="w-72 bg-black h-screen fixed left-0 top-0 border-r border-white/20 p-6 z-50 flex flex-col shadow-[20px_0_50px_rgba(0,0,0,0.8)]">
      <div className="mb-12 flex flex-col items-center gap-6 py-6 border-b border-white/10 relative">
        <div className="absolute -top-4 -left-4 w-12 h-12 bg-blue-600/10 blur-xl rounded-full"></div>
        <div className="relative group">
          <div className="absolute -inset-4 bg-blue-600/30 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
          <div className="relative w-24 h-24 flex items-center justify-center p-3 bg-[#111] border border-white/30 rounded-[2.5rem] shadow-2xl transition-transform group-hover:scale-105">
            <svg viewBox="0 0 100 100" className="w-full h-full text-white" fill="currentColor">
              <rect x="35" y="4" width="30" height="22" rx="2" />
              <rect x="28" y="24" width="44" height="4" rx="2" />
              <path d="M20 45 C 20 32, 35 28, 50 28 C 65 28, 80 32, 80 45 C 80 65, 65 88, 50 88 C 35 88, 20 65, 20 45" />
              <circle cx="38" cy="52" r="11" fill="black" stroke="white" strokeWidth="2" />
              <circle cx="62" cy="52" r="11" fill="black" stroke="white" strokeWidth="2" />
              <circle cx="38" cy="52" r="4" fill="white" />
              <circle cx="62" cy="52" r="4" fill="white" />
              <circle cx="38" cy="52" r="14" fill="none" stroke="white" strokeWidth="1.5" />
              <line x1="24" y1="52" x2="24" y2="88" stroke="white" strokeWidth="1" strokeDasharray="2 2" />
              <path d="M48 58 L 50 63 L 52 58 Z" fill="white" />
            </svg>
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic leading-none">POMPINO</h1>
          <h1 className="text-xl font-black tracking-tighter text-blue-500 uppercase italic mt-1 leading-none">B2B</h1>
        </div>
      </div>
      
      <nav className="space-y-4 flex-1 overflow-y-auto custom-scroll pr-1">
        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-4 px-4 italic">Business Intelligence</p>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`w-full text-left px-5 py-5 rounded-[1.8rem] transition-all duration-300 group relative ${
              activeTab === tab.id 
                ? 'bg-white/10 text-white border border-white/20 shadow-2xl scale-[1.02]' 
                : 'text-white/40 hover:bg-white/5 hover:text-white/80 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className={`p-2.5 rounded-2xl transition-all duration-300 ${
                activeTab === tab.id ? 'bg-blue-600/40 text-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'bg-white/5 text-white/20 group-hover:text-white/50'
              }`}>
                {tab.icon}
              </span>
              <div>
                <span className="font-black text-[12px] uppercase tracking-wider block">{tab.label}</span>
                <span className="text-[9px] font-bold text-white/20 group-hover:text-white/40 transition-colors uppercase tracking-widest leading-none">{tab.desc}</span>
              </div>
            </div>
            {tab.id === 'crm' && crmCount > 0 && (
              <span className="absolute right-5 top-1/2 -translate-y-1/2 bg-blue-600 text-[10px] text-white px-2.5 py-1 rounded-full font-black border border-blue-400/40 shadow-xl">
                {crmCount}
              </span>
            )}
            {activeTab === tab.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-blue-500 rounded-r-full shadow-[4px_0_15px_rgba(59,130,246,0.6)]"></div>
            )}
          </button>
        ))}
      </nav>

      <div className="mt-auto space-y-4">
        <div className="text-center">
            <p className="text-[9px] font-black text-white/10 uppercase tracking-[0.5em] mb-2">Powered by</p>
            <p className="text-[10px] font-black text-blue-500/50 uppercase tracking-[0.2em] italic">BZS GRUPO BEBIDAS</p>
        </div>
        <div className="p-5 glass-panel rounded-[2rem] border border-white/10 shadow-2xl bg-white/[0.01]">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-black text-xs text-white shadow-xl">PM</div>
            <div className="overflow-hidden">
              <p className="text-[11px] font-black text-white truncate leading-none mb-1">hola@bzsgrupo...</p>
              <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Enterprise v6.1</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] font-black">
            <span className="text-white/20 uppercase tracking-widest">Network</span>
            <div className="flex items-center gap-2 text-green-400 uppercase tracking-widest">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(34,197,94,0.8)]"></div>
              Secured
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
