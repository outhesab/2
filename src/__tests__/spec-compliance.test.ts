import { describe, it, expect } from "vitest";
import { runSpecs } from "../lib/specs/index";

describe("Spec Compliance", () => {
  const results = runSpecs();

  for (const group of results) {
    describe(group.spec, () => {
      for (const rule of group.rules) {
        it(`${rule.passed ? "✓" : "✗"} ${rule.title} (${rule.severity})`, () => {
          if (rule.severity === "error") {
            expect(rule.passed, rule.violations.map((v) => `${v.file}:${v.line || 1} — ${v.message}`).join("\n")).toBe(true);
          } else {
            expect(rule.passed).toBe(true);
          }
        });
      }
    });
  }

  it("tüm spec grupları çalıştırıldı", () => {
    expect(results.length).toBeGreaterThanOrEqual(5);
  });
});
