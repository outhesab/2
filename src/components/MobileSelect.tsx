import { useState, useEffect, useRef } from 'react';

interface Option { value: string; label: string; sub?: string; }

interface Props {
  value: string;
  onChange: (val: string) => void;
  options: Option[];
  placeholder?: string;
  label?: string;
  searchable?: boolean;
  style?: React.CSSProperties;
}

export function MobileSelect({ value, onChange, options, placeholder = '-- Seçin --', label, searchable = true, style }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find(o => o.value === value);

  const filtered = search.trim()
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()) || (o.sub || '').toLowerCase().includes(search.toLowerCase()))
    : options;

  useEffect(() => {
    if (open) {
      setSearch('');
      setTimeout(() => searchRef.current?.focus(), 150);
    }
  }, [open]);

  // Backdrop click closes
  const close = () => setOpen(false);

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
    borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: 'var(--text-sm)',
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          width: '100%', padding: '11px 14px',
          background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius)', color: selected ? 'var(--text-primary)' : 'var(--text-muted)',
          fontSize: 'var(--text-sm)', textAlign: 'left', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          ...style,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : placeholder}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', flexShrink: 0, marginLeft: 8 }}>▼</span>
      </button>

      {/* Bottom Sheet */}
      {open && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          }}
        >
          {/* Backdrop */}
          <div
            onClick={close}
            style={{
              position: 'absolute', inset: 0,
              background: 'var(--surface-overlay)',
              backdropFilter: 'blur(6px)',
              animation: 'fadeIn 0.2s ease',
            }}
          />

          {/* Sheet */}
          <div style={{
            position: 'relative', zIndex: 1,
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
            border: '1px solid var(--glass-border)',
            borderBottom: 'none',
            maxHeight: '75vh',
            display: 'flex', flexDirection: 'column',
            animation: 'slideUp 0.25s cubic-bezier(0.22,1,0.36,1)',
            boxShadow: '0 -20px 60px rgba(0,0,0,0.5)',
          }}>
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
            </div>

            {/* Header */}
            <div style={{ padding: '8px 18px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontWeight: 600 }}>{label || placeholder}</span>
              <button onClick={close} style={{ background: 'var(--glass-border)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'var(--text-dim)', padding: '5px 10px', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>✕ Kapat</button>
            </div>

            {/* Search */}
            {searchable && (
              <div style={{ padding: '0 14px 10px' }}>
                <input
                  ref={searchRef}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="🔍 Ara..."
                  style={{ ...inp, background: 'var(--bg-card)', border: '1px solid var(--border-strong)' }}
                />
              </div>
            )}

            {/* Options */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '0 10px 20px' }}>
              {/* Clear option */}
              {value && (
                <button
                  onClick={() => { onChange(''); close(); }}
                  style={{
                    width: '100%', padding: '12px 14px', marginBottom: 4,
                    background: 'var(--color-danger-soft)', border: '1px solid var(--color-danger-soft)',
                    borderRadius: 'var(--radius)', color: '#f87171', fontSize: '0.88rem',
                    textAlign: 'left', cursor: 'pointer',
                  }}
                >✕ Seçimi Temizle</button>
              )}

              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0', fontSize: '0.88rem' }}>Sonuç bulunamadı</div>
              )}

              {filtered.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { onChange(opt.value); close(); }}
                  style={{
                    width: '100%', padding: '13px 14px', marginBottom: 4,
                    background: opt.value === value ? 'var(--color-primary-soft)' : 'var(--bg-card-hover)',
                    border: `1px solid ${opt.value === value ? 'var(--color-primary-soft)' : 'var(--glass-border)'}`,
                    borderRadius: 'var(--radius)', color: opt.value === value ? 'var(--color-primary)' : 'var(--text-primary)',
                    fontSize: 'var(--text-sm)', textAlign: 'left', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'all 0.15s',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: opt.value === value ? 700 : 400 }}>{opt.label}</div>
                    {opt.sub && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>{opt.sub}</div>}
                  </div>
                  {opt.value === value && <span style={{ fontSize: '1rem' }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
