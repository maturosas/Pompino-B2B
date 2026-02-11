
import React, { useState, useMemo } from 'react';
import { Lead } from '../types';
import LeadDetailPanel from './LeadDetailPanel';

interface CRMViewProps {
  leads: Lead[];
  onRemove: (id: string) => void;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  onDetailedUpdate: (id: string, updates: Partial<Lead>, context: string) => void;
  onAddManualLead: (lead: Lead) => void;
  activeFolder: string;
}

type SortKey = 'name' | 'category' | 'status' | 'savedAt' | 'followUpDate';
type DateFilter = 'all' | 'overdue' | 'today' | 'future' | 'unset';
type TypeFilter = 'all' | 'client' | 'prospect';

const CRMView: React.FC<CRMViewProps> = ({ leads, onRemove, onUpdateLead, onDetailedUpdate, onAddManualLead, activeFolder }) => {
  // Search & Sort State
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('savedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Advanced Filter State
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // Used when activeFolder is 'all'
  
  // UI State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  // New Lead Form State
  const [newLead, setNewLead] = useState<Partial<Lead>>({
    name: '', category: '', location: '', phone: '', email: '', status: 'frio', isClient: false, contactName: ''
  });

  const processedLeads = useMemo(() => {
    let result = [...leads];
    
    // 1. Sidebar Folder Filter (Base Scope)
    if (activeFolder !== 'all') {
      result = result.filter(l => l.status === activeFolder);
    }

    // 2. Global Search
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

    // 3. Status Filter (Effective only if activeFolder is 'all')
    if (activeFolder === 'all' && statusFilter !== 'all') {
        result = result.filter(l => l.status === statusFilter);
    }

    // 4. Type Filter (Client vs Prospect)
    if (typeFilter !== 'all') {
        if (typeFilter === 'client') {
            result = result.filter(l => l.status === 'client');
        } else if (typeFilter === 'prospect') {
            result = result.filter(l => l.status !== 'client');
        }
    }

    // 5. Date Filter (Follow Up)
    if (dateFilter !== 'all') {
        const today = new Date().toISOString().split('T')[0];
        result = result.filter(l => {
            if (dateFilter === 'unset') return !l.followUpDate;
            if (!l.followUpDate) return false;
            
            if (dateFilter === 'overdue') return l.followUpDate < today;
            if (dateFilter === 'today') return l.followUpDate === today;
            if (dateFilter === 'future') return l.followUpDate > today;
            return true;
        });
    }

    // 6. Sorting
    result.sort((a, b) => {
      let valA: any = a[sortKey as keyof Lead] || '';
      let valB: any = b[sortKey as keyof Lead] || '';
      
      // Handle date sorting specifically to treat empty as last
      if (sortKey === 'followUpDate') {
          if (!valA) valA = '9999-99-99';
          if (!valB) valB = '9999-99-99';
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return result;
  }, [leads, search, sortKey, sortOrder, activeFolder, statusFilter, typeFilter, dateFilter]);

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
      case 'client': return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20 font-bold';
      case 'negotiation': return 'text-amber-300 bg-amber-500/10 border-amber-500/20 font-bold';
      case 'contacted': return 'text-blue-300 bg-blue-500/10 border-blue-500/20 font-bold';
      default: return 'text-white/40 bg-white/5 border-white/10';
    }
  };

  const getMapsUrl = (name: string, location: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + location)}`;
  };

  const getWhatsAppLink = (phone: string) => {
     return `https://wa.me/${phone.replace(/\D/g, '')}`;
  };

  const getFolderName = (id: string) => {
      switch(id) {
          case 'frio': return 'Prospectos Fríos';
          case 'contacted': return 'Contactados';
          case 'negotiation': return 'En Negociación';
          case 'client': return 'Clientes Activos';
          default: return 'Todos los Registros';
      }
  }

  // Toggle sort direction or switch key
  const handleSort = (key: SortKey) => {
      if (sortKey === key) {
          setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
      } else {
          setSortKey(key);
          setSortOrder('asc');
      }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header with Active Folder Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-2 gap-4">
        <div>
            <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white drop-shadow-md">
                {getFolderName(activeFolder)}
            </h2>
            <p className="text-white/40 text-xs font-medium mt-1">
                Visualizando <span className="text-white">{processedLeads.length}</span> oportunidades comerciales
            </p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setIsAddModalOpen(true)} className="h-10 px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20 hover:-translate-y-0.5">
               <span>+ NUEVO PROSPECTO</span>
            </button>
            <button onClick={handleExportCSV} className="h-10 px-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[10px] font-black uppercase rounded-xl transition-all flex items-center justify-center gap-2">
               <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </button>
        </div>
      </div>

      {/* Main Controls Container */}
      <div className="p-4 md:p-5 border border-white/5 rounded-3xl glass-solid space-y-4 shadow-xl">
        {/* Top Row: Search */}
        <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-white/30 group-focus-within:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text" 
              placeholder="Buscar por empresa, contacto, notas, ubicación..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full h-12 bg-black/40 border border-white/10 pl-12 pr-4 rounded-2xl text-sm font-medium text-white outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 placeholder:text-white/20 transition-all" 
            />
          </div>

        {/* Bottom Row: Filters */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {/* Filter: Status (Only visible if folder is ALL) */}
            {activeFolder === 'all' && (
                <div className="col-span-1">
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-[10px] font-bold text-white/70 uppercase outline-none focus:bg-white/10 focus:border-white/20"
                    >
                        <option value="all">TODOS LOS ESTADOS</option>
                        <option value="frio">FRIO</option>
                        <option value="contacted">CONTACTADO</option>
                        <option value="negotiation">EN NEGOCIACIÓN</option>
                        <option value="client">CLIENTES</option>
                    </select>
                </div>
            )}
            
            {/* Filter: Type (Relationship) */}
            <div className="col-span-1">
                <select 
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                    className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-[10px] font-bold text-white/70 uppercase outline-none focus:bg-white/10 focus:border-white/20"
                >
                    <option value="all">TIPO: TODOS</option>
                    <option value="prospect">Solo Prospectos</option>
                    <option value="client">Solo Clientes</option>
                </select>
            </div>

            {/* Filter: Date */}
            <div className="col-span-1">
                <select 
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                    className={`w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-[10px] font-bold uppercase outline-none focus:bg-white/10 focus:border-white/20 transition-colors ${
                        dateFilter !== 'all' ? 'text-white border-white/30' : 'text-white/70'
                    }`}
                >
                    <option value="all">AGENDA: TODAS</option>
                    <option value="overdue">⚠️ VENCIDOS</option>
                    <option value="today">📅 PARA HOY</option>
                    <option value="future">🔮 FUTUROS</option>
                    <option value="unset">⚪ SIN FECHA</option>
                </select>
            </div>
            
            {/* Reset Filters (Visible if any filter is active) */}
            {(dateFilter !== 'all' || typeFilter !== 'all' || (activeFolder === 'all' && statusFilter !== 'all')) && (
                 <button 
                    onClick={() => { setDateFilter('all'); setTypeFilter('all'); setStatusFilter('all'); }}
                    className="col-span-1 h-10 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-[10px] font-black uppercase transition-colors"
                 >
                    Limpiar Filtros
                 </button>
            )}
        </div>
      </div>

      {/* Unified List View (Cards on Mobile, Table on Desktop) */}
      <div className="border border-white/5 rounded-3xl overflow-hidden glass-solid shadow-2xl">
        
        {/* MOBILE CARDS VIEW */}
        <div className="md:hidden bg-transparent p-3 space-y-3">
             {processedLeads.length === 0 ? (
                <div className="py-12 text-center text-white/10 font-black uppercase tracking-[0.2em] text-[10px]">Sin resultados</div>
             ) : (
                processedLeads.map(lead => (
                   <div key={lead.id} className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-4 space-y-4 relative shadow-md">
                      {/* Card Header */}
                      <div className="flex justify-between items-start pr-8">
                         <div onClick={() => setSelectedLead(lead)} className="cursor-pointer">
                            <h3 className="font-bold text-white text-base leading-tight">{lead.name}</h3>
                            <p className="text-[10px] text-white/40 font-medium uppercase mt-1 tracking-wide">{lead.category}</p>
                         </div>
                         <button onClick={() => onRemove(lead.id)} className="absolute top-4 right-4 text-white/10 hover:text-red-500 p-1">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                         </button>
                      </div>

                      {/* Contact Fields */}
                      <div className="space-y-2">
                         <input 
                            value={lead.contactName || ''} 
                            onChange={(e) => onUpdateLead(lead.id, { contactName: e.target.value })}
                            placeholder="Persona de Contacto..."
                            className="w-full bg-white/[0.03] border border-transparent focus:border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/10 focus:bg-white/5 transition-colors"
                         />
                         <div className="flex gap-2">
                             <input 
                                value={lead.phone} 
                                onChange={(e) => onUpdateLead(lead.id, { phone: e.target.value, whatsapp: e.target.value.replace(/\D/g, '') })}
                                placeholder="Teléfono..."
                                className="flex-1 bg-white/[0.03] border border-transparent focus:border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder:text-white/10 focus:bg-white/5 transition-colors"
                             />
                             {lead.phone && <a href={getWhatsAppLink(lead.phone)} target="_blank" className="bg-[#25D366]/20 text-[#25D366] px-3 rounded-lg flex items-center justify-center font-black text-xs">WA</a>}
                         </div>
                      </div>

                      {/* Status & Actions */}
                      <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                         <select 
                            value={lead.status} 
                            onChange={(e) => onUpdateLead(lead.id, { status: e.target.value as any })} 
                            className={`flex-1 h-9 rounded-lg px-2 text-[10px] uppercase border ${getStatusStyles(lead.status)}`}
                         >
                            <option value="frio">FRIO</option>
                            <option value="contacted">CONTACTADO</option>
                            <option value="negotiation">EN PROCESO</option>
                            <option value="client">CLIENTE</option>
                         </select>
                         <button onClick={() => setSelectedLead(lead)} className="px-4 h-9 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-white/60 hover:text-white hover:bg-white/10 uppercase transition-all">
                             Ver Ficha
                         </button>
                      </div>
                      
                      {/* Follow Up Badge */}
                      {lead.followUpDate && (
                          <div className={`text-[10px] font-bold mt-2 pt-2 flex items-center gap-2 ${
                             lead.followUpDate < new Date().toISOString().split('T')[0] ? 'text-red-400' : 'text-indigo-300'
                          }`}>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              <span>Agenda: {lead.followUpDate}</span>
                              {lead.followUpDate < new Date().toISOString().split('T')[0] && <span className="bg-red-500/20 px-1.5 py-0.5 rounded text-[8px] uppercase">Vencido</span>}
                          </div>
                      )}
                   </div>
                ))
             )}
        </div>

        {/* DESKTOP TABLE VIEW */}
        <div className="hidden md:block overflow-x-auto custom-scroll">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-white/[0.02] text-white/40 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                <th onClick={() => handleSort('name')} className="px-6 py-4 w-[20%] cursor-pointer hover:text-white transition-colors select-none">
                    Entidad {sortKey === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 w-[15%]">Contacto</th>
                <th className="px-6 py-4 w-[20%]">Datos</th>
                <th className="px-6 py-4 w-[20%]">Notas</th>
                <th onClick={() => handleSort('status')} className="px-6 py-4 w-[12%] cursor-pointer hover:text-white transition-colors select-none">
                    Status {sortKey === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('followUpDate')} className="px-6 py-4 w-[10%] cursor-pointer hover:text-white transition-colors select-none">
                    Agenda {sortKey === 'followUpDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 w-[5%]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {processedLeads.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-white/10 font-black uppercase tracking-[0.5em] text-[10px]">Sin resultados</td></tr>
              ) : (
                processedLeads.map((lead) => (
                  <tr key={lead.id} className={`hover:bg-white/[0.02] transition-colors group ${lead.status === 'client' ? 'bg-emerald-500/[0.02]' : ''}`}>
                    {/* Entity */}
                    <td className="px-6 py-3 align-middle cursor-pointer" onClick={() => setSelectedLead(lead)}>
                      <div className="font-bold text-white text-[13px] truncate max-w-[200px] leading-tight group-hover:text-indigo-200 transition-colors">{lead.name}</div>
                      <div className="text-[10px] text-white/40 uppercase font-medium mt-0.5 truncate max-w-[200px]">{lead.category}</div>
                    </td>
                    
                    {/* Contact Name */}
                    <td className="px-6 py-3 align-middle">
                      <input 
                        value={lead.contactName || ''} 
                        onChange={(e) => onUpdateLead(lead.id, { contactName: e.target.value })}
                        placeholder="Nombre..."
                        className="bg-transparent border-b border-transparent focus:border-white/20 hover:border-white/5 text-white/80 text-xs outline-none w-full py-1 placeholder:text-white/10 transition-colors"
                      />
                    </td>

                    {/* Contact Data */}
                    <td className="px-6 py-3 align-middle">
                       <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <input 
                              value={lead.phone} 
                              onChange={(e) => onUpdateLead(lead.id, { phone: e.target.value, whatsapp: e.target.value.replace(/\D/g, '') })}
                              placeholder="Tel..."
                              className="bg-transparent text-white/80 font-mono text-xs outline-none w-24 placeholder:text-white/10"
                            />
                            {lead.phone && <a href={getWhatsAppLink(lead.phone)} target="_blank" className="text-[9px] font-black bg-white/10 text-white/60 px-1.5 rounded hover:bg-green-500/80 hover:text-white transition-colors">WA</a>}
                            <a href={getMapsUrl(lead.name, lead.location)} target="_blank" className="text-white/20 hover:text-white transition-colors">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                            </a>
                          </div>
                          <input 
                            value={lead.email} 
                            onChange={(e) => onUpdateLead(lead.id, { email: e.target.value })}
                            placeholder="Email..."
                            className="bg-transparent text-white/50 text-[10px] outline-none w-full placeholder:text-white/10 focus:text-white transition-colors"
                          />
                       </div>
                    </td>

                    {/* Notes */}
                    <td className="px-6 py-3 align-middle">
                        <textarea 
                          value={lead.notes || ''} 
                          onChange={(e) => onUpdateLead(lead.id, { notes: e.target.value })}
                          placeholder="Sin notas..."
                          className="w-full bg-transparent focus:bg-white/[0.03] border border-transparent focus:border-white/10 rounded-lg p-1.5 text-xs text-white/60 focus:text-white outline-none h-10 resize-none leading-tight transition-all"
                        />
                    </td>

                    {/* Status */}
                    <td className="px-6 py-3 align-middle">
                        <select value={lead.status} onChange={(e) => onUpdateLead(lead.id, { status: e.target.value as any })} className={`border rounded-lg px-2 py-0 text-[9px] font-bold uppercase h-7 w-full outline-none ${getStatusStyles(lead.status)}`}>
                          <option value="frio">FRIO</option>
                          <option value="contacted">CONTACTADO</option>
                          <option value="negotiation">EN PROCESO</option>
                          <option value="client">CLIENTE</option>
                        </select>
                    </td>

                    {/* Follow Up Date */}
                    <td className="px-6 py-3 align-middle">
                        <input 
                            type="date" 
                            value={lead.followUpDate || ''} 
                            onChange={(e) => onUpdateLead(lead.id, { followUpDate: e.target.value })} 
                            className={`bg-transparent border rounded-lg px-2 text-[10px] font-bold h-7 w-full outline-none transition-colors ${
                                lead.followUpDate && lead.followUpDate < new Date().toISOString().split('T')[0] 
                                ? 'border-red-500/30 text-red-400 bg-red-500/5' 
                                : 'border-white/10 text-white/50 focus:text-white focus:border-white/30'
                            }`} 
                        />
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-3 align-middle text-right">
                      <button onClick={() => onRemove(lead.id)} className="text-white/10 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-white/5" title="Eliminar">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {selectedLead && (
        <LeadDetailPanel 
            lead={selectedLead} 
            onClose={() => setSelectedLead(null)} 
            onUpdate={(u, ctx) => { 
                if (ctx) onDetailedUpdate(selectedLead.id, u, ctx);
                else onUpdateLead(selectedLead.id, u); 
                setSelectedLead(prev => prev ? {...prev, ...u} : null); 
            }} 
        />
      )}
      
      {isAddModalOpen && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
             <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                 <h3 className="text-xl font-black text-white uppercase mb-6 italic tracking-tight">Nuevo Prospecto Manual</h3>
                 <form onSubmit={handleManualAddSubmit} className="space-y-5">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <input required placeholder="Entidad / Razón Social" value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} className="h-11 bg-black/50 border border-white/10 px-4 rounded-xl text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50" />
                         <input placeholder="Rubro" value={newLead.category} onChange={e => setNewLead({...newLead, category: e.target.value})} className="h-11 bg-black/50 border border-white/10 px-4 rounded-xl text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50" />
                         <input placeholder="Persona Contacto" value={newLead.contactName} onChange={e => setNewLead({...newLead, contactName: e.target.value})} className="h-11 bg-black/50 border border-white/10 px-4 rounded-xl text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50" />
                         <input placeholder="Teléfono" value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} className="h-11 bg-black/50 border border-white/10 px-4 rounded-xl text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50" />
                         <div className="md:col-span-2">
                             <input placeholder="Ubicación" value={newLead.location} onChange={e => setNewLead({...newLead, location: e.target.value})} className="w-full h-11 bg-black/50 border border-white/10 px-4 rounded-xl text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50" />
                         </div>
                     </div>
                     <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                        <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 text-xs font-bold text-white/40 hover:text-white transition-colors uppercase tracking-wide">Cancelar</button>
                        <button type="submit" className="px-6 py-2.5 bg-white text-black rounded-xl text-xs font-black hover:bg-indigo-50 hover:text-indigo-900 transition-all uppercase tracking-wide shadow-lg">Guardar Prospecto</button>
                     </div>
                 </form>
             </div>
         </div>
      )}
    </div>
  );
};

export default CRMView;
