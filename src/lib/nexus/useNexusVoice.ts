import { useState, useCallback } from 'react';
import { voiceNexusCore } from '@/lib/nexus/VoiceNexusCore';

export interface VoiceState {
  isListening: boolean;
  isConversationMode: boolean;
  error: string | null;
}

export function useNexusVoice() {
  const [state, setState] = useState<VoiceState>({
    isListening: false,
    isConversationMode: false,
    error: null,
  });

  const listen = useCallback(async (
    onResult: (text: string) => void,
    onError?: (error: string) => void
  ) => {
    setState(prev => ({ ...prev, isListening: true, error: null }));

    try {
      await voiceNexusCore.listen(
        (text) => onResult(text),
        (error) => {
          setState(prev => ({ ...prev, error }));
          if (onError) onError(error);
        },
        () => setState(prev => ({ ...prev, isListening: false }))
      );
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'Bilinmeyen hata';
      setState(prev => ({ ...prev, isListening: false, error: errMsg }));
      if (onError) onError(errMsg);
    }
  }, []);

  const stop = useCallback(() => {
    voiceNexusCore.stopListening();
    setState({ isListening: false, isConversationMode: false, error: null });
  }, []);

  const speak = useCallback(async (text: string, options?: { rate?: number; pitch?: number }) => {
    await voiceNexusCore.speak(text, options);
  }, []);

  /**
   * Speak and immediately restart listening (walkie-talkie conversation loop)
   */
  const speakAndListen = useCallback(async (
    text: string,
    handleInput: (text: string) => Promise<void>,
    onError?: (error: string) => void
  ) => {
    setState(prev => ({ ...prev, isConversationMode: true }));
    voiceNexusCore.startConversationMode();
    await voiceNexusCore.speakAndListen(
      text,
      async (input) => { await handleInput(input); },
      (error) => {
        setState(prev => ({ ...prev, error }));
        if (onError) onError(error);
      }
    );
  }, []);

  return {
    ...state,
    listen,
    stop,
    speak,
    speakAndListen,
  };
}
