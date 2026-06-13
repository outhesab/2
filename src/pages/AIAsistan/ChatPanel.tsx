import { 
  AdminModeButton, 
  AutoApplyButton, 
  MaxActionsControl, 
  StopOnViolationButton, 
  EmbeddedStatCard 
} from '@/pages/pageHelpers';
import ApiSettings from '@/pages/ai/AIASettings';
import { formatMoney } from '@/lib/utils-tr';
import type { DB } from '@/types';

interface Props {
  db: DB;
  isAdminUser: boolean;
  adminMode: boolean;
  onToggleAdmin: () => void;
  autoApplyActions: boolean;
  onToggleAutoApply: () => void;
  maxAutoActions: number;
  onMaxActionsChange: (val: number) => void;
  stopOnViolation: boolean;
  onToggleStopViolation: () => void;
  showSettings: boolean;
  setShowSettings: (val: boolean) => void;
  isOnline: boolean;
  hasKeys: boolean;
  keyStatus: string;
  embedded: boolean;
  modelSource: string;
  setModelSource: (val: string) => void;
  messagesCount: number;
  onClearChat: () => void;
}

export function ChatPanel({
  db,
  isAdminUser,
  adminMode,
  onToggleAdmin,
  autoApplyActions,
  onToggleAutoApply,
  maxAutoActions,
  onMaxActionsChange,
  stopOnViolation,
  onToggleStopViolation,
  showSettings,
  setShowSettings,
  isOnline,
  hasKeys,
  keyStatus,
  embedded,
  modelSource,
  setModelSource,
  messagesCount,
  onClearChat,
}: Props) {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthSales = db.sales.filter(
    (s) => !s.deleted && s.status === 'tamamlandi' && new Date(s.createdAt) >= monthStart,
  );
  const kasaToplam = db.kasa
    .filter((k) => !k.deleted)
    .reduce((s, k) => s + (k.type === 'gelir' ? k.amount : -k.amount), 0);
  const alacakToplam = db.cari
    .filter((c) => !c.deleted && c.type === 'musteri' && c.balance > 0)
    .reduce((s, c) => s + c.balance, 0);

  return (
    <>
      {!embedded && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 16,
            padding: '16px 20px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.06))',
            borderRadius: 16,
            border: '1px solid rgba(99,102,241,0.2)',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              flexShrink: 0,
              boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
            }}
          >
            🤖
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.1rem', margin: 0 }}>
              Soba AI Asistan
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', margin: '3px 0 0' }}>
              {!isOnline
                ? '🔌 Çevrimdışı — temel sorulara yanıt verir'
                : hasKeys
                  ? `✅ API Anahtarları Hazır`
                  : keyStatus}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            {isAdminUser && <AdminModeButton adminMode={adminMode} onToggle={onToggleAdmin} />}
            {isAdminUser && adminMode && (
              <AutoApplyButton autoApplyActions={autoApplyActions} onToggle={onToggleAutoApply} />
            )}
            {isAdminUser && adminMode && (
              <MaxActionsControl
                value={maxAutoActions}
                onDecrement={() => onMaxActionsChange(maxAutoActions - 1)}
                onIncrement={() => onMaxActionsChange(maxAutoActions + 1)}
              />
            )}
            {isAdminUser && adminMode && (
              <StopOnViolationButton stopOnViolation={stopOnViolation} onToggle={onToggleStopViolation} />
            )}
            {messagesCount > 0 && (
              <button
                onClick={onClearChat}
                title="Sohbeti Temizle"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 8,
                  color: 'var(--text-secondary)',
                  padding: '7px 12px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                }}
              >
                🗑️
              </button>
            )}
            <button
              onClick={() => setShowSettings(true)}
              title="API Ayarları"
              style={{
                background: showSettings ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 8,
                color: '#818cf8',
                padding: '7px 12px',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              ⚙️
            </button>
          </div>
        </div>
      )}

      {embedded && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', gap: 8 }}>
            {[
              { label: 'Bu Ay Ciro', value: formatMoney(monthSales.reduce((s, x) => s + x.total, 0)), color: '#10b981' },
              { label: 'Kasa', value: formatMoney(kasaToplam), color: '#06b6d4' },
              { label: 'Alacak', value: formatMoney(alacakToplam), color: '#f59e0b' },
            ].map((s) => (
              <EmbeddedStatCard key={s.label} {...s} />
            ))}
          </div>
          <select
            value={modelSource}
            onChange={(e) => setModelSource(e.target.value)}
            style={{
              background: 'rgba(15,23,42,0.6)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: '#f1f5f9',
              padding: '6px 8px',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <option value="deepseek">🧠 DeepSeek</option>
            <option value="claude">🤖 Claude</option>
            <option value="gemini">✨ Gemini</option>
            <option value="offline">🔌 Çevrimdışı</option>
          </select>
          {isAdminUser && <AdminModeButton adminMode={adminMode} onToggle={onToggleAdmin} compact />}
          {isAdminUser && adminMode && (
            <AutoApplyButton autoApplyActions={autoApplyActions} onToggle={onToggleAutoApply} compact />
          )}
          {isAdminUser && adminMode && (
            <MaxActionsControl
              value={maxAutoActions}
              onDecrement={() => onMaxActionsChange(maxAutoActions - 1)}
              onIncrement={() => onMaxActionsChange(maxAutoActions + 1)}
              compact
            />
          )}
          {isAdminUser && adminMode && (
            <StopOnViolationButton stopOnViolation={stopOnViolation} onToggle={onToggleStopViolation} compact />
          )}
          <button
            onClick={() => setShowSettings(true)}
            style={{
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 8,
              color: '#818cf8',
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            ⚙️
          </button>
          {messagesCount > 0 && (
            <button
              onClick={onClearChat}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: 'none',
                borderRadius: 8,
                color: 'var(--text-secondary)',
                padding: '6px 10px',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              🗑️
            </button>
          )}
        </div>
      )}

      {showSettings && (
        <div
          style={{
            background: 'rgba(15,23,42,0.8)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 14,
            padding: '16px 20px',
            marginBottom: 14,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <h3 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.95rem' }}>⚙️ API Ayarları</h3>
            <button
              onClick={() => setShowSettings(false)}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.1rem' }}
            >
              ✕
            </button>
          </div>
          <ApiSettings onClose={() => setShowSettings(false)} />
        </div>
      )}
    </>
  );
}
