import type { DB } from "@/types";
import type { Intent, IntentResult } from "./types";
import { domainEventBus } from "./eventBus";
import { completeSale, cancelSale, returnSale, correctSalePrice } from "./services/saleCompletion";
import { processCashTransaction } from "./services/cashService";
import { processStockUpdate, processProductAdd } from "./services/stockService";
import { processCariTahsilat, processCariAdd } from "./services/cariService";

export function processIntent(intent: Intent, db: DB): IntentResult {
  let result: IntentResult;

  switch (intent.type) {
    case "sale": 
      result = completeSale(intent.payload, db); 
      break;
    case "sale_iptal": 
      result = cancelSale(intent.payload.saleId, db); 
      break;
    case "sale_iade": 
      result = returnSale(intent.payload.saleId, intent.payload.qty, db); 
      break;
    case "sale_fiyat_duzelt": 
      result = correctSalePrice(intent.payload.saleId, intent.payload.yeniFiyat, db); 
      break;
    case "kasa_gelir":
    case "kasa_gider": {
      const type = intent.type === "kasa_gelir" ? "gelir" : "gider";
      result = processCashTransaction(type, intent.payload, db);
      break;
    }
    case "stok_guncelle": 
      result = processStockUpdate(intent.payload, db); 
      break;
    case "urun_ekle": 
      result = processProductAdd(intent.payload, db); 
      break;
    case "cari_tahsilat": 
      result = processCariTahsilat(intent.payload, db); 
      break;
    case "cari_ekle": 
      result = processCariAdd(intent.payload, db); 
      break;
    default:
      return { ok: false, error: `Bilinmeyen intent tipi: ${intent.type}` };
  }

  if (result.ok && result.data) {
    // Eventleri yayınla
    for (const event of result.data.events) {
      domainEventBus.emit(event);
    }
  }

  return result;
}
