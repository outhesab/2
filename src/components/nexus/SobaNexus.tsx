import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { useNexusVoice } from '@/lib/nexus/useNexusVoice';
import { nexusExecutive, type ExecutiveResult } from '@/lib/nexus/NexusExecutive';
import { sobaSentinel } from '@/lib/nexus/SobaSentinel';
import { NexusSpark } from './NexusSpark';
import { NexusBubble } from './NexusBubble';
import { NexusPanel } from './NexusPanel';
import { useDB } from '@/hooks/useDB';
import { loadUIPrefs } from '@/hooks/useUIPrefs';
import { logger } from '@/lib/logger';

const MEMORY_KEY = 'nexus_conversation_memory';

export const SobaNexus: React.FC = () => {
  const { db } = useDB();
  const [, setLocation] = useLocation();
  const { listen, stop, speak, isListening, isConversationMode, speakAndListen } = useNexusVoice();

  const [showAI, setShowAI] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isBubbleVisible, setIsBubbleVisible] = useState(false);
  const [bubbleMessage, setBubbleMessage] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isListeningRef = useRef(false);

  // Sync ref with state for use in callbacks
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  const showFeedback = (text: string) => {
    setFeedbackText(text);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedbackText(null), 3000);
  };

  const showBubble = (msg: string) => {
    setBubbleMessage(msg);
    setIsBubbleVisible(true);
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setIsBubbleVisible(false), 10000);
  };

  // Persist messages to localStorage
  const persistMessages = (msgs: { role: 'user' | 'assistant'; content: string }[]) => {
    try {
      // Keep last 20 messages for memory efficiency
      const recent = msgs.slice(-20);
      localStorage.setItem(MEMORY_KEY, JSON.stringify(recent));
    } catch {
      /* ignore quota errors */
    }
  };

  // Load messages from localStorage on mount
  useEffect(() => {
    const prefs = loadUIPrefs();
    setShowAI(prefs.showAIButton);

    try {
      const saved = localStorage.getItem(MEMORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setMessages(parsed);
      }
    } catch {
      /* ignore corrupt data */
    }

    // Initialize God-Mode Sentinel
    sobaSentinel.start(() => db);

    return () => {
      sobaSentinel.stop();
    };
  }, [db]);

  // ── Refs for circular-dependency-free function references ──
  const handleVoiceInputRef = useRef<((text: string) => Promise<void>) | null>(null);
  const handleResultRef = useRef<((result: ExecutiveResult) => Promise<void>) | null>(null);

  const executeWithTimeout = useCallback(
    async (text: string): Promise<ExecutiveResult> => {
      const timeoutPromise = new Promise<ExecutiveResult>((_, reject) =>
        setTimeout(() => reject(new Error('Nexus AI zaman aşımı (15sn)')), 15000),
      );
      return Promise.race([nexusExecutive.execute(text, db, { isFileContext: false }), timeoutPromise]);
    },
    [db],
  );

  // Assign implementations to refs every render (fresh closures, no circular deps)
  handleResultRef.current = async (result: ExecutiveResult) => {
    setIsProcessing(false);
    if (result.navigation) {
      setLocation(result.navigation.path);
    }
    const responseText = result.response || '❌ Yanıt alınamadı, lütfen tekrar deneyin.';
    setMessages((prev) => {
      const updated = [...prev, { role: 'assistant' as const, content: responseText }];
      persistMessages(updated);
      return updated;
    });
    if (!isPanelOpen) {
      showBubble(responseText);
    }
    showFeedback('✅ Tamamlandı');
    if (isConversationMode) {
      await speakAndListen(
        responseText,
        (text) => handleVoiceInputRef.current!(text),
        (err) => {
          logger.error('voice', 'Conversation loop error', { error: err });
          showFeedback('❌ ' + err);
        },
      );
    } else {
      await speak(responseText);
    }
  };

  handleVoiceInputRef.current = async (text: string) => {
    if (!text.trim()) return;
    showFeedback('🎤 Ses algılandı, işleniyor...');
    setIsProcessing(true);
    setMessages((prev) => {
      const updated = [...prev, { role: 'user' as const, content: text }];
      persistMessages(updated);
      return updated;
    });
    try {
      const result = await executeWithTimeout(text);
      await handleResultRef.current!(result);
    } catch (err) {
      setIsProcessing(false);
      const errMsg = '❌ ' + (err instanceof Error ? err.message : 'Bilinmeyen hata');
      setMessages((prev) => {
        const updated = [...prev, { role: 'assistant' as const, content: errMsg }];
        persistMessages(updated);
        return updated;
      });
      showFeedback(errMsg);
      await speak(errMsg);
      if (isConversationMode) {
        setTimeout(async () => {
          await listen(
            (text) => handleVoiceInputRef.current!(text),
            (err) => showFeedback('❌ ' + err),
          );
        }, 1000);
      }
    }
  };

  // Stable public API (zero-dependency wrappers that delegate to refs)
  const handleResult = useCallback((result: ExecutiveResult) => handleResultRef.current!(result), []);
  const handleVoiceInput = useCallback((text: string) => handleVoiceInputRef.current!(text), []);

  const toggleListening = useCallback(async () => {
    if (isListening) {
      stop();
      showFeedback('⏹️ Dinleme durduruldu');
    } else {
      showFeedback('🎤 Dinleniyor...');
      try {
        await listen(
          (text) => handleVoiceInput(text),
          (error) => {
            logger.error('voice', 'Nexus Voice Error:', error);
            showFeedback('❌ Ses hatası: ' + error);
          },
        );
      } catch {
        showFeedback('❌ Mikrofon hatası');
      }
    }
  }, [isListening, listen, stop, handleVoiceInput]);

  const handleSparkClick = useCallback(async () => {
    if (!isPanelOpen) {
      setIsPanelOpen(true);
      // Small delay for panel animation, then start conversation mode
      setTimeout(async () => {
        showFeedback('🎤 Sizi dinliyorum...');
        try {
          await listen(
            (text) => handleVoiceInput(text),
            (error) => showFeedback('❌ ' + error),
          );
        } catch {
          showFeedback('❌ Mikrofon hatası');
        }
      }, 300);
    } else {
      await toggleListening();
    }
  }, [isPanelOpen, toggleListening, listen, handleVoiceInput]);

  const clearMemory = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(MEMORY_KEY);
    showFeedback('🧠 Hafıza temizlendi');
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      showFeedback('🤖 İşleniyor...');
      setIsProcessing(true);
      setMessages((prev) => {
        const updated = [...prev, { role: 'user' as const, content: text }];
        persistMessages(updated);
        return updated;
      });

      try {
        const result = await executeWithTimeout(text);
        await handleResult(result);
      } catch (err) {
        setIsProcessing(false);
        const errMsg = '❌ ' + (err instanceof Error ? err.message : 'Bilinmeyen hata');
        setMessages((prev) => {
          const updated = [...prev, { role: 'assistant' as const, content: errMsg }];
          persistMessages(updated);
          return updated;
        });
        showFeedback(errMsg);
        await speak(errMsg);
      }
    },
    [speak, handleResult, executeWithTimeout],
  );

  return (
    <>
      {feedbackText && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-black/85 text-white px-5 py-2 rounded-full text-sm z-[10001] pointer-events-none transition-opacity duration-300 whitespace-nowrap font-medium">
          {feedbackText}
        </div>
      )}
      {!showAI ? null : (
        <>
          <NexusSpark
            isOpen={isPanelOpen}
            isProcessing={isProcessing}
            onClick={handleSparkClick}
            isListening={isListening}
          />

          <NexusBubble
            isVisible={isBubbleVisible}
            message={bubbleMessage}
            onClose={() => setIsBubbleVisible(false)}
            onExpand={() => {
              setIsBubbleVisible(false);
              setIsPanelOpen(true);
            }}
          />

          <AnimatePresence>
            {isPanelOpen && (
              <NexusPanel
                isOpen={isPanelOpen}
                onClose={() => setIsPanelOpen(false)}
                messages={messages}
                onSendMessage={sendMessage}
                isListening={isListening}
                onToggleListen={toggleListening}
                isProcessing={isProcessing}
                onClearMemory={clearMemory}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </>
  );
};
