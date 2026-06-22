import { useState } from 'react';
import { logger } from '@/lib/logger';

interface UserMenuProps {
  username?: string;
  onLogout: () => void;
  isMobile: boolean;
  guestTimeLeft?: number;
}

export default function UserMenu({ username, onLogout, isMobile, guestTimeLeft = 0 }: UserMenuProps) {
  const [open, setOpen] = useState(false);

  const formatGuestTime = (ms: number) => {
    const totalSec = Math.ceil(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const exitApp = async () => {
    try {
      const { App: CapApp } = await import('@capacitor/app');
      await CapApp.exitApp();
    } catch {
      logger.warn('ui', 'UserMenu: exitApp hatası');
      window.close();
    }
  };

  return (
    <div className="user-menu-root">
      <button onClick={() => setOpen((o) => !o)} className={`user-menu-toggle ${isMobile ? 'mobile' : ''}`}>
        {guestTimeLeft > 0 && <span className="guest-badge">M</span>}
        👤 {!isMobile && (username || 'Kullanıcı')}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} className="user-menu-backdrop" />
          <div className="user-menu-panel">
            <div className="user-menu-head">
              <div className="user-menu-name">👤 {username || 'Kullanıcı'}</div>
              {guestTimeLeft > 0 ? (
                <div className="user-menu-status guest">⏳ Misafir — {formatGuestTime(guestTimeLeft)}</div>
              ) : (
                <div className="user-menu-status">Oturum açık</div>
              )}
            </div>
            <button onClick={() => { setOpen(false); onLogout(); }} className="user-menu-action logout">🚪 Oturumu Kapat</button>
            <button onClick={() => { setOpen(false); exitApp(); }} className="user-menu-action close">✕ Uygulamayı Kapat</button>
          </div>
        </>
      )}
    </div>
  );
}
