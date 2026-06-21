import { CariAgent } from "@/agents/CariAgent";
import { DeepSeekAgent } from "@/agents/DeepSeekAgent";
import { FaturaAgent } from "@/agents/FaturaAgent";
import { KasaAgent } from "@/agents/KasaAgent";
import { RaporAgent } from "@/agents/RaporAgent";
import { SatisAgent } from "@/agents/SatisAgent";
import { StokAgent } from "@/agents/StokAgent";
import type { BaseAgent } from "@/agents/BaseAgent";
import type { AgentId, AgentRequest, AgentResponse } from "@/agents/types";

export { BaseAgent } from "@/agents/BaseAgent";
export { CariAgent } from "@/agents/CariAgent";
export { DeepSeekAgent } from "@/agents/DeepSeekAgent";
export { FaturaAgent } from "@/agents/FaturaAgent";
export { KasaAgent } from "@/agents/KasaAgent";
export { RaporAgent } from "@/agents/RaporAgent";
export { SatisAgent } from "@/agents/SatisAgent";
export { StokAgent } from "@/agents/StokAgent";

const _agents = {} as Record<AgentId, BaseAgent>;

// Type that all agents share (for union type resolution)
type AnyAgent = BaseAgent & { islemYap: (req: AgentRequest) => Promise<AgentResponse> };

export function getAgent(id: "satis"): SatisAgent;
export function getAgent(id: "stok"): StokAgent;
export function getAgent(id: "kasa"): KasaAgent;
export function getAgent(id: "cari"): CariAgent;
export function getAgent(id: "fatura"): FaturaAgent;
export function getAgent(id: "rapor"): RaporAgent;
export function getAgent(id: "deep_seek"): DeepSeekAgent;
// Fallback for union types - returns common base with islemYap
export function getAgent(id: AgentId): AnyAgent;
export function getAgent(id: AgentId): AnyAgent {
  if (!_agents[id]) {
    switch (id) {
      case "stok": _agents[id] = new StokAgent(); break;
      case "kasa": _agents[id] = new KasaAgent(); break;
      case "satis": _agents[id] = new SatisAgent(); break;
      case "cari": _agents[id] = new CariAgent(); break;
      case "fatura": _agents[id] = new FaturaAgent(); break;
      case "rapor": _agents[id] = new RaporAgent(); break;
      case "deep_seek": _agents[id] = new DeepSeekAgent(); break;
    }
  }
  return _agents[id];
}

export function getAllAgents(): BaseAgent[] {
  const allIds: AgentId[] = ["stok", "kasa", "satis", "cari", "fatura", "rapor", "deep_seek"];
  return allIds.map(id => (getAgent as (id: AgentId) => BaseAgent)(id));
}
