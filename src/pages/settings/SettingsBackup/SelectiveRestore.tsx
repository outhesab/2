import { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/pages/SettingsCard';
import { saveBackupToFirebase, mergeRestoreDB } from '@/hooks/useDB';
import { logger } from '@/lib/logger';
import { RESTORE_SECTIONS } from './types';
import type { RestoreReport, DB } from './types';

interface SelectiveRestoreProps {
  showToast: (m: string, t?: string) => void;
  showConfirm: (t: string, m: string, ok: () => void, d?: boolean) => void;
  save: (fn: (prev: DB) => DB) => void;
  db: DB;
}

export function SelectiveRestore({ showToast, showConfirm, save, db }: SelectiveRestoreProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileData, setFileData] = useState<Record<string, unknown> | null>(null);
  const [fileName, setFileName] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [available, setAvailable] = useState<
    { key: string; label: string; icon: string; count: number; isObject?: boolean }[]
  >([]);
  const [lastReport, setLastReport] = useState<RestoreReport | null>(null);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (typeof data !== 'object' || Array.isArray(data)) {
          showToast('Geçersiz JSON formatı!', 'error');
          return;
        }
        setFileData(data);
        const avail: typeof available = [];
        RESTORE_SECTIONS.forEach((s) => {
          if (s.key === 'company' || s.key === 'pelletSettings') {
            if (data[s.key] && typeof data[s.key] === 'object' && !Array.isArray(data[s.key])) {
              avail.push({ key: s.key, label: s.label, icon: s.icon, count: 1, isObject: true });
            }
          } else if (Array.isArray(data[s.key]) && data[s.key].length > 0) {
            avail.push({ key: s.key, label: s.label, icon: s.icon, count: data[s.key].length });
          }
        });
        setAvailable(avail);
        setSelected(new Set(avail.map((a) => a.key)));
      } catch {
        logger.warn('settings', 'JSON ayrıştırılamadı');
        showToast('JSON ayrıştırılamadı!', 'error');
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  }, [showToast]);

  const toggleSection = useCallback((key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => setSelected(new Set(available.map((a) => a.key))), [available]);
  const selectNone = useCallback(() => setSelected(new Set()), []);

  const doRestore = useCallback(() => {
    if (!fileData || selected.size === 0) return;
    const selCount = available.filter((a) => selected.has(a.key)).reduce((s, a) => s + a.count, 0);
    showConfirm(
      'Seçimli Geri Yükleme',
      `${selected.size} bölüm (${selCount} kayıt) işlenecek. Mevcut ID'ler korunur, geçersiz adlar atlanır. Devam edilsin mi?`,
      () => {
        try {
          const preLabel = `onceki_${new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-')}`;
          saveBackupToFirebase(db, preLabel).catch(() =>
            logger.error('db', 'Seçimli geri yükleme öncesi yedek alınamadı'),
          );
          const { db: mergedDb, report } = mergeRestoreDB(db, fileData as Partial<DB>, selected);
          setLastReport(report);
          save(() => mergedDb);
          const msg = [
            `✅ ${report.added} kayıt eklendi.`,
            report.skippedDuplicate > 0 ? `${report.skippedDuplicate} tekrar (ID çakışması) atlandı.` : '',
            report.skippedInvalidName > 0 ? `${report.skippedInvalidName} geçersiz adlı kayıt atlandı.` : '',
            report.skippedMissingField > 0 ? `${report.skippedMissingField} eksik alanlı kayıt atlandı.` : '',
          ]
            .filter(Boolean)
            .join(' ');
          showToast(msg, report.skippedInvalidName > 0 || report.skippedMissingField > 0 ? 'info' : 'success');
          setTimeout(() => window.location.reload(), 2000);
        } catch {
          logger.warn('settings', 'Geri yükleme sırasında hata oluştu');
          showToast('Geri yükleme sırasında hata oluştu!', 'error');
        }
      },
      true,
    );
  }, [fileData, selected, available, showConfirm, showToast, save, db]);

  const reset = useCallback(() => {
    setFileData(null);
    setFileName('');
    setSelected(new Set());
    setAvailable([]);
    setLastReport(null);
  }, []);

  return (
    <Card title="📂 Seçimli Geri Yükleme">
      <p className="text-muted-foreground text-sm">
        Yedek dosyanızdan <strong className="text-orange-400 font-semibold">istediğiniz bölümleri seçerek</strong> geri
        yükleyin. Tüm veriyi değiştirmek zorunda değilsiniz.
      </p>

      {!fileData ? (
        <>
          <input ref={fileRef} type="file" accept=".json" onChange={handleFile} className="hidden" />
          <Button
            onClick={() => fileRef.current?.click()}
            className="px-4 py-3 rounded-xl font-bold text-sm border-2 border-dashed border-blue-500/30 bg-blue-500/10 w-full"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.15)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.08)';
            }}
          >
            JSON Yedek Dosyası Seç
          </Button>
        </>
      ) : (
        <div className="grid gap-3">
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-[10px] p-3">
            <span className="text-green-400 text-lg">📁</span>
            <span className="text-green-400 font-bold">{fileName}</span>
            <span className="text-muted-foreground text-xs">{available.length} bölüm bulundu</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-foreground text-sm font-semibold">Geri Yüklenecek Bölümler:</span>
            <Button onClick={selectAll} className="px-3 py-1.5 rounded-lg font-bold text-xs">Tümünü Seç</Button>
            <Button onClick={selectNone} className="btn-danger-sm px-3 py-1.5 rounded-lg font-bold text-xs">Hiçbirini Seçme</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {available.map((section) => {
              const isSelected = selected.has(section.key);
              return (
                <div
                  key={section.key}
                  onClick={() => toggleSection(section.key)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[10px] cursor-pointer transition-all duration-150"
                  style={{
                    background: isSelected ? 'rgba(59,130,246,0.08)' : 'rgba(0,0,0,0.2)',
                    border: `1px solid ${isSelected ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.04)'}`,
                  }}
                >
                  <div
                    className="flex items-center justify-center shrink-0 w-[22px] h-[22px] rounded-[6px] text-xs font-bold"
                    style={{
                      background: isSelected ? 'var(--color-info)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${isSelected ? '#3b82f6' : 'rgba(255,255,255,0.12)'}`,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {isSelected ? '✓' : ''}
                  </div>
                  <span className="text-base">{section.icon}</span>
                  <div className="flex-1">
                    <div
                      className="font-semibold text-sm"
                      style={{
                        color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                      }}
                    >
                      {section.label}
                    </div>
                    <div className="text-[var(--text-dim)] text-sm">
                      {section.isObject ? 'Ayarlar' : `${section.count} kayıt`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {selected.size > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
              Mevcut ID'ler korunur. Geçersiz adlar (boş, tek haneli, sadece sayı) ve zorunlu alanı eksik kayıtlar atlanır.
            </div>
          )}

          {lastReport && lastReport.warnings.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
              <div className="text-red-400 font-bold text-sm">
                ⚠️ Atlanan Kayıtlar ({lastReport.skippedDuplicate + lastReport.skippedInvalidName + lastReport.skippedMissingField})
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {lastReport.skippedDuplicate > 0 && (
                  <span className="inline-flex items-center rounded-md border border-transparent bg-blue-500/20 text-blue-400 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap">
                    🔁 {lastReport.skippedDuplicate} tekrar ID
                  </span>
                )}
                {lastReport.skippedInvalidName > 0 && (
                  <span className="inline-flex items-center rounded-md border border-transparent bg-red-500/20 text-red-400 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap">
                    ✗ {lastReport.skippedInvalidName} geçersiz ad
                  </span>
                )}
                {lastReport.skippedMissingField > 0 && (
                  <span className="inline-flex items-center rounded-md border border-transparent bg-amber-500/20 text-amber-400 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap">
                    ⚡ {lastReport.skippedMissingField} eksik alan
                  </span>
                )}
              </div>
              <div className="max-h-[200px] overflow-y-auto">
                {lastReport.warnings.map((w, i) => (
                  <div key={i} className="text-muted-foreground text-sm">• {w}</div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2.5">
            {selected.size > 0 && (
              <Button
                onClick={doRestore}
                className="px-3 py-2.5 rounded-xl font-bold text-sm bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 flex-1"
              >
                {selected.size} Bölümü Geri Yükle
              </Button>
            )}
            <Button
              onClick={reset}
              className="px-3 py-2 rounded-lg font-medium text-sm bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
            >
              Sıfırla
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
