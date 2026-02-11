
import { GoogleGenAI } from "@google/genai";
import { Lead } from "../types";

/**
 * Gets user location for better Maps grounding.
 */
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

  // Phase 1: High-Precision Grounding for Real-World Places (Maps + Search)
  // We use Gemini 2.5 Flash as it supports Google Maps tool.
  const groundingResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `List businesses of type "${type}" in the area of "${zone}". 
    Specifically look for phone numbers, emails, and social media presence. 
    Use Google Maps and Search to find the most recent and verified businesses.`,
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

  // Phase 2: Structural Intelligence & Thinking (Structuring & Deducting)
  // We use Gemini 3 Pro with high thinking budget to parse the messy grounded data into valid JSON 
  // and deduce missing professional emails/contacts logically.
  const structuringResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `I have the following raw data about businesses:
    
    "${rawInformation}"
    
    Task: Convert this into a structured JSON array for a B2B CRM.
    
    Rules:
    1. Keys: name, location, category, phone, email, website, instagram.
    2. Category should be specific (e.g., "Vinoteca Boutique", "Distribuidor Mayorista").
    3. If email is missing, try to deduce it based on business name and standard patterns if possible, or leave as empty string.
    4. Ensure phone is in international format.
    5. ONLY return valid JSON. No markdown blocks.`,
    config: {
      thinkingConfig: { thinkingBudget: 32768 }
    }
  });

  try {
    let text = structuringResponse.text.trim();
    // Cleaning possible markdown artifacts
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
      website: item.website === "N/A" ? "" : item.website,
      instagram: item.instagram === "N/A" ? "" : item.instagram,
      sourceUrl: groundingUrls[index % groundingUrls.length] || (groundingUrls.length > 0 ? groundingUrls[0] : ''),
      savedAt: Date.now()
    }));
  } catch (e) {
    console.error("Data processing error:", e);
    // Fallback if parsing fails - try to extract anything meaningful
    throw new Error("El motor de inteligencia falló al estructurar los datos. Intente simplificar la búsqueda.");
  }
};
