
import { GoogleGenAI } from "@google/genai";
import { Lead } from "../types";

const getUserCoordinates = (): Promise<{ latitude: number; longitude: number } | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    const timeout = setTimeout(() => resolve(null), 5000);
    navigator.geolocation.getCurrentPosition(
      (pos) => { clearTimeout(timeout); resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }); },
      () => { clearTimeout(timeout); resolve(null); },
      { timeout: 5000 }
    );
  });
};

// Helper para limpiar JSON corrupto del stream
const cleanJsonString = (str: string) => {
  return str.replace(/```json/g, '').replace(/```/g, '').trim();
};

export const scrapeLeads = async (
  zone: string, 
  type: string, 
  onLeadFound: (lead: Lead) => void,
  onLog?: (msg: string) => void
): Promise<void> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Prompt optimizado con expansión semántica (sinónimos) y razonamiento geográfico
  const prompt = `
    Actúa como un Agente de Inteligencia Comercial B2B experto en scraping y búsqueda de datos.

    OBJETIVO: Identificar y extraer datos de clientes potenciales del rubro "${type}" ubicados en la zona de "${zone}".

    PROTOCOLOS DE BÚSQUEDA (IMPORTANTE):
    1. EXPANSIÓN SEMÁNTICA Y DE RUBRO:
       - NO busques solo la palabra exacta "${type}".
       - BUSCA ACTIVAMENTE: Sinónimos, variaciones (plurales/diminutivos), y categorías relacionadas del mismo ecosistema.
       - EJEMPLO: Si el usuario pide "Bar", busca también: "Pubs", "Cervecerías", "Resto-bares", "Cantinas", "Tap Rooms", "Boliches", "Vinotecas".
       - EJEMPLO: Si pide "Kiosco", busca "Drugstore", "Polirrubro", "Almacén", "Maxikiosco".

    2. INTELIGENCIA GEOGRÁFICA:
       - Cubre exhaustivamente la zona "${zone}".
       - Si la zona es un barrio, considera calles principales y zonas comerciales aledañas dentro del mismo radio urbano.

    INSTRUCCIONES DE SALIDA (STREAMING NDJSON):
    - Genera resultados uno por uno en cuanto los encuentres.
    - Formato: NDJSON (Newline Delimited JSON). Un objeto JSON válido por línea.
    - SIN comas al final de línea. SIN bloques markdown (\`\`\`json).
    - SIN texto introductorio.

    SCHEMA JSON REQUERIDO:
    {
      "name": "Nombre Comercial Exacto",
      "category": "Categoría específica detectada (Ej: 'Cervecería' en lugar de 'Bar')",
      "phone": "Teléfono de contacto (prioridad)",
      "email": "Email público (si existe)",
      "location": "Dirección normalizada",
      "whatsapp": "Solo números (opcional)"
    }

    PRIORIDADES:
    - Negocios activos actualmente.
    - Datos de contacto (Teléfono/WhatsApp son vitales).
  `;

  try {
    if (onLog) onLog(`> INICIANDO MOTOR SEMÁNTICO (Búsqueda expandida para "${type}")...`);
    
    // Usamos Flash para velocidad máxima, o Pro si requerimos razonamiento complejo. 
    // Flash es mucho más rápido para devolver el primer byte.
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash', 
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }] // Grounding activo
      }
    });

    let buffer = '';
    let foundCount = 0;

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (!text) continue;
      
      buffer += text;

      // Intentar procesar el buffer buscando objetos JSON completos
      // Buscamos patrones que parezcan líneas JSON completas o bloques cerrados
      const lines = buffer.split('\n');
      
      // Procesamos todas las líneas excepto la última (que podría estar incompleta)
      // A menos que el stream haya terminado, pero aquí estamos en el loop.
      const incompleteLine = lines.pop() || ''; 
      
      for (const line of lines) {
        const cleanLine = cleanJsonString(line);
        if (cleanLine.length < 5) continue; // Ignorar líneas vacías o ruido

        try {
          // Intentar parsear la línea
          const data = JSON.parse(cleanLine);
          
          if (data && data.name) {
            const lead: Lead = {
              ...data,
              id: `stream-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              status: 'frio',
              isClient: false,
              savedAt: Date.now(),
              whatsapp: data.whatsapp || (data.phone ? data.phone.replace(/\D/g, '') : ""),
              notes: `Capturado vía Smart Search (${data.category || type})`
            };
            
            onLeadFound(lead);
            foundCount++;
            if (foundCount % 3 === 0 && onLog) onLog(`> ${foundCount} leads identificados...`);
          }
        } catch (e) {
          // Si falla el parseo, puede ser que la línea no sea JSON puro todavía.
          // En un escenario NDJSON estricto esto no debería pasar mucho si el modelo obedece.
          // Ignoramos el error silenciosamente para no detener el flujo.
        }
      }
      
      buffer = incompleteLine; // Guardamos lo que sobró para el siguiente chunk
    }

    // Procesar el remanente del buffer al final
    if (buffer.trim()) {
      try {
        const cleanLine = cleanJsonString(buffer);
        const data = JSON.parse(cleanLine);
        if (data && data.name) {
             const lead: Lead = {
              ...data,
              id: `stream-last-${Date.now()}`,
              status: 'frio',
              isClient: false,
              savedAt: Date.now(),
              whatsapp: data.whatsapp || (data.phone ? data.phone.replace(/\D/g, '') : ""),
              notes: `Capturado vía Smart Search (${data.category || type})`
            };
            onLeadFound(lead);
        }
      } catch (e) {}
    }

    if (onLog) onLog(`> BÚSQUEDA FINALIZADA. Total: ${foundCount} resultados.`);

  } catch (error: any) {
    console.error("Stream Error:", error);
    if (onLog) onLog(`> ERROR DE STREAM: ${error.message}`);
    
    // Manejo de cuota simple
    if (error.status === 429 || error.message?.includes('quota')) {
        if (onLog) onLog(`> CUOTA EXCEDIDA. Reintentando en modo lento...`);
        throw new Error("Quota Exceeded");
    }
  }
};
