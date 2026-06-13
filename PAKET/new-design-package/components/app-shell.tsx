"use client"

import type { ReactNode } from "react"
import { Bell, Flame, LayoutDashboard, Receipt, Search, Settings, BarChart3 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ParspelLogo } from "@/components/parspel-logo"

export type PanelScreen = "dashboard" | "fatura" | "raporlar"

const nav: { id: PanelScreen; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Genel Bakış", icon: LayoutDashboard },
  { id: "fatura", label: "Faturalar", icon: Receipt },
  { id: "raporlar", label: "Raporlar", icon: BarChart3 },
]

export function AppShell({
  active,
  onNavigate,
  title,
  subtitle,
  children,
}: {
  active: PanelScreen
  onNavigate: (s: PanelScreen) => void
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-[640px] w-full bg-background">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <div className="mb-6 flex items-center gap-3 px-2">
          <ParspelLogo className="size-9" />
          <div className="leading-tight">
            <p className="font-heading text-sm font-bold text-sidebar-foreground">PARSPEL</p>
            <p className="text-[11px] text-muted-foreground">Yönetim Paneli</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {nav.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active === item.id
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="size-4" aria-hidden="true" />
              {item.label}
            </button>
          ))}
          <button className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <Settings className="size-4" aria-hidden="true" />
            Ayarlar
          </button>
        </nav>
        <div className="mt-auto rounded-lg bg-accent p-3">
          <p className="flex items-center gap-2 text-xs font-semibold text-accent-foreground">
            <Flame className="size-3.5" /> Sezon Aktif
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Kış sezonu servis talepleri %12 arttı.
          </p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border bg-card px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <h1 className="font-heading text-lg font-bold text-foreground">{title}</h1>
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative hidden sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Ara..." className="h-9 w-40 pl-9" />
            </div>
            <Button variant="outline" size="icon" className="size-9 shrink-0" aria-label="Bildirimler">
              <Bell className="size-4" />
            </Button>
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">PA</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Mobil sekme navigasyonu */}
        <div className="flex gap-1 border-b border-border bg-card px-2 py-2 lg:hidden">
          {nav.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                active === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              <item.icon className="size-3.5" aria-hidden="true" />
              {item.label}
            </button>
          ))}
        </div>

        <main className="flex-1 space-y-6 overflow-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
