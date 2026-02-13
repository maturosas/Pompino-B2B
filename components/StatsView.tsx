
import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getUserNames, isCommissionEligible } from '../projectConfig';
import { useDataStore } from '../stores/useDataStore';

const StatsView: React.FC = () => {
  const { allLeads: leads } = useDataStore();
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  
  const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(val);

  const safeLeads = useMemo(() => leads || [], [leads]);

  const closedSalesInMonth = useMemo(() => safeLeads.filter(l => l.status === 'client' && l.lastContactDate && l.lastContactDate.startsWith(selectedMonth)), [safeLeads, selectedMonth]);

  const crmStats = useMemo(() => {
    const clients = safeLeads.filter(l => l.status === 'client').length;
    return {
      clients,
      conversionRate: safeLeads.length > 0 ? ((clients / safeLeads.length) * 100).toFixed(1) : '0.0',
      negotiation: safeLeads.filter(l => l.status === 'negotiation').length,
      monthlyRevenue: closedSalesInMonth.reduce((sum, l) => sum + (l.saleValue || 0), 0),
    };
  }, [safeLeads, closedSalesInMonth]);

  const crmPieData = useMemo(() => [
      { name: 'Frío', value: safeLeads.filter(l => l.status === 'frio').length, color: '#374151' },
      { name: 'Contactado', value: safeLeads.filter(l => l.status === 'contacted').length, color: '#3b82f6' },
      { name: 'Negociación', value: safeLeads.filter(l => l.status === 'negotiation').length, color: '#f59e0b' },
      { name: 'Cliente', value: safeLeads.filter(l => l.status === 'client').length, color: '#10b981' },
    ].filter(item => item.value > 0), [safeLeads]);

  const bonusTableData = useMemo(() => getUserNames().filter(isCommissionEligible).map(user => {
        const userSales = closedSalesInMonth.filter(l => l.owner === user);
        const revenue = userSales.reduce((sum, l) => sum + (l.saleValue || 0), 0);
        return { name: user, revenue, bonus: revenue * 0.04, salesCount: userSales.length };
    }).sort((a, b) => b.revenue - a.revenue), [closedSalesInMonth]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
        <div className="bg-[#050505] p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div><h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Rendimiento Comercial</h2><p className="text-white/50 text-xs font-bold uppercase tracking-widest mt-1">Estadísticas (Basado en {safeLeads.length} leads cargados)</p></div>
            <div className="flex flex-col"><label className="text-[9px] font-bold text-white/40 uppercase mb-1">Filtrar Mes</label><input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-black border border-white/20 rounded-lg px-3 py-2 text-xs text-white" /></div>
        </div>
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#050505] border border-white/10 p-6 rounded-3xl"><p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Facturación</p><p className="text-2xl lg:text-3xl font-black text-white truncate">{formatCurrency(crmStats.monthlyRevenue)}</p></div>
                <div className="bg-[#050505] border border-white/10 p-6 rounded-3xl"><p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Clientes</p><p className="text-3xl font-black text-white">{crmStats.clients}</p></div>
                <div className="bg-[#050505] border border-white/10 p-6 rounded-3xl"><p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Conversión</p><p className="text-3xl font-black text-white">{crmStats.conversionRate}%</p></div>
                <div className="bg-[#050505] border border-white/10 p-6 rounded-3xl"><p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Negociación</p><p className="text-3xl font-black text-white">{crmStats.negotiation}</p></div>
            </div>
            <div className="bg-[#050505] border border-white/10 rounded-3xl p-6 overflow-hidden">
                <h3 className="text-sm font-black text-white uppercase tracking-wide mb-6">Bonos y Comisiones ({selectedMonth})</h3>
                <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b border-white/10 text-[9px] text-white/30 uppercase tracking-widest"><th className="px-4 py-3">Vendedor</th><th className="px-4 py-3">Ventas</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3 text-right text-white">Bono (4%)</th></tr></thead><tbody className="text-sm font-mono text-[11px]">{bonusTableData.map(user => (<tr key={user.name} className="border-b border-white/5 hover:bg-white/5"><td className="px-4 py-3 font-bold text-white uppercase">{user.name}</td><td className="px-4 py-3 text-white/60">{user.salesCount}</td><td className="px-4 py-3 text-right text-white/60">{formatCurrency(user.revenue)}</td><td className="px-4 py-3 text-right font-bold text-white">{formatCurrency(user.bonus)}</td></tr>))}</tbody></table></div>
            </div>
        </div>
    </div>
  );
};

export default StatsView;
