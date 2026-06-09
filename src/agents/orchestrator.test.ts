import { describe, expect, it } from "vitest";

describe("orchestrator", () => {
  it("should export planAgentFlow", async () => {
    const mod = await import("@/agents/orchestrator");
    expect(typeof mod.planAgentFlow).toBe("function");
  });

  it("should export dispatchAgentFlow", async () => {
    const mod = await import("@/agents/orchestrator");
    expect(typeof mod.dispatchAgentFlow).toBe("function");
  });
});
