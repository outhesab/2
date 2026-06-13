import { genId } from "@/lib/utils-tr";
import type { DB } from "@/types";
import type { IntentResult } from "@/domain/types";
import type { DomainEvent } from "@/types";

export function processCashTransaction(
  type: "gelir" | "gider",
  payload: {
    amount: number;
    kasa: string;
    description: string;
    category?: string;
  },
  db: DB
): IntentResult {
  const { amount, kasa, description, category } = payload;

  if (amount <= 0) {
    return { ok: false, error: "Tutar 0'dan büyük olmalıdır" };
  }

  const id = genId();
  const nowIso = new Date().toISOString();

  const cashEntry = {
    id,
    type,
    category: category || "diger",
    amount,
    kasa,
    description: description || "",
    relatedId: id,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const events: DomainEvent[] = [
    {
      id: genId(),
      type: "cash.recorded" as const,
      aggregateId: id,
      aggregateType: "cash" as const,
      payload: cashEntry as unknown as Record<string, unknown>,
      timestamp: nowIso,
      version: 1,
    },
  ];

  return {
    ok: true,
    data: {
      dbUpdates: {
        kasa: [cashEntry],
      },
      events,
    },
  };
}
