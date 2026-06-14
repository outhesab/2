import { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/pages/SettingsCard';
import { saveBackupToFirebase } from '@/hooks/useDB';
import { logger } from '@/lib/logger';
import { ARRAY_KEYS } from './types';
import type { RestoreReport, DB } from './types';

interface FullRestorePanelProps {
  showToast: (m: string, t?: string) => void;
  showConfirm: (t: string, m: string, ok: () => void, d?: boolean) => void;
  save: (fn: (prev: DB) => DB) => void;
  db: DB;
}

export function FullRestorePanel({ showToast, showConfirm, save, db }: FullRestorePanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [lastReport, setLastReport] = useState<RestoreReport | null>(null);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileRef.current) fileRef.current.value = '';

    showConfirm(
      '⚠️ Tam Geri Yükleme',
      `"${file.name}" dosyasındaki veriler yükleniyor. Mevcut tüm veriler bu yedekle değiştirilecek. Önceki veri otomatik yedeklenir. Devam edilsin mi?`,
      () => {
        saveBackupToFirebase(
          db,
          `onceki_${new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-')}`,
        ).catch(() => logger.error('db', 'Tam geri yükleme öncesi yedek alınamadı'));

        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const raw = JSON.parse(ev.target?.result as string) as DB;
            save((prev) => {
              const def = { ...prev };
              const merged: DB = { ...def, ...raw };
              for (const key of ARRAY_KEYS) {
                if (!Array.isArray((merged as unknown as Record<string, unknown>)[key])) {
                  (merged as unknown as Record<string, unknown>)[key] = [];
                }
              }
              if (!merged.kasalar || merged.kasalar.length === 0) merged.kasalar = def.kasalar;
              if (!merged.company || typeof merged.company !== 'object') merged.company = def.company;
              if (!merged.pelletSettings) merged.pelletSettings = def.pelletSettings;
              if (!Array.isArray(merged.productCategories) || merged.productCategories.length === 0) {
                merged.productCategories = def.productCategories;
              }
              return merged;
            });

            const report: RestoreReport = {
              added: 0,
              skippedDuplicate: 0,
              skippedInvalidName: 0,
              skippedMissingField: 0,
              warnings: [],
            };

            (raw.cari || []).forEach((c: { name?: unknown }) => {
              if (typeof c.name !== 'string' || c.name.trim().length < 2 || /^\d+$/.test(c.name.trim())) {
                report.skippedInvalidName++;
                report.warnings.push(`Cari gizlendi: "${c.name}" — geçersiz ad`);
              }
            });
            (raw.products || []).forEach((p: { name?: unknown }) => {
              if (typeof p.name !== 'string' || p.name.trim().length < 2 || /^\d+$/.test(p.name.trim())) {
                report.skippedInvalidName++;
                report.warnings.push(`Ürün gizlendi: "${p.name}" — geçersiz ad`);
              }
            });
            setLastReport(report);

            const msg =
              report.skippedInvalidName > 0
                ? `✅ Geri yükleme tamamlandı. ${report.skippedInvalidName} geçersiz kayıt gizlendi.`
                : '✅ Tam geri yükleme başarılı! Önceki veri yedeklendi.';
            showToast(msg, 'success');
            setTimeout(() => window.location.reload(), 1800);
          } catch {
            logger.warn('settings', 'Yedek dosyası okunamadı veya geçersiz format');
            showToast('Dosya okunamadı veya geçersiz format!', 'error');
          }
        };
        reader.readAsText(file);
      },
      true,
    );
  }, [showConfirm, showToast, save, db]);

  return (
    <Card title="🔁 Tam Geri Yükleme">
      <div className="bg-red-500/10 border border-red-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
        <strong>Dikkat:</strong> Mevcut tüm veriler yedekteki verilerle değiştirilir. İşlem öncesi otomatik yedek
        alınır. Yedekten gelen geçersiz adlı kayıtlar (boş, tek haneli, sadece sayı) gizlenir.
      </div>
      <input ref={fileRef} type="file" accept=".json" onChange={handleFile} className="hidden" />
      <Button
        onClick={() => fileRef.current?.click()}
        className="btn-danger-dashed w-full py-3 rounded-xl font-bold text-sm border-2 border-dashed border-red-500/30 bg-red-500/10"
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.15)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)';
        }}
      >
        📂 JSON Yedek Dosyası Seç — Tam Geri Yükle
      </Button>

      {lastReport && lastReport.warnings.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
          <div className="text-amber-400 font-bold text-sm">⚠️ Gizlenen Kayıtlar</div>
          {lastReport.warnings.map((w, i) => (
            <div key={i} className="text-muted-foreground text-sm">• {w}</div>
          ))}
        </div>
      )}
    </Card>
  );
}
