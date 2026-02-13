
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import { IntelligenceTool } from './components/IntelligenceTool';
import CRMView from './components/CRMView';
import OperationsView from './components/OperationsView';
import AgendaView from './components/AgendaView';
import StatsView from './components/StatsView';
import DashboardView from './components/DashboardView';
import AdminView from './components/AdminView';
import { PompinoLogo } from './components/PompinoLogo';
import HowToUseModal from './components/HowToUseModal';
import ReportIssueModal from './components/ReportIssueModal';
import ActionCenter from './components/ActionCenter';
import AddLeadModal from './components/AddLeadModal';
import { getUserNames, isUserAdmin, PROJECT_CONFIG } from './projectConfig';
import { isConfigured } from './services/firebaseConfig';

// Zustand Stores
import { useAuthStore } from './stores/useAuthStore';
import { useAppStore } from './stores/useAppStore';
import { useDataStore } from './stores/useDataStore';

const App: React.FC = () => {
  const { currentUser, selectUser, initializeAuth } = useAuthStore();
  const { 
    activeTab, 
    showHelp, 
    setShowHelp,
    showReport, 
    setShowReport,
    showActionCenter, 
    showTaskCreator,
    setShowTaskCreator,
  } = useAppStore();
  
  const { 
    connectionState, 
    dbError, 
    initialize,
    createDirectTask,
  } = useDataStore();

  const [newTaskTarget, setNewTaskTarget] = useState<string>('');
  const [newTaskMessage, setNewTaskMessage] = useState('');
  const userList = getUserNames();

  useEffect(() => {
    // Check for an active session when the app first loads.
    initializeAuth();
    // Set document title from project config
    document.title = `${PROJECT_CONFIG.appName} - ${PROJECT_CONFIG.appSubtitle}`;
  }, [initializeAuth]);


  const handleCreateTask = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUser || !newTaskMessage.trim() || !newTaskTarget) return;
      await createDirectTask(newTaskTarget, newTaskMessage);
      setShowTaskCreator(false);
      setNewTaskMessage('');
      setNewTaskTarget('');
  };

  if (connectionState !== 'ok' || !isConfigured) {
      const errorMessages = {
        missing_db: { icon: '🛑', title: 'BASE DE DATOS INEXISTENTE', desc: 'El proyecto existe pero la base de datos Firestore NO ha sido creada aún.' },
        permission_denied: { icon: '🔐', title: 'ACCESO DENEGADO', desc: 'Reglas de Seguridad bloqueando la conexión.' },
        not_configured: { icon: '⚙️', title: 'CONFIGURACIÓN REQUERIDA', desc: 'Reemplaza las claves de Firebase en /services/firebaseConfig.ts' }
      };
      const errorKey = !isConfigured ? 'not_configured' : connectionState;
      const errorInfo = errorMessages[errorKey as keyof typeof errorMessages] || { icon: '?', title: 'Error', desc: dbError };

      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 font-sans">
          <div className="max-w-2xl w-full bg-[#111] border border-red-500/20 rounded-3xl p-8 shadow-2xl">
            <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4 flex items-center gap-3">
              <span className="text-4xl">{errorInfo.icon}</span> {errorInfo.title}
            </h1>
            
            { !isConfigured ? (
              <div className="text-white/80 text-sm space-y-4">
                <p>
                  Esta es una medida de seguridad. Para proteger tus datos, la aplicación necesita conectarse a <strong>tu propia base de datos privada en la nube.</strong>
                </p>
                <p>
                  El proceso es simple y solo se hace una vez:
                </p>
                <ol className="list-decimal list-inside space-y-2 pl-2 font-mono text-xs bg-black/50 p-4 rounded-xl border border-white/10">
                  <li>Ve a la <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline hover:text-indigo-300">Consola de Firebase</a> y crea un nuevo proyecto.</li>
                  <li>Dentro del proyecto, crea una <strong>Aplicación Web</strong> (busca el ícono <code>&lt;/&gt;</code>).</li>
                  <li>Copia el objeto de configuración `firebaseConfig` que te proporcionará Firebase.</li>
                  <li>Pega ese objeto en el archivo: <code className="bg-white/10 px-1.5 py-0.5 rounded text-white">services/firebaseConfig.ts</code></li>
                </ol>
                <p className="text-xs text-white/40 pt-2">
                  Una vez que guardes el archivo con tus claves, esta pantalla desaparecerá y la aplicación se iniciará.
                </p>
              </div>
            ) : (
              <>
                <p className="text-white text-sm mb-6">{errorInfo.desc}</p>
                <button onClick={() => initialize()} className="px-8 py-4 bg-white text-black font-black uppercase text-sm rounded-xl">Reintentar</button>
              </>
            )}
          </div>
        </div>
      );
  }

  if (!currentUser) {
    return (
      <div className="h-[100dvh] bg-[#050505] flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
        <HowToUseModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
        <div className="max-w-sm w-full flex flex-col items-center gap-6 relative z-10 animate-in fade-in zoom-in-95 duration-500">
          <PompinoLogo className="w-[420px] h-[420px] text-white" animate={true} />
          {dbError && (<div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl w-full"><p className="text-red-400 text-xs font-black uppercase mb-1">⚠️ Error</p><p className="text-white/70 text-[10px]">{dbError}</p></div>)}
          <div className="w-full space-y-3">
             <p className="text-white/30 text-[10px] font-bold tracking-[0.2em] mb-4 uppercase text-center">Seleccionar Perfil</p>
             <div className="grid gap-2 w-full max-h-[40vh] overflow-y-auto custom-scroll pr-1">
               {userList.map((user) => (<button key={user} onClick={() => selectUser(user)} className="h-12 w-full border border-white/10 rounded-xl hover:bg-white hover:text-black transition-all group bg-white/5"><span className="text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">{user}{isUserAdmin(user) && (<span className="text-[8px] bg-white/10 px-1.5 py-0.5 rounded text-white/60 group-hover:text-black/60">ADMIN</span>)}</span></button>))}
             </div>
             <button onClick={() => setShowHelp(true)} className="text-[9px] text-white/20 hover:text-white font-bold uppercase tracking-widest mt-6 transition-colors block mx-auto">¿Cómo funciona?</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-[#050505]">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full relative z-0 transition-all duration-300 lg:pl-72 overflow-x-hidden">
        <div className="bg-white/5 border-b border-white/10 px-4 py-2 text-center"><p className="text-white/40 text-[10px] md:text-xs font-bold uppercase tracking-widest">Modo Producción - BZS v1.1 (Live Sync)</p></div>
        <div className="lg:hidden p-4 flex items-center justify-between border-b border-white/5 bg-[#050505]">
            <div className="w-32 h-32 flex items-center justify-center"><PompinoLogo variant="full" className="w-full h-full text-white" /></div>
            <button onClick={() => useAppStore.getState().setIsSidebarOpen(true)} className="p-2 text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg></button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scroll p-4 md:p-8 relative">
            <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none fixed"></div>
            <div className="relative z-10 max-w-7xl mx-auto w-full pb-20">
                {showActionCenter && <ActionCenter />}
                {activeTab === 'home' && <DashboardView />}
                {activeTab === 'intelligence' && <IntelligenceTool />}
                {activeTab === 'crm' && <CRMView />}
                {activeTab === 'operations' && <OperationsView />}
                {activeTab === 'agenda' && <AgendaView />}
                {activeTab === 'stats' && <StatsView />}
                {activeTab === 'indices' && <AdminView />}
            </div>
        </div>
      </main>

      {showTaskCreator && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl">
                  <h3 className="text-lg font-black text-white uppercase italic tracking-tighter mb-4">Asignar Tarea</h3>
                  <form onSubmit={handleCreateTask} className="space-y-4">
                      <div>
                          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 block">Destinatario</label>
                          <div className="grid grid-cols-2 gap-2">{userList.filter(u => u !== currentUser).map(u => (<button key={u} type="button" onClick={() => setNewTaskTarget(u)} className={`h-10 rounded-xl text-xs font-bold uppercase transition-all ${newTaskTarget === u ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>{u}</button>))}</div>
                      </div>
                      <div>
                           <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 block">Mensaje</label>
                           <textarea value={newTaskMessage} onChange={(e) => setNewTaskMessage(e.target.value)} placeholder="Ej: Llamar urgente a..." className="w-full h-24 bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white" />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                          <button type="button" onClick={() => setShowTaskCreator(false)} className="px-4 py-2 text-xs font-bold text-white/40 hover:text-white uppercase">Cancelar</button>
                          <button type="submit" disabled={!newTaskTarget || !newTaskMessage} className="px-6 py-2 bg-white disabled:opacity-50 text-black text-xs font-black uppercase rounded-xl">Enviar</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      <ReportIssueModal isOpen={showReport} onClose={() => setShowReport(false)} currentUser={currentUser} />
      <HowToUseModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      <AddLeadModal />
    </div>
  );
};

export default App;