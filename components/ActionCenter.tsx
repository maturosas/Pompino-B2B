
import React, { useState, useMemo } from 'react';
import { Lead, DirectTask, User } from '../types';

interface ActionCenterProps {
  tasks: Lead[];
  directTasks: DirectTask[];
  user: User;
  onUpdateTask: (id: string, updates: Partial<Lead>) => void;
  onCompleteDirectTask: (id: string) => void;
  onClose: () => void;
}

const ActionCenter: React.FC<ActionCenterProps> = ({ tasks, directTasks, user, onUpdateTask, onCompleteDirectTask, onClose }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  // Logic to separate overdue vs today
  const { dueTasks, pendingDirect } = useMemo(() => {
    const due: Lead[] = [];
    tasks.forEach(task => {
        if (!task.nextActionDate) return;
        // Include overdue AND today
        if (task.nextActionDate <= today) due.push(task);
    });
    // Sort: Oldest overdue first
    due.sort((a, b) => (a.nextActionDate || '') > (b.nextActionDate || '') ? 1 : -1);
    
    return { 
        dueTasks: due, 
        pendingDirect: directTasks.filter(t => t.status === 'pending') 
    };
  }, [tasks, directTasks, today]);

  const totalAlerts = dueTasks.length + pendingDirect.length;

  if (totalAlerts === 0) return null;

  const hasOverdue = dueTasks.some(t => t.nextActionDate && t.nextActionDate < today);

  return (
    <div className="mb-6 animate-in slide-in-from-top-4 duration-500 relative z-50">
        {/* COMPACT BAR (ALWAYS VISIBLE INITIALLY) */}
        <div className={`
            rounded-2xl border p-4 flex items-center justify-between shadow-2xl transition-all
            ${hasOverdue 
                ? 'bg-gradient-to-r from-red-900/40 to-black border-red-500/30 shadow-red-900/20' 
                : 'bg-gradient-to-r from-emerald-900/40 to-black border-emerald-500/30 shadow-emerald-900/20'}
        `}>
            <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => setIsExpanded(!isExpanded)}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${hasOverdue ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-500 text-white'}`}>
                    {hasOverdue ? '⚠️' : '📅'}
                </div>
                <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
                        {hasOverdue ? 'Atención Requerida' : 'Agenda del Día'}
                        <span className="bg-white/10 text-white px-2 py-0.5 rounded text-[10px]">{totalAlerts} pendientes</span>
                    </h3>
                    <p className="text-[11px] text-white/60">
                        {pendingDirect.length > 0 && <span>{pendingDirect.length} Solicitudes de equipo. </span>}
                        {dueTasks.length > 0 && <span>{dueTasks.length} Gestiones comerciales {hasOverdue ? 'VENCIDAS o para hoy' : 'para hoy'}.</span>}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[10px] font-bold uppercase text-white transition-colors"
                >
                    {isExpanded ? 'Ocultar' : 'Revisar Ahora'}
                </button>
                <button 
                    onClick={onClose}
                    className="p-2 text-white/30 hover:text-white transition-colors"
                    title="Cerrar notificación"
                >
                    ✕
                </button>
            </div>
        </div>

        {/* EXPANDED DETAILS */}
        {isExpanded && (
            <div className="mt-2 bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 shadow-xl animate-in slide-in-from-top-2">
                
                {/* 1. DIRECT TASKS */}
                {pendingDirect.length > 0 && (
                    <div className="mb-4">
                        <h4 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">Solicitudes Directas</h4>
                        <div className="space-y-2">
                            {pendingDirect.map(t => (
                                <div key={t.id} className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex justify-between items-center gap-3">
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold text-red-300 uppercase mb-0.5">De: {t.fromUser}</p>
                                        <p className="text-xs text-white truncate">{t.message}</p>
                                    </div>
                                    <button onClick={() => onCompleteDirectTask(t.id)} className="shrink-0 bg-red-500 hover:bg-red-400 text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg transition-colors">Listo</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 2. CRM TASKS */}
                {dueTasks.length > 0 && (
                    <div>
                        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">
                            {hasOverdue ? 'Gestiones Vencidas & Hoy' : 'Gestiones Para Hoy'}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto custom-scroll pr-2">
                            {dueTasks.map(lead => {
                                const isOverdueLead = lead.nextActionDate && lead.nextActionDate < today;
                                return (
                                    <div key={lead.id} className={`p-3 rounded-xl border flex flex-col gap-2 ${isOverdueLead ? 'bg-red-900/10 border-red-500/30' : 'bg-white/5 border-white/10'}`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    {isOverdueLead && <span className="text-[8px] font-black bg-red-500 text-white px-1 rounded uppercase">Vencido</span>}
                                                    <span className="text-[9px] font-bold text-indigo-300 uppercase">{lead.nextAction}</span>
                                                </div>
                                                <p className="text-xs font-bold text-white truncate max-w-[150px]">{lead.name}</p>
                                            </div>
                                            <span className={`text-[10px] font-mono font-bold ${isOverdueLead ? 'text-red-400' : 'text-white/50'}`}>
                                                {lead.nextActionDate}
                                            </span>
                                        </div>
                                        
                                        <div className="flex gap-2 mt-auto pt-2 border-t border-white/5">
                                            {lead.phone && (
                                                <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" className="flex-1 bg-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase h-7 flex items-center justify-center rounded border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-colors">
                                                    WhatsApp
                                                </a>
                                            )}
                                            <input 
                                                type="date"
                                                className="bg-black border border-white/20 rounded px-1 text-[9px] text-white w-24 outline-none focus:border-indigo-500"
                                                value={lead.nextActionDate || ''}
                                                onChange={(e) => onUpdateTask(lead.id, { nextActionDate: e.target.value })}
                                            />
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
