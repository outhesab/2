import { logger } from "@/lib/logger";
import { readSSEStream } from "@/lib/streamUtils";

const BASE_URL = "https://api.deepseek.com/chat/completions";

function requireKey(key: string, name: string): void {
  if (!key?.trim()) throw new Error(`${name} API anahtarı boş. Ayarlar'dan ekleyin.`);
}

export async function askDeepSeek(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  apiKey: string,
  onChunk: (text: string) => void,
  options?: { reasoning?: boolean; maxTokens?: number },
): Promise<string> {
  requireKey(apiKey, "DeepSeek");
  const body: Record<string, unknown> = {
    model: options?.reasoning ? "deepseek-reasoner" : "deepseek-chat",
    messages,
    stream: true,
    max_tokens: options?.maxTokens ?? 1024,
  };

  if (options?.reasoning) {
    body.extra_body = { thinking: { type: "enabled" } };
  }

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (res.status === 429) throw new Error("429 Too many requests");
  if (!res.ok) throw new Error(`DeepSeek API: ${res.status}`);

  return readSSEStream(res, onChunk,
    (d: any) => d.choices?.[0]?.delta?.content,
    () => logger.warn("deepseek", "DeepSeek stream parse hatası"),
  );
}
