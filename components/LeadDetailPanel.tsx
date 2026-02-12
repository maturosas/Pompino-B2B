
import React, { useState } from 'react';
import { Lead } from '../types';

interface LeadDetailPanelProps {
  lead: Lead;
  onClose: () => void;
  onUpdate: (updates: Partial<Lead>, context?: string) => void;
}

const LeadDetailPanel: React.FC<LeadDetailPanelProps> = ({ lead, onClose, onUpdate }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [saleAmount, setSaleAmount] = useState('');

  const getMapsUrl = () => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.name + ' ' + lead.location)}`;
  };

  const initiateCloseSale = () => {
      // Logic: If already client, just update without asking amount (bonus applies only to first sale)
      if (lead.isClient) {
          onUpdate({ status: 'client', nextAction: 'sale' }, 'Actualización Cliente');
          return;
      }
      setIsClosing(true);
  };

  const handleCloseSale = () => {
      const value = parseFloat(saleAmount);
      if (isNaN(value) || value <= 0) {
          alert("Por favor ingresa un monto válido mayor a 0.");
          return;
      }

      onUpdate({ 
          status: 'client', 
          isClient: true, 
          nextAction: 'sale',
          saleValue: value
      }, `Cierre Primer Venta: $${value}`);
      
      setIsClosing(false);
  };

  const handleSkipAmount = () => {
      onUpdate({ 
          status: 'client', 
          isClient: true, 
          nextAction: 'sale'
      }, `Cliente Activo (Sin monto inicial)`);
      setIsClosing(false);
  };

  return (
    <div className="fixed inset-0 z-[110] flex justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Panel */}
      <div className="relative w-full md:max-w-xl bg-black border-l border-white/10 h-[100dvh] flex flex-col animate-in slide-in-from-right duration-300">
        <header className="p-6 md:p-8 border-b border-white/10 flex justify-between items-center bg-[#050505]">
          <div className="min-w-0 pr-4">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] block">Ficha de Inteligencia B2B</span>
            <h2 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter leading-none mt-2 truncate">{lead.name}</h2>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 border border-white/10 rounded-2xl text-white hover:bg-white/10 transition-colors shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 md:space-y-10 custom-scroll bg-black">
          {/* Section: Información Comercial */}
          <section className="space-y-6">
            <h3 className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em] border-b border-white/5 pb-2 italic">Perfil de Contacto</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">POC (Persona de Contacto)</label>
                <input 
                  value={lead.contactName || ''} 
                  onChange={(e) => onUpdate({ contactName: e.target.value }, 'POC')}
                  placeholder="Ej: Juan Perez..."
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white outline-none transition-all uppercase"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Status</label>
                <select 
                  value={lead.status} 
                  onChange={(e) => onUpdate({ status: e.target.value as any }, 'Status')}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white outline-none uppercase font-bold"
                >
                  <option value="frio">FRIO</option>
                  <option value="contacted">CONTACTADO</option>
                  <option value="negotiation">NEGOCIACION</option>
                  <option value="client">CLIENTE</option>
                </select>
              </div>
            </div>

            {/* Nueva Sección: Próxima Acción */}
            <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 space-y-4">
                 <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Planificación Comercial</h4>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-white/40 uppercase">Próxima Acción</label>
                        <select 
                            value={lead.nextAction || 'call'} 
                            onChange={(e) => onUpdate({ nextAction: e.target.value as any }, 'Próxima Acción')}
                            className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none uppercase"
                        >
                            <option value="call">Llamado</option>
                            <option value="whatsapp">Whatsapp</option>
                            <option value="email">Email</option>
                            <option value="visit">Visita</option>
                            <option value="quote">Presupuesto</option>
                            <option value="offer">Oferta</option>
                            <option value="sale">Venta</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-white/40 uppercase">Fecha Agenda</label>
                         <input 
                            type="date"
                            value={lead.nextActionDate || ''} 
                            onChange={(e) => onUpdate({ nextActionDate: e.target.value }, 'Fecha Agenda')}
                            className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none uppercase"
                        />
                    </div>
                 </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-white/40 uppercase tracking-widest flex justify-between">
                        WhatsApp (Editable)
                        <a href={getMapsUrl()} target="_blank" className="text-white hover:text-white/60">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </a>
                    </label>
                    <input 
                        value={lead.phone || ''} 
                        onChange={(e) => onUpdate({ phone: e.target.value }, 'Teléfono')}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-white outline-none"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-white/40 uppercase tracking-widest flex justify-between">
                        Email (Editable)
                    </label>
                    <input 
                        value={lead.email || ''} 
                        onChange={(e) => onUpdate({ email: e.target.value }, 'Email')}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-white outline-none"
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
                onChange={(e) => onUpdate({ deliveryZone: e.target.value }, 'Zona')}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white outline-none"
              />
            </div>
          </section>

          {/* Section: Operaciones */}
          <section className="space-y-6">
            <h3 className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em] border-b border-white/5 pb-2 italic">Operaciones</h3>
            
            <div className="space-y-2">
                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Lista de Precios Ofrecida</label>
                <select 
                    value={lead.priceList || 'regular'} 
                    onChange={(e) => onUpdate({ priceList: e.target.value as any }, 'Lista Precios')}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white outline-none uppercase"
                >
                    <option value="regular">Regular</option>
                    <option value="special">Especial</option>
                    <option value="wholesale">Mayorista</option>
                    <option value="discount_15">15% OFF</option>
                </select>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Comentarios / Bitácora</label>
              <textarea 
                rows={5}
                value={lead.notes || ''} 
                onChange={(e) => onUpdate({ notes: e.target.value }, 'Comentarios')}
                placeholder="Escribe aquí detalles de la negociación..."
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white outline-none resize-none italic"
              />
            </div>

            {/* Venta Info Display */}
            {lead.status === 'client' && lead.saleValue && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">1ra Venta Cerrada</p>
                    <p className="text-2xl font-black text-white">$ {lead.saleValue.toLocaleString('es-AR')}</p>
                </div>
            )}
          </section>

          {/* Section: Historial */}
          <section className="p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Último Contacto (Auto)</span>
              <span className="text-[10px] text-white font-black uppercase">
                  {lead.lastContactDate ? new Date(lead.lastContactDate).toLocaleString() : 'Sin actividad'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Fecha de Captura</span>
              <span className="text-[10px] text-white font-black uppercase">{lead.savedAt ? new Date(lead.savedAt).toLocaleDateString() : '---'}</span>
            </div>
          </section>
        </div>

        <footer className="p-6 md:p-8 border-t border-white/10 bg-[#050505] flex flex-col md:flex-row gap-4">
           {lead.phone && (
               <a 
                href={`https://wa.me/${(lead.phone || '').replace(/\D/g, '')}`} 
                target="_blank"
                className="flex-1 h-12 md:h-14 bg-white text-black rounded-2xl flex items-center justify-center font-black uppercase text-xs tracking-widest hover:bg-white/90 active:scale-95 transition-all shadow-xl shadow-white/5"
               >
                 Contactar por WhatsApp
               </a>
           )}
           
           {lead.status !== 'client' || !lead.isClient ? (
               isClosing ? (
                    <div className="flex-1 flex gap-2 animate-in slide-in-from-bottom-2">
                         <div className="flex-1 relative">
                             <span className="absolute -top-3 left-0 text-[9px] text-white/50 font-bold bg-black px-1">Importe 1ra Venta (ARS)</span>
                             <input 
                                autoFocus
                                type="number" 
                                value={saleAmount}
                                onChange={(e) => setSaleAmount(e.target.value)}
                                placeholder="$ 0"
                                className="w-full h-12 md:h-14 bg-emerald-900/20 border border-emerald-500/50 rounded-2xl px-4 text-white font-black text-lg outline-none focus:bg-emerald-900/30"
                             />
                             <p className="absolute -bottom-4 left-1 text-[8px] text-emerald-400/70">Solo válido para la primera venta</p>
                         </div>
                         <div className="flex flex-col gap-1 w-40">
                             <button 
                                onClick={handleCloseSale}
                                className="w-full h-8 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg flex items-center justify-center shadow-lg transition-all text-[10px] font-black uppercase"
                             >
                                Confirmar
                             </button>
                             <button 
                                onClick={handleSkipAmount}
                                className="w-full h-8 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center justify-center transition-all text-[10px] font-bold uppercase"
                             >
                                Omitir Monto
                             </button>
                             <button 
                                onClick={() => setIsClosing(false)}
                                className="w-full h-6 text-white/30 hover:text-white flex items-center justify-center transition-all text-[9px] font-bold uppercase"
                             >
                                Cancelar
                             </button>
                         </div>
                    </div>
               ) : (
                   <button 
                    onClick={initiateCloseSale}
                    className="flex-1 h-12 md:h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center font-black uppercase text-xs tracking-widest hover:bg-emerald-400 active:scale-95 transition-all shadow-xl shadow-emerald-900/20"
                   >
                     ¡Cerrar Venta! 🚀
                   </button>
               )
           ) : (
                <div className="flex-1 h-12 md:h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col items-center justify-center font-black uppercase text-emerald-400">
                    <span className="text-[10px] tracking-widest">Cliente Activo</span>
                    {lead.saleValue && <span className="text-xs text-white opacity-80">$ {lead.saleValue.toLocaleString('es-AR')}</span>}
                </div>
           )}
        </footer>
      </div>
    </div>
  );
};

export default LeadDetailPanel;
