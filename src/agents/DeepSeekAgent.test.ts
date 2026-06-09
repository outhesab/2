import { describe, expect, it } from "vitest";

describe("DeepSeekAgent", () => {
  it("should export the agent class", async () => {
    const mod = await import("@/agents/DeepSeekAgent");
    expect(mod.DeepSeekAgent).toBeDefined();
    expect(typeof mod.DeepSeekAgent).toBe("function");
  });
});
