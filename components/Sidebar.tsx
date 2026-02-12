
import React, { useRef } from 'react';
import { Lead, User } from '../types';
import { PompinoLogo } from './PompinoLogo';
import { getUserNames, isUserAdmin } from '../projectConfig';

interface SidebarProps {
  activeTab: 'home' | 'intelligence' | 'crm' | 'operations' | 'chat' | 'agenda' | 'stats';
  setActiveTab: (tab: 'home' | 'intelligence' | 'crm' | 'operations' | 'chat' | 'agenda' | 'stats') => void;
  activeFolder: string;
  setActiveFolder: (folder: string) => void;
  viewScope: User | 'me' | 'all';
  setViewScope: (scope: User | 'me' | 'all') => void;
  savedLeads: Lead[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  currentUser: User;
  onLogout: () => void;
  unreadMessages: number; 
  pendingTasksCount: number; 
  onOpenTaskCreator: () => void; 
  onOpenHelp: () => void;
  onOpenReport: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  activeFolder,
  setActiveFolder,
  viewScope,
  setViewScope,
  savedLeads, 
  isOpen, 
  setIsOpen,
  currentUser,
  onLogout,
  unreadMessages,
  pendingTasksCount,
  onOpenTaskCreator,
  onOpenHelp,
  onOpenReport
}) => {
  
  const isAdmin = isUserAdmin(currentUser);
  
  // Touch Handling
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
      if (touchStartX.current === null) return;
      const touchEndX = e.changedTouches[0].clientX;
      if (touchStartX.current - touchEndX > 75) setIsOpen(false);
      touchStartX.current = null;
  };

  const scopedLeads = savedLeads.filter(l => {
      if (viewScope === 'all') return true;
      if (viewScope === 'me') return l.owner === currentUser;
      return l.owner === viewScope;
  });

  const folders = [
    { id: 'all', label: 'Todos', count: scopedLeads.length },
    { id: 'frio', label: 'Prospectos (Frío)', count: scopedLeads.filter(l => l.status === 'frio').length },
    { id: 'contacted', label: 'Contactados', count: scopedLeads.filter(l => l.status === 'contacted').length },
    { id: 'negotiation', label: 'Negociación', count: scopedLeads.filter(l => l.status === 'negotiation').length },
    { id: 'client', label: 'Clientes Activos', count: scopedLeads.filter(l => l.status === 'client').length },
  ];

  const teamMembers = getUserNames();

  const NavItem = ({ id, label, icon, notification }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-300 group relative flex items-center justify-between gap-3 mb-1 ${
        activeTab === id 
          ? 'bg-white text-black font-bold shadow-lg shadow-white/5' 
          : 'text-white/60 hover:text-white hover:bg-white/5'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={`text-lg transition-colors ${activeTab === id ? 'text-black' : 'text-white/40 group-hover:text-white'}`}>{icon}</span>
        <span className="text-xs tracking-wide uppercase">{label}</span>
      </div>
      {notification > 0 && activeTab !== id && (
          <span className="flex items-center justify-center w-5 h-5 bg-red-600 rounded-full text-[9px] font-bold text-white">
              {notification}
          </span>
      )}
    </button>
  );

  return (
    <aside 
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`
      w-72 h-screen fixed top-0 border-r border-white/5 p-4 z-[60] flex flex-col transition-transform duration-300 ease-in-out bg-black/95 backdrop-blur-xl lg:bg-[#050505]
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="mb-8 pt-4 px-2 flex justify-between items-center">
        <div className="w-full flex justify-center">
             <PompinoLogo className="w-48 h-48 text-white opacity-100" />
        </div>
        <button onClick={() => setIsOpen(false)} className="lg:hidden absolute top-4 right-4 p-2 text-white/40 hover:text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      
      <nav className="flex-1 overflow-y-auto custom-scroll px-2 space-y-1">
        <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-3 px-2 mt-2">Principal</p>
        
        <NavItem id="home" label="Inicio" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>} />
        
        <NavItem id="intelligence" label="Buscar Oportunidades" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>} />
        
        {/* CRM SECTION */}
        <div className="pt-1">
           <NavItem id="crm" label="Gestionar Oportunidades" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>} />

          {activeTab === 'crm' && (
            <div className="ml-4 pl-4 border-l border-white/10 space-y-4 mt-2 mb-4 animate-in">
               <button onClick={onOpenTaskCreator} className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[10px] font-bold uppercase tracking-wide transition-all text-white/70 hover:text-white mb-2">
                   + Asignar Tarea
               </button>

              <div className="pr-2">
                  <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mb-2 px-1">Equipo</p>
                  
                  {isAdmin && (
                      <button onClick={() => setViewScope('all')} className={`w-full text-left px-2 py-1.5 mb-1 rounded text-[10px] uppercase font-bold transition-all flex items-center justify-between gap-2 ${viewScope === 'all' ? 'text-white' : 'text-white/40 hover:text-white'}`}>
                          <span>⭐ Pool General</span>
                      </button>
                  )}

                  <div className="flex flex-col gap-0.5">
                      <button onClick={() => setViewScope('me')} className={`text-left px-2 py-1.5 rounded text-[10px] uppercase font-bold transition-all flex items-center gap-2 ${viewScope === 'me' ? 'text-white bg-white/5' : 'text-white/40 hover:text-white'}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span> Mis Leads
                      </button>
                      {teamMembers.filter(m => m !== currentUser).map(member => (
                          <button key={member} onClick={() => setViewScope(member)} className={`text-left px-2 py-1.5 rounded text-[10px] uppercase font-bold transition-all flex items-center gap-2 ${viewScope === member ? 'text-white bg-white/5' : 'text-white/40 hover:text-white'}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span> {member}
                          </button>
                      ))}
                  </div>
              </div>

              <div className="space-y-0.5">
                  <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mb-2 px-1">Filtros</p>
                  {folders.map(folder => (
                    <button key={folder.id} onClick={() => { setActiveFolder(folder.id); if(window.innerWidth < 1024) setIsOpen(false); }} className={`w-full text-left px-2 py-1.5 rounded transition-all flex items-center justify-between text-[10px] font-bold uppercase ${activeFolder === folder.id ? 'text-white bg-white/5' : 'text-white/40 hover:text-white'}`}>
                      <span>{folder.label}</span>
                      {folder.count > 0 && <span className="opacity-50">{folder.count}</span>}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        <NavItem id="chat" label="Chat Interno" notification={unreadMessages} icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>} />
        
        {isAdmin && <NavItem id="stats" label="Estadísticas" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>} />}
        
        <NavItem id="agenda" label="Agenda" notification={pendingTasksCount} icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
        
        {isAdmin && <NavItem id="operations" label="Operaciones" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>} />}

      </nav>

      <div className="px-4 pb-4 space-y-3">
          <button onClick={onOpenReport} className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all text-[9px] font-bold uppercase">
             <span>🐞 Reportar</span>
          </button>
          <div className="flex items-center justify-center gap-2 opacity-30">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[9px] uppercase tracking-widest">Online</span>
          </div>
      </div>

      <div className="mt-auto pt-4 border-t border-white/10 px-2">
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-white text-black flex items-center justify-center font-black text-xs uppercase">
            {currentUser.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2">
                 <p className="text-[10px] font-black text-white uppercase tracking-wide">{currentUser}</p>
                 {isAdmin && <span className="text-[8px] text-white/40 font-bold px-1 uppercase">ADMIN</span>}
             </div>
             <button onClick={onLogout} className="text-[9px] text-white/40 hover:text-white transition-colors font-medium uppercase">Cerrar</button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
