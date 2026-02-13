
import React, { useMemo, useState } from 'react';
import { isUserAdmin, getUserNames } from '../projectConfig';
import { useDataStore } from '../stores/useDataStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useAppStore } from '../stores/useAppStore';

const DashboardView: React.FC = () => {
  const { allLeads, agendaLeads, directTasks } = useDataStore();
  const { currentUser } = useAuthStore();
  const { setActiveTab, setActiveFolder, setViewScope, setShowAddLeadModal } = useAppStore();

  const today = new Date().toISOString().split('T')[0];
  
  if (!currentUser) return null;

  const isAdmin = isUserAdmin(currentUser);
  const allUsers = getUserNames();
  const [viewingUserAgenda, setViewingUserAgenda] = useState<string>(currentUser);

  const relevantLeads = useMemo(() => {
    const leads = allLeads || [];
    return isAdmin ? leads : leads.filter(l => l.owner === currentUser);
  }, [allLeads, currentUser, isAdmin]);
  
  const statusCounts = useMemo(() => ({
      frio: relevantLeads.filter(l => l.status === 'frio').length,
      contacted: relevantLeads.filter(l => l.status === 'contacted').length,
      negotiation: relevantLeads.filter(l => l.status === 'negotiation').length,
      client: relevantLeads.filter(l => l.status === 'client').length
  }), [relevantLeads]);

  const targetUserForAgenda = isAdmin ? 'all' : viewingUserAgenda;

  const agendaItems = useMemo(() => {
      let leadsForAgenda = targetUserForAgenda === 'all' ? (agendaLeads || []) : (agendaLeads || []).filter(l => l.owner === targetUserForAgenda);
      return leadsForAgenda.filter(l => l.nextActionDate && l.nextActionDate <= today)
          .sort((a, b) => (a.nextActionDate || '') > (b.nextActionDate || '') ? 1 : -1);
  }, [agendaLeads, targetUserForAgenda, today]);

  const pendingMessages = useMemo(() => (directTasks || []).filter(t => t.toUser === currentUser && t.status === 'pending'), [directTasks, currentUser]);

  const onNavigate = (tab: any, folder?: string, action?: 'addLead') => {
    setActiveTab(tab);
    if (folder) {
        setActiveFolder(folder);
        if (isAdmin) setViewScope('all');
    }
    if (action === 'addLead') {
      setShowAddLeadModal(true);
    }
  };

  const StatusCard = ({ label, count, colorClass, icon, folder }: any) => (
      <div onClick={() => onNavigate('crm', folder)} className="bg-[#050505] border border-white/10 p-5 rounded-2xl relative overflow-hidden group hover:border-white/30 transition-all cursor-pointer">
          <div className={`absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-4xl ${colorClass}`}>{icon}</div>
          <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">{label}</p><p className="text-3xl font-black text-white">{count}</p>
          <div className={`w-full h-0.5 mt-4 rounded-full opacity-30 ${colorClass.replace('text-', 'bg-')}`}></div>
      </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/5 pb-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">Hola, {currentUser}</h1>
                <p className="text-white/40 text-xs font-medium mt-1 uppercase tracking-widest">{isAdmin ? 'Resumen Global' : 'Resumen Operativo'} • {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
            {isAdmin && (<span className="px-3 py-1 bg-white/5 border border-white/10 text-white/60 text-[9px] font-black uppercase rounded">Vista de Administrador</span>)}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatusCard label="Prospectos Fríos" count={statusCounts.frio} colorClass="text-gray-400" icon="❄️" folder="frio" />
            <StatusCard label="Contactados" count={statusCounts.contacted} colorClass="text-blue-400" icon="📩" folder="contacted" />
            <StatusCard label="En Negociación" count={statusCounts.negotiation} colorClass="text-amber-400" icon="🤝" folder="negotiation" />
            <StatusCard label="Clientes Activos" count={statusCounts.client} colorClass="text-emerald-400" icon="⭐" folder="client" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#050505] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col min-h-[400px]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">📅 Agenda {isAdmin && targetUserForAgenda === 'all' ? 'Global' : `de ${targetUserForAgenda}`}</h3>
                    {!isAdmin && (<div className="flex bg-white/5 rounded-lg p-1">
                        <select value={viewingUserAgenda} onChange={(e) => setViewingUserAgenda(e.target.value)} className="bg-transparent text-white text-[10px] font-bold uppercase outline-none px-2 py-1">
                            <option value={currentUser} className="text-black">Mi Agenda</option>
                            <optgroup label="Ver Agenda De...">{allUsers.filter(u => u !== currentUser).map(u => (<option key={u} value={u} className="text-black">{u}</option>))}</optgroup>
                        </select>
                    </div>)}
                </div>
                <div className="flex-1 overflow-y-auto custom-scroll pr-2 space-y-2">
                    {agendaItems.length === 0 ? (<div className="h-full flex flex-col items-center justify-center text-white/20 border-2 border-dashed border-white/5 rounded-xl min-h-[200px]"><span className="text-2xl mb-2 opacity-50">☕</span><span className="text-[10px] uppercase font-bold tracking-widest">Nada pendiente hoy</span></div>) : (agendaItems.map(lead => {
                        const isOverdue = lead.nextActionDate && lead.nextActionDate < today;
                        return (<div key={lead.id} onClick={() => onNavigate('crm')} className="group flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 rounded-xl transition-all cursor-pointer">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-black uppercase shrink-0 border ${isOverdue ? 'bg-red-900/20 border-red-500/30 text-red-400' : 'bg-white/5 border-white/10 text-white/60'}`}>{lead.owner?.charAt(0)}</div>
                                <div className="min-w-0"><div className="flex items-center gap-2 mb-0.5">{isOverdue && <span className="text-[8px] bg-red-500 text-white px-1.5 py-0.5 rounded font-black uppercase">Vencido</span>}<span className="text-[9px] font-bold text-white/50 uppercase">{lead.nextAction}</span></div><p className="text-sm font-bold text-white truncate">{lead.name}</p></div>
                            </div>
                            <div className="text-right pl-4"><span className={`text-[10px] font-mono font-bold block ${isOverdue ? 'text-red-400' : 'text-white/40'}`}>{lead.nextActionDate}</span>{isAdmin && targetUserForAgenda === 'all' && (<span className="text-[9px] text-white/30 uppercase">{lead.owner}</span>)}</div>
                        </div>);
                    }))}
                </div>
            </div>
            <div className="flex flex-col gap-6">
                <div className="bg-[#050505] border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden flex-1">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-4">💬 Mensajes ({pendingMessages.length})</h3>
                    {pendingMessages.length === 0 ? (<div className="p-6 bg-white/5 border border-white/5 rounded-2xl text-center text-white/30 text-[10px] italic h-32 flex items-center justify-center">Bandeja limpia.</div>) : (<div className="space-y-3">{pendingMessages.slice(0, 4).map(task => (<div key={task.id} className="p-3 bg-white/5 border-l-2 border-white/20 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => onNavigate('agenda')}><div className="flex justify-between items-start mb-1"><span className="text-[9px] font-black text-white uppercase">{task.fromUser}</span><span className="text-[8px] text-white/30">Ahora</span></div><p className="text-xs text-white/80 line-clamp-2">{task.message}</p></div>))}</div>)}
                </div>
                <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6">
                    <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Accesos Rápidos</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => onNavigate('intelligence')} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-center transition-all group"><span className="text-xl block mb-1 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all">🔭</span><span className="text-[9px] font-bold text-white uppercase">Buscar</span></button>
                        <button onClick={() => onNavigate('crm', undefined, 'addLead')} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-center transition-all group"><span className="text-xl block mb-1 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all">➕</span><span className="text-[9px] font-bold text-white uppercase">Nuevo Lead</span></button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default DashboardView;
