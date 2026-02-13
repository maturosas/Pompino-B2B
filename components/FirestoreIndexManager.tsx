
import React from 'react';

const projectId = 'pompino-b2b'; // From firebaseConfig

interface IndexField {
  name: string;
  mode: 'ASCENDING' | 'DESCENDING' | 'ARRAY_CONTAINS';
}

interface IndexDefinition {
  name: string;
  description: string;
  fields: IndexField[];
}

const createIndexUrl = (fields: IndexField[]): string => {
  const fieldsQuery = fields.map(f => `${f.name}_${f.mode}`).join(',');
  return `https://console.firebase.google.com/project/${projectId}/firestore/indexes/composite/create?collectionId=leads&fields=${fieldsQuery}`;
};

const requiredIndexes: IndexDefinition[] = [
  {
    name: 'Vendedor + Estado (por Fecha)',
    description: 'Permite a cada vendedor ver sus leads, filtrados por estado y ordenados por fecha de creación.',
    fields: [
      { name: 'owner', mode: 'ASCENDING' },
      { name: 'status', mode: 'ASCENDING' },
      { name: 'savedAt', mode: 'DESCENDING' },
    ],
  },
  {
    name: 'Vendedor + Estado (por Próxima Acción)',
    description: 'Permite a cada vendedor ver sus leads, filtrados por estado y ordenados por fecha de próxima acción.',
    fields: [
      { name: 'owner', mode: 'ASCENDING' },
      { name: 'status', mode: 'ASCENDING' },
      { name: 'nextActionDate', mode: 'DESCENDING' },
    ],
  },
    {
    name: 'Estado General (por Fecha Creación)',
    description: 'Permite ver todos los leads de un estado específico (ej: "Clientes") ordenados por fecha de creación.',
    fields: [
      { name: 'status', mode: 'ASCENDING' },
      { name: 'savedAt', mode: 'DESCENDING' },
    ],
  },
  {
    name: 'Estado General (por Próxima Acción)',
    description: 'Permite ver todos los leads de un estado específico ordenados por su próxima acción programada.',
    fields: [
      { name: 'status', mode: 'ASCENDING' },
      { name: 'nextActionDate', mode: 'DESCENDING' },
    ],
  },
  {
    name: 'Vendedor + Etiqueta (por Fecha)',
    description: 'Esencial para buscar leads con una etiqueta específica dentro de la cartera de un vendedor.',
    fields: [
      { name: 'owner', mode: 'ASCENDING' },
      { name: 'tags', mode: 'ARRAY_CONTAINS' },
      { name: 'savedAt', mode: 'DESCENDING' },
    ],
  },
  {
    name: 'Estado + Fecha de Contacto (General)',
    description: 'Permite filtrar leads por estado (ej: Clientes) dentro de un rango de fechas, para todos los vendedores.',
    fields: [
      { name: 'status', mode: 'ASCENDING' },
      { name: 'lastContactDate', mode: 'DESCENDING' },
      { name: 'savedAt', mode: 'DESCENDING' },
    ],
  }
];


const FirestoreIndexManager: React.FC = () => {
  return (
    <div className="mt-8">
      <h2 className="text-lg font-black uppercase tracking-tighter text-white mb-4 pl-2">Gestor de Índices de Base de Datos</h2>
      <div className="bg-[#050505] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
          <p className="text-xs text-white/50 leading-relaxed">
              Firestore necesita "índices compuestos" para realizar consultas complejas, como filtrar por un vendedor y luego ordenar por fecha. Sin estos índices, la aplicación mostrará un error y no podrá cargar los datos.
              <br/>
              A continuación se listan los índices recomendados para el óptimo funcionamiento del CRM. Haz clic en cada uno para crearlo en tu panel de Firebase. 
              <strong className="text-white/70"> La creación puede tardar unos minutos en completarse.</strong>
          </p>
          <div className="space-y-3 pt-4">
              {requiredIndexes.map((index, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="min-w-0">
                          <p className="font-bold text-white text-sm truncate">{index.name}</p>
                          <p className="text-white/40 text-[11px] truncate pr-4">{index.description}</p>
                      </div>
                      <a 
                          href={createIndexUrl(index.fields)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black uppercase rounded-lg transition-colors shrink-0 shadow-lg"
                      >
                          Crear Índice (1-Clic)
                      </a>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};

export default FirestoreIndexManager;