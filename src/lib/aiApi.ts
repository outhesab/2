export interface Message {
  role: "user" | "assistant";
  content: string;
  source?: "deepseek" | "claude" | "gemini" | "offline";
}

export interface AIAction {
  type: "query" | "update" | "report";
  module: string;
  payload: unknown;
}

function requireKey(key: string, name: string): void {
  if (!key?.trim())
    throw new Error(`${name} API anahtarı boş. Ayarlar'dan ekleyin.`);
}

export async function askClaude(
  messages: Message[],
  context: string,
  key: string,
  onChunk: (t: string) => void,
): Promise<void> {
  requireKey(key, "Claude");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1024,
      system: `Sen Soba işletmesi için AI analistsin. Kısa, net, Türkçe yanıt ver.\n\n${context}`,
      messages: messages
        .filter((m) => m.content)
        .map((m) => ({ role: m.role, content: m.content })),
      stream: true,
    }),
  });
  if (res.status === 429) throw new Error("429 Too many requests");
  if (!res.ok) throw new Error(`Claude API: ${res.status}`);
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6);
      if (data === "[DONE]") break;
      try {
        const d = JSON.parse(data);
        if (d.type === "content_block_delta") onChunk(d.delta?.text || "");
      } catch {
        /* ignore */
      }
    }
  }
}

export async function askGemini(
  messages: Message[],
  context: string,
  key: string,
  onChunk: (t: string) => void,
): Promise<void> {
  requireKey(key, "Gemini");
  const contents = [
    { role: "user", parts: [{ text: `İşletme verilerim:\n${context}` }] },
    {
      role: "model",
      parts: [
        { text: "Anladım, verilerinizi inceledim. Nasıl yardımcı olabilirim?" },
      ],
    },
    ...messages
      .filter((m) => m.content)
      .map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      })),
  ];
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [
            {
              text: "Türkçe, kısa ve net yanıt ver. Soba işletmesi analistisin.",
            },
          ],
        },
      }),
    },
  );
  if (res.status === 429) throw new Error("429 Too many requests");
  if (!res.ok) throw new Error(`Gemini API: ${res.status}`);
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6);
      if (data === "[DONE]") break;
      try {
        const d = JSON.parse(data);
        const text = d.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) onChunk(text);
      } catch {
        /* ignore */
      }
    }
  }
}
