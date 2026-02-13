
import { httpsCallable } from "firebase/functions";
import { Lead } from "../types";
import { functions } from './firebaseConfig';

const findAndEnrichLeads = httpsCallable(functions, 'findAndEnrichLeads');

// =================================================================================================
// MOTOR DE INTELIGENCIA UNIFICADO: HUNTER v2 (Server-Side)
// =================================================================================================
// Este motor realiza todo el proceso de búsqueda y enriquecimiento en el servidor para
// máxima fiabilidad. Envía la zona y el tipo de negocio a una Cloud Function, la cual
// utiliza un modelo de IA avanzado para encontrar y verificar los datos de contacto de
// nuevos prospectos en un solo paso. Esto elimina los errores causados por la
// "alucinación" de nombres de negocios que ocurría en el motor anterior.
// =================================================================================================
export const runIntelligenceSearch = async (
  zone: string,
  type: string,
  learningContext?: string
): Promise<Lead[]> => {
  try {
    const result = await findAndEnrichLeads({ zone, type, learningContext });
    const data = result.data as { success: boolean, leads?: Lead[], error?: string };

    if (!data.success || !data.leads) {
      throw new Error(data.error || "Respuesta inválida del motor de inteligencia.");
    }

    return data.leads;

  } catch (error: any) {
    console.error("Hunter v2 Engine (Cloud Function) Error:", error);
    
    // FIX: Prioritize the detailed error message sent from the Cloud Function's 'details' payload.
    // The client SDK often puts the generic code ('internal') in `error.message`.
    const errorMessage = error.details?.detail || error.message || 'Ocurrió un error desconocido.';
    
    // Re-throw a cleaner error for the UI
    throw new Error(`El motor de inteligencia falló: ${errorMessage}`);
  }
};