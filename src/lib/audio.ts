import { logger } from "@/lib/logger";

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
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function createSpeechRecognition(
  onResult: (transcript: string) => void,
  onEnd: () => void,
  onError: () => void,
): SpeechRecognition | null {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const instance = new SR();
  instance.continuous = false;
  instance.lang = "tr-TR";
  instance.onresult = (e: SpeechRecognitionEvent) =>
    onResult(e.results[0][0].transcript);
  instance.onend = onEnd;
  instance.onerror = onError;
  return instance;
}