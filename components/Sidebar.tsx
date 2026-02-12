
import React from 'react';
import { Lead, User } from '../types';
import { PompinoLogo } from './PompinoLogo';
import { PROJECT_CONFIG, getUserNames, isUserAdmin } from '../projectConfig';

interface SidebarProps {
  activeTab: 'intelligence' | 'crm' | 'operations' | 'chat' | 'agenda' | 'stats';
  setActiveTab: (tab: 'intelligence' | 'crm' | 'operations' | 'chat' | 'agenda' | 'stats') => void;
  activeFolder: string;
  setActiveFolder: (folder: string) => void;
  viewScope: User | 'me';
  setViewScope: (scope: User | 'me') => void;
  savedLeads: Lead[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  currentUser: User;
  onLogout: () => void;
  unreadMessages: number; 
  pendingTasksCount: number; 
  onOpenTaskCreator: () => void; 
  onOpenHelp: () => void;
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
  onOpenHelp
}) => {
  
  const isAdmin = isUserAdmin(currentUser);

  // Filter leads based on view scope
  const scopedLeads = savedLeads.filter(l => {
      if (viewScope === 'me') return l.owner === currentUser;
      return l.owner === viewScope;
  });

  const folders = [
    { id: 'all', label: 'Todos', icon: '📂', count: scopedLeads.length },
    { id: 'frio', label: 'Prospectos Fríos', icon: '❄️', count: scopedLeads.filter(l => l.status === 'frio').length },
    { id: 'contacted', label: 'Contactados', icon: '📨', count: scopedLeads.filter(l => l.status === 'contacted').length },
    { id: 'negotiation', label: 'En Negociación', icon: '🤝', count: scopedLeads.filter(l => l.status === 'negotiation').length },
    { id: 'client', label: 'Clientes Activos', icon: '⭐', count: scopedLeads.filter(l => l.status === 'client').length },
  ];

  const teamMembers: User[] = getUserNames();

  return (
    <aside className={`
      w-72 h-screen fixed top-0 border-r border-white/5 p-4 z-[60] flex flex-col transition-transform duration-300 ease-in-out bg-[#050505]/95 backdrop-blur-xl lg:bg-[#050505]/80
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="mb-8 px-2 pt-2 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {/* Sidebar Logo */}
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5 shadow-lg shadow-black/50">
             <PompinoLogo className="w-6 h-6 text-white" />
          </div>
          
          <div className="min-w-0">
            <h1 className="text-base font-black tracking-tight text-white uppercase italic leading-none">{PROJECT_CONFIG.appName}</h1>
            <p className="text-[9px] font-bold text-indigo-400 tracking-widest uppercase mt-0.5">{PROJECT_CONFIG.appSubtitle}</p>
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
        
        {/* 1. BUSCAR OPORTUNIDADES (Antes Intelligence) */}
        <button
          onClick={() => setActiveTab('intelligence')}
          className={`w-full text-left px-4 py-3.5 rounded-xl transition-all duration-200 group relative flex items-center gap-3 mb-1 ${
            activeTab === 'intelligence' 
              ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-white shadow-lg shadow-indigo-900/20 ring-1 ring-inset ring-white/10' 
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          {activeTab === 'intelligence' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full shadow-[0_0_10px_#6366f1]"></div>}
          <span className="text-lg opacity-80">🔭</span>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-xs uppercase tracking-wide">Buscar Oportunidades</span>
            <span className="text-[9px] font-medium opacity-50">Motor de Búsqueda IA</span>
          </div>
        </button>

        {/* 2. GESTIONAR OPORTUNIDADES (CRM) */}
        <div className="pt-1">
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
                    <span className="font-bold text-xs uppercase tracking-wide">Gestionar Oportunidades</span>
                    <span className="text-[9px] font-medium opacity-50">Base de Datos</span>
                </div>
            </div>
            {activeTab === 'crm' && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300">
                    {scopedLeads.length}
                </span>
            )}
          </button>

          {/* Sub-Folders CRM */}
          {activeTab === 'crm' && (
            <div className="ml-4 pl-4 border-l border-white/5 space-y-4 mt-2 mb-4 animate-in">
              
               {/* Quick Task Button */}
               <div className="pr-2">
                   <button 
                    onClick={onOpenTaskCreator}
                    className="w-full py-2 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 border border-white/10 rounded-lg flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wide transition-all mb-2"
                   >
                       <span>📢</span> Asignar Tarea
                   </button>
               </div>

              {/* User Selector (Team Folders) */}
              <div className="pr-2">
                  <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-2 px-1">Equipo Comercial</p>
                  
                  {/* ADMIN VIEW: SEE ALL POOL */}
                  {isAdmin && (
                      <button 
                        onClick={() => setViewScope('me')} 
                        className={`w-full text-left px-3 py-2 mb-1 rounded-lg text-[10px] uppercase font-bold transition-all flex items-center justify-between gap-2 ${
                            viewScope === 'me' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-white/40 hover:text-white'
                        }`}
                      >
                          <span className="flex items-center gap-2">⭐ Pool General</span>
                      </button>
                  )}

                  <div className="flex flex-col gap-1">
                      {teamMembers.filter(m => m !== currentUser).map(member => (
                          <button 
                            key={member}
                            onClick={() => setViewScope(member)}
                            className={`text-left px-3 py-2 rounded-lg text-[10px] uppercase font-bold transition-all flex items-center gap-2 ${
                                viewScope === member ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'
                            }`}
                          >
                              <span className="w-2 h-2 rounded-full bg-white/20"></span>
                              {member}
                          </button>
                      ))}
                  </div>
              </div>

              {/* Status Filters */}
              <div className="space-y-0.5">
                  <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-2 px-1">Estados</p>
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
            </div>
          )}
        </div>

        {/* 3. INTRANET (Chat) */}
        <button
          onClick={() => setActiveTab('chat')}
          className={`w-full text-left px-4 py-3.5 rounded-xl transition-all duration-200 group relative flex items-center justify-between gap-3 mt-1 ${
            activeTab === 'chat' 
               ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-white shadow-lg shadow-blue-900/20 ring-1 ring-inset ring-white/10' 
               : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          {activeTab === 'chat' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full shadow-[0_0_10px_#3b82f6]"></div>}
          <div className="flex items-center gap-3">
              <span className="text-lg opacity-80">💬</span>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-xs uppercase tracking-wide">Intranet</span>
                <span className="text-[9px] font-medium opacity-50">Sala de Situación</span>
              </div>
          </div>
          {unreadMessages > 0 && activeTab !== 'chat' && (
              <span className="flex items-center justify-center w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white shadow-[0_0_8px_#ef4444] animate-bounce">
                  {unreadMessages}
              </span>
          )}
        </button>

        {/* 4. STATS (ADMIN ONLY) */}
        {isAdmin && (
            <button
            onClick={() => setActiveTab('stats')}
            className={`w-full text-left px-4 py-3.5 rounded-xl transition-all duration-200 group relative flex items-center gap-3 mt-1 ${
                activeTab === 'stats' 
                ? 'bg-gradient-to-r from-yellow-500/10 to-amber-500/10 text-white shadow-lg shadow-yellow-900/20 ring-1 ring-inset ring-white/10' 
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
            >
            {activeTab === 'stats' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-yellow-500 rounded-r-full shadow-[0_0_10px_#eab308]"></div>}
            <span className="text-lg opacity-80">📊</span>
            <div className="flex flex-col min-w-0">
                <span className="font-bold text-xs uppercase tracking-wide">Stats & KPIs</span>
                <span className="text-[9px] font-medium opacity-50 text-indigo-400">Admin Only</span>
            </div>
            </button>
        )}

        {/* 6. AGENDA */}
        <button
          onClick={() => setActiveTab('agenda')}
          className={`w-full text-left px-4 py-3.5 rounded-xl transition-all duration-200 group relative flex items-center justify-between gap-3 mt-1 ${
            activeTab === 'agenda' 
               ? 'bg-gradient-to-r from-pink-500/10 to-rose-500/10 text-white shadow-lg shadow-pink-900/20 ring-1 ring-inset ring-white/10' 
               : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          {activeTab === 'agenda' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-pink-500 rounded-r-full shadow-[0_0_10px_#ec4899]"></div>}
          <div className="flex items-center gap-3">
              <span className="text-lg opacity-80">📅</span>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-xs uppercase tracking-wide">Agenda</span>
                <span className="text-[9px] font-medium opacity-50">Tareas & Alertas</span>
              </div>
          </div>
          {pendingTasksCount > 0 && (
              <span className="flex items-center justify-center w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white shadow-[0_0_8px_#ef4444] animate-pulse">
                  {pendingTasksCount}
              </span>
          )}
        </button>

        {/* 7. OPERACIONES (ADMIN ONLY) */}
        {isAdmin && (
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
                <span className="text-[9px] font-medium opacity-50 text-indigo-400">Admin Only</span>
            </div>
            </button>
        )}

      </nav>

      {/* Cloud Status */}
      <div className="px-4 pb-2">
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg">
              <span className="text-lg animate-pulse">☁️</span>
              <div>
                  <p className="text-[9px] font-bold text-emerald-500 uppercase">Live Sync Activo</p>
                  <p className="text-[9px] text-white/50 leading-tight">Data compartida con el equipo.</p>
              </div>
          </div>
      </div>

      <div className="mt-auto pt-4 border-t border-white/5 px-2">
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center font-black text-xs text-white">
            {currentUser.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2">
                 <p className="text-[10px] font-black text-white uppercase tracking-wide">{currentUser}</p>
                 {isAdmin && <span className="bg-white/20 text-[8px] font-bold px-1 rounded uppercase">ADMIN</span>}
             </div>
             <button onClick={onLogout} className="text-[9px] text-red-400 hover:text-red-300 transition-colors font-medium">Cerrar Sesión</button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
