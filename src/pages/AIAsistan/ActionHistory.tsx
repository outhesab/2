
import type { DBAction } from '@/lib/aiActions';

interface Props {
  pendingActions: {
    msgIdx: number;
    actions: DBAction[];
  } | null;
  actionResult: {
    msgIdx: number;
    success: boolean;
    msg: string;
  } | null;
  onConfirm: (msgIdx: number, actions: DBAction[]) => void;
  onCancel: () => void;
}

export function ActionHistory({ pendingActions, actionResult, onConfirm, onCancel }: Props) {
  if (!pendingActions) return null;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg,rgba(16,185,129,0.1),rgba(16,185,129,0.04))',
        border: '1px solid rgba(16,185,129,0.3)',
        borderRadius: 14,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '1.1rem' }}>⚡</span>
        <span
          style={{
            color: 'var(--color-success)',
            fontWeight: 700,
            fontSize: '0.88rem',
          }}
        >
          İşlem Onayı
        </span>
        <span
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.78rem',
            marginLeft: 'auto',
          }}
        >
          Kaydetmek istiyor musunuz?
        </span>
      </div>
      {pendingActions.actions.map((a, i) => (
        <div
          key={i}
          style={{
            background: 'rgba(0,0,0,0.2)',
            borderRadius: 8,
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: '0.85rem' }}>
            {a.type === 'sale'
              ? '🛒'
              : a.type === 'kasa_gelir'
                ? '💚'
                : a.type === 'kasa_gider'
                  ? '🔴'
                  : a.type === 'stok_guncelle'
                    ? '📦'
                    : a.type === 'urun_ekle'
                      ? '?'
                      : a.type === 'cari_ekle'
                        ? '??'
                        : '💳'}
          </span>
          <span style={{ color: 'var(--text-primary)', fontSize: '0.83rem', flex: 1 }}>{a.label}</span>
        </div>
      ))}
      {actionResult && actionResult.msgIdx === pendingActions.msgIdx && (
        <div
          style={{
            color: actionResult.success ? 'var(--color-success)' : 'var(--color-danger)',
            fontSize: '0.82rem',
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          {actionResult.success ? '✅ ' : '❌ '}
          {actionResult.msg}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => onConfirm(pendingActions.msgIdx, pendingActions.actions)}
          style={{
            flex: 1,
            background: 'linear-gradient(135deg,#059669,#10b981)',
            border: 'none',
            borderRadius: 9,
            color: '#fff',
            padding: '9px 0',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          ✅ Onayla & Kaydet
        </button>
        <button
          onClick={onCancel}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 9,
            color: 'var(--text-secondary)',
            padding: '9px 16px',
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          İptal
        </button>
      </div>
    </div>
  );
}
