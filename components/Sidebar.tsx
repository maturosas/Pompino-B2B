
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
    { id: 'all', label: 'Todos', icon: '📂', count: savedLeads.length },
    { id: 'frio', label: 'Prospectos Fríos', icon: '❄️', count: savedLeads.filter(l => l.status === 'frio').length },
    { id: 'contacted', label: 'Contactados', icon: '📨', count: savedLeads.filter(l => l.status === 'contacted').length },
    { id: 'negotiation', label: 'En Negociación', icon: '🤝', count: savedLeads.filter(l => l.status === 'negotiation').length },
    { id: 'client', label: 'Clientes Activos', icon: '⭐', count: savedLeads.filter(l => l.status === 'client').length },
  ];

  return (
    <aside className={`
      w-72 h-screen fixed top-0 border-r border-white/5 p-4 z-[60] flex flex-col transition-transform duration-300 ease-in-out bg-[#050505]/95 backdrop-blur-xl lg:bg-[#050505]/80
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="mb-8 px-2 pt-2 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {/* Sidebar Logo */}
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5 shadow-lg shadow-black/50">
             <img src="logo.png" alt="Pompino" className="w-7 h-7 object-contain" />
          </div>
          
          <div className="min-w-0">
            <h1 className="text-base font-black tracking-tight text-white uppercase italic leading-none">POMPINO</h1>
            <p className="text-[9px] font-bold text-indigo-400 tracking-widest uppercase mt-0.5">By Mati Rosas</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsOpen(false)}
          className="lg:hidden p-2 text-white/40 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      
      <nav className="space-y-1.5 flex-1 overflow-y-auto custom-scroll px-2">
        <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-3 px-2 mt-2">Plataforma</p>
        
        <button
          onClick={() => setActiveTab('intelligence')}
          className={`w-full text-left px-4 py-3.5 rounded-xl transition-all duration-200 group relative flex items-center gap-3 ${
            activeTab === 'intelligence' 
              ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-white shadow-lg shadow-indigo-900/20 ring-1 ring-inset ring-white/10' 
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          {activeTab === 'intelligence' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full shadow-[0_0_10px_#6366f1]"></div>}
          <span className="text-lg opacity-80">🔭</span>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-xs uppercase tracking-wide">Rastreo de Datos</span>
            <span className="text-[9px] font-medium opacity-50">Buscador IA</span>
          </div>
        </button>

        <div className="pt-2">
           <button
            onClick={() => setActiveTab('crm')}
            className={`w-full text-left px-4 py-3.5 rounded-xl transition-all duration-200 group relative flex items-center justify-between gap-3 ${
              activeTab === 'crm' 
                 ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-white shadow-lg shadow-emerald-900/20 ring-1 ring-inset ring-white/10' 
                 : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            {activeTab === 'crm' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-r-full shadow-[0_0_10px_#10b981]"></div>}
            <div className="flex items-center gap-3">
                <span className="text-lg opacity-80">🗃️</span>
                <div className="flex flex-col min-w-0">
                    <span className="font-bold text-xs uppercase tracking-wide">Archivo CRM</span>
                    <span className="text-[9px] font-medium opacity-50">Base de Datos</span>
                </div>
            </div>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                activeTab === 'crm' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/30'
            }`}>
                {savedLeads.length}
            </span>
          </button>

          {/* Sub-Folders CRM */}
          {activeTab === 'crm' && (
            <div className="ml-4 pl-4 border-l border-white/5 space-y-0.5 mt-2 mb-4 animate-in">
              {folders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => { setActiveFolder(folder.id); if(window.innerWidth < 1024) setIsOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between text-[11px] ${
                    activeFolder === folder.id
                      ? 'bg-white/10 text-white font-bold'
                      : 'text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="flex items-center gap-2">
                     <span className="opacity-70">{folder.icon}</span>
                     {folder.label}
                  </span>
                  {folder.count > 0 && (
                      <span className="text-[9px] opacity-50">{folder.count}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setActiveTab('operations')}
          className={`w-full text-left px-4 py-3.5 rounded-xl transition-all duration-200 group relative flex items-center gap-3 mt-1 ${
            activeTab === 'operations' 
               ? 'bg-gradient-to-r from-orange-500/10 to-red-500/10 text-white shadow-lg shadow-orange-900/20 ring-1 ring-inset ring-white/10' 
               : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          {activeTab === 'operations' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-orange-500 rounded-r-full shadow-[0_0_10px_#f97316]"></div>}
          <span className="text-lg opacity-80">⚡</span>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-xs uppercase tracking-wide">Operaciones</span>
            <span className="text-[9px] font-medium opacity-50">Logs de Actividad</span>
          </div>
        </button>

      </nav>

      <div className="mt-auto pt-6 border-t border-white/5 px-2">
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center font-black text-xs text-white">
            {currentUser.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
             <p className="text-[10px] font-black text-white uppercase tracking-wide">{currentUser}</p>
             <button onClick={onLogout} className="text-[9px] text-red-400 hover:text-red-300 transition-colors font-medium">Cerrar Sesión</button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
