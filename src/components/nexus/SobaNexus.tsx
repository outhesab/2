import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { useNexusVoice } from '@/lib/nexus/useNexusVoice';
import { nexusExecutive } from '@/lib/nexus/NexusExecutive';
import { sobaSentinel } from '@/lib/nexus/SobaSentinel';
import { NexusSpark } from './NexusSpark';
import { NexusBubble } from './NexusBubble';
import { NexusPanel } from './NexusPanel';
import { useDB } from '@/hooks/useDB';
import { loadUIPrefs } from '@/hooks/useUIPrefs';

export const SobaNexus: React.FC = () => {
  const { db } = useDB();
  const [, setLocation] = useLocation();
  const { listen, stop, speak, isListening } = useNexusVoice();
  
  const [showAI, setShowAI] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isBubbleVisible, setIsBubbleVisible] = useState(false);
  const [bubbleMessage, setBubbleMessage] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    const prefs = loadUIPrefs();
    setShowAI(prefs.showAIButton);

    // Initialize God-Mode Sentinel
    sobaSentinel.start(() => db);

    return () => {
      sobaSentinel.stop();
    };
  }, [db]);

  const executeWithTimeout = async (text: string): Promise<ExecutiveResult> => {
    const timeoutPromise = new Promise<ExecutiveResult>((_, reject) =>
      setTimeout(() => reject(new Error('Nexus AI zaman aşımı (15sn)')), 15000)
    );
    return Promise.race([
      nexusExecutive.execute(text, db, { isFileContext: false }),
      timeoutPromise,
    ]);
  };

  const handleVoiceInput = useCallback(async (text: string) => {
    if (!text.trim()) return;
    showFeedback('🎤 Ses algılandı, işleniyor...');
    setIsProcessing(true);
    setMessages(prev => [...prev, { role: 'user', content: text }]);

    try {
      const result = await executeWithTimeout(text);
      setIsProcessing(false);

      if (result.navigation) {
        setLocation(result.navigation.path);
      }

      const responseText = result.response || '❌ Yanıt alınamadı, lütfen tekrar deneyin.';
      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);

      if (!isPanelOpen) {
        showBubble(responseText);
      }

      await speak(responseText);
      showFeedback('✅ Tamamlandı');
    } catch (err) {
      setIsProcessing(false);
      const errMsg = '❌ ' + (err instanceof Error ? err.message : 'Bilinmeyen hata');
      setMessages(prev => [...prev, { role: 'assistant', content: errMsg }]);
      showFeedback(errMsg);
    }
  }, [db, speak, isPanelOpen, setLocation]);

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
            console.error('Nexus Voice Error:', error);
            showFeedback('❌ Ses hatası: ' + error);
          }
        );
      } catch (err) {
        showFeedback('❌ Mikrofon hatası');
      }
    }
  }, [isListening, listen, stop, handleVoiceInput]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    showFeedback('🤖 İşleniyor...');
    setIsProcessing(true);
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    
    try {
      const result = await executeWithTimeout(text);

      setIsProcessing(false);
      
      if (result.navigation) {
        setLocation(result.navigation.path);
      }

      const responseText = result.response || '❌ Yanıt alınamadı, lütfen tekrar deneyin.';
      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
      
      if (!isPanelOpen) {
        showBubble(responseText);
      }
      
      await speak(responseText);
      showFeedback('✅ Tamamlandı');
    } catch (err) {
      setIsProcessing(false);
      const errMsg = '❌ ' + (err instanceof Error ? err.message : 'Bilinmeyen hata');
      setMessages(prev => [...prev, { role: 'assistant', content: errMsg }]);
      showFeedback(errMsg);
    }
  }, [db, speak, isPanelOpen, setLocation, executeWithTimeout]);

  return (
    <>
      {feedbackText && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.85)',
          color: '#fff',
          padding: '8px 20px',
          borderRadius: '20px',
          fontSize: '14px',
          zIndex: 10001,
          pointerEvents: 'none',
          transition: 'opacity 0.3s',
          whiteSpace: 'nowrap',
          fontWeight: 500,
        }}>
          {feedbackText}
        </div>
      )}
      {!showAI ? null : (
        <>
          <NexusSpark 
            isOpen={isPanelOpen}
            isProcessing={isProcessing}
            onClick={() => setIsPanelOpen(prev => !prev)}
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
              />
            )}
          </AnimatePresence>
        </>
      )}
    </>
  );
};
