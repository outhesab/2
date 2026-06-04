/**
 * @deprecated Session 2 — Yeni akışta SatisAgent completeSale() ile tüm yan etkileri
 * tek seferde uygular. Stok/Kasa/Cari agent'ları sadece non-sale operasyonlar için
 * çağrılır. Gelecek sürümde domain.intentEngine.processIntent() lehine kaldırılacak.
 */
import { getAgent } from "@/agents/index";
import { loadAgentSettings, type AgentId } from "@/lib/agentConfig";

export type OrchestratorAction = {
  type:
    | "sale"
    | "kasa_gelir"
    | "kasa_gider"
    | "stok_guncelle"
    | "cari_tahsilat"
    | "urun_ekle"
    | "cari_ekle";
  label: string;
  payload: Record<string, unknown>;
};

export function planAgentFlow(action: OrchestratorAction): string[] {
  if (action.type === "sale") {
    // SatisAgent tüm yan etkileri completeSale() ile tek seferde uygular
    return ["satis", "fatura", "rapor"];
  }

  if (action.type === "kasa_gelir" || action.type === "kasa_gider") {
    return ["kasa", "rapor"];
  }
  if (action.type === "stok_guncelle" || action.type === "urun_ekle") {
    return ["stok", "rapor"];
  }
  if (action.type === "cari_tahsilat" || action.type === "cari_ekle") {
    return ["cari", "rapor"];
  }
  return ["rapor"];
}

function filterDisabledAgents(flow: string[]) {
  const settings = loadAgentSettings();
  return flow.filter((id) => {
    // sadece bilinen agent'lar disable edilebilir
    const agentId = id as AgentId;
    return typeof settings[agentId] === "boolean" ? settings[agentId] : true;
  });
}

export async function dispatchAgentFlow(action: OrchestratorAction) {
  const flow = filterDisabledAgents(planAgentFlow(action));
  for (const id of flow) {
    const agent = getAgent(id as Parameters<typeof getAgent>[0]);
    await agent.islemYap({
      action: action.type,
      payload: action.payload,
      meta: { label: action.label, source: "ai-assistant" },
    });
  }
  return flow;
}
