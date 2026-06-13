"use client"

import { useState } from "react"
import { Check, Monitor, Palette } from "lucide-react"
import { AuthScreen } from "@/components/auth-screen"
import { AppShell, type PanelScreen } from "@/components/app-shell"
import { Dashboard } from "@/components/dashboard"
import { Fatura } from "@/components/fatura"
import { Raporlar } from "@/components/raporlar"
import { ParspelLogo } from "@/components/parspel-logo"

type Pack = "blue" | "teal"
type View = "auth" | PanelScreen

const packs: { id: Pack; name: string; desc: string; swatch: string }[] = [
  { id: "blue", name: "Kurumsal Mavi", desc: "Güven veren, klasik kurumsal", swatch: "oklch(0.52 0.18 258)" },
  { id: "teal", name: "Kurumsal Teal", desc: "Modern, sakin ve temiz", swatch: "oklch(0.55 0.1 192)" },
]

const screens: { id: View; label: string }[] = [
  { id: "auth", label: "Giriş" },
  { id: "dashboard", label: "Panel" },
  { id: "fatura", label: "Fatura" },
  { id: "raporlar", label: "Rapor" },
]

const panelMeta: Record<PanelScreen, { title: string; subtitle: string }> = {
  dashboard: { title: "Genel Bakış", subtitle: "Hoş geldiniz, sistemin güncel durumu aşağıda." },
  fatura: { title: "Faturalar", subtitle: "Tüm fatura kayıtlarını görüntüleyin ve yönetin." },
  raporlar: { title: "Raporlar", subtitle: "Gelir, gider ve servis performansı analizleri." },
}

export function ShowcaseClient() {
  const [pack, setPack] = useState<Pack>("blue")
  const [view, setView] = useState<View>("auth")

  const isPanel = view !== "auth"
  const panelScreen = (isPanel ? view : "dashboard") as PanelScreen

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Vitrin başlığı */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <ParspelLogo className="size-10" />
            <div>
              <h1 className="font-heading text-lg font-bold text-foreground">PARSPEL Tasarım Paketleri</h1>
              <p className="text-xs text-muted-foreground">İki kurumsal tema · tüm ekranlar</p>
            </div>
          </div>

          {/* Kontroller */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
              <Palette className="ml-1.5 size-3.5 text-muted-foreground" aria-hidden="true" />
              {packs.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPack(p.id)}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    pack === p.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="size-3 rounded-full" style={{ backgroundColor: p.swatch }} />
                  {p.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
              <Monitor className="ml-1.5 size-3.5 text-muted-foreground" aria-hidden="true" />
              {screens.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setView(s.id)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    view === s.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Paket bilgi şeridi */}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {packs.map((p) => {
            const selected = pack === p.id
            return (
              <button
                key={p.id}
                onClick={() => setPack(p.id)}
                className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                  selected
                    ? "border-primary bg-card shadow-sm ring-1 ring-primary"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <span
                  className="flex size-11 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: p.swatch }}
                >
                  {selected && <Check className="size-5 text-white" aria-hidden="true" />}
                </span>
                <div className="min-w-0">
                  <p className="font-heading text-sm font-bold text-foreground">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.desc}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Canlı önizleme */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div
          data-pack={pack === "teal" ? "teal" : undefined}
          className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
        >
          {view === "auth" ? (
            <AuthScreen />
          ) : (
            <AppShell
              active={panelScreen}
              onNavigate={(s) => setView(s)}
              title={panelMeta[panelScreen].title}
              subtitle={panelMeta[panelScreen].subtitle}
            >
              {panelScreen === "dashboard" && <Dashboard />}
              {panelScreen === "fatura" && <Fatura />}
              {panelScreen === "raporlar" && <Raporlar />}
            </AppShell>
          )}
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Önizleme yukarıdaki kontrollerle anlık güncellenir · PARSPEL © 2026
        </p>
      </div>
    </div>
  )
}
