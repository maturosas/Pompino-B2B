
import React from 'react';
import { Lead, User } from '../types';

interface TaskReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Lead[];
  user: User;
}

const TaskReminderModal: React.FC<TaskReminderModalProps> = ({ isOpen, onClose, tasks, user }) => {
  if (!isOpen) return null;

  const actionLabels: Record<string, string> = {
    call: 'Llamado',
    whatsapp: 'WhatsApp',
    email: 'Email',
    visit: 'Visita Presencial',
    quote: 'Presupuesto',
    offer: 'Oferta',
    sale: 'Cierre Venta'
  };

  const today = new Date().toLocaleDateString();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#111] border border-indigo-500/30 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-2xl shadow-[0_0_20px_#6366f1]">
                📅
            </div>
            <div>
                <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Agenda del Día</h2>
                <p className="text-xs text-indigo-300 font-bold uppercase tracking-widest">{today} • Hola {user}</p>
            </div>
        </div>

        {/* Task List */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scroll pr-2">
            <p className="text-sm text-white/70">Tienes <strong className="text-white">{tasks.length} tareas</strong> programadas para hoy:</p>
            
            {tasks.map(task => (
                <div key={task.id} className="bg-white/5 border border-white/10 p-3 rounded-xl flex justify-between items-center group hover:bg-white/10 transition-colors">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded uppercase">
                                {actionLabels[task.nextAction || 'call']}
                            </span>
                            <h4 className="font-bold text-white text-sm">{task.name}</h4>
                        </div>
                        <p className="text-[10px] text-white/40 mt-1">{task.notes || 'Sin notas adicionales'}</p>
                    </div>
                    {task.phone && (
                        <a 
                            href={`https://wa.me/${task.phone.replace(/\D/g, '')}`} 
                            target="_blank" 
                            className="w-8 h-8 rounded-full bg-[#25D366]/20 text-[#25D366] flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-all"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                        </a>
                    )}
                </div>
            ))}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col gap-3">
             <div className="flex items-center gap-2 text-[10px] text-emerald-400 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <span>Emails de recordatorio enviados automáticamente</span>
             </div>
            <button onClick={onClose} className="w-full py-3 bg-white text-black text-xs font-black uppercase rounded-xl hover:bg-indigo-50 hover:text-indigo-900 transition-all shadow-lg tracking-wide">
                Comenzar a Trabajar
            </button>
        </div>

      </div>
    </div>
  );
};

export default TaskReminderModal;
