import { useState, useEffect, useCallback } from 'react';

export interface SpeechRecognitionHook {
  listening: boolean;
  supported: boolean;
  transcript: string;
  start: () => void;
  stop: () => void;
  onResult: (text: string) => void;
}

export function useSpeechRecognition(
  onResult: (text: string) => void
): SpeechRecognitionHook {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (SR) {
      setSupported(true);
      const recognition = new SR();
      recognition.lang = 'tr-TR';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        if (text.trim()) {
          onResult(text.trim());
        }
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognition.onerror = (event) => {
        setListening(false);
        console.warn('Speech recognition error:', event.error);
      };

      recognitionRef[0] = recognition;
    }

    return () => {
      if (recognitionRef[0]) {
        recognitionRef[0].stop();
      }
    };
  }, [onResult, recognitionRef]);

  const start = useCallback(() => {
    if (recognitionRef[0] && !listening) {
      setListening(true);
      try {
        recognitionRef[0].start();
      } catch (e) {
        setListening(false);
        console.warn('Speech recognition start failed:', e);
      }
    }
  }, [listening, recognitionRef]);

  const stop = useCallback(() => {
    if (recognitionRef[0] && listening) {
      recognitionRef[0].stop();
      setListening(false);
    }
  }, [listening, recognitionRef]);

  return { listening, supported, transcript, start, stop, onResult };
}

export function useSpeechSynthesis() {
  const [speaking, setSpeaking] = useState(false);

  const speak = useCallback((text: string, options?: { lang?: string; rate?: number; pitch?: number }) => {
    if (!('speechSynthesis' in window)) return Promise.resolve();

    return new Promise<void>((resolve) => {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = options?.lang || 'tr-TR';
      utterance.rate = options?.rate || 1.0;
      utterance.pitch = options?.pitch || 1.0;

      const voices = window.speechSynthesis.getVoices();
      const trVoice =
        voices.find(v => v.lang === 'tr-TR' && v.name.includes('Google')) ||
        voices.find(v => v.lang === 'tr-TR' && v.name.includes('Microsoft')) ||
        voices.find(v => v.lang === 'tr-TR') ||
        voices.find(v => v.lang.startsWith('tr'));

      if (trVoice) {
        utterance.voice = trVoice;
      }

      utterance.onend = () => {
        setSpeaking(false);
        resolve();
      };
      utterance.onerror = () => {
        setSpeaking(false);
        resolve();
      };

      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  return { speaking, speak, stop };
}