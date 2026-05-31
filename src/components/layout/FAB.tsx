import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useRef, useEffect } from 'react';
import { useDraggableButton } from '@/hooks/useDraggableButton';
import { Modal } from '@/components/Modal';
import { QuickSaleModal } from '@/components/QuickSaleModal';
import { QuickIncomeModal } from '@/components/QuickIncomeModal';
import { QuickProductModal } from '@/components/QuickProductModal';
import type { DB } from '@/types';
import type { UIPrefs } from '@/hooks/useUIPrefs';

interface FABProps {
  db: DB;
  save: (fn: (prev: DB) => DB) => void;
  onOpenAI: () => void;
  uiPrefs: UIPrefs;
}

type QuickModal = 'sale' | 'gelir' | 'gider' | 'product' | null;

export default function FAB({ db, save, onOpenAI, uiPrefs }: FABProps) {
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState<QuickModal>(null);
  const aiBtnRef = useRef<HTMLButtonElement>(null);
  const fabWrapRef = useRef<HTMLDivElement>(null);

  const fab = useDraggableButton('fabBtnPos', { x: 28, y: 28 });
  const ai = useDraggableButton('aiBtnPos', { x: 28, y: 28 });

  const actions = [
    { id: 'sale' as const, label: 'Hızlı Satış', icon: '🛒', color: '#ff5722' },
    { id: 'product' as const, label: 'Ürün Ekle', icon: '📦', color: '#3b82f6' },
    { id: 'gelir' as const, label: 'Gelir Ekle', icon: '💚', color: '#10b981' },
    { id: 'gider' as const, label: 'Gider Ekle', icon: '🔴', color: '#ef4444' },
  ];

  const titles: Record<string, string> = {
    sale: '🛒 Hızlı Satış',
    gelir: '💚 Hızlı Gelir',
    gider: '🔴 Hızlı Gider',
    product: '📦 Hızlı Ürün Ekle',
  };

  useEffect(() => {
    if (aiBtnRef.current) {
      aiBtnRef.current.style.bottom = `${ai.pos.y}px`;
      aiBtnRef.current.style.left = `${ai.pos.x}px`;
    }
    if (fabWrapRef.current) {
      fabWrapRef.current.style.bottom = `${fab.pos.y}px`;
      fabWrapRef.current.style.right = `${fab.pos.x}px`;
    }
  }, [ai.pos, fab.pos]);

  return (
    <>
      {open && <div onClick={() => setOpen(false)} className="fab-overlay" />}
      {uiPrefs.showAIButton && (
        <button
          ref={aiBtnRef}
          onPointerDown={ai.onPointerDown}
          onPointerMove={ai.onPointerMove}
          onPointerUp={ai.onPointerUp}
          onClick={() => { if (!ai.isDragging.current) onOpenAI(); }}
          aria-label="AI Asistanı aç"
          title="AI Asistan"
          className="fab-ai-btn"
        >
          🤖
        </button>
      )}
      {uiPrefs.showFABButton && (
        <div ref={fabWrapRef} className="fab-wrap">
          {open && actions.map((a) => (
            <div key={a.id} className="fab-action-row">
              <div className="fab-action-label">{a.label}</div>
              <button onClick={() => { setModal(a.id); setOpen(false); }} className={`fab-action-btn fab-action-${a.id}`}>
                {a.icon}
              </button>
            </div>
          ))}
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onPointerDown={fab.onPointerDown}
                  onPointerMove={fab.onPointerMove}
                  onPointerUp={fab.onPointerUp}
                  onClick={() => { if (!fab.isDragging.current) setOpen((o) => !o); }}
                  className={`fab-main-btn ${open ? 'open' : ''}`}
                  aria-label="Hızlı işlemler menüsünü aç"
                >
                  +
                </button>
              </TooltipTrigger>
              <TooltipContent>Hızlı işlemler</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
      {modal && (
        <Modal open={true} onClose={() => setModal(null)} title={titles[modal] || ''} maxWidth={480}>
          {modal === 'sale' && <QuickSaleModal db={db} save={save} onClose={() => setModal(null)} />}
          {modal === 'gelir' && <QuickIncomeModal db={db} save={save} onClose={() => setModal(null)} type="gelir" />}
          {modal === 'gider' && <QuickIncomeModal db={db} save={save} onClose={() => setModal(null)} type="gider" />}
          {modal === 'product' && <QuickProductModal db={db} save={save} onClose={() => setModal(null)} />}
        </Modal>
      )}
    </>
  );
}
