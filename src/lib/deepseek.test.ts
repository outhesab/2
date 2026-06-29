import { askDeepSeek } from '@/lib/deepseek';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

function mockSSEDelta(text: string): string {
  return JSON.stringify({ choices: [{ delta: { content: text } }] });
}

function mockSSEResponse(chunks: string[], status = 200): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      chunks.forEach((c) => {
        controller.enqueue(encoder.encode(`data: ${mockSSEDelta(c)}\n\n`));
      });
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
  return new Response(stream, {
    status,
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

describe('askDeepSeek', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch') as unknown as ReturnType<typeof vi.spyOn>;
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('başarılı streaming yanıt döndürmeli', async () => {
    const chunks = ['Merhaba', ', nasıl ', 'yardımcı ', 'olabilirim?'];
    fetchSpy.mockResolvedValue(mockSSEResponse(chunks));

    const onChunk = vi.fn();
    const result = await askDeepSeek([{ role: 'user', content: 'Selam' }], 'sk-test-key', onChunk);

    expect(result).toBe('Merhaba, nasıl yardımcı olabilirim?');
    expect(onChunk).toHaveBeenCalledTimes(4);
    expect(onChunk).toHaveBeenNthCalledWith(1, chunks[0]);
    expect(onChunk).toHaveBeenNthCalledWith(4, chunks[3]);

    const callArgs = fetchSpy.mock.calls[0];
    expect(callArgs[0]).toBe('https://api.deepseek.com/chat/completions');
    const body = JSON.parse(String((callArgs[1] as RequestInit)?.body || '{}'));
    expect(body.model).toBe('deepseek-chat');
    expect(body.stream).toBe(true);
    expect(body.messages).toHaveLength(1);
  });

  it('system mesajı gönderebilmeli', async () => {
    fetchSpy.mockResolvedValue(mockSSEResponse(['Yanıt']));

    await askDeepSeek(
      [
        { role: 'system', content: 'Sen bir asistansın' },
        { role: 'user', content: 'Merhaba' },
      ],
      'sk-test',
      vi.fn(),
    );

    const body = JSON.parse(String((fetchSpy.mock.calls[0][1] as RequestInit)?.body || '{}'));
    expect(body.messages).toHaveLength(2);
    expect(body.messages[0].role).toBe('system');
  });

  it('429 hatasını throw etmeli', async () => {
    fetchSpy.mockResolvedValue(new Response(null, { status: 429 }));

    await expect(askDeepSeek([{ role: 'user', content: 'test' }], 'sk-test', vi.fn())).rejects.toThrow('429');
  });

  it('401 hatasını throw etmeli', async () => {
    fetchSpy.mockResolvedValue(new Response(null, { status: 401 }));

    await expect(askDeepSeek([{ role: 'user', content: 'test' }], 'sk-test', vi.fn())).rejects.toThrow(
      'DeepSeek API: 401',
    );
  });

  it("reasoning opsiyonu extra_body'e thinking eklemeli", async () => {
    fetchSpy.mockResolvedValue(mockSSEResponse(['test']));

    await askDeepSeek([{ role: 'user', content: 'test' }], 'sk-test', vi.fn(), { reasoning: true });

    const body = JSON.parse(String((fetchSpy.mock.calls[0][1] as RequestInit)?.body || '{}'));
    expect(body.extra_body).toBeDefined();
    expect(body.extra_body.thinking.type).toBe('enabled');
  });

  it("maxTokens opsiyonu max_tokens'e yansımalı", async () => {
    fetchSpy.mockResolvedValue(mockSSEResponse(['test']));

    await askDeepSeek([{ role: 'user', content: 'test' }], 'sk-test', vi.fn(), { maxTokens: 4096 });

    const body = JSON.parse(String((fetchSpy.mock.calls[0][1] as RequestInit)?.body || '{}'));
    expect(body.max_tokens).toBe(4096);
  });
});
