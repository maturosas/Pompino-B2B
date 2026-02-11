
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
  
  // Prompt RE-INGENIERIZADO para simular extracción de Google Maps y asegurar contacto.
  const prompt = `
    Eres un experto minero de datos y especialista en scraping de Google Maps / Google Business Profiles.

    TU MISIÓN:
    Encontrar negocios REALES del rubro "${type}" en la zona "${zone}" y extraer sus datos de contacto EXACTOS como si estuvieras leyendo su ficha de Google Maps.

    ESTRATEGIA DE BÚSQUEDA Y VINCULACIÓN (CRÍTICO):
    1.  **SIMULACIÓN DE MAPS**: Busca específicamente listados de negocios, fichas de Google Maps, directorios locales (Paginas Amarillas, Yelp, Tripadvisor) y perfiles sociales (Instagram/Facebook) donde aparezca el "Botón de llamar" o "Dirección".
    2.  **CONEXIÓN DE DATOS**: Tu prioridad #1 es vincular [NOMBRE DEL NEGOCIO] + [TELÉFONO]. 
        - Si encuentras un nombre sin teléfono en un resultado, búscalo inmediatamente en otra fuente (ej: su Instagram) para completar la fila.
        - NO devuelvas negocios sin ninguna forma de contacto o ubicación, son inútiles para B2B.
    3.  **VOLUMEN Y PRECISIÓN**:
        - Barre la zona "${zone}" calle por calle mentalmente.
        - Busca sinónimos del rubro: (Ej: Si es "Bar", busca también "Cervecería", "Pub", "Restobar", "Gastropub").

    FORMATO DE SALIDA (NDJSON ESTRICTO):
    - Genera un objeto JSON por línea.
    - NO uses markdown. NO uses comas al final de la línea.
    - Formato directo para streaming.

    SCHEMA JSON:
    {
      "name": "Nombre exacto del cartel/ficha",
      "category": "Rubro detectado",
      "location": "Dirección completa (Calle y Altura si es posible, o intersección)",
      "phone": "Teléfono/WhatsApp (Formato local o internacional)",
      "email": "Email (si está visible en web/social)",
      "notes": "Dato extra (ej: 'Abierto ahora', 'Tiene Instagram', 'Rating 4.5')"
    }

    EJEMPLO DE RAZONAMIENTO:
    "Encontré 'El Bar de Moe'. En los resultados veo su ficha de Maps. La dirección es Av. Siempreviva 742. El teléfono listado es 555-1234. Genero JSON."

    IMPORTANTE:
    - Extrae TODOS los resultados posibles (+30 si existen).
    - Prioriza celulares (móviles) sobre fijos si es posible, ya que sirven para WhatsApp.
  `;

  try {
    if (onLog) onLog(`> INICIANDO EXTRACTOR DE MAPS & PERFILES (Target: ${type} en ${zone})...`);
    
    // Usamos Flash para velocidad máxima, aumentando tokens para permitir listas largas
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash', 
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], // Grounding activo es vital para esto
        maxOutputTokens: 8192
      }
    });

    let buffer = '';
    let foundCount = 0;

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (!text) continue;
      
      buffer += text;

      // Intentar procesar el buffer buscando objetos JSON completos
      const lines = buffer.split('\n');
      const incompleteLine = lines.pop() || ''; 
      
      for (const line of lines) {
        const cleanLine = cleanJsonString(line);
        if (cleanLine.length < 5) continue; 

        try {
          const data = JSON.parse(cleanLine);
          
          // Validación más estricta: Solo guardar si tiene Nombre y (Teléfono o Ubicación)
          if (data && data.name && (data.phone || data.location)) {
            const lead: Lead = {
              ...data,
              id: `stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              status: 'frio',
              isClient: false,
              savedAt: Date.now(),
              whatsapp: data.whatsapp || (data.phone ? data.phone.replace(/\D/g, '') : ""),
              notes: data.notes || `Detectado en zona ${zone}`
            };
            
            onLeadFound(lead);
            foundCount++;
            if (foundCount % 3 === 0 && onLog) onLog(`> ${foundCount} fichas recuperadas...`);
          }
        } catch (e) {
          // Ignorar líneas JSON incompletas o malformadas
        }
      }
      
      buffer = incompleteLine; 
    }

    // Procesar el remanente
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
              notes: data.notes || `Detectado en zona ${zone}`
            };
            onLeadFound(lead);
            foundCount++;
        }
      } catch (e) {}
    }

    if (onLog) onLog(`> ESCANEO COMPLETO. ${foundCount} negocios listados.`);

  } catch (error: any) {
    console.error("Stream Error:", error);
    if (onLog) onLog(`> ERROR DE CONEXIÓN: ${error.message}`);
    
    if (error.status === 429 || error.message?.includes('quota')) {
        if (onLog) onLog(`> ALERTA: Tráfico alto en API. Reintentando...`);
        throw new Error("Quota Exceeded");
    }
  }
};
