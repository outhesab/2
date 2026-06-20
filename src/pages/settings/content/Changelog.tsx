/**
 * Changelog.tsx — Versiyon Geçmişi
 *
 * src/lib/changelog.ts dosyasındaki verileri dinamik olarak okuyup
 * şık bir sürüm geçmişi listesi şeklinde sunar.
 */

import { CHANGELOG } from '@/lib/changelog';
import { Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const TYPE_CONFIG = {
  yeni: { label: 'Yeni', color: 'bg-green-100 text-green-700 border-green-200' },
  iyilestirme: { label: 'İyileştirme', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  duzeltme: { label: 'Düzeltme', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  kaldirildi: { label: 'Kaldırıldı', color: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export default function Changelog() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-12">
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-2">
          <Tag className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Sürüm Geçmişi</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          PARSPEL'in gelişim süreci. Her güncelleme ile daha güçlü, daha hızlı ve daha akıllı.
        </p>
      </div>

      <div className="space-y-10">
        {CHANGELOG.map((version, vIdx) => (
          <div key={version.version} className="relative pl-8 border-l-2 border-slate-200 ml-4 space-y-6">
            {/* Version Header */}
            <div className="absolute -left-[13px] top-0 w-6 h-6 bg-background border-2 border-primary rounded-full flex items-center justify-center z-10">
              <div className="w-2 h-2 bg-primary rounded-full" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">v{version.version}</h2>
                  <Badge variant="outline" className="font-mono">{version.date}</Badge>
                </div>
                <p className="text-muted-foreground font-medium">{version.title}</p>
              </div>
              <div className="text-sm text-muted-foreground italic max-w-md text-right hidden md:block">
                {version.summary}
              </div>
            </div>

            {/* Changes List */}
            <div className="grid grid-cols-1 gap-4">
              {version.changes.map((change, cIdx) => (
                <div
                  key={cIdx}
                  className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-transparent hover:border-primary/20 transition-all duration-200"
                >
                  <div className="mt-1">
                    <Badge variant="outline" className={`${TYPE_CONFIG[change.type]?.color || 'bg-slate-100'}`}>
                      {TYPE_CONFIG[change.type]?.label || change.type}
                    </Badge>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/80">
                    {change.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
