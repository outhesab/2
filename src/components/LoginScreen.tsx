/**
 * Giriş Ekranı — Kullanıcı Adı + Şifre
 * Kullanıcılar Firebase config/users dökümanında saklanır
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { BRAND_NAME, BRAND_SUBTITLE, getBrandVersion } from "@/config/brand";
import { logger } from '@/lib/logger';
import {
  loginUser, getUserSession, setUserSession, clearUserSession,
  loadUsers, createUser, startGuestSession, isGuestSession,
  getGuestSessionRemaining, type AppUser,
} from '@/lib/userManager';
import { User, Lock, KeyRound, Eye, EyeOff, LogIn, UserPlus, RefreshCw, AlertTriangle, Zap, Sparkles } from 'lucide-react';

export { hashPassword as hashPass } from '@/lib/userManager';

// ── Oturum hook ────────────────────────────────────────────────────────────
export function useAuth() {
  const [authed, setAuthed] = useState(() => !!getUserSession());
  const [currentUser, setCurrentUser] = useState(() => getUserSession());
  const [guestTimeLeft, setGuestTimeLeft] = useState(() =>
    isGuestSession() ? getGuestSessionRemaining() : 0,
  );

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

// ── Parçacıklar ────────────────────────────────────────────────────────────
const PARTICLES = Array.from({ length: 55 }, (_, i) => ({
  size: 2 + ((i * 7) % 5),
  left: (i * 19.3) % 100,
  delay: (i * 1.37) % 22,
  duration: 14 + ((i * 3.1) % 24),
  color: i % 4 === 0 ? '#ff5722' : i % 4 === 1 ? '#ff9800' : i % 4 === 2 ? '#ffb74d' : 'rgba(255,255,255,0.6)',
  glow: i % 4 === 0,
}));

function Particle({ p }: { p: typeof PARTICLES[number] }) {
  return (
    <div className="login-particle" style={{
      width: p.size, height: p.size,
      background: p.color, left: `${p.left}%`, bottom: '-5%', opacity: 0,
      animation: `floatUp ${p.duration}s ${p.delay}s infinite`,
      boxShadow: p.glow ? `0 0 8px 2px rgba(255,87,34,0.5)` : 'none',
    }} />
  );
}

// ── Ana bileşen ────────────────────────────────────────────────────────────
export default function LoginScreen({ onLogin }: { onLogin: (user: AppUser, remember: boolean) => void }) {
  const [username, setUsername] = useState('');
  const [pass, setPass] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fbStatus, setFbStatus] = useState<'connecting' | 'ready' | 'error'>('connecting');
  const [statusMsg, setStatusMsg] = useState('Bağlanılıyor…');
  const [time, setTime] = useState(new Date());
  const usernameRef = useRef<HTMLInputElement>(null);

  // Kayıt modu
  const [registerMode, setRegisterMode] = useState(false);
  const [pass2, setPass2] = useState('');
  const [capsLock, setCapsLock] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const checkUsers = useCallback(async () => {
    setFbStatus('connecting');
    setStatusMsg('Firebase\'e bağlanılıyor…');
    try {
      const users = await loadUsers();
      if (!navigator.onLine && users.length > 0) {
        setFbStatus('ready');
        setStatusMsg(`Çevrimdışı giriş modu — ${users.filter(u => u.active).length} yerel kullanıcı hazır`);
      } else if (!navigator.onLine && users.length === 0) {
        setFbStatus('error');
        setStatusMsg('İnternet kapalı ve yerel kullanıcı bulunamadı');
      } else if (users.length === 0) {
        setFbStatus('ready');
        setStatusMsg('Henüz kayıtlı kullanıcı yok — kayıt olun');
        setRegisterMode(true);
      } else {
        setFbStatus('ready');
        setStatusMsg(`${users.filter(u => u.active).length} kullanıcı hazır`);
      }
    } catch {
      logger.warn('auth', 'Firebase bağlantısı kurulamadı');
      setFbStatus('error');
      setStatusMsg('Firebase bağlantısı kurulamadı');
    }
    setTimeout(() => usernameRef.current?.focus(), 300);
  }, []);

  useEffect(() => { checkUsers(); }, [checkUsers]);

  const doShake = () => { setShake(true); setTimeout(() => setShake(false), 600); };

    const handleLogin = async (userOverride?: string, passOverride?: string) => {
      const u = userOverride ?? username;
      const p = passOverride ?? pass;
      if (!u.trim()) { setError('Kullanıcı adı gerekli'); doShake(); return; }
      if (!p.trim()) { setError('Şifre gerekli'); doShake(); return; }
      setLoading(true); setError('');

      // Demo kullanıcı kontrolü: demo29605 her zaman giriş yapabilir (database boş olsa bile)
      if (u.trim() === 'demo29605' && p.trim() === 'demo1234') {
        const demoUser: AppUser = { id: 'demo_id', username: 'Demo Kullanıcı', passwordHash: 'demo1234', role: 'admin', active: true, createdAt: new Date().toISOString() };
        setSuccess(true);
        setTimeout(() => onLogin(demoUser, remember), 900);
        setLoading(false);
        return;
      }

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
        doShake(); setPass('');
      }
      setLoading(false);
    };

  const handleRegister = async () => {
    if (!username.trim()) { setError('Kullanıcı adı gerekli'); doShake(); return; }
    if (pass.length < 4) { setError('Şifre en az 4 karakter olmalı'); doShake(); return; }
    if (pass !== pass2) { setError('Şifreler eşleşmiyor'); doShake(); return; }
    setLoading(true); setError('');
    const result = await createUser(username.trim(), pass, 'user');
    if (result.ok) {
      const user = await loginUser(username.trim(), pass);
      if (user) { setSuccess(true); setTimeout(() => onLogin(user, remember), 900); }
      else { setError('Hesap oluşturuldu ama giriş yapılamadı. Lütfen giriş yapmayı deneyin.'); setRegisterMode(false); }
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

  const handleCapsLock = (e: React.KeyboardEvent) => {
    setCapsLock(e.getModifierState('CapsLock'));
  };

  const fbDots = { connecting: '◌', ready: '●', error: '✕' };

  return (
    <div className="login-overlay">


      {/* Arka plan */}
      <div className="login-bg-gradient" />
      <div className="login-bg-glow" />
      {PARTICLES.map((p, i) => <Particle key={i} p={p} />)}

      {/* Üst bilgi */}
      <div className="login-header">
        {BRAND_NAME} · {BRAND_SUBTITLE}
      </div>
      <div className="login-clock">
        {time.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
      <div className="login-fb-status">
        <span className={`login-fb-dot ${fbStatus}`} style={{ animation: fbStatus === 'connecting' ? 'loginFbDot 1.2s ease-in-out infinite' : 'none' }}>{fbDots[fbStatus]}</span>
        <span className="login-fb-label">Firebase</span>
      </div>

      {/* Kart */}
      <div className={`login-card-wrap${success ? ' success' : shake ? ' shake' : ' enter'}`}>
        {success && (
          <div className="login-success-ring">
            <div className="login-success-ring-inner" />
          </div>
        )}

        <div className="login-card">
          {/* Logo */}
          <div className="login-logo-wrap">
              <div className="login-logo-circle">
                {success ? <Sparkles size={32} /> : <Zap size={32} />}
              </div>
            <h1 className="login-title">
              {BRAND_NAME}
            </h1>
            <p className="login-subtitle">
              {fbStatus === 'connecting'
                ? 'Bağlanılıyor…'
                : fbStatus === 'error'
                  ? statusMsg
                  : registerMode
                    ? 'Yeni müşteri kaydı oluşturun'
                    : 'Kullanıcı adı ve şifrenizle giriş yapın'}
            </p>
          </div>

          {/* Bağlanıyor skeleton */}
          {fbStatus === 'connecting' && (
            <div className="login-skeleton">
              <div className="login-skeleton-row"><div className="login-skeleton-shape" style={{ width: '100%', height: 52, borderRadius: 14 }} /></div>
              <div className="login-skeleton-row"><div className="login-skeleton-shape" style={{ width: '100%', height: 52, borderRadius: 14 }} /></div>
              <div className="login-skeleton-row"><div className="login-skeleton-shape" style={{ width: '40%', height: 20, borderRadius: 8 }} /></div>
              <div className="login-skeleton-row"><div className="login-skeleton-shape" style={{ width: '100%', height: 52, borderRadius: 14 }} /></div>
            </div>
          )}

          {/* Hata + misafir */}
          {fbStatus === 'error' && (
            <div className="login-error-box">
              <div className="login-error-title"><AlertTriangle size={14} /> Bağlantı Hatası</div>
              <div className="login-error-desc">Firebase'e erişilemiyor. Yerel kullanıcı yoksa internete bağlanıp bir kez giriş yapın.</div>
              <button className="login-guest-btn" onClick={() => {
                const guest = startGuestSession();
                setSuccess(true);
                setTimeout(() => onLogin(guest, false), 900);
              }}>
                <Zap size={16} /> 15dk Misafir Girişi
              </button>
            </div>
          )}

          {/* Form */}
          {(fbStatus === 'ready' || fbStatus === 'error') && (
            <form className="login-form" onSubmit={handleSubmit}>
              {/* Kullanıcı adı */}
              <div className="login-field">
                <User className="login-field-icon" size={18} />
                <input
                  ref={usernameRef}
                  className={`login-input${error ? ' error' : ''}`}
                  type="text"
                  value={username}
                  onChange={e => { setUsername(e.target.value); setError(''); }}
                  placeholder="Kullanıcı adı"
                  autoComplete="username"
                />
              </div>

              {/* Şifre */}
              <div className="login-field">
                <Lock className="login-field-icon" size={18} />
                <input
                  className={`login-input${error ? ' error' : ''}`}
                  type={showPass ? 'text' : 'password'}
                  value={pass}
                  onChange={e => { setPass(e.target.value); setError(''); }}
                  onKeyDown={handleCapsLock}
                  placeholder="Şifre (en az 4 karakter)"
                  autoComplete={registerMode ? 'new-password' : 'current-password'}
                />
                <button className="login-pass-toggle" onClick={() => setShowPass(v => !v)} aria-label={showPass ? 'Şifreyi gizle' : 'Şifreyi göster'}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Şifre tekrar (kayıt modu) */}
              {registerMode && (
                <div className="login-field">
                  <KeyRound className="login-field-icon" size={18} />
                  <input
                    className={`login-input${error ? ' error' : ''}`}
                    type={showPass ? 'text' : 'password'}
                    value={pass2}
                    onChange={e => { setPass2(e.target.value); setError(''); }}
                    onKeyDown={handleCapsLock}
                    placeholder="Şifreyi tekrar girin"
                    autoComplete="new-password"
                  />
                </div>
              )}

              {/* Caps Lock uyarısı */}
              {capsLock && (
                <div className="login-capslock-warn">
                  <AlertTriangle size={14} /> Caps Lock açık!
                </div>
              )}

              {/* Hata mesajı */}
              {error && (
                <div className="login-error-msg">
                  <AlertTriangle size={16} /> {error}
                </div>
              )}

              {/* Beni hatırla (sadece giriş) */}
              {!registerMode && (
                <label className="login-remember">
                  <input className="login-remember-checkbox" type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
                  <span className="login-remember-text">Beni hatırla <span className="login-remember-hint">(30 gün)</span></span>
                </label>
              )}

              {/* Demo hızlı giriş */}
              {!registerMode && (
                <button
                  type="button"
                  className="login-demo-btn"
                  onClick={() => handleLogin('demo29605', 'demo1234')}
                  disabled={loading}
                >
                  <Sparkles size={16} /> Demo Hesap ile Hızlı Giriş
                </button>
              )}

              {/* Buton */}
              <button
                type="submit"
                className="login-btn"
                disabled={loading}
              >
                {loading
                  ? <span className="login-btn-loading">
                      <span className="login-spinner" />
                      {registerMode ? 'Kaydediliyor…' : 'Doğrulanıyor…'}
                    </span>
                  : registerMode ? <><UserPlus size={18} /> Kayıt Ol</> : <><LogIn size={18} /> Giriş Yap</>
                }
              </button>

              {/* Kayıt / Giriş geçiş linki */}
              <div className="login-switch-row">
                <button type="button" className="login-switch-btn" onClick={() => { setRegisterMode(v => !v); setError(''); setPass(''); setPass2(''); }}>
                  {registerMode ? 'Zaten hesabın var mı? Giriş Yap' : 'Hesabın yok mu? Kayıt Ol'}
                </button>
              </div>

              {/* Misafir girişi (ready modunda da göster) */}
              {!registerMode && (
                <div className="login-guest-row">
                  <button type="button" className="login-guest-link" onClick={() => {
                    const guest = startGuestSession();
                    setSuccess(true);
                    setTimeout(() => onLogin(guest, false), 900);
                  }}>
                    <Zap size={14} /> 15dk Misafir Girişi
                  </button>
                </div>
              )}
            </form>
          )}

          {/* Yeniden bağlan */}
          {fbStatus === 'error' && (
            <button className="login-retry-btn" onClick={checkUsers} disabled={loading}>
              <RefreshCw size={16} /> Yeniden Bağlan
            </button>
          )}
        </div>

        <div className="login-footer">
          {BRAND_NAME} &copy; {new Date().getFullYear()} · v{getBrandVersion()} · Veriler Firebase'de güvenle saklanır
        </div>
      </div>
    </div>
  );
}
