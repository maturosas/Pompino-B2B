
import React, { useState, useEffect, useMemo } from 'react';
import { scrapeLeads } from '../services/geminiService';
import { Lead } from '../types';

interface IntelligenceToolProps {
  leads: Lead[];
  onUpdateLeads: (leads: Lead[]) => void;
  onSaveToCRM: (lead: Lead) => void;
  savedIds: Set<string>;
}

const IntelligenceTool: React.FC<IntelligenceToolProps> = ({ leads, onUpdateLeads, onSaveToCRM, savedIds }) => {
  const [zone, setZone] = useState('');
  const [type, setType] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Historial de búsquedas
  const [historyZones, setHistoryZones] = useState<string[]>([]);
  const [historyTypes, setHistoryTypes] = useState<string[]>([]);

  // Cargar historial al montar
  useEffect(() => {
    const savedZones = localStorage.getItem('pompino_history_zones');
    const savedTypes = localStorage.getItem('pompino_history_types');
    if (savedZones) setHistoryZones(JSON.parse(savedZones));
    if (savedTypes) setHistoryTypes(JSON.parse(savedTypes));
  }, []);

  const addLog = (msg: string) => setLog(prev => [...prev.slice(-8), msg]);

  const saveToHistory = (newZone: string, newType: string) => {
    const updatedZones = Array.from(new Set([newZone, ...historyZones])).slice(0, 10);
    const updatedTypes = Array.from(new Set([newType, ...historyTypes])).slice(0, 10);
    
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
    addLog(`> CONECTANDO CON GEMINI 3 PRO...`);
    addLog(`> ANALIZANDO MAPAS Y DIRECTORIOS LOCALES...`);
    addLog(`> ESCANEANDO REDES SOCIALES EN ${cleanZone.toUpperCase()}...`);
    
    try {
      const newLeads = await scrapeLeads(cleanZone, cleanType, true);
      onUpdateLeads([...newLeads, ...leads]);
      addLog(`> ÉXITO: ${newLeads.length} PROSPECTOS IDENTIFICADOS.`);
      addLog(`> SINCRONIZANDO CON BASE DE DATOS...`);
      
      saveToHistory(cleanZone, cleanType);
    } catch (err: any) {
      addLog(`> ERROR CRÍTICO: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const getMapsUrl = (name: string, location: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + location)}`;
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      {/* Search Bar */}
      <div className="p-4 lg:p-8 border border-white/10 rounded-2xl lg:rounded-3xl bg-[#0a0a0a] shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          <div className="lg:col-span-5 flex flex-col gap-2">
            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Ubicación (Sé específico)</label>
            <input 
              value={zone} 
              onChange={(e) => setZone(e.target.value)} 
              list="history-zones"
              placeholder="Ej: Lomas de Zamora, Buenos Aires" 
              className="w-full h-12 lg:h-14 bg-black border border-white/10 px-4 rounded-xl text-sm font-bold text-white focus:border-white outline-none transition-all placeholder:text-white/5" 
            />
            <datalist id="history-zones">
              {historyZones.map(z => <option key={z} value={z} />)}
            </datalist>
          </div>
          <div className="lg:col-span-5 flex flex-col gap-2">
            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Nicho / Rubro</label>
            <input 
              value={type} 
              onChange={(e) => setType(e.target.value)} 
              list="history-types"
              placeholder="Ej: Bares y Restos" 
              className="w-full h-12 lg:h-14 bg-black border border-white/10 px-4 rounded-xl text-sm font-bold text-white focus:border-white outline-none transition-all placeholder:text-white/5" 
            />
            <datalist id="history-types">
              {historyTypes.map(t => <option key={t} value={t} />)}
            </datalist>
          </div>
          <div className="lg:col-span-2 flex items-end">
            <button 
              onClick={runPipeline} 
              disabled={isSearching || !zone || !type} 
              className={`w-full h-12 lg:h-14 rounded-xl font-black uppercase text-[11px] tracking-widest transition-all ${isSearching ? 'bg-white/5 text-white/20' : 'bg-white text-black hover:bg-white/90 active:scale-95 shadow-[0_4px_20px_rgba(255,255,255,0.1)]'}`}
            >
              {isSearching ? 'BUSCANDO...' : 'RASTREAR'}
            </button>
          </div>
        </div>
        
        {log.length > 0 && (
          <div className="mt-6 p-4 bg-black border border-white/5 rounded-xl font-mono text-[10px] text-white/50 space-y-1">
            {log.map((m, i) => <div key={i} className="flex gap-3">
              <span className="text-white/20">[{new Date().toLocaleTimeString()}]</span>
              <span className="truncate">{m}</span>
            </div>)}
            {isSearching && <div className="animate-pulse inline-block w-2 h-3 bg-white ml-1"></div>}
          </div>
        )}

        {/* Sugerencias Rápidas de Historial */}
        {(historyZones.length > 0 || historyTypes.length > 0) && (
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest self-center mr-2">Historial:</span>
            {historyZones.slice(0, 3).map(hz => (
              <button 
                key={hz} 
                onClick={() => setZone(hz)}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full text-[9px] font-bold text-white/40 border border-white/5 transition-colors"
              >
                {hz}
              </button>
            ))}
            {historyTypes.slice(0, 3).map(ht => (
              <button 
                key={ht} 
                onClick={() => setType(ht)}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full text-[9px] font-bold text-white/20 border border-white/5 transition-colors"
              >
                {ht}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block border border-white/10 rounded-2xl overflow-hidden bg-[#0a0a0a]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-white/5 text-white/30 text-[9px] font-black uppercase tracking-widest border-b border-white/10">
                <th className="px-6 py-4 w-[30%]">Entidad</th>
                <th className="px-6 py-4 w-[25%]">Contacto Directo</th>
                <th className="px-6 py-4 w-[30%]">Dirección</th>
                <th className="px-6 py-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {leads.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-20 text-center text-white/10 font-black uppercase tracking-widest">Sin resultados en buffer</td></tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-5">
                      <div className="font-bold text-white text-sm truncate max-w-[280px] uppercase italic">{lead.name}</div>
                      <span className="text-[10px] text-white/40 uppercase font-bold">{lead.category}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <span className="text-white font-mono text-xs">{lead.phone || 'S/D'}</span>
                        <div className="flex gap-2">
                           <a href={getMapsUrl(lead.name, lead.location)} target="_blank" className="text-[8px] border border-white/10 px-1.5 py-0.5 rounded text-white/40 hover:text-white uppercase font-black">Google Maps</a>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs text-white/60 truncate max-w-[300px]">{lead.location}</p>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button 
                        onClick={() => onSaveToCRM(lead)} 
                        disabled={savedIds.has(lead.id)}
                        className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${savedIds.has(lead.id) ? 'bg-white/5 text-white/20' : 'border border-white text-white hover:bg-white hover:text-black'}`}
                      >
                        {savedIds.has(lead.id) ? 'GUARDADO' : 'ARCHIVAR'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden space-y-4">
        {leads.length === 0 ? (
          <div className="p-12 text-center text-white/10 font-black uppercase tracking-widest border border-white/5 rounded-2xl">
            Sin resultados
          </div>
        ) : (
          leads.map((lead) => (
            <div key={lead.id} className="p-5 border border-white/10 rounded-2xl bg-[#0a0a0a] space-y-4">
              <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1">
                  <h4 className="font-black text-white text-base truncate pr-2 uppercase italic">{lead.name}</h4>
                  <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{lead.category}</p>
                </div>
                <button 
                  onClick={() => onSaveToCRM(lead)} 
                  disabled={savedIds.has(lead.id)}
                  className={`h-9 px-4 rounded-lg text-[8px] font-black uppercase transition-all shrink-0 ${savedIds.has(lead.id) ? 'bg-white/5 text-white/20' : 'bg-white text-black'}`}
                >
                  {savedIds.has(lead.id) ? 'OK' : 'ADD'}
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="flex flex-col gap-1 p-3 bg-white/[0.02] rounded-xl border border-white/5">
                  <span className="text-[7px] text-white/20 font-black uppercase">Contacto</span>
                  <span className="text-white font-mono truncate">{lead.phone || 'S/D'}</span>
                </div>
                <div className="flex flex-col gap-1 p-3 bg-white/[0.02] rounded-xl border border-white/5">
                  <span className="text-[7px] text-white/20 font-black uppercase">Ubicación</span>
                  <span className="text-white/60 truncate">{lead.location}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <a href={getMapsUrl(lead.name, lead.location)} target="_blank" className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-center text-[9px] font-black uppercase">Mapa</a>
                {lead.whatsapp && <a href={`https://wa.me/${lead.whatsapp}`} target="_blank" className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-center text-[9px] font-black uppercase hover:bg-white/10 transition-colors">Chat</a>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default IntelligenceTool;
