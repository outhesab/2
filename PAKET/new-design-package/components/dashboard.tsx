"use client"

import { TrendingUp, TrendingDown, Plus } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const stats = [
  { label: "Toplam Müşteri", value: "1.284", delta: "+8,2%", up: true },
  { label: "Aktif Servis", value: "37", delta: "+4 bugün", up: true },
  { label: "Bekleyen Bakım", value: "12", delta: "-3 bu hafta", up: false },
  { label: "Aylık Gelir", value: "₺248.500", delta: "+12,4%", up: true },
]

const services = [
  { customer: "Ahmet Yılmaz", device: "Kat Kaloriferi · KX-200", status: "Tamamlandı", date: "12 Haz", tone: "ok" },
  { customer: "Elif Demir", device: "Pelet Soba · P-450", status: "Devam Ediyor", date: "12 Haz", tone: "warn" },
  { customer: "Mehmet Kaya", device: "Kombi · C-90", status: "Bekliyor", date: "11 Haz", tone: "idle" },
  { customer: "Zeynep Şahin", device: "Doğalgaz Soba · DG-12", status: "Tamamlandı", date: "10 Haz", tone: "ok" },
  { customer: "Can Aydın", device: "Pelet Soba · P-300", status: "Devam Ediyor", date: "10 Haz", tone: "warn" },
]

const statusStyles: Record<string, string> = {
  ok: "bg-accent text-accent-foreground",
  warn: "bg-chart-5/15 text-foreground",
  idle: "bg-muted text-muted-foreground",
}

export function Dashboard() {
  return (
    <>
      {/* İstatistik kartları */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
              <p className="mt-2 font-heading text-2xl font-bold text-foreground">{s.value}</p>
              <p
                className={`mt-1 flex items-center gap-1 text-xs font-medium ${
                  s.up ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {s.up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                {s.delta}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Servis tablosu */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="font-heading text-base">Son Servis Kayıtları</CardTitle>
          <Button size="sm" className="h-8 gap-1.5">
            <Plus className="size-4" /> Yeni Kayıt
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-border bg-muted/50 text-left text-xs text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Müşteri</th>
                  <th className="px-6 py-3 font-medium">Cihaz</th>
                  <th className="px-6 py-3 font-medium">Durum</th>
                  <th className="px-6 py-3 text-right font-medium">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {services.map((row) => (
                  <tr key={row.customer} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">
                            {row.customer
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">{row.customer}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-muted-foreground">{row.device}</td>
                    <td className="px-6 py-3.5">
                      <Badge variant="secondary" className={`font-medium ${statusStyles[row.tone]}`}>
                        {row.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-right text-muted-foreground">{row.date}</td>
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
