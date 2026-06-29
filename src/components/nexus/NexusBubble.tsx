import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NexusBubbleProps {
  isVisible: boolean;
  message: string;
  onClose: () => void;
  onExpand: () => void;
}

export const NexusBubble: React.FC<NexusBubbleProps> = ({ isVisible, message, onClose, onExpand }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-24 right-6 z-[149] max-w-xs w-full"
        >
          <div
            className={cn(
              'relative p-4 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-xl',
              'bg-slate-900/80 text-slate-100',
              'ring-1 ring-white/5',
            )}
          >
            <button
              onClick={onClose}
              className="absolute -top-2 -right-2 p-1 rounded-full bg-slate-800 border border-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-3 h-3" />
            </button>

            <div className="text-sm leading-relaxed font-medium text-slate-200">{message}</div>

            <button
              onClick={onExpand}
              className="mt-3 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 uppercase tracking-wider"
            >
              Detayları Gör <span>→</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
