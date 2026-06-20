import { BaseAgent } from "@/agents/BaseAgent";
import type { AgentRequest, AgentResponse } from "@/agents/types";
import { askDeepSeek } from "@/lib/deepseek";

function buildContext(db: unknown): string {
  const d = db as {
    products?: Array<{ name: string; stock: number; cost: number; price: number; deleted?: boolean }>;
    sales?: Array<{ total: number; profit: number; status: string; createdAt: string; deleted?: boolean }>;
    cari?: Array<{ name: string; balance: number; type: string; deleted?: boolean }>;
    kasa?: Array<{ type: string; amount: number; deleted?: boolean }>;
    stockMovements?: Array<{ type: string; amount: number; date: string }>;
    suppliers?: Array<{ name: string; deleted?: boolean }>;
    orders?: Array<{ amount: number; status: string }>;
  };
  const sections: string[] = [];

  const urunler = (d.products || []).filter((p) => !p.deleted);
  if (urunler.length > 0) {
    const toplamStokDegeri = urunler.reduce((s, p) => s + p.stock * p.cost, 0);
    const sifirStok = urunler.filter((p) => p.stock === 0).length;
    sections.push(
      `Ürünler: ${urunler.length} ürün, stok değeri ${Math.round(toplamStokDegeri)}₺, ${sifirStok} adet stokta sıfır`,
    );
  }

  const satislar = (d.sales || []).filter((s) => !s.deleted && s.status === "tamamlandi");
  if (satislar.length > 0) {
    const bugun = new Date().toISOString().slice(0, 10);
    const bugunSatis = satislar.filter((s) => s.createdAt.slice(0, 10) === bugun);
    sections.push(
      `Satışlar: bugün ${bugunSatis.length} satış (${Math.round(bugunSatis.reduce((s, x) => s + x.total, 0))}₺), toplam ${satislar.length} satış`,
    );
  }

  const cariler = (d.cari || []).filter((c) => !c.deleted);
  if (cariler.length > 0) {
    const toplamAlacak = cariler.filter((c) => c.type === "musteri").reduce((s, c) => s + Math.max(0, c.balance), 0);
    const toplamBorç = cariler.filter((c) => c.type === "tedarikci").reduce((s, c) => s + Math.max(0, c.balance), 0);
    sections.push(`Cari: ${cariler.length} hesap, alacak ${Math.round(toplamAlacak)}₺, borç ${Math.round(toplamBorç)}₺`);
  }

  const kasaDurum = (d.kasa || []).filter((k) => !k.deleted).reduce(
    (s, k) => s + (k.type === "gelir" ? k.amount : -k.amount), 0,
  );
  sections.push(`Kasa: ${Math.round(kasaDurum)}₺`);

  return sections.join("\n");
}

export class DeepSeekAgent extends BaseAgent {
  readonly id = "deep_seek" as const;
  readonly yetkiler = ["deep_seek.read", "deep_seek.write"] as const;

  async analizEt(soru: string, apiKey?: string): Promise<AgentResponse<string>> {
    if (!this.yetkiKontrolu("deep_seek.read")) {
      return { ok: false, error: "deep_seek.read yetkisi yok" };
    }
    if (!this.ctx) {
      return { ok: false, error: "Agent bağlanmadı — önce bagla() çağırın" };
    }

    const dbContext = buildContext(this.db);
    const systemMsg = `Sen Soba işletmesi için AI analistsin. Kısa, net, Türkçe yanıt ver.\n\nGüncel durum:\n${dbContext}`;
    const apiKeyToUse = apiKey || import.meta.env.VITE_DEEPSEEK_API_KEY || "";

    if (!apiKeyToUse) {
      return { ok: false, error: "DeepSeek API anahtarı bulunamadı — Entegrasyonlar sayfasından ekleyin" };
    }

    try {
      let fullResponse = "";
      const result = await askDeepSeek(
        [
          { role: "system", content: systemMsg },
          { role: "user", content: soru },
        ],
        apiKeyToUse,
        (chunk) => { fullResponse += chunk; },
        { maxTokens: 2048 },
      );
      return { ok: true, data: result || fullResponse };
    } catch (err) {
      const message = err instanceof Error ? err.message : "DeepSeek API hatası";
      return { ok: false, error: message };
    }
  }

  async onerUret(veri: Record<string, unknown>, apiKey?: string): Promise<AgentResponse<string>> {
    if (!this.yetkiKontrolu("deep_seek.write")) {
      return { ok: false, error: "deep_seek.write yetkisi yok" };
    }
    if (!this.ctx) {
      return { ok: false, error: "Agent bağlanmadı — önce bagla() çağırın" };
    }

    const dbContext = buildContext(this.db);
    const prompt = `Sen Soba işletmesi danışmanısın.\n\nGüncel durum:\n${dbContext}\n\nVerilen veri:\n${JSON.stringify(veri, null, 2)}\n\nBu veriye dayanarak somut öneriler üret. Türkçe, kısa ve net yanıt ver.`;
    const apiKeyToUse = apiKey || import.meta.env.VITE_DEEPSEEK_API_KEY || "";

    if (!apiKeyToUse) {
      return { ok: false, error: "DeepSeek API anahtarı bulunamadı" };
    }

    try {
      let fullResponse = "";
      const result = await askDeepSeek(
        [
          { role: "system", content: "Sen bir işletme danışmanısın." },
          { role: "user", content: prompt },
        ],
        apiKeyToUse,
        (chunk) => { fullResponse += chunk; },
        { maxTokens: 2048 },
      );
      return { ok: true, data: result || fullResponse };
    } catch (err) {
      const message = err instanceof Error ? err.message : "DeepSeek API hatası";
      return { ok: false, error: message };
    }
  }

  async islemYap(talep: AgentRequest): Promise<AgentResponse> {
    this.yayinla("deep_seek.islem", {
      action: talep.action,
      payload: talep.payload,
      meta: talep.meta,
    });

    if (talep.action === "analiz" && talep.payload?.soru) {
      return this.analizEt(String(talep.payload.soru), talep.payload?.apiKey as string | undefined);
    }

    if (talep.action === "analyze_intent" && talep.payload?.prompt) {
      return this.analizEt(String(talep.payload.prompt), talep.payload?.apiKey as string | undefined);
    }

    if (talep.action === "oner" && talep.payload?.veri) {
      return this.onerUret(talep.payload.veri as Record<string, unknown>, talep.payload?.apiKey as string | undefined);
    }

    return {
      ok: true,
      data: {
        agent: this.id,
        action: talep.action,
        status: "queued",
      },
    };
  }
}
