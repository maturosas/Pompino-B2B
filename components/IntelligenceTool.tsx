
import React, { useState, useEffect, useMemo } from 'react';
import { scrapeLeads } from '../services/geminiService';
import { Lead } from '../types';

interface IntelligenceToolProps {
  leads: Lead[];
  onUpdateLeads: (leads: Lead[]) => void;
  onSaveToCRM: (lead: Lead) => void;
  savedIds: Set<string>;
}

const DEFAULT_ZONES = [
  "Palermo, Buenos Aires",
  "Nordelta, GBA",
  "Córdoba Capital",
  "Rosario, Santa Fe",
  "Mendoza City"
];

const COMMON_NICHES = [
  "Distribuidora de Bebidas",
  "Vinoteca Boutique",
  "Minimercado / Autoservicio",
  "Bar de Especialidad",
  "Restaurante de Alta Gama",
  "Supermercado Mayorista"
];

const IntelligenceTool: React.FC<IntelligenceToolProps> = ({ leads, onUpdateLeads, onSaveToCRM, savedIds }) => {
  const [zone, setZone] = useState('');
  const [type, setType] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentZones, setRecentZones] = useState<string[]>([]);
  const [recentNiches, setRecentNiches] = useState<string[]>([]);

  // Effect to load history on mount and repopulate inputs
  useEffect(() => {
    const storedZones = localStorage.getItem('pompino_history_zones');
    const storedNiches = localStorage.getItem('pompino_history_niches');
    
    if (storedZones) {
      const parsed = JSON.parse(storedZones);
      setRecentZones(parsed);
      if (parsed.length > 0) setZone(parsed[0]);
    }
    
    if (storedNiches) {
      const parsed = JSON.parse(storedNiches);
      setRecentNiches(parsed);
      if (parsed.length > 0) setType(parsed[0]);
    }
  }, []);

  const saveToHistory = (zoneVal: string, nicheVal: string) => {
    // Update local states
    const updatedZones = Array.from(new Set([zoneVal, ...recentZones])).slice(0, 10);
    const updatedNiches = Array.from(new Set([nicheVal, ...recentNiches])).slice(0, 10);
    
    setRecentZones(updatedZones);
    setRecentNiches(updatedNiches);
    
    // Persist to localStorage
    localStorage.setItem('pompino_history_zones', JSON.stringify(updatedZones));
    localStorage.setItem('pompino_history_niches', JSON.stringify(updatedNiches));
  };

  const addLog = (msg: string) => setLog(prev => [...prev.slice(-5), msg]);

  const runPipeline = async () => {
    const cleanZone = zone.trim();
    const cleanType = type.trim();
    if (!cleanZone || !cleanType) return;
    
    setIsSearching(true);
    setLog([]);
    addLog(`> INICIANDO MOTOR DE RASTREO...`);
    
    // Save to history upon starting a search
    saveToHistory(cleanZone, cleanType);
    
    try {
      const newLeads = await scrapeLeads(cleanZone, cleanType, true);
      onUpdateLeads([...newLeads, ...leads]);
      addLog(`> ÉXITO: ${newLeads.length} ENTIDADES EXTRAÍDAS.`);
    } catch (err: any) {
      addLog(`> ERROR CRÍTICO: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const zoneSuggestions = useMemo(() => {
    return Array.from(new Set([...recentZones, ...DEFAULT_ZONES]));
  }, [recentZones]);

  const nicheSuggestions = useMemo(() => {
    return Array.from(new Set([...recentNiches, ...COMMON_NICHES]));
  }, [recentNiches]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Search Protocol Header */}
      <div className="p-8 border-2 border-white rounded-3xl bg-black shadow-[0_0_80px_rgba(255,255,255,0.05)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-3 relative">
            <label className="text-[11px] font-black text-white uppercase tracking-[0.3em] ml-1">
              Localidad de Búsqueda <span className="text-white/30 italic ml-2">History Active</span>
            </label>
            <input
              type="text"
              list="zones-history"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              placeholder="Ej: Palermo, Buenos Aires"
              className="w-full h-16 bg-black border-2 border-white/20 px-8 rounded-2xl font-black text-white text-lg placeholder:text-white/10 focus:border-white outline-none transition-all shadow-inner"
            />
            <datalist id="zones-history">
              {zoneSuggestions.map(z => <option key={z} value={z} />)}
            </datalist>
          </div>
          
          <div className="lg:col-span-5 space-y-3">
            <label className="text-[11px] font-black text-white uppercase tracking-[0.3em] ml-1">
              Nicho Comercial <span className="text-white/30 italic ml-2">Intelligence Ready</span>
            </label>
            <input
              type="text"
              list="niches-history"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="Ej: Distribuidora Mayorista"
              className="w-full h-16 bg-black border-2 border-white/20 px-8 rounded-2xl font-black text-white text-lg placeholder:text-white/10 focus:border-white outline-none transition-all shadow-inner"
            />
            <datalist id="niches-history">
              {nicheSuggestions.map(n => <option key={n} value={n} />)}
            </datalist>
          </div>
          
          <div className="lg:col-span-2 flex items-end">
            <button
              onClick={runPipeline}
              disabled={isSearching || !zone || !type}
              className={`w-full h-16 rounded-2xl font-black uppercase text-[14px] tracking-widest transition-all shadow-2xl ${
                isSearching 
                  ? 'bg-white/10 text-white/20 cursor-wait border-2 border-white/10' 
                  : 'bg-white text-black hover:scale-[1.02] active:scale-95 border-2 border-white'
              }`}
            >
              {isSearching ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black animate-spin rounded-full"></div>
                  <span>BUSCANDO</span>
                </div>
              ) : 'RASTREAR'}
            </button>
          </div>
        </div>
        
        {log.length > 0 && (
          <div className="mt-8 p-5 border-t border-white/10 mono text-[11px] text-white/60 bg-white/[0.01] rounded-b-2xl">
            {log.map((m, i) => <div key={i} className="mb-1 uppercase tracking-tighter flex items-center gap-3">
              <span className="text-white/20">[{new Date().toLocaleTimeString()}]</span>
              <span className="font-bold text-white">{m}</span>
            </div>)}
          </div>
        )}
      </div>

      {/* Discovery Ledger */}
      <div className="border border-white/20 rounded-3xl overflow-hidden shadow-2xl bg-black">
        <div className="px-8 py-5 bg-white/[0.03] border-b border-white/20 flex justify-between items-center">
          <h3 className="font-black text-white text-[12px] uppercase tracking-[0.4em] italic">Buffer de Detección</h3>
          <span className="text-[10px] font-black bg-white text-black px-4 py-1.5 rounded-full uppercase tracking-widest">
            {leads.length} Entidades
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black text-white/40 text-[10px] font-black uppercase tracking-[0.3em] border-b border-white/10">
                <th className="px-8 py-4">Entidad</th>
                <th className="px-8 py-4">Ubicación</th>
                <th className="px-8 py-4">Contacto</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4 text-right">Ops</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-32 text-center text-white/10 uppercase font-black tracking-[1.5em] text-[12px] italic">
                    Esperando Protocolo de Búsqueda
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-white/[0.04] transition-colors bg-black group">
                    <td className="px-8 py-5">
                      <div className="font-black text-white text-[16px] uppercase italic tracking-tight leading-none mb-1 group-hover:translate-x-1 transition-transform">{lead.name}</div>
                      <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{lead.category}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-white/80 font-bold text-[11px] leading-relaxed max-w-xs">{lead.location}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-1">
                        <span className="text-white font-black text-[13px] mono">{lead.phone || 'S/N'}</span>
                        <span className="text-white/30 text-[10px] lowercase font-medium italic">{lead.email || 'no-email@intel.db'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-black text-white border border-white/20 px-3 py-1 rounded bg-white/5 uppercase tracking-tighter">
                        DETECTADO
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => onSaveToCRM(lead)}
                        disabled={savedIds.has(lead.id)}
                        className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-lg ${
                          savedIds.has(lead.id) 
                            ? 'bg-white/10 text-white/30 border border-white/10 cursor-default' 
                            : 'border-2 border-white text-white hover:bg-white hover:text-black active:scale-95'
                        }`}
                      >
                        {savedIds.has(lead.id) ? 'EN ARCHIVO' : 'AÑADIR'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex justify-between items-center px-4">
        <p className="text-[9px] font-black text-white/5 uppercase tracking-[1em] italic">Search Protocol v7.2.1 Stable</p>
        <div className="flex items-center gap-4">
           <div className="h-px w-32 bg-white/5"></div>
           <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Monocromatic Intelligence Mode</span>
        </div>
      </div>
    </div>
  );
};

export default IntelligenceTool;
