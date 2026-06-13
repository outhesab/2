import { Wallet, FileText, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { FaturaStats } from './types';

export function FaturaStatsBar({ stats }: { stats: FaturaStats }) {
  const iconTone: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    ok: "bg-accent text-accent-foreground",
    warn: "bg-chart-5/15 text-foreground",
    danger: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4 mb-6">
      {[
        {
          icon: Wallet,
          label: 'Toplam Tutar',
          value: stats.satisTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }),
          tone: 'primary',
        },
        {
          icon: FileText,
          label: 'Tahsil Edilen',
          value: stats.alisTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }),
          tone: 'ok',
        },
        {
          icon: Clock,
          label: 'Bekleyen',
          value: stats.unpaid.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }),
          tone: 'warn',
        },
        {
          icon: AlertCircle,
          label: 'Vadesi Geçen',
          value: String(stats.draft), // Prototipte vadesi geçen vardı, mevcut data'da draft var.
          tone: 'danger',
        },
      ].map((s) => (
        <Card key={s.label}>
          <CardContent className="flex items-center gap-3 p-4">
            <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${iconTone[s.tone]}`}>
              <s.icon className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
              <p className="font-heading text-lg font-bold text-foreground">{s.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
