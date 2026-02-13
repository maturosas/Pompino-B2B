
import React, { useState, useMemo } from 'react';
import { Lead } from '../types';
import { isUserAdmin, getUserNames } from '../projectConfig';
import { useDataStore } from '../stores/useDataStore';
import { useAuthStore } from '../stores/useAuthStore';

const AgendaView: React.FC = () => {
  const { agendaLeads, directTasks, updateLead, completeDirectTask, paginatedLeads } = useDataStore();
  const { currentUser } = useAuthStore();
  const [viewMode, setViewMode] = useState<'today' | 'future'>('today');
  const [isAddActionOpen, setIsAddActionOpen] = useState(false);
  
  const [newActionSearch, setNewActionSearch] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [newActionType, setNewActionType] = useState<string>('call');
  const [newActionDate, setNewActionDate] = useState<string>('');
  const [newActionStatus, setNewActionStatus] = useState<string>('');

  if (!currentUser) return null;

  const today = new Date().toISOString().split('T')[0];

  const actionLabels: Record<string, string> = {
    call: 'Llamado', whatsapp: 'WhatsApp', email: 'Email', visit: 'Visita Presencial',
    quote: 'Presupuesto', offer: 'Oferta', sale: 'Cierre Venta'
  };

  const { dueTasks, futureTasks } = useMemo(() => {
    const due: Lead[] = [];
    const future: Lead[] = [];
    (agendaLeads || []).forEach(task => {
        if (!task.nextActionDate) return;
        if (task.nextActionDate <= today) due.push(task);
        else future.push(task);
    });
    due.sort((a, b) => (a.nextActionDate || '') > (b.nextActionDate || '') ? 1 : -1);
    future.sort((a, b) => (a.nextActionDate || '') > (b.nextActionDate || '') ? 1 : -1);
    return { dueTasks: due, futureTasks: future };
  }, [agendaLeads, today]);

  // Search uses all loaded leads for better UX when adding tasks
  const availableLeads = useMemo(() => {
      if (!newActionSearch) return [];
      return (paginatedLeads || []).filter(l => l.name.toLowerCase().includes(newActionSearch.toLowerCase())).slice(0, 10);
  }, [paginatedLeads, newActionSearch]);

  const handleAddAction = () => {
      if (!selectedLeadId || !newActionDate) return;
      const updates: Partial<Lead> = { nextAction: newActionType as any, nextActionDate: newActionDate };
      if (newActionStatus) updates.status = newActionStatus as any;
      updateLead(selectedLeadId, updates);
      setIsAddActionOpen(false);
      setSelectedLeadId(''); setNewActionSearch(''); setNewActionDate(''); setNewActionStatus('');
  };

  const activeList = viewMode === 'today' ? dueTasks : futureTasks;
  const pendingDirectTasks = (directTasks || []).filter(t => t.toUser === currentUser && t.status === 'pending');

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
        <div className="glass-solid p-6 rounded-3xl border border-white/10 relative overflow-hidden">
             <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                 <div><h2 className="text-3xl font-black text-white uppercase tracking-tighter">Agenda de Tareas</h2><p className="text-white/50 text-xs font-bold uppercase tracking-widest mt-1">Central Operativa</p></div>
                 <div className="flex gap-2">
                    <button onClick={() => setIsAddActionOpen(true)} className="h-10 px-4 bg-white hover:bg-gray-200 text-black text-[10px] font-black uppercase rounded-xl flex items-center gap-2 shadow-lg transition-all"><span>+</span> Nueva Acción</button>
                    <div className="flex gap-1 bg-black p-1 rounded-xl border border-white/10">
                        <button onClick={() => setViewMode('today')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all ${viewMode === 'today' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}>Para Hoy</button>
                        <button onClick={() => setViewMode('future')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all ${viewMode === 'future' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}>Futuras</button>
                    </div>
                 </div>
             </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
                <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-4">Solicitudes de Equipo</h3>
                {pendingDirectTasks.length === 0 ? (<div className="p-6 border border-dashed border-white/10 rounded-2xl text-center"><p className="text-[10px] text-white/30 uppercase font-bold">Sin solicitudes pendientes</p></div>) : (pendingDirectTasks.map(task => (
                    <div key={task.id} className="bg-red-900/10 border border-red-500/20 rounded-2xl p-4 shadow-lg group">
                         <div className="flex justify-between items-start mb-2"><span className="text-[9px] font-black uppercase text-red-400">URGENTE</span><span className="text-[9px] text-white/40">{new Date(task.createdAt).toLocaleDateString()}</span></div>
                         <p className="text-sm font-bold text-white mb-1">De: {task.fromUser}</p>
                         <p className="text-xs text-white/70 leading-relaxed mb-4">{task.message}</p>
                         <button onClick={() => completeDirectTask(task.id)} className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-[10px] uppercase rounded-lg transition-colors">Marcar Completado</button>
                    </div>
                )))}
            </div>
            <div className="lg:col-span-2 space-y-8">
                 <div>
                    <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-4">Mi Agenda ({activeList.filter(t => t.owner === currentUser).length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {activeList.filter(t => t.owner === currentUser).length === 0 ? (<div className="col-span-2 py-8 text-center border border-dashed border-white/10 rounded-2xl"><p className="text-white/20 text-xs font-bold uppercase">Nada programado</p></div>) : (activeList.filter(t => t.owner === currentUser).map(task => { 
                            const isOverdue = task.nextActionDate && task.nextActionDate < today;
                            return (
                                <div key={task.id} className="bg-[#050505] border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-4">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className={`text-[9px] font-black uppercase px-2 py-1 rounded border ${isOverdue && viewMode === 'today' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-white/5 text-white/60 border-white/10'}`}>{actionLabels[task.nextAction || 'call']}</div>
                                            {task.nextActionDate && (<span className={`text-[10px] font-mono font-bold ${isOverdue ? 'text-red-400' : 'text-white/40'}`}>{new Date(task.nextActionDate).toLocaleDateString(undefined, {month:'numeric', day:'numeric'})}</span>)}
                                        </div>
                                        <h4 className="text-sm font-bold text-white truncate">{task.name}</h4><p className="text-[11px] text-white/50 mt-1 line-clamp-2 min-h-[2.5em]">{task.notes || 'Sin notas...'}</p>
                                    </div>
                                    <div className="pt-3 border-t border-white/5 flex items-center gap-2">
                                        {task.phone && (<a href={`https://wa.me/${task.phone.replace(/\D/g, '')}`} target="_blank" className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center hover:bg-emerald-500 hover:text-black transition-all">W</a>)}
                                        <div className="flex-1 flex items-center justify-end gap-2"><input type="date" value={task.nextActionDate || ''} onChange={(e) => updateLead(task.id, { nextActionDate: e.target.value })} className="bg-black border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white/80 focus:border-white outline-none w-28 text-right" /></div>
                                    </div>
                                </div>
                            )
                        }))}
                    </div>
                 </div>
            </div>
        </div>
        {isAddActionOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl">
                    <h3 className="text-lg font-black text-white uppercase italic tracking-tighter mb-4">Agregar Acción Manual</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 block">Buscar Lead / Cliente</label>
                            <input autoFocus type="text" value={newActionSearch} onChange={(e) => setNewActionSearch(e.target.value)} placeholder="Escribe el nombre..." className="w-full h-10 bg-black/50 border border-white/10 rounded-xl px-3 text-sm text-white" />
                            {newActionSearch.length > 1 && !selectedLeadId && (<div className="mt-2 bg-white/5 rounded-xl max-h-40 overflow-y-auto border border-white/5">{availableLeads.map(l => (<div key={l.id} onClick={() => { setSelectedLeadId(l.id); setNewActionSearch(l.name); }} className="px-3 py-2 hover:bg-white/10 cursor-pointer flex justify-between"><span className="text-xs text-white truncate">{l.name}</span><span className="text-[9px] text-white/40 uppercase">{l.status}</span></div>))}</div>)}
                            {selectedLeadId && (<div className="mt-1 flex items-center gap-2"><span className="text-emerald-400 text-xs font-bold">✓ Seleccionado</span><button onClick={() => { setSelectedLeadId(''); setNewActionSearch(''); }} className="text-[10px] text-white/40 underline">Cambiar</button></div>)}
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 block">Tipo de Acción</label>
                            <select value={newActionType} onChange={(e) => setNewActionType(e.target.value)} className="w-full h-10 bg-black/50 border border-white/10 rounded-xl px-3 text-sm text-white">{Object.entries(actionLabels).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}</select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 block">Fecha Programada</label>
                            <input type="date" value={newActionDate} onChange={(e) => setNewActionDate(e.target.value)} className="w-full h-10 bg-black/50 border border-white/10 rounded-xl px-3 text-sm text-white" />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setIsAddActionOpen(false)} className="px-4 py-2 text-xs font-bold text-white/40 hover:text-white uppercase">Cancelar</button>
                            <button onClick={handleAddAction} disabled={!selectedLeadId || !newActionDate} className="px-6 py-2 bg-white disabled:opacity-50 text-black text-xs font-black uppercase rounded-xl">Programar</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default AgendaView;
