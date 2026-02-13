
import React, { useState } from 'react';
import { useDataStore } from '../stores/useDataStore';

const OperationsView: React.FC = () => {
  const { operationsLog, connectionState, fetchAllLeadsForBackup } = useDataStore();
  const [isBackingUp, setIsBackingUp] = useState(false);

  const handleBackup = async () => {
      setIsBackingUp(true);
      try {
          const allLeads = await fetchAllLeadsForBackup();
          if (allLeads.length === 0) {
              alert("No hay datos para respaldar.");
              return;
          }
          const json = JSON.stringify(allLeads, null, 2);
          const blob = new Blob([json], {type: 'application/json'});
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `pompino_backup_completo_${new Date().toISOString().split('T')[0]}.json`;
          a.click();
          URL.revokeObjectURL(url);
      } catch (e) {
          console.error("Backup failed", e);
          alert("Error generando el backup completo. Revisa la consola.");
      } finally {
          setIsBackingUp(false);
      }
  };
  
  const storageUsage = connectionState === 'ok' ? "CLOUD" : "OFFLINE";

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'text-white';
      case 'DELETE': return 'text-white/40 line-through';
      case 'LOGIN': return 'text-emerald-500';
      case 'LOGOUT': return 'text-red-400';
      default: return 'text-white/60';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#050505] border border-white/10 rounded-3xl p-6 shadow-xl">
               <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Gobierno de Datos</h3>
               <div className="flex flex-wrap gap-3">
                   <button onClick={handleBackup} disabled={isBackingUp} className="h-12 px-6 bg-white text-black hover:bg-gray-200 text-[10px] font-black uppercase rounded-xl shadow-lg disabled:opacity-50">
                       {isBackingUp ? 'Generando...' : 'Descargar Backup Completo'}
                   </button>
                   <button disabled className="h-12 px-6 bg-transparent text-white/30 border border-white/10 text-[10px] font-black uppercase rounded-xl cursor-not-allowed">Restaurar (Próximamente)</button>
               </div>
          </div>
          <div className="bg-[#050505] border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col justify-center">
              <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Estado del Sistema</h3>
              <div className="text-2xl font-black text-white mb-2 uppercase tracking-tight">{storageUsage}</div>
              <div className="w-full bg-white/10 rounded-full h-0.5 mb-2 overflow-hidden"><div className={`h-full ${storageUsage === "CLOUD" ? "bg-white w-full" : "bg-red-500 w-1/4"}`}></div></div>
              <p className="text-[9px] text-white/30 font-mono">{storageUsage === "CLOUD" ? "SYNC: FIREBASE" : "NO CONNECTION"}</p>
          </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-black uppercase tracking-tighter text-white mb-4 pl-2">Registro de Operaciones</h2>
        <div className="border border-white/10 rounded-3xl overflow-hidden bg-[#050505] shadow-2xl">
            <div className="overflow-x-auto custom-scroll h-[600px]">
            <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="sticky top-0 bg-[#0a0a0a] z-10">
                <tr className="bg-white/[0.02] text-white/30 text-[9px] font-bold uppercase tracking-widest border-b border-white/10">
                    <th className="px-6 py-4">Timestamp</th><th className="px-6 py-4">Operador</th><th className="px-6 py-4">Acción</th><th className="px-6 py-4">Detalle</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-[10px]">
                {operationsLog.length === 0 ? (<tr><td colSpan={4} className="px-6 py-12 text-center text-white/10 font-black uppercase tracking-[0.5em]">Cargando...</td></tr>) : (operationsLog.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02]"><td className="px-6 py-3 text-white/30">{new Date(log.timestamp).toLocaleString('es-AR')}</td><td className="px-6 py-3"><span className="text-white font-bold uppercase">{log.user}</span></td><td className={`px-6 py-3 font-bold uppercase ${getActionColor(log.action)}`}>{log.action}</td><td className="px-6 py-3 text-white/50">{log.details}</td></tr>
                )))}
                </tbody>
            </table>
            </div>
        </div>
      </div>
    </div>
  );
};

export default OperationsView;