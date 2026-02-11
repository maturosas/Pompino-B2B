
import React, { useState, useMemo } from 'react';
import { Lead } from '../types';
import LeadDetailPanel from './LeadDetailPanel';

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
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  const [newLead, setNewLead] = useState<Partial<Lead>>({
    name: '', category: '', location: '', phone: '', email: '', status: 'discovered', isClient: false
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

  const handleManualAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name) return;
    onAddManualLead({ ...newLead as Lead, id: `manual-${Date.now()}`, savedAt: Date.now() });
    setIsAddModalOpen(false);
    setNewLead({ name: '', category: '', location: '', phone: '', email: '', status: 'discovered', isClient: false });
  };

  const handleExportCSV = () => {
    if (processedLeads.length === 0) return;
    const headers = ["Nombre", "Categoría", "Ubicación", "Teléfono", "Email", "Status", "Es Cliente", "Notas", "Responsable", "Fecha Agenda"];
    const escape = (str: any) => `"${(str || "").toString().replace(/"/g, '""')}"`;
    const csvContent = [
      headers.join(","),
      ...processedLeads.map(l => [
        escape(l.name), 
        escape(l.category), 
        escape(l.location), 
        escape(l.phone), 
        escape(l.email), 
        escape(l.status), 
        l.isClient ? "SI" : "NO", 
        escape(l.notes),
        escape(l.decisionMaker),
        escape(l.followUpDate)
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `pompino_b2b_archivo_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'closed': return 'text-white border-white bg-white/30 font-black';
      case 'contacted': return 'text-white border-white/60 bg-white/10 font-bold';
      case 'qualified': return 'text-white/70 border-white/30 bg-white/[0.04]';
      default: return 'text-white/30 border-white/10 bg-transparent';
    }
  };

  const getMapsUrl = (name: string, location: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + location)}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Search & Filter Bar */}
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
            <div className="flex gap-2 w-full lg:w-auto">
              <button onClick={() => setIsAddModalOpen(true)} className="flex-1 lg:flex-none h-11 px-4 border border-white/40 text-white text-[9px] font-black uppercase rounded-xl hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 whitespace-nowrap">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                <span>NUEVO</span>
              </button>
              <button onClick={handleExportCSV} className="flex-1 lg:flex-none h-11 px-4 bg-white text-black text-[9px] font-black uppercase rounded-xl hover:bg-black hover:text-white border border-white transition-all flex items-center justify-center gap-2 whitespace-nowrap">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M7 10l5 5m0 0l5-5m-5 5V3" /></svg>
                <span>EXPORTAR</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CRM Desktop Table */}
      <div className="hidden lg:block border border-white/10 rounded-2xl overflow-hidden bg-[#0a0a0a]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1400px]">
            <thead>
              <tr className="bg-white/5 text-white/40 text-[9px] font-black uppercase tracking-widest border-b border-white/10">
                <th className="px-6 py-4 w-[18%] whitespace-nowrap">Entidad (Ficha)</th>
                <th className="px-2 py-4 w-[50px] text-center">Cli</th>
                <th className="px-6 py-4 w-[18%]">Contacto (Editable)</th>
                <th className="px-6 py-4 w-[25%]">Notas / Historial</th>
                <th className="px-6 py-4 min-w-[200px]">Estado / Agenda</th>
                <th className="px-4 py-4 w-[50px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {processedLeads.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-32 text-center text-white/10 font-black uppercase tracking-[1em] italic">Buffer vacío</td></tr>
              ) : (
                processedLeads.map((lead) => (
                  <tr key={lead.id} className={`hover:bg-white/[0.03] transition-colors group ${lead.isClient ? 'bg-white/[0.01]' : ''}`}>
                    <td className="px-6 py-5 cursor-pointer" onClick={() => setSelectedLead(lead)}>
                      <div className="font-bold text-white text-sm truncate max-w-[200px] uppercase italic hover:text-white/60">{lead.name}</div>
                      <span className="text-[9px] text-white/30 uppercase font-black">{lead.category}</span>
                    </td>
                    <td className="px-2 py-5 text-center">
                      <button onClick={() => onUpdateLead(lead.id, { isClient: !lead.isClient })} className={`mx-auto w-8 h-4 rounded-full relative border transition-all ${lead.isClient ? 'bg-white border-white' : 'bg-black border-white/20'}`}>
                        <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all ${lead.isClient ? 'right-0.5 bg-black' : 'left-0.5 bg-white/40'}`}></div>
                      </button>
                    </td>
                    <td className="px-6 py-5">
                       <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input 
                              value={lead.phone} 
                              onChange={(e) => onUpdateLead(lead.id, { phone: e.target.value, whatsapp: e.target.value.replace(/\D/g, '') })}
                              placeholder="Tel..."
                              className="bg-transparent border-b border-white/5 text-white font-mono text-[10px] outline-none focus:border-white w-full"
                            />
                            <a href={getMapsUrl(lead.name, lead.location)} target="_blank" className="p-1 border border-white/10 rounded hover:bg-white hover:text-black transition-all shrink-0">
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </a>
                            <a href={`https://wa.me/${(lead.phone || '').replace(/\D/g, '')}`} target="_blank" className="p-1 border border-white rounded text-[7px] font-black bg-white text-black shrink-0">WA</a>
                          </div>
                          <input 
                            value={lead.email} 
                            onChange={(e) => onUpdateLead(lead.id, { email: e.target.value })}
                            placeholder="Email..."
                            className="bg-transparent border-b border-white/5 text-white font-mono text-[10px] outline-none focus:border-white w-full"
                          />
                       </div>
                    </td>
                    <td className="px-6 py-5">
                        <textarea 
                          value={lead.notes || ''} 
                          onChange={(e) => onUpdateLead(lead.id, { notes: e.target.value })}
                          placeholder="Log de conversación o detalles..."
                          className="w-full bg-white/[0.03] border border-white/10 rounded-lg p-2 text-[10px] text-white/70 italic outline-none focus:border-white h-14 resize-none leading-tight"
                        />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex gap-2 items-center">
                        <select value={lead.status} onChange={(e) => onUpdateLead(lead.id, { status: e.target.value as any })} className={`border rounded-lg px-2 py-1.5 text-[8px] font-black uppercase h-9 flex-shrink-0 ${getStatusStyles(lead.status)}`}>
                          <option value="discovered">DISCO</option>
                          <option value="qualified">QUAL</option>
                          <option value="contacted">GEST</option>
                          <option value="closed">EXITO</option>
                        </select>
                        <input type="date" value={lead.followUpDate || ''} onChange={(e) => onUpdateLead(lead.id, { followUpDate: e.target.value })} className="bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-white font-bold w-full h-9" />
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

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {processedLeads.map((lead) => (
          <div key={lead.id} className="p-5 border border-white/10 rounded-2xl bg-[#0a0a0a] space-y-4">
            <div className="flex justify-between items-start" onClick={() => setSelectedLead(lead)}>
              <div className="min-w-0 flex-1">
                <h4 className="font-black text-white text-base truncate pr-2 uppercase italic">{lead.name}</h4>
                <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{lead.category}</p>
              </div>
              <div className="flex gap-2">
                 <a href={getMapsUrl(lead.name, lead.location)} target="_blank" className="p-2 border border-white/10 rounded-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                 </a>
              </div>
            </div>
            
            <div className="space-y-3">
               <div className="flex gap-2">
                 <input 
                    value={lead.phone} 
                    onChange={(e) => onUpdateLead(lead.id, { phone: e.target.value })}
                    className="flex-1 h-10 bg-white/5 border border-white/10 px-4 rounded-xl text-xs font-bold text-white" 
                 />
                 <a href={getMapsUrl(lead.name, lead.location)} target="_blank" className="px-3 bg-white/5 border border-white/10 rounded-xl flex items-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                 </a>
                 <a href={`https://wa.me/${(lead.phone || '').replace(/\D/g, '')}`} target="_blank" className="px-4 py-2 bg-white text-black rounded-xl text-[10px] font-black flex items-center">WA</a>
               </div>
               <div className="flex gap-2">
                <input 
                    value={lead.email} 
                    onChange={(e) => onUpdateLead(lead.id, { email: e.target.value })}
                    placeholder="Email..."
                    className="flex-1 h-10 bg-white/5 border border-white/10 px-4 rounded-xl text-xs font-bold text-white" 
                />
                <a href={getMapsUrl(lead.name, lead.location)} target="_blank" className="px-3 bg-white/5 border border-white/10 rounded-xl flex items-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </a>
               </div>
               <div className="space-y-1">
                 <label className="text-[7px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">Apuntes / Notas</label>
                 <textarea 
                    value={lead.notes || ''} 
                    onChange={(e) => onUpdateLead(lead.id, { notes: e.target.value })}
                    placeholder="Escribir avance..." 
                    className="w-full h-20 bg-white/[0.02] border border-white/10 rounded-xl p-3 text-[10px] text-white italic outline-none focus:border-white transition-all resize-none" 
                 />
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Manual Entry Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <div className="bg-[#050505] border border-white/20 rounded-2xl w-full max-w-lg p-6 lg:p-10 shadow-2xl max-h-[90vh] overflow-y-auto">
            <header className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">NUEVO REGISTRO</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-white/20 hover:text-white p-2">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </header>
            <form onSubmit={handleManualAddSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input required placeholder="Nombre" value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} className="w-full h-11 bg-black border border-white/10 px-4 text-white font-bold rounded-xl outline-none focus:border-white text-xs" />
                <input required placeholder="Rubro" value={newLead.category} onChange={e => setNewLead({...newLead, category: e.target.value})} className="w-full h-11 bg-black border border-white/10 px-4 text-white font-bold rounded-xl outline-none focus:border-white text-xs" />
                <input placeholder="Teléfono" value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} className="w-full h-11 bg-black border border-white/10 px-4 text-white font-bold rounded-xl outline-none focus:border-white text-xs" />
                <input placeholder="Email" value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} className="w-full h-11 bg-black border border-white/10 px-4 text-white font-bold rounded-xl outline-none focus:border-white text-xs" />
                <div className="sm:col-span-2">
                  <input placeholder="Ubicación" value={newLead.location} onChange={e => setNewLead({...newLead, location: e.target.value})} className="w-full h-11 bg-black border border-white/10 px-4 text-white font-bold rounded-xl outline-none focus:border-white text-xs" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-6 py-3 font-black text-white/20 text-[9px]">CANCELAR</button>
                <button type="submit" className="px-8 py-3 bg-white text-black font-black rounded-xl text-[9px] hover:bg-black hover:text-white transition-all">GUARDAR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lead Detail Panel (Ficha) */}
      {selectedLead && (
        <LeadDetailPanel 
          lead={selectedLead} 
          onClose={() => setSelectedLead(null)} 
          onUpdate={(updates) => {
            onUpdateLead(selectedLead.id, updates);
            setSelectedLead(prev => prev ? {...prev, ...updates} : null);
          }}
        />
      )}
    </div>
  );
};

export default CRMView;
