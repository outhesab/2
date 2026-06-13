"use client"

import { useState } from "react"
import { Eye, EyeOff, KeyRound, Lock, ShieldCheck, User, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ParspelLogo } from "@/components/parspel-logo"

export function AuthScreen() {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="flex min-h-[640px] w-full items-center justify-center bg-background px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:grid-cols-[1.05fr_1fr]">
        {/* Marka paneli */}
        <aside className="relative hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
          <div className="flex items-center gap-3">
            <ParspelLogo className="size-10 bg-primary-foreground/15" />
            <div className="leading-tight">
              <p className="font-heading text-lg font-bold">PARSPEL</p>
              <p className="text-xs text-primary-foreground/70">Soba Yönetim Sistemi</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-pretty font-heading text-3xl font-bold leading-tight">
              Müşteri ve cihaz kayıtlarınızı tek panelden yönetin.
            </h2>
            <p className="text-pretty text-sm leading-relaxed text-primary-foreground/80">
              Soba kurulumları, servis takibi ve müşteri geçmişi güvenle saklanır. Hızlı, sade ve
              kurumsal bir deneyim.
            </p>
          </div>

          <ul className="space-y-3 text-sm">
            {["Anlık servis ve bakım takibi", "Şifrelenmiş müşteri kayıtları", "Çok kullanıcılı erişim"].map(
              (item) => (
                <li key={item} className="flex items-center gap-3 text-primary-foreground/85">
                  <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
                  {item}
                </li>
              ),
            )}
          </ul>
        </aside>

        {/* Form paneli */}
        <div className="flex flex-col justify-center px-6 py-10 sm:px-10">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <ParspelLogo className="size-14" />
            <h1 className="mt-3 font-heading text-2xl font-bold text-foreground">PARSPEL</h1>
            <p className="text-sm text-muted-foreground">Soba Yönetim Sistemi</p>
          </div>

          <div className="mb-6">
            <h2 className="font-heading text-2xl font-bold text-foreground">Yeni müşteri kaydı</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sisteme erişim için hesap bilgilerinizi oluşturun.
            </p>
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <Label htmlFor="username">Kullanıcı adı</Label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input id="username" placeholder="Kullanıcı adı" className="h-11 pl-10" autoComplete="username" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="En az 4 karakter"
                  className="h-11 pl-10 pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password-confirm">Şifre tekrar</Label>
              <div className="relative">
                <KeyRound
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="password-confirm"
                  type="password"
                  placeholder="Şifreyi tekrar girin"
                  className="h-11 pl-10"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <Button type="submit" className="h-11 w-full gap-2 text-sm font-semibold">
              <UserPlus className="size-4" aria-hidden="true" />
              Kayıt Ol
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Zaten hesabın var mı?{" "}
            <button className="font-semibold text-primary hover:underline">Giriş Yap</button>
          </p>
        </div>
      </div>
    </div>
  )
}
