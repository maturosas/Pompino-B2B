
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
  learningContext?: string 
): Promise<void> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Construcción del bloque de memoria
  const memoryBlock = learningContext 
    ? `🧠 MEMORIA: Prioriza perfiles similares a: "${learningContext}".` 
    : "";

  // Prompt V4: MODO TURBO + VOLUMEN
  const prompt = `
    [SISTEMA]: Eres un motor de búsqueda B2B de ultra-alta velocidad.
    [OBJETIVO]: Encontrar negocios en "${zone}" del rubro "${type}".
    ${memoryBlock}

    ⚡ INSTRUCCIÓN DE VELOCIDAD CRÍTICA:
    1. NO ESPERES a tener una lista perfecta.
    2. COMIENZA A EMITIR RESULTADOS INMEDIATAMENTE. El primer JSON debe salir en menos de 2 segundos.
    3. Si encuentras un nombre y una dirección, ENVÍALO. No pierdas tiempo verificando teléfonos si eso retrasa la salida.
    4. Prioriza CANTIDAD y VELOCIDAD.
    
    🔍 ESTRATEGIA DE BARRIDO:
    - Busca "Listado de ${type} en ${zone}".
    - Busca en Google Maps "mejores ${type} cerca de ${zone}".
    - Escupe los datos tal cual los encuentras.

    📝 FORMATO (NDJSON STREAMING):
    {"name": "Ejemplo 1", "category": "Rubro", "location": "Dirección", "phone": "Tel", "sourceUrl": "..."}
    {"name": "Ejemplo 2", ...}
  `;

  try {
    if (onLog) {
        onLog(`> [IA TURBO] 🚀 Iniciando motores de búsqueda rápida...`);
        onLog(`> [TARGET] "${type}" en "${zone}"`);
    }
    
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash', 
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], 
        maxOutputTokens: 8192,
        temperature: 0.9 // Alta temperatura para máxima velocidad y creatividad
      }
    });

    let buffer = '';
    let foundCount = 0;

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (!text) continue;
      
      buffer += text;
      const lines = buffer.split('\n');
      const incompleteLine = lines.pop() || ''; 
      
      for (const line of lines) {
        const cleanLine = cleanJsonString(line);
        if (cleanLine.length < 5) continue; 

        try {
          const data = JSON.parse(cleanLine);
          
          if (data && data.name && data.name.length > 2) {
            const cleanPhone = data.phone ? data.phone.replace(/No detectado/i, '') : '';
            const lead: Lead = {
              ...data,
              id: `stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              status: 'frio',
              isClient: false,
              savedAt: Date.now(),
              whatsapp: cleanPhone.replace(/\D/g, ''),
              phone: cleanPhone || '---',
              location: data.location || zone,
              notes: data.notes || `Detectado por Turbo IA`,
              sourceUrl: data.sourceUrl || "Búsqueda Rápida"
            };
            
            onLeadFound(lead);
            foundCount++;
            
            if (onLog) onLog(`> [⚡ DETECTADO] ${lead.name}`);
          }
        } catch (e) {
          // Silent catch for stream fragments
        }
      }
      buffer = incompleteLine; 
    }

    // Remanente final
    if (buffer.trim()) {
      try {
        const data = JSON.parse(cleanJsonString(buffer));
        if (data && data.name) {
             const lead: Lead = {
              ...data,
              id: `stream-last-${Date.now()}`,
              status: 'frio',
              isClient: false,
              savedAt: Date.now(),
              whatsapp: data.phone ? data.phone.replace(/\D/g, '') : "",
              phone: data.phone || '---',
              notes: data.notes || "Resultado final",
              sourceUrl: data.sourceUrl
            };
            onLeadFound(lead);
            foundCount++;
            if (onLog) onLog(`> [⚡ DETECTADO] ${lead.name}`);
        }
      } catch (e) {}
    }

    if (onLog) {
        if (foundCount === 0) onLog(`> [FIN] Búsqueda finalizada sin resultados estructurados.`);
        else onLog(`> [FIN] Rastreo completado. ${foundCount} leads encontrados.`);
    }

  } catch (error: any) {
    console.error("Stream Error:", error);
    if (onLog) onLog(`> [ERROR] ${error.message}`);
  }
};
