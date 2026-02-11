
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

  const addLog = (msg: string) => setLog(prev => [...prev.slice(-10), msg]);

  const runPipeline = async () => {
    const cleanZone = zone.trim();
    const cleanType = type.trim();
    if (!cleanZone || !cleanType) return;
    setIsSearching(true);
    setLog([]);
    addLog(`> INICIANDO MOTOR DE RASTREO B2B...`);
    saveToHistory(cleanZone, cleanType);
    try {
      const newLeads = await scrapeLeads(cleanZone, cleanType, true);
      onUpdateLeads([...newLeads, ...leads]);
      addLog(`> EXITO: ${newLeads.length} ENTIDADES EXTRAIDAS.`);
    } catch (err: any) {
      console.error(err);
      addLog(`> ERROR: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const zoneSuggestions = useMemo(() => Array.from(new Set([...recentZones, ...DEFAULT_ZONES])), [recentZones]);
  const nicheSuggestions = useMemo(() => Array.from(new Set([...recentNiches, ...COMMON_NICHES])), [recentNiches]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-full">
      {/* Search Section */}
      <div className="p-6 lg:p-10 border-2 border-white rounded-[2rem] bg-black shadow-2xl">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-10">
          <div className="lg:col-span-5 space-y-3">
            <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.4em] ml-1">Zona Operativa</label>
            <input 
              list="zones-history" 
              value={zone} 
              onChange={(e) => setZone(e.target.value)} 
              placeholder="Localidad / Provincia" 
              className="w-full h-16 bg-black border-2 border-white/20 px-6 lg:px-8 rounded-2xl font-black text-white text-base lg:text-lg focus:border-white outline-none transition-all shadow-inner placeholder:text-white/10" 
            />
            <datalist id="zones-history">{zoneSuggestions.map(z => <option key={z} value={z} />)}</datalist>
          </div>
          <div className="lg:col-span-5 space-y-3">
            <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.4em] ml-1">Rubro de Interés</label>
            <input 
              list="niches-history" 
              value={type} 
              onChange={(e) => setType(e.target.value)} 
              placeholder="Tipo de Negocio" 
              className="w-full h-16 bg-black border-2 border-white/20 px-6 lg:px-8 rounded-2xl font-black text-white text-base lg:text-lg focus:border-white outline-none transition-all shadow-inner placeholder:text-white/10" 
            />
            <datalist id="niches-history">{nicheSuggestions.map(n => <option key={n} value={n} />)}</datalist>
          </div>
          <div className="lg:col-span-2 flex items-end">
            <button 
              onClick={runPipeline} 
              disabled={isSearching || !zone || !type} 
              className={`w-full h-16 rounded-2xl font-black uppercase text-[14px] tracking-[0.2em] transition-all whitespace-nowrap overflow-hidden text-ellipsis px-4 ${isSearching ? 'bg-white/10 text-white/20 border-white/10 cursor-not-allowed' : 'bg-white text-black hover:bg-white/90 active:scale-95 border-white shadow-[0_10px_40px_rgba(255,255,255,0.1)]'}`}
            >
              {isSearching ? '...' : 'RASTREAR'}
            </button>
          </div>
        </div>
        {log.length > 0 && (
          <div className="mt-8 p-6 border-t border-white/10 mono text-[11px] text-white/60 bg-white/[0.02] rounded-xl overflow-hidden">
            {log.map((m, i) => (
              <div key={i} className="mb-1.5 flex items-start gap-3">
                <span className="text-white/20 shrink-0 whitespace-nowrap">[{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}]</span>
                <span className={`font-bold break-all leading-relaxed ${m.includes('ERROR') ? 'text-red-500' : 'text-white'}`}>{m}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="flex justify-between items-center px-6 gap-4">
        <h3 className="font-black text-white text-[13px] lg:text-[16px] uppercase tracking-[0.5em] italic whitespace-nowrap min-w-0 truncate">Buffer de Inteligencia</h3>
        <span className="text-[10px] lg:text-[11px] font-black bg-white/10 border border-white/20 text-white px-4 lg:px-6 py-2 rounded-full uppercase tracking-widest shrink-0">
          {leads.length} HALLAZGOS
        </span>
      </div>

      {/* Results View */}
      <div className="space-y-6">
        <div className="hidden lg:block border-2 border-white/20 rounded-[2.5rem] overflow-hidden bg-black shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-white/40 text-[11px] font-black uppercase tracking-[0.4em] border-b border-white/10">
                <th className="px-10 py-6 w-[25%] whitespace-nowrap">ENTIDAD</th>
                <th className="px-10 py-6 w-[20%] whitespace-nowrap">CONTACTO</th>
                <th className="px-10 py-6 w-[25%] whitespace-nowrap">UBICACIÓN</th>
                <th className="px-10 py-6 text-right w-[15%]">ACCIÓN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {leads.length === 0 ? (
                <tr><td colSpan={4} className="px-10 py-40 text-center text-white/5 uppercase font-black tracking-[2em] text-[14px] italic">Protocolo Standby</td></tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-white/[0.04] transition-colors bg-black group">
                    <td className="px-10 py-6">
                      <div className="font-black text-white text-[17px] uppercase italic leading-none mb-1.5 truncate max-w-[320px]">{lead.name}</div>
                      <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{lead.category}</span>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex flex-wrap gap-2.5 mb-3">
                        {lead.instagram && <a href={lead.instagram} target="_blank" className="text-[9px] font-black border border-white/20 px-3 py-1 rounded-lg bg-white/5 hover:bg-white hover:text-black transition-all">IG</a>}
                        {lead.website && <a href={lead.website} target="_blank" className="text-[9px] font-black border border-white/20 px-3 py-1 rounded-lg bg-white/5 hover:bg-white hover:text-black transition-all">WEB</a>}
                        {lead.whatsapp && <a href={`https://wa.me/${lead.whatsapp}`} target="_blank" className="text-[9px] font-black border border-white/40 px-3 py-1 rounded-lg bg-white text-black hover:scale-105 transition-all">WA</a>}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-white font-black text-[13px] mono">{lead.phone || 'S/N'}</span>
                        <span className="text-white/20 text-[10px] lowercase italic truncate max-w-[200px]">{lead.email || 'no-email@detected.com'}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-white/60 font-bold text-[13px] leading-relaxed uppercase tracking-tight max-w-[300px] truncate">{lead.location}</td>
                    <td className="px-10 py-6 text-right">
                      <button onClick={() => onSaveToCRM(lead)} disabled={savedIds.has(lead.id)} className={`px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${savedIds.has(lead.id) ? 'bg-white/5 text-white/20 border-white/5' : 'border-2 border-white text-white hover:bg-white hover:text-black shadow-lg shadow-white/5'}`}>
                        {savedIds.has(lead.id) ? 'EN CRM' : 'ARCHIVAR'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden space-y-6">
          {leads.length === 0 ? (
            <div className="px-8 py-24 text-center text-white/10 uppercase font-black text-[11px] border-2 border-white/5 rounded-[2rem] tracking-[1em] italic">
              VACIO
            </div>
          ) : (
            leads.map((lead) => (
              <div key={lead.id} className="p-7 border-2 border-white/10 rounded-[2rem] bg-black space-y-6 shadow-xl active:scale-[0.98] transition-transform">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-white text-lg uppercase italic leading-tight mb-1 truncate pr-2">{lead.name}</h4>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{lead.category}</p>
                  </div>
                  <button 
                    onClick={() => onSaveToCRM(lead)} 
                    disabled={savedIds.has(lead.id)}
                    className={`h-11 px-5 rounded-xl text-[10px] font-black uppercase border-2 transition-all shrink-0 ${savedIds.has(lead.id) ? 'bg-white/10 text-white/30 border-white/10' : 'bg-white text-black border-white shadow-xl'}`}
                  >
                    {savedIds.has(lead.id) ? 'OK' : 'ADD'}
                  </button>
                </div>
                
                <div className="space-y-2 py-4 border-y border-white/5">
                  <div className="text-white font-black text-base mono tracking-tighter">{lead.phone || 'Teléfono no detectado'}</div>
                  <div className="text-white/40 text-xs italic truncate">{lead.email || 'Email no disponible'}</div>
                  <div className="text-white/60 text-[10px] font-black mt-2 uppercase tracking-tighter leading-tight line-clamp-2">{lead.location}</div>
                </div>

                <div className="flex gap-2">
                  {lead.whatsapp && <a href={`https://wa.me/${lead.whatsapp}`} target="_blank" className="flex-1 py-4 bg-white text-black rounded-2xl text-center text-[10px] font-black uppercase">WhatsApp</a>}
                  <div className="flex gap-2 shrink-0">
                    {lead.instagram && <a href={lead.instagram} target="_blank" className="w-12 h-12 flex items-center justify-center border border-white/20 bg-white/5 text-white rounded-2xl text-[10px] font-black uppercase">IG</a>}
                    {lead.website && <a href={lead.website} target="_blank" className="w-12 h-12 flex items-center justify-center border border-white/20 bg-white/5 text-white rounded-2xl text-[10px] font-black uppercase">WEB</a>}
                  </div>
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
