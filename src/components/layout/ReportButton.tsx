import { useState, useEffect, useRef } from 'react';
import { useDraggableButton } from '@/hooks/useDraggableButton';

interface ReportButtonProps {
  visible: boolean;
}

export default function ReportButton({ visible }: ReportButtonProps) {
  const { pos, onPointerDown, onPointerMove, onPointerUp, isDragging } = useDraggableButton('reportBtnPos', {
    x: 90,
    y: 28,
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: 'hata', note: '', contact: '' });
  const [sent, setSent] = useState(false);
  const [pulse, setPulse] = useState(0);
  const reportBtnRef = useRef<HTMLButtonElement>(null);
  const reportPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setPulse((p) => (p + 1) % 3), 1200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!visible) return;
    if (reportBtnRef.current) {
      reportBtnRef.current.style.bottom = `${pos.y}px`;
      reportBtnRef.current.style.left = `${pos.x}px`;
    }
    if (reportPanelRef.current) {
      reportPanelRef.current.style.bottom = `${pos.y + 56}px`;
      reportPanelRef.current.style.left = `${Math.min(pos.x, window.innerWidth - 320)}px`;
    }
  }, [pos, open, visible]);

  if (!visible) return null;

  const icons = ['🐛', '⚠️', '💡'];
  const icon = icons[pulse];

  const handleSend = () => {
    if (!form.note.trim()) return;
    const reports = JSON.parse(localStorage.getItem('sobaReports') || '[]');
    reports.push({ ...form, time: new Date().toISOString(), url: window.location.href });
    localStorage.setItem('sobaReports', JSON.stringify(reports.slice(-50)));
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setOpen(false);
      setForm({ type: 'hata', note: '', contact: '' });
    }, 2000);
  };

  return (
    <>
      <button
        ref={reportBtnRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={() => {
          if (!isDragging.current) setOpen((o) => !o);
        }}
        aria-label="Hata bildir veya not al"
        title="Hata Bildir / Not Al"
        className="report-btn"
      >
        {icon}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} className="report-overlay" />
          <div ref={reportPanelRef} className="report-panel">
            <div className="report-title">📋 Bildir / Not Al</div>
            {sent ? (
              <div className="report-sent">✅ Kaydedildi!</div>
            ) : (
              <>
                <div className="report-type-row">
                  {[
                    { v: 'hata', l: '🐛 Hata' },
                    { v: 'oneri', l: '💡 Öneri' },
                    { v: 'not', l: '📝 Not' },
                    { v: 'takip', l: '👁️ Takip' },
                  ].map((t) => (
                    <button
                      key={t.v}
                      onClick={() => setForm((f) => ({ ...f, type: t.v }))}
                      className={`report-type-btn ${form.type === t.v ? 'active' : ''}`}
                    >
                      {t.l}
                    </button>
                  ))}
                </div>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder="Açıklama, not veya hata detayı..."
                  className="report-textarea"
                />
                <input
                  value={form.contact}
                  onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
                  placeholder="İletişim (opsiyonel)"
                  className="report-contact"
                />
                <button
                  onClick={handleSend}
                  disabled={!form.note.trim()}
                  className={`report-save-btn ${form.note.trim() ? 'enabled' : 'disabled'}`}
                >
                  💾 Kaydet
                </button>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
