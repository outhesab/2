import { useState, useEffect, useCallback, useRef } from 'react';
import type { DB } from '@/types';
import { generateNotifications, getUnreadCount, type AppNotification, type NotifSeverity, type NotifCategory } from '@/lib/notificationEngine';

const DISMISSED_KEY = 'sobaYonetim_dismissedNotifs';
const REFRESH_MS = 5 * 60 * 1000; // 5 dakika

const SEV_STYLE: Record<NotifSeverity, { border: string; bg: string; dot: string; label: string }> = {
  critical: { border: 'var(--color-danger-soft)', bg: 'var(--color-danger-soft)', dot: 'var(--color-danger)', label: 'Kritik' },
  warning:  { border: 'var(--color-warning-soft)',  bg: 'var(--color-warning-soft)', dot: 'var(--color-warning)', label: 'Uyarı'  },
  info:     { border: 'var(--color-info-soft)',  bg: 'var(--color-info-soft)', dot: 'var(--color-info)', label: 'Bilgi'  },
};

const CAT_LABEL: Record<NotifCategory, string> = {
  stok: '📦 Stok', kasa: '💰 Kasa', cari: '👤 Cari',
  siparis: '🚚 Sipariş', fatura: '🧾 Fatura', sistem: '⚙️ Sistem',
};

interface Props {
  db: DB;
  onNavigate: (tab: string) => void;
}

function loadDismissed(): Set<string> {
  try {
    const raw = sessionStorage.getItem(DISMISSED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveDismissed(set: Set<string>) {
  try { sessionStorage.setItem(DISMISSED_KEY, JSON.stringify([...set])); } catch { /* sessizce geç */ }
}

export default function NotificationCenter({ db, onNavigate }: Props) {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<AppNotification[]>(() => generateNotifications(db));
  const [dismissed, setDismissed] = useState<Set<string>>(loadDismissed);
  const [lastRefresh, setLastRefresh] = useState(() => new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
  const panelRef = useRef<HTMLDivElement>(null);

  // DB değişince veya periyodik olarak yenile
  const refresh = useCallback(() => {
    setNotifs(generateNotifications(db));
    setLastRefresh(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
  }, [db]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const t = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(t);
  }, [refresh]);

  // Panel dışı tıklamada kapat
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    const t = setTimeout(() => document.addEventListener('mousedown', h), 50);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', h); };
  }, [open]);

  // ESC
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const dismiss = (id: string) => {
    setDismissed(prev => {
      const next = new Set(prev).add(id);
      saveDismissed(next);
      return next;
    });
  };

  const dismissAll = () => {
    setDismissed(prev => {
      const next = new Set(prev);
      notifs.forEach(n => next.add(n.id));
      saveDismissed(next);
      return next;
    });
  };

  const resetDismissed = () => {
    setDismissed(new Set());
    saveDismissed(new Set());
  };

  const visible = notifs.filter(n => !dismissed.has(n.id));
  const unread = getUnreadCount(notifs, dismissed);

  const criticalCount = visible.filter(n => n.severity === 'critical').length;
  const warningCount = visible.filter(n => n.severity === 'warning').length;

  // Kategoriye göre grupla
  const grouped = visible.reduce<Record<string, AppNotification[]>>((acc, n) => {
    (acc[n.category] = acc[n.category] || []).push(n);
    return acc;
  }, {});

  return (
    <>
      {/* Çan butonu */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => setOpen(o => !o)}
          title="Bildirimler"
          style={{
            position: 'relative',
            background: open
              ? 'var(--color-warning-soft)'
              : unread > 0
                ? (criticalCount > 0 ? 'var(--color-danger-soft)' : 'var(--color-warning-soft)')
                : 'var(--glass-bg)',
            border: open
              ? '1px solid var(--color-warning)'
              : unread > 0
                ? (criticalCount > 0 ? '1px solid var(--color-danger)' : '1px solid var(--color-warning)')
                : '1px solid var(--glass-border)',
            borderRadius: 'var(--radius)',
            color: open
              ? 'var(--color-warning)'
              : unread > 0
                ? (criticalCount > 0 ? 'var(--color-danger)' : 'var(--color-warning)')
                : 'var(--text-muted)',
            width: 36,
            height: 36,
            cursor: 'pointer',
            fontSize: 'var(--text-base)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.18s',
            animation: criticalCount > 0 && !open ? 'bellShake 3s ease-in-out infinite' : 'none',
          }}
          onMouseEnter={e => {
            if (!open) {
              (e.currentTarget as HTMLButtonElement).style.background = criticalCount > 0
                ? 'var(--color-danger-soft)' : 'var(--color-warning-soft)';
            }
          }}
          onMouseLeave={e => {
            if (!open) {
              (e.currentTarget as HTMLButtonElement).style.background = unread > 0
                ? (criticalCount > 0 ? 'var(--color-danger-soft)' : 'var(--color-warning-soft)')
                : 'var(--glass-bg)';
            }
          }}
        >
          🔔
        </button>
        {/* Badge */}
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            minWidth: 16, height: 16,
            background: criticalCount > 0 ? 'var(--color-danger)' : 'var(--color-warning)',
            color: 'var(--text-primary)',
            fontSize: '0.6rem', fontWeight: 800,
            borderRadius: 'var(--radius-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px',
            border: '2px solid var(--bg-elevated)',
            pointerEvents: 'none',
            animation: criticalCount > 0 ? 'badgePulse 2s ease-in-out infinite' : 'none',
          }}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </div>

      {/* Overlay */}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 199, background: 'var(--surface-overlay)', backdropFilter: 'var(--glass-blur)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Panel */}
      <div
        ref={panelRef}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(400px, 100vw)',
          zIndex: 200,
          background: 'linear-gradient(160deg, var(--bg-elevated) 0%, var(--bg-card) 100%)',
          borderLeft: '1px solid var(--glass-border)',
          boxShadow: '-16px 0 50px var(--surface-overlay)',
          display: 'flex',
          flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.28s cubic-bezier(0.22,1,0.36,1)',
          visibility: open ? 'visible' : 'hidden',
        }}
      >
        {/* Başlık */}
        <div style={{
          padding: '16px 18px 13px',
          borderBottom: '1px solid var(--glass-border)',
          flexShrink: 0,
          background: 'var(--surface-overlay)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 36, height: 36, flexShrink: 0,
              background: criticalCount > 0
                ? 'linear-gradient(135deg,var(--color-danger),var(--color-danger))'
                : unread > 0
                  ? 'linear-gradient(135deg,var(--color-warning),var(--color-warning))'
                  : 'linear-gradient(135deg,var(--text-muted),var(--text-muted))',
              borderRadius: 'var(--radius)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 'var(--text-base)',
              boxShadow: criticalCount > 0 ? '0 4px 16px var(--color-danger-soft)' : '0 4px 16px var(--surface-overlay)',
            }}>🔔</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>Bildirimler</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.67rem' }}>Son güncelleme: {lastRefresh}</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'var(--glass-bg)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', width: 30, height: 30, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-base)', flexShrink: 0 }}
            >×</button>
          </div>

          {/* Özet sayaçlar */}
          <div style={{ display: 'flex', gap: 7 }}>
            {([
              { count: criticalCount, label: 'Kritik', color: 'var(--color-danger)', bg: 'var(--color-danger-soft)', border: 'var(--color-danger-soft)' },
              { count: warningCount, label: 'Uyarı', color: 'var(--color-warning)', bg: 'var(--color-warning-soft)', border: 'var(--color-warning-soft)' },
              { count: visible.filter(n => n.severity === 'info').length, label: 'Bilgi', color: 'var(--color-info)', bg: 'var(--color-info-soft)', border: 'var(--color-info-soft)' },
            ]).map(({ count, label, color, bg, border }) => (
              <div key={label} style={{ flex: 1, background: bg, border: `1px solid ${border}`, borderRadius: 'var(--radius)', padding: '6px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color, lineHeight: 1 }}>{count}</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* İçerik */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
          {visible.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', gap: 12 }}>
              <div style={{ fontSize: '2.5rem' }}>✅</div>
              <div style={{ color: 'var(--color-success)', fontWeight: 700, fontSize: 'var(--text-sm)' }}>Her şey yolunda!</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', textAlign: 'center' }}>Aktif uyarı yok. Tüm bildirimler okundu işaretlendi.</div>
              <button
                onClick={resetDismissed}
                style={{ background: 'var(--color-info-soft)', border: '1px solid var(--color-info-soft)', borderRadius: 'var(--radius-sm)', color: 'var(--color-info)', padding: '6px 14px', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 600 }}
              >Bildirimleri Yenile</button>
            </div>
          ) : (
            Object.entries(grouped).map(([cat, items]) => (
              <div key={cat} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: '0.63rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, paddingLeft: 2 }}>
                  {CAT_LABEL[cat as NotifCategory] || cat}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {items.map(n => {
                    const s = SEV_STYLE[n.severity];
                    return (
                      <div
                        key={n.id}
                        style={{
                          background: s.bg,
                          border: `1px solid ${s.border}`,
                          borderRadius: 'var(--radius)',
                          padding: '10px 12px',
                          display: 'flex',
                          gap: 10,
                          alignItems: 'flex-start',
                          animation: 'notifSlideIn 0.22s ease both',
                        }}
                      >
                        {/* Sol dot */}
                        <div style={{ marginTop: 3, flexShrink: 0 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, display: 'block', boxShadow: `0 0 6px ${s.dot}` }} />
                        </div>

                        {/* İçerik */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 2 }}>
                            <span style={{ fontSize: 'var(--text-sm)', lineHeight: 1, flexShrink: 0 }}>{n.icon}</span>
                            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>{n.title}</span>
                          </div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: n.targetTab ? 8 : 0 }}>{n.detail}</div>
                          {n.targetTab && (
                            <button
                              onClick={() => { onNavigate(n.targetTab!); setOpen(false); }}
                              style={{
                                background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                                borderRadius: 6, color: 'var(--text-muted)', padding: '3px 9px', cursor: 'pointer',
                                fontSize: '0.7rem', fontWeight: 600, transition: 'all 0.15s',
                              }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--glass-bg)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--glass-bg)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
                            >
                              Git →
                            </button>
                          )}
                        </div>

                        {/* Kapat */}
                        <button
                          onClick={() => dismiss(n.id)}
                          title="Okundu işaretle"
                          style={{ background: 'none', border: 'none', color: 'var(--border-strong)', cursor: 'pointer', fontSize: 'var(--text-sm)', lineHeight: 1, padding: 2, flexShrink: 0, borderRadius: 4, transition: 'color 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--border-strong)')}
                        >×</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Alt butonlar */}
        {visible.length > 0 && (
          <div style={{ padding: '10px 14px 14px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={dismissAll}
              style={{ flex: 1, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-muted)', padding: '8px', cursor: 'pointer', fontSize: '0.77rem', fontWeight: 600, transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--glass-bg)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--glass-bg)'; }}
            >
              ✓ Tümünü Okundu İşaretle
            </button>
            <button
              onClick={refresh}
              title="Yenile"
              style={{ background: 'var(--color-info-soft)', border: '1px solid var(--color-info-soft)', borderRadius: 'var(--radius)', color: 'var(--color-info)', padding: '8px 14px', cursor: 'pointer', fontSize: 'var(--text-sm)', transition: 'all 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-info-soft)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-info-soft)')}
            >⟳</button>
          </div>
        )}
      </div>


    </>
  );
}
