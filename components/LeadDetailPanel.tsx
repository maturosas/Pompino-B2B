
import React from 'react';
import { Lead } from '../types';

interface LeadDetailPanelProps {
  lead: Lead;
  onClose: () => void;
  onUpdate: (updates: Partial<Lead>) => void;
}

const LeadDetailPanel: React.FC<LeadDetailPanelProps> = ({ lead, onClose, onUpdate }) => {
  const getMapsUrl = () => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.name + ' ' + lead.location)}`;
  };

  return (
    <div className="fixed inset-0 z-[110] flex justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Panel */}
      <div className="relative w-full max-w-xl bg-black border-l border-white/10 h-full flex flex-col animate-in slide-in-from-right duration-300">
        <header className="p-8 border-b border-white/10 flex justify-between items-center bg-[#050505]">
          <div>
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Ficha de Inteligencia B2B</span>
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none mt-2">{lead.name}</h2>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 border border-white/10 rounded-2xl text-white hover:bg-white/10 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scroll bg-black">
          {/* Section: Información Comercial */}
          <section className="space-y-6">
            <h3 className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em] border-b border-white/5 pb-2 italic">Perfil Comercial</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Responsable / Dueño</label>
                <input 
                  value={lead.decisionMaker || ''} 
                  onChange={(e) => onUpdate({ decisionMaker: e.target.value })}
                  placeholder="Nombre del encargado..."
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Potencial de Venta</label>
                <select 
                  value={lead.businessPotential || 'medium'} 
                  onChange={(e) => onUpdate({ businessPotential: e.target.value as any })}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white outline-none"
                >
                  <option value="low">BAJO</option>
                  <option value="medium">MEDIO</option>
                  <option value="high">ALTO</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-white/40 uppercase tracking-widest flex justify-between">
                        WhatsApp (Editable)
                        <a href={getMapsUrl()} target="_blank" className="text-white hover:text-white/60">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </a>
                    </label>
                    <input 
                        value={lead.phone || ''} 
                        onChange={(e) => onUpdate({ phone: e.target.value })}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white outline-none"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-white/40 uppercase tracking-widest flex justify-between">
                        Email (Editable)
                        <a href={getMapsUrl()} target="_blank" className="text-white hover:text-white/60">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </a>
                    </label>
                    <input 
                        value={lead.email || ''} 
                        onChange={(e) => onUpdate({ email: e.target.value })}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white outline-none"
                    />
                </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-white/40 uppercase tracking-widest flex justify-between">
                Zona de Entrega / Ubicación
                <a href={getMapsUrl()} target="_blank" className="text-white hover:text-white/60">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </a>
              </label>
              <input 
                value={lead.deliveryZone || lead.location} 
                onChange={(e) => onUpdate({ deliveryZone: e.target.value })}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white outline-none"
              />
            </div>
          </section>

          {/* Section: Logística y Pagos */}
          <section className="space-y-6">
            <h3 className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em] border-b border-white/5 pb-2 italic">Operaciones</h3>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Condiciones de Pago</label>
              <input 
                value={lead.paymentTerms || ''} 
                onChange={(e) => onUpdate({ paymentTerms: e.target.value })}
                placeholder="Ej: Contado / 30 días / Consignación..."
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Notas de Inteligencia de Mercado</label>
              <textarea 
                rows={5}
                value={lead.notes || ''} 
                onChange={(e) => onUpdate({ notes: e.target.value })}
                placeholder="Escribe aquí detalles de la negociación, competencia que manejan, productos preferidos..."
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white outline-none resize-none italic"
              />
            </div>
          </section>

          {/* Section: Historial */}
          <section className="p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Último Contacto</span>
              <input 
                type="date"
                value={lead.lastContactDate || ''} 
                onChange={(e) => onUpdate({ lastContactDate: e.target.value })}
                className="bg-transparent border-none text-[10px] text-white font-black uppercase outline-none"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Fecha de Captura</span>
              <span className="text-[10px] text-white font-black uppercase">{lead.savedAt ? new Date(lead.savedAt).toLocaleDateString() : '---'}</span>
            </div>
          </section>
        </div>

        <footer className="p-8 border-t border-white/10 bg-[#050505] flex gap-4">
           <a 
            href={`https://wa.me/${(lead.phone || '').replace(/\D/g, '')}`} 
            target="_blank"
            className="flex-1 h-14 bg-white text-black rounded-2xl flex items-center justify-center font-black uppercase text-xs tracking-widest hover:bg-white/90 active:scale-95 transition-all shadow-xl shadow-white/5"
           >
             Contactar por WhatsApp
           </a>
        </footer>
      </div>
    </div>
  );
};

export default LeadDetailPanel;
