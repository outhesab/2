import { useEffect, useState } from 'react';
import { loadKeysFromFirebase, saveKeysToFirebase, invalidateKeyCache } from '@/lib/aiKeys';

interface Props {
  onClose: () => void;
}

export default function ApiSettings({ onClose }: Props) {
  const [ck, setCk] = useState('');
  const [gk, setGk] = useState('');
  const [dk, setDk] = useState('');
  const [hk, setHk] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    loadKeysFromFirebase().then((keys) => {
      setCk(keys.claude);
      setGk(keys.gemini);
      setDk(keys.deepseek);
      setHk(keys.huggingface);
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    const ok = await saveKeysToFirebase({
      claude: ck.trim(),
      gemini: gk.trim(),
      deepseek: dk.trim(),
      huggingface: hk.trim(),
      opencodeNvidia: '',
      opencodeHf: '',
    });
    if (ok) {
      invalidateKeyCache();
      setMsg("✅ Firebase'e kaydedildi");
      setTimeout(() => {
        setMsg('');
        onClose();
      }, 1200);
    } else {
      setMsg('❌ Kayıt başarısız — Firebase bağlantısını kontrol edin');
    }
    setSaving(false);
  };

  const inp: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    background: '#0f172a',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: '#f1f5f9',
    fontSize: '0.85rem',
    boxSizing: 'border-box',
    fontFamily: 'monospace',
  };
  return (
    <div style={{ padding: '16px 0' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 14,
          padding: '8px 12px',
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 8,
        }}
      >
        <span>☁️</span>
        <p style={{ color: '#10b981', fontSize: '0.82rem', margin: 0 }}>
          API anahtarları Firebase'de şifreli saklanır — tüm cihazlarda geçerlidir.
        </p>
      </div>
      {loading ? (
        <div
          style={{
            color: '#64748b',
            fontSize: '0.85rem',
            textAlign: 'center',
            padding: '20px 0',
          }}
        >
          Firebase'den yükleniyor...
        </div>
      ) : (
        <>
          <label
            style={{
              display: 'block',
              color: '#94a3b8',
              fontSize: '0.82rem',
              marginBottom: 4,
            }}
          >
            🤖 Claude API Key (Anthropic — birincil)
          </label>
          <input
            value={ck}
            onChange={(e) => setCk(e.target.value)}
            placeholder="sk-ant-..."
            style={{ ...inp, marginBottom: 14 }}
            type="password"
          />
          <label
            style={{
              display: 'block',
              color: '#94a3b8',
              fontSize: '0.82rem',
              marginBottom: 4,
            }}
          >
            ✨ Gemini API Key (Google — yedek)
          </label>
          <input
            value={gk}
            onChange={(e) => setGk(e.target.value)}
            placeholder="AIza..."
            style={{ ...inp, marginBottom: 18 }}
            type="password"
          />
          <label
            style={{
              display: 'block',
              color: '#94a3b8',
              fontSize: '0.82rem',
              marginBottom: 4,
            }}
          >
            🧠 DeepSeek API Key (yedek AI)
          </label>
          <input
            value={dk}
            onChange={(e) => setDk(e.target.value)}
            placeholder="sk-..."
            style={{ ...inp, marginBottom: 14 }}
            type="password"
          />
          <label
            style={{
              display: 'block',
              color: '#94a3b8',
              fontSize: '0.82rem',
              marginBottom: 4,
            }}
          >
            🤗 Hugging Face Token (HF_TOKEN)
          </label>
          <input
            value={hk}
            onChange={(e) => setHk(e.target.value)}
            placeholder="hf_..."
            style={{ ...inp, marginBottom: 18 }}
            type="password"
          />
          {msg && (
            <div
              style={{
                marginBottom: 12,
                fontSize: '0.82rem',
                color: msg.startsWith('✅') ? '#10b981' : '#ef4444',
                fontWeight: 600,
              }}
            >
              {msg}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={save}
              disabled={saving}
              style={{
                flex: 1,
                background: '#10b981',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                padding: '10px 0',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {saving ? 'Kaydediliyor...' : "☁️ Firebase'e Kaydet"}
            </button>
            <button
              onClick={onClose}
              style={{
                background: '#273548',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: '#94a3b8',
                padding: '10px 16px',
                cursor: 'pointer',
              }}
            >
              İptal
            </button>
          </div>
        </>
      )}
    </div>
  );
}
