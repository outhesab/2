import { useState, useCallback, useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';

export type AgentState = 'idle' | 'listening' | 'thinking' | 'speaking';

export function useVoiceAgent(onMessageReceived: (text: string) => Promise<string>) {
  const [state, setState] = useState<AgentState>('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Web Speech API init
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionConstructor) {
      logger.error('VoiceAgent', 'Tarayıcı ses tanıma (SpeechRecognition) desteklemiyor');
      return;
    }


    const recognition = new SpeechRecognitionConstructor();
    recognition.lang = 'tr-TR';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setState('listening');
    recognition.onend = () => {
      if (state === 'listening') setState('idle');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const current = event.resultIndex;
      const resultTranscript = event.results[current][0].transcript;
      setTranscript(resultTranscript);
    };

    recognitionRef.current = recognition;
  }, [state]);

  const speak = useCallback(async (text: string) => {
    if (!('speechSynthesis' in window)) {
      logger.warn('VoiceAgent', 'Tarayıcı ses sentezleme (SpeechSynthesis) desteklemiyor');
      return;
    }

    // Mevcut konuşmayı durdur
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'tr-TR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setState('speaking');
    utterance.onend = () => setState('idle');

    window.speechSynthesis.speak(utterance);
    setResponse(text);
  }, []);

  const toggleListening = useCallback(async () => {
    if (state === 'idle') {
      try {
        setTranscript('');
        recognitionRef.current?.start();
      } catch (e) {
        logger.error('VoiceAgent', 'Mikrofon başlatılamadı', { error: e });
      }
    } else {
      recognitionRef.current?.stop();
      setState('idle');
    }
  }, [state]);

  const handleFinalTranscript = useCallback(async () => {
    if (!transcript) return;

    setState('thinking');
    try {
      const aiResponse = await onMessageReceived(transcript);
      await speak(aiResponse);
    } catch (e) {
      logger.error('VoiceAgent', 'AI yanıtı alınamadı', { error: e });
      setState('idle');
    }
  }, [transcript, onMessageReceived, speak]);

  // Dinleme bittiğinde otomatik olarak AI'ya gönder
  useEffect(() => {
    if (state === 'idle' && transcript && !response) {
      // Sadece gerçekten bir şey söylendiyse gönder
      handleFinalTranscript();
    }
  }, [state, transcript, response, handleFinalTranscript]);

  return {
    state,
    transcript,
    response,
    toggleListening,
    setResponse,
    setTranscript,
  };
}
