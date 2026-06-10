import { useState } from 'react';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { logger } from '@/lib/logger';
import { Card } from '@/pages/SettingsCard';
import { Button } from '@/components/ui/button';
import type { DB } from '@/types';

interface Props {
  db: DB;
  save: (fn: (prev: DB) => DB) => void;
}

function getDefaultAgentSettings(): Record<string, unknown> {
  return {
    stok: {
      enabled: true,
      permissions: ['stok.read', 'stok.write'],
    },
    kasa: {
      enabled: true,
      permissions: ['kasa.read', 'kasa.write'],
    },
    cari: {
      enabled: true,
      permissions: ['cari.read', 'cari.write'],
    },
    satis: {
      enabled: true,
      permissions: ['satis.read', 'satis.write'],
    },
    fatura: {
      enabled: true,
      permissions: ['fatura.read', 'fatura.write'],
    },
    rapor: {
      enabled: true,
      permissions: ['rapor.read'],
    },
    deep_seek: {
      enabled: false,
      permissions: ['deep_seek.read'],
    },
  };
}

export function AgentSettingsPanel({ db: _db, save: _save }: Props) {
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const [agentSettings, setAgentSettings] = useState(() => {
    try {
      const raw = localStorage.getItem('sobaYonetim');
      if (!raw) return getDefaultAgentSettings();
      const parsed = JSON.parse(raw);
      return parsed.agentSettings || getDefaultAgentSettings();
    } catch {
      logger.warn('settings', "Ajan ayarları localStorage'dan okunamadı, varsayılan kullanıldı");
      return getDefaultAgentSettings();
    }
  });

  const agents = [
    {
      id: 'stok',
      name: 'Stok Ajanı',
      icon: '📦',
      desc: 'Ürün stok yönetimi ve uyarıları',
      permissions: ['stok.read', 'stok.write'],
    },
    {
      id: 'kasa',
      name: 'Kasa Ajanı',
      icon: '💰',
      desc: 'Kasa işlemleri ve nakit yönetimi',
      permissions: ['kasa.read', 'kasa.write'],
    },
    {
      id: 'cari',
      name: 'Cari Ajanı',
      icon: '👤',
      desc: 'Müşteri ve tedarikçi yönetimi',
      permissions: ['cari.read', 'cari.write'],
    },
    {
      id: 'satis',
      name: 'Satış Ajanı',
      icon: '🛒',
      desc: 'Satış işlemleri ve raporlama',
      permissions: ['satis.read', 'satis.write'],
    },
    {
      id: 'fatura',
      name: 'Fatura Ajanı',
      icon: '🧾',
      desc: 'Fatura oluşturma ve yönetimi',
      permissions: ['fatura.read', 'fatura.write'],
    },
    {
      id: 'rapor',
      name: 'Rapor Ajanı',
      icon: '📊',
      desc: 'Raporlar ve analitik',
      permissions: ['rapor.read'],
    },
    {
      id: 'deep_seek',
      name: 'DeepSeek Ajanı',
      icon: '🤖',
      desc: 'Yapay zeka destekli analiz ve öneriler',
      permissions: ['deep_seek.read', 'deep_seek.write'],
    },
  ];

  const saveAgentSettings = () => {
    try {
      const raw = localStorage.getItem('sobaYonetim');
      const parsed = raw ? JSON.parse(raw) : {};
      parsed.agentSettings = agentSettings;
      localStorage.setItem('sobaYonetim', JSON.stringify(parsed));
      showToast('Ajan ayarları kaydedildi!', 'success');
    } catch {
      logger.warn('settings', 'Ajan ayarları kaydedilemedi');
      showToast('Ayarlar kaydedilemedi!', 'error');
    }
  };

  const toggleAgent = (agentId: string) => {
    setAgentSettings((prev: Record<string, unknown>) => ({
      ...prev,
      [agentId]: {
        ...(prev[agentId] as Record<string, unknown>),
        enabled: !((prev[agentId] as Record<string, unknown>)?.enabled as boolean),
      },
    }));
  };

  const togglePermission = (agentId: string, permission: string) => {
    setAgentSettings((prev: Record<string, unknown>) => {
      const agent = prev[agentId] as Record<string, unknown>;
      const perms = (agent?.permissions as string[]) || [];
      const updated = perms.includes(permission) ? perms.filter((p) => p !== permission) : [...perms, permission];
      return {
        ...prev,
        [agentId]: { ...agent, permissions: updated },
      };
    });
  };

  const resetToDefaults = () => {
    showConfirm('Varsayılan Ayarlara Dön', 'Tüm ajan ayarları varsayılan değerlere sıfırlanacak. Emin misiniz?', () => {
      setAgentSettings(getDefaultAgentSettings());
      showToast('Varsayılan ayarlara döndü!', 'success');
    });
  };

  return (
    <div className="grid gap-4">
      <Card title="🤖 Ajan Yönetimi">
        <p className="text-muted-foreground text-sm">
          Sistemdeki ajanları etkinleştirin/devre dışı bırakın ve izinlerini yönetin.
        </p>

        <div className="grid gap-2">
          {agents.map((agent) => {
            const settings = (agentSettings[agent.id] as Record<string, unknown>) || {
              enabled: true,
              permissions: agent.permissions,
            };
            const enabled = settings.enabled as boolean;
            const perms = (settings.permissions as string[]) || [];

            return (
              <div
                key={agent.id}
                style={{
                  background: enabled ? 'rgba(255,87,34,0.05)' : 'rgba(0,0,0,0.3)',
                  borderRadius: 12,
                  border: `1px solid ${enabled ? 'rgba(255,87,34,0.2)' : 'rgba(255,255,255,0.05)'}`,
                  padding: '16px',
                  opacity: enabled ? 1 : 0.6,
                }}
              >
                {/* Başlık */}
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: '1.4rem' }}>{agent.icon}</span>
                  <div className="flex-1">
                    <div className="text-foreground text-sm font-semibold">{agent.name}</div>
                    <div className="text-[var(--text-dim)] text-xs">{agent.desc}</div>
                  </div>
                  <Button
                    onClick={() => toggleAgent(agent.id)}
                    style={{
                      padding: '6px 12px',
                      background: enabled ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.1)',
                      border: `1px solid ${enabled ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.2)'}`,
                      borderRadius: 8,
                      color: enabled ? 'var(--color-success)' : 'var(--color-danger)',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                    }}
                  >
                    {enabled ? '✓ Aktif' : '✕ Pasif'}
                  </Button>
                </div>

                {/* İzinler */}
                {enabled && (
                  <div className="grid gap-2">
                    <div className="text-[var(--text-dim)] text-xs">İzinler:</div>
                    {agent.permissions.map((perm) => (
                      <label
                        key={perm}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          padding: '6px 0',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={perms.includes(perm)}
                          onChange={() => togglePermission(agent.id, perm)}
                          style={{
                            cursor: 'pointer',
                            accentColor: 'var(--color-danger)',
                          }}
                        />
                        <span className="text-muted-foreground text-xs">{perm}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5">
          <Button onClick={saveAgentSettings} className="btn-primary w-full py-3 rounded-xl font-bold text-sm">
            💾 Ajan Ayarlarını Kaydet
          </Button>
          <Button
            onClick={resetToDefaults}
            className="px-3 py-2 rounded-lg font-medium text-sm bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
          >
            ↺ Varsayılana Dön
          </Button>
        </div>
      </Card>

      {/* Ajan İstatistikleri */}
      <Card title="📊 Ajan İstatistikleri">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            {
              label: 'Aktif Ajanlar',
              count: agents.filter((a) => (agentSettings[a.id] as Record<string, unknown>)?.enabled !== false).length,
              icon: '✓',
              color: '#10b981',
            },
            {
              label: 'Toplam İzin',
              count: Object.values(agentSettings).reduce(
                (sum: number, agent) =>
                  sum + ((agent as Record<string, unknown>)?.permissions as string[])?.length || 0,
                0,
              ),
              icon: '🔐',
              color: '#f59e0b',
            },
            {
              label: 'Yapılandırılan',
              count: Object.keys(agentSettings).length,
              icon: '⚙️',
              color: '#3b82f6',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: 'var(--bg-card)',
                borderRadius: 10,
                padding: '12px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{stat.icon}</div>
              <div
                style={{
                  fontSize: '1.3rem',
                  fontWeight: 900,
                  color: stat.color,
                  marginBottom: '4px',
                }}
              >
                {stat.count}
              </div>
              <div className="text-[var(--text-dim)] text-xs">{stat.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Ajan Açıklaması */}
      <Card title="ℹ️ Ajan Açıklaması">
        <div className="grid gap-2">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
            <div className="text-foreground text-sm font-semibold">🤖 Ajanlar Nedir?</div>
            <p className="text-muted-foreground text-xs">
              Ajanlar, uygulamanın belirli görevleri otomatik olarak yerine getirmesine yardımcı olan yapay zeka
              bileşenleridir. Her ajan belirli bir alan (stok, kasa, satış vb.) üzerinde çalışır.
            </p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
            <div className="text-foreground text-sm font-semibold">🔐 İzinler Nedir?</div>
            <p className="text-muted-foreground text-xs">
              İzinler, her ajanın hangi işlemleri yapabileceğini kontrol eder. "read" = okuma, "write" =
              yazma/değiştirme. Güvenlik için sadece gerekli izinleri verin.
            </p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
            <div className="text-foreground text-sm font-semibold">⚡ Etkinleştirme/Devre Dışı Bırakma</div>
            <p className="text-muted-foreground text-xs">
              Ajanları geçici olarak devre dışı bırakabilirsiniz. Devre dışı bırakılan ajanlar hiçbir işlem yapmaz ve
              sistem performansını etkilemez.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
