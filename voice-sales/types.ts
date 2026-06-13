// voice-sales/types.ts

// ─── Speech Types ───────────────────────────────────────────────

export interface SpeechConfig {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  silenceTimeoutMs: number;
}

export const DEFAULT_SPEECH_CONFIG: SpeechConfig = {
  lang: 'tr-TR',
  continuous: false,
  interimResults: true,
  maxAlternatives: 3,
  silenceTimeoutMs: 3000,
};

export interface TranscriptResult {
  text: string;
  confidence: number;
  isFinal: boolean;
}

export type SpeechState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'error'
  | 'unsupported';

export interface SpeechError {
  code: 'not-supported' | 'no-permission' | 'timeout' | 'network' | 'unknown';
  message: string;
}

// ─── NLP Types ──────────────────────────────────────────────────

export type VoiceCommandAction = 'satis' | 'iptal' | 'iade' | 'fiyat_duzelt' | 'unknown';

export type PaymentMethod = 'nakit' | 'kart' | 'havale' | 'cari';

export interface VoiceItem {
  productQuery: string;
  quantity: number;
  matchedProduct?: {
    id: string;
    name: string;
    price: number;
    cost: number;
    stock: number;
    score: number;
  };
}

export interface VoiceCommand {
  action: VoiceCommandAction;
  items: VoiceItem[];
  payment?: PaymentMethod;
  options?: VoiceSaleOptions;
  confidence: number;
  rawText: string;
}

export interface VoiceSaleOptions {
  discount?: number;
  discountAmount?: number;
  cariId?: string;
  customerName?: string;
  saleDate?: string;
}

// ─── Executor Types ─────────────────────────────────────────────

export interface VoiceSaleResult {
  success: boolean;
  sale?: {
    id: string;
    total: number;
    itemCount: number;
  };
  error?: string;
  parsedCommand: VoiceCommand;
  needsConfirmation: boolean;
  confirmationMessage?: string;
}

// ─── UI Hook Types ──────────────────────────────────────────────

export interface VoiceSaleState {
  speechState: SpeechState;
  transcript: string;
  interimTranscript: string;
  parsedCommand: VoiceCommand | null;
  lastResult: VoiceSaleResult | null;
  error: string | null;
  isProcessing: boolean;
}
