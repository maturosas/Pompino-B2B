
import React, { useState, useMemo } from 'react';
import { Lead, User, TransferRequest } from '../types';
import LeadDetailPanel from './LeadDetailPanel';
import HowToUseModal from './HowToUseModal';

interface CRMViewProps {
  leads: Lead[];
  onRemove: (id: string) => void;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  onDetailedUpdate: (id: string, updates: Partial<Lead>, context: string) => void;
  onAddManualLead: (lead: Lead) => void;
  activeFolder: string;
  currentUser: User;
  viewScope: User | 'me';
  transferRequests: TransferRequest[];
  onResolveTransfer: (requestId: string, accepted: boolean) => void;
  onRequestTransfer: (lead: Lead) => void;
}

type SortKey = 'name' | 'category' | 'status' | 'savedAt' | 'nextActionDate';
type DateFilter = 'all' | 'overdue' | 'today' | 'future' | 'unset';
type TypeFilter = 'all' | 'client' | 'prospect';

const CRMView: React.FC<CRMViewProps> = ({ 
    leads, onRemove, onUpdateLead, onDetailedUpdate, onAddManualLead, activeFolder, 
    currentUser, viewScope, transferRequests, onResolveTransfer, onRequestTransfer 
}) => {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('savedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showHelp, setShowHelp] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all'); 
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  const [newLead, setNewLead] = useState<Partial<Lead>>({
    name: '', category: '', location: '', phone: '', email: '', status: 'frio', isClient: false, contactName: ''
  });

  const isReadOnly = viewScope !== 'me'; 
  const myPendingRequests = transferRequests.filter(r => r.toUser === currentUser && r.status === 'pending');

  const actionLabels: Record<string, string> = {
    call: 'Llamado',
    whatsapp: 'WhatsApp',
    email: 'Email',
    visit: 'Visita',
    quote: 'Presupuesto',
    offer: 'Oferta',
    sale: 'Venta'
  };

  const processedLeads = useMemo(() => {
    // 1. Scope Filter
    let result = leads.filter(l => {
        if (viewScope === 'me') return l.owner === currentUser;
        return l.owner === viewScope;
    });
    
    // 2. Folder Filter
    if (activeFolder !== 'all') {
      result = result.filter(l => l.status === activeFolder);
    }

    // 3. Global Search
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

    // 4. Status Filter
    if (activeFolder === 'all' && statusFilter !== 'all') {
        result = result.filter(l => l.status === statusFilter);
    }

    // 5. Type Filter
    if (typeFilter !== 'all') {
        if (typeFilter === 'client') {
            result = result.filter(l => l.status === 'client');
        } else if (typeFilter === 'prospect') {
            result = result.filter(l => l.status !== 'client');
        }
    }

    // 6. Date Filter (using nextActionDate)
    if (dateFilter !== 'all') {
        const today = new Date().toISOString().split('T')[0];
        result = result.filter(l => {
            if (dateFilter === 'unset') return !l.nextActionDate;
            if (!l.nextActionDate) return false;
            
            if (dateFilter === 'overdue') return l.nextActionDate < today;
            if (dateFilter === 'today') return l.nextActionDate === today;
            if (dateFilter === 'future') return l.nextActionDate > today;
            return true;
        });
    }

    // 7. Sorting
    result.sort((a, b) => {
      let valA: any = a[sortKey as keyof Lead] || '';
      let valB: any = b[sortKey as keyof Lead] || '';
      if (sortKey === 'nextActionDate') {
          if (!valA) valA = '9999-99-99';
          if (!valB) valB = '9999-99-99';
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return result;
  }, [leads, search, sortKey, sortOrder, activeFolder, statusFilter, typeFilter, dateFilter, viewScope, currentUser]);

  const handleManualAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name) return;
    onAddManualLead({ ...newLead as Lead, id: `manual-${Date.now()}`, savedAt: Date.now() });
    setIsAddModalOpen(false);
    setNewLead({ name: '', category: '', location: '', phone: '', email: '', status: 'frio', isClient: false, contactName: '' });
  };

  const handleExportCSV = () => {
    if (processedLeads.length === 0) return;
    const headers = ["Cuenta", "POC", "Teléfono", "Email", "Status", "Ultimo Contacto", "Proxima Acción", "Fecha Proxima", "Lista Precios", "Notas"];
    const escape = (str: any) => `"${(str || "").toString().replace(/"/g, '""')}"`;
    const csvContent = [
      headers.join(","),
      ...processedLeads.map(l => [
        escape(l.name), 
        escape(l.contactName),
        escape(l.phone), 
        escape(l.email), 
        escape(l.status), 
        escape(l.lastContactDate), 
        escape(l.nextAction), 
        escape(l.nextActionDate), 
        escape(l.priceList), 
        escape(l.notes)
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

  const getPriceListLabel = (pl?: string) => {
      switch(pl) {
          case 'special': return 'Especial';
          case 'wholesale': return 'Mayorista';
          case 'discount_15': return '15% Off';
          default: return 'Regular';
      }
  }

  const getPriceListColor = (pl?: string) => {
    switch(pl) {
        case 'special': return 'text-purple-300 bg-purple-500/10 border-purple-500/20';
        case 'wholesale': return 'text-orange-300 bg-orange-500/10 border-orange-500/20';
        case 'discount_15': return 'text-green-300 bg-green-500/10 border-green-500/20';
        default: return 'text-white/30 bg-white/5 border-white/10';
    }
  }

  const getFolderName = (id: string) => {
      switch(id) {
          case 'frio': return 'Prospectos Fríos';
          case 'contacted': return 'Contactados';
          case 'negotiation': return 'En Negociación';
          case 'client': return 'Clientes Activos';
          default: return 'Todos los Registros';
      }
  }

  const handleSort = (key: SortKey) => {
      if (sortKey === key) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
      else { setSortKey(key); setSortOrder('asc'); }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <HowToUseModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {/* Inbox Notification Center */}
      {viewScope === 'me' && myPendingRequests.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-4 animate-in slide-in-from-top-4">
              <h3 className="text-xs font-black text-indigo-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                  Solicitudes de Transferencia Pendientes ({myPendingRequests.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {myPendingRequests.map(req => (
                      <div key={req.id} className="bg-[#050505] border border-white/10 p-3 rounded-xl flex flex-col justify-between gap-3 shadow-lg">
                          <div>
                              <p className="text-white font-bold text-xs">{req.leadName}</p>
                              <p className="text-[10px] text-white/50 mt-1">Solicitado por: <span className="text-white font-bold uppercase">{req.fromUser}</span></p>
                          </div>
                          <div className="flex gap-2">
                              <button onClick={() => onResolveTransfer(req.id, true)} className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[10px] font-bold py-1.5 rounded-lg uppercase">Aceptar</button>
                              <button onClick={() => onResolveTransfer(req.id, false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white/50 text-[10px] font-bold py-1.5 rounded-lg uppercase">Rechazar</button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-2 gap-4">
        <div>
            <div className="flex items-center gap-2 mb-1">
                 {viewScope !== 'me' && <span className="bg-indigo-500 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase">Viendo carpeta de: {viewScope}</span>}
            </div>
            <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white drop-shadow-md">
                {getFolderName(activeFolder)}
            </h2>
            <div className="flex items-center gap-3 mt-1">
                <p className="text-white/40 text-xs font-medium">
                    Visualizando <span className="text-white">{processedLeads.length}</span> oportunidades {viewScope === 'me' ? 'propias' : `de ${viewScope}`}
                </p>
            </div>
        </div>
        <div className="flex gap-2">
            {!isReadOnly && (
                <button onClick={() => setIsAddModalOpen(true)} className="h-10 px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20 hover:-translate-y-0.5">
                <span>+ NUEVO PROSPECTO</span>
                </button>
            )}
            <button onClick={handleExportCSV} className="h-10 px-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[10px] font-black uppercase rounded-xl transition-all flex items-center justify-center gap-2">
               CSV
            </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="p-4 md:p-5 border border-white/5 rounded-3xl glass-solid space-y-4 shadow-xl">
        <div className="relative group">
            <input 
              type="text" 
              placeholder="Buscar por Cuenta, POC, Notas..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full h-12 bg-black/40 border border-white/10 pl-4 pr-4 rounded-2xl text-sm font-medium text-white outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 placeholder:text-white/20 transition-all" 
            />
          </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {activeFolder === 'all' && (
                <div className="col-span-1">
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-[10px] font-bold text-white/70 uppercase outline-none focus:bg-white/10 focus:border-white/20">
                        <option value="all">TODOS LOS ESTADOS</option>
                        <option value="frio">FRIO</option>
                        <option value="contacted">CONTACTADO</option>
                        <option value="negotiation">EN NEGOCIACIÓN</option>
                        <option value="client">CLIENTES</option>
                    </select>
                </div>
            )}
            <div className="col-span-1">
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TypeFilter)} className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-[10px] font-bold text-white/70 uppercase outline-none focus:bg-white/10 focus:border-white/20">
                    <option value="all">TIPO: TODOS</option>
                    <option value="prospect">Solo Prospectos</option>
                    <option value="client">Solo Clientes</option>
                </select>
            </div>
            <div className="col-span-1">
                <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as DateFilter)} className={`w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-[10px] font-bold uppercase outline-none transition-colors ${dateFilter !== 'all' ? 'text-white border-white/30' : 'text-white/70'}`}>
                    <option value="all">AGENDA: TODAS</option>
                    <option value="overdue">⚠️ VENCIDOS</option>
                    <option value="today">📅 PARA HOY</option>
                    <option value="future">🔮 FUTUROS</option>
                    <option value="unset">⚪ SIN FECHA</option>
                </select>
            </div>
            {(dateFilter !== 'all' || typeFilter !== 'all' || (activeFolder === 'all' && statusFilter !== 'all')) && (
                 <button onClick={() => { setDateFilter('all'); setTypeFilter('all'); setStatusFilter('all'); }} className="col-span-1 h-10 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-[10px] font-black uppercase transition-colors">Limpiar</button>
            )}
        </div>
      </div>

      {/* Table View */}
      <div className="border border-white/5 rounded-3xl overflow-hidden glass-solid shadow-2xl">
        <div className="overflow-x-auto custom-scroll">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-white/[0.02] text-white/40 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                <th onClick={() => handleSort('name')} className="px-6 py-4 w-[18%] cursor-pointer hover:text-white transition-colors select-none">Cuenta {sortKey === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                <th className="px-6 py-4 w-[12%]">POC</th>
                <th className="px-6 py-4 w-[12%]">Contacto</th>
                <th onClick={() => handleSort('status')} className="px-6 py-4 w-[10%] cursor-pointer hover:text-white transition-colors select-none">Status {sortKey === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                <th className="px-6 py-4 w-[10%]">Ult. Contacto</th>
                <th onClick={() => handleSort('nextActionDate')} className="px-6 py-4 w-[15%] cursor-pointer hover:text-white transition-colors select-none">Prox. Acción {sortKey === 'nextActionDate' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                <th className="px-6 py-4 w-[15%]">Comentarios</th>
                <th className="px-6 py-4 w-[8%]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {processedLeads.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-white/10 font-black uppercase tracking-[0.5em] text-[10px]">Sin resultados</td></tr>
              ) : (
                processedLeads.map((lead) => (
                  <tr key={lead.id} className={`hover:bg-white/[0.02] transition-colors group ${lead.status === 'client' ? 'bg-emerald-500/[0.02]' : ''}`}>
                    {/* Cuenta + Price List */}
                    <td className="px-6 py-3 align-middle cursor-pointer" onClick={() => setSelectedLead(lead)}>
                      <div className="font-bold text-white text-[13px] truncate max-w-[200px] leading-tight group-hover:text-indigo-200 transition-colors">{lead.name}</div>
                      <div className={`text-[9px] uppercase font-bold mt-1 px-1.5 py-0.5 rounded border inline-block ${getPriceListColor(lead.priceList)}`}>
                          {getPriceListLabel(lead.priceList)}
                      </div>
                    </td>
                    
                    {/* POC */}
                    <td className="px-6 py-3 align-middle">
                      {isReadOnly ? (
                          <span className="text-white/60 text-xs">{lead.contactName || '---'}</span>
                      ) : (
                        <input value={lead.contactName || ''} onChange={(e) => onUpdateLead(lead.id, { contactName: e.target.value })} placeholder="POC..." className="bg-transparent border-b border-transparent focus:border-white/20 hover:border-white/5 text-white/80 text-xs outline-none w-full py-1 placeholder:text-white/10 transition-colors" />
                      )}
                    </td>

                    {/* Contact (Links) */}
                    <td className="px-6 py-3 align-middle">
                       <div className="flex gap-2">
                            {lead.phone && (
                                <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" className="w-8 h-8 rounded-lg bg-green-500/10 text-green-400 flex items-center justify-center hover:bg-green-500/20 transition-colors" title="WhatsApp">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                                </a>
                            )}
                            {lead.email && (
                                <a href={`mailto:${lead.email}`} className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center hover:bg-blue-500/20 transition-colors" title="Email">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                </a>
                            )}
                       </div>
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

                    {/* Last Contact */}
                    <td className="px-6 py-3 align-middle">
                        <span className="text-[10px] font-mono text-white/50 block">
                            {lead.lastContactDate ? new Date(lead.lastContactDate).toLocaleDateString() : '---'}
                        </span>
                        <span className="text-[9px] text-white/20 uppercase font-bold">Automático</span>
                    </td>

                    {/* Next Action */}
                    <td className="px-6 py-3 align-middle">
                        <div className="flex flex-col gap-1">
                            <select 
                                value={lead.nextAction || 'call'}
                                onChange={(e) => onUpdateLead(lead.id, { nextAction: e.target.value as any })}
                                className="bg-transparent text-[10px] font-bold uppercase text-indigo-300 outline-none cursor-pointer"
                            >
                                <option value="call">Llamado</option>
                                <option value="whatsapp">Whatsapp</option>
                                <option value="email">Email</option>
                                <option value="visit">Visita</option>
                                <option value="quote">Presupuesto</option>
                                <option value="offer">Oferta</option>
                                <option value="sale">Venta</option>
                            </select>
                            <input 
                                type="date" 
                                value={lead.nextActionDate || ''} 
                                onChange={(e) => onUpdateLead(lead.id, { nextActionDate: e.target.value })} 
                                className={`bg-transparent border rounded-lg px-2 text-[10px] font-bold h-7 w-full outline-none transition-colors ${
                                    lead.nextActionDate && lead.nextActionDate < new Date().toISOString().split('T')[0] 
                                    ? 'border-red-500/30 text-red-400 bg-red-500/5' 
                                    : 'border-white/10 text-white/50 focus:text-white focus:border-white/30'
                                }`} 
                            />
                        </div>
                    </td>

                    {/* Comments (Notes) */}
                    <td className="px-6 py-3 align-middle">
                        {isReadOnly ? (
                            <p className="text-white/60 text-xs italic truncate max-w-[150px]">{lead.notes || '---'}</p>
                        ) : (
                            <textarea value={lead.notes || ''} onChange={(e) => onUpdateLead(lead.id, { notes: e.target.value })} placeholder="Comentarios..." className="w-full bg-transparent focus:bg-white/[0.03] border border-transparent focus:border-white/10 rounded-lg p-1.5 text-xs text-white/60 focus:text-white outline-none h-10 resize-none leading-tight transition-all" />
                        )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-3 align-middle text-right">
                      {!isReadOnly ? (
                          <button onClick={() => onRemove(lead.id)} className="text-white/10 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-white/5" title="Eliminar">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                      ) : (
                           <button onClick={() => onRequestTransfer(lead)} className="text-white/30 hover:text-indigo-400 transition-colors p-2 rounded-lg hover:bg-white/5" title="Solicitar Transferencia">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                           </button>
                      )}
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
                if (isReadOnly) return; // Block updates in modal if read only
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
                         <input required placeholder="Cuenta / Razón Social" value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} className="h-11 bg-black/50 border border-white/10 px-4 rounded-xl text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50" />
                         <input placeholder="Rubro" value={newLead.category} onChange={e => setNewLead({...newLead, category: e.target.value})} className="h-11 bg-black/50 border border-white/10 px-4 rounded-xl text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50" />
                         <input placeholder="POC (Persona Contacto)" value={newLead.contactName} onChange={e => setNewLead({...newLead, contactName: e.target.value})} className="h-11 bg-black/50 border border-white/10 px-4 rounded-xl text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50" />
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
