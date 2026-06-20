/**
 * Tahsilat / Odeme kaydi modali.
 */

import { Modal } from '@/components/Modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ModalActions } from '@/pages/pageHelpers';
import type { DB } from '@/types';
import { useState, useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (amount: string, kasa: string, description: string) => void;
  cariName: string;
  type: 'musteri' | 'tedarikci';
  db: DB;
}

const defaultKasalar = [
  { id: 'nakit', name: 'Nakit', icon: '💵' },
  { id: 'banka', name: 'Banka', icon: '🏦' },
];

export default function CariIslemModal({ open, onClose, onSave, cariName, type, db }: Props) {
  const [amount, setAmount] = useState('');
  const [kasa, setKasa] = useState('nakit');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (open) {
      setAmount('');
      setKasa('nakit');
      setDescription('');
    }
  }, [open]);

  const kasalar = db.kasalar || defaultKasalar;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={type === 'musteri' ? `💰 Tahsilat — ${cariName}` : `💸 Odeme — ${cariName}`}
    >
      <div className="grid gap-4">
        <div>
          <Label>Tutar (₺) *</Label>
          <Input
            type="number"
            inputMode="decimal"
            value={amount}
            min={0}
            step={0.01}
            placeholder="0,00"
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
          />
        </div>
        <div>
          <Label>Kasa / Hesap</Label>
          <select
            value={kasa}
            onChange={(e) => setKasa(e.target.value)}
            className="w-full p-2.5 bg-slate-800 border border-white/10 rounded-xl text-foreground text-sm outline-none"
          >
            {kasalar.map((k) => (
              <option key={k.id} value={k.id}>
                {k.icon} {k.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Aciklama</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={type === 'musteri' ? 'Tahsilat aciklamasi...' : 'Odeme aciklamasi...'}
          />
        </div>
      </div>
      <ModalActions
        onSave={() => onSave(amount, kasa, description)}
        onCancel={onClose}
        saveLabel={type === 'musteri' ? '💾 Tahsilati Kaydet' : '💾 Odemeyi Kaydet'}
        saveColor={type === 'musteri' ? '#10b981' : '#f59e0b'}
      />
    </Modal>
  );
}
