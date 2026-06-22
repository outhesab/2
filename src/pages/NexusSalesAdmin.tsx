import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { formatMoney, formatDate } from '@/lib/utils-tr';
import type { DB } from '@/types';
import { nexusExecutive } from '@/lib/nexus/NexusExecutive';
import { getAgent } from '@/agents';

interface Props {
  db: DB;
  save: (fn: (prev: DB) => DB) => void;
}

type PanelTab = 'dashboard' | 'sessions' | 'settings' | 'composer';

interface NexusSession {
  id: string;
  startTime: string;
  lastActivity: string;
  messageCount: number;
  status: 'active' | 'idle' | 'completed';
  lastMessage?: string;
}

export default function NexusSalesAdmin({ db, save: _save }: Props) {
  const [, setLocation] = useLocation();
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const [tab, setTab] = useState<PanelTab>('dashboard');
  const [sessions, setSessions] = useState<NexusSession[]>([]);
  const [nexusEnabled, setNexusEnabled] = useState(() => {
    try { return localStorage.getItem('nexus_enabled') !== 'false'; } catch { return true; }
  });
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    try { return localStorage.getItem('nexus_voice_enabled') !== 'false'; } catch { return true; }
  });
  const [autoConfirm, setAutoConfirm] = useState(() => {
    try { return localStorage.getItem('nexus_auto_confirm') === 'true'; } catch { return false; }
  });
  const [composerActive, setComposerActive] = useState(nexusExecutive.isComposerActive());

  // Satış istatistikleri
  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todaySales = db.sales.filter(s => !s.deleted && s.status === 'tamamlandi' && s.createdAt.slice(0, 10) === today);
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
    const todayProfit = todaySales.reduce((sum, s) => sum + s.profit, 0);
    const totalSales = db.sales.filter(s => !s.deleted && s.status === 'tamamlandi').length;
    const totalRevenue = db.sales.filter(s => !s.deleted && s.status === 'tamamlandi').reduce((sum, s) => sum + s.total, 0);
    return { todaySales: todaySales.length, todayRevenue, todayProfit, totalSales, totalRevenue };
  }, [db.sales]);

  const toggleNexus = (enabled: boolean) => {
    setNexusEnabled(enabled);
    try { localStorage.setItem('nexus_enabled', String(enabled)); } catch { /* ignore */ }
    showToast(enabled ? 'Nexus AI aktif' : 'Nexus AI devre dışı', enabled ? 'success' : 'info');
  };

  const toggleVoice = (enabled: boolean) => {
    setVoiceEnabled(enabled);
    try { localStorage.setItem('nexus_voice_enabled', String(enabled)); } catch { /* ignore */ }
    showToast(enabled ? 'Sesli komut aktif' : 'Sesli komut devre dışı', enabled ? 'success' : 'info');
  };

  const toggleAutoConfirm = (enabled: boolean) => {
    setAutoConfirm(enabled);
    try { localStorage.setItem('nexus_auto_confirm', String(enabled)); } catch { /* ignore */ }
    showToast(enabled ? 'Otomatik onay aktif (dikkatli olun)' : 'Onay gerekiyor', enabled ? 'warning' : 'info');
  };

  const startComposer = () => {
    nexusExecutive.startComposer();
    setComposerActive(true);
    showToast('Satış modu başlatıldı — Nexus panelinden ürün ekleyin', 'success');
  };

  const stopComposer = () => {
    nexusExecutive.stopComposer();
    setComposerActive(false);
    showToast('Satış modu kapatıldı', 'info');
  };

  const clearSessions = () => {
    showConfirm('Oturumları Temizle', 'Tüm Nexus oturum geçmişi silinecek. Devam edilsin mi?', () => {
      setSessions([]);
      showToast('Oturum geçmişi temizlendi', 'success');
    });
  };

  const tabs: { id: PanelTab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Özet', icon: '📊' },
    { id: 'sessions', label: 'Oturumlar', icon: '💬' },
    { id: 'composer', label: 'Satış Modu', icon: '🛒' },
    { id: 'settings', label: 'Ayarlar', icon: '⚙️' },
  ];

  return (
    <div className="p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg ring-1 ring-indigo-500/30">
            <span className="text-xl">🧠</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Nexus Satış Yönetimi</h1>
            <p className="text-xs text-muted-foreground">AI destekli satış yönetim paneli</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${nexusEnabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {nexusEnabled ? '● Aktif' : '○ Devre Dışı'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-card rounded-xl p-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* DASHBOARD TAB */}
        {tab === 'dashboard' && (
          <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-card rounded-xl p-4 border border-white/5">
                <div className="text-xs text-muted-foreground mb-1">Bugün Satış</div>
                <div className="text-2xl font-bold text-foreground">{stats.todaySales}</div>
              </div>
              <div className="bg-card rounded-xl p-4 border border-white/5">
                <div className="text-xs text-muted-foreground mb-1">Bugün Ciro</div>
                <div className="text-2xl font-bold text-green-400">{formatMoney(stats.todayRevenue)}</div>
              </div>
              <div className="bg-card rounded-xl p-4 border border-white/5">
                <div className="text-xs text-muted-foreground mb-1">Bugün Kâr</div>
                <div className="text-2xl font-bold text-emerald-400">{formatMoney(stats.todayProfit)}</div>
              </div>
              <div className="bg-card rounded-xl p-4 border border-white/5">
                <div className="text-xs text-muted-foreground mb-1">Toplam Satış</div>
                <div className="text-2xl font-bold text-foreground">{stats.totalSales}</div>
              </div>
            </div>

            {/* Hızlı Aksiyonlar */}
            <div className="bg-card rounded-xl p-4 border border-white/5">
              <h3 className="text-sm font-semibold text-foreground mb-3">⚡ Hızlı Aksiyonlar</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <button
                  onClick={() => setLocation('/sales')}
                  className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium hover:bg-green-500/20 transition-colors"
                >
                  🛒 Yeni Satış
                </button>
                <button
                  onClick={() => setLocation('/products')}
                  className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-colors"
                >
                  📦 Ürünler
                </button>
                <button
                  onClick={() => setLocation('/cari')}
                  className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium hover:bg-purple-500/20 transition-colors"
                >
                  👤 Cari Hesaplar
                </button>
                <button
                  onClick={() => setLocation('/kasa')}
                  className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/20 transition-colors"
                >
                  💰 Kasa
                </button>
                <button
                  onClick={() => setLocation('/stock')}
                  className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium hover:bg-cyan-500/20 transition-colors"
                >
                  📋 Stok
                </button>
                <button
                  onClick={() => setLocation('/reports')}
                  className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium hover:bg-indigo-500/20 transition-colors"
                >
                  📈 Raporlar
                </button>
              </div>
            </div>

            {/* Nexus Durumu */}
            <div className="bg-card rounded-xl p-4 border border-white/5">
              <h3 className="text-sm font-semibold text-foreground mb-3">🧠 Nexus AI Durumu</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Motor</span>
                  <span className={`text-sm font-medium ${nexusEnabled ? 'text-green-400' : 'text-red-400'}`}>
                    {nexusEnabled ? 'Çalışıyor' : 'Devre Dışı'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sesli Komut</span>
                  <span className={`text-sm font-medium ${voiceEnabled ? 'text-green-400' : 'text-yellow-400'}`}>
                    {voiceEnabled ? 'Aktif' : 'Kapalı'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Satış Modu</span>
                  <span className={`text-sm font-medium ${composerActive ? 'text-green-400' : 'text-muted-foreground'}`}>
                    {composerActive ? 'Aktif' : 'Beklemede'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Otomatik Onay</span>
                  <span className={`text-sm font-medium ${autoConfirm ? 'text-yellow-400' : 'text-green-400'}`}>
                    {autoConfirm ? 'Aktif (Dikkatli)' : 'Kapalı (Güvenli)'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* SESSIONS TAB */}
        {tab === 'sessions' && (
          <motion.div key="sessions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Nexus Oturumları</h3>
              <button onClick={clearSessions} className="px-3 py-1 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20">
                🗑️ Temizle
              </button>
            </div>
            {sessions.length === 0 ? (
              <div className="bg-card rounded-xl p-8 border border-white/5 text-center">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-muted-foreground text-sm">Henüz Nexus oturumu yok</p>
                <p className="text-muted-foreground text-xs mt-1">Nexus AI ile etkileşimde bulunun</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map(s => (
                  <div key={s.id} className="bg-card rounded-xl p-4 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">Oturum #{s.id.slice(0, 8)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        s.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        s.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {s.status === 'active' ? 'Aktif' : s.status === 'completed' ? 'Tamamlandı' : 'Beklemede'}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Başlangıç: {formatDate(s.startTime)} • Mesaj: {s.messageCount}
                    </div>
                    {s.lastMessage && (
                      <div className="mt-2 text-xs text-muted-foreground bg-white/5 rounded-lg p-2 truncate">
                        Son: {s.lastMessage}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* COMPOSER TAB */}
        {tab === 'composer' && (
          <motion.div key="composer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <div className="bg-card rounded-xl p-4 border border-white/5">
              <h3 className="text-sm font-semibold text-foreground mb-3">🛒 Sesli Satış Modu</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Nexus AI ile sesli komutlarla satış yapabilirsiniz. "Yeni satış" deyin, ürün ekleyin, müşteri seçin ve "sat" deyin.
              </p>
              
              {composerActive ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <span className="text-green-400">●</span>
                    <span className="text-sm text-green-400 font-medium">Satış modu aktif</span>
                  </div>
                  <button
                    onClick={stopComposer}
                    className="w-full p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
                  >
                    ✕ Satış Modunu Kapat
                  </button>
                </div>
              ) : (
                <button
                  onClick={startComposer}
                  className="w-full p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium hover:bg-indigo-500/20 transition-colors"
                >
                  🛒 Satış Modunu Başlat
                </button>
              )}
            </div>

            <div className="bg-card rounded-xl p-4 border border-white/5">
              <h3 className="text-sm font-semibold text-foreground mb-3">📖 Komut Rehberi</h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="text-indigo-400 font-mono">→</span>
                  <span><strong className="text-foreground">"Yeni satış"</strong> — Satış modunu başlatır</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-indigo-400 font-mono">→</span>
                  <span><strong className="text-foreground">"X tane Y ekle"</strong> — Sepete ürün ekler</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-indigo-400 font-mono">→</span>
                  <span><strong className="text-foreground">"Müşteri: Z"</strong> — Müşteri seçer</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-indigo-400 font-mono">→</span>
                  <span><strong className="text-foreground">"İndirim X"</strong> — İndirim uygular</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-indigo-400 font-mono">→</span>
                  <span><strong className="text-foreground">"Sat"</strong> — Satışı tamamlar (onay ister)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-indigo-400 font-mono">→</span>
                  <span><strong className="text-foreground">"İptal"</strong> — Satışı iptal eder</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* SETTINGS TAB */}
        {tab === 'settings' && (
          <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <div className="bg-card rounded-xl p-4 border border-white/5">
              <h3 className="text-sm font-semibold text-foreground mb-4">⚙️ Nexus AI Ayarları</h3>
              
              <div className="space-y-4">
                {/* Nexus Anahtar */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">Nexus AI Motor</div>
                    <div className="text-xs text-muted-foreground">Nexus AI'ı etkinleştirin veya devre dışı bırakın</div>
                  </div>
                  <button
                    onClick={() => toggleNexus(!nexusEnabled)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${nexusEnabled ? 'bg-indigo-600' : 'bg-gray-600'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${nexusEnabled ? 'left-6' : 'left-0.5'}`} />
                  </button>
                </div>

                {/* Sesli Komut */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">Sesli Komut</div>
                    <div className="text-xs text-muted-foreground">Mikrofon ile komut vermeyi etkinleştirin</div>
                  </div>
                  <button
                    onClick={() => toggleVoice(!voiceEnabled)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${voiceEnabled ? 'bg-indigo-600' : 'bg-gray-600'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${voiceEnabled ? 'left-6' : 'left-0.5'}`} />
                  </button>
                </div>

                {/* Otomatik Onay */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">Otomatik Onay</div>
                    <div className="text-xs text-muted-foreground">Satış işlemleri için onay sorma (dikkatli kullanın)</div>
                  </div>
                  <button
                    onClick={() => toggleAutoConfirm(!autoConfirm)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${autoConfirm ? 'bg-yellow-600' : 'bg-gray-600'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${autoConfirm ? 'left-6' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Agent Durumu */}
            <div className="bg-card rounded-xl p-4 border border-white/5">
              <h3 className="text-sm font-semibold text-foreground mb-3">🤖 Agent Durumu</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['satis', 'stok', 'kasa', 'cari', 'fatura', 'rapor', 'deep_seek'].map(agentId => {
                  try {
                    getAgent(agentId as 'satis' | 'stok' | 'kasa' | 'cari' | 'fatura' | 'rapor' | 'deep_seek');
                    return (
                      <div key={agentId} className="p-2 rounded-lg bg-white/5 border border-white/5 text-center">
                        <div className="text-xs font-medium text-foreground">{agentId}</div>
                        <div className="text-[10px] text-green-400">● Bağlı</div>
                      </div>
                    );
                  } catch {
                    return (
                      <div key={agentId} className="p-2 rounded-lg bg-white/5 border border-white/5 text-center">
                        <div className="text-xs font-medium text-foreground">{agentId}</div>
                        <div className="text-[10px] text-red-400">○ Yok</div>
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
