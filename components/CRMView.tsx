
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
    name: '', category: '', location: '', phone: '', email: '', status: 'frio', isClient: false, contactName: ''
  });

  const processedLeads = useMemo(() => {
    let result = [...leads];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l => 
        l.name.toLowerCase().includes(q) || 
        l.category.toLowerCase().includes(q) || 
        l.location.toLowerCase().includes(q) || 
        (l.notes || '').toLowerCase().includes(q) ||
        (l.contactName || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') result = result.filter(l => l.status === statusFilter);
    if (clientFilter === 'clients') result = result.filter(l => l.status === 'client');
    else if (clientFilter === 'leads') result = result.filter(l => l.status !== 'client');

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
    setNewLead({ name: '', category: '', location: '', phone: '', email: '', status: 'frio', isClient: false, contactName: '' });
  };

  const handleExportCSV = () => {
    if (processedLeads.length === 0) return;
    const headers = ["Nombre Entidad", "Contacto Persona", "Categoría", "Ubicación", "Teléfono", "Email", "Status", "Notas", "Responsable", "Fecha Agenda"];
    const escape = (str: any) => `"${(str || "").toString().replace(/"/g, '""')}"`;
    const csvContent = [
      headers.join(","),
      ...processedLeads.map(l => [
        escape(l.name), 
        escape(l.contactName),
        escape(l.category), 
        escape(l.location), 
        escape(l.phone), 
        escape(l.email), 
        escape(l.status), 
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
      case 'client': return 'text-white border-white bg-white/40 font-black';
      case 'negotiation': return 'text-white border-white/60 bg-white/20 font-bold';
      case 'contacted': return 'text-white/80 border-white/40 bg-white/10 font-bold';
      default: return 'text-white/40 border-white/10 bg-transparent';
    }
  };

  const getMapsUrl = (name: string, location: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + location)}`;
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Compact Toolbar */}
      <div className="p-3 border border-white/10 rounded-xl bg-[#0a0a0a] shadow-xl">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
          <div className="flex-1 min-w-0">
            <input 
              type="text" 
              placeholder="FILTRAR..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full h-9 bg-black border border-white/10 px-3 rounded-lg text-[10px] font-bold text-white outline-none focus:border-white uppercase placeholder:text-white/20" 
            />
          </div>
          <div className="flex gap-2 items-center overflow-x-auto pb-1 lg:pb-0">
             <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 bg-black border border-white/10 px-2 rounded-lg text-[9px] font-black text-white uppercase outline-none focus:border-white min-w-[100px]">
              <option value="all">TODOS</option>
              <option value="frio">FRIO</option>
              <option value="contacted">CONTACTADO</option>
              <option value="negotiation">NEGOCIACION</option>
              <option value="client">CLIENTE</option>
            </select>
            <button onClick={() => setIsAddModalOpen(true)} className="h-9 px-3 border border-white/40 text-white text-[9px] font-black uppercase rounded-lg hover:bg-white hover:text-black transition-all flex items-center justify-center gap-1 whitespace-nowrap">
               <span>+ NUEVO</span>
            </button>
            <button onClick={handleExportCSV} className="h-9 px-3 bg-white text-black text-[9px] font-black uppercase rounded-lg hover:bg-black hover:text-white border border-white transition-all flex items-center justify-center gap-1 whitespace-nowrap">
               <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Ultra Compact Unified Table */}
      <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0a0a0a]">
        <div className="overflow-x-auto custom-scroll">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-white/5 text-white/40 text-[9px] font-black uppercase tracking-widest border-b border-white/10">
                <th className="px-4 py-2 w-[18%]">Entidad</th>
                <th className="px-4 py-2 w-[15%]">Contacto</th>
                <th className="px-4 py-2 w-[20%]">Datos</th>
                <th className="px-4 py-2 w-[25%]">Notas</th>
                <th className="px-4 py-2 w-[17%]">Status</th>
                <th className="px-4 py-2 w-[5%]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {processedLeads.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-white/10 font-black uppercase tracking-[0.5em] text-[10px]">Sin datos en archivo</td></tr>
              ) : (
                processedLeads.map((lead) => (
                  <tr key={lead.id} className={`hover:bg-white/[0.03] transition-colors group ${lead.status === 'client' ? 'bg-white/[0.02]' : ''}`}>
                    {/* Entity */}
                    <td className="px-4 py-1.5 align-middle cursor-pointer" onClick={() => setSelectedLead(lead)}>
                      <div className="font-bold text-white text-[11px] truncate max-w-[180px] uppercase group-hover:text-white/80">{lead.name}</div>
                      <div className="text-[8px] text-white/30 uppercase font-black truncate max-w-[180px]">{lead.category}</div>
                    </td>
                    
                    {/* Contact Name */}
                    <td className="px-4 py-1.5 align-middle">
                      <input 
                        value={lead.contactName || ''} 
                        onChange={(e) => onUpdateLead(lead.id, { contactName: e.target.value })}
                        placeholder="NOMBRE..."
                        className="bg-transparent border-b border-transparent focus:border-white/20 hover:border-white/10 text-white text-[10px] font-bold outline-none w-full uppercase py-1 placeholder:text-white/10 transition-colors"
                      />
                    </td>

                    {/* Contact Data */}
                    <td className="px-4 py-1.5 align-middle">
                       <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2 h-5">
                            <input 
                              value={lead.phone} 
                              onChange={(e) => onUpdateLead(lead.id, { phone: e.target.value, whatsapp: e.target.value.replace(/\D/g, '') })}
                              placeholder="TEL..."
                              className="bg-transparent text-white font-mono text-[9px] outline-none w-24 placeholder:text-white/10"
                            />
                            {lead.phone && <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" className="text-[7px] font-black bg-white/10 text-white px-1 rounded hover:bg-green-500/80 transition-colors">WA</a>}
                            <a href={getMapsUrl(lead.name, lead.location)} target="_blank" className="text-white/20 hover:text-white transition-colors">
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                            </a>
                          </div>
                          <input 
                            value={lead.email} 
                            onChange={(e) => onUpdateLead(lead.id, { email: e.target.value })}
                            placeholder="EMAIL..."
                            className="bg-transparent text-white/50 font-mono text-[9px] outline-none w-full placeholder:text-white/10 focus:text-white transition-colors"
                          />
                       </div>
                    </td>

                    {/* Notes */}
                    <td className="px-4 py-1.5 align-middle">
                        <textarea 
                          value={lead.notes || ''} 
                          onChange={(e) => onUpdateLead(lead.id, { notes: e.target.value })}
                          placeholder="Notas..."
                          className="w-full bg-transparent focus:bg-white/[0.03] border border-transparent focus:border-white/10 rounded-md p-1 text-[9px] text-white/70 focus:text-white outline-none h-8 resize-none leading-tight transition-all"
                        />
                    </td>

                    {/* Status & Date */}
                    <td className="px-4 py-1.5 align-middle">
                      <div className="flex gap-1.5 items-center">
                        <select value={lead.status} onChange={(e) => onUpdateLead(lead.id, { status: e.target.value as any })} className={`border rounded px-1.5 py-0 text-[8px] font-black uppercase h-6 w-24 ${getStatusStyles(lead.status)}`}>
                          <option value="frio">FRIO</option>
                          <option value="contacted">CONTACTADO</option>
                          <option value="negotiation">EN PROCESO</option>
                          <option value="client">CLIENTE</option>
                        </select>
                        <input type="date" value={lead.followUpDate || ''} onChange={(e) => onUpdateLead(lead.id, { followUpDate: e.target.value })} className="bg-transparent border border-white/10 rounded px-1 text-[9px] text-white/50 focus:text-white font-bold h-6 w-20" />
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-1.5 align-middle text-right">
                      <button onClick={() => onRemove(lead.id)} className="text-white/10 hover:text-red-500 transition-colors p-1" title="Eliminar">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {selectedLead && <LeadDetailPanel lead={selectedLead} onClose={() => setSelectedLead(null)} onUpdate={(u) => { onUpdateLead(selectedLead.id, u); setSelectedLead(prev => prev ? {...prev, ...u} : null); }} />}
      
      {isAddModalOpen && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
             <div className="bg-[#0a0a0a] border border-white/20 rounded-xl w-full max-w-lg p-6 shadow-2xl">
                 <h3 className="text-lg font-black text-white uppercase mb-4 italic tracking-tight">Nuevo Prospecto</h3>
                 <form onSubmit={handleManualAddSubmit} className="space-y-4">
                     <div className="grid grid-cols-2 gap-3">
                         <input required placeholder="Entidad / Razón Social" value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} className="h-9 bg-black border border-white/10 px-3 rounded-lg text-xs text-white outline-none focus:border-white" />
                         <input placeholder="Rubro" value={newLead.category} onChange={e => setNewLead({...newLead, category: e.target.value})} className="h-9 bg-black border border-white/10 px-3 rounded-lg text-xs text-white outline-none focus:border-white" />
                         <input placeholder="Persona Contacto" value={newLead.contactName} onChange={e => setNewLead({...newLead, contactName: e.target.value})} className="h-9 bg-black border border-white/10 px-3 rounded-lg text-xs text-white outline-none focus:border-white" />
                         <input placeholder="Teléfono" value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} className="h-9 bg-black border border-white/10 px-3 rounded-lg text-xs text-white outline-none focus:border-white" />
                         <div className="col-span-2">
                             <input placeholder="Ubicación" value={newLead.location} onChange={e => setNewLead({...newLead, location: e.target.value})} className="w-full h-9 bg-black border border-white/10 px-3 rounded-lg text-xs text-white outline-none focus:border-white" />
                         </div>
                     </div>
                     <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                        <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-[10px] font-black text-white/40 hover:text-white transition-colors">CANCELAR</button>
                        <button type="submit" className="px-4 py-2 bg-white text-black rounded-lg text-[10px] font-black hover:bg-white/90">GUARDAR</button>
                     </div>
                 </form>
             </div>
         </div>
      )}
    </div>
  );
};

export default CRMView;
