import EmptyState from "@/components/EmptyState";
import { SkeletonTable } from '@/components/SkeletonLoaders';
import {
  ChevronDown,
  Coins,
  CreditCard,
  Download,
  Landmark,
  Plus,
  WalletCards,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from 'react';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { useSoundFeedback } from '@/hooks/useSoundFeedback';
import { exportToExcel } from '@/lib/excelExport';
import { genId, formatMoney, formatDate } from '@/lib/utils-tr';
import type { DB } from '@/types';
import DOMPurify from 'dompurify';
import { TableFilterBar, TableWrapper } from '@/pages/pageHelpers.tsx';

interface Props { db: DB; save: (fn: (prev: DB) => DB) => void; }

export default function Kasa({ db, save }: Props) {
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const { playSound } = useSoundFeedback();
  const [incomeModal, setIncomeModal] = useState(false);
  const [expenseModal, setExpenseModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [kasaFilter, setKasaFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sayimModal, setSayimModal] = useState(false);
  const [sayimForm, setSayimForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [sayimDate, setSayimDate] = useState(new Date().toISOString().slice(0, 10));

  const kasalar = useMemo(() => db.kasalar || [{ id: 'nakit', name: 'Nakit', icon: '💵' }, { id: 'banka', name: 'Banka', icon: '🏦' }], [db.kasalar]);

  const bakiyeler = useMemo(() => {
    const map: Record<string, number> = {};
    kasalar.forEach(k => map[k.id] = 0);
    db.kasa.filter(e => !e.deleted).forEach(e => {
      map[e.kasa] = (map[e.kasa] || 0) + (e.type === 'gelir' ? e.amount : -e.amount);
    });
    return map;
  }, [db.kasa, kasalar]);

  const sayimFarklar = useMemo(() => {
    const result: { kasaId: string; kasaName: string; icon: string; fiziki: number; sistem: number; fark: number }[] = [];
    kasalar.forEach(k => {
      const fiziki = parseFloat(sayimForm[k.id] || '0') || 0;
      const sistem = bakiyeler[k.id] || 0;
      result.push({ kasaId: k.id, kasaName: k.name, icon: k.icon, fiziki, sistem, fark: fiziki - sistem });
    });
    return result;
  }, [kasalar, bakiyeler, sayimForm]);
  const sayimToplamFark = sayimFarklar.reduce((s, f) => s + Math.abs(f.fark), 0);
  const gunSonuSayimPDF = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Gün Sonu Sayım - ${esc(sayimDate)}</title><style>body{font-family:Arial,sans-serif;margin:40px}h1{color:#333;border-bottom:2px solid #ff5722;padding-bottom:10px}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#1e293b;color:#fff;padding:10px;text-align:left}td{padding:10px;border-bottom:1px solid #ddd}.yesil{color:#10b981;font-weight:700}.kirmizi{color:#ef4444;font-weight:700}.toplam{margin-top:20px;font-size:1.1rem;font-weight:700}.footer{margin-top:40px;color:#666;font-size:0.85rem}</style></head><body>
    <h1>📋 Gün Sonu Sayım ${esc(sayimDate)}</h1>
    <table><thead><tr><th>Kasa</th><th>Sistem Bakiyesi</th><th>Fiziki Sayım</th><th>Fark</th></tr></thead><tbody>
    ${sayimFarklar.map(f => {
      const cls = f.fark > 0 ? 'yesil' : f.fark < 0 ? 'kirmizi' : '';
      return `<tr><td>${esc(f.icon)} ${esc(f.kasaName)}</td><td>₺${f.sistem.toFixed(2)}</td><td>₺${f.fiziki.toFixed(2)}</td><td class="${cls}">${f.fark >= 0 ? '+' : ''}₺${f.fark.toFixed(2)}</td></tr>`;
    }).join('')}
    </tbody></table>
    <div class="toplam">Toplam Fark: <span class="${sayimToplamFark > 0 ? 'kirmizi' : ''}">₺${sayimToplamFark.toFixed(2)}</span></div>
    <div class="footer">${new Date().toLocaleString('tr-TR')} · PARSPEL Gün Sonu Raporu</div></body></html>`;
    w.document.write(DOMPurify.sanitize(html));
    w.document.close();
    w.print();
  };

  const catLabels: Record<string, string> = {
    satis: '🛒 Satış', tahsilat: '💰 Tahsilat', diger_gelir: '➕ Diğer Gelir',
    ortak_tahsilat: '🤝 Ortak Tahsilat',
    tedarik: '🏭 Tedarik', kira: '🏠 Kira', maas: '👤 Maaş',
    fatura: '📄 Fatura', nakliye: '🚛 Nakliye', diger_gider: '➖ Diğer Gider',
    iade: '🔄 İade',
  };
  const [form, setForm] = useState({ amount: '', description: '', kasa: 'nakit', cariId: '', partnerId: '', category: '' });


  const totalBakiye = Object.values(bakiyeler).reduce((s, v) => s + v, 0);
  const posBakiyeleri = {
    pos_ziraat: bakiyeler.pos_ziraat || 0,
    pos_is: bakiyeler.pos_is || 0,
    pos_yk: bakiyeler.pos_yk || 0,
  };
  const totalPos = Object.values(posBakiyeleri).reduce((sum, value) => sum + value, 0);
  const bankaToplam = (bakiyeler.banka || 0) + totalPos;

  let entries = db.kasa.filter(e => !e.deleted);
  if (filter === 'gelir') entries = entries.filter(e => e.type === 'gelir');
  else if (filter === 'gider') entries = entries.filter(e => e.type === 'gider');
  if (kasaFilter !== 'all') entries = entries.filter(e => e.kasa === kasaFilter);
  if (search) entries = entries.filter(e => (e.description || '').toLowerCase().includes(search.toLowerCase()) || (catLabels[e.category] || e.category || '').toLowerCase().includes(search.toLowerCase()));
  if (dateFrom) entries = entries.filter(e => e.createdAt >= dateFrom);
  if (dateTo) entries = entries.filter(e => e.createdAt <= dateTo + 'T23:59:59');
  const sorted = [...entries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const saveEntry = (type: 'gelir' | 'gider') => {
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { showToast('Geçerli tutar girin!', 'error'); return; }
    if (form.category === 'ortak_tahsilat' && !form.partnerId) { showToast('Ortak tahsilat için ortak seçin!', 'error'); return; }
    const nowIso = new Date().toISOString();
    const entry = {
      id: genId(), type, category: form.category || (type === 'gelir' ? 'diger_gelir' : 'diger_gider'),
      amount, kasa: form.kasa, description: form.description, cariId: form.cariId || undefined,
      createdAt: nowIso, updatedAt: nowIso,
    };
    setLoading(true);
    save(prev => {
      let cari = prev.cari;
      if (form.cariId) {
        cari = cari.map(c => c.id === form.cariId ? { ...c, balance: (c.balance || 0) - amount, lastTransaction: nowIso, updatedAt: nowIso } : c);
      }
      // Ortak tahsilatı → ortakEmanetler'e de yaz
      let ortakEmanetler = prev.ortakEmanetler || [];
      if (form.partnerId && entry.category === 'ortak_tahsilat') {
        ortakEmanetler = [...ortakEmanetler, {
          id: genId(), partnerId: form.partnerId, amount,
          note: form.description || 'Kasa tahsilatı',
          description: form.description || 'Kasa tahsilatı',
          type: 'emanet' as const,
          createdAt: nowIso, updatedAt: nowIso,
        }];
      }
      return { ...prev, kasa: [...prev.kasa, entry], cari, ortakEmanetler };
    });
    setLoading(false);
    playSound(type === 'gelir' ? 'success' : 'notification');
    showToast(`${type === 'gelir' ? 'Gelir' : 'Gider'} kaydedildi!`, 'success');
    setForm({ amount: '', description: '', kasa: 'nakit', cariId: '', partnerId: '', category: '' });
    setIncomeModal(false);
    setExpenseModal(false);
  };

  const deleteEntry = (id: string) => {
    showConfirm('Kaydı Sil', 'Bu kasa kaydını silmek istediğinizden emin misiniz?', () => {
      const nowIso = new Date().toISOString();
      setLoading(true);
      save(prev => {
        const entry = prev.kasa.find(e => e.id === id);
        if (!entry) return prev;

        // Soft delete
        const kasa = prev.kasa.map(e => e.id === id ? { ...e, deleted: true, updatedAt: nowIso } : e);

        // Cari bakiyeyi geri al
        let cari = prev.cari;
        if (entry.cariId) {
          cari = cari.map(c =>
            c.id === entry.cariId
              ? { ...c, balance: (c.balance || 0) + entry.amount, lastTransaction: nowIso, updatedAt: nowIso }
              : c
          );
        }

        return { ...prev, kasa, cari };
      });
      setLoading(false);
      showToast('Kayıt silindi!', 'success');
    });
  };

  const incomeCategories = ['satis', 'tahsilat', 'ortak_tahsilat', 'diger_gelir'];
  const expenseCategories = ['tedarik', 'kira', 'maas', 'fatura', 'nakliye', 'diger_gider'];

  const EntryModal = ({ type, open, onClose }: { type: 'gelir' | 'gider'; open: boolean; onClose: () => void }) => (
    <Modal open={open} onClose={onClose} title={type === 'gelir' ? '💚 Gelir Ekle' : '🔴 Gider Ekle'}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={lbl}>Tutar (₺) *</label>
          <input type="number" inputMode="decimal" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={inp} placeholder="0,00" min={0} step={0.01} />
        </div>
        <div>
          <label style={lbl}>Kasa</label>
          <select value={form.kasa} onChange={e => setForm(f => ({ ...f, kasa: e.target.value }))} style={inp}>
            {kasalar.map(k => <option key={k.id} value={k.id}>{k.icon} {k.name}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Kategori</label>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inp}>
            <option value="">Seçin</option>
            {(type === 'gelir' ? incomeCategories : expenseCategories).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={lbl}>Cari (opsiyonel)</label>
          <select value={form.cariId} onChange={e => setForm(f => ({ ...f, cariId: e.target.value }))} style={inp}>
            <option value="">-- Cari Seç --</option>
            {db.cari.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {type === 'gelir' && form.category === 'ortak_tahsilat' && (
          <div style={{ gridColumn: '1/-1' }}>
            <label style={lbl}>Ortak *</label>
            <select value={form.partnerId} onChange={e => setForm(f => ({ ...f, partnerId: e.target.value }))} style={inp}>
              <option value="">-- Ortak Seç --</option>
              {(db.partners || []).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
        <div style={{ gridColumn: '1/-1' }}>
          <label style={lbl}>Açıklama</label>
          <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={inp} placeholder="Açıklama..." />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button onClick={() => saveEntry(type)} style={{ flex: 1, background: type === 'gelir' ? '#10b981' : '#ef4444', border: 'none', borderRadius: 10, color: '#fff', padding: '11px 0', fontWeight: 700, cursor: 'pointer' }}>
          💾 Kaydet
        </button>
        <button onClick={onClose} style={{ background: '#273548', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-dim)', padding: '11px 20px', cursor: 'pointer' }}>İptal</button>
      </div>
    </Modal>
  );

  if (loading) return <SkeletonTable rows={6} cols={7} />;

  return (
    <div>
      <div style={{ display: 'grid', gap: 12, marginBottom: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {[
          { label: 'Kasa', value: totalBakiye, icon: WalletCards },
          { label: 'Nakit', value: bakiyeler.nakit || 0, icon: Coins },
          { label: 'Banka', value: bankaToplam, icon: Landmark },
          { label: 'POS', value: totalPos, icon: CreditCard },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} style={{ background: 'var(--bg-card)', borderRadius: 14, padding: '16px 20px', border: '1px solid var(--border)', cursor: item.label !== "Kasa" ? 'pointer' : 'default' }} onClick={item.label === "Nakit" ? () => setKasaFilter("nakit") : item.label === "Banka" ? () => setKasaFilter("banka") : undefined}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase' }}>
                <Icon size={14} /> {item.label}
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: item.value >= 0 ? 'var(--text-primary)' : '#ef4444' }}>{formatMoney(item.value)}</div>
              {item.label === "POS" ? (
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Ziraat {formatMoney(posBakiyeleri.pos_ziraat)}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>İş {formatMoney(posBakiyeleri.pos_is)}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>YapıKredi {formatMoney(posBakiyeleri.pos_yk)}</span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus />
              Yeni İşlem
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setIncomeModal(true)}>Gelir</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setExpenseModal(true)}>Gider</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" onClick={() => { setSayimForm(Object.fromEntries(kasalar.map(k => [k.id, '']))); setSayimModal(true); }}>
          <WalletCards />
          Gün Sonu Sayım
        </Button>
        <Button variant="outline" onClick={() => { exportToExcel(db, { sheets: ['kasa'] }); showToast('Excel indirildi!', 'success'); }}>
          <Download />
          Excel İndir
        </Button>
        <TableFilterBar
          search={search}
          onSearchChange={setSearch}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
          onClearDates={() => { setDateFrom(''); setDateTo(''); }}
        />
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">Tümü</TabsTrigger>
            <TabsTrigger value="gelir">Gelir</TabsTrigger>
            <TabsTrigger value="gider">Gider</TabsTrigger>
          </TabsList>
        </Tabs>
        {kasaFilter !== 'all' && <button onClick={() => setKasaFilter('all')} style={{ padding: '8px 12px', border: 'none', borderRadius: 8, background: '#334155', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.82rem' }}>✕ Filtre Kaldır</button>}
      </div>

      <TableWrapper
        columns={['Tarih', 'Açıklama', 'Kategori', 'Kasa', 'Tutar', 'Tür', '']}
        noData={sorted.length === 0 ? (
          <EmptyState
            icon={WalletCards}
            title="Kasa kaydı bulunamadı"
            description="Seçili filtrelerle eşleşen gelir veya gider hareketi yok."
            actionLabel="Filtreleri temizle"
            onAction={() => {
              setFilter("all");
              setKasaFilter("all");
              setSearch("");
              setDateFrom("");
              setDateTo("");
            }}
          />
        ) : undefined}
        colSpan={7}
      >
        {sorted.map(e => (
          <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <td data-label="Tarih" style={{ padding: '11px 16px', color: '#64748b', fontSize: '0.82rem' }}>{formatDate(e.createdAt)}</td>
            <td data-label="Açıklama" style={{ padding: '11px 16px', color: 'var(--text-primary)', fontSize: '0.9rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.description || '-'}</td>
            <td data-label="Kategori" style={{ padding: '11px 16px', color: 'var(--text-dim)', fontSize: '0.82rem' }}>{catLabels[e.category] || e.category || '-'}</td>
            <td data-label="Kasa" style={{ padding: '11px 16px', color: 'var(--text-dim)' }}>{kasalar.find(k => k.id === e.kasa)?.icon} {e.kasa}</td>
            <td data-label="Tutar" style={{ padding: '11px 16px', fontWeight: 700, color: e.type === 'gelir' ? '#10b981' : '#ef4444' }}>
              {e.type === 'gelir' ? '+' : '-'}{formatMoney(e.amount)}
            </td>
            <td data-label="Tür" style={{ padding: '11px 16px' }}>
              <span style={{ background: e.type === 'gelir' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: e.type === 'gelir' ? '#10b981' : '#ef4444', borderRadius: 6, padding: '2px 8px', fontSize: '0.8rem', fontWeight: 600 }}>
                {e.type === 'gelir' ? '💚 Gelir' : '🔴 Gider'}
              </span>
            </td>
            <td style={{ padding: '11px 16px' }}>
              <button onClick={() => deleteEntry(e.id)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '0.9rem' }}>🗑️</button>
            </td>
          </tr>
        ))}
      </TableWrapper>

      <EntryModal type="gelir" open={incomeModal} onClose={() => setIncomeModal(false)} />
      <EntryModal type="gider" open={expenseModal} onClose={() => setExpenseModal(false)} />

      <Modal open={sayimModal} onClose={() => setSayimModal(false)} title="📋 Gün Sonu Sayım">
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Tarih</label>
          <input type="date" value={sayimDate} onChange={e => setSayimDate(e.target.value)} style={inp} />
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          {kasalar.map(k => {
            const fiziki = parseFloat(sayimForm[k.id] || '0') || 0;
            const sistem = bakiyeler[k.id] || 0;
            const fark = fiziki - sistem;
            const farkColor = fark > 0 ? '#10b981' : fark < 0 ? '#ef4444' : '#64748b';
            return (
              <div key={k.id} style={{ background: 'rgba(15,23,42,0.4)', borderRadius: 12, padding: '14px 16px', border: `1px solid ${fark !== 0 ? farkColor + '30' : 'rgba(255,255,255,0.06)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <span style={{ fontSize: '1.2rem', marginRight: 6 }}>{k.icon}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{k.name}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#64748b', fontSize: '0.72rem' }}>Sistem Bakiyesi</div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{formatMoney(sistem)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...lbl, fontSize: '0.75rem', marginBottom: 4 }}>Fiziki Sayım</label>
                    <input type="number" inputMode="decimal" value={sayimForm[k.id] || ''} onChange={e => setSayimForm(f => ({ ...f, [k.id]: e.target.value }))} style={{ ...inp, padding: '14px 16px', fontSize: '1.4rem', fontWeight: 800, textAlign: 'center' }} placeholder="0,00" step={0.01} />
                  </div>
                </div>
                {sayimForm[k.id] && sayimForm[k.id] !== '' && (
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: fark !== 0 ? `${farkColor}10` : 'transparent' }}>
                    <span style={{ color: '#64748b', fontSize: '0.82rem' }}>Fark</span>
                    <span style={{ color: farkColor, fontWeight: 800, fontSize: '1.1rem' }}>{fark >= 0 ? '+' : ''}{formatMoney(fark)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {sayimToplamFark > 0 && (
          <div style={{ marginTop: 14, padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <span style={{ color: '#fca5a5', fontWeight: 700, fontSize: '0.95rem' }}>
              ⚠️ Toplam Fark: {formatMoney(sayimToplamFark)} — Sayım sonuçlarını kontrol edin.
            </span>
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={gunSonuSayimPDF} style={{ flex: 1, background: '#8b5cf6', border: 'none', borderRadius: 10, color: '#fff', padding: '11px 0', fontWeight: 700, cursor: 'pointer' }}>🖨️ PDF Yazdır</button>
          <button onClick={() => setSayimModal(false)} style={{ background: '#273548', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-dim)', padding: '11px 20px', cursor: 'pointer' }}>Kapat</button>
        </div>
      </Modal>
    </div>
  );
}

const lbl: React.CSSProperties = { display: 'block', marginBottom: 6, color: 'var(--text-dim)', fontSize: '0.85rem', fontWeight: 500 };
const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', background: 'rgba(15,23,42,0.6)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.9rem', boxSizing: 'border-box' };
