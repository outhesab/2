import { formatMoney } from "@/lib/utils-tr"
import { StatCard } from "./StatCard"
import type { BankStatsData } from "./types"

interface BankStatsProps {
  stats: BankStatsData
}

export function BankStats({ stats }: BankStatsProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
        gap: 12,
        marginBottom: 20,
      }}
    >
      <StatCard
        label="Toplam Gelen"
        value={formatMoney(stats.totalIn)}
        color="#10b981"
      />
      <StatCard
        label="Toplam Giden"
        value={formatMoney(stats.totalOut)}
        color="#ef4444"
      />
      <StatCard
        label="Net Bakiye"
        value={formatMoney(stats.totalIn - stats.totalOut)}
        color={stats.totalIn >= stats.totalOut ? "#3b82f6" : "#ef4444"}
      />
      <StatCard
        label="Bekliyor"
        value={String(stats.unmatched)}
        color="#f59e0b"
        sub={stats.unmatched > 0 ? "Eşleştirme gerekli" : undefined}
      />
      <StatCard
        label="Eşlendi"
        value={String(stats.matched)}
        color="#60a5fa"
        sub={stats.matched > 0 ? "Onay bekliyor" : undefined}
      />
      <StatCard
        label="Onaylı"
        value={String(stats.confirmed)}
        color="#10b981"
      />
    </div>
  )
}
