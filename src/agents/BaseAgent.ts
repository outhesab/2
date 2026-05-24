import { agentBus } from "@/agents/AgentBus";
import type { AgentContext, AgentEvent, AgentId, AgentPermission, AgentRequest, AgentResponse } from "@/agents/types";
import type { DB } from "@/types";

export abstract class BaseAgent {
  abstract readonly id: AgentId;
  abstract readonly yetkiler: readonly AgentPermission[];

  protected ctx: AgentContext | null = null;

  bagla(ctx: AgentContext): void {
    this.ctx = ctx;
  }

  protected get db(): DB {
    if (!this.ctx) throw new Error(`${this.id} agent bağlanmadı — önce bagla() çağırın`);
    return this.ctx.getDB();
  }

  protected get save() {
    if (!this.ctx) throw new Error(`${this.id} agent bağlanmadı — önce bagla() çağırın`);
    return this.ctx.save;
  }

  yetkiKontrolu(izin: AgentPermission): boolean {
    return this.yetkiler.includes(izin);
  }

  protected yayinla(type: string, payload?: Record<string, unknown>) {
    agentBus.emit(this.id, type, payload);
  }

  onEvent(handler: (event: AgentEvent) => void): () => void {
    return agentBus.onEvent(handler);
  }

  abstract islemYap(talep: AgentRequest): Promise<AgentResponse>;
}
