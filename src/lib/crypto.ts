const STORAGE_KEY = "parspel_crypto_key";
const ALGO = "AES-GCM";
const IV_LENGTH = 12;

function bytesToB64(bytes: Uint8Array): string {
  return btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""));
}

function b64ToBytes(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function getKey(): Promise<CryptoKey> {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) {
    const raw = b64ToBytes(existing);
    return crypto.subtle.importKey("raw", raw, ALGO, false, ["encrypt", "decrypt"]);
  }
  const key = await crypto.subtle.generateKey({ name: ALGO, length: 256 }, true, ["encrypt", "decrypt"]);
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", key));
  localStorage.setItem(STORAGE_KEY, bytesToB64(raw));
  return key;
}

export async function encrypt(plaintext: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const enc = new TextEncoder();
  const data = await crypto.subtle.encrypt({ name: ALGO, iv }, key, enc.encode(plaintext));
  return bytesToB64(iv) + ":" + bytesToB64(new Uint8Array(data));
}

export async function decrypt(payload: string): Promise<string> {
  const key = await getKey();
  const colon = payload.indexOf(":");
  if (colon === -1) return payload;
  const iv = b64ToBytes(payload.slice(0, colon));
  const data = b64ToBytes(payload.slice(colon + 1));
  const decrypted = await crypto.subtle.decrypt({ name: ALGO, iv }, key, data);
  return new TextDecoder().decode(decrypted);
}
