import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Send, Mic, Loader2, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';


interface NexusPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: { role: 'user' | 'assistant'; content: string }[];
  onSendMessage: (msg: string) => void;
  isListening: boolean;
  onToggleListen: () => void;
  isProcessing?: boolean;
}

export const NexusPanel: React.FC<NexusPanelProps> = ({ 
  isOpen, 
  onClose, 
  messages, 
  onSendMessage, 
  isListening, 
  onToggleListen,
  isProcessing 
}) => {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-y-0 right-0 w-full max-w-2xl z-[160] shadow-2xl border-l border-white/10 backdrop-blur-2xl bg-slate-950/90 flex flex-col"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg ring-1 ring-indigo-500/30">
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Soba Nexus AI</h2>
            <p className="text-xs text-slate-400 font-medium">Premium Analiz Merkezi</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg text-slate-400 hover:bg-white/5 transition-colors">
            <Settings2 className="w-5 h-5" />
          </button>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <div className="p-4 bg-white/5 rounded-full ring-1 ring-white/10">
              <BrainCircuitIcon className="w-12 h-12 text-slate-400" />
            </div>
            <div>
              <p className="text-slate-300 font-medium">Sizi dinliyorum...</p>
              <p className="text-xs text-slate-500">Verileriniz üzerinden derin analizler yapabilirim.</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "flex w-full",
                  m.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                <div className={cn(
                  "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed",
                  m.role === 'user'
                    ? "bg-indigo-600 text-white rounded-tr-none"
                    : "bg-slate-800/50 text-slate-200 border border-white/10 rounded-tl-none backdrop-blur-sm"
                )}>
                  {m.content}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-4 rounded-2xl rounded-tl-none bg-slate-800/50 border border-white/10 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Düşünüyor...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-white/10 bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-3 max-w-3xl mx-auto relative">
          <div className="relative flex-1">
            <textarea 
              ref={textareaRef}
              className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
              placeholder="Bir şey sorun..."
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>
          
          <button 
            onClick={onToggleListen}
            className={cn(
              "p-3 rounded-xl transition-all duration-300",
              isListening 
                ? "bg-red-500 text-white ring-4 ring-red-500/20" 
                : "bg-slate-800 text-slate-400 hover:text-white border border-white/10"
            )}
          >
            <Mic className="w-5 h-5" />
          </button>

           <button 
             onClick={handleSend}
             disabled={!inputValue.trim()}
             className={cn(
               "p-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20",
               inputValue.trim() 
                 ? "bg-indigo-600 text-white hover:bg-indigo-500" 
                 : "bg-slate-800 text-slate-600 cursor-not-allowed"
             )}
           >
             <Send className="w-5 h-5" />
           </button>

        </div>
        <p className="text-[10px] text-center text-slate-500 mt-4 font-medium uppercase tracking-widest">
          Soba Nexus AI • Powered by DeepSeek & Claude
        </p>
      </div>
    </motion.div>
  );
};

function BrainCircuitIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>
      <path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/>
      <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/>
      <path d="M3.477 10.896a4 4 0 0 1 .585-.396"/>
      <path d="M19.938 10.5a4 4 0 0 1 .585.396"/>
      <path d="M6 18a4 4 0 0 1-1.967-.516"/>
      <path d="M19.967 17.484A4 4 0 0 1 18 18"/>
    </svg>
  );
}
