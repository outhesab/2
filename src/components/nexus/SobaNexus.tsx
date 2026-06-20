import React, { useState, useCallback, useEffect } from 'react';
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

  useEffect(() => {
    const prefs = loadUIPrefs();
    setShowAI(prefs.showAIButton);

    // Initialize God-Mode Sentinel
    sobaSentinel.start(() => db);

    return () => {
      sobaSentinel.stop();
    };
  }, [db]);

  const handleVoiceInput = useCallback(async (text: string) => {
    // 1. Add user message to history
    setMessages(prev => [...prev, { role: 'user', content: text }]);

    // 2. Route the request through Executive (God-Mode)
    const result = await nexusExecutive.execute(text, db, {
      isFileContext: false,
    });

    // 3. Handle Navigation if requested
    if (result.navigation) {
      setLocation(result.navigation.path);
    }

    // 4. Handle response
    const responseText = result.response;
    setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
    
    // Decide whether to show in Bubble or Panel
    if (responseText.length < 150 && !isPanelOpen) {
      setBubbleMessage(responseText);
      setIsBubbleVisible(true);
    }
    
    // Always speak the result
    await speak(responseText);
  }, [db, speak, isPanelOpen, setLocation]);


  const toggleListening = useCallback(async () => {
    if (isListening) {
      stop();
    } else {
      await listen(
        (text) => handleVoiceInput(text),
        (error) => console.error('Nexus Voice Error:', error),
        () => {}
      );
    }
  }, [isListening, listen, stop, handleVoiceInput]);

  const sendMessage = useCallback(async (text: string) => {
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    const result = await nexusExecutive.execute(text, db, {
      isFileContext: false,
    });
    
    if (result.navigation) {
      setLocation(result.navigation.path);
    }

    const responseText = result.response;
    setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
    await speak(responseText);
  }, [db, speak, setLocation]);

  return (
    <>
      {!showAI ? null : (
        <>
          <NexusSpark 
            isOpen={isPanelOpen} 
            onClick={toggleListening} 
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
              />
            )}
          </AnimatePresence>
        </>
      )}
    </>
  );
};

