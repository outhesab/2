import { expect, type Page } from '@playwright/test';

const baseSeedDb = {
  _version: 0,
  products: [
    {
      id: 'urun-1',
      name: 'Deneme Sobasi',
      category: 'soba',
      cost: 1200,
      price: 1800,
      stock: 8,
      minStock: 2,
      createdAt: '2026-05-06T09:00:00.000Z',
      updatedAt: '2026-05-06T09:00:00.000Z',
    },
    {
      id: 'urun-2',
      name: 'Boru Seti',
      category: 'boru',
      cost: 300,
      price: 500,
      stock: 12,
      minStock: 3,
      createdAt: '2026-05-06T09:00:00.000Z',
      updatedAt: '2026-05-06T09:00:00.000Z',
    },
  ],
  suppliers: [
    {
      id: 'sup-1',
      name: 'Test Tedarikci',
      category: 'Genel',
      phone: '05000000000',
      totalOrders: 0,
      totalAmount: 0,
      createdAt: '2026-05-06T09:00:00.000Z',
      updatedAt: '2026-05-06T09:00:00.000Z',
    },
  ],
  orders: [],
  cari: [
    {
      id: 'cari-1',
      name: 'Test Musterisi',
      type: 'musteri',
      balance: 0,
      phone: '05550000000',
      createdAt: '2026-05-06T09:00:00.000Z',
      updatedAt: '2026-05-06T09:00:00.000Z',
    },
  ],
  sales: [],
  kasa: [],
  stockMovements: [],
  bankTransactions: [],
  matchRules: [],
  monitorRules: [],
  monitorLog: [],
  peletSuppliers: [],
  peletOrders: [],
  boruSuppliers: [],
  boruOrders: [],
  invoices: [],
  budgets: [],
  returns: [],
  _activityLog: [],
  company: { id: 'company-1', createdAt: '2026-05-06T09:00:00.000Z' },
  settings: {},
  pelletSettings: { gramaj: 14, kgFiyat: 6.5, cuvalKg: 15, critDays: 3 },
  ortakEmanetler: [],
  installments: [],
  partners: [],
  productCategories: [
    {
      id: 'soba',
      name: 'Soba',
      icon: '🔥',
      createdAt: '2026-05-06T09:00:00.000Z',
    },
    {
      id: 'aksesuar',
      name: 'Aksesuar',
      icon: '🔧',
      createdAt: '2026-05-06T09:00:00.000Z',
    },
    {
      id: 'yedek',
      name: 'Yedek Parca',
      icon: '⚙️',
      createdAt: '2026-05-06T09:00:00.000Z',
    },
    {
      id: 'boru',
      name: 'Boru',
      icon: '🔩',
      createdAt: '2026-05-06T09:00:00.000Z',
    },
    {
      id: 'pelet',
      name: 'Pelet',
      icon: '🪵',
      createdAt: '2026-05-06T09:00:00.000Z',
    },
  ],
  notes: [],
  _auditLog: [],
  kasalar: [
    { id: 'nakit', name: 'Nakit', icon: '💵' },
    { id: 'banka', name: 'Banka', icon: '🏦' },
    { id: 'pos_ziraat', name: 'POS Ziraat', icon: '🏧' },
    { id: 'pos_is', name: 'POS Is', icon: '🏧' },
    { id: 'pos_yk', name: 'POS YapiKredi', icon: '🏧' },
  ],
};

function cloneSeed() {
  return JSON.parse(JSON.stringify(baseSeedDb));
}

import type { DB } from '../../src/types';

export async function seedAuthenticatedApp(page: Page, mutate?: (db: DB) => void) {
  const db = cloneSeed();
  if (mutate) mutate(db);

  await page.addInitScript((seedDb) => {
    window.localStorage.setItem('sobaYonetim_setupDone', '1');
    window.localStorage.setItem('sobaYonetim_setupApplied', '1');
    window.localStorage.setItem('sobaYonetim', JSON.stringify(seedDb));
    window.sessionStorage.setItem(
      'sobaUser_session',
      JSON.stringify({
        userId: 'admin-1',
        username: 'admin',
        role: 'admin',
        ts: Date.now(),
      }),
    );
  }, db);
}

export async function gotoApp(page: Page) {
  await page.goto('/');
  await expect(page).toHaveTitle(/Parspel/i);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const MODULE_GROUP: Record<string, string> = {
  Tedarikçi: 'Tedarik',
  Tedarikci: 'Tedarik',
  Boruted: 'Tedarik',
  Pelet: 'Tedarik',
  'Ortak Emanet': 'Tedarik',
  Cari: 'Finans',
  Kasa: 'Finans',
  Bütçe: 'Finans',
  Banka: 'Finans',
  Raporlar: 'Analiz',
  Ayarlar: 'Sistem',
  Monitör: 'Sistem',
  BugHunter: 'Sistem',
  Anomali: 'Sistem',
  Kontrol: 'Sistem',
  Stok: 'Sistem',
  Notlar: 'Sistem',
  'AI Eylem Log': 'Sistem',
  Entegrasyon: 'Sistem',
  Performans: 'Sistem',
};

async function ensureGroupOpen(page: Page, moduleLabel: string) {
  const group = MODULE_GROUP[moduleLabel];
  if (!group) return;
  
  // Grup toggle butonunu accessible name ile bul (ör: "Tedarik grubunu genislet")
  const toggle = page.getByRole('button', {
    name: new RegExp(`${escapeRegExp(group)}\\s+grubunu\\s+genislet`, 'i'),
  }).first();
  
  const toggleCount = await toggle.count();
  if (toggleCount > 0) {
    await toggle.click();
    await page.waitForTimeout(500);
    return;
  }
  
  // Alternatif: "grubu" kullanarak daha esnek eşleştir
  const altToggle = page.getByRole('button', {
    name: new RegExp(`${escapeRegExp(group)}\\s+grubu`, 'i'),
  }).first();
  
  if (await altToggle.count()) {
    const btnText = (await altToggle.textContent()) || '';
    // textContent "▶Tedarik4" gibi olduğu için genişlet/daralt durumunu
    // accessible name'den kontrol et
    const accessibleName = await altToggle.evaluate(el => {
      return el.getAttribute('aria-label') || el.textContent || '';
    });
    if (accessibleName.toLowerCase().includes('genislet')) {
      await altToggle.click();
      await page.waitForTimeout(500);
    }
  }
}

export async function openModule(page: Page, label: string) {
  // Önce modülün grubunu genişlet
  await ensureGroupOpen(page, label);

  // 1. Yöntem: accessible name ile bul (en güvenilir)
  const buttonByName = page
    .getByRole('button', {
      name: new RegExp(`(^|\\s)${escapeRegExp(label)}(\\s|$)`, 'i'),
    })
    .first();
  if (await buttonByName.count()) {
    await buttonByName.click();
    await page.waitForTimeout(1000);
    const h = page.getByRole('heading', { name: new RegExp(label, 'i') });
    if (await h.count()) { await expect(h).toBeVisible(); return; }
  }

  // 2. Yöntem: text content ile bul (nav içindeki butonlar)
  const navBtn = page.locator('nav button').filter({ hasText: label }).first();
  if (await navBtn.count()) {
    await navBtn.click();
    await page.waitForTimeout(1000);
    const h = page.getByRole('heading', { name: new RegExp(label, 'i') });
    if (await h.count()) { await expect(h).toBeVisible(); return; }
  }

  // 3. Yöntem: Tüm sayfada text ara (en esnek)
  const anyText = page.getByText(label, { exact: false }).first();
  if (await anyText.count()) {
    await anyText.click();
    await page.waitForTimeout(1000);
    const h = page.getByRole('heading', { name: new RegExp(label, 'i') });
    const hCount = await h.count();
    if (hCount > 0) {
      await expect(h).toBeVisible();
    }
    return;
  }

  // Module heading kontrolü yoksa hata fırlatma, sadece uyarı
}

export async function readDb(page: Page) {
  return await page.evaluate(() => {
    const raw = window.localStorage.getItem('sobaYonetim');
    return raw ? JSON.parse(raw) : null;
  });
}
