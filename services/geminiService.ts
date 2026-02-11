
import { GoogleGenAI, Type } from "@google/genai";
import { Lead } from "../types";

const getUserCoordinates = (): Promise<{ latitude: number; longitude: number } | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    
    // Timeout de 5 segundos para evitar bloqueos en móviles
    const timeout = setTimeout(() => resolve(null), 5000);
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timeout);
        resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      },
      () => {
        clearTimeout(timeout);
        resolve(null);
      },
      { timeout: 5000 }
    );
  });
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const scrapeLeads = async (zone: string, type: string, isDeepSearch: boolean = true): Promise<Lead[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const userCoords = await getUserCoordinates();

  // Helper para retry con fallback de modelo
  const generateWithFallback = async (primaryModel: string, fallbackModel: string, prompt: string, tools: any = undefined) => {
    try {
      return await ai.models.generateContent({
        model: primaryModel,
        contents: prompt,
        config: { tools }
      });
    } catch (error: any) {
      // Detectamos error de cuota (429)
      if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        console.warn(`Quota exceeded for ${primaryModel}, falling back to ${fallbackModel}`);
        await wait(2000); // Pausa de 2s antes de intentar con el modelo de respaldo
        return await ai.models.generateContent({
          model: fallbackModel,
          contents: prompt,
          config: { tools }
        });
      }
      throw error;
    }
  };

  try {
    // FASE 1: DESCUBRIMIENTO
    // Intentamos Gemini 3 Pro primero para mayor calidad de búsqueda.
    // Si falla por cuota, hacemos fallback automático a Gemini 3 Flash.
    const discoveryPrompt = `Eres un experto en inteligencia de mercado y Lead Generation B2B. 
      OBJETIVO: Encontrar la MAYOR cantidad posible de negocios del rubro "${type}" en la zona de "${zone}" y alrededores inmediatos.
      
      FUENTES OBLIGATORIAS DE BÚSQUEDA:
      1. Google Maps (negocios locales verificados).
      2. Directorios Profesionales (TripAdvisor, Yelp, Páginas Amarillas locales).
      3. Redes Sociales (Instagram, Facebook Business, LinkedIn).
      4. Listas de Cámaras de Comercio y Guías de Ocio locales.
      
      MISION CRÍTICA:
      - No te detengas en los primeros 5 resultados. Busca listados extensos.
      - Para cada negocio, necesito: Nombre exacto, Dirección, Teléfono (especifica si es WhatsApp), Email corporativo y Perfil de Instagram/Redes.
      - Si encuentras pocos resultados, expande el radio de búsqueda a barrios o localidades vecinas para completar una base de datos robusta.
      - PRIORIZA: Negocios activos con presencia digital.`;

    const discoveryResponse = await generateWithFallback(
      'gemini-3-pro-preview', 
      'gemini-3-flash-preview', 
      discoveryPrompt, 
      [{ googleSearch: {} }]
    );

    const rawInformation = discoveryResponse.text || "No se encontró información básica.";
    
    // FASE 2: ESTRUCTURACIÓN MASIVA
    const structuringPrompt = `Analiza la siguiente información de prospección y genera un listado JSON exhaustivo. 
      No omitas ningún negocio mencionado.
      
      INFORMACIÓN RECOLECTADA:
      "${rawInformation}"
      
      REGLAS DE FORMATO:
      - Genera un array de objetos.
      - Si falta el email, deja el campo vacío.
      - Si el teléfono parece celular, asume que es WhatsApp.
      - Limpia los nombres de caracteres extraños.
      
      ESQUEMA JSON:
      - name: Nombre comercial
      - phone: Teléfono (con código de área)
      - whatsapp: Solo números
      - email: Email de contacto
      - category: Sub-rubro específico
      - location: Dirección completa en ${zone}`;

    const structuringConfig = {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            phone: { type: Type.STRING },
            whatsapp: { type: Type.STRING },
            email: { type: Type.STRING },
            category: { type: Type.STRING },
            location: { type: Type.STRING },
          },
          required: ["name", "location"]
        }
      }
    };

    let structuringResponse;
    try {
        structuringResponse = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: structuringPrompt,
            config: structuringConfig
        });
    } catch (e: any) {
        // Reintento simple con pausa para la fase de estructuración
        if (e.status === 429 || e.message?.includes('quota') || e.message?.includes('RESOURCE_EXHAUSTED')) {
             await wait(3000);
             structuringResponse = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: structuringPrompt,
                config: structuringConfig
             });
        } else {
            throw e;
        }
    }

    const responseText = structuringResponse.text;
    if (!responseText) throw new Error("La IA no pudo procesar el volumen de datos.");

    const rawData = JSON.parse(responseText);

    // Mapeo final y enriquecimiento
    return rawData.map((item: any, index: number) => ({
      ...item,
      id: `lead-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
      status: 'frio',
      isClient: false,
      notes: '',
      whatsapp: item.whatsapp || (item.phone ? item.phone.replace(/\D/g, '') : ""),
      savedAt: Date.now()
    }));
  } catch (e: any) {
    console.error("Critical Scraping Error:", e);
    if (e.message?.includes("quota") || e.message?.includes("exhausted") || e.status === 429 || e.message?.includes("429")) {
      throw new Error("⚠️ Sistema sobrecargado (Quota Limit). Espera 1 min o intenta otra zona.");
    }
    throw new Error("Error en la red de inteligencia. Reintenta con términos más generales.");
  }
};
