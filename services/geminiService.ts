
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
    ? `🧠 MEMORIA: Prioriza perfiles similares a: "${learningContext}".` 
    : "";

  // Prompt V5: STRICT JSON MODE
  // Se eliminan ambigüedades. Se prohíbe Markdown.
  const prompt = `
    [ROL]: Crawler B2B de Alta Velocidad.
    [TAREA]: Extraer listado de "${type}" en "${zone}".
    ${memoryBlock}

    ⚠️ REGLAS CRÍTICAS DE FORMATO (NO LAS ROMPAS):
    1. NO escribas introducciones, ni "Aquí están los resultados", ni bloques de código markdown (\`\`\`json).
    2. TU SALIDA DEBE SER EXCLUSIVAMENTE LÍNEAS DE JSON PURO.
    3. Una línea = Un objeto JSON.
    4. Si no encuentras teléfono, pon "No detectado". NO descartes el lead.
    5. Inventa IDs únicos si es necesario.

    EJEMPLO DE SALIDA EXACTA:
    {"name":"Bar Ejemplo","category":"Bar","location":"Calle Falsa 123","phone":"11223344","sourceUrl":"maps"}
    {"name":"Kiosco Pepe","category":"Kiosco","location":"Av Siempreviva 742","phone":"No detectado","sourceUrl":"web"}

    EMPIEZA AHORA. VELOCIDAD MÁXIMA.
  `;

  try {
    if (onLog) {
        onLog(`> [IA V5] 🚀 Iniciando rastreo robusto...`);
        onLog(`> [TARGET] "${type}" en "${zone}"`);
    }
    
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash', 
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], 
        maxOutputTokens: 8192,
        temperature: 0.7 // Un poco menos de temperatura para evitar alucinaciones de formato
      }
    });

    let buffer = '';
    let foundCount = 0;

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (!text) continue;
      
      buffer += text;

      // Procesar línea por línea, manteniendo el remanente en el buffer
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);

        if (!line) continue;

        // Limpieza agresiva de caracteres no JSON (por si la IA desobedece y manda markdown)
        const cleanLine = line.replace(/```json/g, '').replace(/```/g, '').replace(/^-\s*/, ''); // Quita guiones de lista si los pone

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
                        notes: data.notes || `Detectado por IA V5`,
                        sourceUrl: data.sourceUrl || "Búsqueda Rápida"
                    };
                    
                    onLeadFound(lead);
                    foundCount++;
                    if (onLog) onLog(`> [DETECTADO] ${lead.name}`);
                }
            } catch (e) {
                // Si falla el parseo de una línea específica, la ignoramos y seguimos.
                // No rompemos el stream completo.
            }
        }
      }
    }

    // Intentar procesar lo que quede en el buffer final
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
        onLog(`> [FIN] Rastreo completado. ${foundCount} leads estructurados.`);
    }

  } catch (error: any) {
    console.error("Stream Error:", error);
    if (onLog) onLog(`> [ERROR] ${error.message}`);
  }
};
