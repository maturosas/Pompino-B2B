
import React, { useState, useEffect, useMemo } from 'react';
import { scrapeLeads } from '../services/geminiService';
import { Lead } from '../types';

interface IntelligenceToolProps {
  leads: Lead[];
  onUpdateLeads: (leads: Lead[]) => void;
  onSaveToCRM: (lead: Lead) => void;
  savedIds: Set<string>;
}

const DEFAULT_ZONES = ["Palermo, Buenos Aires", "Nordelta, GBA", "Córdoba Capital", "Rosario, Santa Fe", "Mendoza City"];
const COMMON_NICHES = ["Distribuidora de Bebidas", "Vinoteca Boutique", "Minimercado", "Bar de Especialidad", "Supermercado Mayorista"];

const IntelligenceTool: React.FC<IntelligenceToolProps> = ({ leads, onUpdateLeads, onSaveToCRM, savedIds }) => {
  const [zone, setZone] = useState('');
  const [type, setType] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentZones, setRecentZones] = useState<string[]>([]);
  const [recentNiches, setRecentNiches] = useState<string[]>([]);

  useEffect(() => {
    const storedZones = localStorage.getItem('pompino_history_zones');
    const storedNiches = localStorage.getItem('pompino_history_niches');
    if (storedZones) setRecentZones(JSON.parse(storedZones));
    if (storedNiches) setRecentNiches(JSON.parse(storedNiches));
  }, []);

  const saveToHistory = (zoneVal: string, nicheVal: string) => {
    const updatedZones = Array.from(new Set([zoneVal, ...recentZones])).slice(0, 10);
    const updatedNiches = Array.from(new Set([nicheVal, ...recentNiches])).slice(0, 10);
    setRecentZones(updatedZones);
    setRecentNiches(updatedNiches);
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

  const zoneSuggestions = useMemo(() => Array.from(new Set([...recentZones, ...DEFAULT_ZONES])), [recentZones]);
  const nicheSuggestions = useMemo(() => Array.from(new Set([...recentNiches, ...COMMON_NICHES])), [recentNiches]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-full overflow-hidden">
      {/* Search Section */}
      <div className="p-5 lg:p-8 border-2 border-white rounded-3xl bg-black shadow-2xl">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-8">
          <div className="lg:col-span-5 space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-1">Zona Geográfica</label>
            <input 
              list="zones-history" 
              value={zone} 
              onChange={(e) => setZone(e.target.value)} 
              placeholder="Localidad o Ciudad" 
              className="w-full h-14 bg-black border-2 border-white/20 px-6 rounded-2xl font-black text-white text-base focus:border-white outline-none transition-all shadow-inner" 
            />
            <datalist id="zones-history">{zoneSuggestions.map(z => <option key={z} value={z} />)}</datalist>
          </div>
          <div className="lg:col-span-5 space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-1">Nicho Comercial</label>
            <input 
              list="niches-history" 
              value={type} 
              onChange={(e) => setType(e.target.value)} 
              placeholder="Rubro del negocio" 
              className="w-full h-14 bg-black border-2 border-white/20 px-6 rounded-2xl font-black text-white text-base focus:border-white outline-none transition-all shadow-inner" 
            />
            <datalist id="niches-history">{nicheSuggestions.map(n => <option key={n} value={n} />)}</datalist>
          </div>
          <div className="lg:col-span-2 flex items-end">
            <button 
              onClick={runPipeline} 
              disabled={isSearching || !zone || !type} 
              className={`w-full h-14 rounded-2xl font-black uppercase text-[12px] tracking-widest transition-all ${isSearching ? 'bg-white/10 text-white/20 border-white/10 cursor-not-allowed' : 'bg-white text-black hover:bg-white/90 active:scale-95 border-white'}`}
            >
              {isSearching ? 'BUSCANDO...' : 'RASTREAR'}
            </button>
          </div>
        </div>
        {log.length > 0 && (
          <div className="mt-6 p-4 border-t border-white/10 mono text-[10px] text-white/60 bg-white/[0.02] rounded-xl">
            {log.map((m, i) => (
              <div key={i} className="mb-1 flex items-start gap-2">
                <span className="text-white/20 shrink-0">[{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}]</span>
                <span className="font-bold text-white break-all leading-relaxed">{m}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center px-4 gap-2">
        <h3 className="font-black text-white text-[12px] uppercase tracking-[0.4em] italic">Buffer de Detección</h3>
        <span className="text-[10px] font-black bg-white/10 border border-white/20 text-white px-4 py-1.5 rounded-full uppercase">
          {leads.length} Hallazgos
        </span>
      </div>

      {/* Results View (Table for Desktop, Cards for Mobile) */}
      <div className="space-y-4">
        {/* Desktop Table View */}
        <div className="hidden lg:block border-2 border-white/20 rounded-3xl overflow-hidden bg-black shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-[0.3em] border-b border-white/10">
                <th className="px-8 py-4">Entidad</th>
                <th className="px-8 py-4">Redes & Contacto</th>
                <th className="px-8 py-4">Ubicación</th>
                <th className="px-8 py-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {leads.length === 0 ? (
                <tr><td colSpan={4} className="px-8 py-32 text-center text-white/10 uppercase font-black tracking-[1.5em] text-[12px] italic">Esperando Protocolo de Búsqueda</td></tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-white/[0.04] transition-colors bg-black group">
                    <td className="px-8 py-5">
                      <div className="font-black text-white text-[16px] uppercase italic leading-none mb-1">{lead.name}</div>
                      <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{lead.category}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {lead.instagram && <a href={lead.instagram} target="_blank" className="text-[8px] font-black border border-white/20 px-2 py-1 rounded bg-white/5 hover:bg-white hover:text-black transition-all">INSTAGRAM</a>}
                        {lead.website && <a href={lead.website} target="_blank" className="text-[8px] font-black border border-white/20 px-2 py-1 rounded bg-white/5 hover:bg-white hover:text-black transition-all">WEB</a>}
                        {lead.whatsapp && <a href={`https://wa.me/${lead.whatsapp}`} target="_blank" className="text-[8px] font-black border border-white/40 px-2 py-1 rounded bg-white text-black hover:bg-black hover:text-white transition-all">WHATSAPP</a>}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white font-black text-[11px] mono">{lead.phone || 'SIN TEL'}</span>
                        <span className="text-white/20 text-[9px] lowercase italic">{lead.email || 'sin-email'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-white/60 font-bold text-[11px]">{lead.location}</td>
                    <td className="px-8 py-5 text-right">
                      <button onClick={() => onSaveToCRM(lead)} disabled={savedIds.has(lead.id)} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all ${savedIds.has(lead.id) ? 'bg-white/10 text-white/30 border-white/10 cursor-default' : 'border-2 border-white text-white hover:bg-white hover:text-black'}`}>
                        {savedIds.has(lead.id) ? 'EN ARCHIVO' : 'AÑADIR'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {leads.length === 0 ? (
            <div className="px-8 py-20 text-center text-white/10 uppercase font-black text-[10px] italic border-2 border-white/10 rounded-3xl">
              Sin datos para procesar
            </div>
          ) : (
            leads.map((lead) => (
              <div key={lead.id} className="p-5 border-2 border-white/20 rounded-2xl bg-black space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-black text-white text-lg uppercase italic leading-tight">{lead.name}</h4>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{lead.category}</p>
                  </div>
                  <button 
                    onClick={() => onSaveToCRM(lead)} 
                    disabled={savedIds.has(lead.id)}
                    className={`h-10 px-4 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${savedIds.has(lead.id) ? 'bg-white/10 text-white/30 border-white/10' : 'bg-white text-black border-white'}`}
                  >
                    {savedIds.has(lead.id) ? 'LISTO' : 'AÑADIR'}
                  </button>
                </div>
                
                <div className="flex flex-col gap-1 py-3 border-y border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-black text-sm mono">{lead.phone || 'Sin Teléfono'}</span>
                  </div>
                  <div className="text-white/40 text-xs italic truncate">{lead.email || 'Sin correo detectado'}</div>
                  <div className="text-white/60 text-[10px] font-bold mt-1 uppercase">{lead.location}</div>
                </div>

                <div className="flex gap-2">
                  {lead.whatsapp && (
                    <a href={`https://wa.me/${lead.whatsapp}`} target="_blank" className="flex-1 py-3 bg-white text-black rounded-xl text-center text-[10px] font-black uppercase">WA</a>
                  )}
                  {lead.instagram && (
                    <a href={lead.instagram} target="_blank" className="flex-1 py-3 border border-white/20 bg-white/5 text-white rounded-xl text-center text-[10px] font-black uppercase">IG</a>
                  )}
                  {lead.website && (
                    <a href={lead.website} target="_blank" className="flex-1 py-3 border border-white/20 bg-white/5 text-white rounded-xl text-center text-[10px] font-black uppercase">WEB</a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default IntelligenceTool;
