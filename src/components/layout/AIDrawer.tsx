import { useEffect } from 'react';
import AIAsistan from '@/pages/AIAsistan';
import type { DB } from '@/types';

interface AIDrawerProps {
  open: boolean;
  onClose: () => void;
  db: DB;
  save: (fn: (prev: DB) => DB) => void;
}

export default function AIDrawer({ open, onClose, db, save }: AIDrawerProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <>
      <div onClick={onClose} className={`ai-drawer-backdrop ${open ? 'open' : ''}`} />
      <div className={`ai-drawer-panel ${open ? 'open' : ''}`}>
        <div className="ai-drawer-header">
          <div className="ai-drawer-badge">🤖</div>
          <div className="ai-drawer-head-main">
            <div className="ai-drawer-title">Soba AI Asistan</div>
            <div className="ai-drawer-subtitle">DeepSeek · Claude · Gemini · Çevrimdışı</div>
          </div>
          <button onClick={onClose} className="ai-drawer-close">×</button>
        </div>
        <div className="ai-drawer-content">
          <AIAsistan db={db} save={save} embedded />
        </div>
      </div>
    </>
  );
}
