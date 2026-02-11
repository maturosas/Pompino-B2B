
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Lead } from '../types';

interface CRMViewProps {
  leads: Lead[];
  onRemove: (id: string) => void;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
}

type SortKey = 'name' | 'category' | 'status' | 'savedAt';

const CRMView: React.FC<CRMViewProps> = ({ leads, onRemove, onUpdateLead }) => {
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('savedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const searchRef = useRef<HTMLDivElement>(null);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const processedLeads = useMemo(() => {
    let result = [...leads];

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l => 
        l.name.toLowerCase().includes(q) || 
        l.category.toLowerCase().includes(q) || 
        l.location.toLowerCase().includes(q) ||
        (l.contactName || '').toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(l => l.status === statusFilter);
    }

    // Sorting
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
  }, [leads, search, sortKey, sortOrder, statusFilter]);

  // Suggestions logic (Top 5 matches based on name)
  const suggestions = useMemo(() => {
    if (!search || search.length < 2) return [];
    return leads
      .filter(l => l.name.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 5);
  }, [leads, search]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Search & Filter Bar */}
      <div className="p-8 border border-white/20 rounded-3xl bg-black shadow-2xl">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">ARCHIVO CENTRAL <span className="text-white/20">B2B</span></h2>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Base de Datos de Inteligencia</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-96" ref={searchRef}>
              <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                placeholder="BUSCAR ENTIDAD O CONTACTO..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full h-12 bg-black border border-white/20 px-12 rounded-xl text-xs font-black text-white placeholder:text-white/10 focus:border-white transition-all outline-none"
              />
              
              {/* Instant Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-black border border-white/20 rounded-xl overflow-hidden z-50 shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-in slide-in-from-top-2 duration-200">
                  {suggestions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSearch(s.name);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-5 py-3 hover:bg-white hover:text-black transition-colors border-b border-white/5 last:border-0 flex justify-between items-center group"
                    >
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black uppercase tracking-widest">{s.name}</span>
                        <span className="text-[8px] font-bold text-white/30 group-hover:text-black/50 uppercase">{s.category}</span>
                      </div>
                      <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-12 bg-black border border-white/20 px-4 rounded-xl text-[10px] font-black text-white uppercase tracking-widest outline-none focus:border-white cursor-pointer"
            >
              <option value="all">TODOS LOS STATUS</option>
              <option value="discovered">DESCUBIERTO</option>
              <option value="qualified">CALIFICADO</option>
              <option value="contacted">EN GESTIÓN</option>
              <option value="closed">CIERRE ÉXITO</option>
            </select>

            <button className="h-12 px-6 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all active:scale-95 shadow-xl">
              EXPORTAR CSV
            </button>
          </div>
        </div>
      </div>

      {/* Leads Ledger */}
      <div className="border border-white/20 rounded-3xl overflow-hidden bg-black shadow-2xl">
        <div className="overflow-x-auto custom-scroll">
          <table className="w-full text-left border-collapse min-w-[1300px]">
            <thead>
              <tr className="bg-white/5 text-white/20 text-[9px] font-black uppercase tracking-[0.3em] border-b border-white/20">
                <th className="px-8 py-5 w-[22%] cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('name')}>
                  <div className="flex items-center gap-2">
                    ENTIDAD / RAZÓN {sortKey === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </div>
                </th>
                <th className="px-6 py-5 w-[8%] text-center">CLIENTE</th>
                <th className="px-8 py-5 w-[15%]">CONTACTO</th>
                <th className="px-8 py-5 w-[15%]">TITULAR</th>
                <th className="px-8 py-5 w-[30%]">SEGUIMIENTO & STATUS</th>
                <th className="px-8 py-5 w-[10%] text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {processedLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center text-white/5 uppercase font-black tracking-[1em] italic text-[10px]">
                    No se encontraron coincidencias en el archivo
                  </td>
                </tr>
              ) : (
                processedLeads.map((lead) => (
                  <tr key={lead.id} className={`group transition-all hover:bg-white/[0.04] border-white/5 ${lead.isClient ? 'bg-white/[0.02]' : 'bg-black'}`}>
                    <td className="px-8 py-7">
                      <div className="font-black text-white text-[16px] uppercase italic mb-1 group-hover:text-blue-500 transition-colors leading-none tracking-tight">{lead.name}</div>
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{lead.category}</span>
                        <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                        <span className="text-[9px] font-bold text-white/20 uppercase tracking-tighter truncate max-w-[150px]">{lead.location}</span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-7 text-center">
                      <button 
                        onClick={() => onUpdateLead(lead.id, { isClient: !lead.isClient })}
                        className={`w-14 h-7 rounded-full transition-all relative border-2 ${
                          lead.isClient ? 'bg-white border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-black border-white/20'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${
                          lead.isClient ? 'right-0.5 bg-black' : 'left-0.5 bg-white/10'
                        }`}></div>
                      </button>
                    </td>

                    <td className="px-8 py-7">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-white font-black text-[13px] mono tracking-tight group-hover:text-white transition-colors">{lead.phone || 'S/N'}</span>
                        <span className="text-white/20 text-[9px] lowercase font-medium truncate max-w-[180px] group-hover:text-white/40 transition-colors" title={lead.email}>
                          {lead.email || 'no-email@detected.com'}
                        </span>
                      </div>
                    </td>

                    <td className="px-8 py-7">
                      <input 
                        type="text" 
                        placeholder="N. TITULAR..."
                        value={lead.contactName || ''}
                        onChange={(e) => onUpdateLead(lead.id, { contactName: e.target.value })}
                        className="w-full bg-black border border-white/10 focus:border-white rounded-xl px-4 py-2.5 text-[11px] text-white font-black uppercase placeholder:text-white/5 outline-none transition-all shadow-inner"
                      />
                    </td>

                    <td className="px-8 py-7">
                      <div className="flex gap-3 items-center">
                        <select 
                          value={lead.status}
                          onChange={(e) => onUpdateLead(lead.id, { status: e.target.value as any })}
                          className={`bg-black border border-white/20 rounded-xl px-3 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none transition-all focus:border-white cursor-pointer ${
                            lead.status === 'closed' ? 'text-green-500' :
                            lead.status === 'contacted' ? 'text-blue-500' : 'text-white/70'
                          }`}
                        >
                          <option value="discovered">DESC</option>
                          <option value="qualified">QUAL</option>
                          <option value="contacted">GEST</option>
                          <option value="closed">EXIT</option>
                        </select>
                        <input 
                          type="text" 
                          placeholder="AGREGAR NOTA INTERNA..."
                          value={lead.notes || ''}
                          onChange={(e) => onUpdateLead(lead.id, { notes: e.target.value })}
                          className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-5 py-2.5 text-[11px] text-white/50 placeholder:text-white/5 outline-none focus:border-white italic transition-all"
                        />
                      </div>
                    </td>

                    <td className="px-8 py-7 text-right">
                      <button 
                        onClick={() => onRemove(lead.id)}
                        className="p-3 text-white/5 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all border border-transparent hover:border-red-500/20"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CRMView;
