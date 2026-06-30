/**
 * LoginScreen — Modern 2-Panel Kurumsal Karşılama Ekranı
 * Veri Katmanı: Firebase + localStorage (userManager.ts)
 */
import { useState, useEffect, useRef } from 'react';
import { BRAND_NAME } from '@/config/brand';
import { logger } from '@/lib/logger';
import {
  loginUser,
  getUserSession,
  setUserSession,
  clearUserSession,
  loadUsers,
  createUser,
  isGuestSession,
  getGuestSessionRemaining,
  type AppUser,
} from '@/lib/userManager';
import {
  User,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { ParspelLogo } from '@/components/logo/ParspelLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export { hashPassword as hashPass } from '@/lib/userManager';

// ── Oturum Hook ────────────────────────────────────────────────────────────
export function useAuth() {
  const [authed, setAuthed] = useState(() => !!getUserSession());
  const [currentUser, setCurrentUser] = useState(() => getUserSession());
  const [guestTimeLeft, setGuestTimeLeft] = useState(() => (isGuestSession() ? getGuestSessionRemaining() : 0));

  useEffect(() => {
    if (!isGuestSession()) {
      setGuestTimeLeft(0);
      return;
    }
    const tick = () => {
      const left = getGuestSessionRemaining();
      setGuestTimeLeft(left);
      if (left <= 0) {
        clearUserSession();
        setAuthed(false);
        setCurrentUser(null);
        setGuestTimeLeft(0);
        logger.info('auth', 'Misafir oturumu süresi doldu');
      }
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [authed]);

  const login = (user: AppUser, remember = false) => {
    setUserSession(user, remember);
    setCurrentUser({ userId: user.id, username: user.username, role: user.role });
    setAuthed(true);
    if (isGuestSession()) setGuestTimeLeft(getGuestSessionRemaining());
    logger.info('auth', 'Giriş başarılı', { username: user.username, role: user.role });
  };

  const logout = () => {
    clearUserSession();
    setAuthed(false);
    setCurrentUser(null);
    setGuestTimeLeft(0);
    logger.info('auth', 'Oturum kapatıldı');
  };

  return { authed, login, logout, currentUser, guestTimeLeft };
}

// ── Ana Bileşen ────────────────────────────────────────────────────────────
export default function LoginScreen({ onLogin }: { onLogin: (user: AppUser, remember: boolean) => void }) {
  const [username, setUsername] = useState('');
  const [pass, setPass] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [, setSuccess] = useState(false);
  const [fbStatus, setFbStatus] = useState<'connecting' | 'ready' | 'error'>('connecting');
  const [, setStatusMsg] = useState('Bağlanılıyor…');
  const usernameRef = useRef<HTMLInputElement>(null);

  // Kayıt modu
  const [registerMode, setRegisterMode] = useState(false);
  const [pass2, setPass2] = useState('');
  const [capsLock] = useState(false);

  useEffect(() => {
    const checkUsers = async () => {
      setFbStatus('connecting');
      setStatusMsg("Firebase'e bağlanılıyor…");
      try {
        const users = await loadUsers();
        if (!navigator.onLine && users.length > 0) {
          setFbStatus('ready');
          setStatusMsg(`Çevrimdışı giriş modu — ${users.filter((u) => u.active).length} yerel kullanıcı hazır`);
        } else if (!navigator.onLine && users.length === 0) {
          setFbStatus('error');
          setStatusMsg('İnternet kapalı ve yerel kullanıcı bulunamadı');
        } else if (users.length === 0) {
          setFbStatus('ready');
          setStatusMsg('Henüz kayıtlı kullanıcı yok — kayıt olun');
          setRegisterMode(true);
        } else {
          setFbStatus('ready');
          setStatusMsg(`${users.filter((u) => u.active).length} kullanıcı hazır`);
        }
      } catch {
        logger.warn('auth', 'Firebase bağlantısı kurulamadı');
        setFbStatus('error');
        setStatusMsg('Firebase bağlantısı kurulamadı');
      }
      setTimeout(() => usernameRef.current?.focus(), 300);
    };
    checkUsers();
  }, []);

  const doShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleLogin = async (userOverride?: string, passOverride?: string) => {
    const u = userOverride ?? username;
    const p = passOverride ?? pass;
    if (!u.trim()) {
      setError('Kullanıcı adı gerekli');
      doShake();
      return;
    }
    if (!p.trim()) {
      setError('Şifre gerekli');
      doShake();
      return;
    }
    setLoading(true);
    setError('');

    const users = await loadUsers();
    if (users.length === 0) {
      setError('Henüz kayıtlı kullanıcı yok. Lütfen kayıt olun.');
      setRegisterMode(true);
      setLoading(false);
      return;
    }
    const user = await loginUser(u.trim(), p);
    if (user) {
      setSuccess(true);
      setTimeout(() => onLogin(user, remember), 900);
    } else {
      setError('Kullanıcı adı veya şifre hatalı');
      doShake();
      setPass('');
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!username.trim()) {
      setError('Kullanıcı adı gerekli');
      doShake();
      return;
    }
    if (pass.length < 4) {
      setError('Şifre en az 4 karakter olmalı');
      doShake();
      return;
    }
    if (pass !== pass2) {
      setError('Şifreler eşleşmiyor');
      doShake();
      return;
    }
    setLoading(true);
    setError('');
    const result = await createUser(username.trim(), pass, 'user');
    if (result.ok) {
      const user = await loginUser(username.trim(), pass);
      if (user) {
        setSuccess(true);
        setTimeout(() => onLogin(user, remember), 900);
      } else {
        setError('Hesap oluşturuldu ama giriş yapılamadı. Lütfen giriş yapmayı deneyin.');
        setRegisterMode(false);
      }
    } else {
      setError(result.msg);
    }
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (registerMode) handleRegister();
    else handleLogin();
  };

  // CapsLock handler available if needed

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-10">
      <div
        className={`grid w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all ${shake ? 'animate-shake' : ''} lg:grid-cols-[1.05fr_1fr]`}
      >
        {/* SOL PANEL: Marka Kimliği */}
        <aside className="relative hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
          <div className="flex items-center gap-3">
            <ParspelLogo className="size-10 bg-primary-foreground/15" />
            <div className="leading-tight">
              <p className="font-heading text-lg font-bold">{BRAND_NAME}</p>
              <p className="text-xs text-primary-foreground/70">Soba Yönetim Sistemi</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-pretty font-heading text-3xl font-bold leading-tight">
              Müşteri ve cihaz kayıtlarınızı tek panelden yönetin.
            </h2>
            <p className="text-pretty text-sm leading-relaxed text-primary-foreground/80">
              Soba kurulumları, servis takibi ve müşteri geçmişi güvenle saklanır. Hızlı, sade ve kurumsal bir deneyim.
            </p>
          </div>

          <ul className="space-y-3 text-sm">
            {['Anlık servis ve bakım takibi', 'Şifrelenmiş müşteri kayıtları', 'Çok kullanıcılı erişim'].map((item) => (
              <li key={item} className="flex items-center gap-3 text-primary-foreground/85">
                <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </aside>

        {/* SAĞ PANEL: Form alanı */}
        <div className="flex flex-col justify-center px-6 py-10 sm:px-10">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <ParspelLogo className="size-14" />
            <h1 className="mt-3 font-heading text-2xl font-bold text-foreground">{BRAND_NAME}</h1>
            <p className="text-sm text-muted-foreground">Soba Yönetim Sistemi</p>
          </div>

          <div className="mb-6">
            <h2 className="font-heading text-2xl font-bold text-foreground">
              {registerMode ? 'Yeni müşteri kaydı' : 'Hoş geldiniz'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {registerMode
                ? 'Sisteme erişim için hesap bilgilerinizi oluşturun.'
                : 'Sisteme erişim için hesap bilgilerinizi girin.'}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="username">Kullanıcı adı</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  placeholder="Kullanıcı adı"
                  className="h-11 pl-10"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="En az 4 karakter"
                  className="h-11 pl-10 pr-10"
                  autoComplete="current-password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {registerMode && (
              <div className="space-y-2">
                <Label htmlFor="password-confirm">Şifre tekrar</Label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password-confirm"
                    type="password"
                    placeholder="Şifreyi tekrar girin"
                    className="h-11 pl-10"
                    autoComplete="new-password"
                    value={pass2}
                    onChange={(e) => setPass2(e.target.value)}
                  />
                </div>
              </div>
            )}

            {capsLock && (
              <div className="flex items-center gap-2 text-xs text-destructive font-medium">
                <AlertTriangle className="size-3" /> Caps Lock açık!
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-xs text-destructive font-medium">
                <AlertTriangle className="size-3" /> {error}
              </div>
            )}

            {!registerMode && (
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-border bg-background"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span>
                  Beni hatırla <span className="text-xs opacity-70">(30 gün)</span>
                </span>
              </label>
            )}

            {!registerMode && (
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 gap-2 text-sm font-semibold"
                onClick={() => {
                  // Round2 review C-3: Demo backdoor kaldırıldı.
                  // Demo için: import.meta.env.DEV koşuluyla ayrı bir development seed eklenebilir.
                  setRegisterMode(true);
                  setError('');
                }}
                disabled={loading}
              >
                <Sparkles className="size-4" /> Yeni Hesap Oluştur
              </Button>
            )}

            <Button type="submit" className="h-11 w-full gap-2 text-sm font-semibold" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="size-4 animate-spin" />
                  {registerMode ? 'Kaydediliyor…' : 'Doğrulanıyor…'}
                </span>
              ) : registerMode ? (
                <>
                  <UserPlus className="size-4" /> Kayıt Ol
                </>
              ) : (
                <>
                  <LogIn className="size-4" /> Giriş Yap
                </>
              )}
            </Button>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {registerMode ? 'Zaten hesabın var mı? ' : 'Hesabın yok mu? '}
              <button
                type="button"
                className="font-semibold text-primary hover:underline"
                onClick={() => {
                  setRegisterMode(!registerMode);
                  setError('');
                  setPass('');
                  setPass2('');
                }}
              >
                {registerMode ? 'Giriş Yap' : 'Kayıt Ol'}
              </button>
            </div>
          </form>

          {fbStatus === 'error' && (
            <div className="mt-6 p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-center">
              <div className="flex items-center justify-center gap-2 text-destructive font-semibold mb-2">
                <AlertTriangle className="size-4" /> Bağlantı Hatası
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Firebase'e erişilemiyor. Yerel kullanıcı yoksa internete bağlanıp bir kez giriş yapın.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  // checkUsers is defined inside useEffect, but for accessibility we can just call it or reload
                  window.location.reload();
                }}
                disabled={loading}
              >
                <RefreshCw className="size-3" /> Yeniden Bağlan
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
