/**
 * IconPicker — Emoji, URL ve Lucide ikon seçici
 * Kategoriler, ürünler, kasalar ve diğer alanlarda kullanılır.
 */
import { useState, useRef, useEffect } from 'react';
import { ICON_CATEGORIES } from '@/lib/appConfig';

interface Props {
  value: string;
  onChange: (icon: string) => void;
  size?: number;
  label?: string;
}

export function IconPicker({ value, onChange, size = 36, label }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const [urlInput, setUrlInput] = useState('');
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const isUrl = (s: string) => s.startsWith('http') || s.startsWith('/') || s.startsWith('data:');

  const filteredIcons = search.trim()
    ? ICON_CATEGORIES.flatMap(c => c.icons).filter(ic => ic.includes(search))
    : ICON_CATEGORIES[tab]?.icons || [];

  const inp: React.CSSProperties = {
    width: '100%', padding: '7px 10px',
    background: 'rgba(15,23,42,0.6)', border: '1px solid var(--text-muted)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 'var(--text-sm)', boxSizing: 'border-box',
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      {label && <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 5 }}>{label}</div>}
      <button
        onClick={() => setOpen(o => !o)}
        title="İkon seç"
        style={{
          width: size, height: size, borderRadius: 'var(--radius)',
          background: 'var(--glass-border)', border: '1px solid var(--glass-border)',
          cursor: 'pointer', fontSize: size * 0.55, display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-soft)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'var(--glass-border)')}
      >
        {isUrl(value)
          ? <img src={value} alt="icon" style={{ width: size * 0.6, height: size * 0.6, objectFit: 'contain', borderRadius: 4 }} />
          : value || '📦'}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: size + 6, left: 0, zIndex: 500,
          background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius)', padding: 12, width: 280,
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}>
          {/* Arama */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Emoji ara..."
            style={{ ...inp, marginBottom: 10 }}
            autoFocus
          />

          {/* Kategori sekmeleri */}
          {!search && (
            <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
              {ICON_CATEGORIES.map((cat, i) => (
                <button key={i} onClick={() => setTab(i)} style={{
                  padding: '3px 8px', border: 'none', borderRadius: 6, cursor: 'pointer',
                  fontSize: '0.72rem', fontWeight: 600,
                  background: tab === i ? 'var(--color-primary-soft)' : 'var(--glass-border)',
                  color: tab === i ? 'var(--color-primary)' : 'var(--text-muted)',
                }}>
                  {cat.label}
                </button>
              ))}
              <button onClick={() => setTab(-1)} style={{
                padding: '3px 8px', border: 'none', borderRadius: 6, cursor: 'pointer',
                fontSize: '0.72rem', fontWeight: 600,
                background: tab === -1 ? 'var(--color-info-soft)' : 'var(--glass-border)',
                color: tab === -1 ? 'var(--color-info)' : 'var(--text-muted)',
              }}>
                🔗 URL
              </button>
            </div>
          )}

          {/* URL girişi */}
          {tab === -1 && !search ? (
            <div style={{ display: 'grid', gap: 8 }}>
              <input
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="https://... veya /icon.png"
                style={inp}
              />
              {urlInput && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img src={urlInput} alt="preview" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 6, background: 'var(--glass-border)' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <button onClick={() => { onChange(urlInput); setOpen(false); setUrlInput(''); }} style={{ flex: 1, padding: '7px 0', background: 'var(--color-success-soft)', border: '1px solid var(--color-success-soft)', borderRadius: 'var(--radius-sm)', color: 'var(--color-success)', cursor: 'pointer', fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                    ✓ Kullan
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Emoji grid */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4, maxHeight: 180, overflowY: 'auto' }}>
              {filteredIcons.map(ic => (
                <button key={ic} onClick={() => { onChange(ic); setOpen(false); setSearch(''); }} style={{
                  width: 30, height: 30, border: 'none', borderRadius: 7, cursor: 'pointer',
                  fontSize: '1.1rem', background: value === ic ? 'var(--color-primary-soft)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.1s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--glass-border)')}
                  onMouseLeave={e => (e.currentTarget.style.background = value === ic ? 'var(--color-primary-soft)' : 'transparent')}
                  title={ic}
                >
                  {ic}
                </button>
              ))}
              {filteredIcons.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)', padding: '12px 0' }}>Sonuç yok</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
