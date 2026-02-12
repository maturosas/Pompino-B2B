
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

// --- CONFIGURACIÓN DE FIREBASE ---
// 📍 IMPORTANTE: Crea un nuevo proyecto en Firebase Console y reemplaza estas claves
// para que la nueva app tenga su propia base de datos separada.

const firebaseConfig = {
  apiKey: "AIzaSyCT1r2CJvtAfW6yUWTBICGWnjK4dKtWjsM", // <- Pegar nueva API Key
  authDomain: "pompino-b2b.firebaseapp.com",
  projectId: "pompino-b2b",
  storageBucket: "pompino-b2b.firebasestorage.app",
  messagingSenderId: "978737789416",
  appId: "1:978737789416:web:2754f2eaa39e8ddd218c5d",
  measurementId: "G-Z05CW7Z73N"
};

// Validamos si el usuario ya pegó sus claves reales
export const isConfigured = firebaseConfig.apiKey !== "PEGAR_AQUI_TU_API_KEY" && firebaseConfig.apiKey !== "";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const functions = getFunctions(app); // Inicializamos Cloud Functions

export { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, limit, httpsCallable };
