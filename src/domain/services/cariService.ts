import { genId } from "@/lib/utils-tr";
import type { DB } from "@/types";
import type { CariUpdate, IntentResult } from "@/domain/types";
import type { DomainEvent } from "@/types";

export function processCariTahsilat(
  payload: { cariId: string; amount: number; kasa: string },
  _db: DB
): IntentResult {
  const { cariId, amount } = payload;

  if (amount <= 0) {
    return { ok: false, error: "Tahsilat tutarı 0'dan büyük olmalıdır" };
  }

  const cari = _db.cari.find((c) => c.id === cariId);
  if (!cari) {
    return { ok: false, error: "Cari hesap bulunamadı" };
  }

  const nowIso = new Date().toISOString();
  
  const cariUpdate: CariUpdate = {
    cariId,
    balanceChange: -amount,
  };

  const events: DomainEvent[] = [
    {
      id: genId(),
      type: "cari.collected" as const,
      aggregateId: cariId,
      aggregateType: "cari" as const,
      payload: { amount, kasa: payload.kasa } as unknown as Record<string, unknown>,
      timestamp: nowIso,
      version: 1,
    },
  ];

  return {
    ok: true,
    data: {
      dbUpdates: {
        cari: [cariUpdate],
      },
      events,
    },
  };
}

export function processCariAdd(
  payload: { name: string; taxNumber?: string; email?: string; phone?: string; address?: string },
  _db: DB
): IntentResult {
  const id = genId();
  const nowIso = new Date().toISOString();

  const newCari = {
    id,
    name: payload.name,
    type: "musteri" as const,
    taxNo: payload.taxNumber || "",
    email: payload.email || "",
    phone: payload.phone || "",
    address: payload.address || "",
    balance: 0,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const events: DomainEvent[] = [
    {
      id: genId(),
      type: "cari.created" as const,
      aggregateId: id,
      aggregateType: "cari" as const,
      payload: newCari as unknown as Record<string, unknown>,
      timestamp: nowIso,
      version: 1,
    },
  ];

  return {
    ok: true,
    data: {
      dbUpdates: {
        newCari,
      },
      events,
    },
  };
}
