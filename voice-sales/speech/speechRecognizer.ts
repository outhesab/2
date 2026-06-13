// voice-sales/speech/speechRecognizer.ts

import type {
  SpeechConfig,
  TranscriptResult,
  SpeechError,
  SpeechState,
} from '../types';
import { DEFAULT_SPEECH_CONFIG } from '../types';

// Web Speech API type declarations (browser built-in)
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event & { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

export class VoiceSpeechRecognizer {
  private recognition: SpeechRecognition | null = null;
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
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
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
        const RecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!RecognitionClass) {
          throw new Error('SpeechRecognition not available');
        }

        this.recognition = new RecognitionClass();
        this.recognition.lang = this.config.lang;
        this.recognition.continuous = this.config.continuous;
        this.recognition.interimResults = this.config.interimResults;
        this.recognition.maxAlternatives = this.config.maxAlternatives;

        this.transcriptAccumulator = [];
        this.confidenceAccumulator = [];

        this.recognition.onstart = () => {
          this.setState('listening');
          this.onListeningStart?.();
          this.startSilenceTimer();
          resolve();
        };

        this.recognition.onresult = (event: SpeechRecognitionEvent) => {
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

        this.recognition.onerror = (event: Event & { error: string }) => {
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

        this.recognition.onend = () => {
          this.clearSilenceTimer();
          if (this.state === 'listening') {
            this.setState('idle');
          }
          this.onListeningEnd?.();
        };

        this.recognition.start();
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
