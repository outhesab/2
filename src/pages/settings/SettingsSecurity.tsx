import { useState, useEffect } from 'react';
import { Card } from '@/pages/SettingsCard';
import { Button } from '@/components/ui/button';
import {
  createUser,
  deleteUser,
  getUserSession,
  hashPassword as hashPass,
  loadUsers,
  toggleUserActive,
  updateUserPassword,
  updateUserRole,
  type AppUser,
  type UserRole,
} from '@/lib/userManager';

const inpBase =
  'w-full rounded-[10px] border px-3.5 py-2.5 text-sm bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border)] box-border';

export function SecurityPanel({
  showToast,
}: {
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}) {
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newPass2, setNewPass2] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const session = getUserSession();

  const handleChange = async () => {
    if (!oldPass) {
      showToast('Mevcut parolayı girin!', 'error');
      return;
    }
    if (newPass.length < 4) {
      showToast('Yeni parola en az 4 karakter olmalı!', 'error');
      return;
    }
    if (newPass !== newPass2) {
      showToast('Yeni parolalar eşleşmiyor!', 'error');
      return;
    }
    if (!session) {
      showToast('Oturum bulunamadı!', 'error');
      return;
    }
    setLoading(true);
    const users = await loadUsers();
    const me = users.find((u) => u.id === session.userId);
    if (!me) {
      showToast('Kullanıcı bulunamadı!', 'error');
      setLoading(false);
      return;
    }
    const oldHash = await hashPass(oldPass);
    if (oldHash !== me.passwordHash) {
      showToast('Mevcut parola yanlış!', 'error');
      setOldPass('');
      setLoading(false);
      return;
    }
    const ok = await updateUserPassword(session.userId, newPass);
    if (ok) {
      setOldPass('');
      setNewPass('');
      setNewPass2('');
      showToast('Parola başarıyla güncellendi!', 'success');
    } else {
      showToast('Firebase kayıt hatası!', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="grid gap-4">
      <Card title="🔒 Şifremi Değiştir">
        <div className="grid gap-3">
          {session && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
              👤 Giriş yapan: <strong>{session.username}</strong> ({session.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}
              )
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-[var(--text-muted)] mb-1.5 block">Mevcut Parola</label>
            <div className="relative">
              <input
                type={showOld ? 'text' : 'password'}
                value={oldPass}
                onChange={(e) => setOldPass(e.target.value)}
                placeholder="Mevcut parolanız"
                className={inpBase}
                style={{ paddingRight: 44 }}
              />
              <Button
                onClick={() => setShowOld((p) => !p)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg bg-transparent border-none cursor-pointer text-lg"
              >
                {showOld ? '👁️' : '👁️‍🗨️'}
              </Button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--text-muted)] mb-1.5 block">Yeni Parola</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="En az 4 karakter"
                className={inpBase}
                style={{ paddingRight: 44 }}
              />
              <Button
                onClick={() => setShowNew((p) => !p)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg bg-transparent border-none cursor-pointer text-lg"
              >
                {showNew ? '👁️' : '👁️‍🗨️'}
              </Button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--text-muted)] mb-1.5 block">Yeni Parola (Tekrar)</label>
            <input
              type={showNew ? 'text' : 'password'}
              value={newPass2}
              onChange={(e) => setNewPass2(e.target.value)}
              placeholder="Yeni parolayı tekrar girin"
              className={inpBase}
              onKeyDown={(e) => e.key === 'Enter' && handleChange()}
            />
          </div>
          <Button
            onClick={handleChange}
            disabled={loading}
            className="btn-primary w-full py-3 rounded-xl font-bold text-sm"
          >
            {loading ? '⏳ Değiştiriliyor...' : '🔒 Parolayı Değiştir'}
          </Button>
        </div>
      </Card>

      {session?.role === 'admin' && <AdminPanel showToast={showToast} />}
    </div>
  );
}

function AdminPanel({ showToast }: { showToast: (msg: string, type?: 'success' | 'error' | 'info') => void }) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUsername, setNewUsername] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [resetPassId, setResetPassId] = useState<string | null>(null);
  const [resetPassVal, setResetPassVal] = useState('');
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setUsers(await loadUsers());
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleCreate = async () => {
    if (!newUsername.trim()) {
      showToast('Kullanıcı adı gerekli!', 'error');
      return;
    }
    if (newPass.length < 4) {
      showToast('Şifre en az 4 karakter!', 'error');
      return;
    }
    setSaving(true);
    const result = await createUser(newUsername.trim(), newPass, newRole);
    if (result.ok) {
      showToast(`✅ ${newUsername} oluşturuldu`, 'success');
      setNewUsername('');
      setNewPass('');
      await refresh();
    } else {
      showToast(result.msg, 'error');
    }
    setSaving(false);
  };

  const handleToggle = async (userId: string, username: string, active: boolean) => {
    await toggleUserActive(userId);
    showToast(`${username} ${active ? 'devre dışı bırakıldı' : 'aktif edildi'}`, 'info');
    await refresh();
  };

  const handleDelete = async (userId: string, username: string) => {
    if (!confirm(`"${username}" kullanıcısını silmek istediğinizden emin misiniz?`)) return;
    await deleteUser(userId);
    showToast(`${username} silindi`, 'info');
    await refresh();
  };

  const handleRoleChange = async (userId: string, role: UserRole) => {
    await updateUserRole(userId, role);
    showToast('Rol güncellendi', 'success');
    await refresh();
  };

  const handleResetPass = async (userId: string) => {
    if (resetPassVal.length < 4) {
      showToast('Şifre en az 4 karakter!', 'error');
      return;
    }
    await updateUserPassword(userId, resetPassVal);
    showToast('Şifre sıfırlandı', 'success');
    setResetPassId(null);
    setResetPassVal('');
    await refresh();
  };

  const roleColors: Record<UserRole, string> = {
    admin: '#f59e0b',
    user: '#60a5fa',
  };

  return (
    <Card title="👥 Kullanıcı Yönetimi">
      <div className="bg-[var(--bg-card)] rounded-xl p-4 mb-4">
        <div className="text-sm font-semibold text-foreground mb-3">➕ Yeni Kullanıcı Ekle</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <div>
            <label className="text-sm font-medium text-[var(--text-muted)] mb-1.5 block">Kullanıcı Adı *</label>
            <input
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="kullanici_adi"
              className={inpBase}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--text-muted)] mb-1.5 block">Şifre *</label>
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="Min. 4 karakter"
              className={inpBase}
            />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="text-sm font-medium text-[var(--text-muted)] mb-1.5 block">Rol</label>
            <select value={newRole} onChange={(e) => setNewRole(e.target.value as UserRole)} className={inpBase}>
              <option value="user">👤 Kullanıcı</option>
              <option value="admin">⭐ Yönetici</option>
            </select>
          </div>
          <Button
            onClick={handleCreate}
            disabled={saving}
            className="btn-primary flex-1 py-3 rounded-xl font-bold text-sm"
          >
            {saving ? '...' : '➕ Ekle'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Yükleniyor...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Kullanıcı bulunamadı</div>
      ) : (
        <div className="flex flex-col gap-2">
          {users.map((u) => (
            <div
              key={u.id}
              style={{
                background: 'var(--bg-card)',
                borderRadius: 12,
                padding: '12px 14px',
                border: `1px solid ${u.active ? 'rgba(255,255,255,0.06)' : 'rgba(239,68,68,0.15)'}`,
                opacity: u.active ? 1 : 0.6,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: resetPassId === u.id ? 10 : 0,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: `${roleColors[u.role]}20`,
                    border: `2px solid ${roleColors[u.role]}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    flexShrink: 0,
                  }}
                >
                  {u.role === 'admin' ? '⭐' : '👤'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-foreground text-sm font-semibold">{u.username}</div>
                  <div className="text-[var(--text-dim)] text-xs">
                    {u.lastLogin
                      ? `Son giriş: ${new Date(u.lastLogin).toLocaleString('tr-TR')}`
                      : 'Hiç giriş yapılmadı'}
                  </div>
                </div>
                <select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                  style={{
                    padding: '4px 8px',
                    background: `${roleColors[u.role]}15`,
                    border: `1px solid ${roleColors[u.role]}30`,
                    borderRadius: 7,
                    color: roleColors[u.role],
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <option value="user">Kullanıcı</option>
                  <option value="admin">Yönetici</option>
                </select>
                <Button
                  onClick={() => {
                    setResetPassId(resetPassId === u.id ? null : u.id);
                    setResetPassVal('');
                  }}
                  title="Şifre Sıfırla"
                  className="px-2.5 py-1.5 rounded-lg font-bold text-xs bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                >
                  🔑
                </Button>
                <Button
                  onClick={() => handleToggle(u.id, u.username, u.active)}
                  title={u.active ? 'Devre Dışı Bırak' : 'Aktif Et'}
                  style={{
                    padding: '5px 9px',
                    background: u.active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${u.active ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                    borderRadius: 8,
                    color: u.active ? 'var(--color-success)' : 'var(--color-danger)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                >
                  {u.active ? '✔' : '✖'}
                </Button>
                <Button
                  onClick={() => handleDelete(u.id, u.username)}
                  title="Kullanıcıyı Sil"
                  className="btn-danger-sm px-3 py-1.5 rounded-lg font-bold text-xs"
                >
                  🗑️
                </Button>
              </div>
              {resetPassId === u.id && (
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={resetPassVal}
                    onChange={(e) => setResetPassVal(e.target.value)}
                    placeholder="Yeni şifre (min 4 karakter)"
                    className={`${inpBase} flex-1`}
                    autoFocus
                  />
                  <Button
                    onClick={() => handleResetPass(u.id)}
                    className="px-3 py-2 rounded-lg font-bold text-sm bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                  >
                    Kaydet
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
