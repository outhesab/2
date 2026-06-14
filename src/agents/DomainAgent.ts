import { BaseAgent } from './BaseAgent'
import { processIntent } from '@/domain/intentEngine'
import { applyIntentResult } from '@/hooks/db/dbHelpers'
import type { AgentRequest, AgentResponse } from './types'
import type { Intent } from '@/domain/types'

export abstract class DomainAgent extends BaseAgent {
  protected abstract mapRequestToIntent(talep: AgentRequest): Intent | null

  async islemYap(talep: AgentRequest): Promise<AgentResponse> {
    if (!this.ctx) return { ok: false, error: `${this.id} bağlanmadı` }

    this.yayinla(`${this.id}.islem`, { action: talep.action, payload: talep.payload })

    const intent = this.mapRequestToIntent(talep)

    if (!intent) {
      return { ok: false, error: `Desteklenmeyen aksiyon: ${talep.action}` }
    }

    const db = this.db
    const result = processIntent(intent, db)

    if (!result.ok) {
      return { ok: false, error: result.error }
    }

    this.ctx.save((prev) => applyIntentResult(prev, result.data!))

    return { 
      ok: true, 
      data: { 
        agent: this.id, 
        action: talep.action, 
        status: 'completed',
        intentResult: result 
      } 
    }
  }
}
