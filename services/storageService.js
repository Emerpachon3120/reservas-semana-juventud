/**
 * services/storageService.js
 * -------------------------------------------------------------
 * Único punto de acceso al almacenamiento de reservas.
 *
 * Backend: Firebase Firestore (vía SDK modular cargado desde CDN).
 * Todas las reservas se guardan como documentos individuales en la
 * colección `reservas`, lo que permite que múltiples instituciones
 * escriban al mismo tiempo sin pisarse entre sí (a diferencia de
 * guardar un único documento con el arreglo completo).
 *
 * CONFIGURACIÓN: reemplaza el objeto FIREBASE_CONFIG más abajo con
 * las credenciales de tu proyecto (Firebase Console → Configuración
 * del proyecto → Tus apps → SDK de Firebase). Estas credenciales son
 * públicas por diseño; el control de acceso real se hace con las
 * "Reglas de seguridad" de Firestore (ver README.md).
 * -------------------------------------------------------------
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

/** Credenciales del proyecto Firebase "semana-juventud". */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCgq98DB79PYE0MErXNNavvDGX-MlKTgwQ",
  authDomain: "semana-juventud.firebaseapp.com",
  projectId: "semana-juventud",
  storageBucket: "semana-juventud.firebasestorage.app",
  messagingSenderId: "278276361928",
  appId: "1:278276361928:web:c5f0ad81c05b01f4a01ffd",
};

const COLLECTION = "reservas";

let _db = null;
function db() {
  if (!_db) {
    const app = initializeApp(FIREBASE_CONFIG);
    _db = getFirestore(app);
  }
  return _db;
}

/**
 * Lee todas las reservas desde Firestore.
 * @returns {Promise<Array>} arreglo de reservas (vacío si falla la lectura)
 */
export async function cargarReservas() {
  try {
    const snap = await getDocs(collection(db(), COLLECTION));
    return snap.docs.map((d) => d.data());
  } catch (e) {
    console.error("Error al cargar reservas:", e);
    return [];
  }
}

/**
 * Guarda la lista completa de reservas en Firestore.
 *
 * Estrategia simple y robusta para este tamaño de proyecto: se
 * sobrescribe cada reserva como un documento cuyo id de documento
 * es `reserva.id`. Como Firestore no permite "reemplazar toda la
 * colección" en una sola operación, se compara contra lo que ya
 * existe para borrar los documentos que ya no están en `reservas`.
 *
 * @param {Array} reservas
 * @throws {Error} si la operación falla
 */
export async function guardarReservas(reservas) {
  try {
    const snap = await getDocs(collection(db(), COLLECTION));
    const existentes = new Set(snap.docs.map((d) => d.id));
    const nuevos = new Set(reservas.map((r) => r.id));

    // Crear o actualizar cada reserva
    await Promise.all(reservas.map((r) => setDoc(doc(db(), COLLECTION, r.id), r)));

    // Eliminar documentos que ya no están en la lista (p.ej. tras borrar()
    // desde Administración)
    const aBorrar = [...existentes].filter((id) => !nuevos.has(id));
    await Promise.all(aBorrar.map((id) => deleteDoc(doc(db(), COLLECTION, id))));
  } catch (e) {
    throw new Error("No fue posible guardar. Intenta de nuevo.");
  }
}
