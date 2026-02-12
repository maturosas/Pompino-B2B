
import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Lead } from '../types';
import { getUserNames } from '../projectConfig';

interface StatsViewProps {
  leads: Lead[];
  currentUser?: string;
}

const StatsView: React.FC<StatsViewProps> = ({ leads = [] }) => {
  const [mainTab, setMainTab] = useState<'crm' | 'web'>('crm');
  
  // --- CRM LOGIC ---
  const crmStats = useMemo(() => {
    const totalLeads = leads.length;
    const clients = leads.filter(l => l.status === 'client').length;
    const conversionRate = totalLeads > 0 ? ((clients / totalLeads) * 100).toFixed(1) : '0.0';
    const negotiation = leads.filter(l => l.status === 'negotiation').length;
    return { totalLeads, clients, conversionRate, negotiation };
  }, [leads]);

  const crmPieData = useMemo(() => {
    return [
      { name: 'Frío', value: leads.filter(l => l.status === 'frio').length, color: '#94a3b8' },
      { name: 'Contactado', value: leads.filter(l => l.status === 'contacted').length, color: '#60a5fa' },
      { name: 'Negociación', value: leads.filter(l => l.status === 'negotiation').length, color: '#fbbf24' },
      { name: 'Cliente', value: leads.filter(l => l.status === 'client').length, color: '#10b981' },
    ].filter(item => item.value > 0);
  }, [leads]);

  const crmTeamData = useMemo(() => {
    return getUserNames().map(user => {
        const userLeads = leads.filter(l => l.owner === user);
        return {
            name: user,
            Total: userLeads.length,
            Clientes: userLeads.filter(l => l.status === 'client').length,
            Negociacion: userLeads.filter(l => l.status === 'negotiation').length
        };
    }).sort((a, b) => b.Total - a.Total); 
  }, [leads]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 border border-white/10 p-3 rounded-xl shadow-xl z-50">
          <p className="text-white text-xs font-bold mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
             <p key={index} className="text-[10px] uppercase font-mono" style={{ color: entry.color || entry.fill }}>
                {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
             </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* HEADER TABS */}
      <div className="glass-solid p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 relative overflow-hidden">
             <div className={`absolute inset-0 opacity-10 transition-colors duration-500 pointer-events-none ${mainTab === 'crm' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>
             
             <div className="relative z-10">
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                    {mainTab === 'crm' ? 'Rendimiento Comercial' : 'E-Commerce Analytics'}
                </h2>
                <p className="text-white/50 text-xs font-bold uppercase tracking-widest mt-1">
                    {mainTab === 'crm' ? 'Estadísticas del CRM' : 'Datos reales de Google Analytics 4'}
                </p>
             </div>
             
             <div className="relative z-10 bg-black/40 p-1 rounded-xl border border-white/10 flex">
                 <button onClick={() => setMainTab('crm')} className={`px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all ${mainTab === 'crm' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>CRM Ventas</button>
                 <button onClick={() => setMainTab('web')} className={`px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all ${mainTab === 'web' ? 'bg-emerald-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>Web Real-Time</button>
             </div>
      </div>

      {/* --- TAB 1: CRM --- */}
      {mainTab === 'crm' && (
        <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#0a0a0a] border border-white/10 p-5 rounded-2xl shadow-lg"><p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Total Leads</p><p className="text-3xl font-black text-white">{crmStats.totalLeads}</p></div>
                <div className="bg-[#0a0a0a] border border-white/10 p-5 rounded-2xl shadow-lg"><p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-1">Clientes Ganados</p><p className="text-3xl font-black text-white">{crmStats.clients}</p></div>
                <div className="bg-[#0a0a0a] border border-white/10 p-5 rounded-2xl shadow-lg"><p className="text-[10px] font-black text-yellow-300 uppercase tracking-widest mb-1">Tasa Conversión</p><p className="text-3xl font-black text-white">{crmStats.conversionRate}%</p></div>
                <div className="bg-[#0a0a0a] border border-white/10 p-5 rounded-2xl shadow-lg"><p className="text-[10px] font-black text-red-300 uppercase tracking-widest mb-1">En Negociación</p><p className="text-3xl font-black text-white">{crmStats.negotiation}</p></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col h-[400px]">
                    <h3 className="text-sm font-black text-white uppercase tracking-wide mb-6">Distribución</h3>
                    <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={crmPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">{crmPieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip content={<CustomTooltip />} /><Legend verticalAlign="bottom" /></PieChart></ResponsiveContainer>
                </div>
                <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col h-[400px]">
                    <h3 className="text-sm font-black text-white uppercase tracking-wide mb-6">Rendimiento Equipo</h3>
                    <ResponsiveContainer width="100%" height="100%"><BarChart data={crmTeamData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} /><XAxis dataKey="name" stroke="#ffffff50" fontSize={10} /><YAxis stroke="#ffffff50" fontSize={10} /><Tooltip content={<CustomTooltip />} cursor={{fill: '#ffffff05'}} /><Legend verticalAlign="top" /><Bar dataKey="Total" fill="#6366f1" radius={[4, 4, 0, 0]} /><Bar dataKey="Negociacion" fill="#fbbf24" radius={[4, 4, 0, 0]} /><Bar dataKey="Clientes" fill="#10b981" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
                </div>
            </div>
        </div>
      )}

      {/* --- TAB 2: WEB ANALYTICS (CONSTRUCTION) --- */}
      {mainTab === 'web' && (
         <div className="py-24 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.02] animate-in zoom-in-95">
             <div className="text-6xl mb-6 opacity-80">🚧</div>
             <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4">
                 Módulo de BigQuery en Mantenimiento
             </h3>
             <p className="text-white/50 text-sm max-w-lg mx-auto leading-relaxed">
                 Estamos realizando tareas de mantenimiento en la conexión con <strong>Google BigQuery</strong> y <strong>GA4</strong> para asegurar la integridad de los datos de facturación.
             </p>
             
             <div className="mt-8 flex justify-center gap-2">
                 <span className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase border border-indigo-500/20">Backend Update</span>
                 <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase border border-emerald-500/20">Data Integrity</span>
             </div>
         </div>
      )}
    </div>
  );
};

export default StatsView;
