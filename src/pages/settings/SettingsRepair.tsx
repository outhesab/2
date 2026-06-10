import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/pages/SettingsCard';
import { runHealthCheck, type HealthReport } from '@/lib/healthCheck';
import type { DB } from '@/types';

interface Props {
  db: DB;
  save: (fn: (prev: DB) => DB) => void;
  showToast: (m: string, t?: string) => void;
  showConfirm: (title: string, msg: string, onOk: () => void, danger?: boolean) => void;
}

export function VeriOnarim({ db, save, showToast, showConfirm }: Props) {
  const [results, setResults] = useState<string[]>([]);
  const [healthReport, setHealthReport] = useState<HealthReport | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const handleDetailedHealthCheck = async () => {
    setCheckingHealth(true);
    const report = await runHealthCheck(db as unknown as Record<string, unknown>);
    setHealthReport(report);
    setCheckingHealth(false);
  };

  const diagnose = () => {
    const issues: string[] = [];
    const saleIds = db.sales.map((s) => s.id);
    const dupSales = saleIds.length - new Set(saleIds).size;
    if (dupSales > 0) issues.push(`⚠️ ${dupSales} tekrarlanan satış kaydı`);
    const negStock = db.products.filter((p) => p.stock < 0).length;
    if (negStock > 0) issues.push(`⚠️ ${negStock} ürünün stok değeri negatif`);
    const cariIds = new Set(db.cari.map((c) => c.id));
    const orphanKasa = db.kasa.filter((k) => k.cariId && !cariIds.has(k.cariId)).length;
    if (orphanKasa > 0) issues.push(`⚠️ ${orphanKasa} kasa kaydı silinmiş cariye bağlı`);
    const soldProductIds = new Set(
      db.sales.flatMap((s) => s.items?.map((i: { productId: string }) => i.productId) || [s.productId]).filter(Boolean),
    );
    const stocklessProducts = db.products.filter((p) => soldProductIds.has(p.id) && p.stock === 0).length;
    if (stocklessProducts > 0) issues.push(`ℹ️ ${stocklessProducts} ürün satıldı ama stok sıfır`);
    if (!db.company.name) issues.push('ℹ️ Şirket adı girilmemiş');
    const lsSize = new Blob([localStorage.getItem('sobaYonetim') || '']).size;
    const lsKB = Math.round(lsSize / 1024);
    issues.push(`📊 localStorage boyutu: ${lsKB} KB (limit ~5MB)`);
    const orphanInvoices = (db.invoices || []).filter((inv) => inv.cariId && !cariIds.has(inv.cariId)).length;
    if (orphanInvoices > 0) issues.push(`⚠️ ${orphanInvoices} fatura silinmiş cariye bağlı`);
    setResults(issues.length === 0 ? ['✅ Veri tutarlılık kontrolü tamam. Sorun bulunamadı!'] : issues);
  };

  const fixNegativeStock = () => {
    showConfirm('Stok Düzelt', 'Negatif stoklar sıfıra çekilecek. Devam edilsin mi?', () => {
      save((prev) => ({ ...prev, products: prev.products.map((p) => (p.stock < 0 ? { ...p, stock: 0 } : p)) }));
      showToast('Negatif stoklar düzeltildi!');
      diagnose();
    });
  };

  const fixOrphanKasa = () => {
    showConfirm(
      'Orphan Temizle',
      'Silinmiş cariye ait kasa kayıtlarındaki cari bağlantısı kaldırılacak. Devam?',
      () => {
        const cariIds = new Set(db.cari.map((c) => c.id));
        save((prev) => ({
          ...prev,
          kasa: prev.kasa.map((k) => (k.cariId && !cariIds.has(k.cariId) ? { ...k, cariId: undefined } : k)),
        }));
        showToast('Orphan kasa kayıtları düzeltildi!');
        diagnose();
      },
    );
  };

  const recalcCariBalance = () => {
    showConfirm(
      'Bakiye Yeniden Hesapla',
      'Tüm cari bakiyeleri kasa işlemlerine göre sıfırdan hesaplanacak. Mevcut bakiyeler SIFIRLANACAK!',
      () => {
        save((prev) => {
          const cari = prev.cari.map((c) => {
            const kasaEntries = prev.kasa.filter((k) => k.cariId === c.id);
            const newBalance = kasaEntries.reduce((s, k) => s + (k.type === 'gelir' ? k.amount : -k.amount), 0);
            return { ...c, balance: newBalance };
          });
          return { ...prev, cari };
        });
        showToast('Cari bakiyeler yeniden hesaplandı!');
        diagnose();
      },
      true,
    );
  };

  const removeDupSales = () => {
    showConfirm('Tekrarları Temizle', "Aynı ID'li tekrarlanan satış kayıtları silinecek. Devam edilsin mi?", () => {
      save((prev) => {
        const seen = new Set<string>();
        return {
          ...prev,
          sales: prev.sales.filter((s) => {
            if (seen.has(s.id)) return false;
            seen.add(s.id);
            return true;
          }),
        };
      });
      showToast('Tekrarlanan satışlar temizlendi!');
      diagnose();
    });
  };

  const mergeduplicateCari = () => {
    const nameCounts: Record<string, string[]> = {};
    db.cari.forEach((c) => {
      const n = c.name.trim().toLowerCase();
      if (!nameCounts[n]) nameCounts[n] = [];
      nameCounts[n].push(c.id);
    });
    const dups = Object.entries(nameCounts).filter(([, ids]) => ids.length > 1);
    if (dups.length === 0) {
      showToast('Tekrarlanan cari bulunamadı!');
      return;
    }
    showConfirm(
      'Cari Birleştir',
      `${dups.length} isimde tekrar var. İlk kayıt korunacak. Devam?`,
      () => {
        save((prev) => {
          const toRemove = new Set<string>();
          dups.forEach(([, ids]) => ids.slice(1).forEach((id) => toRemove.add(id)));
          return { ...prev, cari: prev.cari.filter((c) => !toRemove.has(c.id)) };
        });
        showToast(`${dups.length} grup birleştirildi!`);
        diagnose();
      },
      true,
    );
  };

  return (
    <div className="grid gap-4">
      <Card title="🔧 Veri Tutarlılık Kontrolü">
        <p className="text-muted-foreground text-sm">
          Veritabanınızı analiz ederek tutarsız, eksik veya hatalı kayıtları tespit edin.
        </p>
        <div className="flex items-center gap-2.5">
          <Button
            onClick={diagnose}
            className="px-3 py-2.5 rounded-xl font-bold text-sm bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 flex-1"
          >
            🔍 Hızlı Analiz
          </Button>
          <Button
            onClick={handleDetailedHealthCheck}
            disabled={checkingHealth}
            className="px-3 py-2.5 rounded-xl font-bold text-sm bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 flex-1"
          >
            {checkingHealth ? '⏳ Analiz Ediliyor...' : '🛡️ Tam Sistem Taraması'}
          </Button>
        </div>

        {healthReport && (
          <div className="mt-4 grid gap-2">
            <div
              style={{
                padding: '12px',
                borderRadius: 12,
                background: healthReport.overall === 'healthy' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${healthReport.overall === 'healthy' ? '#10b981' : '#ef4444'}40`,
                textAlign: 'center',
              }}
            >
              <div
                style={{ color: healthReport.overall === 'healthy' ? 'var(--color-success)' : 'var(--color-danger)' }}
                className="text-foreground font-extrabold text-lg"
              >
                {healthReport.overall === 'healthy' ? '✅ Sistem Sağlıklı' : '⚠️ Sistemde Sorunlar Var'} (
                {healthReport.score}/100)
              </div>
            </div>
            {healthReport.metrics.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 p-2.5 border-b border-[var(--border)]">
                <div className="flex-1">
                  <div className="text-foreground font-bold text-sm">{m.name}</div>
                  <div className="text-[var(--text-dim)] text-xs">{m.detail}</div>
                </div>
                <div
                  className={
                    m.status === 'healthy'
                      ? 'inline-flex items-center rounded-md border border-transparent bg-green-500/20 text-green-400 px-2.5 py-0.5 text-xs font-semibold'
                      : m.status === 'degraded'
                        ? 'inline-flex items-center rounded-md border border-transparent bg-amber-500/20 text-amber-400 px-2.5 py-0.5 text-xs font-semibold'
                        : 'inline-flex items-center rounded-md border border-transparent bg-red-500/20 text-red-400 px-2.5 py-0.5 text-xs font-semibold'
                  }
                >
                  {m.value}
                  {m.unit || ''}
                </div>
              </div>
            ))}
            {healthReport.recommendations.length > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-[10px] p-3 text-sm">
                <div className="text-blue-400 font-bold text-sm">💡 Öneriler:</div>
                {healthReport.recommendations.map((rec, i) => (
                  <div key={i} className="text-muted-foreground text-xs">
                    • {rec}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {results.length > 0 && (
          <div className="grid gap-1.5">
            {results.map((r, i) => (
              <div
                key={i}
                style={{
                  padding: '10px 14px',
                  background: r.startsWith('✅')
                    ? 'rgba(16,185,129,0.08)'
                    : r.startsWith('📊')
                      ? 'rgba(59,130,246,0.08)'
                      : 'rgba(245,158,11,0.08)',
                  border: `1px solid ${r.startsWith('✅') ? 'rgba(16,185,129,0.2)' : r.startsWith('📊') ? 'rgba(59,130,246,0.2)' : 'rgba(245,158,11,0.2)'}`,
                  borderRadius: 9,
                  color: '#e2e8f0',
                  fontSize: '0.85rem',
                }}
              >
                {r}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="🛠️ Onarım Araçları">
        <div className="grid gap-2.5">
          {[
            {
              label: '📦 Negatif Stokları Sıfırla',
              desc: "Stok değeri 0'ın altına düşmüş ürünleri sıfıra çeker",
              action: fixNegativeStock,
              color: '#f59e0b',
            },
            {
              label: '🔗 Orphan Kasa Bağlantılarını Temizle',
              desc: 'Silinmiş cariye bağlı kasa kayıtlarındaki bağlantıyı kaldırır',
              action: fixOrphanKasa,
              color: '#3b82f6',
            },
            {
              label: '⚖️ Cari Bakiyeleri Yeniden Hesapla',
              desc: 'Tüm bakiyeleri kasa işlemlerine göre baştan hesaplar',
              action: recalcCariBalance,
              color: '#8b5cf6',
            },
            {
              label: '🗑️ Tekrarlayan Satış Kayıtlarını Temizle',
              desc: 'Aynı ID ile çift kaydedilmiş satışları siler',
              action: removeDupSales,
              color: '#10b981',
            },
            {
              label: '🤝 Aynı İsimli Cari Hesapları Birleştir',
              desc: 'Aynı isimde birden fazla cari varsa tek kayıt bırakır',
              action: mergeduplicateCari,
              color: '#ef4444',
            },
          ].map((t) => (
            <div
              key={t.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                background: 'var(--bg-card)',
                borderRadius: 10,
                border: `1px solid ${t.color}15`,
              }}
            >
              <div className="flex-1">
                <div className="text-foreground text-sm font-semibold">{t.label}</div>
                <div className="text-[var(--text-dim)] text-xs">{t.desc}</div>
              </div>
              <Button
                onClick={t.action}
                style={{
                  background: `${t.color}15`,
                  border: `1px solid ${t.color}30`,
                  borderRadius: 8,
                  color: t.color,
                  padding: '7px 14px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  whiteSpace: 'nowrap',
                }}
              >
                Uygula
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card title="📋 Sistem Bilgileri">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {[
            {
              label: 'Toplam Kayıt',
              value: `${[db.products, db.sales, db.cari, db.kasa, db.invoices || [], db.budgets || []].reduce((s, a) => s + a.length, 0)} kayıt`,
            },
            {
              label: 'localStorage Boyutu',
              value: `${Math.round(new Blob([localStorage.getItem('sobaYonetim') || '']).size / 1024)} KB`,
            },
            { label: 'Uygulama Versiyonu', value: `v${db._version || 1}` },
            {
              label: 'Son Veri Güncellemesi',
              value:
                db.kasa.length > 0
                  ? new Date(
                      Math.max(...db.kasa.map((k) => new Date(k.updatedAt || k.createdAt).getTime())),
                    ).toLocaleDateString('tr-TR')
                  : '-',
            },
          ].map((s) => (
            <div key={s.label} className="bg-[var(--bg-card)] rounded-[10px] p-3 text-center">
              <div className="text-[var(--text-dim)] text-xs">{s.label}</div>
              <div className="text-foreground text-sm font-semibold">{s.value}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
