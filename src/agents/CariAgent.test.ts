import { describe, expect, it } from "vitest";
import { CariAgent } from "@/agents/CariAgent";

describe("CariAgent", () => {
  it("should export the agent class", () => {
    expect(CariAgent).toBeDefined();
    expect(typeof CariAgent).toBe("function");
  });
});
