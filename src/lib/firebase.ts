import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  limit,
  orderBy,
  type Firestore,
} from "firebase/firestore/lite";
import { logger } from "@/lib/logger";

function isPlaceholder(val: string): boolean {
  const v = val.trim().toLowerCase();
  return !v || v.startsWith("your_");
}

const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

const hasValidConfig =
  !isPlaceholder(FIREBASE_CONFIG.apiKey) &&
  !isPlaceholder(FIREBASE_CONFIG.projectId);

let _app = hasValidConfig ? initializeApp(FIREBASE_CONFIG) : null;
let _db: Firestore | null = null;

if (_app) {
  try {
    _db = getFirestore(_app);
  } catch (e) {
    logger.error("firebase", "Firestore başlatılamadı", { error: String(e) });
    _app = null;
  }
}

export function getFirebaseProject(): string {
  return FIREBASE_CONFIG.projectId;
}

export function isFirebaseReady(): boolean {
  return _app !== null && _db !== null;
}

export function getFirestoreDb(): Firestore | null {
  return _db;
}

// ── Helper: Firestore doküman oku ──────────────────────────────
export async function readDoc<T = Record<string, unknown>>(
  pathSegments: string[],
): Promise<T | null> {
  if (!_db) return null;
  try {
    const ref = doc(_db, pathSegments[0], ...pathSegments.slice(1));
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as T) : null;
  } catch (e) {
    logger.error("firebase", `readDoc(${pathSegments.join("/")}) başarısız`, {
      error: String(e),
    });
    return null;
  }
}

// ── Helper: Firestore doküman yaz (oluştur/güncelle) ───────────
export async function writeDoc(
  pathSegments: string[],
  data: Record<string, unknown>,
  method: "set" | "update" = "set",
): Promise<boolean> {
  if (!_db) return false;
  try {
    const ref = doc(_db, pathSegments[0], ...pathSegments.slice(1));
    if (method === "update") {
      await updateDoc(ref, data);
    } else {
      await setDoc(ref, data, { merge: true });
    }
    return true;
  } catch (e) {
    logger.error("firebase", `writeDoc(${pathSegments.join("/")}) başarısız`, {
      error: String(e),
    });
    return false;
  }
}

// ── Helper: Firestore doküman sil ──────────────────────────────
export async function removeDoc(pathSegments: string[]): Promise<boolean> {
  if (!_db) return false;
  try {
    await deleteDoc(doc(_db, pathSegments[0], ...pathSegments.slice(1)));
    return true;
  } catch (e) {
    logger.error("firebase", `removeDoc(${pathSegments.join("/")}) başarısız`, {
      error: String(e),
    });
    return false;
  }
}

// ── Helper: Koleksiyon listele ──────────────────────────────────
export async function listDocs<T = Record<string, unknown>>(
  pathSegments: string[],
  maxResults = 50,
): Promise<{ id: string; data: T }[]> {
  if (!_db) return [];
  try {
    const ref = collection(_db, pathSegments[0], ...pathSegments.slice(1));
    const q = query(ref, orderBy("__name__"), limit(maxResults));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, data: d.data() as T }));
  } catch (e) {
    logger.error("firebase", `listDocs(${pathSegments.join("/")}) başarısız`, {
      error: String(e),
    });
    return [];
  }
}
