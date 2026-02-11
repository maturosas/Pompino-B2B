
import { GoogleGenAI } from "@google/genai";
import { Lead } from "../types";

const getUserCoordinates = (): Promise<{ latitude: number; longitude: number } | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null)
    );
  });
};

export const scrapeLeads = async (zone: string, type: string, isDeepSearch: boolean = false): Promise<Lead[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const userCoords = await getUserCoordinates();

  // Phase 1: High-Precision Grounding
  const groundingResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Act as a B2B Lead Generation Expert. 
    Find businesses of type "${type}" in "${zone}". 
    CRITICAL MISSION: 
    1. Find their official website URL.
    2. Find their INSTAGRAM profile link (this is vital for B2B outreach in this sector).
    3. Find phone numbers. Identify if they are mobile/WhatsApp (often starts with 11, 15, 261, 341 etc. in local formats).
    4. Find emails from their websites or social bios.
    5. Use Google Maps for locations and Search for social links.`,
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

  const rawInformation = groundingResponse.text;
  const groundingChunks = groundingResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const groundingUrls = groundingChunks.map(c => c.maps?.uri || c.web?.uri).filter(Boolean) as string[];

  // Phase 2: Structural Intelligence
  const structuringResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze this raw business data:
    
    "${rawInformation}"
    
    Task: Convert to JSON array for CRM.
    
    Data Extraction Strategy:
    - "name": Official business name.
    - "phone": Full international format.
    - "whatsapp": If the phone is a mobile number, put the digits-only version here for wa.me links.
    - "instagram": Full URL to their Instagram profile.
    - "website": Official website URL.
    - "email": Professional or contact email.
    
    Format: ONLY return a JSON array. If info is missing, use empty string. No markdown code blocks.`,
    config: {
      thinkingConfig: { thinkingBudget: 32768 }
    }
  });

  try {
    let text = structuringResponse.text.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```json/, '').replace(/```$/, '').trim();
    }

    const rawData = JSON.parse(text);

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
  } catch (e) {
    console.error("Data processing error:", e);
    throw new Error("Error en el procesamiento de inteligencia. Refine los términos de búsqueda.");
  }
};
