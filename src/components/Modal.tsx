import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: number;
}

const isMobileDevice = () => window.innerWidth < 768;

export function Modal({ open, onClose, title, children, maxWidth = 560 }: ModalProps) {
  const mobile = isMobileDevice();

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  if (mobile) {
    // Mobilde bottom sheet
    return (
      <div
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        className="modal-overlay"
      >
        <div className="modal-sheet">
          {/* Handle */}
          <div className="modal-handle-wrap">
            <div className="modal-handle" />
          </div>
          {/* Header */}
          <div className="modal-header">
            <h3 className="modal-title">{title}</h3>
            <button
              onClick={onClose}
              className="modal-close-btn"
            >×</button>
          </div>
          <div className="modal-body">{children}</div>
        </div>

      </div>
    );
  }

  // Desktop — ortalanmış modal
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      className="modal-desktop-overlay"
    >
      <div
        className="modal-desktop-content"
        style={{ maxWidth }}
      >
        <div className="modal-desktop-header">
          <h3 className="modal-desktop-title">{title}</h3>
          <button
            onClick={onClose}
            className="modal-desktop-close-btn"
          >×</button>
        </div>
        <div className="modal-desktop-body">{children}</div>
      </div>

    </div>
  );
}
