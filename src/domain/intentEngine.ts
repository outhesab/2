import type { DB } from "@/types";
import type { Intent, IntentResult } from "./types";
import { domainEventBus } from "./eventBus";
import { completeSale } from "./services/saleCompletion";

export function processIntent(intent: Intent, db: DB): IntentResult {
  switch (intent.type) {
    case "sale": {
      const result = completeSale(intent.payload, db);
      if (!result.ok) return result;
      for (const event of result.data.events) {
        domainEventBus.emit({
          type: event.type,
          aggregateId: event.aggregateId,
          aggregateType: event.aggregateType,
          payload: event.payload,
          version: event.version,
        });
      }
      return { ok: true, data: result.data };
    }
    default:
      return { ok: false, error: `Bilinmeyen intent tipi: ${(intent as Intent).type}` };
  }
}
