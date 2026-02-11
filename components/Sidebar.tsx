
import React from 'react';
import { Lead, User } from '../types';

interface SidebarProps {
  activeTab: 'intelligence' | 'crm' | 'operations';
  setActiveTab: (tab: 'intelligence' | 'crm' | 'operations') => void;
  activeFolder: string;
  setActiveFolder: (folder: string) => void;
  savedLeads: Lead[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  currentUser: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  activeFolder,
  setActiveFolder,
  savedLeads, 
  isOpen, 
  setIsOpen,
  currentUser,
  onLogout
}) => {
  
  const folders = [
    { id: 'all', label: 'TODOS', count: savedLeads.length },
    { id: 'frio', label: 'FRIO', count: savedLeads.filter(l => l.status === 'frio').length },
    { id: 'contacted', label: 'CONTACTADO', count: savedLeads.filter(l => l.status === 'contacted').length },
    { id: 'negotiation', label: 'EN PROCESO', count: savedLeads.filter(l => l.status === 'negotiation').length },
    { id: 'client', label: 'CLIENTES', count: savedLeads.filter(l => l.status === 'client').length },
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
            <p className="text-[7px] font-bold text-white/50 tracking-widest uppercase truncate mt-0.5">by Mati Rosas</p>
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
      
      <nav className="space-y-2 flex-1 overflow-y-auto custom-scroll pr-2">
        <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-4 px-2 italic">Control Panel</p>
        
        {/* Tab RASTREO */}
        <button
          onClick={() => setActiveTab('intelligence')}
          className={`w-full text-left px-4 py-4 rounded-xl transition-all duration-200 group relative border flex items-center justify-between mb-2 ${
            activeTab === 'intelligence' 
              ? 'bg-white text-black border-white' 
              : 'text-white/40 hover:text-white border-transparent hover:bg-white/5'
          }`}
        >
          <div className="flex flex-col min-w-0">
            <span className="font-black text-[11px] uppercase tracking-wider">RASTREO</span>
            <span className={`text-[7px] font-bold uppercase tracking-widest truncate ${activeTab === 'intelligence' ? 'text-black/50' : 'text-white/10'}`}>
              Buscador B2B
            </span>
          </div>
        </button>

        {/* Tab ARCHIVO con Folders */}
        <div className="space-y-1">
          <button
            onClick={() => setActiveTab('crm')}
            className={`w-full text-left px-4 py-4 rounded-xl transition-all duration-200 group relative border flex items-center justify-between ${
              activeTab === 'crm' 
                ? 'bg-white/10 text-white border-white/20' 
                : 'text-white/40 hover:text-white border-transparent hover:bg-white/5'
            }`}
          >
            <div className="flex flex-col min-w-0">
              <span className="font-black text-[11px] uppercase tracking-wider">ARCHIVO</span>
              <span className={`text-[7px] font-bold uppercase tracking-widest truncate ${activeTab === 'crm' ? 'text-white/40' : 'text-white/10'}`}>
                Base de Datos
              </span>
            </div>
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded shrink-0 ml-2 ${
                activeTab === 'crm' ? 'bg-white text-black' : 'bg-white/10 text-white/50'
              }`}>
                {savedLeads.length}
            </span>
          </button>

          {/* Folders */}
          {activeTab === 'crm' && (
            <div className="pl-4 space-y-1 mt-2 animate-in slide-in-from-left-2 duration-300">
              {folders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => { setActiveFolder(folder.id); if(window.innerWidth < 1024) setIsOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 rounded-lg transition-all flex items-center justify-between ${
                    activeFolder === folder.id
                      ? 'bg-white text-black shadow-lg shadow-white/10'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                     {folder.id === 'all' && <span className="opacity-50">📂</span>}
                     {folder.id === 'frio' && <span className="opacity-50">❄️</span>}
                     {folder.id === 'contacted' && <span className="opacity-50">📨</span>}
                     {folder.id === 'negotiation' && <span className="opacity-50">🤝</span>}
                     {folder.id === 'client' && <span className="opacity-50">⭐</span>}
                     {folder.label}
                  </span>
                  <span className={`text-[8px] font-bold px-1.5 rounded ${
                    activeFolder === folder.id ? 'bg-black/10 text-black' : 'bg-white/10 text-white/30'
                  }`}>
                    {folder.count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tab OPERATIONS */}
        <button
          onClick={() => setActiveTab('operations')}
          className={`w-full text-left px-4 py-4 rounded-xl transition-all duration-200 group relative border flex items-center justify-between mt-2 ${
            activeTab === 'operations' 
              ? 'bg-white text-black border-white' 
              : 'text-white/40 hover:text-white border-transparent hover:bg-white/5'
          }`}
        >
          <div className="flex flex-col min-w-0">
            <span className="font-black text-[11px] uppercase tracking-wider">OPERACIONES</span>
            <span className={`text-[7px] font-bold uppercase tracking-widest truncate ${activeTab === 'operations' ? 'text-black/50' : 'text-white/10'}`}>
              Audit Logs
            </span>
          </div>
        </button>

      </nav>

      <div className="mt-auto pt-6 border-t border-white/5">
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white/20 to-white/5 border border-white/10 flex items-center justify-center font-black text-white">
            {currentUser.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
             <p className="text-[10px] font-black text-white uppercase">{currentUser}</p>
             <button onClick={onLogout} className="text-[8px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wide">Cerrar Sesión</button>
          </div>
        </div>
        <div className="mt-4 text-center">
             <p className="text-[7px] font-black text-white/10 uppercase tracking-[0.3em]">Tailored for BZS</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
