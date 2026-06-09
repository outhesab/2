import { describe, expect, it } from "vitest";

describe("RaporAgent", () => {
  it("should export the agent class", async () => {
    const mod = await import("@/agents/RaporAgent");
    expect(mod.RaporAgent).toBeDefined();
    expect(typeof mod.RaporAgent).toBe("function");
  });
});
