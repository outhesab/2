const STORAGE_KEY = 'parspel_crypto_key';
const IDB_DB_NAME = 'ParspelCrypto';
const IDB_STORE = 'keys';
const IDB_KEY_ID = 'aes-gcm-key';
const ALGO = 'AES-GCM';
const IV_LENGTH = 12;

function bytesToB64(bytes: Uint8Array): string {
  return btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(''));
}

function b64ToBytes(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/** IndexedDB'den CryptoKey oku (non-exportable) */
function idbGetKey(): Promise<CryptoKey | null> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_DB_NAME, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(IDB_STORE);
      };
      req.onsuccess = () => {
        const tx = req.result.transaction(IDB_STORE, 'readonly');
        const store = tx.objectStore(IDB_STORE);
        const getReq = store.get(IDB_KEY_ID);
        getReq.onsuccess = () => resolve(getReq.result as CryptoKey | null);
        getReq.onerror = () => resolve(null);
        tx.oncomplete = () => req.result.close();
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/** IndexedDB'ye CryptoKey yaz (non-exportable) */
function idbPutKey(key: CryptoKey): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open(IDB_DB_NAME, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(IDB_STORE);
      };
      req.onsuccess = () => {
        const tx = req.result.transaction(IDB_STORE, 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        store.put(key, IDB_KEY_ID);
        tx.oncomplete = () => {
          req.result.close();
          resolve();
        };
        tx.onerror = () => {
          req.result.close();
          reject(tx.error);
        };
      };
      req.onerror = () => reject(req.error);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Anahtar yönetimi:
 * 1. IndexedDB'de non-exportable CryptoKey varsa onu kullan
 * 2. localStorage'da eski raw key varsa → non-exportable olarak import et,
 *    IndexedDB'ye taşı, localStorage'dan sil
 * 3. Hiçbiri yoksa yeni non-exportable key üret, IndexedDB'ye kaydet
 */
async function getKey(): Promise<CryptoKey> {
  // 1) IndexedDB'den dene
  const idbKey = await idbGetKey();
  if (idbKey) return idbKey;

  // 2) localStorage'dan migrate et
  const legacy = localStorage.getItem(STORAGE_KEY);
  if (legacy) {
    try {
      const raw = b64ToBytes(legacy);
      // non-exportable olarak import et
      // @ts-expect-error — TS 5.8 Uint8Array<ArrayBufferLike> vs BufferSource
      const migrated = await crypto.subtle.importKey('raw', raw, ALGO, false, ['encrypt', 'decrypt']);
      await idbPutKey(migrated);
      localStorage.removeItem(STORAGE_KEY);
      return migrated;
    } catch {
      // migrate edilemiyorsa yeni key üret
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  // 3) Yeni non-exportable key üret
  const key = await crypto.subtle.generateKey({ name: ALGO, length: 256 }, false, ['encrypt', 'decrypt']);
  await idbPutKey(key);
  return key;
}

export async function encrypt(plaintext: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const enc = new TextEncoder();
  const data = await crypto.subtle.encrypt({ name: ALGO, iv }, key, enc.encode(plaintext));
  return bytesToB64(iv) + ':' + bytesToB64(new Uint8Array(data));
}

export async function decrypt(payload: string): Promise<string> {
  const key = await getKey();
  const colon = payload.indexOf(':');
  if (colon === -1) return payload;
  const iv = b64ToBytes(payload.slice(0, colon));
  const data = b64ToBytes(payload.slice(colon + 1));
  try {
    // @ts-expect-error — TS 5.8 Uint8Array<ArrayBufferLike> vs BufferSource
    const decrypted = await crypto.subtle.decrypt({ name: ALGO, iv }, key, data);
    return new TextDecoder().decode(decrypted);
  } catch {
    // Authentication tag doğrulama hatası — veri bozulmuş veya manipüle edilmiş
    throw new Error('Decrypt failed: data integrity check failed');
  }
}
