
import React, { useState, useMemo } from 'react';
import { Lead, User, DirectTask } from '../types';

interface AgendaViewProps {
  tasks: Lead[];
  directTasks: DirectTask[];
  user: User;
  onUpdateTask: (id: string, updates: Partial<Lead>) => void;
  onCompleteDirectTask: (id: string) => void;
}

const AgendaView: React.FC<AgendaViewProps> = ({ tasks, directTasks, user, onUpdateTask, onCompleteDirectTask }) => {
  const [viewMode, setViewMode] = useState<'today' | 'future'>('today');

  const actionLabels: Record<string, string> = {
    call: 'Llamado',
    whatsapp: 'WhatsApp',
    email: 'Email',
    visit: 'Visita Presencial',
    quote: 'Presupuesto',
    offer: 'Oferta',
    sale: 'Cierre Venta'
  };

  const today = new Date().toISOString().split('T')[0];

  const { dueTasks, futureTasks } = useMemo(() => {
    const due: Lead[] = [];
    const future: Lead[] = [];
    tasks.forEach(task => {
        if (!task.nextActionDate) return;
        if (task.nextActionDate <= today) due.push(task);
        else future.push(task);
    });
    // Ordenar: Vencidas primero, luego por fecha
    due.sort((a, b) => (a.nextActionDate || '') > (b.nextActionDate || '') ? 1 : -1);
    future.sort((a, b) => (a.nextActionDate || '') > (b.nextActionDate || '') ? 1 : -1);
    
    return { dueTasks: due, futureTasks: future };
  }, [tasks, today]);

  const activeList = viewMode === 'today' ? dueTasks : futureTasks;
  const pendingDirectTasks = directTasks.filter(t => t.status === 'pending');
  const completedDirectTasks = directTasks.filter(t => t.status === 'completed');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="glass-solid p-6 rounded-3xl border border-white/10 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 blur-[80px] rounded-full pointer-events-none"></div>
             <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                 <div>
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                        Agenda de Tareas
                    </h2>
                    <p className="text-white/50 text-xs font-bold uppercase tracking-widest mt-1">
                        Central Operativa de {user}
                    </p>
                 </div>
                 <div className="flex gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
                    <button 
                        onClick={() => setViewMode('today')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all ${viewMode === 'today' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
                    >
                        Para Hoy ({dueTasks.length})
                    </button>
                    <button 
                        onClick={() => setViewMode('future')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all ${viewMode === 'future' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
                    >
                        Futuras ({futureTasks.length})
                    </button>
                 </div>
             </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* COLUMN 1: DIRECT TASKS (ALERTS) */}
            <div className="lg:col-span-1 space-y-4">
                <h3 className="text-xs font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Solicitudes de Equipo
                </h3>
                
                {pendingDirectTasks.length === 0 ? (
                    <div className="p-6 border border-dashed border-white/10 rounded-2xl text-center">
                        <span className="text-2xl block mb-2 opacity-30">✅</span>
                        <p className="text-[10px] text-white/30 uppercase font-bold">No tienes solicitudes pendientes</p>
                    </div>
                ) : (
                    pendingDirectTasks.map(task => (
                        <div key={task.id} className="bg-gradient-to-br from-red-500/10 to-red-900/10 border border-red-500/30 rounded-2xl p-4 shadow-lg shadow-red-900/10 relative overflow-hidden group">
                             <div className="relative z-10">
                                 <div className="flex justify-between items-start mb-2">
                                     <span className="text-[9px] font-black uppercase bg-red-500 text-white px-1.5 py-0.5 rounded">URGENTE</span>
                                     <span className="text-[9px] text-white/40">{new Date(task.createdAt).toLocaleDateString()}</span>
                                 </div>
                                 <p className="text-sm font-bold text-white mb-1">De: {task.fromUser}</p>
                                 <p className="text-xs text-red-100/80 leading-relaxed mb-4">{task.message}</p>
                                 
                                 <button 
                                    onClick={() => onCompleteDirectTask(task.id)}
                                    className="w-full py-2 bg-red-500 hover:bg-red-400 text-white font-black text-[10px] uppercase rounded-lg transition-colors flex items-center justify-center gap-2"
                                 >
                                     <span>✓</span> Marcar Completado
                                 </button>
                             </div>
                        </div>
                    ))
                )}

                {completedDirectTasks.length > 0 && (
                    <div className="opacity-50 grayscale hover:grayscale-0 transition-all duration-300">
                        <h4 className="text-[9px] font-bold text-white/20 uppercase mb-2 mt-6">Completadas Recientemente</h4>
                        {completedDirectTasks.slice(0,3).map(task => (
                             <div key={task.id} className="bg-white/5 border border-white/5 rounded-xl p-3 mb-2">
                                <p className="text-[10px] text-white/40 line-through truncate">{task.message}</p>
                             </div>
                        ))}
                    </div>
                )}
            </div>

            {/* COLUMN 2 & 3: CRM ACTIONS */}
            <div className="lg:col-span-2 space-y-4">
                 <h3 className="text-xs font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Gestión Comercial ({activeList.length})
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeList.length === 0 ? (
                        <div className="col-span-2 py-12 text-center border border-dashed border-white/10 rounded-2xl">
                             <p className="text-white/20 text-xs font-bold uppercase">No hay acciones programadas en esta vista</p>
                        </div>
                    ) : (
                        activeList.map(task => { // CORREGIDO: ahora usamos 'task' consistentemente
                            const isOverdue = task.nextActionDate && task.nextActionDate < today;
                            return (
                                <div key={task.id} className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-4 hover:border-indigo-500/30 transition-all group shadow-lg">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className={`text-[9px] font-black uppercase px-2 py-1 rounded border ${isOverdue && viewMode === 'today' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'}`}>
                                                {actionLabels[task.nextAction || 'call']}
                                            </div>
                                            {task.nextActionDate && (
                                                <span className={`text-[10px] font-mono font-bold ${isOverdue ? 'text-red-400' : 'text-white/40'}`}>
                                                    {new Date(task.nextActionDate).toLocaleDateString(undefined, {month:'numeric', day:'numeric'})}
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="text-sm font-bold text-white truncate">{task.name}</h4>
                                        <p className="text-[11px] text-white/50 mt-1 line-clamp-2 min-h-[2.5em]">{task.notes || 'Sin notas...'}</p>
                                    </div>
                                    
                                    <div className="pt-3 border-t border-white/5 flex items-center gap-2">
                                         {task.phone && (
                                            <a 
                                                href={`https://wa.me/${task.phone.replace(/\D/g, '')}`} 
                                                target="_blank" 
                                                className="h-8 w-8 rounded-lg bg-[#25D366]/10 text-[#25D366] flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-all"
                                            >
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                                            </a>
                                        )}
                                        <div className="flex-1 flex items-center justify-end gap-2">
                                            <span className="text-[9px] text-white/30 uppercase font-bold">Re-Agendar:</span>
                                            <input 
                                                type="date" 
                                                value={task.nextActionDate || ''}
                                                onChange={(e) => onUpdateTask(task.id, { nextActionDate: e.target.value })}
                                                className="bg-black border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white/80 focus:border-indigo-500 outline-none w-28 text-right"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default AgendaView;
