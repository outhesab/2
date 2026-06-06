import type { KasaEntry, Cari } from "@/types";
import { genId } from "@/lib/utils-tr";

export function checkSatisWritePermission(
  yetkiVar: boolean,
  ctx: unknown,
  ctxMsg?: string,
): { ok: false; error: string } | null {
  if (!yetkiVar) {
    return { ok: false, error: "satis.write yetkisi yok" };
  }
  if (!ctx) {
    return { ok: false, error: ctxMsg ?? "Agent bağlanmadı" };
  }
  return null;
}

export function buildRefundKasaEntries(
  kasa: KasaEntry[],
  saleId: string,
  productName: string,
  payment: string,
  nowIso: string,
  category: "iptal" | "iade",
): { updatedKasa: KasaEntry[]; tahsilEdilen: number } {
  const relatedKasaEntries = kasa.filter(
    (k) => !k.deleted && k.relatedId === saleId && k.type === "gelir",
  );
  const tahsilEdilen = relatedKasaEntries.reduce((s, k) => s + k.amount, 0);

  let updatedKasa = kasa;
  if (tahsilEdilen > 0) {
    const kasaId = payment === "cari" ? "nakit" : payment;
    updatedKasa = [
      ...updatedKasa,
      {
        id: genId(),
        type: "gider" as const,
        category,
        amount: tahsilEdilen,
        kasa: kasaId,
        description: `${category === "iptal" ? "İptal" : "İade"}: ${productName}`,
        relatedId: saleId,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
    ];
  }
  return { updatedKasa, tahsilEdilen };
}

export function updateCariForRefund(
  cari: Cari[],
  cariId: string | undefined,
  total: number,
  tahsilEdilen: number,
  nowIso: string,
): Cari[] {
  if (!cariId) return cari;
  const cariyeYazilan = total - tahsilEdilen;
  if (cariyeYazilan <= 0) return cari;
  return cari.map((c) =>
    c.id === cariId
      ? {
          ...c,
          balance: (c.balance || 0) - cariyeYazilan,
          lastTransaction: nowIso,
          updatedAt: nowIso,
        }
      : c,
  );
}
