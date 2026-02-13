
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { runIntelligenceSearch } from '../services/geminiService';
import { Lead } from '../types';
import HowToUseModal from './HowToUseModal';
import { PROJECT_CONFIG } from '../projectConfig';
import { useDataStore } from '../stores/useDataStore';
import { useAuthStore } from '../stores/useAuthStore';

export const IntelligenceTool: React.FC = () => {
  const { saveToCRM, paginatedLeads, logAction } = useDataStore();
  const { currentUser } = useAuthStore();

  const [zone, setZone] = useState('');
  const [type, setType] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [results, setResults] = useState<Lead[]>([]);
  
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [log]);

  const addLog = (msg: string) => setLog(prev => [...prev.slice(-50), msg]);

  const learningContext = useMemo(() => {
    const safeLeads = paginatedLeads || [];
    const successLeads = safeLeads.filter(l => l.status === 'client' || l.status === 'negotiation');
    const sourceData = successLeads.length >= 3 ? successLeads : safeLeads;
    const categoryCounts = sourceData.reduce((acc: Record<string, number>, l) => {
        if (l.category) acc[l.category.toLowerCase().trim()] = (acc[l.category.toLowerCase().trim()] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    return Object.entries(categoryCounts).sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, 3).map(([cat]) => cat).join(', ') || null;
  }, [paginatedLeads]);

  const runPipeline = async () => {
    if (!zone.trim() || !type.trim() || !currentUser) return;
    setIsSearching(true);
    setSearchError(null);
    setLog([]);
    setResults([]);
    logAction('SEARCH', `Búsqueda: ${type.trim()} en ${zone.trim()}`);
    
    try {
      addLog('> [HUNTER v3] Iniciando motor de búsqueda resiliente...');
      addLog('> Analizando sector y verificando datos en paralelo. Esto puede tardar hasta 90 segundos...');
      const enrichedLeads = await runIntelligenceSearch(zone.trim(), type.trim(), learningContext || undefined);
      addLog(`> Proceso finalizado. Se encontraron ${enrichedLeads.length} leads de alta calidad.`);
      
      setResults(enrichedLeads);

    } catch (err: any) {
      const errorMessage = err.message || "Ocurrió un error desconocido durante la búsqueda.";
      setSearchError(errorMessage);
      addLog(`> [ERROR CRÍTICO] ${errorMessage}`);
    } finally {
      setIsSearching(false);
    }
  };
  
  return (
    <div className="space-y-8 animate-in pb-10">
      <HowToUseModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/5 pb-4">
        <div>
            <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">Buscador de Inteligencia</h1>
            <p className="text-white/40 text-xs font-medium mt-1 uppercase tracking-widest">Motor Resiliente v6.0 (Hunter v3)</p>
        </div>
        <button onClick={() => setShowHelp(true)} className="text-[9px] text-white/20 hover:text-white font-bold uppercase tracking-widest transition-colors block">¿Cómo funciona?</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
        <div>
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 block">Zona de Búsqueda</label>
            <input list="zones" value={zone} onChange={(e) => setZone(e.target.value)} placeholder={PROJECT_CONFIG.defaultZone} className="w-full h-12 bg-black/50 border border-white/10 rounded-xl px-4 text-sm text-white" />
        </div>
        <div>
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 block">Rubro / Tipo de Negocio</label>
            <input list="types" value={type} onChange={(e) => setType(e.target.value)} placeholder="Ej: Bares, Vinotecas, Restaurantes" className="w-full h-12 bg-black/50 border border-white/10 rounded-xl px-4 text-sm text-white" />
        </div>
        <button onClick={runPipeline} disabled={isSearching || !zone.trim() || !type.trim()} className="h-12 w-full lg:col-span-3 xl:col-span-1 bg-white disabled:opacity-50 text-black text-xs font-black uppercase rounded-xl flex items-center justify-center gap-2 shadow-lg hover:bg-gray-200 transition-all">
            {isSearching && <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
            {isSearching ? 'Buscando...' : 'Iniciar Búsqueda'}
        </button>
      </div>
      
      {searchError && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
              <p className="text-red-400 text-xs font-black uppercase mb-1">⚠️ Error en la Búsqueda</p>
              <p className="text-white/70 text-[11px]">{searchError}</p>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
              <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Consola de IA</h3>
              <div className="h-96 bg-[#050505] border border-white/10 rounded-2xl p-4 overflow-y-auto custom-scroll font-mono text-xs text-white/60 space-y-2">
                  {log.length === 0 && <p className="text-white/20 animate-pulse">Esperando instrucciones...</p>}
                  {log.map((line, i) => (<p key={i} className="animate-in fade-in">{line}</p>))}
                  <div ref={logEndRef}></div>
              </div>
          </div>
          <div className="lg:col-span-2 space-y-3">
              <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Resultados ({results.length})</h3>
              <div className="h-96 overflow-y-auto custom-scroll space-y-2 pr-2">
                  {isSearching && results.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                        <svg className="animate-spin h-12 w-12 text-white/50 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-white/40 text-sm font-bold animate-pulse">Analizando sector... Esto puede tardar hasta un minuto.</p>
                    </div>
                  )}
                  {!isSearching && results.length === 0 && log.length > 0 && !searchError && (
                    <div className="h-full flex flex-col items-center justify-center text-center border-2 border-dashed border-white/5 rounded-2xl">
                        <svg className="w-16 h-16 text-white/10 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        <p className="text-lg font-black text-white/20 uppercase tracking-[0.2em]">Sin Resultados</p>
                        <p className="text-xs text-white/30 mt-2">Intenta con una zona más amplia o un rubro diferente.</p>
                    </div>
                  )}
                  {results.map((lead, index) => {
                      const { crmStatus } = lead;
                      return (
                          <div key={`${lead.name}-${index}`} className="bg-[#050505] border border-white/10 rounded-xl p-3 flex justify-between items-center gap-3 animate-in fade-in">
                              <div className="min-w-0">
                                  <p className="text-sm font-bold text-white truncate">{lead.name}</p>
                                  <p className="text-xs text-white/50 truncate flex items-center gap-2">
                                     {lead.category} • {lead.location}
                                  </p>
                              </div>
                              <div className="shrink-0">
                                  {crmStatus?.status === 'free' && (
                                    <button onClick={() => saveToCRM(lead as Lead)} className="px-3 py-1.5 bg-white/10 text-white/80 hover:bg-white hover:text-black text-[9px] font-bold uppercase rounded-lg transition-all">Guardar</button>
                                  )}
                                  {crmStatus?.status !== 'free' && (
                                    <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded ${crmStatus?.status === 'owned' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>{crmStatus?.status === 'owned' ? 'Tuyo' : `De ${crmStatus?.owner}`}</span>
                                  )}
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      </div>
    </div>
  );
};