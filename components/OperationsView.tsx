
import React from 'react';
import { OperationLog } from '../types';

interface OperationsViewProps {
  logs: OperationLog[];
}

const OperationsView: React.FC<OperationsViewProps> = ({ logs }) => {
  const getActionColor = (action: string) => {
    switch (action) {
      case 'SEARCH': return 'text-blue-400';
      case 'CREATE': return 'text-green-400';
      case 'UPDATE': return 'text-yellow-400';
      case 'STATUS_CHANGE': return 'text-purple-400';
      case 'DELETE': return 'text-red-400';
      default: return 'text-white';
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <h2 className="text-xl font-black italic uppercase tracking-tighter text-white/90">
            Centro de Operaciones <span className="text-white/30 text-sm not-italic font-bold ml-2">Audit Trail</span>
        </h2>
      </div>

      <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0a0a0a] shadow-xl">
        {/* Mobile View: Simple List */}
        <div className="md:hidden">
            <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-2 space-y-2">
                {logs.length === 0 ? (
                    <div className="text-center text-white/20 py-10 text-xs">Sin registros</div>
                ) : (
                    logs.map(log => (
                        <div key={log.id} className="bg-black border border-white/5 rounded-lg p-3 text-xs">
                             <div className="flex justify-between items-start mb-2">
                                <span className={`font-bold ${getActionColor(log.action)}`}>{log.action}</span>
                                <span className="text-white/30 text-[9px]">{new Date(log.timestamp).toLocaleString()}</span>
                             </div>
                             <p className="text-white/80 mb-2 leading-tight">{log.details}</p>
                             <div className="flex items-center gap-1">
                                <span className="text-[9px] text-white/40 uppercase">Operador:</span>
                                <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-white">{log.user}</span>
                             </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto custom-scroll h-[calc(100vh-200px)]">
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
                <tr><td colSpan={4} className="px-6 py-12 text-center text-white/10 font-black uppercase tracking-[0.5em]">Sin registros de actividad</td></tr>
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
