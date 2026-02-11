
import React, { useState, useMemo } from 'react';
import { Lead } from '../types';

interface CRMViewProps {
  leads: Lead[];
  onRemove: (id: string) => void;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  onAddManualLead: (lead: Lead) => void;
}

type SortKey = 'name' | 'category' | 'status' | 'savedAt' | 'followUpDate';
type ClientFilter = 'all' | 'clients' | 'leads';

const CRMView: React.FC<CRMViewProps> = ({ leads, onRemove, onUpdateLead, onAddManualLead }) => {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('savedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<ClientFilter>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
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
    link.setAttribute("download", `pompino_b2b_export.csv`);
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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Search & Filter - Responsive Bar */}
      <div className="p-4 lg:p-6 border border-white/10 rounded-2xl bg-[#0a0a0a] shadow-xl">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
          <div className="flex-1 min-w-0">
            <input 
              type="text" 
              placeholder="FILTRAR ARCHIVO..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full h-11 bg-black border border-white/10 px-4 rounded-xl text-xs font-bold text-white outline-none focus:border-white uppercase placeholder:text-white/5" 
            />
          </div>
          <div className="flex flex-wrap lg:flex-nowrap gap-2 items-center">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11 bg-black border border-white/10 px-3 rounded-xl text-[10px] font-black text-white uppercase outline-none focus:border-white min-w-[120px] flex-1">
              <option value="all">TODOS</option>
              <option value="discovered">DESCUBIERTO</option>
              <option value="qualified">CALIFICADO</option>
              <option value="contacted">GESTIÓN</option>
              <option value="closed">ÉXITO</option>
            </select>
            <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value as ClientFilter)} className="h-11 bg-black border border-white/10 px-3 rounded-xl text-[10px] font-black text-white uppercase outline-none focus:border-white min-w-[120px] flex-1">
              <option value="all">UNIVERSO</option>
              <option value="clients">CARTERA</option>
              <option value="leads">PROSPECTOS</option>
            </select>
            <div className="flex gap-2 w-full lg:w-auto mt-2 lg:mt-0">
              <button onClick={() => setIsAddModalOpen(true)} className="flex-1 lg:flex-none h-11 px-4 border border-white/40 text-white text-[9px] font-black uppercase rounded-xl hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 whitespace-nowrap">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                <span>NUEVO</span>
              </button>
              <button onClick={handleExportCSV} className="flex-1 lg:flex-none h-11 px-4 bg-white text-black text-[9px] font-black uppercase rounded-xl hover:bg-black hover:text-white border border-white transition-all flex items-center justify-center gap-2 whitespace-nowrap">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M7 10l5 5m0 0l5-5m-5 5V3" /></svg>
                <span>CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CRM - Desktop Table */}
      <div className="hidden lg:block border border-white/10 rounded-2xl overflow-hidden bg-[#0a0a0a]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-white/5 text-white/40 text-[9px] font-black uppercase tracking-widest border-b border-white/10">
                <th className="px-6 py-4 w-[20%] whitespace-nowrap">Entidad Comercial</th>
                <th className="px-2 py-4 w-[60px] text-center">Cli</th>
                <th className="px-6 py-4 w-[15%]">Contacto</th>
                <th className="px-6 py-4 w-[12%]">Links</th>
                <th className="px-6 py-4 w-[15%]">Agenda</th>
                <th className="px-6 py-4 min-w-[300px]">Estado / Notas</th>
                <th className="px-4 py-4 w-[50px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {processedLeads.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-32 text-center text-white/10 font-black uppercase tracking-[1em] italic">Buffer vacío</td></tr>
              ) : (
                processedLeads.map((lead) => (
                  <tr key={lead.id} className={`hover:bg-white/[0.03] transition-colors group ${lead.isClient ? 'bg-white/[0.01]' : ''}`}>
                    <td className="px-6 py-5">
                      <div className="font-bold text-white text-sm truncate max-w-[200px] uppercase italic">{lead.name}</div>
                      <span className="text-[9px] text-white/30 uppercase font-black">{lead.category}</span>
                    </td>
                    <td className="px-2 py-5 text-center">
                      <button onClick={() => onUpdateLead(lead.id, { isClient: !lead.isClient })} className={`mx-auto w-8 h-4 rounded-full relative border transition-all ${lead.isClient ? 'bg-white border-white' : 'bg-black border-white/20'}`}>
                        <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all ${lead.isClient ? 'right-0.5 bg-black' : 'left-0.5 bg-white/40'}`}></div>
                      </button>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-white font-mono text-xs">{lead.phone || '---'}</span>
                        <span className="text-white/20 text-[9px] truncate max-w-[150px]">{lead.email || '---'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex gap-1.5">
                        {lead.instagram && <a href={lead.instagram} target="_blank" className="p-1.5 border border-white/10 rounded-lg text-[8px] font-black text-white/40 hover:text-white">IG</a>}
                        {lead.whatsapp && <a href={`https://wa.me/${lead.whatsapp}`} target="_blank" className="p-1.5 border border-white rounded-lg text-[8px] font-black bg-white text-black">WA</a>}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <input type="date" value={lead.followUpDate || ''} onChange={(e) => onUpdateLead(lead.id, { followUpDate: e.target.value })} className="bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-white font-bold w-full" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex gap-2 items-center">
                        <select value={lead.status} onChange={(e) => onUpdateLead(lead.id, { status: e.target.value as any })} className={`border rounded-lg px-2 py-1.5 text-[8px] font-black uppercase h-9 flex-shrink-0 ${getStatusStyles(lead.status)}`}>
                          <option value="discovered" className="bg-black text-white">DISCO</option>
                          <option value="qualified" className="bg-black text-white">QUAL</option>
                          <option value="contacted" className="bg-black text-white">GEST</option>
                          <option value="closed" className="bg-black text-white">EXITO</option>
                        </select>
                        <input type="text" value={lead.notes || ''} onChange={(e) => onUpdateLead(lead.id, { notes: e.target.value })} placeholder="Log..." className="flex-1 bg-white/[0.02] border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white italic h-9" />
                      </div>
                    </td>
                    <td className="px-4 py-5 text-right">
                      <button onClick={() => onRemove(lead.id)} className="p-2 text-white/5 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRM - Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {processedLeads.length === 0 ? (
          <div className="p-12 text-center text-white/10 font-black uppercase tracking-widest border border-white/5 rounded-2xl">
            Archivo vacío
          </div>
        ) : (
          processedLeads.map((lead) => (
            <div key={lead.id} className={`p-5 border border-white/10 rounded-2xl bg-[#0a0a0a] space-y-5 transition-all ${lead.isClient ? 'ring-1 ring-white/20 bg-white/[0.02]' : ''}`}>
              <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1">
                  <h4 className="font-black text-white text-base truncate pr-2 uppercase italic">{lead.name}</h4>
                  <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{lead.category}</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <button onClick={() => onUpdateLead(lead.id, { isClient: !lead.isClient })} className={`w-8 h-4 rounded-full relative border transition-all ${lead.isClient ? 'bg-white border-white' : 'bg-black border-white/20'}`}>
                    <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all ${lead.isClient ? 'right-0.5 bg-black' : 'left-0.5 bg-white/40'}`}></div>
                  </button>
                  <span className="text-[7px] font-black text-white/20 uppercase">Cliente</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                <div className="space-y-1">
                  <label className="text-[7px] font-black text-white/20 uppercase">Estado</label>
                  <select 
                    value={lead.status} 
                    onChange={(e) => onUpdateLead(lead.id, { status: e.target.value as any })} 
                    className={`w-full border rounded-lg px-2 py-2 text-[9px] font-black uppercase h-9 outline-none ${getStatusStyles(lead.status)}`}
                  >
                    <option value="discovered" className="bg-black">DISCO</option>
                    <option value="qualified" className="bg-black">QUAL</option>
                    <option value="contacted" className="bg-black">GEST</option>
                    <option value="closed" className="bg-black">EXIT</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[7px] font-black text-white/20 uppercase">Agenda</label>
                  <input 
                    type="date" 
                    value={lead.followUpDate || ''} 
                    onChange={(e) => onUpdateLead(lead.id, { followUpDate: e.target.value })} 
                    className="w-full bg-black border border-white/10 rounded-lg px-2 py-2 text-[9px] text-white font-bold h-9" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[7px] font-black text-white/20 uppercase">Notas de Intel</label>
                <input 
                  type="text" 
                  value={lead.notes || ''} 
                  onChange={(e) => onUpdateLead(lead.id, { notes: e.target.value })} 
                  placeholder="Escribir avance..." 
                  className="w-full h-10 bg-white/[0.02] border border-white/10 rounded-lg px-4 text-[10px] text-white italic outline-none focus:border-white transition-all" 
                />
              </div>

              <div className="flex gap-2">
                <div className="flex flex-1 gap-2">
                  {lead.whatsapp && <a href={`https://wa.me/${lead.whatsapp}`} target="_blank" className="flex-1 py-3 bg-white text-black rounded-xl text-center text-[9px] font-black uppercase shadow-xl">WhatsApp</a>}
                  {lead.instagram && <a href={lead.instagram} target="_blank" className="w-12 py-3 border border-white/10 rounded-xl text-center text-[9px] font-black uppercase">IG</a>}
                </div>
                <button 
                  onClick={() => onRemove(lead.id)} 
                  className="w-12 h-11 border border-red-500/20 bg-red-500/5 text-red-500 rounded-xl flex items-center justify-center active:bg-red-500 active:text-white transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Manual Entry Modal - Fully Responsive */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <div className="bg-[#050505] border border-white/20 rounded-2xl w-full max-w-lg p-6 lg:p-10 shadow-2xl max-h-[90vh] overflow-y-auto custom-scroll">
            <header className="flex justify-between items-start mb-6 lg:mb-10">
              <div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">NUEVO REGISTRO</h3>
                <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] mt-1">Manual Data Input</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-white/20 hover:text-white transition-colors p-2">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </header>
            
            <form onSubmit={handleManualAddSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-white/30 uppercase ml-1">Razón Social</label>
                  <input required value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} className="w-full h-11 bg-black border border-white/10 px-4 text-white font-bold rounded-xl outline-none focus:border-white text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-white/30 uppercase ml-1">Rubro</label>
                  <input required value={newLead.category} onChange={e => setNewLead({...newLead, category: e.target.value})} className="w-full h-11 bg-black border border-white/10 px-4 text-white font-bold rounded-xl outline-none focus:border-white text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-white/30 uppercase ml-1">Teléfono</label>
                  <input value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} className="w-full h-11 bg-black border border-white/10 px-4 text-white font-bold rounded-xl outline-none focus:border-white text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-white/30 uppercase ml-1">Email</label>
                  <input type="email" value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} className="w-full h-11 bg-black border border-white/10 px-4 text-white font-bold rounded-xl outline-none focus:border-white text-xs" />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[8px] font-black text-white/30 uppercase ml-1">Dirección / Zona</label>
                  <input value={newLead.location} onChange={e => setNewLead({...newLead, location: e.target.value})} className="w-full h-11 bg-black border border-white/10 px-4 text-white font-bold rounded-xl outline-none focus:border-white text-xs" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-6 py-3 font-black text-white/20 uppercase text-[9px] tracking-widest">CANCELAR</button>
                <button type="submit" className="px-8 py-3 bg-white text-black font-black rounded-xl uppercase text-[9px] tracking-widest hover:bg-black hover:text-white border border-white transition-all active:scale-95">GUARDAR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMView;
