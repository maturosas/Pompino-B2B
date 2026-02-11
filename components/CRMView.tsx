
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Lead } from '../types';

interface CRMViewProps {
  leads: Lead[];
  onRemove: (id: string) => void;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
}

type SortKey = 'name' | 'category' | 'status' | 'savedAt' | 'followUpDate';
type DateFilter = 'all' | 'today' | 'this-week' | 'upcoming' | 'overdue' | 'none';
type ClientFilter = 'all' | 'clients' | 'leads';

const CRMView: React.FC<CRMViewProps> = ({ leads, onRemove, onUpdateLead }) => {
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('savedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<ClientFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setClientFilter('all');
    setDateFilter('all');
  };

  const isAnyFilterActive = search !== '' || statusFilter !== 'all' || clientFilter !== 'all' || dateFilter !== 'all';

  const processedLeads = useMemo(() => {
    let result = [...leads];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayStr = now.toISOString().split('T')[0];
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    // Multi-field search logic
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l => 
        l.name.toLowerCase().includes(q) || 
        l.category.toLowerCase().includes(q) || 
        l.location.toLowerCase().includes(q) ||
        (l.contactName || '').toLowerCase().includes(q) ||
        (l.notes || '').toLowerCase().includes(q) ||
        (l.phone || '').includes(q) ||
        (l.email || '').toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') result = result.filter(l => l.status === statusFilter);
    
    if (clientFilter === 'clients') result = result.filter(l => l.isClient);
    else if (clientFilter === 'leads') result = result.filter(l => !l.isClient);

    if (dateFilter !== 'all') {
      result = result.filter(l => {
        if (!l.followUpDate) return dateFilter === 'none';
        if (dateFilter === 'today') return l.followUpDate === todayStr;
        if (dateFilter === 'overdue') return l.followUpDate < todayStr;
        if (dateFilter === 'this-week') return l.followUpDate >= todayStr && l.followUpDate <= nextWeekStr;
        if (dateFilter === 'upcoming') return l.followUpDate > nextWeekStr;
        return true;
      });
    }

    result.sort((a, b) => {
      let valA: any = a[sortKey as keyof Lead] || '';
      let valB: any = b[sortKey as keyof Lead] || '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [leads, search, sortKey, sortOrder, statusFilter, clientFilter, dateFilter]);

  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    const seen = new Set();
    const matches: any[] = [];
    for (const lead of leads) {
      const nameMatch = lead.name.toLowerCase().includes(q);
      const categoryMatch = lead.category.toLowerCase().includes(q);
      if ((nameMatch || categoryMatch) && !seen.has(lead.id)) {
        seen.add(lead.id);
        matches.push({ id: lead.id, name: lead.name, category: lead.category, type: nameMatch ? 'Entidad' : 'Categoría' });
      }
      if (matches.length >= 6) break;
    }
    return matches;
  }, [leads, search]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortOrder('asc'); }
  };

  const handleSendEmail = (lead: Lead) => {
    if (!lead.email || lead.email.includes('no-email')) {
      alert("No se ha detectado un email válido.");
      return;
    }
    const subject = encodeURIComponent(`Seguimiento B2B - ${lead.name}`);
    const body = encodeURIComponent(`Hola ${lead.contactName || lead.name},\n\nEspero que estés muy bien...`);
    window.location.href = `mailto:${lead.email}?subject=${subject}&body=${body}`;
  };

  const getFollowUpStyles = (date?: string) => {
    if (!date) return 'text-white/10 border-white/5 bg-transparent';
    const today = new Date().toISOString().split('T')[0];
    if (date < today) return 'text-white border-white bg-white/20 shadow-[0_0_15px_rgba(255,255,255,0.3)] font-black ring-1 ring-white/50'; // CRÍTICO
    if (date === today) return 'text-white border-white/60 bg-white/10 font-bold'; // HOY
    return 'text-white/40 border-white/10 bg-transparent'; // FUTURO
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'closed': return 'text-white border-white bg-white/30 font-black'; // EXIT
      case 'contacted': return 'text-white border-white/60 bg-white/10 font-bold'; // GEST
      case 'qualified': return 'text-white/70 border-white/30 bg-white/[0.04]'; // QUAL
      case 'discovered': 
      default: return 'text-white/30 border-white/10 bg-transparent'; // DESC
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* High-Performance Command Center Filter Bar */}
      <div className="p-4 border-2 border-white rounded-2xl bg-black shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div className="flex items-center gap-6 w-full xl:w-auto">
             <div className="hidden sm:block shrink-0">
                <h2 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none mb-1">ARCHIVO <span className="text-white/20">DINÁMICO</span></h2>
                <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.5em]">Real-Time Data Ledger</p>
             </div>
             
             <div className="relative flex-1 xl:w-96" ref={searchRef}>
               <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40 z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
               <input
                 type="text"
                 placeholder="BUSCAR ENTIDAD, NOTA O CONTACTO..."
                 value={search}
                 onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true); }}
                 onFocus={() => setShowSuggestions(true)}
                 className={`w-full h-12 bg-black border-2 px-12 rounded-xl text-[11px] font-black text-white placeholder:text-white/10 focus:border-white transition-all outline-none uppercase shadow-inner ${search ? 'border-white' : 'border-white/20'}`}
               />
               {showSuggestions && suggestions.length > 0 && (
                 <div className="absolute top-full left-0 right-0 mt-2 bg-black border-2 border-white rounded-xl overflow-hidden z-50 shadow-[0_30px_70px_rgba(0,0,0,1)]">
                   {suggestions.map((s) => (
                     <button key={s.id} onClick={() => { setSearch(s.name); setShowSuggestions(false); }} className="w-full text-left px-5 py-3 hover:bg-white group transition-all border-b border-white/10 last:border-0 flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black uppercase text-white group-hover:text-black">{s.name}</span>
                          <span className="text-[8px] font-black uppercase text-white/30 group-hover:text-black/40 tracking-wider">{s.category}</span>
                        </div>
                        <span className="text-[8px] font-black text-white/20 group-hover:text-black/30 italic border border-white/10 group-hover:border-black/10 px-2 py-0.5 rounded">{s.type}</span>
                     </button>
                   ))}
                 </div>
               )}
             </div>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full xl:w-auto">
            <div className="flex flex-col gap-1">
              <label className="text-[7px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Estado</label>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)} 
                className={`h-10 bg-black border-2 px-4 rounded-xl text-[9px] font-black text-white uppercase outline-none cursor-pointer focus:border-white transition-colors ${statusFilter !== 'all' ? 'border-white' : 'border-white/20'}`}
              >
                <option value="all">TODOS LOS ESTADOS</option>
                <option value="discovered">DESCUBIERTO</option>
                <option value="qualified">CALIFICADO</option>
                <option value="contacted">EN GESTIÓN</option>
                <option value="closed">ÉXITO COMERCIAL</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[7px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Segmentación</label>
              <select 
                value={clientFilter} 
                onChange={(e) => setClientFilter(e.target.value as ClientFilter)} 
                className={`h-10 bg-black border-2 px-4 rounded-xl text-[9px] font-black text-white uppercase outline-none cursor-pointer focus:border-white transition-colors ${clientFilter !== 'all' ? 'border-white' : 'border-white/20'}`}
              >
                <option value="all">TODOS LOS REGISTROS</option>
                <option value="clients">CARTERA CLIENTES</option>
                <option value="leads">SOLO PROSPECTOS</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[7px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Calendario</label>
              <select 
                value={dateFilter} 
                onChange={(e) => setDateFilter(e.target.value as DateFilter)} 
                className={`h-10 bg-black border-2 px-4 rounded-xl text-[9px] font-black text-white uppercase outline-none cursor-pointer focus:border-white transition-colors ${dateFilter !== 'all' ? 'border-white' : 'border-white/20'}`}
              >
                <option value="all">TODAS LAS FECHAS</option>
                <option value="overdue">VENCIDOS (!) </option>
                <option value="today">PLAN PARA HOY</option>
                <option value="this-week">PRÓX. 7 DÍAS</option>
                <option value="upcoming">FUTURO CERCANO</option>
                <option value="none">SIN ASIGNAR</option>
              </select>
            </div>

            {isAnyFilterActive && (
              <button 
                onClick={resetFilters}
                className="self-end h-10 px-4 border-2 border-white bg-white text-black text-[9px] font-black uppercase rounded-xl hover:bg-black hover:text-white transition-all flex items-center gap-2"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                RESETEAR
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Extreme Density Intelligence Ledger */}
      <div className="border-2 border-white/20 rounded-2xl overflow-hidden bg-black shadow-[0_40px_100px_rgba(0,0,0,1)]">
        <div className="overflow-x-auto custom-scroll">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-white/5 text-white/40 text-[9px] font-black uppercase tracking-[0.4em] border-b-2 border-white/20">
                <th className="px-5 py-3 w-[20%] cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('name')}>
                  ENTIDAD {sortKey === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-2 py-3 w-[4%] text-center">CLI</th>
                <th className="px-5 py-3 w-[15%]">INTEL CONTACTO</th>
                <th className="px-5 py-3 w-[12%]">TITULAR GESTIÓN</th>
                <th className="px-5 py-3 w-[10%] cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('followUpDate')}>
                  PROX. ACCIÓN {sortKey === 'followUpDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-5 py-3 w-[30%]">STATUS & LOG DE NOTAS</th>
                <th className="px-3 py-3 w-[4%] text-right">OPS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {processedLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-40 text-center text-white/5 uppercase font-black text-[13px] tracking-[2em] italic">
                    Sin coincidencias en el Archivo B2B
                  </td>
                </tr>
              ) : (
                processedLeads.map((lead) => (
                  <tr key={lead.id} className={`group transition-all hover:bg-white/[0.06] ${lead.isClient ? 'bg-white/[0.03]' : 'bg-black'}`}>
                    <td className="px-5 py-1.5 leading-none">
                      <div className="font-black text-white text-[12px] uppercase italic truncate max-w-[220px] mb-0.5 group-hover:translate-x-1 transition-transform">{lead.name}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black text-white/60 uppercase tracking-tighter">{lead.category}</span>
                        <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                        <span className="text-[8px] font-bold text-white/20 uppercase truncate max-w-[120px]">{lead.location}</span>
                      </div>
                    </td>
                    
                    <td className="px-2 py-1.5 text-center">
                      <button 
                        onClick={() => onUpdateLead(lead.id, { isClient: !lead.isClient })} 
                        className={`w-8 h-4 rounded-full relative border-2 transition-all ${lead.isClient ? 'bg-white border-white' : 'bg-black border-white/20 hover:border-white/50'}`}
                      >
                        <div className={`absolute top-0.5 w-2 h-2 rounded-full transition-all ${lead.isClient ? 'right-0.5 bg-black' : 'left-0.5 bg-white/20'}`}></div>
                      </button>
                    </td>

                    <td className="px-5 py-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col gap-0 flex-1 overflow-hidden">
                          <span className="text-white font-black text-[11px] mono truncate leading-tight tracking-tighter">{lead.phone || 'S/N'}</span>
                          <span className="text-white/30 text-[8px] lowercase truncate italic font-medium">{lead.email || 'no-email@intel.db'}</span>
                        </div>
                        {lead.email && !lead.email.includes('no-email') && (
                          <button onClick={() => handleSendEmail(lead)} className="p-1.5 text-white/20 hover:text-black hover:bg-white rounded border border-white/5 hover:border-white transition-all shadow-xl">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-1.5">
                      <input 
                        type="text" 
                        placeholder="TITULAR..." 
                        value={lead.contactName || ''} 
                        onChange={(e) => onUpdateLead(lead.id, { contactName: e.target.value })} 
                        className="w-full bg-black/60 border-2 border-white/10 focus:border-white rounded-lg px-2.5 py-1 text-[10px] text-white font-black uppercase outline-none h-7 transition-all shadow-inner placeholder:text-white/5" 
                      />
                    </td>

                    <td className="px-5 py-1.5">
                      <input 
                        type="date" 
                        value={lead.followUpDate || ''} 
                        onChange={(e) => onUpdateLead(lead.id, { followUpDate: e.target.value })} 
                        className={`w-full bg-black border-2 rounded-lg px-2 py-1 text-[10px] font-black uppercase outline-none h-7 transition-all shadow-xl ${getFollowUpStyles(lead.followUpDate)}`} 
                      />
                    </td>

                    <td className="px-5 py-1.5">
                      <div className="flex gap-2 items-center">
                        <select 
                          value={lead.status} 
                          onChange={(e) => onUpdateLead(lead.id, { status: e.target.value as any })} 
                          className={`border-2 rounded-lg px-3 py-1 text-[9px] font-black uppercase outline-none focus:border-white h-7 transition-all shadow-xl ${getStatusStyles(lead.status)}`}
                        >
                          <option value="discovered" className="bg-black text-white/30">DESCUBIERTO</option>
                          <option value="qualified" className="bg-black text-white/60">CALIFICADO</option>
                          <option value="contacted" className="bg-black text-white/90">EN GESTIÓN</option>
                          <option value="closed" className="bg-black text-white">ÉXITO</option>
                        </select>
                        <input 
                          type="text" 
                          placeholder="NOTAS DE SEGUIMIENTO..." 
                          value={lead.notes || ''} 
                          onChange={(e) => onUpdateLead(lead.id, { notes: e.target.value })} 
                          className="flex-1 bg-white/[0.03] border-2 border-white/5 rounded-lg px-4 py-1 text-[10px] text-white/80 font-bold placeholder:text-white/5 outline-none focus:border-white italic h-7 transition-all" 
                        />
                      </div>
                    </td>

                    <td className="px-3 py-1.5 text-right">
                      <button onClick={() => onRemove(lead.id)} className="p-1.5 text-white/5 hover:text-white hover:bg-white/10 rounded-lg border border-transparent hover:border-white/30 transition-all opacity-0 group-hover:opacity-100">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
         <div className="text-[8px] text-white/20 uppercase tracking-[0.5em] font-black italic">
           Base de Datos BZS v7.5 • Archivo Central Segurizado
         </div>
         <div className="text-[8px] text-white/5 uppercase tracking-[2em] font-black">
           High Contrast Engine
         </div>
      </div>
    </div>
  );
};

export default CRMView;
