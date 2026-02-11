
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
    <div className="space-y-6 animate-in fade-in duration-300 max-w-full">
      {/* Control Panel: Ultra Flexible Layout */}
      <div className="p-4 lg:p-6 border-2 border-white rounded-3xl bg-black shadow-2xl space-y-4">
        <div className="flex flex-col xl:flex-row gap-4">
          <div className="flex-1 relative" ref={searchRef}>
             <input 
              type="text" 
              placeholder="BUSCAR ENTIDAD O NOTA..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full h-12 lg:h-14 bg-black border-2 border-white/20 px-6 rounded-2xl text-[11px] lg:text-[13px] font-black text-white outline-none focus:border-white uppercase placeholder:text-white/10 shadow-inner" 
             />
          </div>
          <div className="grid grid-cols-2 lg:flex lg:flex-row gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-12 lg:h-14 flex-1 bg-black border-2 border-white/20 px-4 rounded-2xl text-[10px] font-black text-white uppercase outline-none focus:border-white min-w-[140px]">
              <option value="all">ESTADO: TODOS</option>
              <option value="discovered">DESCUBIERTO</option>
              <option value="qualified">CALIFICADO</option>
              <option value="contacted">GESTIÓN</option>
              <option value="closed">ÉXITO</option>
            </select>
            <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value as ClientFilter)} className="h-12 lg:h-14 flex-1 bg-black border-2 border-white/20 px-4 rounded-2xl text-[10px] font-black text-white uppercase outline-none focus:border-white min-w-[140px]">
              <option value="all">UNIVERSO</option>
              <option value="clients">CARTERA</option>
              <option value="leads">PROSPECTOS</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => setIsAddModalOpen(true)} className="flex-1 h-12 lg:h-14 border-2 border-white/40 text-white text-[11px] font-black uppercase rounded-2xl hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 tracking-widest active:scale-95">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            NUEVA ENTIDAD
          </button>
          <button onClick={handleExportCSV} className="flex-1 h-12 lg:h-14 border-2 border-white bg-white text-black text-[11px] font-black uppercase rounded-2xl hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2 tracking-widest active:scale-95">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M7 10l5 5m0 0l5-5m-5 5V3" /></svg>
            EXPORTAR CSV
          </button>
        </div>
      </div>

      {/* View Switch: Table Desktop / Card Mobile */}
      <div className="space-y-4">
        {/* DESKTOP TABLE */}
        <div className="hidden xl:block border-2 border-white/20 rounded-[2rem] overflow-hidden bg-black shadow-[0_40px_100px_rgba(0,0,0,1)]">
          <div className="overflow-x-auto custom-scroll">
            <table className="w-full text-left border-collapse min-w-[1250px]">
              <thead>
                <tr className="bg-white/[0.03] text-white/40 text-[9px] font-black uppercase tracking-[0.4em] border-b border-white/10">
                  <th className="px-6 py-5 w-[22%] cursor-pointer hover:text-white" onClick={() => setSortKey('name')}>ENTIDAD</th>
                  <th className="px-2 py-5 w-[6%] text-center">CLI</th>
                  <th className="px-6 py-5 w-[15%]">CONTACTO</th>
                  <th className="px-6 py-5 w-[12%]">LINKS</th>
                  <th className="px-6 py-5 w-[12%] cursor-pointer hover:text-white" onClick={() => setSortKey('followUpDate')}>FECHA</th>
                  <th className="px-6 py-5 w-[30%]">STATUS & LOG</th>
                  <th className="px-3 py-5 w-[3%] text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {processedLeads.map((lead) => (
                  <tr key={lead.id} className={`group hover:bg-white/[0.05] transition-all ${lead.isClient ? 'bg-white/[0.02]' : 'bg-black'}`}>
                    <td className="px-6 py-5">
                      <div className="font-black text-white text-[14px] uppercase italic mb-0.5 truncate max-w-[250px] group-hover:translate-x-1 transition-transform">{lead.name}</div>
                      <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold">{lead.category}</span>
                    </td>
                    <td className="px-2 py-5 text-center">
                      <button onClick={() => onUpdateLead(lead.id, { isClient: !lead.isClient })} className={`mx-auto w-10 h-5 rounded-full relative border-2 transition-all ${lead.isClient ? 'bg-white border-white' : 'bg-black border-white/20'}`}><div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${lead.isClient ? 'right-0.5 bg-black' : 'left-0.5 bg-white/20'}`}></div></button>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-white font-black text-[12px] mono truncate">{lead.phone || 'S/N'}</span>
                        <span className="text-white/20 text-[9px] lowercase italic truncate max-w-[160px]">{lead.email || '---'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex gap-2">
                        {lead.instagram && <a href={lead.instagram} target="_blank" className="p-1.5 border border-white/10 rounded-lg hover:bg-white hover:text-black transition-all text-[9px] font-black">IG</a>}
                        {lead.website && <a href={lead.website} target="_blank" className="p-1.5 border border-white/10 rounded-lg hover:bg-white hover:text-black transition-all text-[9px] font-black">WEB</a>}
                        {lead.whatsapp && <a href={`https://wa.me/${lead.whatsapp}`} target="_blank" className="p-1.5 border border-white rounded-lg bg-white text-black text-[9px] font-black shadow-lg">WA</a>}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <input type="date" value={lead.followUpDate || ''} onChange={(e) => onUpdateLead(lead.id, { followUpDate: e.target.value })} className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white font-black uppercase outline-none focus:border-white w-full" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex gap-2 items-center">
                        <select value={lead.status} onChange={(e) => onUpdateLead(lead.id, { status: e.target.value as any })} className={`border-2 rounded-lg px-2 py-1 text-[9px] font-black uppercase outline-none h-9 transition-all ${getStatusStyles(lead.status)}`}>
                          <option value="discovered" className="bg-black">DESCUBIERTO</option>
                          <option value="qualified" className="bg-black">CALIFICADO</option>
                          <option value="contacted" className="bg-black">GESTIÓN</option>
                          <option value="closed" className="bg-black">EXITO</option>
                        </select>
                        <input type="text" value={lead.notes || ''} onChange={(e) => onUpdateLead(lead.id, { notes: e.target.value })} placeholder="Log de notas..." className="flex-1 bg-white/[0.02] border border-white/10 rounded-lg px-4 py-1 text-[11px] text-white outline-none focus:border-white italic h-9 transition-all" />
                      </div>
                    </td>
                    <td className="px-3 py-5 text-right">
                      <button onClick={() => onRemove(lead.id)} className="p-2 text-white/5 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MOBILE CARDS */}
        <div className="xl:hidden space-y-4">
          {processedLeads.length === 0 ? (
            <div className="p-16 text-center text-white/10 uppercase font-black text-[11px] border-2 border-white/5 rounded-3xl italic tracking-widest">
              Filtro sin coincidencias
            </div>
          ) : (
            processedLeads.map((lead) => (
              <div key={lead.id} className={`p-6 border-2 border-white/20 rounded-[2rem] bg-black space-y-6 shadow-xl ${lead.isClient ? 'ring-1 ring-white/30' : ''}`}>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-white text-xl uppercase italic leading-none mb-1 truncate">{lead.name}</h4>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">{lead.category}</p>
                    <div className="flex items-center gap-2">
                       <span className="text-[9px] font-bold text-white/20 uppercase bg-white/5 px-2 py-0.5 rounded italic truncate max-w-[150px]">{lead.location}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <button 
                      onClick={() => onUpdateLead(lead.id, { isClient: !lead.isClient })} 
                      className={`w-12 h-6 rounded-full relative border-2 transition-all ${lead.isClient ? 'bg-white border-white' : 'bg-black border-white/20'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${lead.isClient ? 'right-0.5 bg-black' : 'left-0.5 bg-white/30'}`}></div>
                    </button>
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Client</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-5 border-y border-white/5">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-white/20 uppercase tracking-widest">Status</label>
                    <select 
                      value={lead.status} 
                      onChange={(e) => onUpdateLead(lead.id, { status: e.target.value as any })} 
                      className={`w-full border-2 rounded-xl px-2.5 py-2.5 text-[10px] font-black uppercase outline-none ${getStatusStyles(lead.status)}`}
                    >
                      <option value="discovered" className="bg-black">DISCO</option>
                      <option value="qualified" className="bg-black">QUAL</option>
                      <option value="contacted" className="bg-black">GEST</option>
                      <option value="closed" className="bg-black">EXIT</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-white/20 uppercase tracking-widest">Next Action</label>
                    <input 
                      type="date" 
                      value={lead.followUpDate || ''} 
                      onChange={(e) => onUpdateLead(lead.id, { followUpDate: e.target.value })} 
                      className="w-full bg-white/5 border border-white/20 rounded-xl px-2 py-2 text-[10px] text-white font-black uppercase" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-white/20 uppercase tracking-widest">Log Intel</label>
                  <input 
                    type="text" 
                    value={lead.notes || ''} 
                    onChange={(e) => onUpdateLead(lead.id, { notes: e.target.value })} 
                    placeholder="Bitácora de seguimiento..." 
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-5 py-3 text-[12px] text-white outline-none italic placeholder:text-white/5" 
                  />
                </div>

                <div className="flex gap-2">
                  <div className="flex flex-1 gap-2">
                    {lead.whatsapp && <a href={`https://wa.me/${lead.whatsapp}`} target="_blank" className="flex-1 py-3.5 bg-white text-black rounded-xl text-center text-[10px] font-black uppercase shadow-lg active:scale-95 transition-transform">WhatsApp</a>}
                    {lead.instagram && <a href={lead.instagram} target="_blank" className="flex-1 py-3.5 border-2 border-white/10 bg-white/5 text-white rounded-xl text-center text-[10px] font-black uppercase active:scale-95 transition-transform">Instagram</a>}
                  </div>
                  <button 
                    onClick={() => onRemove(lead.id)} 
                    className="w-14 h-11 border-2 border-red-500/20 bg-red-500/5 text-red-500 rounded-xl flex items-center justify-center active:bg-red-500 active:text-white transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/98 backdrop-blur-2xl">
          <div className="bg-black border-2 border-white rounded-[2.5rem] w-full max-w-2xl max-h-[95vh] overflow-y-auto p-8 lg:p-12 shadow-[0_0_100px_rgba(255,255,255,0.1)] custom-scroll">
            <header className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-2xl lg:text-3xl font-black text-white uppercase italic tracking-tighter">NUEVA ENTIDAD</h3>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">Protocolo de Carga Manual</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-white/30 hover:text-white transition-colors">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </header>
            
            <form onSubmit={handleManualAddSubmit} className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[11px] font-black text-white/40 uppercase ml-1">Razón Social / Nombre</label>
                   <input required placeholder="Ej: Distribuidora Norte" value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} className="w-full h-14 bg-black border-2 border-white/20 px-6 text-white font-black rounded-2xl outline-none focus:border-white transition-all" />
                </div>
                <div className="space-y-2">
                   <label className="text-[11px] font-black text-white/40 uppercase ml-1">Rubro Comercial</label>
                   <input required placeholder="Ej: Vinoteca / Bar" value={newLead.category} onChange={e => setNewLead({...newLead, category: e.target.value})} className="w-full h-14 bg-black border-2 border-white/20 px-6 text-white font-black rounded-2xl outline-none focus:border-white transition-all" />
                </div>
                <div className="space-y-2">
                   <label className="text-[11px] font-black text-white/40 uppercase ml-1">Teléfono Móvil (WhatsApp)</label>
                   <input placeholder="+54 9 11..." value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} className="w-full h-14 bg-black border-2 border-white/20 px-6 text-white font-black rounded-2xl outline-none focus:border-white transition-all" />
                </div>
                <div className="space-y-2">
                   <label className="text-[11px] font-black text-white/40 uppercase ml-1">Email Corporativo</label>
                   <input type="email" placeholder="contacto@..." value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} className="w-full h-14 bg-black border-2 border-white/20 px-6 text-white font-black rounded-2xl outline-none focus:border-white transition-all" />
                </div>
                <div className="sm:col-span-2 space-y-2">
                   <label className="text-[11px] font-black text-white/40 uppercase ml-1">Ubicación / Dirección</label>
                   <input placeholder="Av. Principal 456" value={newLead.location} onChange={e => setNewLead({...newLead, location: e.target.value})} className="w-full h-14 bg-black border-2 border-white/20 px-6 text-white font-black rounded-2xl outline-none focus:border-white transition-all" />
                </div>
                <div className="space-y-2">
                   <label className="text-[11px] font-black text-white/40 uppercase ml-1">Instagram Profile</label>
                   <input placeholder="https://instagram.com/..." value={newLead.instagram} onChange={e => setNewLead({...newLead, instagram: e.target.value})} className="w-full h-14 bg-black border-2 border-white/20 px-6 text-white font-black rounded-2xl outline-none focus:border-white transition-all" />
                </div>
                <div className="space-y-2">
                   <label className="text-[11px] font-black text-white/40 uppercase ml-1">Official Website</label>
                   <input placeholder="https://..." value={newLead.website} onChange={e => setNewLead({...newLead, website: e.target.value})} className="w-full h-14 bg-black border-2 border-white/20 px-6 text-white font-black rounded-2xl outline-none focus:border-white transition-all" />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-4 pt-8 border-t border-white/10">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-10 py-4 font-black text-white/30 uppercase text-xs tracking-[0.3em]">DESCARTAR</button>
                <button type="submit" className="px-14 py-5 bg-white text-black font-black rounded-2xl uppercase text-[11px] tracking-[0.3em] hover:bg-black hover:text-white border-2 border-white transition-all active:scale-95 shadow-xl">GUARDAR EN EL ARCHIVO</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMView;
