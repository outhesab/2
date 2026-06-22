import { useState, useCallback, useRef, useEffect } from 'react';
import { voiceNexusCore } from '@/lib/nexus/VoiceNexusCore';
import { logger } from '@/lib/logger';

export type VoiceAgentState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface UseVoiceAgentOptions {
  onTranscript?: (text: string) => void;
  onResponse?: (response: string) => void;
  onError?: (error: string) => void;
}

export function useVoiceAgent(
  processVoiceInput: (text: string) => Promise<string>,
  options: UseVoiceAgentOptions = {}
) {
  const [state, setState] = useState<VoiceAgentState>('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const isProcessingRef = useRef(false);

  const { onTranscript, onResponse, onError } = options;

  const toggleListening = useCallback(async () => {
    if (state === 'listening') {
      voiceNexusCore.stopListening();
      return;
    }

    if (isProcessingRef.current) return;

    setState('listening');
    setTranscript('');
    setResponse('');

    try {
      await voiceNexusCore.listen(
        (text) => {
          setTranscript(text);
          onTranscript?.(text);
        },
        (error) => {
          setState('error');
          onError?.(error);
          logger.error('VoiceAgent', 'STT error', { error });
        },
        () => {
          // onEnd - process the transcript
          if (transcript.trim()) {
            processTranscript(transcript);
          } else {
            setState('idle');
          }
        }
      );
    } catch (e) {
      setState('error');
      const errMsg = e instanceof Error ? e.message : 'Ses tanıma başlatılamadı';
      onError?.(errMsg);
      logger.error('VoiceAgent', 'Failed to start listening', { error: e });
    }
  }, [state, transcript, onTranscript, onError, processTranscript]);

  const processTranscript = useCallback(async (text: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setState('processing');

    try {
      const result = await processVoiceInput(text);
      setResponse(result);
      onResponse?.(result);
      
      // Speak the response
      setState('speaking');
      await voiceNexusCore.speak(result);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'İşlem hatası';
      onError?.(errMsg);
      logger.error('VoiceAgent', 'Processing failed', { error: e });
    } finally {
      isProcessingRef.current = false;
      setState('idle');
    }
  }, [processVoiceInput, onResponse, onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      voiceNexusCore.stopListening();
      window.speechSynthesis.cancel();
    };
  }, []);

  return {
    state,
    transcript,
    response,
    toggleListening,
    isListening: state === 'listening',
    isProcessing: state === 'processing',
    isSpeaking: state === 'speaking',
  };
}