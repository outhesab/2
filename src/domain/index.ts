export { processIntent } from "./intentEngine";
export { completeSale } from "./services/saleCompletion";
export { domainEventBus } from "./eventBus";
export type { DomainBusSaveFn } from "./eventBus";
export { setupDomainListeners } from "./listeners";
export type { DomainListenerContext } from "./listeners";
export type {
  SaleIntent, StockMovementV2, CashTransaction, CariUpdate,
  Intent, IntentResult,
} from "./types";
