import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  danger?: boolean;
  variant?: 'danger' | 'warning' | 'info' | 'success';
}

interface ConfirmContextType {
  showConfirm: (title: string, message: string, onConfirm: () => void, danger?: boolean) => void;
}

const ConfirmContext = createContext<ConfirmContextType>({ showConfirm: () => {} });

const VARIANT_ICONS: Record<string, string> = {
  danger: '🗑️',
  warning: '⚠️',
  info: 'ℹ️',
  success: '✅',
};

const VARIANT_CLASSES: Record<string, string> = {
  danger: 'danger',
  warning: 'warning',
  info: 'info',
  success: 'success',
};

function getVariant(danger?: boolean, title?: string): 'danger' | 'warning' | 'info' | 'success' {
  if (danger) return 'danger';
  const t = (title || '').toLowerCase();
  if (t.includes('sil') || t.includes('iptal') || t.includes('kaldır')) return 'danger';
  if (t.includes('uyarı') || t.includes('dikkat') || t.includes('onayla')) return 'warning';
  if (t.includes('başarı') || t.includes('tamamlandı')) return 'success';
  return 'info';
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
    danger: true,
    variant: 'danger',
  });

  const showConfirm = useCallback((title: string, message: string, onConfirm: () => void, danger = true) => {
    const variant = getVariant(danger, title);
    setState({ open: true, title, message, onConfirm, danger, variant });
  }, []);

  const handleConfirm = () => {
    state.onConfirm();
    setState((s) => ({ ...s, open: false }));
  };
  const handleCancel = () => setState((s) => ({ ...s, open: false }));

  const icon = VARIANT_ICONS[state.variant || 'danger'];
  const variantClass = VARIANT_CLASSES[state.variant || 'danger'];
  const isDanger = state.variant === 'danger';

  return (
    <ConfirmContext.Provider value={{ showConfirm }}>
      {children}
      <AnimatePresence>
        {state.open && (
          <motion.div
            key="confirm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={handleCancel}
            className="confirm-overlay"
          >
            <motion.div
              key="confirm-panel"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350, mass: 0.8 }}
              onClick={(e) => e.stopPropagation()}
              className="confirm-panel"
            >
              <div className={`confirm-icon-wrap ${variantClass}`}>{icon}</div>
              <h3 className="confirm-title">{state.title}</h3>
              <p className="confirm-message">{state.message}</p>
              <div className="confirm-actions">
                <button onClick={handleCancel} className="confirm-btn confirm-btn-cancel">
                  İptal
                </button>
                <button
                  onClick={handleConfirm}
                  className={`confirm-btn ${isDanger ? 'confirm-btn-danger' : 'confirm-btn-primary'}`}
                >
                  {isDanger ? '🗑️ Evet, Sil' : '✓ Onayla'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}
