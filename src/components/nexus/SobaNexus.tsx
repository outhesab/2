import React, { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNexusVoice } from '@/lib/nexus/useNexusVoice';
import { nexusRouter } from '@/lib/nexus/NexusRouter';
import { NexusSpark } from './NexusSpark';
import { NexusBubble } from './NexusBubble';
import { NexusPanel } from './NexusPanel';
import { useDB } from '@/hooks/useDB';

export const SobaNexus: React.FC = () => {
  const { db } = useDB();
  const { listen, stop, speak, isListening } = useNexusVoice();
  
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isBubbleVisible, setIsBubbleVisible] = useState(false);
  const [bubbleMessage, setBubbleMessage] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);

  const handleVoiceInput = useCallback(async (text: string) => {
    // 1. Add user message to history
    setMessages(prev => [...prev, { role: 'user', content: text }]);

    // 2. Route the request
    const result = await nexusRouter.route(text, db, {
      isFileContext: false, // We can enhance this by checking current route/page
    });

    // 3. Handle result based on type
    if (result.type === 'fast' || result.type === 'smart') {
      const responseText = result.response as string;
      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
      
      // Decide whether to show in Bubble or Panel
      if (responseText.length < 150 && !isPanelOpen) {
        setBubbleMessage(responseText);
        setIsBubbleVisible(true);
      }
      
      // Always speak the result
      await speak(responseText);
    } 
    else if (result.type === 'action') {
      // In a real scenario, we would call the Agent here.
      // For now, we acknowledge the action.
      const actionMsg = `İşlem anlaşıldı: ${result.response as string}. Hemen uyguluyorum...`;
      setMessages(prev => [...prev, { role: 'assistant', content: actionMsg }]);
      await speak(actionMsg);
    }
  }, [db, speak, isPanelOpen]);

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
    const result = await nexusRouter.route(text, db, {
      isFileContext: false, // We can enhance this by checking current route/page
    });
    
    if (result.type === 'fast' || result.type === 'smart') {
      const responseText = result.response as string;
      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
      await speak(responseText);
    } else if (result.type === 'action') {
      const actionMsg = `İşlem anlaşıldı: ${result.response as string}. Hemen uyguluyorum...`;
      setMessages(prev => [...prev, { role: 'assistant', content: actionMsg }]);
      await speak(actionMsg);
    }
  }, [db, speak]);

  return (
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
  );
};
