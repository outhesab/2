/**
 * Giriş Ekranı — Kullanıcı Adı + Şifre
 * Kullanıcılar Firebase config/users dökümanında saklanır
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { logger } from '@/lib/logger';
import {
  loginUser, getUserSession, setUserSession, clearUserSession,
  loadUsers, createUser, startGuestSession, isGuestSession,
  getGuestSessionRemaining, type AppUser,
} from '@/lib/userManager';

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
      setFbStatus('error');
      setStatusMsg('Firebase bağlantısı kurulamadı');
    }
    setTimeout(() => usernameRef.current?.focus(), 300);
  }, []);

  useEffect(() => { checkUsers(); }, [checkUsers]);

  const doShake = () => { setShake(true); setTimeout(() => setShake(false), 600); };

  const handleLogin = async () => {
    if (!username.trim()) { setError('Kullanıcı adı gerekli'); doShake(); return; }
    if (!pass.trim()) { setError('Şifre gerekli'); doShake(); return; }
    setLoading(true); setError('');
    const users = await loadUsers();
    if (users.length === 0) {
      setError('Henüz kayıtlı kullanıcı yok. Lütfen kayıt olun.');
      setRegisterMode(true);
      setLoading(false);
      return;
    }
    const user = await loginUser(username.trim(), pass);
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

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (registerMode) handleRegister();
      else handleLogin();
    }
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
        Solhan Ticaret Yönetim Sistemi
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
              {success ? '✅' : '🔥'}
            </div>
            <h1 className="login-title">
              Solhan
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

          {/* Bağlanıyor animasyonu */}
          {fbStatus === 'connecting' && (
            <div className="login-connecting-row">
              {[0, 1, 2].map(i => <div key={i} className="login-connecting-dot" style={{ animation: `loginFbDot 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
            </div>
          )}

          {/* Hata */}
          {fbStatus === 'error' && (
            <div className="login-error-box">
              <div className="login-error-title">⚠️ Bağlantı Hatası</div>
              <div className="login-error-desc">Firebase'e erişilemiyor. Yerel kullanıcı yoksa internete bağlanıp bir kez giriş yapın.</div>
              <button className="login-guest-btn" onClick={() => {
                const guest = startGuestSession();
                setSuccess(true);
                setTimeout(() => onLogin(guest, false), 900);
              }}>
                ⏳ 15dk Misafir Girişi
              </button>
            </div>
          )}

          {/* Form */}
          {(fbStatus === 'ready' || fbStatus === 'error') && (
            <div className="login-form">
              {/* Kullanıcı adı */}
              <div className="login-field">
                <span className="login-field-icon">👤</span>
                <input
                  ref={usernameRef}
                  className={`login-input${error ? ' error' : ''}`}
                  type="text"
                  value={username}
                  onChange={e => { setUsername(e.target.value); setError(''); }}
                  onKeyDown={handleKey}
                  placeholder="Kullanıcı adı"
                  autoComplete="username"
                />
              </div>

              {/* Şifre */}
              <div className="login-field">
                <span className="login-field-icon">🔒</span>
                <input
                  className={`login-input${error ? ' error' : ''}`}
                  type={showPass ? 'text' : 'password'}
                  value={pass}
                  onChange={e => { setPass(e.target.value); setError(''); }}
                  onKeyDown={handleKey}
                  placeholder="Şifre (en az 4 karakter)"
                  autoComplete={registerMode ? 'new-password' : 'current-password'}
                />
                <button className="login-pass-toggle" onClick={() => setShowPass(v => !v)}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>

              {/* Şifre tekrar (kayıt modu) */}
              {registerMode && (
                <div className="login-field">
                  <span className="login-field-icon">🔐</span>
                  <input
                    className={`login-input${error ? ' error' : ''}`}
                    type={showPass ? 'text' : 'password'}
                    value={pass2}
                    onChange={e => { setPass2(e.target.value); setError(''); }}
                    onKeyDown={handleKey}
                    placeholder="Şifreyi tekrar girin"
                    autoComplete="new-password"
                  />
                </div>
              )}

              {/* Hata mesajı */}
              {error && (
                <div className="login-error-msg">
                  ⚠️ {error}
                </div>
              )}

              {/* Beni hatırla (sadece giriş) */}
              {!registerMode && (
                <label className="login-remember">
                  <input className="login-remember-checkbox" type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
                  <span className="login-remember-text">Beni hatırla <span className="login-remember-hint">(30 gün)</span></span>
                </label>
              )}

              {/* Buton */}
              <button
                className="login-btn"
                onClick={registerMode ? handleRegister : handleLogin}
                disabled={loading}
              >
                {loading
                  ? <span className="login-btn-loading">
                      <span className="login-spinner" />
                      {registerMode ? 'Kaydediliyor…' : 'Doğrulanıyor…'}
                    </span>
                  : registerMode ? '📝 Kayıt Ol' : '🚀 Giriş Yap'
                }
              </button>

              {/* Kayıt / Giriş geçiş linki */}
              <div className="login-switch-row">
                <button className="login-switch-btn" onClick={() => { setRegisterMode(v => !v); setError(''); setPass(''); setPass2(''); }}>
                  {registerMode ? '🔑 Zaten hesabın var mı? Giriş Yap' : '📝 Hesabın yok mu? Kayıt Ol'}
                </button>
              </div>
            </div>
          )}

          {/* Yeniden bağlan */}
          {fbStatus === 'error' && (
            <button className="login-retry-btn" onClick={checkUsers}>
              🔄 Yeniden Bağlan
            </button>
          )}
        </div>

        <div className="login-footer">
          Solhan Ticaret &copy; {new Date().getFullYear()} · v3.0.0 · Veriler Firebase'de güvenle saklanır
        </div>
      </div>
    </div>
  );
}
