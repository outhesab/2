import { Button } from '@/components/ui/button';
import { Card } from '@/pages/SettingsCard';
import { useConfirm } from '@/components/ConfirmDialog';
import { makeDefaultDB } from '@/lib/dbDefaults';
import type { DB } from '@/types';

interface DangerActionProps {
  label: string;
  desc: string;
  onConfirm: () => void;
}

export function DangerAction({ label, desc, onConfirm }: DangerActionProps) {
  const { showConfirm } = useConfirm();
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="text-foreground text-xs">{label}</div>
        <div className="text-[var(--text-dim)] text-xs">{desc}</div>
      </div>
      <Button
        onClick={() => showConfirm(label, `${desc}. Bu işlem geri alınamaz!`, onConfirm, true)}
        className="btn-danger-sm px-3 py-1.5 rounded-lg font-bold text-xs"
      >
        Temizle
      </Button>
    </div>
  );
}

interface DataStatsProps {
  db: DB;
  save: (fn: (prev: DB) => DB) => void;
  showToast: (m: string, t?: string) => void;
  showConfirm: (t: string, m: string, ok: () => void, d?: boolean) => void;
}

interface DataStatItem {
  label: string;
  count: number;
  icon: string;
}

export function DataPanel({ db, save, showToast, showConfirm }: DataStatsProps) {
  const dataStats: DataStatItem[] = [
    { label: 'Ürünler', count: db.products.length, icon: '📦' },
    { label: 'Satışlar', count: db.sales.length, icon: '🛒' },
    { label: 'Tedarikçiler', count: db.suppliers.length, icon: '🏭' },
    { label: 'Cari Hesaplar', count: db.cari.length, icon: '👤' },
    { label: 'Kasa İşlemleri', count: db.kasa.length, icon: '💰' },
    { label: 'Banka İşlemleri', count: db.bankTransactions.length, icon: '🏦' },
    { label: 'Pelet Tedarikçi', count: db.peletSuppliers.length, icon: '🪵' },
    { label: 'Boru Tedarikçi', count: db.boruSuppliers.length, icon: '🔩' },
  ];
  const totalRecords = dataStats.reduce((s, d) => s + d.count, 0);

  const clearData = () => {
    showConfirm(
      'Tüm Verileri Sil',
      'TÜM verileriniz kalıcı olarak silinecek! Bu işlem geri alınamaz. Emin misiniz?',
      () => {
        save(() => makeDefaultDB());
        window.location.reload();
      },
      true,
    );
  };

  return (
    <div className="grid gap-4">
      <Card title="🗄️ Veri İstatistikleri">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {dataStats.map((d) => (
            <div key={d.label} className="bg-[var(--bg-card)] rounded-[10px] p-3 text-center">
              <div className="text-xl mb-1">{d.icon}</div>
              <div
                style={{
                  fontSize: '1.3rem',
                  fontWeight: 900,
                  color: d.count > 0 ? 'var(--text-primary)' : 'var(--text-dim)',
                }}
              >
                {d.count}
              </div>
              <div className="text-[var(--text-dim)] text-xs">{d.label}</div>
            </div>
          ))}
        </div>
        <div className="text-center">
          Toplam <strong className="text-white">{totalRecords}</strong> kayıt · localStorage'da saklanıyor
        </div>
      </Card>

      <Card title="🗑️ Tehlikeli Alan">
        <p className="text-muted-foreground text-sm">
          Aşağıdaki işlemler <strong className="text-red-400 font-semibold">geri alınamaz</strong>. Önce yedek almanızı
          şiddetle tavsiye ederiz.
        </p>
        <div className="grid gap-2.5">
          <DangerAction
            label="Satış Geçmişini Temizle"
            desc={`${db.sales.length} satış kaydı silinecek`}
            onConfirm={() => {
              save((prev) => ({ ...prev, sales: [] }));
              showToast('Satış geçmişi temizlendi!');
            }}
          />
          <DangerAction
            label="Kasa İşlemlerini Temizle"
            desc={`${db.kasa.length} kasa kaydı silinecek`}
            onConfirm={() => {
              save((prev) => ({ ...prev, kasa: [] }));
              showToast('Kasa temizlendi!');
            }}
          />
          <DangerAction
            label="Aktivite Günlüğünü Temizle"
            desc={`${db._activityLog.length} kayıt silinecek`}
            onConfirm={() => {
              save((prev) => ({ ...prev, _activityLog: [] }));
              showToast('Aktivite günlüğü temizlendi!');
            }}
          />
          <Button onClick={clearData} className="btn-danger w-full py-3 rounded-xl font-bold text-sm">
            ☠️ TÜM VERİLERİ SİL ve Sıfırla
          </Button>
        </div>
      </Card>
    </div>
  );
}
