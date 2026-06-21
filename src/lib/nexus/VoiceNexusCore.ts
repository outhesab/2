/**
 * SOBA NEXUS AI — VoiceNexusCore
 * Unified Speech-to-Text (STT) and Text-to-Speech (TTS) Service.
 * 
 * This core eliminates duplication across the app and provides a 
 * high-quality, consistent voice experience.
 */

import { logger } from '@/lib/logger';

export interface VoiceOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
}

export class VoiceNexusCore {
  private static instance: VoiceNexusCore;
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private options: VoiceOptions = {
    lang: 'tr-TR',
    rate: 1.0,
    pitch: 1.0,
  };

  private constructor() {
    this.initRecognition();
  }

  public static getInstance(): VoiceNexusCore {
    if (!VoiceNexusCore.instance) {
      VoiceNexusCore.instance = new VoiceNexusCore();
    }
    return VoiceNexusCore.instance;
  }

  private initRecognition(): void {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      logger.warn('voiceCore', 'Tarayıcı SpeechRecognition desteklemiyor');
      return;
    }

    this.recognition = new SR();
    this.recognition.lang = this.options.lang ?? 'tr-TR';
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;
  }

  /**
   * TEXT-TO-SPEECH (TTS)
   * Converts text to spoken audio with high quality and natural cleaning.
   */
  public async speak(text: string, overrideOptions?: Partial<VoiceOptions>): Promise<void> {
    if (!('speechSynthesis' in window)) {
      logger.warn('voiceCore', 'SpeechSynthesis desteklenmiyor');
      return;
    }

    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    // Premium cleaning: remove markdown and format for natural speech
    const cleanText = this.prepareTextForSpeech(text);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const opts = { ...this.options, ...overrideOptions };
    
    utterance.lang = opts.lang || 'tr-TR';
    utterance.rate = opts.rate || 1.0;
    utterance.pitch = opts.pitch || 1.0;

    // Voice Selection: Wait for voices to be loaded, then pick Turkish voice
    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const trVoice = 
        voices.find(v => v.lang === 'tr-TR' && v.name.includes('Google')) ||
        voices.find(v => v.lang === 'tr-TR' && v.name.includes('Microsoft')) ||
        voices.find(v => v.lang === 'tr-TR') ||
        voices.find(v => v.lang.startsWith('tr'));
      if (trVoice) {
        utterance.voice = trVoice;
      }
    };

    // Try picking voice now (synchronous, may work in some browsers)
    pickVoice();

    // If no voice found yet, wait for voiceschanged event
    if (!utterance.voice && window.speechSynthesis.onvoiceschanged !== undefined) {
      await new Promise<void>((resolve) => {
        const handler = () => {
          pickVoice();
          window.speechSynthesis.onvoiceschanged = null;
          resolve();
        };
        window.speechSynthesis.onvoiceschanged = handler as ((this: SpeechSynthesis, ev: Event) => void);
        // Also set a timeout to avoid hanging
        setTimeout(() => {
          window.speechSynthesis.onvoiceschanged = null;
          resolve();
        }, 2000);
      });
    }

    logger.info('voiceCore', 'TTS speaking', { text: cleanText.slice(0, 80) });

    return new Promise((resolve) => {
      utterance.onend = () => resolve();
      utterance.onerror = (e) => {
        logger.error('voiceCore', 'TTS hatası', { error: e });
        resolve();
      };
      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * SPEECH-TO-TEXT (STT)
   * Starts listening and returns the transcript via callback.
   */
  public async listen(
    onResult: (text: string) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ): Promise<void> {
    if (!this.recognition) {
      onError('Ses tanıma desteklenmiyor');
      return;
    }

    if (this.isListening) {
      this.stopListening();
    }

    // Microphone permission check (critical for Android/WebView)
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        onError('Mikrofon izni gerekli');
        return;
      }
    }

    this.isListening = true;

    this.recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      if (text.trim()) {
        onResult(text.trim());
      }
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      onError(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd();
    };

    try {
      this.recognition!.start();
    } catch (e) {
      this.isListening = false;
      onError('Ses tanıma başlatılamadı');
    }
  }

  public stopListening(): void {
    if (this.recognition) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  public getStatus() {
    return { isListening: this.isListening };
  }

  private prepareTextForSpeech(text: string): string {
    return text
      .replace(/\\*\\*(.*?)\\*\\*/g, '$1') // Bold
      .replace(/\\*(.*?)\\*/g, '$1')      // Italic
      .replace(/#{1,6}\\s/g, '')         // Headers
        .replace(/`{1,3}[^`]*`{1,3}/g, '') // Code
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
      .replace(/[-•]\\s/g, '')           // Lists
      .replace(/₺(\\d+)/g, '$1 lira')    // Currency
      .replace(/(\\d+)%/g, 'yüzde $1')   // Percentage
      .slice(0, 1000);                   // Safety limit
  }
}

export const voiceNexusCore = VoiceNexusCore.getInstance();
