
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

export const scrapeLeads = async (zone: string, type: string, isDeepSearch: boolean = false): Promise<Lead[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const userCoords = await getUserCoordinates();

  try {
    // Fase 1: Grounding de Alta Precisión
    const groundingResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Actua como un experto en B2B Lead Generation. 
      Encuentra negocios de tipo "${type}" en "${zone}". 
      MISION: 
      1. Extrae URL oficial.
      2. Extrae perfil de INSTAGRAM (vital).
      3. Extrae telefonos (identifica WhatsApp).
      4. Extrae emails corporativos.
      Usa Google Maps para ubicaciones y Search para redes sociales.`,
      config: {
        tools: [
          { googleMaps: {} },
          { googleSearch: {} }
        ],
        ...(userCoords && {
          toolConfig: {
            retrievalConfig: {
              latLng: {
                latitude: userCoords.latitude,
                longitude: userCoords.longitude
              }
            }
          }
        })
      }
    });

    const rawInformation = groundingResponse.text || "No se encontró información básica.";
    const groundingChunks = groundingResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const groundingUrls = groundingChunks.map(c => c.maps?.uri || c.web?.uri).filter(Boolean) as string[];

    // Fase 2: Estructuración Inteligente
    // Cambiamos a gemini-3-flash-preview para mayor rapidez y estabilidad en la generación de JSON
    const structuringResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Convierte esta información en un array JSON estructurado para CRM:
      
      "${rawInformation}"
      
      Esquema requerido:
      - name: Nombre comercial
      - phone: Formato internacional
      - whatsapp: Solo dígitos
      - instagram: URL completa
      - website: URL completa
      - email: Email detectado
      - category: Rubro
      - location: Dirección completa`,
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
              instagram: { type: Type.STRING },
              website: { type: Type.STRING },
              email: { type: Type.STRING },
              category: { type: Type.STRING },
              location: { type: Type.STRING },
            },
            required: ["name"]
          }
        }
      }
    });

    const responseText = structuringResponse.text;
    if (!responseText) throw new Error("La IA no devolvió datos estructurados.");

    const rawData = JSON.parse(responseText);

    return rawData.map((item: any, index: number) => ({
      ...item,
      id: `lead-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
      status: 'discovered',
      isClient: false,
      contactName: '',
      notes: '',
      website: (item.website && item.website !== "N/A") ? (item.website.startsWith('http') ? item.website : `https://${item.website}`) : "",
      instagram: (item.instagram && item.instagram !== "N/A") ? (item.instagram.startsWith('http') ? item.instagram : `https://${item.instagram}`) : "",
      whatsapp: item.whatsapp || (item.phone ? item.phone.replace(/\D/g, '') : ""),
      sourceUrl: groundingUrls[index % groundingUrls.length] || '',
      savedAt: Date.now()
    }));
  } catch (e: any) {
    console.error("Critical Scraping Error:", e);
    // Error más descriptivo para el usuario
    if (e.message?.includes("500") || e.message?.includes("Internal Server Error")) {
      throw new Error("Error del servidor de IA. Intenta con una zona más específica.");
    }
    throw new Error(e.message || "Error desconocido en el motor de búsqueda.");
  }
};
