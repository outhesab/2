import type { DB } from "@/types"

export interface Props {
  db: DB
  save: (fn: (prev: DB) => DB) => void
}

export interface BankFormState {
  description: string
  amount: string
  type: "income" | "expense"
  date: string
  cariId: string
}

export type StatusFilter = "all" | "unmatched" | "matched" | "confirmed"
export type TypeFilter = "all" | "income" | "expense"

export interface BankStatsData {
  totalIn: number
  totalOut: number
  unmatched: number
  matched: number
  confirmed: number
}

export interface StatusLabel {
  label: string
  color: string
  bg: string
}

export const STATUS_LABEL: Record<string, StatusLabel> = {
  unmatched: {
    label: "⏳ Bekliyor",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
  },
  matched: {
    label: "🔄 Eşlendi",
    color: "#60a5fa",
    bg: "rgba(59,130,246,0.1)",
  },
  confirmed: {
    label: "✓ Onaylı",
    color: "#10b981",
    bg: "rgba(16,185,129,0.1)",
  },
}
