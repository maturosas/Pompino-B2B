
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { scrapeLeads } from '../services/geminiService';
import { Lead, OperationLog, User } from '../types';
import HowToUseModal from './HowToUseModal';
import { PROJECT_CONFIG } from '../projectConfig';

interface IntelligenceToolProps {
  leads: Lead[];
  onUpdateLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  onSaveToCRM: (lead: Lead) => void;
  allSavedLeads: Lead[]; // Needed to check ownership globally
  logAction: (action: OperationLog['action'], details: string) => void;
  currentUser: User;
}

export const IntelligenceTool: React.FC<IntelligenceToolProps> = ({ leads, onUpdateLeads, onSaveToCRM, allSavedLeads, logAction, currentUser }) => {
  const [zone, setZone] = useState('');
  const [type, setType] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  const [historyZones, setHistoryZones] = useState<string[]>([]);
  const [historyTypes, setHistoryTypes] = useState<string[]>([]);
  
  // Auto-scroll ref for terminal
  const logEndRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll effect
  useEffect(() => {
    if (logEndRef.current) {
        logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [log]);

  const addLog = (msg: string) => setLog(prev => [...prev.slice(-50), msg]); // Keep last 50 lines

  // --- SMART AUTOCOMPLETE LOGIC ---

  const suggestedZones = useMemo(() => {
      const zones = new Set<string>();
      
      // 1. Add History
      historyZones.forEach(z => zones.add(z));
      
      // 2. Add Default
      if (PROJECT_CONFIG.defaultZone) zones.add(PROJECT_CONFIG.defaultZone);

      // 3. Extract from CRM Data
      allSavedLeads.forEach(lead => {
          // If deliveryZone exists, it's a high quality signal
          if (lead.deliveryZone) {
              zones.add(lead.deliveryZone);
          }
          
          // Parse Location string (e.g. "Av Santa Fe 1234, Palermo, CABA")
          if (lead.location) {
              const parts = lead.location.split(',').map(s => s.trim());
              // Heuristic: Ignore parts with numbers (street addresses)
              // Keep parts that look like neighborhoods or cities
              parts.forEach(part => {
                  if (part.length > 3 && !/\d/.test(part) && part.length < 30) {
                      zones.add(part);
                  }
              });
          }
      });

      return Array.from(zones).sort().slice(0, 50); // Limit to top 50 to avoid lag
  }, [historyZones, allSavedLeads]);

  const suggestedTypes = useMemo(() => {
      const types = new Set<string>();

      // 1. Add History
      historyTypes.forEach(t => types.add(t));

      // 2. Add from CRM
      allSavedLeads.forEach(l => {
          if (l.category) types.add(l.category);
      });

      // 3. Add from Current Scrape Results
      leads.forEach(l => {
          if (l.category) types.add(l.category);
      });

      return Array.from(types).sort().slice(0, 50);
  }, [historyTypes, allSavedLeads, leads]);


  // --- AI LEARNING LOGIC ---
  const learningContext = useMemo(() => {
    if (allSavedLeads.length < 5) return null; // Necesita un mínimo de datos para aprender

    // 1. Filtrar los "mejores" leads (Clientes o Negociación) para aprender de lo que funciona
    const successLeads = allSavedLeads.filter(l => l.status === 'client' || l.status === 'negotiation');
    // Si no hay suficientes clientes, usamos todos los guardados
    const sourceData = successLeads.length >= 3 ? successLeads : allSavedLeads;

    // 2. Contar frecuencia de categorías
    const categoryCounts: Record<string, number> = {};
    sourceData.forEach(l => {
        if (!l.category) return;
        const cat = l.category.toLowerCase().trim();
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    // 3. Obtener top 3 categorías
    const topCategories = Object.entries(categoryCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([cat]) => cat);
    
    if (topCategories.length === 0) return null;

    return topCategories.join(", ");
  }, [allSavedLeads]);


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
    logAction('SEARCH', `Búsqueda: ${cleanType} en ${cleanZone}`);
    
    try {
      saveToHistory(cleanZone, cleanType);
      const handleLeadFound = (newLead: Lead) => {
        onUpdateLeads((currentLeads) => [newLead, ...currentLeads]);
      };
      // Pasar el learningContext calculado al servicio
      await scrapeLeads(cleanZone, cleanType, handleLeadFound, (msg) => addLog(msg), learningContext || undefined);
    } catch (err: any) {
      addLog(`> [ERROR CRÍTICO] ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const getMapsUrl = (name: string, location: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + location)}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSearching && zone && type) {
        runPipeline();
    }
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

      {/* Search Command Center */}
      <div className="p-1 rounded-3xl bg-gradient-to-b from-white/10 to-transparent shadow-2xl">
          <div className="glass-solid rounded-[22px] p-4 md:p-8 relative overflow-hidden">
             {/* REMOVED BLUE GLOW */}
            
            <div className="flex justify-between items-center mb-6 relative z-10">
                <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-black text-white/90 uppercase italic tracking-tighter flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1]"></span>
                        Configuración de Rastreo
                    </h2>
                    {learningContext && (
                        <div className="flex items-center gap-1.5 animate-in fade-in duration-700">
                             <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-black uppercase tracking-wide flex items-center gap-1">
                                 🧠 AI Learning Activo
                             </span>
                             <span className="text-[9px] text-white/30 truncate max-w-[200px]">
                                 Preferencia por: {learningContext}
                             </span>
                        </div>
                    )}
                </div>
                <button 
                  onClick={() => setShowHelp(true)} 
                  className="px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-[10px] font-bold text-indigo-300 uppercase tracking-wide transition-all hover:text-white"
                >
                  💡 Ayuda
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 relative z-10">
                <div className="lg:col-span-5 group">
                    <label className="text-[10px] font-bold text-indigo-300/80 uppercase tracking-widest mb-1.5 block ml-1 group-focus-within:text-indigo-400 transition-colors">Zona Geográfica</label>
                    <div className="relative">
                        <input 
                            value={zone} 
                            onChange={(e) => setZone(e.target.value)} 
                            onKeyDown={handleKeyDown}
                            list="history-zones-list" 
                            placeholder="Ej: Palermo Hollywood, CABA" 
                            className="w-full h-14 bg-black/50 border border-white/10 hover:border-white/20 focus:border-indigo-500/50 rounded-2xl px-5 text-sm font-medium text-white placeholder:text-white/20 outline-none transition-all shadow-inner focus:shadow-[0_0_20px_rgba(99,102,241,0.1)]" 
                        />
                         <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none">📍</div>
                    </div>
                    <datalist id="history-zones-list">
                        {suggestedZones.map(z => <option key={`dl-z-${z}`} value={z} />)}
                    </datalist>
                </div>
                <div className="lg:col-span-5 group">
                    <label className="text-[10px] font-bold text-indigo-300/80 uppercase tracking-widest mb-1.5 block ml-1 group-focus-within:text-indigo-400 transition-colors">Rubro o Nombre del Negocio</label>
                    <div className="relative">
                        <input 
                            value={type} 
                            onChange={(e) => setType(e.target.value)} 
                            onKeyDown={handleKeyDown}
                            list="history-types-list" 
                            placeholder="Ej: BZS, Vinotecas, Bares, El Club de la Milanesa" 
                            className="w-full h-14 bg-black/50 border border-white/10 hover:border-white/20 focus:border-indigo-500/50 rounded-2xl px-5 text-sm font-medium text-white placeholder:text-white/20 outline-none transition-all shadow-inner focus:shadow-[0_0_20px_rgba(99,102,241,0.1)]" 
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none">🏢</div>
                    </div>
                    <datalist id="history-types-list">
                        {suggestedTypes.map(t => <option key={`dl-t-${t}`} value={t} />)}
                    </datalist>
                </div>
                <div className="lg:col-span-2 flex items-end">
                    <button onClick={runPipeline} disabled={isSearching || !zone || !type} className={`w-full h-14 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all relative overflow-hidden group ${isSearching ? 'bg-white/5 text-white/20 cursor-wait' : 'bg-white text-black hover:bg-indigo-50 hover:text-indigo-900 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(99,102,241,0.3)]'}`}>
                    <span className="relative z-10 flex items-center justify-center gap-2">{isSearching ? 'Rastreando...' : <>BUSCAR <span className="hidden lg:inline">AHORA</span> 🚀</>}</span>
                    </button>
                </div>
            </div>
             
             {/* TERMINAL VIEW (LOGS) */}
             <div className="mt-6 border border-white/10 rounded-xl overflow-hidden bg-[#050505] shadow-inner">
                <div className="bg-white/5 border-b border-white/5 p-2 flex justify-between items-center px-4">
                    <div className="flex items-center gap-2">
                         <div className={`w-2 h-2 rounded-full ${isSearching ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                         <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Consola de Operaciones</span>
                    </div>
                    <button onClick={() => setLog([])} className="text-[9px] text-white/30 hover:text-white uppercase font-bold transition-colors">Limpiar</button>
                </div>
                <div className="h-40 overflow-y-auto p-4 font-mono text-[10px] space-y-1.5 custom-scroll text-indigo-100/80">
                    {log.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-white/10">
                            <span className="text-2xl mb-2 opacity-50">💻</span>
                            <span className="uppercase tracking-widest font-bold">Terminal en espera</span>
                        </div>
                    ) : (
                        log.map((m, i) => (
                            <div key={i} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                                <span className="text-white/20 shrink-0 select-none">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}]</span>
                                <span className={`break-all ${m.includes('ERROR') ? 'text-red-400' : m.includes('SUCCESS') || m.includes('COMPLETE') ? 'text-emerald-400' : 'text-indigo-200/80'}`}>{m}</span>
                            </div>
                        ))
                    )}
                    <div ref={logEndRef} />
                    {isSearching && (
                        <div className="flex gap-1 pt-1">
                            <span className="w-1.5 h-3 bg-indigo-500 animate-pulse"></span>
                        </div>
                    )}
                </div>
             </div>
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
              {/* MOBILE CARD VIEW */}
              <div className="md:hidden space-y-3">
                  {leads.map((lead) => {
                      const { status, owner } = getLeadStatus(lead);
                      return (
                        <div key={lead.id} className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-white/5 border border-white/5 flex items-center justify-center text-xs text-white/30 font-black shrink-0">{lead.name.charAt(0)}</div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-white text-sm truncate">{lead.name}</h4>
                                        <p className="text-[10px] text-white/40 uppercase">{lead.category}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-[11px] text-white/70 space-y-1">
                                <a href={getMapsUrl(lead.name, lead.location)} target="_blank" className="flex items-center gap-2 mb-1 text-indigo-300 hover:text-white transition-colors">
                                    📍 {lead.location} <span className="text-[9px] opacity-50 underline">Ver mapa</span>
                                </a>
                                {lead.phone && <p className="flex items-center gap-2">📞 {lead.phone}</p>}
                                {lead.email && (
                                  <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-indigo-300 hover:text-white transition-colors">
                                    ✉️ {lead.email}
                                  </a>
                                )}
                            </div>
                            <div className="pt-2 border-t border-white/5 flex justify-end">
                                {status === 'free' && (
                                    <button onClick={() => onSaveToCRM(lead)} className="w-full h-9 bg-white text-black font-black uppercase text-[10px] rounded-lg">Guardar</button>
                                )}
                                {status === 'owned' && <span className="text-emerald-400 text-[10px] font-bold uppercase py-2">✓ Guardado</span>}
                                {status === 'locked' && <span className="text-white/30 text-[10px] font-bold uppercase py-2">🔒 {owner}</span>}
                            </div>
                        </div>
                      )
                  })}
              </div>

              {/* DESKTOP TABLE */}
              <div className="hidden md:block glass-solid rounded-3xl overflow-hidden shadow-2xl">
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
                                <div className="flex flex-col gap-1">
                                  <span className="text-white/90 font-mono text-xs">{lead.phone || '---'}</span>
                                  {lead.email && (
                                    <a href={`mailto:${lead.email}`} className="text-[10px] text-indigo-300 hover:text-white transition-colors flex items-center gap-1 group/email">
                                      <span className="group-hover/email:scale-110 transition-transform">✉️</span> 
                                      <span className="underline decoration-indigo-300/30 underline-offset-2">{lead.email}</span>
                                    </a>
                                  )}
                                </div>
                            </td>
                            <td className="px-6 py-4 align-middle">
                              <a href={getMapsUrl(lead.name, lead.location)} target="_blank" className="group/loc flex items-center gap-2 text-white/60 hover:text-indigo-400 transition-colors">
                                <span className="text-lg opacity-50 group-hover/loc:opacity-100 group-hover/loc:scale-110 transition-all">🗺️</span>
                                <p className="text-[11px] leading-tight truncate max-w-[250px] underline decoration-white/20 hover:decoration-indigo-400 underline-offset-2">{lead.location}</p>
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
