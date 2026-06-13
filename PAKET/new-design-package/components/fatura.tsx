"use client"

import { Plus, Download, Filter, FileText, Wallet, Clock, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const stats = [
  { label: "Toplam Tutar", value: "₺486.250", icon: Wallet, tone: "primary" },
  { label: "Tahsil Edilen", value: "₺312.800", icon: FileText, tone: "ok" },
  { label: "Bekleyen", value: "₺142.450", icon: Clock, tone: "warn" },
  { label: "Vadesi Geçen", value: "₺31.000", icon: AlertCircle, tone: "danger" },
]

const invoices = [
  { no: "FT-2026-0142", customer: "Ahmet Yılmaz", amount: "₺4.250", date: "12 Haz 2026", status: "Ödendi", tone: "ok" },
  { no: "FT-2026-0141", customer: "Elif Demir", amount: "₺8.900", date: "11 Haz 2026", status: "Bekliyor", tone: "warn" },
  { no: "FT-2026-0140", customer: "Mehmet Kaya", amount: "₺2.100", date: "10 Haz 2026", status: "Ödendi", tone: "ok" },
  { no: "FT-2026-0139", customer: "Zeynep Şahin", amount: "₺12.400", date: "08 Haz 2026", status: "Vadesi Geçti", tone: "danger" },
  { no: "FT-2026-0138", customer: "Can Aydın", amount: "₺3.750", date: "07 Haz 2026", status: "Ödendi", tone: "ok" },
  { no: "FT-2026-0137", customer: "Selin Arslan", amount: "₺6.200", date: "05 Haz 2026", status: "Bekliyor", tone: "warn" },
]

const iconTone: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  ok: "bg-accent text-accent-foreground",
  warn: "bg-chart-5/15 text-foreground",
  danger: "bg-destructive/10 text-destructive",
}

const statusStyles: Record<string, string> = {
  ok: "bg-accent text-accent-foreground",
  warn: "bg-chart-5/15 text-foreground",
  danger: "bg-destructive/10 text-destructive",
}

export function Fatura() {
  return (
    <>
      {/* Özet kartlar */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((s) => (
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

      {/* Araç çubuğu */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input placeholder="Fatura no veya müşteri ara..." className="h-9 w-full max-w-xs" />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-1.5">
            <Filter className="size-4" /> Filtrele
          </Button>
          <Button variant="outline" size="sm" className="h-9 gap-1.5">
            <Download className="size-4" /> Dışa Aktar
          </Button>
          <Button size="sm" className="h-9 gap-1.5">
            <Plus className="size-4" /> Yeni Fatura
          </Button>
        </div>
      </div>

      {/* Fatura tablosu */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Fatura No</th>
                  <th className="px-6 py-3 font-medium">Müşteri</th>
                  <th className="px-6 py-3 font-medium">Tarih</th>
                  <th className="px-6 py-3 font-medium">Durum</th>
                  <th className="px-6 py-3 text-right font-medium">Tutar</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((row) => (
                  <tr key={row.no} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="px-6 py-3.5 font-mono text-xs font-medium text-foreground">{row.no}</td>
                    <td className="px-6 py-3.5 font-medium text-foreground">{row.customer}</td>
                    <td className="px-6 py-3.5 text-muted-foreground">{row.date}</td>
                    <td className="px-6 py-3.5">
                      <Badge variant="secondary" className={`font-medium ${statusStyles[row.tone]}`}>
                        {row.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-right font-semibold text-foreground">{row.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
