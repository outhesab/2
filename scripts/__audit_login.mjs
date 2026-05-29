import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:3001';

async function diagnose() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await ctx.newPage();

  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Check localStorage for users
  const users = await page.evaluate(() => {
    const raw = localStorage.getItem('soba_users_cache');
    if (!raw) return 'NO USERS CACHE';
    const users = JSON.parse(raw);
    return users.map(u => ({
      id: u.id,
      username: u.username,
      role: u.role,
      active: u.active,
      hashFormat: u.passwordHash?.split(':').length === 2 ? 'VALID_PBKDF2' : 'INVALID_FORMAT',
      hashPreview: u.passwordHash?.slice(0, 20) + '...',
      hashLength: u.passwordHash?.length || 0,
    }));
  });
  console.log('Cached users:', JSON.stringify(users, null, 2));

  // Test hashPassword + verifyPassword flow
  const hashTest = await page.evaluate(async () => {
    // Simulate the hash + verify flow
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode('test123'), 'PBKDF2', false, ['deriveBits']);
    const derived = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100, hash: 'SHA-256' }, keyMaterial, 256);
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
    const hashHex = Array.from(new Uint8Array(derived)).map(b => b.toString(16).padStart(2, '0')).join('');
    const stored = `${saltHex}:${hashHex}`;
    
    // Verify
    const parts = stored.split(':');
    const storedSalt = new Uint8Array(parts[0].match(/.{2}/g).map(b => parseInt(b, 16)));
    const km2 = await crypto.subtle.importKey('raw', new TextEncoder().encode('test123'), 'PBKDF2', false, ['deriveBits']);
    const d2 = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: storedSalt, iterations: 100, hash: 'SHA-256' }, km2, 256);
    const verifyHex = Array.from(new Uint8Array(d2)).map(b => b.toString(16).padStart(2, '0')).join('');
    
    return {
      hashGenerated: stored.length,
      hashFormat: stored.split(':').length === 2 ? 'OK' : 'WRONG',
      verifyMatch: verifyHex === parts[1],
      hashExample: stored.slice(0, 30) + '...',
    };
  });
  console.log('\nHash test (100 iterations):', JSON.stringify(hashTest, null, 2));

  // Test with 600k iterations
  const fullHashTest = await page.evaluate(async () => {
    const start = performance.now();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const km = await crypto.subtle.importKey('raw', new TextEncoder().encode('admin123'), 'PBKDF2', false, ['deriveBits']);
    const d = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' }, km, 256);
    const elapsed = performance.now() - start;
    return {
      elapsedMs: Math.round(elapsed),
      hashLength: Array.from(new Uint8Array(d)).length,
    };
  });
  console.log('\nFull PBKDF2 test (600k iterations):', JSON.stringify(fullHashTest, null, 2));

  // Try login
  const registerLink = page.locator('button, a').filter({ hasText: 'Kayıt Ol' }).first();
  await registerLink.click();
  await page.waitForTimeout(500);

  await page.locator('input[type="text"]:not([type="checkbox"])').first().fill('testuser999');
  await page.locator('input[type="password"]').nth(0).fill('test123');
  await page.locator('input[type="password"]').nth(1).fill('test123');
  await page.locator('button').filter({ hasText: /^📝 Kayıt/ }).first().click();
  await page.waitForTimeout(8000);

  const afterText = await page.locator('body').innerText();
  const loggedIn = afterText.includes('Özet') || afterText.includes('HIZLI');
  console.log('\nFresh registration login:', loggedIn ? 'SUCCESS' : 'FAILED');

  // Check the new user's hash
  const newUsers = await page.evaluate(() => {
    const raw = localStorage.getItem('soba_users_cache');
    return raw ? JSON.parse(raw).map(u => ({
      username: u.username,
      hashFormat: u.passwordHash?.split(':').length === 2 ? 'VALID' : 'INVALID',
      hashLen: u.passwordHash?.length,
    })) : 'empty';
  });
  console.log('Users after fresh registration:', JSON.stringify(newUsers, null, 2));

  await browser.close();
}

diagnose().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
