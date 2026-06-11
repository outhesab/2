import { useState, useCallback } from 'react';
import { voiceEngine } from '@/lib/voiceEngine';
import { parseVoiceIntent } from '@/lib/voiceIntent';
import { getAgent } from '@/agents';
import { logger } from '@/lib/logger';

export function useVoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'error'>('idle');

  const startListening = useCallback(async () => {
    setStatus('listening');
    setIsListening(true);

    try {
      voiceEngine.start(
        async (text) => {
          setIsListening(false);
          setStatus('processing');
          
          logger.info('voice', 'Ses algılandı', { text });

          const intent = await parseVoiceIntent(text);
          
          if (intent) {
            const satisAgent = getAgent('satis');
            const result = await satisAgent.islemYap(intent);
            
            if (result.ok) {
              setStatus('idle');
              // Burada TTS (Text to Speech) ile onay verilebilir
              const msg = `İşlem başarıyla tamamlandı: ${intent.action}`;
              window.speechSynthesis.speak(new SpeechSynthesisUtterance(msg));
            } else {
              setStatus('error');
              window.speechSynthesis.speak(new SpeechSynthesisUtterance('Üzgünüm, işlemi yapamadım.'));
            }
          } else {
            setStatus('error');
            window.speechSynthesis.speak(new SpeechSynthesisUtterance('Sizi anlayamadım, lütfen tekrar deneyin.'));
          }
        },
        (error) => {
          setStatus('error');
          setIsListening(false);
          logger.error('voice', 'Ses tanıma hatası', { error });
        }
      );
    } catch (err) {
      setStatus('error');
      setIsListening(false);
      logger.error('voice', 'Voice engine başlatma hatası', { err });
    }
  }, []);

  const stopListening = useCallback(() => {
    voiceEngine.stop();
    setIsListening(false);
    setStatus('idle');
  }, []);

  return {
    isListening,
    status,
    startListening,
    stopListening,
  };
}
