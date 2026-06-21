import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, MessageSquare, Settings, X } from 'lucide-react';
import type { VoiceAgentState } from '@/hooks/useVoiceAgent';

interface VoiceAgentUIProps {
  state: VoiceAgentState;
  onToggleMic: () => void;
  transcript?: string;
  response?: string;
  onClose?: () => void;
}

export default function VoiceAgentUI({ 
  state, 
  onToggleMic, 
  transcript, 
  response,
  onClose 
}: VoiceAgentUIProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Duruma göre renk ve animasyon ayarları
  const stateConfigs = {
    idle: {
      color: 'from-amber-500 to-orange-600',
      glow: 'shadow-[0_0_50px_rgba(245,158,11,0.3)]',
      scale: [1, 1.05, 1],
      transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
    },
    listening: {
      color: 'from-red-500 to-orange-500',
      glow: 'shadow-[0_0_80px_rgba(239,68,68,0.5)]',
      scale: [1, 1.2, 1],
      transition: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' }
    },
    processing: {
      color: 'from-blue-500 to-purple-600',
      glow: 'shadow-[0_0-60px_rgba(59,130,246,0.5)]',
      scale: [1, 1.1, 1],
      transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
    },
    speaking: {
      color: 'from-yellow-400 to-amber-600',
      glow: 'shadow-[0_0_100px_rgba(251,191,36,0.6)]',
      scale: [1, 1.15, 1],
      transition: { duration: 0.4, repeat: Infinity, ease: 'easeInOut' }
    },
    error: {
      color: 'from-red-600 to-red-800',
      glow: 'shadow-[0_0_60px_rgba(220,38,38,0.5)]',
      scale: [1, 0.9, 1],
      transition: { duration: 0.3, repeat: Infinity, ease: 'easeInOut' }
    }
  };

  const config = stateConfigs[state];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl overflow-hidden">
      {/* Arka Plan Efektleri */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-500/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Kapatma Butonu */}
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all z-10"
        >
          <X size={24} />
        </button>
      )}

      <div className="relative flex flex-col items-center justify-center w-full max-w-2xl px-6">
        
        {/* Ana Aura / Orb */}
        <div className="relative mb-16">
          {/* Dış Halkalar (Sadece Dinlerken ve Konuşurken) */}
          <AnimatePresence>
            {state === 'listening' && (
              <>
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 2, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-full border-2 border-red-500/30" 
                />
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
                  className="absolute inset-0 rounded-full border-2 border-orange-500/20" 
                />
              </>
            )}
          </AnimatePresence>

          {/* Merkez Orb */}
          <motion.div
            animate={{ 
              scale: config.scale,
              backgroundColor: `var(--tw-gradient-from)` 
            }}
            transition={config.transition}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`
              relative z-10 w-48 h-48 rounded-full 
              bg-gradient-to-br ${config.color} 
              ${config.glow}
              cursor-pointer transition-all duration-500
              ${isHovered ? 'scale-110' : ''}
            `}
            onClick={onToggleMic}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/20 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              {state === 'idle' && <Mic size={48} className="text-white/80" />}
              {state === 'listening' && <div className="flex gap-1">
                {[1,2,3,4,5].map(i => (
                  <motion.div 
                    key={i}
                    animate={{ height: [10, 30, 10] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                    className="w-1.5 bg-white rounded-full"
                  />
                ))}
               </div>}
              {state === 'processing' && (
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-12 h-12 border-4 border-t-transparent border-white rounded-full"
                />
              )}
              {state === 'speaking' && <Volume2 size={48} className="text-white animate-bounce" />}
            </div>
          </motion.div>
        </div>

        {/* Metin Alanları */}
        <div className="text-center space-y-6 w-full">
          <AnimatePresence mode="wait">
            {state === 'idle' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                className="text-white/60 text-xl font-medium"
              >
                Sizi dinlemek için hazırım...
              </motion.div>
            )}
            {state === 'listening' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                className="text-white text-2xl font-bold italic"
              >
                {transcript || "Dinliyorum..."}
              </motion.div>
            )}
            {state === 'processing' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                className="text-blue-400 text-xl font-medium animate-pulse"
              >
                Saniyeler içinde yanıtlıyorum...
              </motion.div>
            )}
            {state === 'speaking' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                className="text-amber-400 text-2xl font-bold leading-relaxed max-w-lg mx-auto"
              >
                {response || "Yanıtlanıyor..."}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Alt Kontroller (Glassmorphism) */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 p-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-6 py-3">
          <button className="p-2 text-white/40 hover:text-white transition-colors" aria-label="Ayarlar">
            <Settings size={20} />
          </button>
          <div className="w-px h-6 bg-white/10" />
          <button 
            onClick={onToggleMic}
            className={`p-4 rounded-full transition-all ${state === 'idle' ? 'bg-orange-500 shadow-lg shadow-orange-500/40' : 'bg-white/10'}`}
          >
            {state === 'idle' ? <Mic size={24} className="text-white" /> : <MicOff size={24} className="text-white" />}
          </button>
          <div className="w-px h-6 bg-white/10" />
          <button className="p-2 text-white/40 hover:text-white transition-colors" aria-label="Mesaj">
            <MessageSquare size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
