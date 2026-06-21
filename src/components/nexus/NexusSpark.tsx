import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NexusSparkProps {
  isOpen: boolean;
  onClick: () => void;
  isListening: boolean;
  isProcessing: boolean;
}

export const NexusSpark: React.FC<NexusSparkProps> = ({ isOpen, onClick, isListening, isProcessing }) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="fixed bottom-6 right-6 z-[150] flex items-center justify-center"
    >
      {/* God-Mode Permanent Aura */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
          rotate: [0, 90, 180, 270, 360],
        }}
        transition={{
          duration: isProcessing ? 2 : 8,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute inset-[-20px] bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-full blur-2xl opacity-40"
      />

      {/* Processing Pulse Effect */}
      {isProcessing && (
        <motion.div
          animate={{
            scale: [1, 2.5, 1],
            opacity: [0.6, 0.1, 0.6],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 bg-amber-400 rounded-full blur-xl"
        />
      )}

      {/* Listening Pulse Effect */}
      {isListening && !isProcessing && (
        <motion.div
          animate={{
            scale: [1, 2, 1],
            opacity: [0.6, 0.2, 0.6],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 bg-indigo-400 rounded-full blur-xl"
        />
      )}

      {/* Main Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={cn(
          "relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300",
          "bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900",
          "border border-white/10 backdrop-blur-md",
          isListening ? "ring-4 ring-indigo-500/30" : isProcessing ? "ring-4 ring-amber-500/30" : "ring-1 ring-white/20"
        )}
      >
        {isProcessing ? (
          <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
        ) : (
          <BrainCircuit 
            className={cn(
              "w-6 h-6 transition-colors duration-300",
              isListening ? "text-indigo-400" : "text-indigo-200/70"
            )} 
          />
        )}
        
        {/* Subtle Inner Shine */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
      </motion.button>
    </motion.div>
  );
};
