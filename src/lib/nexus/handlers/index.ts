/**
 * Nexus Intent Handlers - Modular intent handling system
 * 
 * Handlers are auto-registered on import via IntentHandlerRegistry.
 * Import this file to ensure all handlers are registered.
 */

export { intentHandlerRegistry } from './IntentHandler';
export type { IntentHandler, HandlerContext, ExecutiveResult } from './IntentHandler';

// Import all handlers to trigger auto-registration
import './NavigationHandler';
import './ComposerHandler';
import './UndoHandler';
import './WeatherHandler';
import './WhatsAppHandler';
import './ActionHandler';
import './SmartHandler';

/**
 * Initialize all intent handlers.
 * Call this once during app startup.
 */
export function initializeIntentHandlers(): void {
  // Handlers are auto-registered via import side effects
  // This function exists for explicit initialization if needed
  console.debug('[Nexus] Intent handlers initialized');
}