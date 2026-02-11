
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Lead } from '../types';

interface CRMViewProps {
  leads: Lead[];
  onRemove: (id: string) => void;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  onAddManualLead: (lead: Lead) => void;
}

type SortKey = 'name' | 'category' | 'status' | 'savedAt' | 'followUpDate';
type DateFilter = 'all' | 'today' | 'this-week' | 'upcoming' | 'overdue' | 'none';
type ClientFilter = 'all' | 'clients' | 'leads';

const CRMView: React.FC<CRMViewProps> = ({ leads, onRemove, onUpdateLead, onAddManualLead }) => {
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('savedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<ClientFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);

  const [newLead, setNewLead] = useState<Partial<Lead>>({
    name: '', category: '', location: '', phone: '', email: '', website: '', instagram: '', status: 'discovered', isClient: false
  });

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

  const processedLeads = useMemo(() => {
    let result = [...leads];
    const todayStr = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l => l.name.toLowerCase().includes(q) || l.category.toLowerCase().includes(q) || l.location.toLowerCase().includes(q) || (l.contactName || '').toLowerCase().includes(q) || (l.notes || '').toLowerCase().includes(q));
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
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [leads, search, sortKey, sortOrder, statusFilter, clientFilter, dateFilter]);

  const handleExportCSV = () => {
    if (processedLeads.length === 0) return;
    const headers = ["Nombre", "Categoria", "Ubicacion", "Telefono", "Email", "Web", "Instagram", "Status", "Es Cliente", "Notas", "Seguimiento"];
    const escape = (str: any) => `"${(str || "").toString().replace(/"/g, '""')}"`;
    
    const csvContent = [
      headers.join(","),
      ...processedLeads.map(l => [
        escape(l.name), escape(l.category), escape(l.location), escape(l.phone), escape(l.email), 
        escape(l.website), escape(l.instagram), escape(l.status), l.isClient ? "SI" : "NO", 
        escape(l.notes), escape(l.followUpDate)
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `pompino_b2b_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleManualAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name) return;
    onAddManualLead({ ...newLead as Lead, id: `manual-${Date.now()}`, savedAt: Date.now() });
    setIsAddModalOpen(false);
    setNewLead({ name: '', category: '', location: '', phone: '', email: '', website: '', instagram: '', status: 'discovered', isClient: false });
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'closed': return 'text-white border-white bg-white/30 font-black';
      case 'contacted': return 'text-white border-white/60 bg-white/10 font-bold';
      case 'qualified': return 'text-white/70 border-white/30 bg-white/[0.04]';
      default: return 'text-white/30 border-white/10 bg-transparent';
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 max-w-full overflow-hidden">
      {/* Search & Filters Panel */}
      <div className="p-4 lg:p-5 border-2 border-white rounded-2xl bg-black shadow-2xl">
        <div className="flex flex-col xl:flex-row justify-between gap-4">
          <div className="flex items-center gap-6 flex-1">
             <div className="relative flex-1 xl:w-96" ref={searchRef}>
               <input 
                type="text" 
                placeholder="BUSCAR EN ARCHIVO..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="w-full h-11 lg:h-12 bg-black border-2 border-white/20 px-5 rounded-xl text-[10px] lg:text-[11px] font-black text-white outline-none focus:border-white uppercase placeholder:text-white/10" 
               />
             </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:grid sm:grid-cols-2 lg:flex lg:flex-row">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11 lg:h-12 flex-1 bg-black border-2 border-white/20 px-3 lg:px-4 rounded-xl text-[9px] font-black text-white uppercase outline-none cursor-pointer">
              <option value="all">ESTADOS</option>
              <option value="discovered">DESCUBIERTO</option>
              <option value="qualified">CALIFICADO</option>
              <option value="contacted">GESTIÓN</option>
              <option value="closed">ÉXITO</option>
            </select>
            <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value as ClientFilter)} className="h-11 lg:h-12 flex-1 bg-black border-2 border-white/20 px-3 lg:px-4 rounded-xl text-[9px] font-black text-white uppercase outline-none cursor-pointer">
              <option value="all">UNIVERSO</option>
              <option value="clients">CARTERA</option>
              <option value="leads">PROSPECTOS</option>
            </select>
            <button onClick={() => setIsAddModalOpen(true)} className="h-11 lg:h-12 flex-1 px-4 lg:px-6 border-2 border-white/40 text-white text-[9px] lg:text-[10px] font-black uppercase rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2">NUEVO</button>
            <button onClick={handleExportCSV} className="h-11 lg:h-12 flex-1 px-4 lg:px-6 border-2 border-white bg-white text-black text-[9px] lg:text-[10px] font-black uppercase rounded-xl hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2">EXPORTAR</button>
          </div>
        </div>
      </div>

      {/* Extreme Density Table */}
      <div className="border-2 border-white/20 rounded-2xl overflow-hidden bg-black shadow-2xl relative">
        {/* Indicador de scroll para móvil */}
        <div className="lg:hidden absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
           <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
        </div>

        <div className="overflow-x-auto custom-scroll">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-white/5 text-white/40 text-[9px] font-black uppercase tracking-[0.4em] border-b-2 border-white/20">
                <th className="px-5 py-4 w-[20%] cursor-pointer" onClick={() => setSortKey('name')}>ENTIDAD</th>
                <th className="px-2 py-4 w-[4%] text-center">CLI</th>
                <th className="px-5 py-4 w-[15%]">CONTACTO</th>
                <th className="px-5 py-4 w-[12%]">LINKS</th>
                <th className="px-5 py-4 w-[12%] cursor-pointer" onClick={() => setSortKey('followUpDate')}>FECHA</th>
                <th className="px-5 py-4 w-[33%]">STATUS & NOTAS</th>
                <th className="px-3 py-4 w-[4%] text-right">OPS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {processedLeads.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-32 text-center text-white/5 uppercase font-black text-[12px] tracking-[1.5em] italic">Buffer de Archivo Vacío</td></tr>
              ) : (
                processedLeads.map((lead) => (
                  <tr key={lead.id} className={`group hover:bg-white/[0.06] ${lead.isClient ? 'bg-white/[0.03]' : 'bg-black'}`}>
                    <td className="px-5 py-4">
                      <div className="font-black text-white text-[13px] uppercase italic mb-1 truncate max-w-[200px]">{lead.name}</div>
                      <span className="text-[8px] text-white/40 uppercase tracking-tighter">{lead.category}</span>
                    </td>
                    <td className="px-2 py-4 text-center">
                      <button onClick={() => onUpdateLead(lead.id, { isClient: !lead.isClient })} className={`mx-auto w-8 h-4 rounded-full relative border-2 transition-all ${lead.isClient ? 'bg-white border-white' : 'bg-black border-white/20'}`}><div className={`absolute top-0.5 w-2 h-2 rounded-full ${lead.isClient ? 'right-0.5 bg-black' : 'left-0.5 bg-white/20'}`}></div></button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-white font-black text-[11px] mono truncate">{lead.phone || 'S/N'}</span>
                        <span className="text-white/30 text-[8px] lowercase italic truncate max-w-[150px]">{lead.email || '---'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        {lead.instagram && <a href={lead.instagram} target="_blank" className="p-1.5 border border-white/20 rounded hover:bg-white hover:text-black transition-all text-[8px] font-black">IG</a>}
                        {lead.website && <a href={lead.website} target="_blank" className="p-1.5 border border-white/20 rounded hover:bg-white hover:text-black transition-all text-[8px] font-black">WEB</a>}
                        {lead.whatsapp && <a href={`https://wa.me/${lead.whatsapp}`} target="_blank" className="p-1.5 border border-white rounded bg-white text-black text-[8px] font-black">WA</a>}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <input type="date" value={lead.followUpDate || ''} onChange={(e) => onUpdateLead(lead.id, { followUpDate: e.target.value })} className="bg-black border border-white/20 rounded px-2 py-1 text-[10px] text-white font-black uppercase outline-none focus:border-white" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2 items-center">
                        <select value={lead.status} onChange={(e) => onUpdateLead(lead.id, { status: e.target.value as any })} className={`border-2 rounded px-2 py-1 text-[8px] font-black uppercase outline-none h-8 ${getStatusStyles(lead.status)}`}>
                          <option value="discovered" className="bg-black text-white/40">DESC</option>
                          <option value="qualified" className="bg-black text-white/60">QUAL</option>
                          <option value="contacted" className="bg-black text-white/90">GEST</option>
                          <option value="closed" className="bg-black text-white">EXIT</option>
                        </select>
                        <input type="text" value={lead.notes || ''} onChange={(e) => onUpdateLead(lead.id, { notes: e.target.value })} className="flex-1 bg-white/[0.03] border border-white/10 rounded px-3 py-1 text-[10px] text-white outline-none focus:border-white italic h-8" />
                      </div>
                    </td>
                    <td className="px-3 py-4 text-right">
                      <button onClick={() => onRemove(lead.id)} className="p-2 text-white/5 hover:text-white transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Responsive Manual Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
          <div className="bg-black border-2 border-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 lg:p-10 shadow-2xl custom-scroll">
            <h3 className="text-xl lg:text-2xl font-black text-white uppercase italic mb-8 flex justify-between items-center">
              NUEVA ENTIDAD B2B
              <button onClick={() => setIsAddModalOpen(false)} className="lg:hidden text-white/20">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </h3>
            <form onSubmit={handleManualAddSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[9px] font-black text-white/20 uppercase ml-1">Nombre</label>
                   <input required placeholder="ENTIDAD" value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} className="w-full bg-black border-2 border-white/20 p-4 text-white font-black rounded-xl outline-none focus:border-white text-sm" />
                </div>
                <div className="space-y-1">
                   <label className="text-[9px] font-black text-white/20 uppercase ml-1">Rubro</label>
                   <input required placeholder="DISTRIBUIDORA / BAR" value={newLead.category} onChange={e => setNewLead({...newLead, category: e.target.value})} className="w-full bg-black border-2 border-white/20 p-4 text-white font-black rounded-xl outline-none focus:border-white text-sm" />
                </div>
                <div className="space-y-1">
                   <label className="text-[9px] font-black text-white/20 uppercase ml-1">Teléfono</label>
                   <input placeholder="+54 9..." value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} className="w-full bg-black border-2 border-white/20 p-4 text-white font-black rounded-xl outline-none focus:border-white text-sm" />
                </div>
                <div className="space-y-1">
                   <label className="text-[9px] font-black text-white/20 uppercase ml-1">Email</label>
                   <input placeholder="INFO@..." value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} className="w-full bg-black border-2 border-white/20 p-4 text-white font-black rounded-xl outline-none focus:border-white text-sm" />
                </div>
                <div className="space-y-1">
                   <label className="text-[9px] font-black text-white/20 uppercase ml-1">Website URL</label>
                   <input placeholder="HTTPS://..." value={newLead.website} onChange={e => setNewLead({...newLead, website: e.target.value})} className="w-full bg-black border-2 border-white/20 p-4 text-white font-black rounded-xl outline-none focus:border-white text-sm" />
                </div>
                <div className="space-y-1">
                   <label className="text-[9px] font-black text-white/20 uppercase ml-1">Instagram URL</label>
                   <input placeholder="HTTPS://INSTAGRAM..." value={newLead.instagram} onChange={e => setNewLead({...newLead, instagram: e.target.value})} className="w-full bg-black border-2 border-white/20 p-4 text-white font-black rounded-xl outline-none focus:border-white text-sm" />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4 border-t border-white/10">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-8 py-3 font-black text-white/40 uppercase text-xs tracking-widest">CANCELAR</button>
                <button type="submit" className="px-10 py-4 bg-white text-black font-black rounded-xl uppercase text-xs tracking-widest hover:scale-105 transition-transform">GUARDAR REGISTRO</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMView;
