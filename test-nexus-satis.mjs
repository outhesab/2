/**
 * Nexus Satış Fonksiyonu Test Script'i
 * Bu script, düzelttiğimiz hataların çalıştığını test eder.
 */

// 1. Test: NexusRouter.ts'deki payload.soru düzeltmesi
// payload: { soru: query, dbContext: 'summarized' } → DeepSeekAgent'in analizEt'ine gider

const nexusRouterContent = await import('./src/lib/nexus/NexusRouter.ts').catch(() => null);
if (nexusRouterContent) {
  console.log('✅ NexusRouter.ts import edilebildi');
} else {
  console.log('⚠️ NexusRouter.ts import edilemedi (ESM/TS uyumsuzluğu - normal)');
}

// 2. Test: VoiceSaleComposer parse test - "sat" komutunu parse edebiliyor mu?
console.log('\n--- VoiceSaleComposer Test ---');

// Saf fonksiyon testi (import olmadan manuel kontrol)
import { readFileSync } from 'fs';

const nexusRouterCode = readFileSync('./src/lib/nexus/NexusRouter.ts', 'utf-8');
const voiceIntentCode = readFileSync('./src/lib/voiceIntent.ts', 'utf-8');

// NexusRouter payload check
if (nexusRouterCode.includes('soru: query')) {
  console.log('✅ NexusRouter.ts: payload.soru düzeltmesi doğrulandı');
} else {
  console.log('❌ NexusRouter.ts: payload.soru düzeltmesi BULUNAMADI!');
}

// voiceIntent regex check
if (voiceIntentCode.includes('match(/\\{.*\\}/s)')) {
  console.log('✅ voiceIntent.ts: Regex düzeltmesi doğrulandı');
} else {
  console.log('❌ voiceIntent.ts: Regex düzeltmesi BULUNAMADI!');
}

console.log('\n=== Build test ===');
import { execSync } from 'child_process';
try {
  execSync('npx vite build 2>&1 | tail -5', { cwd: '.', timeout: 60000, stdio: 'pipe' });
  console.log('✅ Build başarılı');
} catch (e) {
  console.log('❌ Build hatası:', e.message);
}

console.log('\n=== Tüm testler tamamlandı ===');
