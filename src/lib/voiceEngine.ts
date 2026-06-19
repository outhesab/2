/**
 * PARSPEL — Voice Engine (STT)
 * Web Speech API kullanarak sesli komutları metne çevirir.
 */

export interface VoiceRecognitionOptions {
  lang?: string;
  interimResults?: boolean;
  continuous?: boolean;
}

export class VoiceEngine {
  private recognition: SpeechRecognition | null = null;
  private isListening: boolean = false;

  constructor(options: VoiceRecognitionOptions = {}) {
    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      throw new Error('Tarayıcınız ses tanıma (SpeechRecognition) özelliğini desteklemiyor.');
    }

    this.recognition = new SpeechRecognitionConstructor();
    this.recognition.lang = options.lang || 'tr-TR';
    this.recognition.interimResults = options.interimResults ?? false;
    this.recognition.continuous = options.continuous ?? false;
  }

  start(onResult: (text: string) => void, onError: (error: string) => void): void {
    if (this.isListening) return;

    this.isListening = true;
    this.recognition!.onresult = (event) => {
      const text = event.results[0][0].transcript;
      onResult(text);
    };

    this.recognition!.onerror = (event) => {
      onError(event.error);
      this.isListening = false;
    };

    this.recognition!.onend = () => {
      this.isListening = false;
    };

    this.recognition!.start();
  }

  stop(): void {
    if (this.recognition) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  getListeningStatus(): boolean {
    return this.isListening;
  }
}

export const voiceEngine = new VoiceEngine();
