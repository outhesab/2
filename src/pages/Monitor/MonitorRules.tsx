import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { useConfirm } from "@/components/ConfirmDialog";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import EmptyState from "@/components/EmptyState";
import { genId } from "@/lib/utils-tr";
import { lbl, inp } from "@/lib/formStyles";
import { ModalActions, CheckboxField } from "../pageHelpers";
import type { DB, MonitorRule } from "@/types";
import { ruleTypes, ruleLabels, levelColors } from "./types";

interface Props {
  rules: MonitorRule[];
  save: (fn: (prev: DB) => DB) => void;
}

export default function MonitorRules({ rules, save }: Props) {
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<MonitorRule>>({
    name: "",
    type: "stok_min",
    level: "warning",
    interval: 60,
    popup: true,
    active: true,
    threshold: 0,
  });

  const openAdd = () => {
    setForm({
      name: "",
      type: "stok_min",
      level: "warning",
      interval: 60,
      popup: true,
      active: true,
      threshold: 0,
    });
    setEditId(null);
    setModalOpen(true);
  };

  const openEdit = (r: MonitorRule) => {
    setForm({ ...r });
    setEditId(r.id);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name) {
      showToast("Kural adı gerekli!", "error");
      return;
    }
    const nowIso = new Date().toISOString();
    save((prev) => {
      const updatedRules = [...prev.monitorRules];
      if (editId) {
        const i = updatedRules.findIndex((r) => r.id === editId);
        if (i >= 0)
          updatedRules[i] = {
            ...updatedRules[i],
            ...form,
            updatedAt: nowIso,
          } as MonitorRule;
        showToast("Kural güncellendi!", "success");
      } else {
        updatedRules.push({
          id: genId(),
          createdAt: nowIso,
          updatedAt: nowIso,
          name: "",
          type: "stok_min",
          level: "warning",
          interval: 60,
          popup: true,
          active: true,
          ...form,
        } as MonitorRule);
        showToast("Kural eklendi!", "success");
      }
      return { ...prev, monitorRules: updatedRules };
    });
    setModalOpen(false);
  };

  const deleteRule = (id: string) => {
    showConfirm("Kural Sil", "Bu kuralı silmek istediğinizden emin misiniz?", () => {
      save((prev) => ({
        ...prev,
        monitorRules: prev.monitorRules.filter((r) => r.id !== id),
      }));
      showToast("Kural silindi!", "success");
    });
  };

  const toggleActive = (id: string) => {
    save((prev) => ({
      ...prev,
      monitorRules: prev.monitorRules.map((r) =>
        r.id === id ? { ...r, active: !r.active } : r,
      ),
    }));
  };

  return (
    <>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <button
          onClick={openAdd}
          style={{
            background: "#ff5722",
            border: "none",
            borderRadius: 10,
            color: "#fff",
            padding: "10px 20px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          + Yeni Kural
        </button>
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {rules.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title="Kural bulunamadı"
            description="Henüz izleme kuralı tanımlanmadı. Buton ile yeni kural ekleyin."
          />
        ) : (
          rules.map((r) => (
            <div
              key={r.id}
              style={{
                background: "#1e293b",
                borderRadius: 12,
                border: `1px solid ${r.active ? levelColors[r.level] + "33" : "#33415555"}`,
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 16,
                opacity: r.active ? 1 : 0.6,
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                    {r.name}
                  </span>
                  <span
                    style={{
                      background: `${levelColors[r.level]}22`,
                      color: levelColors[r.level],
                      borderRadius: 6,
                      padding: "1px 8px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                    }}
                  >
                    {r.level}
                  </span>
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                  {ruleLabels[r.type] || r.type} · Her {r.interval}dk
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  onClick={() => toggleActive(r.id)}
                  style={{
                    background: r.active ? "rgba(16,185,129,0.15)" : "#273548",
                    border: "none",
                    borderRadius: 8,
                    color: r.active ? "#10b981" : "#64748b",
                    padding: "7px 12px",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "0.82rem",
                  }}
                >
                  {r.active ? "✓ Aktif" : "○ Pasif"}
                </button>
                {!r.isDefault && (
                  <button
                    onClick={() => openEdit(r)}
                    style={{
                      background: "rgba(59,130,246,0.1)",
                      border: "none",
                      borderRadius: 8,
                      color: "#60a5fa",
                      padding: "7px 10px",
                      cursor: "pointer",
                    }}
                  >
                    ✏️
                  </button>
                )}
                {!r.isDefault && (
                  <button
                    onClick={() => deleteRule(r.id)}
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      border: "none",
                      borderRadius: 8,
                      color: "#ef4444",
                      padding: "7px 10px",
                      cursor: "pointer",
                    }}
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? "✏️ Kural Düzenle" : "➕ Yeni Kural"}
      >
        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <label style={lbl}>Kural Adı *</label>
            <input
              value={form.name || ""}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              style={inp}
            />
          </div>
          <div>
            <label style={lbl}>Kural Tipi</label>
            <select
              value={form.type}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  type: e.target.value as MonitorRule["type"],
                }))
              }
              style={inp}
            >
              {ruleTypes.map((t) => (
                <option key={t} value={t}>
                  {ruleLabels[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={lbl}>Seviye</label>
            <select
              value={form.level}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  level: e.target.value as MonitorRule["level"],
                }))
              }
              style={inp}
            >
              <option value="critical">🔴 Kritik</option>
              <option value="warning">🟡 Uyarı</option>
              <option value="info">🔵 Bilgi</option>
            </select>
          </div>
          {(form.type === "kasa_min" ||
            form.type === "satis_hedef" ||
            form.type === "stok_min") && (
            <div>
              <label style={lbl}>
                Eşik Değeri ({form.type === "stok_min" ? "adet" : "₺"})
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={form.threshold || 0}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    threshold: parseFloat(e.target.value) || 0,
                  }))
                }
                style={inp}
              />
            </div>
          )}
          {(form.type === "alacak_vadeli" || form.type === "borc_vadeli") && (
            <div>
              <label style={lbl}>Vade Eşiği (gün)</label>
              <input
                type="number"
                inputMode="numeric"
                value={form.threshold || 30}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    threshold: parseInt(e.target.value) || 30,
                  }))
                }
                style={inp}
              />
            </div>
          )}
          <div>
            <label style={lbl}>Kontrol Aralığı (dakika)</label>
            <input
              type="number"
              inputMode="decimal"
              value={form.interval || 60}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  interval: parseInt(e.target.value) || 60,
                }))
              }
              style={inp}
              min={1}
            />
          </div>
          <div
            style={{
              display: "flex",
              gap: 20,
              alignItems: "center",
              marginTop: 4,
            }}
          >
            <CheckboxField
              checked={form.popup ?? true}
              onChange={(v) => setForm((f) => ({ ...f, popup: v }))}
              label="Popup Bildirim"
            />
            <CheckboxField
              checked={form.active ?? true}
              onChange={(v) => setForm((f) => ({ ...f, active: v }))}
              label="Aktif"
              accentColor="#10b981"
            />
          </div>
        </div>
        <ModalActions
          onSave={handleSave}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </>
  );
}
