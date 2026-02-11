
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
  const [sortKey, setSortKey] = useState<SortKey>('savedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<ClientFilter>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);

  const [newLead, setNewLead] = useState<Partial<Lead>>({
    name: '', category: '', location: '', phone: '', email: '', website: '', instagram: '', status: 'discovered', isClient: false
  });

  const processedLeads = useMemo(() => {
    let result = [...leads];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l => l.name.toLowerCase().includes(q) || l.category.toLowerCase().includes(q) || l.location.toLowerCase().includes(q) || (l.notes || '').toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') result = result.filter(l => l.status === statusFilter);
    if (clientFilter === 'clients') result = result.filter(l => l.isClient);
    else if (clientFilter === 'leads') result = result.filter(l => !l.isClient);

    result.sort((a, b) => {
      let valA: any = a[sortKey as keyof Lead] || '';
      let valB: any = b[sortKey as keyof Lead] || '';
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [leads, search, sortKey, sortOrder, statusFilter, clientFilter]);

  const handleExportCSV = () => {
    if (processedLeads.length === 0) return;
    const headers = ["Nombre", "Categoria", "Ubicacion", "Telefono", "Email", "Web", "Instagram", "Status", "Es Cliente", "Notas"];
    const escape = (str: any) => `"${(str || "").toString().replace(/"/g, '""')}"`;
    const csvContent = [
      headers.join(","),
      ...processedLeads.map(l => [
        escape(l.name), escape(l.category), escape(l.location), escape(l.phone), escape(l.email), 
        escape(l.website), escape(l.instagram), escape(l.status), l.isClient ? "SI" : "NO", escape(l.notes)
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `pompino_archive_${new Date().getTime()}.csv`);
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
    <div className="space-y-6 animate-in fade-in duration-500 max-w-full overflow-hidden">
      {/* Search & Filter Suite - Re-engineered for Fullscreen stability */}
      <div className="p-4 lg:p-6 border border-white/20 rounded-2xl bg-[#050505] shadow-2xl">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
          <div className="flex-1 relative">
            <input 
              type="text" 
              placeholder="FILTRAR ARCHIVO..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full h-12 bg-black border border-white/10 px-6 rounded-xl text-[13px] font-bold text-white outline-none focus:border-white uppercase placeholder:text-white/10" 
            />
          </div>
          <div className="flex flex-wrap lg:flex-nowrap gap-3 shrink-0">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-12 bg-black border border-white/10 px-4 rounded-xl text-[10px] font-black text-white uppercase outline-none focus:border-white min-w-[140px] cursor-pointer">
              <option value="all">ESTADO: TODOS</option>
              <option value="discovered">DESCUBIERTO</option>
              <option value="qualified">CALIFICADO</option>
              <option value="contacted">GESTIÓN</option>
              <option value="closed">ÉXITO</option>
            </select>
            <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value as ClientFilter)} className="h-12 bg-black border border-white/10 px-4 rounded-xl text-[10px] font-black text-white uppercase outline-none focus:border-white min-w-[140px] cursor-pointer">
              <option value="all">UNIVERSO</option>
              <option value="clients">CARTERA</option>
              <option value="leads">PROSPECTOS</option>
            </select>
            <button onClick={() => setIsAddModalOpen(true)} className="h-12 px-6 border border-white/40 text-white text-[10px] font-black uppercase rounded-xl hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 tracking-widest whitespace-nowrap">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
              NUEVA ENTIDAD
            </button>
            <button onClick={handleExportCSV} className="h-12 px-6 bg-white text-black text-[10px] font-black uppercase rounded-xl hover:bg-black hover:text-white border border-white transition-all flex items-center justify-center gap-2 tracking-widest whitespace-nowrap">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M7 10l5 5m0 0l5-5m-5 5V3" /></svg>
              EXPORTAR
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Interface - Fixed clipping */}
      <div className="border border-white/20 rounded-2xl overflow-hidden bg-black shadow-inner">
        <div className="overflow-x-auto custom-scroll">
          <table className="w-full text-left border-collapse min-w-[1400px]">
            <thead>
              <tr className="bg-white/5 text-white/30 text-[10px] font-black uppercase tracking-[0.3em] border-b border-white/10">
                <th className="px-6 py-5 w-[250px] cursor-pointer hover:text-white" onClick={() => setSortKey('name')}>ENTIDAD COMERCIAL</th>
                <th className="px-2 py-5 w-[70px] text-center">CLI</th>
                <th className="px-6 py-5 w-[200px]">CONTACTO</th>
                <th className="px-6 py-5 w-[160px]">LINKS</th>
                <th className="px-6 py-5 w-[160px] cursor-pointer hover:text-white" onClick={() => setSortKey('followUpDate')}>PRÓX. ACCIÓN</th>
                <th className="px-6 py-5 min-w-[350px]">ESTADO & LOG DE INTEL</th>
                <th className="px-4 py-5 w-[50px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {processedLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-40 text-center">
                    <div className="text-white/5 uppercase font-black text-[16px] tracking-[1.5em] italic animate-pulse">
                      A R C H I V O &nbsp; E N &nbsp; B L A N C O
                    </div>
                  </td>
                </tr>
              ) : (
                processedLeads.map((lead) => (
                  <tr key={lead.id} className={`group hover:bg-white/[0.04] transition-colors ${lead.isClient ? 'bg-white/[0.01]' : ''}`}>
                    <td className="px-6 py-5">
                      <div className="font-black text-white text-[14px] uppercase italic truncate max-w-[230px]">{lead.name}</div>
                      <span className="text-[9px] text-white/20 uppercase tracking-widest font-bold">{lead.category}</span>
                    </td>
                    <td className="px-2 py-5 text-center">
                      <button onClick={() => onUpdateLead(lead.id, { isClient: !lead.isClient })} className={`mx-auto w-9 h-4 rounded-full relative border transition-all ${lead.isClient ? 'bg-white border-white' : 'bg-black border-white/20'}`}>
                        <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all ${lead.isClient ? 'right-0.5 bg-black' : 'left-0.5 bg-white/20'}`}></div>
                      </button>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-white font-bold text-[12px] mono">{lead.phone || 'S/N'}</span>
                        <span className="text-white/20 text-[10px] lowercase italic truncate max-w-[180px]">{lead.email || '---'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex gap-2">
                        {lead.instagram && <a href={lead.instagram} target="_blank" className="p-1.5 border border-white/10 rounded-lg hover:bg-white hover:text-black transition-all text-[9px] font-black">IG</a>}
                        {lead.website && <a href={lead.website} target="_blank" className="p-1.5 border border-white/10 rounded-lg hover:bg-white hover:text-black transition-all text-[9px] font-black">WEB</a>}
                        {lead.whatsapp && <a href={`https://wa.me/${lead.whatsapp}`} target="_blank" className="p-1.5 border border-white rounded-lg bg-white text-black text-[9px] font-black">WA</a>}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <input type="date" value={lead.followUpDate || ''} onChange={(e) => onUpdateLead(lead.id, { followUpDate: e.target.value })} className="bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-[11px] text-white font-black uppercase outline-none focus:border-white w-full" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex gap-3 items-center">
                        <select value={lead.status} onChange={(e) => onUpdateLead(lead.id, { status: e.target.value as any })} className={`border rounded-lg px-3 py-1.5 text-[9px] font-black uppercase outline-none h-10 transition-all ${getStatusStyles(lead.status)}`}>
                          <option value="discovered" className="bg-black text-white">DESCUBIERTO</option>
                          <option value="qualified" className="bg-black text-white">CALIFICADO</option>
                          <option value="contacted" className="bg-black text-white">GESTIÓN</option>
                          <option value="closed" className="bg-black text-white">EXITO</option>
                        </select>
                        <input type="text" value={lead.notes || ''} onChange={(e) => onUpdateLead(lead.id, { notes: e.target.value })} placeholder="Log de inteligencia..." className="flex-1 min-w-0 bg-white/[0.02] border border-white/10 rounded-lg px-4 py-2 text-[11px] text-white outline-none focus:border-white italic h-10" />
                      </div>
                    </td>
                    <td className="px-4 py-5 text-right">
                      <button onClick={() => onRemove(lead.id)} className="p-2 text-white/5 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Entry Modal - Clean Architecture */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm">
          <div className="bg-black border border-white/20 rounded-3xl w-full max-w-xl p-8 lg:p-10 shadow-2xl">
            <header className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tight">NUEVA ENTIDAD</h3>
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mt-1">Manual Input Protocol</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-white/20 hover:text-white transition-colors">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </header>
            
            <form onSubmit={handleManualAddSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input required placeholder="Razón Social" value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} className="w-full h-12 bg-black border border-white/10 px-4 text-white font-bold rounded-xl outline-none focus:border-white text-xs" />
                <input required placeholder="Rubro Target" value={newLead.category} onChange={e => setNewLead({...newLead, category: e.target.value})} className="w-full h-12 bg-black border border-white/10 px-4 text-white font-bold rounded-xl outline-none focus:border-white text-xs" />
                <input placeholder="WhatsApp Business" value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} className="w-full h-12 bg-black border border-white/10 px-4 text-white font-bold rounded-xl outline-none focus:border-white text-xs" />
                <input type="email" placeholder="Email Corporativo" value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} className="w-full h-12 bg-black border border-white/10 px-4 text-white font-bold rounded-xl outline-none focus:border-white text-xs" />
                <div className="sm:col-span-2">
                   <input placeholder="Ubicación / Dirección" value={newLead.location} onChange={e => setNewLead({...newLead, location: e.target.value})} className="w-full h-12 bg-black border border-white/10 px-4 text-white font-bold rounded-xl outline-none focus:border-white text-xs" />
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-6 py-3 font-black text-white/20 uppercase text-[10px] tracking-widest">CANCELAR</button>
                <button type="submit" className="px-8 py-3 bg-white text-black font-black rounded-xl uppercase text-[10px] tracking-widest hover:bg-white/90 active:scale-95 transition-all">GUARDAR REGISTRO</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMView;
