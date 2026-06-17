// voice-sales/speech/speechRecognizer.ts

import type {
  SpeechConfig,
  TranscriptResult,
  SpeechError,
  SpeechState,
} from '../types';
import { DEFAULT_SPEECH_CONFIG } from '../types';

// Web Speech API type declarations (browser built-in)
// Using minimal local interfaces to avoid conflicts with lib.dom.d.ts

interface VoiceSpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: VoiceSpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface VoiceSpeechRecognitionEvent {
  results: VoiceSpeechRecognitionResultList;
  resultIndex: number;
}

interface VoiceSpeechRecognitionResultList {
  readonly length: number;
  readonly [index: number]: VoiceSpeechRecognitionResult;
}

interface VoiceSpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [index: number]: VoiceSpeechRecognitionAlternative;
}

interface VoiceSpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

// Global type augmentation for browser SpeechRecognition API
// Using a scoped helper to avoid conflicts with lib.dom.d.ts

interface WindowSpeech {
  SpeechRecognition?: new () => VoiceSpeechRecognition;
  webkitSpeechRecognition?: new () => VoiceSpeechRecognition;
}

function getWindowSpeech(): WindowSpeech {
  return window as WindowSpeech;
}

export class VoiceSpeechRecognizer {
  private recognition: VoiceSpeechRecognition | null = null;
  private config: SpeechConfig;
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private state: SpeechState = 'idle';
  private transcriptAccumulator: string[] = [];
  private confidenceAccumulator: number[] = [];

  public onTranscript: ((result: TranscriptResult) => void) | null = null;
  public onStateChange: ((state: SpeechState) => void) | null = null;
  public onError: ((error: SpeechError) => void) | null = null;
  public onListeningStart: (() => void) | null = null;
  public onListeningEnd: (() => void) | null = null;

  constructor(config: Partial<SpeechConfig> = {}) {
    this.config = { ...DEFAULT_SPEECH_CONFIG, ...config };
  }

  /** Check if browser supports speech recognition */
  static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const win = getWindowSpeech();
    return !!(win.SpeechRecognition) || !!(win.webkitSpeechRecognition);
  }

  /** Get current state */
  getState(): SpeechState {
    return this.state;
  }

  /** Check if currently listening */
  isListening(): boolean {
    return this.state === 'listening';
  }

  /** Start listening */
  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!VoiceSpeechRecognizer.isSupported()) {
        this.setState('error');
        const error: SpeechError = {
          code: 'not-supported',
          message: 'Tarayıcınız ses tanımayı desteklemiyor. Chrome, Edge veya Safari kullanın.',
        };
        this.onError?.(error);
        reject(error);
        return;
      }

      if (this.state === 'listening') {
        resolve();
        return;
      }

      try {
        const win = getWindowSpeech();
        const RecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
        if (!RecognitionClass) {
          throw new Error('SpeechRecognition not available');
        }

        this.recognition = new RecognitionClass();
        if (!this.recognition) throw new Error('Failed to create SpeechRecognition instance');
        const rec = this.recognition;
        rec.lang = this.config.lang;
        rec.continuous = this.config.continuous;
        rec.interimResults = this.config.interimResults;
        rec.maxAlternatives = this.config.maxAlternatives;

        this.transcriptAccumulator = [];
        this.confidenceAccumulator = [];

        rec.onstart = () => {
          this.setState('listening');
          this.onListeningStart?.();
          this.startSilenceTimer();
          resolve();
        };

        rec.onresult = (event) => {
          this.resetSilenceTimer();

          let interimTranscript = '';
          let finalTranscript = '';
          let totalConfidence = 0;
          let confidenceCount = 0;

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const alternative = result[0];

            if (result.isFinal) {
              finalTranscript += alternative.transcript;
              totalConfidence += alternative.confidence;
              confidenceCount++;
            } else {
              interimTranscript += alternative.transcript;
            }
          }

          if (finalTranscript) {
            this.transcriptAccumulator.push(finalTranscript.trim());
            const avgConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;
            this.confidenceAccumulator.push(avgConfidence);

            const fullText = this.transcriptAccumulator.join(' ');
            const overallConfidence = this.confidenceAccumulator.length > 0
              ? this.confidenceAccumulator.reduce((a, b) => a + b, 0) / this.confidenceAccumulator.length
              : 0;

            this.onTranscript?.({
              text: fullText,
              confidence: overallConfidence,
              isFinal: true,
            });

            if (!this.config.continuous) {
              this.stop();
            }
          } else if (interimTranscript) {
            const fullText = this.transcriptAccumulator.length > 0
              ? this.transcriptAccumulator.join(' ') + ' ' + interimTranscript.trim()
              : interimTranscript.trim();

            this.onTranscript?.({
              text: fullText,
              confidence: 0,
              isFinal: false,
            });
          }
        };

        rec.onerror = (event) => {
          const errorMap: Record<string, SpeechError['code']> = {
            'not-allowed': 'no-permission',
            'network': 'network',
            'no-speech': 'timeout',
            'aborted': 'unknown',
          };

          const code = errorMap[event.error] || 'unknown';
          const messages: Record<SpeechError['code'], string> = {
            'not-supported': 'Tarayıcınız ses tanımayı desteklemiyor.',
            'no-permission': 'Mikrofon izni verilmedi. Lütfen mikrofon erişimine izin verin.',
            'timeout': 'Ses algılanamadı. Lütfen tekrar konuşun.',
            'network': 'Ağ hatası. İnternet bağlantınızı kontrol edin.',
            'unknown': 'Bilinmeyen bir hata oluştu.',
          };

          this.setState('error');
          this.clearSilenceTimer();
          this.onError?.({ code, message: messages[code] });
        };

        rec.onend = () => {
          this.clearSilenceTimer();
          if (this.state === 'listening') {
            this.setState('idle');
          }
          this.onListeningEnd?.();
        };

        rec.start();
      } catch (err) {
        this.setState('error');
        const error: SpeechError = {
          code: 'unknown',
          message: err instanceof Error ? err.message : 'Ses tanıma başlatılamadı.',
        };
        this.onError?.(error);
        reject(error);
      }
    });
  }

  /** Stop listening */
  stop(): void {
    this.clearSilenceTimer();
    if (this.recognition && this.state === 'listening') {
      this.recognition.stop();
    }
    this.setState('idle');
  }

  /** Reset transcript accumulator */
  resetTranscript(): void {
    this.transcriptAccumulator = [];
    this.confidenceAccumulator = [];
  }

  /** Destroy the recognizer */
  destroy(): void {
    this.stop();
    this.recognition = null;
    this.onTranscript = null;
    this.onStateChange = null;
    this.onError = null;
    this.onListeningStart = null;
    this.onListeningEnd = null;
  }

  private setState(state: SpeechState): void {
    this.state = state;
    this.onStateChange?.(state);
  }

  private startSilenceTimer(): void {
    this.clearSilenceTimer();
    this.silenceTimer = setTimeout(() => {
      if (this.state === 'listening') {
        this.onError?.({
          code: 'timeout',
          message: 'Ses algılanamadı. Mikrofon aktif değil olabilir.',
        });
        this.stop();
      }
    }, this.config.silenceTimeoutMs);
  }

  private resetSilenceTimer(): void {
    if (this.silenceTimer) {
      this.startSilenceTimer();
    }
  }

  private clearSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }
}
