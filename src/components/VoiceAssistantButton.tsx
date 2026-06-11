import { Mic } from 'lucide-react';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';

export const VoiceAssistantButton = () => {
  const { isListening, startListening, stopListening } = useVoiceAssistant();

  return (
    <button
      onClick={isListening ? stopListening : startListening}
      title="Sesli Asistan"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: '50%',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        zIndex: 100,
        transition: 'all 0.3s ease',
        background: isListening ? '#ef4444' : '#ff5722',
        color: '#fff',
        transform: isListening ? 'scale(1.1)' : 'scale(1)',
      }}
    >
      <Mic size={24} />
      {isListening && (
        <span
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: '2px solid #ef4444',
            animation: 'voice-pulse 1.5s infinite',
          }}
        />
      )}
      <style>{`
        @keyframes voice-pulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </button>
  );
};
