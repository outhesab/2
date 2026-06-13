"use client"

import { Bar, BarChart, CartesianGrid, XAxis, Line, LineChart } from "recharts"
import { Download, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const gelirData = [
  { ay: "Oca", gelir: 182, gider: 120 },
  { ay: "Şub", gelir: 205, gider: 132 },
  { ay: "Mar", gelir: 198, gider: 128 },
  { ay: "Nis", gelir: 234, gider: 145 },
  { ay: "May", gelir: 256, gider: 152 },
  { ay: "Haz", gelir: 248, gider: 148 },
]

const servisData = [
  { ay: "Oca", servis: 42 },
  { ay: "Şub", servis: 51 },
  { ay: "Mar", servis: 48 },
  { ay: "Nis", servis: 63 },
  { ay: "May", servis: 71 },
  { ay: "Haz", servis: 68 },
]

const gelirConfig = {
  gelir: { label: "Gelir (₺bin)", color: "var(--chart-1)" },
  gider: { label: "Gider (₺bin)", color: "var(--chart-3)" },
} satisfies ChartConfig

const servisConfig = {
  servis: { label: "Servis Sayısı", color: "var(--chart-1)" },
} satisfies ChartConfig

const summary = [
  { label: "Net Kâr (6 Ay)", value: "₺538.000", delta: "+18,2%" },
  { label: "Ortalama Servis Süresi", value: "1,8 gün", delta: "-0,3 gün" },
  { label: "Müşteri Memnuniyeti", value: "%94", delta: "+2,1%" },
]

export function Raporlar() {
  return (
    <>
      {/* Üst şerit */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
          {summary.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                <p className="mt-1 font-heading text-xl font-bold text-foreground">{s.value}</p>
                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-primary">
                  <TrendingUp className="size-3.5" /> {s.delta}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end">
        <Button variant="outline" size="sm" className="h-9 gap-1.5">
          <Download className="size-4" /> Rapor İndir (PDF)
        </Button>
      </div>

      {/* Grafikler */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Gelir / Gider (Son 6 Ay)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={gelirConfig} className="h-[260px] w-full">
              <BarChart accessibilityLayer data={gelirData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="ay" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="gelir" fill="var(--color-gelir)" radius={4} />
                <Bar dataKey="gider" fill="var(--color-gider)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Aylık Servis Sayısı</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={servisConfig} className="h-[260px] w-full">
              <LineChart accessibilityLayer data={servisData} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="ay" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  dataKey="servis"
                  type="monotone"
                  stroke="var(--color-servis)"
                  strokeWidth={2.5}
                  dot={{ fill: "var(--color-servis)" }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
