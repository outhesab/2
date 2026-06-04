/**
 * Kullanıcı Yönetimi — Firebase tabanlı
 * config/users dökümanında saklanır
 */

import { loadConnConfig } from '@/lib/connConfig';
import { logger } from '@/lib/logger';
import { indexedDb } from '@/db/indexeddb';

const USERS_CACHE_KEY = 'soba_users_cache';

function getFirebaseProject(): string {
  const cfg = loadConnConfig();
  return cfg.firebase.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || '';
}

function getFirebaseApiKey(): string {
  const cfg = loadConnConfig();
  return cfg.firebase.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || '';
}

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

function getUsersUrl(): string {
  const projectId = getFirebaseProject();
  const apiKey = getFirebaseApiKey();
  if (!projectId || !apiKey) return '';
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/config/users?key=${apiKey}`;
}

function loadUsersFromCache(): AppUser[] {
  try {
    const raw = localStorage.getItem(USERS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as AppUser[] : [];
  } catch {
    return [];
  }
}

function saveUsersToCache(users: AppUser[]): void {
  try {
    localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(users));
  } catch {
    // localStorage yazilamasa da akisi bozmuyoruz
  }
}

// ── Hash (PBKDF2 - SHA-256'dan daha güvenli) ────────────────────────────
export async function hashPassword(pass: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveBits'],
  );
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
    keyMaterial, 256,
  );
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(derived)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}:${hashHex}`;
}

// ── Firebase CRUD ─────────────────────────────────────────────────────────
export async function loadUsers(): Promise<AppUser[]> {
  const url = getUsersUrl();
  if (!url) return loadUsersFromCache();
  try {
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      // 403/401/5xx vb. durumlarda yerel cache'e düş
      return loadUsersFromCache();
    }
    const json = await res.json();
    const raw = json?.fields?.data?.stringValue;
    if (!raw) return loadUsersFromCache();
    const users = JSON.parse(raw) as AppUser[];
    saveUsersToCache(users);
    return users;
  } catch {
    return loadUsersFromCache();
  }
}

export async function saveUsers(users: AppUser[]): Promise<boolean> {
  saveUsersToCache(users);

  const url = getUsersUrl();
  if (!url) return true;

  const body = JSON.stringify({
    fields: {
      data: { stringValue: JSON.stringify(users) },
      updatedAt: { stringValue: new Date().toISOString() },
    }
  });

  try {
    // Önce PATCH dene (döküman varsa günceller)
    const patchRes = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: AbortSignal.timeout(8000),
    });

    if (patchRes.ok) return true;

    // 404 ise döküman yok — koleksiyon URL'i ile POST ile oluştur
    if (patchRes.status === 404) {
      const projectId = getFirebaseProject();
      const apiKey = getFirebaseApiKey();
      const collectionUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/config?documentId=users&key=${apiKey}`;
      const postRes = await fetch(collectionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: AbortSignal.timeout(8000),
      });
      if (postRes.ok) return true;
      return true;
    }

    return true;
  } catch (e) {
    console.warn('Firebase bağlantı hatası, kullanıcılar yerelde saklandı:', e);
    return true;
  }
}

// ── Parola doğrulama ──────────────────────────────────────────────────────
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // PBKDF2 format (salt:hash)
  if (storedHash.includes(':')) {
    const [saltHex, hashHex] = storedHash.split(':');
    const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
    const keyMaterial = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'],
    );
    const derived = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
      keyMaterial, 256,
    );
    const derivedHex = Array.from(new Uint8Array(derived)).map(b => b.toString(16).padStart(2, '0')).join('');
    return derivedHex === hashHex;
  }
  // Legacy SHA-256 fallback (64 hex chars, salt'sız eski hash)
  if (storedHash.length === 64 && /^[0-9a-f]{64}$/i.test(storedHash)) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex.toLowerCase() === storedHash.toLowerCase();
  }
  return false;
}

// ── Auth ──────────────────────────────────────────────────────────────────
export async function loginUser(username: string, password: string): Promise<AppUser | null> {
  const users = await loadUsers();
  if (users.length === 0) {
    return null;
  }
  for (const u of users) {
    if (u.username.toLowerCase() === username.toLowerCase() && u.active) {
      const match = await verifyPassword(password, u.passwordHash);
      if (match) {
        const updated = users.map(x => x.id === u.id ? { ...x, lastLogin: new Date().toISOString() } : x);
        // Legacy SHA-256 hash'i PBKDF2'ye yükselt
        const isLegacy = !u.passwordHash.includes(':') && u.passwordHash.length === 64;
        if (isLegacy) {
          const newHash = await hashPassword(password);
          const userIdx = updated.findIndex(x => x.id === u.id);
          if (userIdx !== -1) updated[userIdx] = { ...updated[userIdx], passwordHash: newHash };
        }
        saveUsers(updated).catch(() => logger.error('sync', 'Kullanıcı güncelleme Firebase\'e yazılamadı'));
        return updated.find(x => x.id === u.id) || u;
      }
    }
  }
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
  sessionStorage.setItem(GUEST_SESSION_KEY, JSON.stringify({ start }));
  indexedDb.guestSessions.put({ id: 'guest', start, hash: btoa(String(start)) }).catch(() => {});
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
    const { start } = JSON.parse(raw);
    if (Date.now() - start >= GUEST_SESSION_DURATION) return false;
    const record = await indexedDb.guestSessions.get('guest');
    if (!record) return false;
    if (record.start !== start) return false;
    if (record.hash !== btoa(String(start))) return false;
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
  } catch { return null; }
}

export function clearUserSession() {
  localStorage.removeItem(REMEMBER_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  clearGuestSession();
}

// ── Kullanıcı işlemleri ───────────────────────────────────────────────────
export function genUserId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export async function createUser(username: string, password: string, role: UserRole): Promise<{ ok: boolean; msg: string }> {
  const users = await loadUsers();
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
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
  return ok
    ? { ok: true, msg: 'Kullanıcı oluşturuldu' }
    : { ok: false, msg: 'Kullanıcı kaydedilemedi' };
}

export async function updateUserPassword(userId: string, newPassword: string): Promise<boolean> {
  const users = await loadUsers();
  const hash = await hashPassword(newPassword);
  const updated = users.map(u => u.id === userId ? { ...u, passwordHash: hash } : u);
  return saveUsers(updated);
}

export async function toggleUserActive(userId: string): Promise<boolean> {
  const users = await loadUsers();
  const updated = users.map(u => u.id === userId ? { ...u, active: !u.active } : u);
  return saveUsers(updated);
}

export async function deleteUser(userId: string): Promise<boolean> {
  const users = await loadUsers();
  return saveUsers(users.filter(u => u.id !== userId));
}

export async function updateUserRole(userId: string, role: UserRole): Promise<boolean> {
  const users = await loadUsers();
  const updated = users.map(u => u.id === userId ? { ...u, role } : u);
  return saveUsers(updated);
}
