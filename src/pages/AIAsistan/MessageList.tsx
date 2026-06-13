import { MarkdownText } from '@/pages/ai/AIAHelpers';
import { sourceLabel } from '@/pages/ai/AIAHelpers.utils';
import type { Message } from '@/lib/aiApi';

interface Props {
  messages: Message[];
  copyMsg: (text: string, idx: number) => void;
  copiedIdx: number | null;
  loading: boolean;
  apiStatus: string;
}

export function MessageList({ messages, copyMsg, copiedIdx, loading, apiStatus }: Props) {
  return (
    <>
      {messages.map((msg, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: 10,
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background:
                msg.role === 'user'
                  ? 'linear-gradient(135deg,#ff5722,#ff7043)'
                  : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem',
              flexShrink: 0,
              boxShadow: msg.role === 'user' ? '0 2px 10px rgba(255,87,34,0.3)' : '0 2px 10px rgba(99,102,241,0.3)',
            }}
          >
            {msg.role === 'user' ? '👤' : '🤖'}
          </div>
          <div style={{ maxWidth: '80%', minWidth: 0 }}>
            <div
              style={{
                background:
                  msg.role === 'user'
                    ? 'linear-gradient(135deg,rgba(255,87,34,0.12),rgba(255,87,34,0.06))'
                    : 'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(99,102,241,0.04))',
                border: `1px solid ${msg.role === 'user' ? 'rgba(255,87,34,0.2)' : 'rgba(99,102,241,0.15)'}`,
                borderRadius: 14,
                padding: '12px 15px',
              }}
            >
              <div
                style={{
                  color: 'var(--text-primary)',
                  fontSize: '0.87rem',
                  lineHeight: 1.7,
                }}
              >
                {msg.role === 'assistant' ? <MarkdownText text={msg.content || '...'} /> : msg.content}
              </div>
            </div>
            {msg.role === 'assistant' && msg.content && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 4,
                }}
              >
                {msg.source && (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: sourceLabel[msg.source]?.color || '#64748b',
                      fontWeight: 600,
                      background: sourceLabel[msg.source]?.bg,
                      borderRadius: 5,
                      padding: '2px 7px',
                    }}
                  >
                    {sourceLabel[msg.source]?.label}
                  </span>
                )}
                <button
                  onClick={() => copyMsg(msg.content, i)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: copiedIdx === i ? 'var(--color-success)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.72rem',
                    padding: '2px 6px',
                    borderRadius: 5,
                    transition: 'color 0.2s',
                  }}
                >
                  {copiedIdx === i ? '✓ Kopyalandı' : '📋 Kopyala'}
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
      {loading && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            🤖
          </div>
          <div
            style={{
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.15)',
              borderRadius: 14,
              padding: '12px 18px',
            }}
          >
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#6366f1',
                    animation: `pulse 1.2s ease ${i * 0.2}s infinite`,
                  }}
                />
              ))}
              <span
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  marginLeft: 6,
                }}
              >
                {apiStatus === 'claude'
                  ? 'Claude düşünüyor...'
                  : apiStatus === 'gemini'
                    ? 'Gemini yanıtlıyor...'
                    : 'Yanıt hazırlanıyor...'}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
