/**
 * SOBA NEXUS AI — VoiceNexusCore (Ultimate Edition)
 * Unified Speech-to-Text (STT) and Text-to-Speech (TTS) Service.
 * 
 * Features:
 * - Continuous listening loop (speak → listen → process → speak → listen)
 * - Auto-restart after TTS completes (walkie-talkie conversation mode)
 * - Premium Turkish voice selection
 * - Markdown-free, natural speech output
 * - Error recovery with auto-retry
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
  private isConversationMode = false;
  private options: VoiceOptions = {
    lang: 'tr-TR',
    rate: 1.0,
    pitch: 1.0,
  };
  private currentOnResult: ((text: string) => void) | null = null;
  private currentOnError: ((error: string) => void) | null = null;

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
    this.recognition.continuous = false; // Single utterance mode for reliable results
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;
  }

  /**
   * TEXT-TO-SPEECH (TTS) with Ultra-Premium Turkish Voice
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
    if (!cleanText.trim()) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const opts = { ...this.options, ...overrideOptions };
    
    utterance.lang = opts.lang || 'tr-TR';
    utterance.rate = opts.rate || 1.0;
    utterance.pitch = opts.pitch || 1.0;

    // Voice Selection: Turkish voices with preference order
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

    // Try picking voice now
    pickVoice();

    // Wait for voices if needed
    if (!utterance.voice && window.speechSynthesis.onvoiceschanged !== undefined) {
      await new Promise<void>((resolve) => {
        const handler = () => {
          pickVoice();
          window.speechSynthesis.onvoiceschanged = null;
          resolve();
        };
        window.speechSynthesis.onvoiceschanged = handler as ((this: SpeechSynthesis, ev: Event) => void);
        setTimeout(() => {
          window.speechSynthesis.onvoiceschanged = null;
          resolve();
        }, 2000);
      });
    }

    logger.info('voiceCore', `TTS: ${cleanText.slice(0, 80)}...`);

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
   * SPEECH-TO-TEXT (STT) - Single listen
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

    // Microphone permission check
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        onError('Mikrofon izni gerekli');
        return;
      }
    }

    // Store current callbacks for restart
    this.currentOnResult = onResult;
    this.currentOnError = onError;

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
      // In conversation mode, restart listening
      if (this.isConversationMode && event.error !== 'aborted') {
        setTimeout(() => this.restartListen(), 500);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (!this.isConversationMode) {
        onEnd();
      }
    };

    try {
      this.recognition!.start();
    } catch (_e) {
      this.isListening = false;
      onError('Ses tanıma başlatılamadı');
    }
  }

  /**
   * Start conversation mode: speak → listen loop
   */
  public startConversationMode(): void {
    this.isConversationMode = true;
  }

  /**
   * Stop conversation mode
   */
  public stopConversationMode(): void {
    this.isConversationMode = false;
  }

  /**
   * Speak and then automatically restart listening (walkie-talkie flow)
   */
  public async speakAndListen(text: string, onResult: (text: string) => void, onError: (error: string) => void): Promise<void> {
    await this.speak(text);
    
    if (this.isConversationMode) {
      // Small delay before listening again (avoids echo/feedback)
      await new Promise(resolve => setTimeout(resolve, 300));
      this.listen(onResult, onError, () => {});
    }
  }

  /**
   * Restart the listening session (for conversation mode recovery)
   */
  private async restartListen(): Promise<void> {
    if (!this.isConversationMode || !this.currentOnResult) return;
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (this.isListening) this.stopListening();
    
    this.listen(
      this.currentOnResult,
      this.currentOnError || ((err: string) => logger.warn('voiceCore', `STT restart error: ${err}`)),
      () => {}
    );
  }

  public stopListening(): void {
    this.isListening = false;
    this.isConversationMode = false;
    this.currentOnResult = null;
    this.currentOnError = null;
    if (this.recognition) {
      try { this.recognition.stop(); } catch { /* ignore */ }
    }
  }

  public getStatus() {
    return { isListening: this.isListening, isConversationMode: this.isConversationMode };
  }

  /**
   * Prepare text for natural speech: remove markdown, format numbers, etc.
   */
  private prepareTextForSpeech(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
      .replace(/\*(.*?)\*/g, '$1')      // Italic
      .replace(/#{1,6}\s/g, '')         // Headers
      .replace(/`{1,3}[^`]*`{1,3}/g, '') // Code blocks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
      .replace(/[-•]\s/g, '')           // List markers
      .replace(/₺(\d+)/g, '$1 lira')    // Currency: ₺100 → 100 lira
      .replace(/(\d+)%/g, 'yüzde $1')   // Percentage: 50% → yüzde 50
      .replace(/\s+/g, ' ')             // Collapse whitespace
      .replace(/❌/g, 'hata:')          // Emoji cleanup
      .replace(/✅/g, 'tamam')          // Emoji cleanup
      .replace(/🎤/g, '')               
      .replace(/🤖/g, '')
      .replace(/⏹️/g, '')
      .slice(0, 1000);                  // Safety limit
  }
}

export const voiceNexusCore = VoiceNexusCore.getInstance();
