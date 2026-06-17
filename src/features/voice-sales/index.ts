// voice-sales/index.ts

// Types
export type {
  SpeechConfig,
  TranscriptResult,
  SpeechError,
  SpeechState,
  VoiceCommandAction,
  PaymentMethod,
  VoiceItem,
  VoiceCommand,
  VoiceSaleOptions,
  VoiceSaleResult,
  VoiceSaleState,
} from './types';

export { DEFAULT_SPEECH_CONFIG } from './types';

// Speech
export { VoiceSpeechRecognizer } from './speech/speechRecognizer';

// Parser
export { parseVoiceCommand } from './parser/voiceNlpParser';
export { findBestProductMatch, extractQuantity, stripQuantityWords } from './parser/productMatcher';
export { buildSaleIntent, buildSaleIntentOrThrow, buildSaleIntentPartial } from './parser/voiceIntentBuilder';
export type { IntentBuildResult } from './parser/voiceIntentBuilder';

// Executor
export { executeVoiceSale, executeConfirmedSale } from './executor/voiceSaleExecutor';
export type { ExecutorOptions } from './executor/voiceSaleExecutor';

// UI
export { useVoiceSale } from './ui/useVoiceSale';
export { VoiceSaleButton } from './ui/VoiceSaleButton';
