import { describe, expect, it } from "vitest";
import { KasaAgent } from "@/agents/KasaAgent";

describe("KasaAgent", () => {
  it("should export the agent class", () => {
    expect(KasaAgent).toBeDefined();
    expect(typeof KasaAgent).toBe("function");
  });
});
