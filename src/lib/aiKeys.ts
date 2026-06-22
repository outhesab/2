import { isFirebaseReady, readDoc, writeDoc } from "@/lib/firebase";
import { encrypt, decrypt } from "@/lib/crypto";
import { logger } from '@/lib/logger';

// ── Firebase AI Key Yönetimi ────────────────────────────────────────────────
// Tüm API key'leri Firebase Firestore'da `config/aikeys` dokümanında saklanır.
// .env'deki değerler her zaman Firebase'dekilerden önceliklidir.
// Değerler AES-GCM ile şifrelenir; şifreleme anahtarı cihaz localindedir.

export interface AiKeys {
  claude: string;
  gemini: string;
  deepseek: string;
  huggingface: string;
  opencodeNvidia: string;
  opencodeHf: string;
}

export type KeyState = "ok" | "forbidden" | "unavailable" | "missing-config" | "env";

function isPlaceholder(val: string): boolean {
  const v = val.trim().toLowerCase();
  return !v || v.startsWith("your_");
}

const EMPTY_KEYS: AiKeys = {
  claude: "", gemini: "", deepseek: "",
  huggingface: "", opencodeNvidia: "", opencodeHf: "",
};

async function loadKeysFromFirebase(): Promise<AiKeys & { state: KeyState }> {
  if (!isFirebaseReady()) return { ...EMPTY_KEYS, state: "missing-config" };
  try {
    const doc = await readDoc<Record<string, string> & { updatedAt?: string }>(["config", "aikeys"]);
    if (!doc) return { ...EMPTY_KEYS, state: "unavailable" };
    const keys = ["claude", "gemini", "deepseek", "huggingface", "opencodeNvidia", "opencodeHf"] as const;
    const result: Record<string, string> = {};
    for (const k of keys) {
      const raw = doc[k] ?? "";
      result[k] = raw ? await decrypt(raw) : "";
    }
    return {
      claude: result.claude,
      gemini: result.gemini,
      deepseek: result.deepseek,
      huggingface: result.huggingface,
      opencodeNvidia: result.opencodeNvidia,
      opencodeHf: result.opencodeHf,
      state: "ok",
    };
  } catch {
    logger.warn('ai', 'loadKeysFromFirebase: Firebase key yüklenemedi');
    return { ...EMPTY_KEYS, state: "unavailable" };
  }
}

async function saveKeysToFirebase(keys: AiKeys): Promise<boolean> {
  if (!isFirebaseReady()) return false;
  try {
    const encrypted: Record<string, string> = {};
    for (const [k, v] of Object.entries(keys)) {
      encrypted[k] = await encrypt(v);
    }
    return await writeDoc(["config", "aikeys"], {
      ...encrypted,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    logger.warn('ai', 'saveKeysToFirebase: Firebase key kaydedilemedi');
    return false;
  }
}

// Oturum cache — sekme kapanınca silinir, localStorage'a yazılmaz
const _keyCache: AiKeys & { loaded: boolean } = {
  ...EMPTY_KEYS,
  loaded: false,
};

async function getKeys(): Promise<AiKeys & { state: KeyState }> {
  // .env'de key varsa her zaman önce onu kullan, cache'e gerek yok
  const envKeys: AiKeys = {
    claude: isPlaceholder(import.meta.env.VITE_CLAUDE_API_KEY) ? "" : import.meta.env.VITE_CLAUDE_API_KEY || "",
    gemini: isPlaceholder(import.meta.env.VITE_GEMINI_API_KEY) ? "" : import.meta.env.VITE_GEMINI_API_KEY || "",
    deepseek: isPlaceholder(import.meta.env.VITE_DEEPSEEK_API_KEY) ? "" : import.meta.env.VITE_DEEPSEEK_API_KEY || "",
    huggingface: isPlaceholder(import.meta.env.VITE_HF_TOKEN) ? "" : import.meta.env.VITE_HF_TOKEN || isPlaceholder(import.meta.env.HF_TOKEN) ? "" : import.meta.env.HF_TOKEN || "",
    opencodeNvidia: isPlaceholder(import.meta.env.VITE_NVIDIA_API_KEY) ? "" : import.meta.env.VITE_NVIDIA_API_KEY || isPlaceholder(import.meta.env.NVIDIA_API_KEY) ? "" : import.meta.env.NVIDIA_API_KEY || "",
    opencodeHf: isPlaceholder(import.meta.env.VITE_OPENCODE_HF_KEY) ? "" : import.meta.env.VITE_OPENCODE_HF_KEY || "",
  };
  const hasAnyEnv = Object.values(envKeys).some(v => v.length > 0);
  if (hasAnyEnv) {
    return { ...envKeys, state: "env" };
  }
  // .env'de yoksa Firebase'den al (cache ile)
  if (_keyCache.loaded && !Object.values(_keyCache).some(v => v.length > 0)) {
    _keyCache.loaded = false;
  }
  if (_keyCache.loaded) {
    const { loaded: _used, ...keys } = _keyCache;
    return { ...keys, state: "ok" };
  }
  const result = await loadKeysFromFirebase();
  const { state, ...keys } = result;
  Object.assign(_keyCache, keys, { loaded: true });
  return { ...keys, state: state as KeyState };
}

function invalidateKeyCache() {
  _keyCache.loaded = false;
  _keyCache.claude = "";
  _keyCache.gemini = "";
  _keyCache.deepseek = "";
  _keyCache.huggingface = "";
  _keyCache.opencodeNvidia = "";
  _keyCache.opencodeHf = "";
}

export {
  loadKeysFromFirebase,
  saveKeysToFirebase,
  getKeys,
  invalidateKeyCache,
  EMPTY_KEYS,
};
