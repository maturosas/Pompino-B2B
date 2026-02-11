
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
    <div className="space-y-8 animate-in fade-in duration-300 max-w-full">
      {/* Control Panel */}
      <div className="p-6 lg:p-8 border-2 border-white rounded-[2rem] bg-black shadow-2xl space-y-6">
        <div className="flex flex-col xl:flex-row gap-6">
          <div className="flex-1 relative" ref={searchRef}>
             <input 
              type="text" 
              placeholder="BUSCAR EN EL ARCHIVO..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full h-14 lg:h-16 bg-black border-2 border-white/20 px-6 lg:px-8 rounded-2xl text-[13px] lg:text-[15px] font-black text-white outline-none focus:border-white uppercase placeholder:text-white/10 shadow-inner" 
             />
          </div>
          <div className="grid grid-cols-2 lg:flex lg:flex-row gap-3">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-14 lg:h-16 flex-1 bg-black border-2 border-white/20 px-4 rounded-2xl text-[11px] font-black text-white uppercase outline-none focus:border-white min-w-[160px] cursor-pointer">
              <option value="all">ESTADO: TODOS</option>
              <option value="discovered">DESCUBIERTO</option>
              <option value="qualified">CALIFICADO</option>
              <option value="contacted">GESTIÓN</option>
              <option value="closed">ÉXITO</option>
            </select>
            <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value as ClientFilter)} className="h-14 lg:h-16 flex-1 bg-black border-2 border-white/20 px-4 rounded-2xl text-[11px] font-black text-white uppercase outline-none focus:border-white min-w-[160px] cursor-pointer">
              <option value="all">UNIVERSO</option>
              <option value="clients">CARTERA</option>
              <option value="leads">PROSPECTOS</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={() => setIsAddModalOpen(true)} className="flex-1 h-14 lg:h-16 border-2 border-white/40 text-white text-[12px] font-black uppercase rounded-2xl hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3 tracking-[0.2em] whitespace-nowrap active:scale-[0.98]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            NUEVA ENTIDAD
          </button>
          <button onClick={handleExportCSV} className="flex-1 h-14 lg:h-16 border-2 border-white bg-white text-black text-[12px] font-black uppercase rounded-2xl hover:bg-black hover:text-white transition-all flex items-center justify-center gap-3 tracking-[0.2em] whitespace-nowrap active:scale-[0.98]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M7 10l5 5m0 0l5-5m-5 5V3" /></svg>
            EXPORTAR CSV
          </button>
        </div>
      </div>

      {/* View Desktop Table */}
      <div className="hidden xl:block border-2 border-white/20 rounded-[2.5rem] overflow-hidden bg-black shadow-2xl">
        <div className="overflow-x-auto custom-scroll">
          <table className="w-full text-left border-collapse min-w-[1400px]">
            <thead>
              <tr className="bg-white/[0.03] text-white/40 text-[11px] font-black uppercase tracking-[0.4em] border-b-2 border-white/10">
                <th className="px-8 py-6 min-w-[300px] cursor-pointer whitespace-nowrap" onClick={() => setSortKey('name')}>ENTIDAD COMERCIAL</th>
                <th className="px-4 py-6 w-[80px] text-center whitespace-nowrap">CLIENTE</th>
                <th className="px-8 py-6 min-w-[200px] whitespace-nowrap">CONTACTO</th>
                <th className="px-8 py-6 min-w-[180px] whitespace-nowrap">LINKS INTEL</th>
                <th className="px-8 py-6 min-w-[180px] cursor-pointer whitespace-nowrap" onClick={() => setSortKey('followUpDate')}>PRÓX. ACCIÓN</th>
                <th className="px-8 py-6 min-w-[400px] whitespace-nowrap">ESTADO & LOG DE NOTAS</th>
                <th className="px-3 py-6 w-[60px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {processedLeads.length === 0 ? (
                <tr><td colSpan={7} className="px-8 py-48 text-center text-white/5 uppercase font-black text-[15px] tracking-[2em] italic">ARCHIVO EN BLANCO</td></tr>
              ) : (
                processedLeads.map((lead) => (
                  <tr key={lead.id} className={`group hover:bg-white/[0.05] transition-all ${lead.isClient ? 'bg-white/[0.02]' : 'bg-black'}`}>
                    <td className="px-8 py-6">
                      <div className="font-black text-white text-[16px] uppercase italic mb-1 truncate max-w-[280px] group-hover:translate-x-1 transition-transform">{lead.name}</div>
                      <span className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">{lead.category}</span>
                    </td>
                    <td className="px-4 py-6 text-center">
                      <button onClick={() => onUpdateLead(lead.id, { isClient: !lead.isClient })} className={`mx-auto w-10 h-5 rounded-full relative border-2 transition-all ${lead.isClient ? 'bg-white border-white' : 'bg-black border-white/20'}`}><div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${lead.isClient ? 'right-0.5 bg-black' : 'left-0.5 bg-white/30'}`}></div></button>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-white font-black text-[13px] mono truncate">{lead.phone || 'S/N'}</span>
                        <span className="text-white/20 text-[10px] lowercase italic truncate max-w-[180px]">{lead.email || '---'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex gap-2.5">
                        {lead.instagram && <a href={lead.instagram} target="_blank" className="p-2 border border-white/10 rounded-lg hover:bg-white hover:text-black transition-all text-[10px] font-black">IG</a>}
                        {lead.website && <a href={lead.website} target="_blank" className="p-2 border border-white/10 rounded-lg hover:bg-white hover:text-black transition-all text-[10px] font-black">WEB</a>}
                        {lead.whatsapp && <a href={`https://wa.me/${lead.whatsapp}`} target="_blank" className="p-2 border border-white rounded-lg bg-white text-black text-[10px] font-black shadow-lg">WA</a>}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <input type="date" value={lead.followUpDate || ''} onChange={(e) => onUpdateLead(lead.id, { followUpDate: e.target.value })} className="bg-black/60 border-2 border-white/10 rounded-xl px-4 py-2 text-[12px] text-white font-black uppercase outline-none focus:border-white w-full transition-all" />
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex gap-3 items-center">
                        <select value={lead.status} onChange={(e) => onUpdateLead(lead.id, { status: e.target.value as any })} className={`border-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none h-11 transition-all flex-shrink-0 ${getStatusStyles(lead.status)}`}>
                          <option value="discovered" className="bg-black">DESCUBIERTO</option>
                          <option value="qualified" className="bg-black">CALIFICADO</option>
                          <option value="contacted" className="bg-black">GESTIÓN</option>
                          <option value="closed" className="bg-black">EXITO</option>
                        </select>
                        <input type="text" value={lead.notes || ''} onChange={(e) => onUpdateLead(lead.id, { notes: e.target.value })} placeholder="Log de inteligencia..." className="flex-1 min-w-0 bg-white/[0.03] border border-white/10 rounded-xl px-5 py-2 text-[12px] text-white outline-none focus:border-white italic h-11 transition-all" />
                      </div>
                    </td>
                    <td className="px-3 py-6 text-right">
                      <button onClick={() => onRemove(lead.id)} className="p-2 text-white/5 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE CARDS */}
      <div className="xl:hidden space-y-6">
        {processedLeads.length === 0 ? (
          <div className="p-20 text-center text-white/10 uppercase font-black text-[12px] border-2 border-white/5 rounded-3xl italic tracking-[1em]">
            SIN REGISTROS
          </div>
        ) : (
          processedLeads.map((lead) => (
            <div key={lead.id} className={`p-8 border-2 border-white/10 rounded-[2.5rem] bg-black space-y-8 shadow-2xl transition-all ${lead.isClient ? 'ring-2 ring-white/40 bg-white/[0.02]' : ''}`}>
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-white text-2xl uppercase italic leading-none mb-2 truncate pr-2">{lead.name}</h4>
                  <p className="text-[12px] font-black text-white/40 uppercase tracking-[0.3em] mb-3">{lead.category}</p>
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-bold text-white/20 uppercase bg-white/5 px-3 py-1 rounded italic truncate max-w-[200px]">{lead.location}</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <button 
                    onClick={() => onUpdateLead(lead.id, { isClient: !lead.isClient })} 
                    className={`w-14 h-7 rounded-full relative border-2 transition-all ${lead.isClient ? 'bg-white border-white' : 'bg-black border-white/20'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${lead.isClient ? 'right-0.5 bg-black' : 'left-0.5 bg-white/40'}`}></div>
                  </button>
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Client</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5 py-6 border-y border-white/10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Status</label>
                  <select 
                    value={lead.status} 
                    onChange={(e) => onUpdateLead(lead.id, { status: e.target.value as any })} 
                    className={`w-full border-2 rounded-2xl px-3 py-3 text-[11px] font-black uppercase outline-none ${getStatusStyles(lead.status)}`}
                  >
                    <option value="discovered" className="bg-black">DISCO</option>
                    <option value="qualified" className="bg-black">QUAL</option>
                    <option value="contacted" className="bg-black">GEST</option>
                    <option value="closed" className="bg-black">EXIT</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Agenda</label>
                  <input 
                    type="date" 
                    value={lead.followUpDate || ''} 
                    onChange={(e) => onUpdateLead(lead.id, { followUpDate: e.target.value })} 
                    className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-2 py-3 text-[11px] text-white font-black uppercase" 
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Bitácora Intel</label>
                <input 
                  type="text" 
                  value={lead.notes || ''} 
                  onChange={(e) => onUpdateLead(lead.id, { notes: e.target.value })} 
                  placeholder="Escribir avance..." 
                  className="w-full h-14 bg-white/[0.04] border border-white/10 rounded-2xl px-6 text-[13px] text-white outline-none italic placeholder:text-white/5 focus:border-white transition-all" 
                />
              </div>

              <div className="flex gap-3">
                <div className="flex flex-1 gap-3">
                  {lead.whatsapp && <a href={`https://wa.me/${lead.whatsapp}`} target="_blank" className="flex-1 py-4.5 bg-white text-black rounded-2xl text-center text-[12px] font-black uppercase shadow-xl active:scale-95 transition-all">WA</a>}
                  {lead.instagram && <a href={lead.instagram} target="_blank" className="flex-1 py-4.5 border-2 border-white/20 bg-white/5 text-white rounded-2xl text-center text-[12px] font-black uppercase active:scale-95 transition-all">IG</a>}
                </div>
                <button 
                  onClick={() => onRemove(lead.id)} 
                  className="w-16 h-14 border-2 border-red-500/30 bg-red-500/5 text-red-500 rounded-2xl flex items-center justify-center active:bg-red-500 active:text-white transition-all shadow-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/98 backdrop-blur-2xl">
          <div className="bg-black border-2 border-white rounded-[3rem] w-full max-w-2xl max-h-[95vh] overflow-y-auto p-10 lg:p-14 shadow-[0_0_150px_rgba(255,255,255,0.1)] custom-scroll">
            <header className="flex justify-between items-center mb-12">
              <div>
                <h3 className="text-2xl lg:text-4xl font-black text-white uppercase italic tracking-tighter">NUEVA ENTIDAD</h3>
                <p className="text-[11px] font-black text-white/20 uppercase tracking-[0.6em] mt-1">Manual Input</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-3 text-white/30 hover:text-white transition-colors">
                 <svg className="w-8 h-8 lg:w-10 lg:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </header>
            
            <form onSubmit={handleManualAddSubmit} className="space-y-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-3">
                   <label className="text-[12px] font-black text-white/40 uppercase ml-1">Razón Social</label>
                   <input required placeholder="Ej: Vinoteca Palermo" value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} className="w-full h-16 bg-black border-2 border-white/20 px-8 text-white font-black rounded-2xl outline-none focus:border-white transition-all text-lg" />
                </div>
                <div className="space-y-3">
                   <label className="text-[12px] font-black text-white/40 uppercase ml-1">Rubro Target</label>
                   <input required placeholder="Ej: Bar / Minimercado" value={newLead.category} onChange={e => setNewLead({...newLead, category: e.target.value})} className="w-full h-16 bg-black border-2 border-white/20 px-8 text-white font-black rounded-2xl outline-none focus:border-white transition-all text-lg" />
                </div>
                <div className="space-y-3">
                   <label className="text-[12px] font-black text-white/40 uppercase ml-1">WhatsApp Business</label>
                   <input placeholder="+54 9 11..." value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} className="w-full h-16 bg-black border-2 border-white/20 px-8 text-white font-black rounded-2xl outline-none focus:border-white transition-all text-lg" />
                </div>
                <div className="space-y-3">
                   <label className="text-[12px] font-black text-white/40 uppercase ml-1">Email Profesional</label>
                   <input type="email" placeholder="ventas@..." value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} className="w-full h-16 bg-black border-2 border-white/20 px-8 text-white font-black rounded-2xl outline-none focus:border-white transition-all text-lg" />
                </div>
                <div className="sm:col-span-2 space-y-3">
                   <label className="text-[12px] font-black text-white/40 uppercase ml-1">Ubicación / Calle</label>
                   <input placeholder="Fitz Roy 2100, CABA" value={newLead.location} onChange={e => setNewLead({...newLead, location: e.target.value})} className="w-full h-16 bg-black border-2 border-white/20 px-8 text-white font-black rounded-2xl outline-none focus:border-white transition-all text-lg" />
                </div>
                <div className="space-y-3">
                   <label className="text-[12px] font-black text-white/40 uppercase ml-1">Instagram Link</label>
                   <input placeholder="https://..." value={newLead.instagram} onChange={e => setNewLead({...newLead, instagram: e.target.value})} className="w-full h-16 bg-black border-2 border-white/20 px-8 text-white font-black rounded-2xl outline-none focus:border-white transition-all text-lg" />
                </div>
                <div className="space-y-3">
                   <label className="text-[12px] font-black text-white/40 uppercase ml-1">Website URL</label>
                   <input placeholder="https://..." value={newLead.website} onChange={e => setNewLead({...newLead, website: e.target.value})} className="w-full h-16 bg-black border-2 border-white/20 px-8 text-white font-black rounded-2xl outline-none focus:border-white transition-all text-lg" />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-6 pt-10 border-t border-white/10">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-12 py-5 font-black text-white/30 uppercase text-xs tracking-[0.4em] hover:text-white transition-all">DESCARTAR</button>
                <button type="submit" className="px-16 py-6 bg-white text-black font-black rounded-2xl uppercase text-[12px] tracking-[0.4em] hover:bg-black hover:text-white border-2 border-white transition-all shadow-[0_20px_60px_rgba(255,255,255,0.15)] active:scale-95">REGISTRAR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMView;
