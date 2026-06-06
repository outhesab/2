import { logger } from "@/lib/logger";

export interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

export interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

export interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
}

export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export function speak(text: string): void {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "tr-TR";
    u.rate = 1.1;
    window.speechSynthesis.speak(u);
  } catch {
    logger.warn("speech", "Sesli yanıt oynatılamadı");
  }
}

export function hasSpeechRecognition(): boolean {
  return !!(
    (window as unknown as Record<string, unknown>).SpeechRecognition ||
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition
  );
}

export function createSpeechRecognition(
  onResult: (transcript: string) => void,
  onEnd: () => void,
  onError: () => void,
): SpeechRecognition | null {
  const SR =
    (window as unknown as Record<string, unknown>).SpeechRecognition ||
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
  if (!SR) return null;
  const instance = new (SR as new () => SpeechRecognition)();
  instance.continuous = false;
  instance.lang = "tr-TR";
  instance.onresult = (e: SpeechRecognitionEvent) =>
    onResult(e.results[0][0].transcript);
  instance.onend = onEnd;
  instance.onerror = onError;
  return instance;
}
