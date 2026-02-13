
import { initializeApp } from "firebase/app";
// FIX: Add missing firestore functions and types to be re-exported for pagination and querying.
import { 
    getFirestore, 
    collection, 
    doc, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    onSnapshot, 
    query, 
    orderBy, 
    limit,
    startAfter,
    getDocs,
    where,
    type QueryConstraint,
    type DocumentSnapshot
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

// --- CONFIGURACIÓN DE FIREBASE ---
// 📍 IMPORTANTE: Crea un nuevo proyecto en Firebase Console y reemplaza estas claves
// para que la nueva app tenga su propia base de datos separada.
// 🔒 SEGURIDAD: Para un despliegue en producción, estas claves deberían ser gestionadas
// a través de variables de entorno, no hardcodeadas directamente.

const firebaseConfig = {
  apiKey: "AIzaSyCT1r2CJvtAfW6yUWTBICGWnjK4dKtWjsM", // <- Pegar nueva API Key
  authDomain: "pompino-b2b.firebaseapp.com",
  projectId: "pompino-b2b",
  storageBucket: "pompino-b2b.firebasestorage.app",
  messagingSenderId: "978737789416",
  appId: "1:978737789416:web:2754f2eaa39e8ddd218c5d",
  measurementId: "G-Z05CW7Z73N"
};

// Se elimina el chequeo de la API key de ejemplo para desbloquear el inicio.
export const isConfigured = !!firebaseConfig.apiKey;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const functions = getFunctions(app); // Inicializamos Cloud Functions

// FIX: Re-export the newly imported members so they are available across the app.
export { 
    collection, 
    doc, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    onSnapshot, 
    query, 
    orderBy, 
    limit, 
    httpsCallable,
    startAfter,
    getDocs,
    where
};
export type { QueryConstraint, DocumentSnapshot };