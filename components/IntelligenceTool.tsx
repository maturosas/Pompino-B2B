
import React, { useState, useMemo } from 'react';
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

  const addLog = (msg: string) => setLog(prev => [...prev.slice(-8), msg]);

  const suggestions = useMemo(() => {
    const historicalZones = Array.from(new Set(leads.map(l => l.location.split(',')[0].trim())));
    const historicalTypes = Array.from(new Set(leads.map(l => l.category)));
    
    const defaultTypes = [
      "Distribuidora de Bebidas", "Vinoteca", "Depósito de Bebidas",
      "Supermercado", "Minimercado", "Bar de Copas", "Restaurante",
      "Cervecería Artesanal", "Kiosco 24hs", "Wholesale Beverages"
    ];

    const defaultZones = [
      "Palermo, CABA", "Belgrano, CABA", "Recoleta, CABA",
      "San Isidro, GBA", "Pilar, GBA", "Córdoba Capital",
      "Rosario, Santa Fe", "Mendoza Capital"
    ];

    return {
      zones: Array.from(new Set([...defaultZones, ...historicalZones])).filter(Boolean),
      types: Array.from(new Set([...defaultTypes, ...historicalTypes])).filter(Boolean)
    };
  }, [leads]);

  const runPipeline = async () => {
    if (!zone.trim() || !type.trim()) return;

    setIsSearching(true);
    setLog([]);
    addLog(`> INICIANDO POMPINO AI ENGINE v6.0...`);
    
    try {
      addLog(`> ACTIVANDO GROUNDING: Google Maps API...`);
      await new Promise(r => setTimeout(r, 400));
      addLog(`> ACTIVANDO GROUNDING: Google Search...`);
      
      addLog(`> RASTREANDO: ${type} en ${zone}...`);

      const newLeads = await scrapeLeads(zone, type, true);
      
      addLog(`> MODELO: Gemini 3 Pro (Thinking Mode 32K)...`);
      addLog(`> ESTRUCTURANDO RESULTADOS...`);
      await new Promise(r => setTimeout(r, 600));
      
      onUpdateLeads([...newLeads, ...leads]);
      setIsSearching(false);
      addLog(`> PROCESO COMPLETADO. Hallazgos: ${newLeads.length}`);
    } catch (err: any) {
      setIsSearching(false);
      addLog(`> ERROR CRÍTICO: ${err.message}`);
    }
  };

  const clearResults = () => {
    if (window.confirm("¿Limpiar historial de búsqueda?")) {
      onUpdateLeads([]);
      setLog([]);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Dynamic Header Badge */}
      <div className="flex items-center gap-3 px-2">
        <div className="flex items-center gap-2 bg-blue-600/10 border border-blue-500/30 px-3 py-1 rounded-full">
          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
          <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Grounding Engine 2.5/3.0 ACTIVE</span>
        </div>
        <div className="flex items-center gap-2 bg-indigo-600/10 border border-indigo-500/30 px-3 py-1 rounded-full">
          <svg className="w-3 h-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Thinking Mode enabled</span>
        </div>
      </div>

      <div className="relative">
        <div className="absolute -inset-1 bg-blue-600/5 blur-3xl rounded-[1.5rem] pointer-events-none"></div>
        <div className="glass-panel p-4 rounded-2xl shadow-lg relative overflow-hidden border-white/10">
          <div className="flex flex-col lg:flex-row gap-4 relative z-10">
            <div className="flex-1 space-y-1.5">
              <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] ml-1 italic">Objetivo Geográfico</label>
              <input
                list="zone-suggestions"
                type="text"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                placeholder="Ej: Palermo, CABA"
                className="w-full bg-white/[0.03] border border-white/10 px-4 py-2 rounded-xl text-white font-bold text-xs focus:bg-white/[0.06] focus:border-blue-500/40 outline-none transition-all placeholder:text-white/10"
              />
              <datalist id="zone-suggestions">
                {suggestions.zones.map((z, i) => <option key={i} value={z} />)}
              </datalist>
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] ml-1 italic">Categoría / Nicho</label>
              <input
                list="type-suggestions"
                type="text"
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="Ej: Distribuidora de Gaseosas"
                className="w-full bg-white/[0.03] border border-white/10 px-4 py-2 rounded-xl text-white font-bold text-xs focus:bg-white/[0.06] focus:border-blue-500/40 outline-none transition-all placeholder:text-white/10"
              />
              <datalist id="type-suggestions">
                {suggestions.types.map((t, i) => <option key={i} value={t} />)}
              </datalist>
            </div>
            <div className="lg:w-44 flex items-end pb-0.5">
              <button
                onClick={runPipeline}
                disabled={isSearching || !zone || !type}
                className={`w-full h-10 rounded-xl font-black uppercase tracking-[0.1em] text-[10px] italic transition-all flex items-center justify-center gap-2 shadow-xl ${
                  isSearching 
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 cursor-wait' 
                    : 'bg-white text-black hover:bg-blue-600 hover:text-white active:scale-[0.97]'
                }`}
              >
                {isSearching ? (
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                )}
                <span>{isSearching ? 'ANALIZANDO' : 'DEEP SEARCH'}</span>
              </button>
            </div>
          </div>
          
          {(isSearching || log.length > 0) && (
            <div className="mt-3 bg-black/50 border border-white/5 rounded-xl p-3 font-mono text-[9px] text-blue-400/60 shadow-inner">
              <div className="h-16 overflow-y-auto custom-scroll pr-2 space-y-1">
                {log.map((m, i) => (
                  <div key={i} className={`flex gap-3 ${i === log.length - 1 ? 'text-blue-300' : 'opacity-40'}`}>
                    <span className="shrink-0">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                    <span className="uppercase tracking-tighter">{m}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl border-white/10 bg-[#070707]">
        <div className="px-5 py-3 border-b border-white/10 flex justify-between items-center bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <h3 className="font-black text-white text-xs uppercase tracking-[0.1em] italic">Oportunidades Estructuradas</h3>
            <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 text-white/40 text-[8px] font-black rounded">{leads.length} HALLAZGOS</span>
          </div>
          <div className="flex items-center gap-4">
            {leads.length > 0 && (
              <button 
                onClick={clearResults}
                className="text-[8px] font-black text-white/15 hover:text-red-400 uppercase tracking-widest transition-colors"
              >
                Resetear Buffer
              </button>
            )}
            <div className="h-4 w-px bg-white/10"></div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Grounding Verified</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto custom-scroll">
          <table className="w-full text-left table-fixed min-w-[1000px]">
            <thead>
              <tr className="bg-white/[0.02] text-white/20 text-[7.5px] font-black uppercase tracking-[0.25em] border-b border-white/10">
                <th className="px-5 py-2 w-[28%]">Entidad / Inteligencia</th>
                <th className="px-4 py-2 w-[22%]">Ubicación Grounded</th>
                <th className="px-5 py-2 w-[25%]">B2B Contact Data</th>
                <th className="px-4 py-2 w-[10%] text-center">Digital Assets</th>
                <th className="px-5 py-2 w-[15%] text-right">Integración</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-28 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-5">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                      <p className="text-white font-black uppercase tracking-[0.8em] text-[8px] italic">No active search data</p>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-white/[0.015] transition-colors group/row border-white/[0.03]">
                    <td className="px-5 py-2.5">
                      <div className="font-black text-white text-[11px] leading-tight mb-0.5 group-hover/row:text-blue-400 uppercase italic transition-colors truncate">{lead.name}</div>
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-[7px] font-black text-blue-500/60 uppercase tracking-widest px-1.5 py-0.5 bg-blue-600/10 rounded-md border border-blue-500/10 shrink-0">{lead.category}</span>
                        {lead.sourceUrl && (
                          <a href={lead.sourceUrl} target="_blank" className="text-[6px] font-bold text-white/10 uppercase tracking-tighter truncate opacity-40 hover:opacity-100 hover:text-blue-300 transition-all flex items-center gap-1">
                            <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.826a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.103-1.103" /></svg>
                            Fuente Grounding
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="text-white/60 font-medium text-[9px] leading-tight line-clamp-1 hover:line-clamp-none transition-all cursor-default" title={lead.location}>
                        {lead.location}
                      </div>
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="flex flex-col gap-0.5">
                        <div className="text-white/80 font-black text-[9.5px] flex items-center gap-1.5">
                          <svg className="w-2.5 h-2.5 text-green-500/50" fill="currentColor" viewBox="0 0 24 24"><path d="M12.01 2.01c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10zM10.5 17.5l-3.5-3.5 1.41-1.41 2.09 2.09 4.59-4.59 1.41 1.41-6 6z"/></svg>
                          <span className="tracking-tight">{lead.phone || 'No detectado'}</span>
                        </div>
                        <div className="text-[8.5px] text-blue-400/50 font-bold lowercase truncate opacity-80" title={lead.email}>{lead.email || 'Email no disponible'}</div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {lead.website && (
                          <a href={lead.website} target="_blank" className="p-1 bg-white/[0.03] rounded border border-white/5 text-white/20 hover:text-white hover:border-white/20 transition-all">
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" /></svg>
                          </a>
                        )}
                        {lead.instagram && (
                          <a href={lead.instagram.startsWith('http') ? lead.instagram : `https://instagram.com/${lead.instagram.replace('@', '')}`} target="_blank" className="p-1 bg-white/[0.03] rounded border border-white/5 text-white/20 hover:text-white hover:border-white/20 transition-all">
                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <button 
                        onClick={() => onSaveToCRM(lead)}
                        disabled={savedIds.has(lead.id)}
                        className={`px-3 py-1.5 rounded-lg text-[7.5px] font-black uppercase tracking-widest transition-all border ${
                          savedIds.has(lead.id) 
                            ? 'bg-blue-600/10 text-blue-400 border-blue-500/10 cursor-default opacity-60' 
                            : 'bg-white text-black hover:bg-blue-600 hover:text-white border-transparent active:scale-[0.94]'
                        }`}
                      >
                        {savedIds.has(lead.id) ? 'GUARDADO' : '+ GUARDAR'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex justify-end pr-4 opacity-[0.05]">
        <span className="text-[6px] font-black uppercase tracking-[1.2em] text-white">Advanced Grounding Intelligence Pipeline v6.0</span>
      </div>
    </div>
  );
};

export default IntelligenceTool;
