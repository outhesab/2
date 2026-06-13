// voice-sales/ui/useVoiceSale.ts

import { useState, useCallback, useRef, useEffect } from 'react';
import type { VoiceSaleState, VoiceCommand, VoiceSaleResult, SpeechState } from '../types';
import { VoiceSpeechRecognizer } from '../speech/speechRecognizer';
import { parseVoiceCommand } from '../parser/voiceNlpParser';
import { executeVoiceSale, executeConfirmedSale } from '../executor/voiceSaleExecutor';
import type { SaleIntent } from '@/domain/types';

const INITIAL_STATE: VoiceSaleState = {
  speechState: 'idle',
  transcript: '',
  interimTranscript: '',
  parsedCommand: null,
  lastResult: null,
  error: null,
  isProcessing: false,
};

export function useVoiceSale() {
  const [state, setState] = useState<VoiceSaleState>(INITIAL_STATE);
  const recognizerRef = useRef<VoiceSpeechRecognizer | null>(null);
  const pendingIntentRef = useRef<SaleIntent | null>(null);
  const pendingCommandRef = useRef<VoiceCommand | null>(null);

  // Initialize recognizer
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const recognizer = new VoiceSpeechRecognizer({
      lang: 'tr-TR',
      continuous: false,
      interimResults: true,
      silenceTimeoutMs: 3000,
    });

    recognizer.onStateChange = (speechState: SpeechState) => {
      setState((prev) => ({ ...prev, speechState }));
    };

    recognizer.onTranscript = (result) => {
      if (result.isFinal) {
        setState((prev) => ({
          ...prev,
          transcript: result.text,
          interimTranscript: '',
        }));
        // Auto-parse on final transcript
        handleTranscript(result.text);
      } else {
        setState((prev) => ({
          ...prev,
          interimTranscript: result.text,
        }));
      }
    };

    recognizer.onError = (error) => {
      setState((prev) => ({
        ...prev,
        speechState: 'error',
        error: error.message,
        isProcessing: false,
      }));
    };

    recognizer.onListeningEnd = () => {
      setState((prev) => ({
        ...prev,
        speechState: prev.speechState === 'error' ? 'error' : 'idle',
      }));
    };

    recognizerRef.current = recognizer;

    return () => {
      recognizer.destroy();
      recognizerRef.current = null;
    };
  }, []);

  // Parse transcript and optionally execute
  const handleTranscript = useCallback((text: string) => {
    const command = parseVoiceCommand(text);
    setState((prev) => ({ ...prev, parsedCommand: command }));

    // Auto-execute if confidence is high enough
    if (command.confidence >= 0.7 && command.action === 'satis' && command.items.length > 0) {
      executeCommand(command);
    }
  }, []);

  // Execute voice command
  const executeCommand = useCallback(async (command: VoiceCommand) => {
    setState((prev) => ({ ...prev, isProcessing: true, error: null }));

    try {
      const result = await executeVoiceSale(command);

      if (result.needsConfirmation && result.confirmationMessage) {
        // Store pending intent for confirmation
        pendingCommandRef.current = command;
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          lastResult: result,
          error: null,
        }));
      } else if (result.success) {
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          lastResult: result,
          error: null,
          transcript: '',
          interimTranscript: '',
          parsedCommand: null,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          lastResult: result,
          error: result.error || 'İşlem başarısız.',
        }));
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isProcessing: false,
        error: err instanceof Error ? err.message : 'Bilinmeyen hata.',
      }));
    }
  }, []);

  // Confirm pending sale
  const confirmSale = useCallback(async () => {
    if (!pendingCommandRef.current) return;

    setState((prev) => ({ ...prev, isProcessing: true }));

    try {
      // Re-build intent from confirmed command
      const result = await executeVoiceSale({
        ...pendingCommandRef.current,
        confidence: 1.0, // Force high confidence on confirmation
      });

      setState((prev) => ({
        ...prev,
        isProcessing: false,
        lastResult: result,
        error: null,
        transcript: '',
        interimTranscript: '',
        parsedCommand: null,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isProcessing: false,
        error: err instanceof Error ? err.message : 'Bilinmeyen hata.',
      }));
    } finally {
      pendingCommandRef.current = null;
      pendingIntentRef.current = null;
    }
  }, []);

  // Cancel pending sale
  const cancelSale = useCallback(() => {
    pendingCommandRef.current = null;
    pendingIntentRef.current = null;
    setState((prev) => ({
      ...prev,
      lastResult: null,
      error: null,
      transcript: '',
      interimTranscript: '',
      parsedCommand: null,
    }));
  }, []);

  // Start listening
  const startListening = useCallback(async () => {
    if (!recognizerRef.current) {
      setState((prev) => ({ ...prev, error: 'Ses tanıma desteklenmiyor.' }));
      return;
    }

    setState((prev) => ({
      ...prev,
      error: null,
      transcript: '',
      interimTranscript: '',
      lastResult: null,
      parsedCommand: null,
    }));

    recognizerRef.current.resetTranscript();

    try {
      await recognizerRef.current.start();
    } catch (err) {
      // Error handled by onError callback
    }
  }, []);

  // Stop listening
  const stopListening = useCallback(() => {
    recognizerRef.current?.stop();
  }, []);

  // Reset state
  const reset = useCallback(() => {
    cancelSale();
    setState(INITIAL_STATE);
  }, [cancelSale]);

  return {
    // State
    speechState: state.speechState,
    transcript: state.transcript,
    interimTranscript: state.interimTranscript,
    parsedCommand: state.parsedCommand,
    lastResult: state.lastResult,
    error: state.error,
    isProcessing: state.isProcessing,
    isListening: state.speechState === 'listening',
    isSupported: VoiceSpeechRecognizer.isSupported(),
    needsConfirmation: state.lastResult?.needsConfirmation || false,
    confirmationMessage: state.lastResult?.confirmationMessage || '',

    // Actions
    startListening,
    stopListening,
    confirmSale,
    cancelSale,
    reset,
  };
}
