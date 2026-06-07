/**
 * Android versionCode hesaplama — CI_PIPELINE_IID string'ini number'a çevirir
 * Geçersiz değerlerde 1 döndürür (güvenli varsayılan)
 */
export function resolveVersionCode(iid: string | null | undefined): number {
  if (iid == null) return 1;
  const trimmed = String(iid).trim();
  if (trimmed === '') return 1;
  const num = Number(trimmed);
  if (isNaN(num) || num < 1) return 1;
  return Math.floor(num);
}
