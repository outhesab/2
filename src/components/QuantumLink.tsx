/**
 * QuantumLink — Floating AI asistan paneli
 * Seçilebilir tema paletleri: Mavi, Amber, Yeşil
 */
import { useState, useRef, useEffect, useCallback, type CSSProperties } from 'react';
import { BrainCircuit, X, Mic, MicOff, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DB } from '@/types';
import { formatMoney } from '@/lib/utils-tr';
import { dispatchAgentFlow } from '@/agents/orchestrator';
import { logger } from '@/lib/logger';
import { speak, hasSpeechRecognition, createSpeechRecognition } from '@/lib/audio';

interface QuantumLinkProps {
  db: DB;
  defaultOpen?: boolean;
}

// ── Tema Paletleri ─────────────────────────────────────────────────
type PaletteId = 'blue' | 'amber' | 'green';

interface QLPalette {
  id: PaletteId;
  label: string;
}

const PALETTES: QLPalette[] = [
  {
    id: 'blue',
    label: 'Mavi',
  },
  {
    id: 'amber',
    label: 'Amber',
  },
  {
    id: 'green',
    label: 'Yeşil',
  },
];

const PALETTE_KEY = 'parspel-ql-palette';

function loadPalette(): PaletteId {
  try {
    return (localStorage.getItem(PALETTE_KEY) as PaletteId) || 'blue';
  } catch {
    logger.warn('storage', 'Palette yüklenemedi, varsayılan kullanıldı');
    return 'blue';
  }
}

function savePalette(id: PaletteId) {
  try {
    localStorage.setItem(PALETTE_KEY, id);
  } catch {
    logger.warn('storage', 'Palette kaydedilemedi'); /* */
  }
}

// ── Quick Reply ────────────────────────────────────────────────────
function quickReply(db: DB, query: string): string {
  const q = query.toLowerCase();

  if (q.includes('kasa') || q.includes('para') || q.includes('bakiye')) {
    const toplam = db.kasa
      .filter((k) => !k.deleted)
      .reduce((s, k) => s + (k.type === 'gelir' ? k.amount : -k.amount), 0);
    const nakit = db.kasa
      .filter((k) => !k.deleted && k.kasa === 'nakit')
      .reduce((s, k) => s + (k.type === 'gelir' ? k.amount : -k.amount), 0);
    const banka = db.kasa
      .filter((k) => !k.deleted && k.kasa === 'banka')
      .reduce((s, k) => s + (k.type === 'gelir' ? k.amount : -k.amount), 0);
    return `💰 Kasa Durumu\nToplam: ${formatMoney(toplam)}\nNakit: ${formatMoney(nakit)}\nBanka: ${formatMoney(banka)}`;
  }

  if (q.includes('stok') || q.includes('ürün')) {
    const aktif = db.products.filter((p) => !p.deleted);
    const biten = aktif.filter((p) => p.stock === 0);
    const az = aktif.filter((p) => p.stock > 0 && p.stock <= (p.minStock || 5));
    return `📦 Stok Özeti\nToplam ürün: ${aktif.length}\nStok biten: ${biten.length}\nAz stoklu: ${az.length}${
      az.length
        ? '\n' +
          az
            .slice(0, 3)
            .map((p) => `• ${p.name}: ${p.stock} adet`)
            .join('\n')
        : ''
    }`;
  }

  if (q.includes('satış') || q.includes('ciro') || q.includes('bu ay')) {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthSales = db.sales.filter(
      (s) => !s.deleted && s.status === 'tamamlandi' && new Date(s.createdAt) >= monthStart,
    );
    const ciro = monthSales.reduce((s, x) => s + x.total, 0);
    const kar = monthSales.reduce((s, x) => s + x.profit, 0);
    return `📊 Bu Ay\n${monthSales.length} satış\nCiro: ${formatMoney(ciro)}\nKâr: ${formatMoney(kar)}`;
  }

  if (q.includes('alacak') || q.includes('cari') || q.includes('müşteri')) {
    const alacak = db.cari
      .filter((c) => !c.deleted && c.type === 'musteri' && c.balance > 0)
      .reduce((s, c) => s + c.balance, 0);
    const top = [...db.cari]
      .filter((c) => !c.deleted && c.type === 'musteri' && c.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 3);
    return `👤 Alacaklar\nToplam: ${formatMoney(alacak)}\n${top.map((c) => `• ${c.name}: ${formatMoney(c.balance)}`).join('\n')}`;
  }

  return `🤖 Quantum Link\n\nSorabileceğiniz konular:\n• Kasa durumu\n• Stok özeti\n• Bu ay satışlar\n• Müşteri alacakları\n\nDetaylı analiz için AI Asistan sayfasını kullanın.`;
}

const panelVariants = {
  hidden: {
    opacity: 0,
    y: 40,
    scale: 0.9,
    filter: 'blur(10px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { type: 'spring', damping: 20, stiffness: 300, staggerChildren: 0.05 },
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.95,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

// ── Bileşen ────────────────────────────────────────────────────────
export function QuantumLink({ db, defaultOpen = false }: QuantumLinkProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [paletteId, setPaletteId] = useState<PaletteId>(loadPalette);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    { role: 'assistant', text: 'Sistem aktif. Komutlarınızı bekliyorum yönetici.' },
  ]);
  const [inputText, setInputText] = useState('');

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // CSS Değişkenlerini dinamik olarak ayarla
  const qlStyles = {
    '--ql-accent':
      paletteId === 'blue'
        ? 'oklch(0.60 0.14 260)'
        : paletteId === 'amber'
          ? 'oklch(0.70 0.18 85)'
          : 'oklch(0.65 0.18 160)',
    '--ql-accent-rgb': paletteId === 'blue' ? '59,130,246' : paletteId === 'amber' ? '245,158,11' : '16,185,129',
    '--ql-gradient':
      paletteId === 'blue'
        ? 'linear-gradient(135deg, oklch(0.60 0.14 260), oklch(0.50 0.18 265))'
        : paletteId === 'amber'
          ? 'linear-gradient(135deg, oklch(0.70 0.18 85), oklch(0.60 0.18 70))'
          : 'linear-gradient(135deg, oklch(0.65 0.18 160), oklch(0.55 0.18 150))',
    '--ql-accent-glow': `rgba(var(--ql-accent-rgb), 0.4)`,
  } as CSSProperties;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isProcessing]);

  const processCommand = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setIsProcessing(true);
      setMessages((prev) => [...prev, { role: 'user', text }]);

      const q = text.toLowerCase().trim();

      // Sayı çıkar (örn: "1500 TL" → 1500)
      const paraMatch = q.match(/(\d+[\d.,]*)\s*(tl|lira)?/);
      const tutar = paraMatch ? parseFloat(paraMatch[1].replace(',', '.')) : 0;

      // İsim çıkar (tahsilat için)
      const isimMatch = q.match(/tahsilat\s+(.+?)(\s+\d|$)/i);
      const isim = isimMatch ? isimMatch[1].trim() : '';

      let isAgentCommand = false;

      try {
        // Satış komutları
        if ((q.includes('satış') || q.includes('sattım') || q.includes('satis')) && tutar > 0) {
          const payment = q.includes('kart') ? 'kart' : q.includes('cari') ? 'cari' : 'nakit';
          await dispatchAgentFlow({
            type: 'sale',
            label: `Sesli satış: ${tutar}₺ ${payment}`,
            payload: { total: tutar, payment, profit: 0 },
          });
          isAgentCommand = true;
        }
        // Gelir komutu
        else if ((q.includes('gelir') || (q.includes('tahsilat') && !isim)) && tutar > 0 && !q.includes('gider')) {
          await dispatchAgentFlow({
            type: 'kasa_gelir',
            label: `Sesli gelir: ${tutar}₺`,
            payload: { amount: tutar, description: text },
          });
          isAgentCommand = true;
        }
        // Gider komutu
        else if (q.includes('gider') && tutar > 0) {
          await dispatchAgentFlow({
            type: 'kasa_gider',
            label: `Sesli gider: ${tutar}₺`,
            payload: { amount: tutar, description: text },
          });
          isAgentCommand = true;
        }
        // Tahsilat komutu (isimli)
        else if (q.includes('tahsilat') && isim && tutar > 0) {
          await dispatchAgentFlow({
            type: 'cari_tahsilat',
            label: `Sesli tahsilat: ${isim} ${tutar}₺`,
            payload: { amount: tutar, cariName: isim },
          });
          isAgentCommand = true;
        }

        if (isAgentCommand) {
          const successMsg = `✅ İşlem tamamlandı: ${text}`;
          setMessages((prev) => [...prev, { role: 'assistant', text: successMsg }]);
          speak('İşlem tamamlandı');
        } else {
          // Soru tipli → quickReply
          const response = quickReply(db, text);
          setMessages((prev) => [...prev, { role: 'assistant', text: response }]);
          speak(response.replace(/[•\n]/g, ' '));
        }
      } catch (err) {
        const errMsg = `❌ Hata: ${err instanceof Error ? err.message : 'İşlem başarısız'}`;
        setMessages((prev) => [...prev, { role: 'assistant', text: errMsg }]);
      } finally {
        setIsProcessing(false);
      }
    },
    [db],
  );

  useEffect(() => {
    recognitionRef.current = createSpeechRecognition(
      (transcript) => processCommand(transcript),
      () => setIsListening(false),
      () => setIsListening(false),
    );
  }, [processCommand]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch {
        logger.warn('speech', 'Ses tanıma başlatılamadı');
        setIsListening(false);
      }
    }
  };

  const handleSubmit = () => {
    if (!inputText.trim() || isProcessing) return;
    processCommand(inputText.trim());
    setInputText('');
  };

  const hasSpeech = hasSpeechRecognition();

  const changePalette = (id: PaletteId) => {
    setPaletteId(id);
    savePalette(id);
    setShowPalette(false);
  };

  return (
    <div style={qlStyles}>
      {/* Floating trigger */}
      <button
        onClick={() => setIsOpen(true)}
        title="Quantum Link — Hızlı AI Asistan"
        style={{
          position: 'fixed',
          bottom: 90,
          right: 20,
          width: 52,
          height: 52,
          background: 'var(--ql-gradient)',
          border: 'none',
          borderRadius: '50%',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 0 30px var(--ql-accent-glow)`,
          zIndex: 140,
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = `0 0 40px rgba(var(--ql-accent-rgb), 0.6)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = `0 0 30px var(--ql-accent-glow)`;
        }}
      >
        <BrainCircuit size={22} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsOpen(false);
                setShowPalette(false);
              }}
              style={{ position: 'fixed', inset: 0, zIndex: 148, background: 'var(--surface-overlay)' }}
            />

            <motion.div
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="quantum-glass-panel"
              style={{
                position: 'fixed',
                bottom: 152,
                right: 20,
                width: 380,
                maxWidth: 'calc(100vw - 40px)',
                height: 520,
                borderRadius: 'var(--radius)',
                boxShadow: `0 0 100px var(--surface-overlay), var(--ai-accent-glow)`,
                display: 'flex',
                flexDirection: 'column',
                zIndex: 149,
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: '20px 24px',
                  borderBottom: `1px solid var(--glass-border)`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexShrink: 0,
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      background: 'var(--ql-accent)',
                      borderRadius: '50%',
                      boxShadow: `0 0 8px rgba(var(--ql-accent-rgb), 0.6)`,
                      animation: 'pulse 2s ease-in-out infinite',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      letterSpacing: '0.4em',
                      color: 'var(--ql-accent)',
                    }}
                  >
                    Quantum Link
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    onClick={() => setShowPalette(!showPalette)}
                    title="Tema Değiştir"
                    style={{
                      background: showPalette ? 'var(--ql-accent)' : 'transparent',
                      border: 'none',
                      color: showPalette ? 'var(--text-primary)' : '#52525b',
                      cursor: 'pointer',
                      padding: 6,
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Palette size={14} />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#52525b',
                      cursor: 'pointer',
                      padding: 6,
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#52525b')}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Palette Picker */}
              <AnimatePresence>
                {showPalette && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{
                      overflow: 'hidden',
                      borderBottom: `1px solid var(--glass-border)`,
                      position: 'relative',
                      zIndex: 2,
                    }}
                  >
                    <div style={{ padding: '12px 24px', display: 'flex', gap: 8 }}>
                      {PALETTES.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => changePalette(p.id)}
                          style={{
                            flex: 1,
                            padding: '10px 0',
                            borderRadius: 'var(--radius)',
                            border: 'none',
                            background: paletteId === p.id ? 'var(--ql-gradient)' : 'var(--bg-elevated)',
                            color: paletteId === p.id ? 'var(--text-primary)' : '#71717a',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: paletteId === p.id ? `0 0 12px var(--ql-accent-glow)` : 'none',
                          }}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages */}
              <div
                ref={scrollRef}
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 20,
                  scrollbarWidth: 'none',
                }}
              >
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
                  >
                    <div
                      className={msg.role === 'assistant' ? 'quantum-msg-bubble-ai quantum-glass-panel' : ''}
                      style={{
                        maxWidth: '85%',
                        padding: '14px 16px',
                        borderRadius: 'var(--radius-lg)',
                        background: msg.role === 'user' ? 'var(--ql-accent)' : 'var(--glass-bg)',
                        border: msg.role === 'user' ? 'none' : '1px solid var(--glass-border-bright)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 'var(--text-xs)',
                          lineHeight: 1.6,
                          color: 'var(--text-primary)',
                          fontWeight: msg.role === 'user' ? 600 : 400,
                          whiteSpace: 'pre-line',
                        }}
                      >
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))}

                {isProcessing && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div
                      style={{
                        background: 'var(--bg-elevated)',
                        padding: '14px 18px',
                        borderRadius: 'var(--radius-lg)',
                        border: `1px solid rgba(var(--ql-accent-rgb), 0.08)`,
                      }}
                    >
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            style={{
                              width: 5,
                              height: 5,
                              background: 'var(--ql-accent)',
                              borderRadius: '50%',
                              animation: `bounce 1.2s ease ${i * 0.15}s infinite`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div
                className="quantum-input-section"
                style={{
                  padding: '16px 20px',
                  position: 'relative',
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                {hasSpeech && (
                  <button
                    onClick={toggleListening}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 'var(--radius)',
                      flexShrink: 0,
                      background: isListening ? 'var(--ql-accent)' : 'var(--bg-elevated)',
                      border: 'none',
                      color: isListening ? 'var(--text-primary)' : '#52525b',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                  >
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>
                )}
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmit();
                  }}
                  placeholder={isListening ? '🎤 Dinleniyor...' : 'Komut yazın...'}
                  disabled={isProcessing || isListening}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />
                {inputText.trim() && (
                  <button
                    onClick={handleSubmit}
                    disabled={isProcessing}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 'var(--radius-sm)',
                      flexShrink: 0,
                      background: 'var(--ql-gradient)',
                      border: 'none',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 700,
                    }}
                  >
                    ↑
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
