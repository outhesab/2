/**
 * QuantumLink — Floating AI asistan paneli
 * Seçilebilir tema paletleri: Mavi, Amber, Yeşil
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { BrainCircuit, X, Mic, MicOff, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DB } from '@/types';
import { formatMoney } from '@/lib/utils-tr';

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface QuantumLinkProps {
  db: DB;
  defaultOpen?: boolean;
}

// ── Tema Paletleri ─────────────────────────────────────────────────
type PaletteId = 'blue' | 'amber' | 'green';

interface QLPalette {
  id: PaletteId;
  label: string;
  accent: string;
  accentRgb: string;
  gradient: string;
}

const PALETTES: QLPalette[] = [
  {
    id: 'blue',
    label: 'Mavi',
    accent: '#3b82f6',
    accentRgb: '59,130,246',
    gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  },
  {
    id: 'amber',
    label: 'Amber',
    accent: '#f59e0b',
    accentRgb: '245,158,11',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
  },
  {
    id: 'green',
    label: 'Yeşil',
    accent: '#10b981',
    accentRgb: '16,185,129',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
  },
];

const PALETTE_KEY = 'parspel-ql-palette';

function loadPalette(): PaletteId {
  try { return (localStorage.getItem(PALETTE_KEY) as PaletteId) || 'blue'; } catch { return 'blue'; }
}

function savePalette(id: PaletteId) {
  try { localStorage.setItem(PALETTE_KEY, id); } catch { /* */ }
}

// ── Quick Reply ────────────────────────────────────────────────────
function quickReply(db: DB, query: string): string {
  const q = query.toLowerCase();

  if (q.includes('kasa') || q.includes('para') || q.includes('bakiye')) {
    const toplam = db.kasa.filter(k => !k.deleted).reduce((s, k) => s + (k.type === 'gelir' ? k.amount : -k.amount), 0);
    const nakit = db.kasa.filter(k => !k.deleted && k.kasa === 'nakit').reduce((s, k) => s + (k.type === 'gelir' ? k.amount : -k.amount), 0);
    const banka = db.kasa.filter(k => !k.deleted && k.kasa === 'banka').reduce((s, k) => s + (k.type === 'gelir' ? k.amount : -k.amount), 0);
    return `💰 Kasa Durumu\nToplam: ${formatMoney(toplam)}\nNakit: ${formatMoney(nakit)}\nBanka: ${formatMoney(banka)}`;
  }

  if (q.includes('stok') || q.includes('ürün')) {
    const aktif = db.products.filter(p => !p.deleted);
    const biten = aktif.filter(p => p.stock === 0);
    const az = aktif.filter(p => p.stock > 0 && p.stock <= (p.minStock || 5));
    return `📦 Stok Özeti\nToplam ürün: ${aktif.length}\nStok biten: ${biten.length}\nAz stoklu: ${az.length}${az.length ? '\n' + az.slice(0, 3).map(p => `• ${p.name}: ${p.stock} adet`).join('\n') : ''}`;
  }

  if (q.includes('satış') || q.includes('ciro') || q.includes('bu ay')) {
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const monthSales = db.sales.filter(s => !s.deleted && s.status === 'tamamlandi' && new Date(s.createdAt) >= monthStart);
    const ciro = monthSales.reduce((s, x) => s + x.total, 0);
    const kar = monthSales.reduce((s, x) => s + x.profit, 0);
    return `📊 Bu Ay\n${monthSales.length} satış\nCiro: ${formatMoney(ciro)}\nKâr: ${formatMoney(kar)}`;
  }

  if (q.includes('alacak') || q.includes('cari') || q.includes('müşteri')) {
    const alacak = db.cari.filter(c => !c.deleted && c.type === 'musteri' && c.balance > 0).reduce((s, c) => s + c.balance, 0);
    const top = [...db.cari].filter(c => !c.deleted && c.type === 'musteri' && c.balance > 0).sort((a, b) => b.balance - a.balance).slice(0, 3);
    return `👤 Alacaklar\nToplam: ${formatMoney(alacak)}\n${top.map(c => `• ${c.name}: ${formatMoney(c.balance)}`).join('\n')}`;
  }

  return `🤖 Quantum Link\n\nSorabileceğiniz konular:\n• Kasa durumu\n• Stok özeti\n• Bu ay satışlar\n• Müşteri alacakları\n\nDetaylı analiz için AI Asistan sayfasını kullanın.`;
}

// ── Bileşen ────────────────────────────────────────────────────────
export function QuantumLink({ db, defaultOpen = false }: QuantumLinkProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [paletteId, setPaletteId] = useState<PaletteId>(loadPalette);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    { role: 'assistant', text: 'Sistem aktif. Komutlarınızı bekliyorum yönetici.' }
  ]);
  const [inputText, setInputText] = useState('');

  const palette = PALETTES.find(p => p.id === paletteId) || PALETTES[0];

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isProcessing]);

  const processCommand = useCallback((text: string) => {
    if (!text.trim()) return;
    setIsProcessing(true);
    setMessages(prev => [...prev, { role: 'user', text }]);
    setTimeout(() => {
      const response = quickReply(db, text);
      setMessages(prev => [...prev, { role: 'assistant', text: response }]);
      try {
        const u = new SpeechSynthesisUtterance(response.replace(/[•\n]/g, ' '));
        u.lang = 'tr-TR'; u.rate = 1.1;
        window.speechSynthesis.speak(u);
      } catch { void 0; }
      setIsProcessing(false);
    }, 700);
  }, [db]);

  useEffect(() => {
    const SR = (window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!SR) return;
    const instance = new (SR as new () => SpeechRecognition)();
    instance.continuous = false;
    instance.lang = 'tr-TR';
    instance.onresult = (e: SpeechRecognitionEvent) => processCommand(e.results[0][0].transcript);
    instance.onend = () => setIsListening(false);
    instance.onerror = () => setIsListening(false);
    recognitionRef.current = instance;
  }, [processCommand]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try { recognitionRef.current?.start(); setIsListening(true); } catch { setIsListening(false); }
    }
  };

  const handleSubmit = () => {
    if (!inputText.trim() || isProcessing) return;
    processCommand(inputText.trim());
    setInputText('');
  };

  const hasSpeech = !!(window as unknown as Record<string, unknown>).SpeechRecognition || !!(window as unknown as Record<string, unknown>).webkitSpeechRecognition;

  const changePalette = (id: PaletteId) => {
    setPaletteId(id);
    savePalette(id);
    setShowPalette(false);
  };

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setIsOpen(true)}
        title="Quantum Link — Hızlı AI Asistan"
        style={{
          position: 'fixed', bottom: 90, right: 20,
          width: 52, height: 52,
          background: palette.gradient,
          border: 'none',
          borderRadius: '50%', color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 30px rgba(${palette.accentRgb},0.4)`,
          zIndex: 140, transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = `0 0 40px rgba(${palette.accentRgb},0.6)`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = `0 0 30px rgba(${palette.accentRgb},0.4)`;
        }}
      >
        <BrainCircuit size={22} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setIsOpen(false); setShowPalette(false); }}
              style={{ position: 'fixed', inset: 0, zIndex: 148, background: 'rgba(0,0,0,0.25)' }}
            />

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                position: 'fixed', bottom: 152, right: 20,
                width: 380, maxWidth: 'calc(100vw - 40px)', height: 520,
                background: '#09090b',
                borderRadius: 28,
                boxShadow: `0 0 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(${palette.accentRgb},0.15)`,
                display: 'flex', flexDirection: 'column',
                zIndex: 149, overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div style={{
                padding: '20px 24px', borderBottom: `1px solid rgba(${palette.accentRgb},0.1)`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 8, height: 8, background: palette.accent, borderRadius: '50%',
                    boxShadow: `0 0 8px rgba(${palette.accentRgb},0.6)`,
                    animation: 'pulse 2s ease-in-out infinite',
                  }} />
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 900,
                    textTransform: 'uppercase', letterSpacing: '0.4em', color: palette.accent,
                  }}>
                    Quantum Link
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    onClick={() => setShowPalette(!showPalette)}
                    title="Tema Değiştir"
                    style={{
                      background: showPalette ? palette.accent : 'transparent',
                      border: 'none', color: showPalette ? '#fff' : '#52525b',
                      cursor: 'pointer', padding: 6, borderRadius: 8,
                      display: 'flex', alignItems: 'center', transition: 'all 0.2s',
                    }}
                  >
                    <Palette size={14} />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#fff'}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#52525b'}
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
                    style={{ overflow: 'hidden', borderBottom: `1px solid rgba(${palette.accentRgb},0.1)` }}
                  >
                    <div style={{ padding: '12px 24px', display: 'flex', gap: 8 }}>
                      {PALETTES.map(p => (
                        <button
                          key={p.id}
                          onClick={() => changePalette(p.id)}
                          style={{
                            flex: 1, padding: '10px 0', borderRadius: 12, border: 'none',
                            background: paletteId === p.id ? p.gradient : '#18181b',
                            color: paletteId === p.id ? '#fff' : '#71717a',
                            fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: paletteId === p.id ? `0 0 12px rgba(${p.accentRgb.replace(',',',').split(',').join(',')},0.3)` : 'none',
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
                  flex: 1, overflowY: 'auto', padding: '24px',
                  display: 'flex', flexDirection: 'column', gap: 20,
                  scrollbarWidth: 'none',
                }}
              >
                {messages.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '85%', padding: '14px 16px', borderRadius: 16,
                      background: msg.role === 'user' ? palette.accent : '#18181b',
                      border: msg.role === 'user' ? 'none' : `1px solid rgba(${palette.accentRgb},0.08)`,
                    }}>
                      <p style={{
                        fontSize: '0.78rem', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line',
                        color: msg.role === 'user' ? '#fff' : '#71717a',
                        fontWeight: msg.role === 'user' ? 700 : 400,
                      }}>
                        {msg.text}
                      </p>
                    </div>
                  </div>
                ))}

                {isProcessing && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ background: '#18181b', padding: '14px 18px', borderRadius: 16, border: `1px solid rgba(${palette.accentRgb},0.08)` }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[0, 1, 2].map(i => (
                          <div key={i} style={{
                            width: 5, height: 5, background: palette.accent, borderRadius: '50%',
                            animation: `bounce 1.2s ease ${i * 0.15}s infinite`,
                          }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div style={{
                padding: '16px 20px',
                background: 'rgba(0,0,0,0.4)',
                borderTop: `1px solid rgba(${palette.accentRgb},0.08)`,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                {hasSpeech && (
                  <button
                    onClick={toggleListening}
                    style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: isListening ? palette.accent : '#27272a',
                      border: 'none', color: isListening ? '#fff' : '#52525b',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                  >
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>
                )}
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
                  placeholder={isListening ? '🎤 Dinleniyor...' : 'Komut yazın...'}
                  disabled={isProcessing || isListening}
                  style={{
                    flex: 1, background: 'transparent', border: 'none',
                    color: '#fff', fontSize: '0.85rem', fontWeight: 600,
                    outline: 'none',
                  }}
                />
                {inputText.trim() && (
                  <button
                    onClick={handleSubmit}
                    disabled={isProcessing}
                    style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: palette.gradient, border: 'none', color: '#fff',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.9rem', fontWeight: 700,
                    }}
                  >↑</button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
