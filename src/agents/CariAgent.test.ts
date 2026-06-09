import { describe, expect, it } from "vitest";

describe("CariAgent", () => {
  it("should export the agent class", async () => {
    const mod = await import("@/agents/CariAgent");
    expect(mod.CariAgent).toBeDefined();
    expect(typeof mod.CariAgent).toBe("function");
  });
});
