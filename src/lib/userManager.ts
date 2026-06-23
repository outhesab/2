/**
 * Kullanıcı Yönetimi — Firebase tabanlı
 * config/users dökümanında saklanır
 */

import { logger } from '@/lib/logger';
import { indexedDb } from '@/lib/db/indexeddb';
import { encrypt, decrypt } from '@/lib/crypto';
import { readDoc, writeDoc, isFirebaseReady } from '@/lib/firebase';

const USERS_CACHE_KEY = 'soba_users_cache';

export type UserRole = 'admin' | 'user';

export interface AppUser {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  lastLogin?: string;
}

async function loadUsersFromCache(): Promise<AppUser[]> {
  try {
    // 1) IndexedDB'den dene (güvenlik iyileştirmesi — B4: hash'ler IndexedDB'de)
    const snap = await indexedDb.snapshots.get('users_cache');
    if (snap?.data) {
      const raw = snap.data;
      if (raw.startsWith('aes-gcm:')) {
        const decrypted = await decrypt(raw.slice(8));
        const parsed = JSON.parse(decrypted);
        return Array.isArray(parsed) ? (parsed as AppUser[]) : [];
      }
    }
  } catch {
    logger.error('userManager', 'IndexedDB kullanıcı önbelleği okunamadı, localStorage fallback');
  }

  // 2) localStorage fallback (migration / eski veri)
  try {
    const raw = localStorage.getItem(USERS_CACHE_KEY);
    if (!raw) return [];
    // Legacy plaintext JSON — güncelleme sırasında dönüştürülür
    if (raw.startsWith('[')) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as AppUser[]) : [];
    }
    // Şifreli format — "aes-gcm:" + encrypted payload
    if (raw.startsWith('aes-gcm:')) {
      const decrypted = await decrypt(raw.slice(8));
      const parsed = JSON.parse(decrypted);
      return Array.isArray(parsed) ? (parsed as AppUser[]) : [];
    }
  } catch {
    logger.error('userManager', 'Kullanıcı önbelleği okunamadı — tüm cache kaynakları başarısız');
  }
  return [];
}

async function saveUsersToCache(users: AppUser[]): Promise<void> {
  try {
    const encrypted = await encrypt(JSON.stringify(users));
    await indexedDb.snapshots.put({
      id: 'users_cache',
      data: 'aes-gcm:' + encrypted,
      updatedAt: new Date().toISOString(),
    });
    // Migration sonrası eski localStorage cache'i temizle
    localStorage.removeItem(USERS_CACHE_KEY);
  } catch {
    logger.error('userManager', 'IndexedDB kullanıcı önbelleği yazılamadı, localStorage fallback kullanılıyor');
    try {
      const encrypted = await encrypt(JSON.stringify(users));
      localStorage.setItem(USERS_CACHE_KEY, 'aes-gcm:' + encrypted);
    } catch {
      logger.error('userManager', 'Kullanıcı önbelleği yazılamadı — kullanıcı verisi kalıcı değil');
    }
  }
}

// ── Hash (PBKDF2 - SHA-256'dan daha güvenli) ────────────────────────────
export async function hashPassword(pass: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
    keyMaterial,
    256,
  );
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const hashHex = Array.from(new Uint8Array(derived))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${saltHex}:${hashHex}`;
}

// ── Firebase CRUD (SDK) ────────────────────────────────────────────────────
export async function loadUsers(): Promise<AppUser[]> {
  if (isFirebaseReady()) {
    try {
      const doc = await readDoc<{ data: string }>(['config', 'users']);
      if (doc?.data) {
        const users = JSON.parse(doc.data) as AppUser[];
        await saveUsersToCache(users);
        return users;
      }
    } catch {
      logger.error('userManager', 'Firebase kullanıcı yükleme hatası, önbellek kullanılıyor');
    }
  }
  return await loadUsersFromCache();
}

export async function saveUsers(users: AppUser[]): Promise<boolean> {
  await saveUsersToCache(users);
  if (!isFirebaseReady()) return true;
  return writeDoc(['config', 'users'], {
    data: JSON.stringify(users),
    updatedAt: new Date().toISOString(),
  });
}

// ── Parola doğrulama ──────────────────────────────────────────────────────
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // PBKDF2 format (salt:hash)
  if (storedHash.includes(':')) {
    const [saltHex, hashHex] = storedHash.split(':');
    const salt = new Uint8Array((saltHex.match(/.{2}/g) ?? []).map((b) => parseInt(b, 16)));
    const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
      'deriveBits',
    ]);
    const derived = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
      keyMaterial,
      256,
    );
    const derivedHex = Array.from(new Uint8Array(derived))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return derivedHex === hashHex;
  }
  // Legacy SHA-256 fallback (64 hex chars, salt'sız eski hash)
  if (storedHash.length === 64 && /^[0-9a-f]{64}$/i.test(storedHash)) {
    logger.warn('auth', 'Legacy SHA-256 hash doğrulandı — upgrade-on-login tetiklenecek');
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return hashHex.toLowerCase() === storedHash.toLowerCase();
  }
  return false;
}

// ── Auth ──────────────────────────────────────────────────────────────────
export async function loginUser(username: string, password: string): Promise<AppUser | null> {
  if (isLockedOut(username)) {
    logger.warn('auth', 'Çok fazla başarısız giriş denemesi — hesap kilitli', { username });
    return null;
  }

  const users = await loadUsers();
  if (users.length === 0) {
    recordLoginAttempt(username, false);
    return null;
  }
  for (const u of users) {
    if (u.username.toLowerCase() === username.toLowerCase() && u.active) {
      const match = await verifyPassword(password, u.passwordHash);
      if (match) {
        recordLoginAttempt(username, true);
        const updated = users.map((x) => (x.id === u.id ? { ...x, lastLogin: new Date().toISOString() } : x));
        // Legacy SHA-256 hash'i PBKDF2'ye yükselt
        const isLegacy = !u.passwordHash.includes(':') && u.passwordHash.length === 64;
        if (isLegacy) {
          const newHash = await hashPassword(password);
          const userIdx = updated.findIndex((x) => x.id === u.id);
          if (userIdx !== -1) updated[userIdx] = { ...updated[userIdx], passwordHash: newHash };
        }
        saveUsers(updated).catch(() => logger.error('sync', "Kullanıcı güncelleme Firebase'e yazılamadı"));
        return updated.find((x) => x.id === u.id) || u;
      }
    }
  }
  recordLoginAttempt(username, false);
  return null;
}

// ── Misafir oturumu (15 dk, Firebase yokken) ───────────────────────────────
const GUEST_SESSION_KEY = 'soba_guest';
const GUEST_SESSION_DURATION = 15 * 60 * 1000;

export function startGuestSession(): AppUser {
  const guest: AppUser = {
    id: 'guest',
    username: 'Misafir',
    passwordHash: '',
    role: 'user',
    active: true,
    createdAt: new Date().toISOString(),
  };
  const start = Date.now();
  const hash = crypto.randomUUID(); // Güvenli rastgele token
  sessionStorage.setItem(GUEST_SESSION_KEY, JSON.stringify({ start, hash }));
  indexedDb.guestSessions.put({ id: 'guest', start, hash }).catch(() => {});
  setUserSession(guest, false);
  return guest;
}

export function isGuestSession(): boolean {
  try {
    const raw = sessionStorage.getItem(GUEST_SESSION_KEY);
    if (!raw) return false;
    const { start } = JSON.parse(raw);
    const valid = Date.now() - start < GUEST_SESSION_DURATION;
    if (!valid) return false;
    return true;
  } catch {
    return false;
  }
}

export async function verifyGuestSessionIntegrity(): Promise<boolean> {
  try {
    const raw = sessionStorage.getItem(GUEST_SESSION_KEY);
    if (!raw) return false;
    const { start, hash } = JSON.parse(raw);
    if (Date.now() - start >= GUEST_SESSION_DURATION) return false;
    if (!hash) return false; // Hash yoksa geçersiz
    const record = await indexedDb.guestSessions.get('guest');
    if (!record) return false;
    if (record.start !== start) return false;
    if (record.hash !== hash) return false;
    return true;
  } catch {
    return false;
  }
}

export function getGuestSessionRemaining(): number {
  try {
    const raw = sessionStorage.getItem(GUEST_SESSION_KEY);
    if (!raw) return 0;
    const { start } = JSON.parse(raw);
    return Math.max(0, GUEST_SESSION_DURATION - (Date.now() - start));
  } catch {
    return 0;
  }
}

export function clearGuestSession(): void {
  sessionStorage.removeItem(GUEST_SESSION_KEY);
}

// ── Oturum ────────────────────────────────────────────────────────────────
const SESSION_KEY = 'sobaUser_session';
const REMEMBER_KEY = 'sobaUser_remember';

export function setUserSession(user: AppUser, remember: boolean) {
  const data = JSON.stringify({ userId: user.id, username: user.username, role: user.role, ts: Date.now() });
  if (remember) {
    localStorage.setItem(REMEMBER_KEY, data);
  } else {
    sessionStorage.setItem(SESSION_KEY, data);
  }
}

export function getUserSession(): { userId: string; username: string; role: UserRole } | null {
  try {
    const remRaw = localStorage.getItem(REMEMBER_KEY);
    if (remRaw) {
      const d = JSON.parse(remRaw);
      if (Date.now() - d.ts < 30 * 24 * 60 * 60 * 1000) return d;
      localStorage.removeItem(REMEMBER_KEY);
    }
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (Date.now() - d.ts < 8 * 60 * 60 * 1000) return d;
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  } catch {
    return null;
  }
}

export function clearUserSession() {
  localStorage.removeItem(REMEMBER_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  clearGuestSession();
}

// ── Kullanıcı işlemleri ───────────────────────────────────────────────────
export function genUserId(): string {
  return crypto.randomUUID();
}

// ── Brute-force koruması ──────────────────────────────────────────────────
const LOGIN_ATTEMPTS_KEY = 'soba_login_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60_000; // 1 dakika

function getLoginAttempts(): Record<string, { count: number; lastAttempt: number }> {
  try {
    const raw = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function recordLoginAttempt(username: string, success: boolean): void {
  const attempts = getLoginAttempts();
  const key = username.toLowerCase();
  if (success) {
    delete attempts[key];
  } else {
    attempts[key] = {
      count: (attempts[key]?.count ?? 0) + 1,
      lastAttempt: Date.now(),
    };
  }
  // Eski kayıtları temizle (10 dakikadan eski)
  for (const k of Object.keys(attempts)) {
    if (Date.now() - attempts[k].lastAttempt > 600_000) delete attempts[k];
  }
  try {
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
  } catch {
    /* ignore */
  }
}

function isLockedOut(username: string): boolean {
  const attempts = getLoginAttempts();
  const entry = attempts[username.toLowerCase()];
  if (!entry) return false;
  if (entry.count >= MAX_ATTEMPTS && Date.now() - entry.lastAttempt < LOCKOUT_MS) return true;
  return false;
}

export async function createUser(
  username: string,
  password: string,
  role: UserRole,
): Promise<{ ok: boolean; msg: string }> {
  const users = await loadUsers();
  if (users.find((u) => u.username.toLowerCase() === username.toLowerCase())) {
    return { ok: false, msg: 'Bu kullanıcı adı zaten kullanılıyor' };
  }
  const hash = await hashPassword(password);
  const newUser: AppUser = {
    id: genUserId(),
    username: username.trim(),
    passwordHash: hash,
    role,
    active: true,
    createdAt: new Date().toISOString(),
  };
  const ok = await saveUsers([...users, newUser]);
  return ok ? { ok: true, msg: 'Kullanıcı oluşturuldu' } : { ok: false, msg: 'Kullanıcı kaydedilemedi' };
}

export async function updateUserPassword(userId: string, newPassword: string): Promise<boolean> {
  const users = await loadUsers();
  const hash = await hashPassword(newPassword);
  const updated = users.map((u) => (u.id === userId ? { ...u, passwordHash: hash } : u));
  return saveUsers(updated);
}

export async function toggleUserActive(userId: string): Promise<boolean> {
  const users = await loadUsers();
  const updated = users.map((u) => (u.id === userId ? { ...u, active: !u.active } : u));
  return saveUsers(updated);
}

export async function deleteUser(userId: string): Promise<boolean> {
  const users = await loadUsers();
  return saveUsers(users.filter((u) => u.id !== userId));
}

export async function updateUserRole(userId: string, role: UserRole): Promise<boolean> {
  const users = await loadUsers();
  const updated = users.map((u) => (u.id === userId ? { ...u, role } : u));
  return saveUsers(updated);
}
