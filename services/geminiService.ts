
import { GoogleGenAI } from "@google/genai";
import { Lead } from "../types";
import { PROJECT_CONFIG } from "../projectConfig";

// Helper para limpiar JSON corrupto del stream
const cleanJsonString = (str: string) => {
  return str.replace(/```json/g, '').replace(/```/g, '').trim();
};

export const scrapeLeads = async (
  zone: string, 
  type: string, 
  onLeadFound: (lead: Lead) => void,
  onLog?: (msg: string) => void,
  learningContext?: string // Nuevo parámetro opcional
): Promise<void> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Construcción del bloque de memoria
  const memoryBlock = learningContext 
    ? `
    🧠 MEMORIA DE ÉXITO (AI LEARNING):
    El usuario ya tiene clientes/prospectos exitosos con este perfil: "${learningContext}".
    -> USA ESTO PARA FILTRAR: Prioriza negocios que se parezcan a este perfil histórico.
    ` 
    : "";

  // Prompt RE-INGENIERIZADO para búsqueda Híbrida (Rubro o Entidad)
  const prompt = `
    Eres un experto minero de datos y especialista en scraping de Google Maps / Google Business Profiles.
    
    CONTEXTO GEOGRÁFICO INTELIGENTE:
    El usuario ha definido la zona de búsqueda como: "${zone}" en el país "${PROJECT_CONFIG.country}".
    
    INPUT DEL USUARIO (OBJETIVO): "${type}"
    ${memoryBlock}

    ⚠️ ANÁLISIS DEL OBJETIVO:
    El input del usuario ("${type}") puede ser dos cosas:
    A) UNA CATEGORÍA/RUBRO (ej: "Bares", "Restaurantes Italianos", "Vinotecas").
    B) UNA ENTIDAD/MARCA ESPECÍFICA (ej: "BZS", "El Club de la Milanesa", "Starbucks", "Tienda de bebidas BZS").

    TU MISIÓN:
    1.  Detecta si es caso A o B.
    2.  SI ES UN NOMBRE ESPECÍFICO (Caso B): Busca ese negocio EXACTO en la zona indicada. Si es una cadena, trae la sucursal de esa zona.
    3.  SI ES UN RUBRO (Caso A): Busca variedad de negocios de ese tipo en la zona.
    4.  Si el usuario escribió la zona con errores (ej: "Lanus"), corrígela internamente a "Lanús".

    ESTRATEGIA DE EXTRACCIÓN:
    - **SIMULACIÓN DE MAPS**: Busca específicamente fichas de Google Maps.
    - **DATOS EXACTOS**: Tu prioridad es vincular [NOMBRE DEL NEGOCIO] + [DIRECCIÓN EXACTA EN LA ZONA] + [TELÉFONO].
    - **GEO-REFERENCIA**: Intenta obtener coordenadas (lat/lng).

    FORMATO DE SALIDA (NDJSON ESTRICTO):
    - Genera un objeto JSON por línea.
    - NO uses markdown. NO uses comas al final de la línea.
    - Formato directo para streaming.

    SCHEMA JSON:
    {
      "name": "Nombre exacto del cartel/ficha",
      "category": "Rubro detectado",
      "location": "Dirección completa (Calle, Altura, Barrio/Ciudad)",
      "phone": "Teléfono/WhatsApp (Formato local o internacional)",
      "email": "Email (IMPORTANTE: Buscar info@, ventas@, etc. Dejar vacío si no existe)",
      "coordinates": { "lat": number, "lng": number },
      "notes": "Dato extra (ej: 'Abierto ahora', 'Rating 4.5', 'Instagram: @usuario')"
    }

    EJEMPLO DE RAZONAMIENTO:
    "Input Objetivo: 'BZS'. Zona: 'Palermo'. Detecto que BZS es una marca específica. Busco 'BZS' en Palermo. Encontré 'BZS Tienda de Bebidas'. Dirección: Honduras 1234. Extraigo datos. Genero JSON."

    IMPORTANTE:
    - Si es una búsqueda específica, asegúrate de encontrar el local en la zona solicitada, no la casa matriz.
    - Si es rubro, trae +20 resultados si es posible.
  `;

  try {
    if (onLog) {
        onLog(`> [SYSTEM] Iniciando protocolo de búsqueda híbrida...`);
        onLog(`> [TARGET] Objetivo: ${type} | Zona: ${zone}`);
        if (learningContext) onLog(`> [AI-CORE] Contexto histórico cargado.`);
        onLog(`> [NET] Conectando con Google Knowledge Graph...`);
    }
    
    // Usamos Flash para velocidad máxima
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
    let firstChunk = true;

    for await (const chunk of responseStream) {
      if (firstChunk && onLog) {
          onLog(`> [NET] Conexión establecida. Analizando entidades...`);
          firstChunk = false;
      }
      
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
              notes: data.notes || `Detectado en zona ${zone}`,
              coordinates: data.coordinates || undefined
            };
            
            onLeadFound(lead);
            foundCount++;
            if (foundCount % 5 === 0 && onLog) onLog(`> [PARSER] ${foundCount} entidades procesadas...`);
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
              notes: data.notes || `Detectado en zona ${zone}`,
              coordinates: data.coordinates || undefined
            };
            onLeadFound(lead);
            foundCount++;
        }
      } catch (e) {}
    }

    if (onLog) {
        onLog(`> [COMPLETE] Búsqueda finalizada.`);
        onLog(`> [STATS] Total activos recuperados: ${foundCount}`);
    }

  } catch (error: any) {
    console.error("Stream Error:", error);
    if (onLog) onLog(`> [CRITICAL ERROR] ${error.message}`);
    
    if (error.status === 429 || error.message?.includes('quota')) {
        if (onLog) onLog(`> [RETRY] Alerta de tráfico API. Reintentando estrategia...`);
        throw new Error("Quota Exceeded");
    }
  }
};