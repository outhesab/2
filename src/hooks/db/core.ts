/**
 * DB save pipeline — public facade
 *
 * Moratorium Gün 2: Bu dosya, `state-registry.json` ve `CLAUDE.md` §0
 * tarafından "korunan dosya" olarak listelenen `src/hooks/db/core.ts`
 * referansını gerçek kodla eşlemek için oluşturuldu.
 *
 * Sorumluluk: DB save/update API'sinin tek giriş noktası. Şu anda
 * `useDBActions` hook'u içindeki `processSave` mantığını sarmalıyor;
 * ileride static save() eklenirse buraya yönlendirilecek.
 *
 * NOT: Bu facade **implementasyon taşımaz**, yalnızca yeniden export
 * eder. Hook yapısı (useDB → useDBActions) korunur.
 */

export { useDB } from './index';
export { useDBActions } from './useDBActions';
// saveSchema re-export: Gün 1 stash'inde (moratorium-day1-hour5-7-final-saveSchema).
// Moratorium sonunda birleştirildiğinde bu satır açılacak:
// export { checkDBStructure, DBStructureSchema } from './saveSchema';
// export type { StructureCheck } from './saveSchema';
