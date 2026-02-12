
import React, { useState, useMemo } from 'react';
import { Lead, User, DirectTask } from '../types';

interface TaskReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Lead[];
  directTasks: DirectTask[];
  user: User;
  onUpdateTask: (id: string, updates: Partial<Lead>) => void;
  onCompleteDirectTask: (id: string) => void;
}

const TaskReminderModal: React.FC<TaskReminderModalProps> = ({ isOpen, onClose, tasks, directTasks, user, onUpdateTask, onCompleteDirectTask }) => {
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

  // Separar tareas
  const { dueTasks, futureTasks } = useMemo(() => {
    const due: Lead[] = [];
    const future: Lead[] = [];
    tasks.forEach(task => {
        if (!task.nextActionDate) return;
        if (task.nextActionDate <= today) due.push(task);
        else future.push(task);
    });
    // Ordenar: Vencidas primero, Futuras por fecha
    due.sort((a, b) => (a.nextActionDate || '') > (b.nextActionDate || '') ? 1 : -1);
    future.sort((a, b) => (a.nextActionDate || '') > (b.nextActionDate || '') ? 1 : -1);
    
    return { dueTasks: due, futureTasks: future };
  }, [tasks, today]);

  if (!isOpen) return null;

  const activeList = viewMode === 'today' ? dueTasks : futureTasks;
  const hasTasksToday = dueTasks.length > 0;
  const pendingDirectTasks = directTasks.filter(t => t.status === 'pending');

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 shrink-0 border-b border-white/5 pb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-colors ${hasTasksToday || pendingDirectTasks.length > 0 ? 'bg-indigo-500 text-white' : 'bg-emerald-500 text-white'}`}>
                {hasTasksToday || pendingDirectTasks.length > 0 ? '📅' : '✅'}
            </div>
            <div className="flex-1">
                <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">
                    Agenda Operativa
                </h2>
                <p className="text-xs text-white/50 font-bold uppercase tracking-widest">{new Date().toLocaleDateString()} • Hola {user}</p>
            </div>
        </div>

        {/* --- DIRECT TASKS SECTION (New) --- */}
        {pendingDirectTasks.length > 0 && (
            <div className="mb-4 shrink-0">
                <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    Solicitudes de Equipo ({pendingDirectTasks.length})
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto custom-scroll pr-1">
                    {pendingDirectTasks.map(task => (
                        <div key={task.id} className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex justify-between gap-3 items-start">
                             <div>
                                 <div className="flex items-center gap-1.5 mb-1">
                                     <span className="text-[9px] font-black uppercase bg-red-500 text-white px-1 rounded">URGENTE</span>
                                     <span className="text-[9px] font-bold text-red-300 uppercase">De: {task.fromUser}</span>
                                     <span className="text-[9px] text-white/40">{new Date(task.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                 </div>
                                 <p className="text-sm font-medium text-white leading-tight">{task.message}</p>
                             </div>
                             <button 
                                onClick={() => onCompleteDirectTask(task.id)}
                                className="h-8 w-8 rounded-lg bg-red-500 text-white flex items-center justify-center hover:bg-red-400 transition-colors shrink-0"
                                title="Marcar como listo"
                             >
                                 ✓
                             </button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- CRM TASKS SECTION --- */}
        <div className="flex flex-col flex-1 min-h-0">
             {/* Tabs */}
             <div className="flex gap-2 mb-4 shrink-0">
                <button 
                    onClick={() => setViewMode('today')}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all ${viewMode === 'today' ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                >
                    Para Hoy / Vencidas ({dueTasks.length})
                </button>
                <button 
                    onClick={() => setViewMode('future')}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all ${viewMode === 'future' ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                >
                    Futuras ({futureTasks.length})
                </button>
             </div>

             {/* List */}
             <div className="space-y-3 overflow-y-auto custom-scroll pr-2 flex-1">
                 {activeList.length === 0 ? (
                     <div className="text-center py-10 text-white/20 text-xs font-bold uppercase tracking-widest border border-dashed border-white/10 rounded-xl">
                         No hay leads en esta vista
                     </div>
                 ) : (
                    activeList.map(task => {
                        const isOverdue = task.nextActionDate && task.nextActionDate < today;
                        return (
                            <div key={task.id} className={`bg-white/5 border p-3 rounded-xl flex flex-col gap-2 group hover:border-indigo-500/30 transition-all ${isOverdue && viewMode === 'today' ? 'border-red-500/30' : 'border-white/10'}`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded w-fit mb-1 ${isOverdue ? 'bg-red-500/10 text-red-400' : 'bg-indigo-500/10 text-indigo-300'}`}>
                                            {actionLabels[task.nextAction || 'call']}
                                        </span>
                                        <h4 className="text-sm font-bold text-white truncate">{task.name}</h4>
                                    </div>
                                    {task.nextActionDate && (
                                        <span className={`text-[10px] font-mono font-bold ${isOverdue ? 'text-red-400' : 'text-white/40'}`}>
                                            {new Date(task.nextActionDate).toLocaleDateString(undefined, {month:'numeric', day:'numeric'})}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-white/50 line-clamp-2">{task.notes || 'Sin notas...'}</p>
                                
                                <div className="pt-2 border-t border-white/5 flex gap-2">
                                     {task.phone && (
                                        <a 
                                            href={`https://wa.me/${task.phone.replace(/\D/g, '')}`} 
                                            target="_blank" 
                                            className="flex-1 py-1.5 rounded-lg bg-[#25D366]/10 text-[#25D366] flex items-center justify-center text-[10px] font-bold uppercase hover:bg-[#25D366] hover:text-white transition-all"
                                        >
                                            WhatsApp
                                        </a>
                                     )}
                                     <div className="flex-1 flex items-center justify-end gap-2">
                                        <input 
                                            type="date" 
                                            value={task.nextActionDate || ''}
                                            onChange={(e) => onUpdateTask(task.id, { nextActionDate: e.target.value })}
                                            className="bg-black border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white/80 focus:border-indigo-500 outline-none w-full"
                                        />
                                     </div>
                                </div>
                            </div>
                        );
                    })
                 )}
             </div>

             <div className="pt-4 border-t border-white/5 mt-4 flex justify-end">
                <button onClick={onClose} className="px-6 py-2.5 bg-white text-black text-xs font-black uppercase rounded-xl hover:bg-indigo-50 transition-all">
                    Cerrar Agenda
                </button>
             </div>
        </div>
      </div>
    </div>
  );
};

export default TaskReminderModal;
