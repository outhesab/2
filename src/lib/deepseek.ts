import { logger } from "@/lib/logger";

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

  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let full = "";
  let streamDone = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") { streamDone = true; break; }
      try {
        const d = JSON.parse(data);
        const content = d.choices?.[0]?.delta?.content;
        if (content) {
          onChunk(content);
          full += content;
        }
      } catch {
        logger.warn("deepseek", "DeepSeek stream parse hatası");
        /* ignore */
      }
    }
    if (streamDone) break;
  }

  return full;
}
