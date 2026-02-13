
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";
import { GoogleGenAI, Type } from "@google/genai";

// --- TYPES (COPIED FROM types.ts FOR SELF-CONTAINMENT AND BUILD STABILITY) ---
export type User = string;

export interface Lead {
  id: string;
  name: string;
  location: string;
  category: string;
  phone: string;
  email: string;
  whatsapp?: string;
  status: 'frio' | 'contacted' | 'negotiation' | 'client';
  sourceUrl?: string;
  savedAt?: number;
  contactName?: string;
  isClient?: boolean;
  notes?: string;
  coordinates?: { lat: number; lng: number; };
  lastContactDate?: string;
  nextAction?: 'call' | 'whatsapp' | 'email' | 'visit' | 'quote' | 'offer' | 'sale';
  nextActionDate?: string;
  priceList?: 'special' | 'wholesale' | 'discount_15' | 'regular';
  saleValue?: number;
  decisionMaker?: string;
  businessPotential?: 'low' | 'medium' | 'high';
  deliveryZone?: string;
  paymentTerms?: string;
  followUpDate?: string;
  owner?: User;
  crmStatus?: {
    status: 'free' | 'owned' | 'locked';
    owner?: User;
  };
  tags?: string[];
}
// --- END TYPES ---


// Ensure Admin SDK is initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// --- EMAIL CONFIGURATION ---
const gmailEmail = (functions as any).config().email?.user || "tu_sistema@gmail.com";
const gmailPassword = (functions as any).config().email?.pass || "password_temporal";

const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: gmailEmail, pass: gmailPassword },
});


// --- NEW RESILIENT ENGINE "HUNTER v3": FINDS AND ENRICHES LEADS IN PARALLEL ---
export const findAndEnrichLeads = functions
  .runWith({ timeoutSeconds: 540, memory: "1GB" })
  .https.onCall(async (data, context) => {
    if (!context.auth || !context.auth.token.name) {
      throw new functions.https.HttpsError('unauthenticated', 'The function must be called by an authenticated user.');
    }
    const currentUser = context.auth.token.name;
    const { type, zone } = data;

    if (!zone || !type) {
      throw new functions.https.HttpsError('invalid-argument', 'Function requires "zone" and "type".');
    }

    const apiKey = (functions as any).config().gemini?.key;
    if (!apiKey) {
      throw new functions.https.HttpsError('failed-precondition', 'The Gemini API key is not configured.');
    }

    const ai = new GoogleGenAI({ apiKey });

    // --- STEP 1: DISCOVER BUSINESSES ---
    let discoveredBusinesses: { name: string, category: string }[] = [];
    try {
        const discoveryPrompt = `Using Google Search, find up to 15 business names of type "${type}" located in or very close to "${zone}". For each, provide its main category. Prioritize businesses that likely have websites or public contact info. Respond ONLY with a valid JSON array.`;
        const discoverySchema = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Nombre del negocio." },
              category: { type: Type.STRING, description: "Categoría principal del negocio." }
            },
            required: ["name", "category"],
          }
        };

        const discoveryResponse = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: discoveryPrompt,
            config: {
                systemInstruction: "You are a B2B discovery specialist. Your only output is a clean JSON array.",
                tools: [{ googleSearch: {} }],
                temperature: 0.3,
                responseMimeType: "application/json",
                responseSchema: discoverySchema,
            }
        });

        const responseText = discoveryResponse.text?.trim();
        if (responseText) {
            let cleanResponseText = responseText;
            if (cleanResponseText.startsWith('```json')) {
                cleanResponseText = cleanResponseText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            }
            discoveredBusinesses = JSON.parse(cleanResponseText);
        }

        if (!Array.isArray(discoveredBusinesses) || discoveredBusinesses.length === 0) {
             return { success: true, leads: [] };
        }

    } catch (error: any) {
        console.error("CRITICAL HUNTER v3 DISCOVERY ERROR:", error);
        throw new functions.https.HttpsError('internal', "The AI failed to discover businesses in the specified zone.", { detail: error.message });
    }

    // --- STEP 2: ENRICH BUSINESSES IN PARALLEL ---
    const enrichmentSchema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            location: { type: Type.STRING },
            phone: { type: Type.STRING },
            email: { type: Type.STRING },
            sourceUrl: { type: Type.STRING }
        },
        required: ["name", "location", "phone", "email", "sourceUrl"]
    };

    const enrichmentPromises = discoveredBusinesses.map(business => (async () => {
        try {
            const enrichmentPrompt = `Using Google Search, find detailed B2B contact info for this specific business: NAME: "${business.name}", CATEGORY: "${business.category}", located in "${zone}". Find its precise address, a contact phone number, an email address, and the source URL. If a field cannot be found, use "No detectado". Respond ONLY with a valid JSON object.`;
            
            const enrichResponse = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: enrichmentPrompt,
                config: {
                    systemInstruction: `You are a B2B data enrichment specialist. Your only output is a clean JSON object.`,
                    tools: [{ googleSearch: {} }],
                    temperature: 0.1,
                    responseMimeType: "application/json",
                    responseSchema: enrichmentSchema
                }
            });

            const responseText = enrichResponse.text?.trim();
            if (!responseText) return null;

            let cleanResponseText = responseText;
            if (cleanResponseText.startsWith('```json')) {
                cleanResponseText = cleanResponseText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            }
            
            const enrichedData = JSON.parse(cleanResponseText);
            if (enrichedData && enrichedData.name) {
                return {
                    name: String(enrichedData.name || business.name).trim(),
                    category: String(business.category).trim(),
                    location: String(enrichedData.location || zone).trim(),
                    phone: String(enrichedData.phone || '').replace(/No detectado/gi, '').trim() || '---',
                    email: String(enrichedData.email || '').replace(/No detectado/gi, '').trim() || '---',
                    sourceUrl: String(enrichedData.sourceUrl || '').trim(),
                };
            }
            return null;

        } catch (err) {
            console.warn(`Enrichment failed for "${business.name}"`, err);
            return null;
        }
    })());

    const enrichmentResults = await Promise.all(enrichmentPromises);
    const successfullyEnriched: Partial<Lead>[] = enrichmentResults.filter(Boolean) as Partial<Lead>[];

    if (successfullyEnriched.length === 0) {
        return { success: true, leads: [] };
    }
    
    // --- STEP 3: CRM DUPLICATION CHECK (Batched) ---
    const uniqueLeadNames = [...new Set(successfullyEnriched.map(l => l.name).filter(Boolean) as string[])];
    const existingLeadsMap = new Map<string, Lead>();

    if (uniqueLeadNames.length > 0) {
      const chunkSize = 30;
      for (let i = 0; i < uniqueLeadNames.length; i += chunkSize) {
          const chunk = uniqueLeadNames.slice(i, i + chunkSize);
          const snapshot = await db.collection('leads').where('name', 'in', chunk).get();
          snapshot.docs.forEach(doc => {
              const docData = doc.data();
              if (docData && docData.name && typeof docData.name === 'string') {
                  existingLeadsMap.set(docData.name.toLowerCase(), docData as Lead);
              }
          });
      }
    }

    // --- STEP 4: FINAL FORMATTING ---
    const finalLeads: Lead[] = successfullyEnriched.map((lead, index) => {
        const existing = existingLeadsMap.get((lead.name || '').toLowerCase());
        const crmStatus: Lead['crmStatus'] = existing
            ? { status: existing.owner === currentUser ? 'owned' : 'locked', owner: existing.owner }
            : { status: 'free' };

        return {
            ...lead,
            id: `stream-${Date.now()}-${index}`,
            status: 'frio',
            owner: currentUser,
            savedAt: Date.now(),
            crmStatus,
        } as Lead;
    });

    return { success: true, leads: finalLeads };
});


// --- TRIGGER: SEND EMAIL ON REPORT ---
export const sendReportEmail = functions.firestore.document('reports/{reportId}').onCreate(async (snap) => {
    const reportData = snap.data();
    if (!reportData) {
        console.log("No data in report, skipping email.");
        return;
    }

    const adminEmail = "hola@bzsgrupobebidas.com.ar";

    const mailOptions = {
        from: `"${reportData.user || 'Sistema'}" <${gmailEmail}>`,
        to: adminEmail,
        subject: `🐞 Nuevo Reporte de Sistema: ${reportData.message.substring(0, 30)}...`,
        html: `
            <h1>Nuevo Reporte de Sistema</h1>
            <p><strong>Usuario:</strong> ${reportData.user || 'Desconocido'}</p>
            <p><strong>Fecha:</strong> ${new Date(reportData.timestamp).toLocaleString('es-AR')}</p>
            <hr>
            <h2>Mensaje:</h2>
            <p style="white-space: pre-wrap; background-color: #f4f4f4; padding: 15px; border-radius: 5px;">${reportData.message}</p>
        `
    };

    try {
        await mailTransport.sendMail(mailOptions);
        console.log('Report email sent successfully to:', adminEmail);
    } catch (error) {
        console.error('There was an error while sending the report email:', error);
    }
});