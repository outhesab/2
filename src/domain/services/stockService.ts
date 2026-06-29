import { genId } from '@/lib/utils-tr';
import type { DB } from '@/types';
import type { StockMovementV2, IntentResult } from '@/domain/types';
import type { DomainEvent } from '@/types';

export function processStockUpdate(
  payload: { productId: string; amount: number; type: 'giris' | 'cikis'; description?: string },
  _db: DB,
): IntentResult {
  const { productId, amount, type } = payload;

  const product = _db.products.find((p) => p.id === productId);
  if (!product) {
    return { ok: false, error: 'Ürün bulunamadı' };
  }

  const absAmount = Math.abs(amount);
  const delta = type === 'giris' ? absAmount : -absAmount;
  const before = product.stock ?? 0;
  const after = Math.max(0, before + delta);

  if (type === 'cikis' && after < 0) {
    return { ok: false, error: 'Yetersiz stok' };
  }

  const nowIso = new Date().toISOString();
  const movementId = genId();

  const movement: StockMovementV2 = {
    id: movementId,
    productId,
    productName: product.name,
    type: type === 'giris' ? 'iade' : 'satis',
    amount: delta,
    before,
    after,
  };

  const events: DomainEvent[] = [
    {
      id: genId(),
      type: 'stock.updated' as const,
      aggregateId: productId,
      aggregateType: 'stock' as const,
      payload: movement as unknown as Record<string, unknown>,
      timestamp: nowIso,
      version: 1,
    },
  ];

  return {
    ok: true,
    data: {
      dbUpdates: {
        products: [{ id: productId, newStock: after }],
        // Note: stockMovements are handled as events or as separate data.
        // For now, I'll put them in the events, and useDBActions will apply them to the array.
      },
      events,
    },
  };
}

export function processProductAdd(
  payload: { productName: string; category?: string; initialStock?: number; unitPrice?: number },
  _db: DB,
): IntentResult {
  const id = genId();
  const nowIso = new Date().toISOString();

  const newProduct = {
    id,
    name: payload.productName,
    category: payload.category || 'Genel',
    stock: payload.initialStock ?? 0,
    price: payload.unitPrice ?? 0,
    cost: payload.unitPrice ?? 0,
    minStock: 0,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const events: DomainEvent[] = [
    {
      id: genId(),
      type: 'product.created' as const,
      aggregateId: id,
      aggregateType: 'product' as const,
      payload: newProduct as unknown as Record<string, unknown>,
      timestamp: nowIso,
      version: 1,
    },
  ];

  return {
    ok: true,
    data: {
      dbUpdates: {
        newProduct,
      },
      events,
    },
  };
}
