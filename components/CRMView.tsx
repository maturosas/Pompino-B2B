
import React, { useState, useMemo, useEffect } from 'react';
import { FixedSizeList as List, ListOnItemsRenderedProps } from 'react-window';
import { Lead } from '../types';
import LeadDetailPanel from './LeadDetailPanel';
import { isUserAdmin } from '../projectConfig';
import { useDataStore } from '../stores/useDataStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useAppStore } from '../stores/useAppStore';

type SortKey = 'name' | 'category' | 'status' | 'savedAt' | 'nextActionDate';

const getStatusPillClass = (status: string) => {
    switch(status) {
        case 'client': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
        case 'negotiation': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
        case 'contacted': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
        default: return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
    }
};

// Memoized Row component for react-window
const Row = React.memo(({ index, style, data }: { index: number; style: React.CSSProperties; data: any }) => {
    const { leads, setSelectedLead, removeFromCRM, currentUser, isAdmin } = data;
    const lead = leads[index];
    if (!lead) return null;

    return (
        <div style={style} className="group hover:bg-white/[0.03] transition-colors border-b border-white/5 flex items-center min-w-[1200px]">
            <div className="px-6 py-3 flex-shrink-0" style={{ width: 350 }}>
                <p className="font-bold text-white text-sm truncate">{lead.name}</p>
                <p className="text-white/40 text-[10px] truncate">{lead.location}</p>
            </div>
            <div className="px-6 py-3 flex-shrink-0" style={{ width: 150 }}>
                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${getStatusPillClass(lead.status)}`}>{lead.status}</span>
            </div>
            <div className="px-6 py-3 flex-shrink-0" style={{ width: 200 }}>
                <div className="flex flex-wrap gap-1">
                    {lead.tags?.slice(0, 3).map(t => <span key={t} className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-white/5 text-white/50">{t}</span>)}
                    {lead.tags && lead.tags.length > 3 && <span className="text-[9px] font-bold text-white/30">+...</span>}
                </div>
            </div>
            <div className="px-6 py-3 flex-shrink-0" style={{ width: 150 }}>
                <span className="text-[10px] font-bold uppercase text-white/60">{lead.owner}</span>
            </div>
            <div className="px-6 py-3 flex-shrink-0" style={{ width: 150 }}>
                <p className="text-white text-xs font-bold">{lead.nextActionDate || '---'}</p>
                <p className="text-white/40 text-[10px] uppercase">{lead.nextAction || 'Sin planificar'}</p>
            </div>
            <div className="px-6 py-3 flex-grow text-right">
                <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setSelectedLead(lead)} className="px-3 py-1.5 bg-white/10 text-white/80 hover:bg-white hover:text-black text-[9px] font-bold uppercase rounded-lg">Ver Ficha</button>
                    {(isAdmin || lead.owner === currentUser) && (<button onClick={() => removeFromCRM(lead.id)} className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white text-[9px] font-bold uppercase rounded-lg">Eliminar</button>)}
                </div>
            </div>
        </div>
    );
});


const CRMView: React.FC = () => {
  const { 
    paginatedLeads, loadLeads, isLeadsLoading, hasMoreLeads, dbError,
    removeFromCRM, updateLead, detailedUpdate, reassignLead,
  } = useDataStore();
  const { currentUser } = useAuthStore();
  const { activeFolder, viewScope, setShowAddLeadModal } = useAppStore();

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('savedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tempAdvFilters, setTempAdvFilters] = useState({ location: '', category: '', tag: '', dateStart: '', dateEnd: '' });
  const [appliedAdvFilters, setAppliedAdvFilters] = useState({ location: '', category: '', tag: '', dateStart: '', dateEnd: '' });

  const effectiveStatusFilter = activeFolder === 'all' ? 'all' : activeFolder;
  const isAdmin = isUserAdmin(currentUser!);

  useEffect(() => {
    const filters = { sortKey, sortOrder, viewScope, statusFilter: effectiveStatusFilter, dateFilterStart: appliedAdvFilters.dateStart, dateFilterEnd: appliedAdvFilters.dateEnd, tagFilter: appliedAdvFilters.tag };
    loadLeads({ filters, reset: true });
  }, [sortKey, sortOrder, viewScope, activeFolder, appliedAdvFilters, loadLeads, effectiveStatusFilter]);
  
  if (!currentUser) return null;
  
  const processedLeads = useMemo(() => {
    return (paginatedLeads || []).filter(l => {
        const simpleSearchMatch = !search || (
            l.name.toLowerCase().includes(search.toLowerCase()) || 
            (l.notes || '').toLowerCase().includes(search.toLowerCase()) ||
            (l.contactName || '').toLowerCase().includes(search.toLowerCase())
        );
        const locationFilterText = appliedAdvFilters.location.toLowerCase();
        const locationMatch = !locationFilterText || (l.location.toLowerCase().includes(locationFilterText)) || ((l.deliveryZone || '').toLowerCase().includes(locationFilterText));
        const categoryMatch = !appliedAdvFilters.category || l.category.toLowerCase().includes(appliedAdvFilters.category.toLowerCase());
        return simpleSearchMatch && locationMatch && categoryMatch;
    });
  }, [paginatedLeads, search, appliedAdvFilters.location, appliedAdvFilters.category]);

  const handleItemsRendered = ({ visibleStopIndex }: ListOnItemsRenderedProps) => {
      if (!isLeadsLoading && hasMoreLeads && visibleStopIndex >= processedLeads.length - 5) {
          const filters = { sortKey, sortOrder, viewScope, statusFilter: effectiveStatusFilter, ...appliedAdvFilters };
          loadLeads({ filters, reset: false });
      }
  };
  
  const handleApplyAdvancedFilters = () => setAppliedAdvFilters(tempAdvFilters);
  const handleClearAdvancedFilters = () => {
    setAppliedAdvFilters({ location: '', category: '', tag: '', dateStart: '', dateEnd: '' });
    setTempAdvFilters({ location: '', category: '', tag: '', dateStart: '', dateEnd: '' });
    setShowAdvanced(false);
  };
  const isAdvancedFilterActive = appliedAdvFilters.location || appliedAdvFilters.category || appliedAdvFilters.dateStart || appliedAdvFilters.dateEnd || appliedAdvFilters.tag;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortOrder('desc'); }
  };
  
  const SortIndicator = ({ columnKey }: { columnKey: SortKey }) => sortKey === columnKey ? <span className="ml-1">{sortOrder === 'desc' ? '▼' : '▲'}</span> : null;

  const renderDbError = () => {
    if (!dbError) return null;
    if (dbError.startsWith('INDEX_REQUIRED::')) {
        const url = dbError.split('::')[1];
        return (<div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3"><div className="w-full md:w-auto"><a href={url} target="_blank" rel="noopener noreferrer" className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black uppercase rounded-lg transition-colors shrink-0 flex items-center justify-center shadow-lg">Crear Índice (1-Clic)</a><button onClick={() => loadLeads({ filters: { sortKey, sortOrder, viewScope, statusFilter: effectiveStatusFilter, ...appliedAdvFilters }, reset: true })} className="px-4 py-3 bg-white text-black text-[9px] font-black uppercase rounded-lg hover:bg-gray-200 transition-colors shrink-0">Reintentar</button></div></div>);
    }
    return (<div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-4"><p className="text-red-400 text-xs font-black uppercase mb-1">⚠️ Error en Base de Datos</p><p className="text-white/70 text-[11px] font-mono">{dbError}</p></div>);
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div><h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">Gestión de Cuentas</h1><p className="text-white/40 text-xs font-medium mt-1 uppercase tracking-widest">CRM ({processedLeads.length} registros)</p></div>
        <div className="w-full md:w-auto flex gap-2"><button onClick={() => setShowAddLeadModal(true)} className="h-12 px-4 bg-white text-black text-[10px] font-black uppercase rounded-xl flex items-center gap-2 shadow-lg hover:bg-gray-200 transition-all shrink-0">+ Nuevo Lead Manual</button><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, notas..." className="w-full md:w-72 h-12 bg-black/50 border border-white/10 rounded-xl px-4 text-sm text-white"/><button onClick={() => setShowAdvanced(!showAdvanced)} className={`h-12 w-12 flex items-center justify-center rounded-xl border transition-colors shrink-0 ${isAdvancedFilterActive ? 'bg-indigo-500/20 border-indigo-500/30' : 'bg-black/50 border-white/10'}`}><svg className={`w-5 h-5 ${isAdvancedFilterActive ? 'text-indigo-300' : 'text-white/50'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zM3 16a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z"/></svg></button></div>
      </div>
      
      {showAdvanced && (<div className="bg-white/5 p-4 rounded-2xl border border-white/10 animate-in fade-in duration-300 space-y-4"><div className="grid grid-cols-1 md:grid-cols-5 gap-4"><input value={tempAdvFilters.location} onChange={e => setTempAdvFilters(f => ({...f, location: e.target.value}))} placeholder="Filtrar por Zona..." className="h-10 bg-black/50 border border-white/10 rounded-lg px-3 text-xs" /><input value={tempAdvFilters.category} onChange={e => setTempAdvFilters(f => ({...f, category: e.target.value}))} placeholder="Filtrar por Categoría..." className="h-10 bg-black/50 border border-white/10 rounded-lg px-3 text-xs" /><input value={tempAdvFilters.tag} onChange={e => setTempAdvFilters(f => ({...f, tag: e.target.value}))} placeholder="Filtrar por Etiqueta..." className="h-10 bg-black/50 border border-white/10 rounded-lg px-3 text-xs" /><input type="date" value={tempAdvFilters.dateStart} onChange={e => setTempAdvFilters(f => ({...f, dateStart: e.target.value}))} className="h-10 bg-black/50 border border-white/10 rounded-lg px-3 text-xs text-white/50" /><input type="date" value={tempAdvFilters.dateEnd} onChange={e => setTempAdvFilters(f => ({...f, dateEnd: e.target.value}))} className="h-10 bg-black/50 border border-white/10 rounded-lg px-3 text-xs text-white/50" /></div><div className="flex justify-end gap-2"><button onClick={handleClearAdvancedFilters} className="px-4 py-2 text-white/40 text-[9px] font-bold uppercase hover:text-white">Limpiar</button><button onClick={handleApplyAdvancedFilters} className="px-5 py-2 bg-white text-black rounded-lg text-[9px] font-black uppercase">Aplicar Filtros</button></div></div>)}
      {renderDbError()}

      <div className="border border-white/10 rounded-3xl overflow-hidden bg-[#050505] shadow-2xl">
        <div className="sticky top-0 bg-[#0a0a0a] z-10 border-b border-white/10 text-[9px] font-bold uppercase tracking-widest text-white/40 overflow-x-auto custom-scroll">
            <div className="flex min-w-[1200px]">
                <div className="px-6 py-4 flex-shrink-0 cursor-pointer hover:text-white transition-colors" style={{width: 350}} onClick={() => handleSort('name')}>Cuenta <SortIndicator columnKey='name' /></div>
                <div className="px-6 py-4 flex-shrink-0 cursor-pointer hover:text-white transition-colors" style={{width: 150}} onClick={() => handleSort('status')}>Estado <SortIndicator columnKey='status' /></div>
                <div className="px-6 py-4 flex-shrink-0" style={{width: 200}}>Etiquetas</div>
                <div className="px-6 py-4 flex-shrink-0" style={{width: 150}}>Propietario</div>
                <div className="px-6 py-4 flex-shrink-0 cursor-pointer hover:text-white transition-colors" style={{width: 150}} onClick={() => handleSort('nextActionDate')}>Próxima Acción <SortIndicator columnKey='nextActionDate' /></div>
                <div className="px-6 py-4 flex-grow text-right">Acciones</div>
            </div>
        </div>

        <div className="h-[70vh] w-full overflow-hidden">
        {isLeadsLoading && processedLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <svg className="animate-spin h-8 w-8 text-white mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <p className="text-white/50 text-xs font-bold uppercase animate-pulse">Cargando Datos...</p>
            </div>
        ) : processedLeads.length > 0 ? (
            <List
                height={window.innerHeight * 0.7} 
                itemCount={processedLeads.length}
                itemSize={65} // Row height in pixels
                width="100%"
                itemData={{ leads: processedLeads, setSelectedLead, removeFromCRM, currentUser, isAdmin }}
                onItemsRendered={handleItemsRendered}
                itemKey={(index, data) => data.leads[index].id}
            >
                {Row}
            </List>
        ) : (!isLeadsLoading && !dbError && <div className="text-center p-12 text-white/10 font-black text-lg uppercase tracking-[0.3em]">Sin Registros</div>)}
        </div>
        {isLeadsLoading && processedLeads.length > 0 && <div className="text-center p-2 text-white/30 text-xs font-bold uppercase bg-[#0a0a0a] border-t border-white/10">Cargando más...</div>}
      </div>
      
      {selectedLead && (<LeadDetailPanel lead={selectedLead} onClose={() => setSelectedLead(null)} onUpdate={(updates, context) => { if (context) { detailedUpdate(selectedLead.id, updates, context); } else { updateLead(selectedLead.id, updates); } setSelectedLead(prev => prev ? {...prev, ...updates} : null); }} onReassign={(newOwner) => reassignLead(selectedLead.id, selectedLead.name, newOwner)} />)}
    </div>
  );
};

export default CRMView;
