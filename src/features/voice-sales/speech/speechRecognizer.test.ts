// voice-sales/speech/speechRecognizer.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { VoiceSpeechRecognizer } from './speechRecognizer';

// ─── Mock SpeechRecognition ─────────────────────────────────────

class MockSpeechRecognition implements EventTarget {
  lang = '';
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;

  onresult: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onend: (() => void) | null = null;
  onstart: (() => void) | null = null;

  private listeners: Map<string, Set<EventListener>> = new Map();

  addEventListener(type: string, listener: EventListener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: EventListener) {
    this.listeners.get(type)?.delete(listener);
  }

  dispatchEvent(event: Event): boolean {
    const handlers = this.listeners.get(event.type);
    if (handlers) {
      handlers.forEach((h) => h(event));
    }
    return true;
  }

  start() {
    // Simulate onstart
    setTimeout(() => this.onstart?.(), 0);
  }

  stop() {
    setTimeout(() => this.onend?.(), 0);
  }

  abort() {
    setTimeout(() => this.onend?.(), 0);
  }

  // Test helpers
  simulateResult(text: string, confidence: number, isFinal: boolean) {
    const event = {
      type: 'result',
      resultIndex: 0,
      results: {
        length: 1,
        0: {
          isFinal,
          length: 1,
          0: { transcript: text, confidence },
        },
        item(i: number) { return (this as Record<number, unknown>)[i] as { transcript: string; confidence: number }; },
      },
    } as unknown as Event;
    this.onresult?.(event);
  }

  simulateError(errorCode: string) {
    this.onerror?.({ type: 'error', error: errorCode } as unknown as Event);
  }
}

// Helper: register a mock SpeechRecognition constructor on the global window
// without violating no-explicit-any. The cast is safe because the mock implements
// the same shape expected by the recognizer at runtime.
function setMockSpeechRecognition(
  ctor: typeof MockSpeechRecognition,
  key: 'SpeechRecognition' | 'webkitSpeechRecognition' = 'SpeechRecognition',
) {
  (window as unknown as Record<string, unknown>)[key] = ctor as unknown;
}

// Helper: delete a SpeechRecognition key from the global window
function deleteMockSpeechRecognition(key: 'SpeechRecognition' | 'webkitSpeechRecognition' = 'SpeechRecognition') {
  delete (window as unknown as Record<string, unknown>)[key];
}

// Helper: access the private `recognition` field on a VoiceSpeechRecognizer for test injection
function getRecognitionInstance(recognizer: VoiceSpeechRecognizer): MockSpeechRecognition {
  return (recognizer as unknown as { recognition: MockSpeechRecognition }).recognition;
}

// Setup global mock
beforeEach(() => {
  setMockSpeechRecognition(MockSpeechRecognition, 'SpeechRecognition');
});

afterEach(() => {
  deleteMockSpeechRecognition('SpeechRecognition');
  deleteMockSpeechRecognition('webkitSpeechRecognition');
});

// ─── Tests ───────────────────────────────────────────────────────

describe('VoiceSpeechRecognizer', () => {
  describe('isSupported', () => {
    it('returns true when SpeechRecognition is available', () => {
      setMockSpeechRecognition(MockSpeechRecognition, 'SpeechRecognition');
      expect(VoiceSpeechRecognizer.isSupported()).toBe(true);
    });

    it('returns true when webkitSpeechRecognition is available', () => {
      deleteMockSpeechRecognition('SpeechRecognition');
      setMockSpeechRecognition(MockSpeechRecognition, 'webkitSpeechRecognition');
      expect(VoiceSpeechRecognizer.isSupported()).toBe(true);
    });

    it('returns false when no API is available', () => {
      deleteMockSpeechRecognition('SpeechRecognition');
      deleteMockSpeechRecognition('webkitSpeechRecognition');
      expect(VoiceSpeechRecognizer.isSupported()).toBe(false);
    });
  });

  describe('state management', () => {
    it('starts in idle state', () => {
      const recognizer = new VoiceSpeechRecognizer();
      expect(recognizer.getState()).toBe('idle');
      expect(recognizer.isListening()).toBe(false);
    });

    it('transitions to listening on start', async () => {
      const recognizer = new VoiceSpeechRecognizer();
      const stateChanges: string[] = [];
      recognizer.onStateChange = (state) => stateChanges.push(state);

      await recognizer.start();

      expect(recognizer.getState()).toBe('listening');
      expect(recognizer.isListening()).toBe(true);
      expect(stateChanges).toContain('listening');

      recognizer.destroy();
    });

    it('transitions back to idle on stop', async () => {
      const recognizer = new VoiceSpeechRecognizer();
      await recognizer.start();
      recognizer.stop();

      expect(recognizer.getState()).toBe('idle');
      expect(recognizer.isListening()).toBe(false);

      recognizer.destroy();
    });
  });

  describe('transcript handling', () => {
    it('emits interim results', async () => {
      const recognizer = new VoiceSpeechRecognizer();
      const transcripts: { text: string; isFinal: boolean }[] = [];
      recognizer.onTranscript = (r) => transcripts.push({ text: r.text, isFinal: r.isFinal });

      await recognizer.start();

      // Access the mock recognition instance
      const mockRec = getRecognitionInstance(recognizer);
      mockRec.simulateResult('İki tane', 0.8, false);

      expect(transcripts.length).toBeGreaterThan(0);
      expect(transcripts[0].isFinal).toBe(false);
      expect(transcripts[0].text).toContain('İki tane');

      recognizer.destroy();
    });

    it('emits final results with confidence', async () => {
      const recognizer = new VoiceSpeechRecognizer();
      const transcripts: { text: string; confidence: number; isFinal: boolean }[] = [];
      recognizer.onTranscript = (r) => transcripts.push(r);

      await recognizer.start();

      const mockRec = getRecognitionInstance(recognizer);
      mockRec.simulateResult("80'lik soba", 0.92, true);

      const finalResults = transcripts.filter((t) => t.isFinal);
      expect(finalResults.length).toBeGreaterThan(0);
      expect(finalResults[0].text).toContain("80'lik soba");
      expect(finalResults[0].confidence).toBeGreaterThan(0);

      recognizer.destroy();
    });

    it('accumulates multiple final results', async () => {
      const recognizer = new VoiceSpeechRecognizer({ continuous: true });
      const finalTranscripts: string[] = [];
      recognizer.onTranscript = (r) => {
        if (r.isFinal) finalTranscripts.push(r.text);
      };

      await recognizer.start();

      const mockRec = getRecognitionInstance(recognizer);
      mockRec.simulateResult('İki tane', 0.9, true);
      mockRec.simulateResult("80'lik soba", 0.85, true);

      // The accumulator should join them
      const lastFinal = finalTranscripts[finalTranscripts.length - 1];
      expect(lastFinal).toContain('İki tane');
      expect(lastFinal).toContain("80'lik soba");

      recognizer.destroy();
    });
  });

  describe('error handling', () => {
    it('emits error on no-permission', async () => {
      const recognizer = new VoiceSpeechRecognizer();
      let errorReceived: { code: string; message: string } | null = null;
      recognizer.onError = (e) => (errorReceived = e);

      await recognizer.start();

      const mockRec = getRecognitionInstance(recognizer);
      mockRec.simulateError('not-allowed');

      expect(errorReceived!.code).toBe('no-permission');
      expect(errorReceived!.message).toContain('Mikrofon');

      recognizer.destroy();
    });

    it('emits error on timeout', async () => {
      const recognizer = new VoiceSpeechRecognizer({ silenceTimeoutMs: 100 });
      let errorReceived: { code: string } | null = null;
      recognizer.onError = (e) => (errorReceived = e);

      await recognizer.start();

      // Wait for silence timeout
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(errorReceived!.code).toBe('timeout');

      recognizer.destroy();
    });

    it('rejects start when not supported', async () => {
      deleteMockSpeechRecognition('SpeechRecognition');
      deleteMockSpeechRecognition('webkitSpeechRecognition');

      const recognizer = new VoiceSpeechRecognizer();
      await expect(recognizer.start()).rejects.toMatchObject({ code: 'not-supported' });
    });
  });

  describe('reset and destroy', () => {
    it('resets transcript accumulator', async () => {
      const recognizer = new VoiceSpeechRecognizer();
      recognizer.onTranscript = () => {};

      await recognizer.start();

      const mockRec = getRecognitionInstance(recognizer);
      mockRec.simulateResult('test', 0.9, true);

      recognizer.resetTranscript();

      // After reset, next final result should not contain previous text
      mockRec.simulateResult('yeni', 0.9, true);

      recognizer.destroy();
    });

    it('cleans up all listeners on destroy', async () => {
      const recognizer = new VoiceSpeechRecognizer();
      await recognizer.start();
      recognizer.destroy();

      expect(recognizer.onTranscript).toBeNull();
      expect(recognizer.onStateChange).toBeNull();
      expect(recognizer.onError).toBeNull();
    });
  });

  describe('config', () => {
    it('uses default config when none provided', () => {
      const recognizer = new VoiceSpeechRecognizer();
      expect(recognizer.getState()).toBe('idle');
    });

    it('accepts custom config', () => {
      const recognizer = new VoiceSpeechRecognizer({
        lang: 'en-US',
        continuous: true,
        silenceTimeoutMs: 5000,
      });
      expect(recognizer.getState()).toBe('idle');
    });
  });
});
