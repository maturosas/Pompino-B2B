
import React, { useState, useEffect } from 'react';
import { scrapeLeads } from '../services/geminiService';
import { Lead, OperationLog, User } from '../types';

interface IntelligenceToolProps {
  leads: Lead[];
  onUpdateLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  onSaveToCRM: (lead: Lead) => void;
  savedIds: Set<string>;
  logAction: (action: OperationLog['action'], details: string) => void;
  currentUser: User;
}

const IntelligenceTool: React.FC<IntelligenceToolProps> = ({ leads, onUpdateLeads, onSaveToCRM, savedIds, logAction, currentUser }) => {
  const [zone, setZone] = useState('');
  const [type, setType] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Historial de búsquedas (Listas separadas para sugerencias granulares)
  const [historyZones, setHistoryZones] = useState<string[]>([]);
  const [historyTypes, setHistoryTypes] = useState<string[]>([]);

  // 1. Efecto de Montaje: Persistencia y Repoblación
  useEffect(() => {
    const savedZones = localStorage.getItem('pompino_history_zones');
    const savedTypes = localStorage.getItem('pompino_history_types');
    
    let loadedZones: string[] = [];
    let loadedTypes: string[] = [];

    if (savedZones) {
      try {
        loadedZones = JSON.parse(savedZones);
        setHistoryZones(loadedZones);
      } catch (e) { console.error("Error al cargar historial de zonas", e); }
    }
    
    if (savedTypes) {
      try {
        loadedTypes = JSON.parse(savedTypes);
        setHistoryTypes(loadedTypes);
      } catch (e) { console.error("Error al cargar historial de rubros", e); }
    }

    if (loadedZones.length > 0) setZone(loadedZones[0]);
    if (loadedTypes.length > 0) setType(loadedTypes[0]);
  }, []);

  const addLog = (msg: string) => setLog(prev => [...prev.slice(-8), msg]);

  // 2. Función de Persistencia Inteligente
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

  return (
    <div className="space-y-4 md:space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      {/* Consola de Búsqueda */}
      <div className="p-4 md:p-6 lg:p-8 border border-white/10 rounded-2xl lg:rounded-3xl bg-[#0a0a0a] shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-6">
          <div className="md:col-span-1 lg:col-span-5 flex flex-col gap-2">
            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Zona de prospección</label>
            <input 
              value={zone} 
              onChange={(e) => setZone(e.target.value)} 
              list="history-zones-list"
              placeholder="Ej: Lomas de Zamora, Buenos Aires" 
              className="w-full h-12 lg:h-14 bg-black border border-white/10 px-4 rounded-xl text-sm font-bold text-white focus:border-white outline-none transition-all placeholder:text-white/5" 
            />
            <datalist id="history-zones-list">
              {historyZones.map(z => <option key={`dl-z-${z}`} value={z} />)}
            </datalist>
          </div>
          <div className="md:col-span-1 lg:col-span-5 flex flex-col gap-2">
            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Rubro / Target B2B</label>
            <input 
              value={type} 
              onChange={(e) => setType(e.target.value)} 
              list="history-types-list"
              placeholder="Ej: Bares, Kioscos, Distribuidoras" 
              className="w-full h-12 lg:h-14 bg-black border border-white/10 px-4 rounded-xl text-sm font-bold text-white focus:border-white outline-none transition-all placeholder:text-white/5" 
            />
            <datalist id="history-types-list">
              {historyTypes.map(t => <option key={`dl-t-${t}`} value={t} />)}
            </datalist>
          </div>
          <div className="md:col-span-2 lg:col-span-2 flex items-end">
            <button 
              onClick={runPipeline} 
              disabled={isSearching || !zone || !type} 
              className={`w-full h-12 lg:h-14 rounded-xl font-black uppercase text-[11px] tracking-widest transition-all ${isSearching ? 'bg-white/5 text-white/20' : 'bg-white text-black hover:bg-white/90 active:scale-95 shadow-[0_4px_20px_rgba(255,255,255,0.1)]'}`}
            >
              {isSearching ? 'RASTREANDO...' : 'LIVE SEARCH'}
            </button>
          </div>
        </div>
        
        {/* Terminal de Logs */}
        {log.length > 0 && (
          <div className="mt-6 p-4 bg-black border border-white/5 rounded-xl font-mono text-[10px] text-white/50 space-y-1 overflow-hidden">
            {log.map((m, i) => (
              <div key={i} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="text-white/20 shrink-0">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                <span className="truncate">{m}</span>
              </div>
            ))}
            {isSearching && <div className="animate-pulse inline-block w-2 h-3 bg-white ml-1 mt-1"></div>}
          </div>
        )}

        {/* Sugerencias de Acceso Rápido */}
        {(historyZones.length > 0 || historyTypes.length > 0) && (
          <div className="mt-6 pt-4 border-t border-white/5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[8px] font-black text-white/20 uppercase tracking-widest italic">Sugerencias Recientes:</span>
              <div className="flex flex-wrap gap-2">
                  {historyZones.slice(0, 3).map(hz => (
                    <button 
                        key={`chip-z-${hz}`} 
                        onClick={() => setZone(hz)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-[9px] font-bold text-white/60 transition-all flex items-center gap-1.5"
                    >
                        <span className="opacity-30">📍</span> {hz}
                    </button>
                  ))}
                  {historyTypes.slice(0, 3).map(ht => (
                    <button 
                        key={`chip-t-${ht}`} 
                        onClick={() => setType(ht)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-[9px] font-bold text-white/40 transition-all flex items-center gap-1.5"
                    >
                        <span className="opacity-30">📂</span> {ht}
                    </button>
                  ))}
                  <button 
                      onClick={() => {
                        localStorage.removeItem('pompino_history_zones');
                        localStorage.removeItem('pompino_history_types');
                        setHistoryZones([]);
                        setHistoryTypes([]);
                      }}
                      className="px-3 py-1.5 hover:text-red-400 text-[8px] font-black uppercase tracking-widest transition-colors opacity-20 hover:opacity-100"
                    >
                      Limpiar
                  </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Resultados: Card View para Mobile, Table View para Desktop */}
      <div className="border-t border-white/10 md:border-none pt-4 md:pt-0">
         {leads.length === 0 ? (
            <div className="p-8 md:p-24 border border-white/10 rounded-2xl bg-[#0a0a0a] text-center">
              <p className="text-white/10 font-black uppercase tracking-[0.5em] italic">
                 {isSearching ? 'CONECTANDO CON SATÉLITE DE DATOS...' : 'Esperando comandos de rastreo...'}
              </p>
            </div>
         ) : (
           <>
              {/* MOBILE CARDS */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {leads.map((lead) => (
                  <div key={lead.id} className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4 flex flex-col gap-3 shadow-lg">
                    <div className="flex justify-between items-start">
                       <div>
                          <h3 className="font-bold text-white text-sm uppercase leading-tight">{lead.name}</h3>
                          <p className="text-[10px] text-white/40 uppercase font-black mt-1">{lead.category}</p>
                       </div>
                       <button 
                          onClick={() => onSaveToCRM(lead)} 
                          disabled={savedIds.has(lead.id)}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wide transition-colors ${
                             savedIds.has(lead.id) 
                              ? 'bg-white/5 text-white/20' 
                              : 'bg-white text-black hover:bg-white/90'
                          }`}
                       >
                          {savedIds.has(lead.id) ? 'GUARDADO' : 'ARCHIVAR'}
                       </button>
                    </div>
                    
                    <div className="space-y-2 pt-2 border-t border-white/5">
                        {lead.location && (
                           <div className="flex items-start gap-2">
                              <span className="text-xs mt-0.5">📍</span>
                              <a 
                                href={getMapsUrl(lead.name, lead.location)} 
                                target="_blank"
                                className="text-[11px] text-white/70 underline decoration-white/20 underline-offset-2 break-words leading-tight"
                              >
                                {lead.location}
                              </a>
                           </div>
                        )}
                        <div className="flex items-center gap-3">
                           <div className="flex items-center gap-1.5">
                              <span className="text-xs">📞</span>
                              <span className="text-[11px] font-mono text-white/80">{lead.phone || 'N/A'}</span>
                           </div>
                           {lead.phone && (
                              <a href={getWhatsAppLink(lead.phone)} target="_blank" className="text-[9px] font-black bg-[#25D366]/20 text-[#25D366] px-1.5 py-0.5 rounded hover:bg-[#25D366]/30">
                                 WHATSAPP
                              </a>
                           )}
                        </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP TABLE */}
              <div className="hidden md:block border border-white/10 rounded-2xl overflow-hidden bg-[#0a0a0a] shadow-xl">
                <div className="overflow-x-auto custom-scroll">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                      <tr className="bg-white/5 text-white/30 text-[9px] font-black uppercase tracking-widest border-b border-white/10">
                        <th className="px-5 py-4 w-[25%] whitespace-nowrap">Entidad / Rubro</th>
                        <th className="px-5 py-4 w-[25%] whitespace-nowrap">Contacto Directo</th>
                        <th className="px-5 py-4 w-[30%] whitespace-nowrap">Ubicación</th>
                        <th className="px-5 py-4 text-right whitespace-nowrap">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {leads.map((lead, idx) => (
                          <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors group animate-in slide-in-from-top-2 fade-in duration-500">
                            <td className="px-5 py-4">
                              <div className="font-bold text-white text-xs truncate max-w-[200px] uppercase italic leading-tight group-hover:text-white flex items-center gap-2">
                                {lead.name}
                                {isSearching && idx === 0 && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>}
                              </div>
                              <div className="text-[9px] text-white/40 uppercase font-bold truncate max-w-[200px]">
                                {lead.category}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-mono text-[10px]">{lead.phone || '---'}</span>
                                  {lead.phone && (
                                    <a 
                                      href={getWhatsAppLink(lead.phone)}
                                      target="_blank" 
                                      className="text-[8px] bg-white text-black px-1 rounded font-black opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      WA
                                    </a>
                                  )}
                                </div>
                                <span className="text-white/30 font-mono text-[9px] truncate max-w-[180px]">
                                  {lead.email || ''}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2 group/loc">
                                <p className="text-[10px] text-white/60 truncate max-w-[220px] leading-tight">
                                  {lead.location}
                                </p>
                                <a 
                                  href={getMapsUrl(lead.name, lead.location)} 
                                  target="_blank" 
                                  className="shrink-0 p-1 border border-white/10 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-black"
                                >
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  </svg>
                                </a>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <button 
                                onClick={() => onSaveToCRM(lead)} 
                                disabled={savedIds.has(lead.id)}
                                className={`inline-flex items-center justify-center min-w-[80px] h-8 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all ${
                                  savedIds.has(lead.id) 
                                    ? 'bg-white/5 text-white/20 border border-transparent cursor-default' 
                                    : 'border border-white/40 text-white hover:bg-white hover:text-black hover:border-white active:scale-95'
                                }`}
                              >
                                {savedIds.has(lead.id) ? 'GUARDADO' : 'ARCHIVAR'}
                              </button>
                            </td>
                          </tr>
                        ))}
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
