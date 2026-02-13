
import React from 'react';
import FirestoreIndexManager from './FirestoreIndexManager';

const AdminView: React.FC = () => {
  return (
    <div className="space-y-8 animate-in pb-10">
      <div className="border-b border-white/5 pb-4">
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">Panel de Administrador</h1>
        <p className="text-white/40 text-xs mt-1 uppercase tracking-widest">Configuración y Mantenimiento del Sistema</p>
      </div>
      <FirestoreIndexManager />
    </div>
  );
};

export default AdminView;