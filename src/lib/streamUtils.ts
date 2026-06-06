import { logger } from "@/lib/logger";

export async function readSSEStream(
  response: Response,
  onChunk: (text: string) => void,
  extractText: (data: unknown) => string | undefined,
  onError?: () => void,
): Promise<string> {
  const reader = response.body!.getReader();
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
        const text = extractText(d);
        if (text) {
          onChunk(text);
          full += text;
        }
      } catch {
        onError?.();
      }
    }
    if (streamDone) break;
  }
  return full;
}
