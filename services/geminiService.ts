
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

export const scrapeLeads = async (zone: string, type: string, isDeepSearch: boolean = true): Promise<Lead[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const userCoords = await getUserCoordinates();

  try {
    // FASE 1: DESCUBRIMIENTO AGRESIVO (Usamos Pro para mejor razonamiento y síntesis)
    // El modelo Pro es mucho mejor navegando múltiples herramientas y consolidando listas largas.
    const discoveryResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Eres un experto en inteligencia de mercado y Lead Generation B2B. 
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
      - PRIORIZA: Negocios activos con presencia digital.`,
      config: {
        tools: [
          { googleSearch: {} } // Gemini 3 Pro usa googleSearch de forma excelente para browsing
        ]
      }
    });

    const rawInformation = discoveryResponse.text || "No se encontró información básica.";
    
    // FASE 2: ESTRUCTURACIÓN MASIVA
    // Usamos Flash para procesar el volumen de texto generado por Pro y convertirlo en JSON limpio
    const structuringResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analiza la siguiente información de prospección y genera un listado JSON exhaustivo. 
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
      - location: Dirección completa en ${zone}`,
      config: {
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
      }
    });

    const responseText = structuringResponse.text;
    if (!responseText) throw new Error("La IA no pudo procesar el volumen de datos.");

    const rawData = JSON.parse(responseText);

    // Mapeo final y enriquecimiento
    return rawData.map((item: any, index: number) => ({
      ...item,
      id: `lead-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
      status: 'discovered',
      isClient: false,
      notes: '',
      whatsapp: item.whatsapp || (item.phone ? item.phone.replace(/\D/g, '') : ""),
      savedAt: Date.now()
    }));
  } catch (e: any) {
    console.error("Critical Scraping Error:", e);
    if (e.message?.includes("quota") || e.message?.includes("exhausted")) {
      throw new Error("Límite de búsqueda alcanzado por hoy. Prueba en unos minutos.");
    }
    throw new Error("Error en la red de inteligencia. Reintenta con términos más generales.");
  }
};
