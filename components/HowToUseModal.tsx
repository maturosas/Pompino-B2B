
import React, { useState } from 'react';

interface HowToUseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HelpItem {
  id: string;
  icon: string;
  title: string;
  shortDesc: string;
  fullDesc: string;
}

const HowToUseModal: React.FC<HowToUseModalProps> = ({ isOpen, onClose }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const helpItems: HelpItem[] = [
    {
      id: 'stats',
      icon: '📊',
      title: 'Panel de Estadísticas (KPIs)',
      shortDesc: 'Medición de rendimiento del negocio.',
      fullDesc: 'Nueva sección "Stats". Visualiza gráficos automáticos sobre la cantidad total de prospectos, clientes ganados y tasa de conversión. También puedes comparar el rendimiento de cada vendedor (Leads vs Clientes) para fomentar la competitividad sana en el equipo.'
    },
    {
      id: 'search',
      icon: '🔭',
      title: 'Buscador de Inteligencia (Scraping)',
      shortDesc: 'Cómo encontrar nuevos prospectos automáticamente.',
      fullDesc: 'Ingresa una "Zona" (ej: Palermo) y un "Rubro" (ej: Bares). La IA escaneara Google Maps y redes sociales en tiempo real. Importante: Los resultados son temporales, debes dar clic en "GUARDAR" para pasarlos a tu CRM, de lo contrario se perderán al salir.'
    },
    {
      id: 'agenda',
      icon: '📅',
      title: 'Agenda de Tareas Unificada',
      shortDesc: 'Dónde ver mis compromisos del día.',
      fullDesc: 'Usa la pestaña "Agenda" en el menú lateral. Aquí verás TODO lo que requiere tu atención inmediata: 1) Solicitudes Directas enviadas por tus compañeros (Prioridad Alta) y 2) Clientes de tu CRM con acciones programadas para hoy o vencidas. Puedes re-agendar o completar tareas desde aquí.'
    },
    {
      id: 'crm_status',
      icon: '🗂️',
      title: 'Gestión de Estados (CRM)',
      shortDesc: 'Mover leads por el embudo de ventas.',
      fullDesc: 'Cada lead tiene un estado: FRIO (Nuevo), CONTACTADO (Ya hablaste), NEGOCIACIÓN (Hay interés) y CLIENTE (Venta cerrada). Puedes cambiar el estado desde la lista o la ficha detallada. Al cambiar de estado, el lead se mueve automáticamente a la carpeta correspondiente en el menú lateral.'
    },
    {
      id: 'tasks',
      icon: '📢',
      title: 'Asignar Tareas a Compañeros',
      shortDesc: 'Enviar recordatorios directos al equipo.',
      fullDesc: 'Usa el botón "ASIGNAR TAREA" en el menú lateral. Selecciona un compañero (ej: Diego) y escribe el mensaje. A él le aparecerá una alerta roja en su pestaña "Agenda".'
    },
    {
      id: 'transfer',
      icon: ' arrows_exchange',
      title: 'Transferencia de Leads',
      shortDesc: 'Cómo pasar un cliente a otro vendedor.',
      fullDesc: 'Si intentas guardar o editar un lead que pertenece a otro usuario, el sistema te bloqueará. Debes usar el botón de "Solicitar Transferencia" (ícono de flechas). El dueño actual recibirá una notificación en su CRM para Aceptar o Rechazar el traspaso.'
    },
    {
      id: 'chat',
      icon: '💬',
      title: 'Sala de Situación (Chat)',
      shortDesc: 'Comunicación interna encriptada.',
      fullDesc: 'Un chat en tiempo real para todo el equipo. Úsalo para novedades generales. Si hay mensajes nuevos y no estás en la pestaña de chat, aparecerá un globo rojo de notificación en el menú lateral.'
    },
    {
      id: 'import',
      icon: '📥',
      title: 'Importación Masiva',
      shortDesc: 'Cargar bases de datos desde Excel/CSV.',
      fullDesc: 'En la pestaña CRM, usa el botón "IMPORTAR". Descarga la plantilla de Google Sheets provista, llena los datos (respetando las columnas) y sube el archivo CSV. Puedes asignar todos esos leads a ti mismo o a un compañero durante la importación.'
    },
    {
      id: 'ops',
      icon: '☁️',
      title: 'Nube y Backups',
      shortDesc: 'Cómo funcionan los datos y el guardado.',
      fullDesc: 'El sistema trabaja sincronizado con la Nube (Firebase). Todo lo que haces se guarda al instante para todos. En la pestaña "Operaciones" puedes ver el historial de actividad y descargar un Backup de seguridad.'
    }
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl w-full max-w-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none"></div>

        {/* Header */}
        <div className="flex justify-between items-start mb-6 relative z-10 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Manual Operativo</h2>
            <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Documentación Oficial v1.1</p>
          </div>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-colors rounded-xl hover:bg-white/5">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Accordion List */}
        <div className="space-y-3 relative z-10 overflow-y-auto custom-scroll pr-2 flex-1">
            {helpItems.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <div 
                  key={item.id} 
                  onClick={() => toggleExpand(item.id)}
                  className={`border rounded-xl transition-all duration-300 cursor-pointer overflow-hidden ${isExpanded ? 'bg-white/10 border-indigo-500/50' : 'bg-white/5 border-white/5 hover:bg-white/[0.07]'}`}
                >
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 transition-colors ${isExpanded ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white/5 text-white/50'}`}>
                        {item.icon}
                      </div>
                      <div>
                        <h3 className={`text-sm font-black uppercase tracking-wide transition-colors ${isExpanded ? 'text-white' : 'text-white/80'}`}>
                          {item.title}
                        </h3>
                        <p className="text-[11px] text-white/50 leading-tight mt-0.5">
                          {item.shortDesc}
                        </p>
                      </div>
                    </div>
                    <div className={`transform transition-transform duration-300 text-white/30 ${isExpanded ? 'rotate-180 text-indigo-400' : ''}`}>
                      ▼
                    </div>
                  </div>
                  
                  {/* Expanded Content */}
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="p-4 pt-0 text-xs text-indigo-100/80 leading-relaxed border-t border-white/5 bg-black/20 font-medium">
                      <div className="pt-3">
                         {item.fullDesc}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
        
        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end shrink-0">
            <button onClick={onClose} className="px-6 py-2.5 bg-white text-black text-xs font-black uppercase rounded-xl hover:bg-indigo-50 hover:text-indigo-900 transition-all shadow-lg tracking-wide">
                Cerrar Manual
            </button>
        </div>
      </div>
    </div>
  );
};

export default HowToUseModal;