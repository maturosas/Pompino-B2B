
import { GoogleGenAI } from "@google/genai";
import { Lead } from "../types";
import { PROJECT_CONFIG } from "../projectConfig";

export const scrapeLeads = async (
  zone: string, 
  type: string, 
  onLeadFound: (lead: Lead) => void,
  onLog?: (msg: string) => void,
  learningContext?: string 
): Promise<void> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const memoryBlock = learningContext 
    ? `🧠 CONTEXTO PREVIO: El usuario ha tenido éxito con: "${learningContext}". Úsalo para priorizar resultados similares.` 
    : "";

  // Prompt V6: PROFESSIONAL BATCH EXTRACTION
  const prompt = `
    [ROL]: Eres un Analista de Inteligencia de Mercado de Élite. Tu especialidad es encontrar leads B2B de alta calidad en tiempo récord.
    [MISIÓN]: Realizar un rastreo profundo y masivo de "${type}" en la zona "${zone}".
    ${memoryBlock}

    [OBJETIVO]:
    Generar un listado de MÍNIMO 15 a 20 PERFILES comerciales únicos y relevantes. Prioriza negocios operativos, con presencia digital o física verificable.

    ⚠️ PROTOCOLO DE SALIDA ESTRICTO (JSON L):
    1. NO escribas texto introductorio. NI UNA PALABRA.
    2. TU SALIDA DEBE SER EXCLUSIVAMENTE LÍNEAS DE JSON VÁLIDO.
    3. CADA LÍNEA es un objeto Lead independiente.
    4. SINTAXIS: {"name":"...","category":"...","location":"...","phone":"...","sourceUrl":"..."}
    5. TELÉFONOS: Haz un esfuerzo máximo por inferir o encontrar números (móvil o fijo). Si es absolutamente imposible, pon "No detectado".
    6. CLASIFICACIÓN: En 'category' sé específico (ej: "Vinoteca Boutique" es mejor que "Comercio").

    ¡EJECUTA EL RASTREO MASIVO AHORA!
  `;

  try {
    if (onLog) {
        onLog(`> [SISTEMA] Iniciando protocolo de rastreo masivo...`);
        onLog(`> [TARGET] Rubro: ${type} | Zona: ${zone}`);
    }
    
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash', 
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], 
        maxOutputTokens: 8192,
        temperature: 0.6 // Lower temp for more factual/structured data
      }
    });

    let buffer = '';
    let foundCount = 0;

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (!text) continue;
      
      buffer += text;

      // Procesar línea por línea
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);

        if (!line) continue;

        // Limpieza agresiva
        const cleanLine = line.replace(/```json/g, '').replace(/```/g, '').replace(/^-\s*/, '').trim(); 

        if (cleanLine.startsWith('{') && cleanLine.endsWith('}')) {
             try {
                const data = JSON.parse(cleanLine);
                
                if (data && data.name) {
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
                        notes: data.notes || `Detectado por IA`,
                        sourceUrl: data.sourceUrl || "Búsqueda Rápida"
                    };
                    
                    onLeadFound(lead);
                    foundCount++;
                    if (onLog) onLog(`> [OK] ${lead.name} (${lead.category})`);
                }
            } catch (e) {
                // Ignore parse errors on partial lines
            }
        }
      }
    }

    // Procesar remanente
    if (buffer.trim()) {
       try {
          const cleanLine = buffer.replace(/```json/g, '').replace(/```/g, '').trim();
          if (cleanLine.startsWith('{') && cleanLine.endsWith('}')) {
              const data = JSON.parse(cleanLine);
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
              }
          }
       } catch (e) {}
    }

    if (onLog) {
        onLog(`> [FIN] Rastreo finalizado. ${foundCount} perfiles obtenidos.`);
    }

  } catch (error: any) {
    console.error("Stream Error:", error);
    if (onLog) onLog(`> [ERROR CRÍTICO] ${error.message}`);
  }
};
