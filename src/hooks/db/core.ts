/**
 * DB save pipeline — public facade
 *
 * Moratorium Gün 2: Bu dosya, `state-registry.json` ve `CLAUDE.md` §0
 * tarafından "korunan dosya" olarak listelenen `src/hooks/db/core.ts`
 * referansını gerçek kodla eşlemek için oluşturuldu.
 *
 * Sorumluluk: DB save/update API'sinin tek giriş noktası.
 * - `useDBActions` → hook tabanlı save/undo
 * - `checkDBStructure` → save sonrası yapısal bütünlük kontrolü
 *
 * Yeni bir save API'si eklenecekse burada toplanmalıdır.
 */

export { useDB } from './index';
export { useDBActions } from './useDBActions';
export { checkDBStructure } from './saveSchema';
export type { StructureCheck } from './saveSchema';
