import { useState } from "react";
import { useToast } from "@/components/Toast";
import { useDB } from "@/hooks/useDB";
import { genId } from "@/lib/utils-tr";

interface Props {
  db: ReturnType<typeof useDB>["db"];
  save: ReturnType<typeof useDB>["save"];
  onClose: () => void;
  type: "gelir" | "gider";
}

export function QuickIncomeModal({ db, save, onClose, type }: Props) {
  const { showToast } = useToast();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [kasa, setKasa] = useState("nakit");
  const [category, setCategory] = useState("");

  const kasalar = db.kasalar || [
    { id: "nakit", name: "Nakit", icon: "💵" },
    { id: "banka", name: "Banka", icon: "🏦" },
  ];

  const handleSave = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      showToast("Geçerli tutar girin!", "error");
      return;
    }
    const nowIso = new Date().toISOString();
    save((prev) => ({
      ...prev,
      kasa: [
        ...prev.kasa,
        {
          id: genId(),
          type,
          category:
            category || (type === "gelir" ? "diger_gelir" : "diger_gider"),
          amount: amt,
          kasa,
          description,
          createdAt: nowIso,
          updatedAt: nowIso,
        },
      ],
    }));
    showToast(`${type === "gelir" ? "Gelir" : "Gider"} kaydedildi!`, "success");
    onClose();
  };

  return (
    <div className="quick-form-grid">
      <div>
        <label className="quick-form-label">Tutar (₺) *</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="quick-form-input"
          placeholder="0,00"
          autoFocus
        />
      </div>
      <div className="quick-form-grid-two">
        <div>
          <label className="quick-form-label">Kasa</label>
          <select
            value={kasa}
            onChange={(e) => setKasa(e.target.value)}
            className="quick-form-input"
            aria-label="Kasa seçimi"
          >
            {kasalar.map((k) => (
              <option key={k.id} value={k.id}>
                {k.icon} {k.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="quick-form-label">Kategori</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="quick-form-input"
            placeholder="opsiyonel"
          />
        </div>
      </div>
      <div>
        <label className="quick-form-label">Açıklama</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="quick-form-input"
          placeholder="Açıklama..."
        />
      </div>
      <button
        onClick={handleSave}
        className={`quick-submit-btn ${type === "gelir" ? "quick-submit-income" : "quick-submit-expense"}`}
      >
        💾 {type === "gelir" ? "Gelir Kaydet" : "Gider Kaydet"}
      </button>
    </div>
  );
}
