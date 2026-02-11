
import React, { useState, useEffect } from 'react';
import { scrapeLeads } from '../services/geminiService';
import { Lead, OperationLog, User } from '../types';
import HowToUseModal from './HowToUseModal';

interface IntelligenceToolProps {
  leads: Lead[];
  onUpdateLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  onSaveToCRM: (lead: Lead) => void;
  allSavedLeads: Lead[]; // Needed to check ownership globally
  logAction: (action: OperationLog['action'], details: string) => void;
  currentUser: User;
}

const IntelligenceTool: React.FC<IntelligenceToolProps> = ({ leads, onUpdateLeads, onSaveToCRM, allSavedLeads, logAction, currentUser }) => {
  const [zone, setZone] = useState('');
  const [type, setType] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  const [historyZones, setHistoryZones] = useState<string[]>([]);
  const [historyTypes, setHistoryTypes] = useState<string[]>([]);

  useEffect(() => {
    const savedZones = localStorage.getItem('pompino_history_zones');
    const savedTypes = localStorage.getItem('pompino_history_types');
    
    let loadedZones: string[] = [];
    let loadedTypes: string[] = [];

    if (savedZones) {
      try { loadedZones = JSON.parse(savedZones); setHistoryZones(loadedZones); } catch (e) {}
    }
    if (savedTypes) {
      try { loadedTypes = JSON.parse(savedTypes); setHistoryTypes(loadedTypes); } catch (e) {}
    }

    if (loadedZones.length > 0) setZone(loadedZones[0]);
    if (loadedTypes.length > 0) setType(loadedTypes[0]);
  }, []);

  const addLog = (msg: string) => setLog(prev => [...prev.slice(-8), msg]);

  const saveToHistory = (newZone: string, newType: string) => {
    const updatedZones = [newZone, ...historyZones.filter(z => z !== newZone)].slice(0, 10);
    const updatedTypes = [newType, ...historyTypes.filter(t => t !== newType)].slice(0, 10);
    setHistoryZones(updatedZones);
    setHistoryTypes(updatedTypes);
    localStorage.setItem('pompino_history_zones', JSON.stringify(updatedZones));
    localStorage.setItem('pompino_history_types', JSON.stringify(updatedTypes));
  };

  const runPipeline = async () => {
    const cleanZone = zone.trim();
    const cleanType = type.trim();
    if (!cleanZone || !cleanType) return;
    
    setIsSearching(true);
    setLog([]);
    addLog(`> INICIANDO MOTOR DE STREAMING...`);
    logAction('SEARCH', `Búsqueda: ${cleanType} en ${cleanZone}`);
    
    try {
      saveToHistory(cleanZone, cleanType);
      const handleLeadFound = (newLead: Lead) => {
        onUpdateLeads((currentLeads) => [newLead, ...currentLeads]);
      };
      await scrapeLeads(cleanZone, cleanType, handleLeadFound, (msg) => addLog(msg));
    } catch (err: any) {
      addLog(`> ERROR CRÍTICO: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const getMapsUrl = (name: string, location: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + location)}`;
  };

  const getWhatsAppLink = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = `Hola como estas? mi nombre es ${currentUser} queria saber si podria hablar con alguien relacionado a compras o barra? Soy de BZS y tenemos distribucion de bebidas por la zona.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  // Helper to check ownership
  const getLeadStatus = (lead: Lead) => {
      const existing = allSavedLeads.find(l => l.name === lead.name || l.id === lead.id);
      if (!existing) return { status: 'free', owner: null };
      if (existing.owner === currentUser) return { status: 'owned', owner: currentUser };
      return { status: 'locked', owner: existing.owner };
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in">
      <HowToUseModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {/* Search Command Center (Same as before) */}
      <div className="p-1 rounded-3xl bg-gradient-to-b from-white/10 to-transparent shadow-2xl">
          <div className="glass-solid rounded-[22px] p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none"></div>
            
            <div className="flex justify-between items-center mb-6 relative z-10">
                <h2 className="text-lg font-black text-white/90 uppercase italic tracking-tighter flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1]"></span>
                    Configuración de Rastreo
                </h2>
                <button 
                  onClick={() => setShowHelp(true)} 
                  className="px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-[10px] font-bold text-indigo-300 uppercase tracking-wide transition-all hover:text-white"
                >
                  💡 Cómo usar
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 relative z-10">
                <div className="lg:col-span-5 group">
                    <label className="text-[10px] font-bold text-indigo-300/80 uppercase tracking-widest mb-1.5 block ml-1 group-focus-within:text-indigo-400 transition-colors">Zona Geográfica</label>
                    <div className="relative">
                        <input value={zone} onChange={(e) => setZone(e.target.value)} list="history-zones-list" placeholder="Ej: Palermo Hollywood, CABA" className="w-full h-14 bg-black/50 border border-white/10 hover:border-white/20 focus:border-indigo-500/50 rounded-2xl px-5 text-sm font-medium text-white placeholder:text-white/20 outline-none transition-all shadow-inner focus:shadow-[0_0_20px_rgba(99,102,241,0.1)]" />
                         <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none">📍</div>
                    </div>
                    <datalist id="history-zones-list">{historyZones.map(z => <option key={`dl-z-${z}`} value={z} />)}</datalist>
                </div>
                <div className="lg:col-span-5 group">
                    <label className="text-[10px] font-bold text-indigo-300/80 uppercase tracking-widest mb-1.5 block ml-1 group-focus-within:text-indigo-400 transition-colors">Rubro Objetivo</label>
                    <div className="relative">
                        <input value={type} onChange={(e) => setType(e.target.value)} list="history-types-list" placeholder="Ej: Vinotecas, Bares, Hoteles" className="w-full h-14 bg-black/50 border border-white/10 hover:border-white/20 focus:border-indigo-500/50 rounded-2xl px-5 text-sm font-medium text-white placeholder:text-white/20 outline-none transition-all shadow-inner focus:shadow-[0_0_20px_rgba(99,102,241,0.1)]" />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none">🏢</div>
                    </div>
                    <datalist id="history-types-list">{historyTypes.map(t => <option key={`dl-t-${t}`} value={t} />)}</datalist>
                </div>
                <div className="lg:col-span-2 flex items-end">
                    <button onClick={runPipeline} disabled={isSearching || !zone || !type} className={`w-full h-14 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all relative overflow-hidden group ${isSearching ? 'bg-white/5 text-white/20 cursor-wait' : 'bg-white text-black hover:bg-indigo-50 hover:text-indigo-900 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(99,102,241,0.3)]'}`}>
                    <span className="relative z-10 flex items-center justify-center gap-2">{isSearching ? 'Rastreando...' : <>BUSCAR <span className="hidden lg:inline">AHORA</span> 🚀</>}</span>
                    </button>
                </div>
            </div>
             {/* Terminal View */}
             {log.length > 0 && (
                <div className="mt-6 p-4 bg-black/80 border border-white/10 rounded-xl font-mono text-[10px] text-indigo-200/70 space-y-1 shadow-inner max-h-32 overflow-y-auto custom-scroll">
                    {log.map((m, i) => <div key={i} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300"><span className="text-white/20 shrink-0">[{new Date().toLocaleTimeString([], { hour12: false })}]</span><span className="truncate">{m}</span></div>)}
                    {isSearching && <div className="animate-pulse inline-block w-2 h-3 bg-indigo-500 ml-1 mt-1"></div>}
                </div>
            )}
          </div>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
         {leads.length > 0 && (
             <div className="flex items-center justify-between px-2">
                 <h3 className="text-sm font-black text-white/80 uppercase italic">Resultados Encontrados <span className="text-white/30 text-xs not-italic font-bold">({leads.length})</span></h3>
                 <span className="text-[10px] font-mono text-white/40">Live Sync Active</span>
             </div>
         )}

         {leads.length === 0 ? (
            <div className="py-24 border border-dashed border-white/10 rounded-3xl bg-white/[0.01] text-center flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-2xl opacity-30">📡</div>
              <p className="text-white/20 font-bold uppercase tracking-[0.2em] text-xs">{isSearching ? 'Estableciendo enlace satelital...' : 'Sistema en espera de comandos'}</p>
            </div>
         ) : (
           <>
              {/* DESKTOP TABLE */}
              <div className="glass-solid rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto custom-scroll">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                      <tr className="bg-white/[0.02] text-white/40 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                        <th className="px-6 py-5 w-[30%]">Entidad Comercial</th>
                        <th className="px-6 py-5 w-[25%]">Contacto</th>
                        <th className="px-6 py-5 w-[30%]">Ubicación</th>
                        <th className="px-6 py-5 text-right w-[15%]">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                        {leads.map((lead, idx) => {
                          const { status, owner } = getLeadStatus(lead);
                          return (
                          <tr key={lead.id} className="hover:bg-indigo-500/[0.03] transition-colors group animate-in slide-in-from-top-2 fade-in duration-500">
                            <td className="px-6 py-4 align-middle">
                              <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded bg-white/5 border border-white/5 flex items-center justify-center text-xs text-white/30 font-black">{lead.name.charAt(0)}</div>
                                  <div>
                                    <div className="font-bold text-white text-[13px] truncate max-w-[220px] leading-tight group-hover:text-indigo-200 transition-colors">{lead.name}</div>
                                    <div className="text-[10px] text-white/40 uppercase font-medium mt-0.5 flex items-center gap-2">{lead.category}</div>
                                  </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 align-middle">
                                <span className="text-white/90 font-mono text-xs">{lead.phone || '---'}</span>
                            </td>
                            <td className="px-6 py-4 align-middle">
                              <a href={getMapsUrl(lead.name, lead.location)} target="_blank" className="group/loc flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                                <p className="text-[11px] leading-tight truncate max-w-[250px]">{lead.location}</p>
                              </a>
                            </td>
                            <td className="px-6 py-4 align-middle text-right">
                              {status === 'free' && (
                                <button onClick={() => onSaveToCRM(lead)} className="inline-flex items-center justify-center h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all shadow-lg bg-white text-black hover:bg-indigo-50 hover:text-indigo-900">
                                    Guardar
                                </button>
                              )}
                              {status === 'owned' && (
                                  <span className="inline-flex items-center justify-center h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                      ✓ Archivado
                                  </span>
                              )}
                              {status === 'locked' && (
                                   <span className="inline-flex items-center justify-center h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-wide bg-white/5 text-white/30 cursor-not-allowed">
                                      🔒 {owner}
                                   </span>
                              )}
                            </td>
                          </tr>
                        )})}
                    </tbody>
                  </table>
                </div>
              </div>
           </>
         )}
      </div>
    </div>
  );
};

export default IntelligenceTool;
