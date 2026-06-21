import type { DB } from '@/types';
import type { ExecutiveResult } from '@/lib/nexus/NexusExecutive';

// Re-export for other handlers
export type { ExecutiveResult };

/**
 * Base interface for all intent handlers.
 * Each handler is responsible for a specific type of user intent.
 */
export interface IntentHandler {
  /** Unique identifier for this handler (used for logging/debugging) */
  readonly name: string;

  /** Priority: higher = checked first. Navigation should be highest. */
  readonly priority: number;

  /**
   * Check if this handler can process the given input.
   * Should be fast and deterministic (no external calls).
   */
  canHandle(input: string, context: HandlerContext): boolean;

  /**
   * Process the input and return an ExecutiveResult.
   * This is where the actual logic lives.
   */
  handle(input: string, db: DB, context: HandlerContext): Promise<ExecutiveResult>;
}

/**
 * Context passed to all handlers during processing.
 * Contains shared state and services.
 */
export interface HandlerContext {
  /** Current composer mode state */
  composerMode: boolean;
  /** Whether we're in a file context */
  isFileContext?: boolean;
  /** Current files if in file context */
  currentFiles?: unknown[];
  /** Admin mode flag */
  adminMode?: boolean;
  /** Set composer mode (call to activate/deactivate) */
  setComposerMode?: (active: boolean) => void;
  /** Reset composer (call to clear draft) */
  resetComposer?: () => void;
  /** Register a pending confirmation promise so the Executive can resolve it */
  registerConfirmationPromise?: (promise: Promise<unknown>) => void;
}

/**
 * Result of a handler check - allows early termination with a result
 * or continuation to next handler.
 */
export interface HandlerResult {
  handled: boolean;
  result?: ExecutiveResult;
}

/**
 * Registry for managing and executing intent handlers in priority order.
 */
export class IntentHandlerRegistry {
  private handlers: IntentHandler[] = [];

  register(handler: IntentHandler): void {
    this.handlers.push(handler);
    // Sort by priority descending (highest first)
    this.handlers.sort((a, b) => b.priority - a.priority);
  }

  async execute(input: string, db: DB, context: HandlerContext): Promise<ExecutiveResult> {
    for (const handler of this.handlers) {
      if (handler.canHandle(input, context)) {
        const result = await handler.handle(input, db, context);
        // Support passthrough: handler can signal registry to try next handler
        if (result._skipNext) {
          continue;
        }
        return result;
      }
    }
    // No handler matched - return fallback
    return {
      type: 'smart',
      response: 'Üzgünüm, bu isteği nasıl gerçekleştireceğimi çözemedim.',
      executedActions: [],
    };
  }

  getHandlers(): IntentHandler[] {
    return [...this.handlers];
  }
}

export const intentHandlerRegistry = new IntentHandlerRegistry();