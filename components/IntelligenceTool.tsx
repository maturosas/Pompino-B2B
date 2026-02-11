
import React, { useState, useEffect, useMemo } from 'react';
import { scrapeLeads } from '../services/geminiService';
import { Lead } from '../types';

interface IntelligenceToolProps {
  leads: Lead[];
  onUpdateLeads: (leads: Lead[]) => void;
  onSaveToCRM: (lead: Lead) => void;
  savedIds: Set<string>;
}

const COMMON_NICHES = [
  "Distribuidora de Bebidas",
  "Vinoteca Boutique",
  "Minimercado / Autoservicio",
  "Depósito de Cervezas",
  "Bar de Especialidad",
  "Restaurante de Alta Gama",
  "Supermercado Mayorista",
  "Club de Vinos"
];

const IntelligenceTool: React.FC<IntelligenceToolProps> = ({ leads, onUpdateLeads, onSaveToCRM, savedIds }) => {
  const [zone, setZone] = useState('');
  const [type, setType] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('pompino_recent_searches');
    if (stored) setRecentSearches(JSON.parse(stored));
  }, []);

  const saveRecentSearch = (term: string) => {
    const updated = Array.from(new Set([term, ...recentSearches])).slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('pompino_recent_searches', JSON.stringify(updated));
  };

  const addLog = (msg: string) => setLog(prev => [...prev.slice(-5), msg]);

  const runPipeline = async () => {
    if (!zone.trim() || !type.trim()) return;
    setIsSearching(true);
    setLog([]);
    addLog(`> INICIANDO MOTOR DE RASTREO...`);
    saveRecentSearch(type);
    
    try {
      const newLeads = await scrapeLeads(zone, type, true);
      onUpdateLeads([...newLeads, ...leads]);
      addLog(`> ÉXITO: ${newLeads.length} ENTIDADES EXTRAÍDAS.`);
    } catch (err: any) {
      addLog(`> ERROR CRÍTICO: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Search Header */}
      <div className="p-8 border border-white/20 rounded-3xl bg-black shadow-[0_0_50px_rgba(255,255,255,0.05)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-2 relative">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Zona de Interés</label>
            <input
              type="text"
              list="zones-list"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              placeholder="Ej: Palermo, Buenos Aires"
              className="w-full h-14 bg-black border border-white/20 px-6 rounded-2xl font-bold text-white placeholder:text-white/10 focus:border-white outline-none transition-all"
            />
            <datalist id="zones-list">
              <option value="CABA, Argentina" />
              <option value="Nordelta, GBA" />
              <option value="Córdoba Capital" />
              <option value="Rosario, Santa Fe" />
              <option value="Mendoza City" />
            </datalist>
          </div>
          
          <div className="lg:col-span-5 space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Nicho / Rubro B2B</label>
            <div className="relative group">
              <input
                type="text"
                list="niches-list"
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="Ej: Distribuidora de Cervezas"
                className="w-full h-14 bg-black border border-white/20 px-6 rounded-2xl font-bold text-white placeholder:text-white/10 focus:border-white outline-none transition-all"
              />
              <datalist id="niches-list">
                {COMMON_NICHES.map(n => <option key={n} value={n} />)}
                {recentSearches.map(n => <option key={n} value={n} />)}
              </datalist>
            </div>
          </div>
          
          <div className="lg:col-span-2 flex items-end">
            <button
              onClick={runPipeline}
              disabled={isSearching || !zone || !type}
              className={`w-full h-14 rounded-2xl font-black uppercase text-[12px] tracking-widest transition-all ${
                isSearching 
                  ? 'bg-white/10 text-white/20 cursor-wait' 
                  : 'bg-white text-black hover:bg-blue-600 hover:text-white active:scale-95'
              }`}
            >
              {isSearching ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 border-2 border-black/20 border-t-black animate-spin rounded-full"></div>
                  <span>...</span>
                </div>
              ) : 'RASTREAR'}
            </button>
          </div>
        </div>
        
        {log.length > 0 && (
          <div className="mt-6 p-4 border border-white/10 rounded-2xl mono text-[10px] text-white/40 bg-white/[0.02]">
            {log.map((m, i) => <div key={i} className="mb-1 uppercase tracking-tight">{m}</div>)}
          </div>
        )}
      </div>

      {/* Results Table */}
      <div className="border border-white/10 rounded-3xl overflow-hidden shadow-2xl bg-black">
        <div className="px-8 py-6 bg-white/[0.02] border-b border-white/10 flex justify-between items-center">
          <h3 className="font-black text-white text-sm uppercase tracking-[0.2em] italic">Oportunidades Detectadas</h3>
          <span className="text-[9px] font-black bg-white/10 border border-white/10 px-3 py-1 rounded text-white/60">
            {leads.length} REGISTROS
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black text-white/20 text-[9px] font-black uppercase tracking-[0.25em] border-b border-white/10">
                <th className="px-8 py-5">Entidad Comercial</th>
                <th className="px-8 py-5">Localización</th>
                <th className="px-8 py-5">Info de Contacto</th>
                <th className="px-8 py-5 text-right">Ops</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-32 text-center text-white/10 uppercase font-black tracking-[1em] text-[10px] italic">Buffer de búsqueda vacío</td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-white/[0.03] transition-colors bg-black border-white/5">
                    <td className="px-8 py-6">
                      <div className="font-black text-white text-[15px] uppercase italic leading-none mb-1">{lead.name}</div>
                      <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{lead.category}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-white/60 font-bold text-[11px] leading-relaxed max-w-xs">{lead.location}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-white font-black text-[12px] mono">{lead.phone || 'S/N'}</span>
                        <span className="text-white/30 text-[10px] lowercase font-medium">{lead.email || 'no-email@detected.com'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => onSaveToCRM(lead)}
                        disabled={savedIds.has(lead.id)}
                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          savedIds.has(lead.id) 
                            ? 'bg-green-500/10 text-green-500 border border-green-500/20 cursor-default' 
                            : 'border border-white/20 text-white hover:bg-white hover:text-black active:scale-95'
                        }`}
                      >
                        {savedIds.has(lead.id) ? 'GUARDADO' : 'AÑADIR'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex justify-end pr-4">
        <p className="text-[9px] font-black text-white/10 uppercase tracking-[1em] italic">Pompino Search Protocol v7.2.1</p>
      </div>
    </div>
  );
};

export default IntelligenceTool;
