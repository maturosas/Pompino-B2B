
import React from 'react';

interface HowToUseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HowToUseModal: React.FC<HowToUseModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl w-full max-w-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none"></div>

        <div className="flex justify-between items-start mb-6 relative z-10">
          <div>
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Manual de Operaciones</h2>
            <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Protocolo BZS Intelligence</p>
          </div>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-colors rounded-xl hover:bg-white/5">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="space-y-8 relative z-10">
            {/* Section 1 */}
            <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-xl shrink-0 border border-indigo-500/20">🔭</div>
                <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wide mb-2">1. Buscador de Scrapping</h3>
                    <p className="text-xs text-white/70 leading-relaxed">
                        El sistema es un motor de búsqueda que recopila información en tiempo real de fuentes públicas como <strong className="text-white">Google Maps, Google Business Profiles, Directorios Locales y Redes Sociales</strong>. 
                        Simplemente ingresa una Zona y un Rubro para que el rastreador encuentre negocios activos.
                    </p>
                </div>
            </div>

            {/* Section 2 */}
            <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-xl shrink-0 border border-emerald-500/20">💾</div>
                <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wide mb-2">2. Guardar Oportunidades</h3>
                    <p className="text-xs text-white/70 leading-relaxed">
                        Una vez desplegados los resultados, verás una lista preliminar. Es necesario <strong className="text-white">GUARDAR</strong> manualmente aquellas oportunidades con las que desees trabajar. 
                        Solo los prospectos guardados ingresan a tu Archivo CRM; el resto se descarta al salir.
                    </p>
                </div>
            </div>

             {/* Section 3 */}
             <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-xl shrink-0 border border-orange-500/20">🗂️</div>
                <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wide mb-2">3. Organización por Carpetas</h3>
                    <p className="text-xs text-white/70 leading-relaxed">
                        Una vez empieces a trabajar en ellos, los prospectos serán agrupados automáticamente en diferentes carpetas según su estado:
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                        <div className="bg-white/5 p-2 rounded border border-white/5 text-[10px] text-white/60"><span className="text-white font-bold">❄️ FRÍO:</span> Recién guardado, sin gestión.</div>
                        <div className="bg-white/5 p-2 rounded border border-white/5 text-[10px] text-white/60"><span className="text-blue-300 font-bold">📨 CONTACTADO:</span> Ya enviaste mensaje.</div>
                        <div className="bg-white/5 p-2 rounded border border-white/5 text-[10px] text-white/60"><span className="text-amber-300 font-bold">🤝 NEGOCIACIÓN:</span> Hay interés real.</div>
                        <div className="bg-white/5 p-2 rounded border border-white/5 text-[10px] text-white/60"><span className="text-emerald-300 font-bold">⭐ CLIENTE:</span> Venta cerrada.</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
            <button onClick={onClose} className="px-6 py-2.5 bg-white text-black text-xs font-black uppercase rounded-xl hover:bg-indigo-50 hover:text-indigo-900 transition-all shadow-lg tracking-wide">
                Entendido, Continuar
            </button>
        </div>
      </div>
    </div>
  );
};

export default HowToUseModal;
