
import React, { useState, useMemo } from 'react';
import { Lead } from '../types';

interface CRMViewProps {
  leads: Lead[];
  onRemove: (id: string) => void;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
}

const CRMView: React.FC<CRMViewProps> = ({ leads, onRemove, onUpdateLead }) => {
  const [filter, setFilter] = useState('');

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(filter.toLowerCase()) || 
    l.location.toLowerCase().includes(filter.toLowerCase()) ||
    l.category.toLowerCase().includes(filter.toLowerCase()) ||
    (l.contactName || '').toLowerCase().includes(filter.toLowerCase())
  );

  const suggestions = useMemo(() => {
    const names = leads.map(l => l.name);
    const categories = leads.map(l => l.category);
    const locations = leads.map(l => l.location);
    return Array.from(new Set([...names, ...categories, ...locations])).filter(s => s.length > 0);
  }, [leads]);

  const getGmailLink = (email: string, businessName: string, contactName?: string) => {
    const person = contactName ? contactName.split(' ')[0] : 'titular';
    const subject = encodeURIComponent(`Seguimiento POMPINO B2B - ${businessName}`);
    const body = encodeURIComponent(`Hola ${person},\n\nEspero que estés muy bien. Te escribo de POMPINO B2B para dar seguimiento a nuestra propuesta comercial para ${businessName}.\n\n¿Tendrás unos minutos esta semana para conversar?\n\nSaludos,\nEquipo Pompino`);
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}&body=${body}`;
  };

  const exportCRM = () => {
    const headers = ['Entidad', 'Contacto', 'Cliente', 'Zona', 'Rubro', 'Telefono', 'Email', 'Website', 'Instagram', 'Status', 'FollowUp', 'Notas'];
    const rows = filteredLeads.map(l => [
      l.name, 
      l.contactName || '', 
      l.isClient ? 'SI' : 'NO',
      l.location, 
      l.category, 
      l.phone, 
      l.email,
      l.website || '',
      l.instagram || '',
      l.status,
      l.followUpDate || '',
      l.notes || ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers, ...rows].map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `POMPINO_B2B_DATABASE_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-2 animate-in slide-in-from-bottom-1 duration-200">
      {/* Hyper-Condensed Control Bar */}
      <div className="glass-panel px-3 py-2 rounded-xl shadow-sm border-white/5 bg-white/[0.01] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-black text-white uppercase italic tracking-tighter">Archivo</h2>
          <span className="px-1.5 py-0.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[7px] font-black uppercase rounded">
            {filteredLeads.length} REG
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              list="crm-suggestions"
              type="text"
              placeholder="Filtrar..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-7 pr-2 py-1 rounded-md bg-white/[0.03] border border-white/5 text-white font-bold placeholder:text-white/10 focus:border-blue-500/30 outline-none w-[160px] text-[9px]"
            />
            <datalist id="crm-suggestions">
              {suggestions.map((s, idx) => <option key={idx} value={s} />)}
            </datalist>
            <svg className="w-3 h-3 absolute left-2 top-1.5 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <button 
            onClick={exportCRM}
            disabled={filteredLeads.length === 0}
            className="bg-white text-black hover:bg-blue-600 hover:text-white px-2 py-1 rounded-md font-black text-[7px] uppercase tracking-widest transition-all disabled:opacity-10"
          >
            EXP
          </button>
        </div>
      </div>

      {/* Extreme Density Ledger View */}
      <div className="glass-panel rounded-xl overflow-hidden shadow-xl border-white/5 bg-[#040404]">
        <div className="overflow-x-auto custom-scroll">
          <table className="w-full text-left table-fixed min-w-[1200px]">
            <thead>
              <tr className="bg-white/[0.01] text-white/10 text-[6.5px] font-black uppercase tracking-[0.25em] border-b border-white/5">
                <th className="px-3 py-1 w-[20%]">Entidad / Rubro</th>
                <th className="px-2 py-1 w-[5%] text-center">Tipo</th>
                <th className="px-3 py-1 w-[20%]">Contacto & Redes</th>
                <th className="px-3 py-1 w-[15%]">Responsable / Titular</th>
                <th className="px-3 py-1 w-[32%]">Gestión / Status / Notas</th>
                <th className="px-2 py-1 w-[8%] text-right">Ops</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center opacity-5">
                    <p className="text-white font-black uppercase tracking-[1em] text-[6px]">No Data Buffer</p>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className={`group/row hover:bg-white/[0.01] ${lead.isClient ? 'bg-blue-600/[0.015]' : ''}`}>
                    {/* ENTIDAD */}
                    <td className="px-3 py-1 align-top">
                      <div className="font-black text-white text-[10px] leading-tight tracking-tighter truncate group-hover/row:text-blue-400 uppercase italic">{lead.name}</div>
                      <div className="flex items-center gap-1 text-[6.5px] font-bold text-white/15 uppercase tracking-widest truncate">
                        <span className="text-blue-500/30 shrink-0">{lead.category}</span>
                        <span>|</span>
                        <span className="truncate">{lead.location}</span>
                      </div>
                    </td>
                    
                    {/* CLIENTE TOGGLE */}
                    <td className="px-2 py-1 align-top text-center">
                      <div className="flex flex-col items-center gap-0.5 mt-0.5">
                        <label className="relative inline-flex items-center cursor-pointer scale-[0.6]">
                          <input 
                            type="checkbox" 
                            checked={lead.isClient || false}
                            onChange={(e) => onUpdateLead(lead.id, { isClient: e.target.checked })}
                            className="sr-only"
                          />
                          <div className={`w-7 h-3.5 bg-white/[0.03] rounded-full transition-all border border-white/5 ${lead.isClient ? 'bg-blue-600/20 border-blue-400/30' : ''}`}></div>
                          <div className={`absolute left-0.5 top-0.5 w-2.5 h-2.5 bg-white transition-all rounded-full ${lead.isClient ? 'translate-x-3.5 bg-blue-100' : 'bg-white/10'}`}></div>
                        </label>
                      </div>
                    </td>

                    {/* CONTACTO */}
                    <td className="px-3 py-1 align-top">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1">
                          <span className="text-white/60 font-black text-[8.5px] tracking-tighter">{lead.phone}</span>
                          <a href={getGmailLink(lead.email, lead.name, lead.contactName)} target="_blank" className="p-0.5 bg-blue-600/10 text-blue-400/30 rounded hover:text-blue-400 transition-colors">
                            <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                          </a>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-blue-400/30 font-bold text-[7px] truncate max-w-[80px]">{lead.email}</span>
                          <div className="flex gap-1.5">
                            {lead.website && <a href={lead.website} target="_blank" className="text-[5.5px] font-black text-white/10 hover:text-white uppercase">WEB</a>}
                            {lead.instagram && <a href={lead.instagram.startsWith('http') ? lead.instagram : `https://instagram.com/${lead.instagram.replace('@', '')}`} target="_blank" className="text-[5.5px] font-black text-white/10 hover:text-white uppercase">IG</a>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* TITULAR */}
                    <td className="px-3 py-1 align-top">
                      <input 
                        type="text" 
                        placeholder="Nombre titular..."
                        value={lead.contactName || ''}
                        onChange={(e) => onUpdateLead(lead.id, { contactName: e.target.value })}
                        className="w-full bg-white/[0.01] border border-white/5 rounded-md px-1 py-0.5 text-[8.5px] text-white/40 placeholder:text-white/5 outline-none font-bold"
                      />
                    </td>

                    {/* GESTIÓN & STATUS */}
                    <td className="px-3 py-1 align-top">
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-1 items-center">
                          <select 
                            value={lead.status}
                            onChange={(e) => onUpdateLead(lead.id, { status: e.target.value as any })}
                            className={`flex-[0.6] bg-black border border-white/5 rounded px-1 py-0.5 text-[6.5px] font-black uppercase tracking-wider outline-none ${
                              lead.status === 'closed' ? 'text-green-500/60' :
                              lead.status === 'contacted' ? 'text-blue-400/60' :
                              'text-white/20'
                            }`}
                          >
                            <option value="discovered">DESC</option>
                            <option value="qualified">QUAL</option>
                            <option value="contacted">GEST</option>
                            <option value="closed">EXIT</option>
                          </select>
                          <input 
                            type="date" 
                            value={lead.followUpDate || ''}
                            onChange={(e) => onUpdateLead(lead.id, { followUpDate: e.target.value })}
                            className="bg-white/[0.01] border border-white/5 rounded px-1 py-0.5 text-[6.5px] text-white/30 font-black outline-none [color-scheme:dark] w-[70px]"
                          />
                          <input 
                            type="text" 
                            placeholder="Nota rápida..."
                            value={lead.notes || ''}
                            onChange={(e) => onUpdateLead(lead.id, { notes: e.target.value })}
                            className="flex-1 bg-white/[0.01] border border-white/5 rounded px-1.5 py-0.5 text-[7.5px] text-white/20 placeholder:text-white/5 outline-none italic truncate"
                          />
                        </div>
                      </div>
                    </td>

                    {/* ACCIONES */}
                    <td className="px-2 py-1 align-top text-right">
                      <button 
                        onClick={() => onRemove(lead.id)}
                        className="p-1 text-white/5 hover:text-red-500/40 transition-colors"
                        title="Del"
                      >
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Zero Space Footer Indicator */}
      <div className="flex justify-end pr-2 opacity-[0.02]">
        <span className="text-[5px] font-black uppercase tracking-[2em] text-white">Extreme Ledger Protocol Active</span>
      </div>
    </div>
  );
};

export default CRMView;
