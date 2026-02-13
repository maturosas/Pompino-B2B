
import React, { useState, useMemo } from 'react';
import { useDataStore } from '../stores/useDataStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useAppStore } from '../stores/useAppStore';

const ActionCenter: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { agendaLeads, directTasks, completeDirectTask, updateLead } = useDataStore();
  const { currentUser } = useAuthStore();
  const { setShowActionCenter } = useAppStore();
  
  const today = new Date().toISOString().split('T')[0];

  const { dueTasks, pendingDirect } = useMemo(() => {
    if (!currentUser) return { dueTasks: [], pendingDirect: [] };
    
    const myLeads = (agendaLeads || []).filter(lead => lead.owner === currentUser);
    const due = myLeads.filter(task => task.nextActionDate && task.nextActionDate <= today);
    due.sort((a, b) => (a.nextActionDate || '') > (b.nextActionDate || '') ? 1 : -1);
    
    const pending = (directTasks || []).filter(t => t.toUser === currentUser && t.status === 'pending');
    
    return { dueTasks: due, pendingDirect: pending };
  }, [agendaLeads, directTasks, today, currentUser]);

  const totalAlerts = dueTasks.length + pendingDirect.length;
  if (totalAlerts === 0) return null;

  const hasOverdue = dueTasks.some(t => t.nextActionDate && t.nextActionDate < today);

  return (
    <div className="mb-6 animate-in slide-in-from-top-4 duration-500 relative z-50">
        <div className="rounded-2xl border border-white/10 p-4 flex items-center justify-between bg-[#050505] shadow-xl">
            <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => setIsExpanded(!isExpanded)}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 bg-white/5 border border-white/10`}>
                    {hasOverdue ? '⚠️' : '📅'}
                </div>
                <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                        {hasOverdue ? 'Atención Requerida' : 'Agenda del Día'}
                        <span className="bg-white text-black px-1.5 py-0.5 rounded text-[9px] font-bold">{totalAlerts}</span>
                    </h3>
                    <p className="text-[10px] text-white/40 mt-0.5">
                        {pendingDirect.length > 0 && <span>{pendingDirect.length} Solicitudes. </span>}
                        {dueTasks.length > 0 && <span>{dueTasks.length} Tareas.</span>}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button onClick={() => setIsExpanded(!isExpanded)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-bold uppercase text-white transition-colors">
                    {isExpanded ? 'Cerrar' : 'Ver'}
                </button>
                <button onClick={() => setShowActionCenter(false)} className="p-1.5 text-white/30 hover:text-white transition-colors">✕</button>
            </div>
        </div>

        {isExpanded && (
            <div className="mt-2 bg-[#050505] border border-white/10 rounded-2xl p-4 shadow-xl animate-in slide-in-from-top-2">
                {pendingDirect.length > 0 && (
                    <div className="mb-4">
                        <h4 className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">Directas</h4>
                        <div className="space-y-2">
                            {pendingDirect.map(t => (
                                <div key={t.id} className="bg-white/5 border border-white/10 p-3 rounded-xl flex justify-between items-center gap-3">
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-bold text-white uppercase mb-0.5">De: {t.fromUser}</p>
                                        <p className="text-[10px] text-white/70 truncate">{t.message}</p>
                                    </div>
                                    <button onClick={() => completeDirectTask(t.id)} className="bg-white text-black text-[9px] font-bold uppercase px-3 py-1.5 rounded-lg">Listo</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {dueTasks.length > 0 && (
                    <div>
                        <h4 className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">Gestiones</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto custom-scroll pr-2">
                            {dueTasks.map(lead => {
                                const isOverdueLead = lead.nextActionDate && lead.nextActionDate < today;
                                return (
                                    <div key={lead.id} className="p-3 rounded-xl border border-white/10 bg-white/5 flex flex-col gap-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    {isOverdueLead && <span className="text-[8px] font-black bg-white text-black px-1 rounded uppercase">Vencido</span>}
                                                    <span className="text-[9px] font-bold text-white uppercase">{lead.nextAction}</span>
                                                </div>
                                                <p className="text-[10px] font-bold text-white/70 truncate max-w-[150px]">{lead.name}</p>
                                            </div>
                                            <span className={`text-[9px] font-mono font-bold ${isOverdueLead ? 'text-white' : 'text-white/40'}`}>{lead.nextActionDate}</span>
                                        </div>
                                        <div className="flex gap-2 mt-auto pt-2 border-t border-white/5">
                                            {lead.phone && <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" className="flex-1 bg-white/10 text-white text-[9px] font-bold uppercase h-6 flex items-center justify-center rounded hover:bg-white hover:text-black">WA</a>}
                                            <input type="date" className="bg-transparent border border-white/20 rounded px-1 text-[9px] text-white w-20 outline-none" value={lead.nextActionDate || ''} onChange={(e) => updateLead(lead.id, { nextActionDate: e.target.value })} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};

export default ActionCenter;
