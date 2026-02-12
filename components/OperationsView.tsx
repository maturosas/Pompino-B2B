
import React, { useMemo } from 'react';
import { OperationLog } from '../types';

interface OperationsViewProps {
  logs: OperationLog[];
  onBackup: () => void;
  onRestore: (file: File) => void;
  storageUsage: string;
}

const OperationsView: React.FC<OperationsViewProps> = ({ logs, onBackup, onRestore, storageUsage }) => {
  const getActionColor = (action: string) => {
    switch (action) {
      case 'SEARCH': return 'text-blue-400';
      case 'CREATE': return 'text-green-400';
      case 'UPDATE': return 'text-yellow-400';
      case 'STATUS_CHANGE': return 'text-purple-400';
      case 'DELETE': return 'text-red-400';
      case 'LOGIN': return 'text-emerald-400';
      case 'LOGOUT': return 'text-orange-400';
      default: return 'text-white';
    }
  };

  // Filter access logs (Login/Logout)
  const accessLogs = useMemo(() => {
      return logs.filter(l => l.action === 'LOGIN' || l.action === 'LOGOUT');
  }, [logs]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Access Control Panel */}
      <div className="grid grid-cols-1 gap-6">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 md:p-6 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none"></div>
               <div className="relative z-10">
                   <h3 className="text-lg font-black text-white uppercase italic tracking-tighter mb-4 flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1]"></span>
                       Control de Asistencia
                   </h3>
                   <p className="text-white/60 text-xs mb-4">Registro de sesiones de usuario (Entradas y Salidas).</p>
                   
                   <div className="bg-black/40 rounded-xl border border-white/5 overflow-hidden">
                       <div className="overflow-x-auto max-h-64 custom-scroll">
                           <table className="w-full text-left">
                               <thead className="sticky top-0 bg-[#0a0a0a]">
                                   <tr className="text-[10px] text-white/40 font-black uppercase tracking-widest border-b border-white/5">
                                       <th className="px-4 py-2 whitespace-nowrap">Fecha/Hora</th>
                                       <th className="px-4 py-2">Usuario</th>
                                       <th className="px-4 py-2">Evento</th>
                                       <th className="px-4 py-2">Detalle</th>
                                   </tr>
                               </thead>
                               <tbody className="text-[11px] font-mono divide-y divide-white/5">
                                   {accessLogs.length === 0 ? (
                                       <tr><td colSpan={4} className="px-4 py-8 text-center text-white/20">Sin registros de acceso.</td></tr>
                                   ) : (
                                       accessLogs.map(log => (
                                           <tr key={log.id} className="hover:bg-white/5">
                                               <td className="px-4 py-2 text-white/60 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                                               <td className="px-4 py-2 font-bold text-white">{log.user}</td>
                                               <td className={`px-4 py-2 font-bold ${getActionColor(log.action)}`}>{log.action === 'LOGIN' ? 'INICIO' : 'CIERRE'}</td>
                                               <td className="px-4 py-2 text-white/40 truncate max-w-[150px]">{log.details}</td>
                                           </tr>
                                       ))
                                   )}
                               </tbody>
                           </table>
                       </div>
                   </div>
               </div>
          </div>
      </div>

      {/* Data Governance Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
               <div className="relative z-10">
                   <h3 className="text-lg font-black text-white uppercase italic tracking-tighter mb-4 flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></span>
                       Gobierno de Datos
                   </h3>
                   <div className="flex flex-wrap gap-3">
                       <button onClick={onBackup} className="h-12 px-6 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all hover:-translate-y-0.5">
                           <span>☁️</span> Descargar Backup
                       </button>
                       <button onClick={() => alert("En modo nube, la restauración masiva está deshabilitada para evitar conflictos. Contacta a soporte.")} className="h-12 px-6 bg-white/5 text-white/20 border border-white/5 text-xs font-black uppercase rounded-xl flex items-center gap-2 cursor-not-allowed">
                           <span>🔒</span> Restaurar
                       </button>
                   </div>
               </div>
          </div>

          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-center relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-2">Estado del Sistema</h3>
                <div className="text-4xl font-black text-white mb-2">{storageUsage === "CLOUD" ? "ONLINE" : "OFFLINE"}</div>
                <div className="w-full bg-white/10 rounded-full h-1.5 mb-2 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ${storageUsage === "CLOUD" ? "bg-emerald-500 w-full" : "bg-red-500 w-1/4"}`}></div>
                </div>
                <p className="text-[10px] text-white/30">
                    {storageUsage === "CLOUD" ? "Sincronización activa con Firebase" : "Sin conexión a base de datos"}
                </p>
              </div>
          </div>
      </div>

      <div className="flex items-center justify-between pb-2 border-b border-white/5 mt-4">
        <h2 className="text-xl font-black italic uppercase tracking-tighter text-white/90">
             Audit Trail <span className="text-white/30 text-sm not-italic font-bold ml-2">Historial de Eventos Global</span>
        </h2>
      </div>

      <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0a0a0a] shadow-xl">
        {/* MOBILE VIEW (CARDS) */}
        <div className="md:hidden p-4 space-y-3 max-h-[500px] overflow-y-auto custom-scroll">
            {logs.length === 0 ? (
                <div className="text-center text-white/20 text-xs py-4">Sin registros</div>
            ) : (
                logs.map((log) => (
                    <div key={log.id} className="bg-white/5 rounded-lg p-3 border border-white/5">
                        <div className="flex justify-between items-start mb-1">
                            <span className={`text-[10px] font-black uppercase ${getActionColor(log.action)}`}>{log.action}</span>
                            <span className="text-[9px] text-white/40">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', day: '2-digit', month: '2-digit'})}</span>
                        </div>
                        <p className="text-xs text-white/80 leading-tight mb-2">{log.details}</p>
                        <div className="text-[9px] font-bold text-white/30 uppercase bg-white/5 inline-block px-1.5 py-0.5 rounded">User: {log.user}</div>
                    </div>
                ))
            )}
        </div>

        {/* DESKTOP VIEW (TABLE) */}
        <div className="hidden md:block overflow-x-auto custom-scroll h-[calc(100vh-500px)]">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 bg-[#0a0a0a] z-10">
              <tr className="bg-white/5 text-white/40 text-[9px] font-black uppercase tracking-widest border-b border-white/10">
                <th className="px-6 py-3 w-[15%]">Timestamp</th>
                <th className="px-6 py-3 w-[10%]">Operador</th>
                <th className="px-6 py-3 w-[15%]">Acción</th>
                <th className="px-6 py-3 w-[60%]">Detalle del Evento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-[10px]">
              {logs.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-white/10 font-black uppercase tracking-[0.5em]">Cargando historial...</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-3 text-white/30 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black bg-white/10 text-white uppercase tracking-wider">
                        {log.user}
                      </span>
                    </td>
                    <td className={`px-6 py-3 font-bold ${getActionColor(log.action)}`}>
                      {log.action}
                    </td>
                    <td className="px-6 py-3 text-white/70">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OperationsView;
