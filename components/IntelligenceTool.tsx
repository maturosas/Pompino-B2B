
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { scrapeLeads } from '../services/geminiService';
import { Lead, OperationLog, User } from '../types';
import HowToUseModal from './HowToUseModal';
import { PROJECT_CONFIG } from '../projectConfig';

interface IntelligenceToolProps {
  leads: Lead[];
  onUpdateLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  onSaveToCRM: (lead: Lead) => void;
  allSavedLeads: Lead[]; 
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
  
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedZones = localStorage.getItem('pompino_history_zones');
    const savedTypes = localStorage.getItem('pompino_history_types');
    if (savedZones) { try { setHistoryZones(JSON.parse(savedZones)); } catch (e) {} }
    if (savedTypes) { try { setHistoryTypes(JSON.parse(savedTypes)); } catch (e) {} }
  }, []);

  useEffect(() => {
    if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  const addLog = (msg: string) => setLog(prev => [...prev.slice(-50), msg]);

  const suggestedZones = useMemo(() => {
      const zones = new Set<string>();
      historyZones.forEach(z => zones.add(z));
      if (PROJECT_CONFIG.defaultZone) zones.add(PROJECT_CONFIG.defaultZone);
      return Array.from(zones).sort().slice(0, 20);
  }, [historyZones]);

  const suggestedTypes = useMemo(() => {
      const types = new Set<string>();
      historyTypes.forEach(t => types.add(t));
      return Array.from(types).sort().slice(0, 20);
  }, [historyTypes]);

  const learningContext = useMemo(() => {
    if (allSavedLeads.length < 5) return null;
    const successLeads = allSavedLeads.filter(l => l.status === 'client' || l.status === 'negotiation');
    const sourceData = successLeads.length >= 3 ? successLeads : allSavedLeads;
    const categoryCounts: Record<string, number> = {};
    sourceData.forEach(l => {
        if (!l.category) return;
        const cat = l.category.toLowerCase().trim();
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    const topCategories = Object.entries(categoryCounts).sort(([,a], [,b]) => b - a).slice(0, 3).map(([cat]) => cat);
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
    if (e.key === 'Enter' && !isSearching && zone && type) runPipeline();
  };

  const getLeadStatus = (lead: Lead) => {
      const existing = allSavedLeads.find(l => l.name === lead.name || l.id === lead.id);
      if (!existing) return { status: 'free', owner: null };
      if (existing.owner === currentUser) return { status: 'owned', owner: currentUser };
      return { status: 'locked', owner: existing.owner };
  };

  return (
    <div className="space-y-8 animate-in pb-10">
      <HowToUseModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {/* Search Input Section */}
      <div className="glass-solid rounded-3xl p-6 md:p-8 relative overflow-hidden border border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                        Motor de Inteligencia
                    </h2>
                    <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest mt-1">Búsqueda de Datos en Tiempo Real v6.0</p>
                </div>
                {learningContext && (
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 border border-emerald-500/20 bg-emerald-500/5 rounded-lg">
                         <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">IA Contextual:</span>
                         <span className="text-[9px] text-white/50 truncate max-w-[150px]">{learningContext}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 relative z-10">
                <div className="lg:col-span-5 group">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block ml-1">Zona Geográfica</label>
                    <input 
                        value={zone} 
                        onChange={(e) => setZone(e.target.value)} 
                        onKeyDown={handleKeyDown}
                        list="history-zones-list" 
                        placeholder="Ej: Palermo Hollywood" 
                        className="w-full h-14 bg-black border border-white/10 focus:border-white/30 rounded-xl px-5 text-sm text-white placeholder:text-white/20 outline-none transition-all" 
                    />
                    <datalist id="history-zones-list">
                        {suggestedZones.map(z => <option key={`dl-z-${z}`} value={z} />)}
                    </datalist>
                </div>
                <div className="lg:col-span-5 group">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block ml-1">Rubro / Categoría</label>
                    <input 
                        value={type} 
                        onChange={(e) => setType(e.target.value)} 
                        onKeyDown={handleKeyDown}
                        list="history-types-list" 
                        placeholder="Ej: Vinotecas, Restaurantes" 
                        className="w-full h-14 bg-black border border-white/10 focus:border-white/30 rounded-xl px-5 text-sm text-white placeholder:text-white/20 outline-none transition-all" 
                    />
                    <datalist id="history-types-list">
                        {suggestedTypes.map(t => <option key={`dl-t-${t}`} value={t} />)}
                    </datalist>
                </div>
                <div className="lg:col-span-2 flex items-end">
                    <button onClick={runPipeline} disabled={isSearching || !zone || !type} className={`w-full h-14 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${isSearching ? 'bg-white/5 text-white/20' : 'bg-white text-black hover:bg-gray-200 shadow-lg'}`}>
                        {isSearching ? 'Procesando...' : 'Iniciar Rastreo'}
                    </button>
                </div>
            </div>
             
             {/* TERMINAL */}
             <div className="mt-8 border-t border-white/5 pt-4">
                <div className="bg-[#050505] border border-white/10 rounded-lg p-4 h-32 overflow-y-auto custom-scroll font-mono text-[9px] text-white/60 space-y-1">
                    {log.length === 0 ? (
                        <div className="h-full flex items-center justify-center opacity-30">
                            <span className="uppercase tracking-widest">Sistema en espera</span>
                        </div>
                    ) : (
                        log.map((m, i) => (
                            <div key={i} className="flex gap-2">
                                <span className="text-white/20 select-none">{'>'}</span>
                                <span className={m.includes('ERROR') ? 'text-red-400' : 'text-white/80'}>{m}</span>
                            </div>
                        ))
                    )}
                    <div ref={logEndRef} />
                </div>
             </div>
      </div>

      {/* Results */}
      {leads.length > 0 && (
          <div className="space-y-4">
             <div className="flex items-center justify-between px-2">
                 <h3 className="text-xs font-black text-white uppercase tracking-widest">Resultados ({leads.length})</h3>
                 <button onClick={() => onUpdateLeads([])} className="text-[9px] font-bold text-white/30 hover:text-red-400 uppercase transition-colors">Limpiar Resultados</button>
             </div>

             <div className="hidden md:block border border-white/10 rounded-2xl overflow-hidden bg-[#050505]">
                <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/[0.02] text-white/30 text-[9px] font-black uppercase tracking-widest border-b border-white/5">
                        <th className="px-6 py-4 w-[35%]">Entidad</th>
                        <th className="px-6 py-4 w-[25%]">Contacto</th>
                        <th className="px-6 py-4 w-[25%]">Ubicación</th>
                        <th className="px-6 py-4 text-right w-[15%]">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs">
                        {leads.map((lead) => {
                          const { status, owner } = getLeadStatus(lead);
                          return (
                          <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-6 py-3">
                                <div className="font-bold text-white">{lead.name}</div>
                                <div className="text-[9px] text-white/40 uppercase">{lead.category}</div>
                            </td>
                            <td className="px-6 py-3 font-mono text-white/70">{lead.phone || '---'}</td>
                            <td className="px-6 py-3">
                              <a href={getMapsUrl(lead.name, lead.location)} target="_blank" className="text-white/50 hover:text-white transition-colors truncate block max-w-[200px] text-[10px]">
                                {lead.location}
                              </a>
                            </td>
                            <td className="px-6 py-3 text-right">
                              {status === 'free' && (
                                <button onClick={() => onSaveToCRM(lead)} className="px-4 py-1.5 bg-white/10 hover:bg-white text-white hover:text-black rounded text-[9px] font-black uppercase transition-all">
                                    Guardar
                                </button>
                              )}
                              {status === 'owned' && <span className="text-emerald-500 text-[9px] font-black uppercase">✓ Guardado</span>}
                              {status === 'locked' && <span className="text-white/20 text-[9px] font-black uppercase">🔒 {owner}</span>}
                            </td>
                          </tr>
                        )})}
                    </tbody>
                </table>
             </div>

             {/* Mobile Cards */}
             <div className="md:hidden space-y-3">
                  {leads.map((lead) => {
                      const { status, owner } = getLeadStatus(lead);
                      return (
                        <div key={lead.id} className="bg-[#050505] border border-white/10 rounded-xl p-4 flex flex-col gap-3">
                            <div>
                                <h4 className="font-bold text-white text-sm">{lead.name}</h4>
                                <p className="text-[10px] text-white/40 uppercase">{lead.category}</p>
                            </div>
                            <div className="text-[11px] text-white/60 space-y-1">
                                <p>{lead.location}</p>
                                <p className="font-mono">{lead.phone}</p>
                            </div>
                            <div className="pt-2 border-t border-white/5 flex justify-end">
                                {status === 'free' && (
                                    <button onClick={() => onSaveToCRM(lead)} className="w-full py-2 bg-white text-black font-black uppercase text-[10px] rounded">Guardar</button>
                                )}
                                {status === 'owned' && <span className="text-emerald-500 text-[10px] font-black uppercase">✓ Guardado</span>}
                                {status === 'locked' && <span className="text-white/30 text-[10px] font-black uppercase">🔒 {owner}</span>}
                            </div>
                        </div>
                      )
                  })}
             </div>
          </div>
      )}
    </div>
  );
};
