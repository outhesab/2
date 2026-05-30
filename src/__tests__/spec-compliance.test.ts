import { describe, it, expect } from "vitest";
import { runSpecs } from "@/lib/specs/index";

describe("Spec Compliance", () => {
  const results = runSpecs();

  for (const group of results) {
    describe(group.spec, () => {
      for (const rule of group.rules) {
        const icon = rule.passed ? "✓" : "✗";
        if (rule.severity === "info") {
          it(`${icon} ${rule.title} (info)`, () => {
            if (!rule.passed && rule.violations.length > 0) {
              // info seviyesi — geçmezse uyarı olarak logla
              console.warn(`[INFO] ${rule.id}:`, rule.violations.slice(0, 3).map((v) => v.file).join(", "));
            }
          });
        } else {
          it(`${icon} ${rule.title} (${rule.severity})`, () => {
            if (rule.severity === "error") {
              expect(rule.passed, rule.violations.map((v) => `${v.file}:${v.line || 1} — ${v.message}`).join("\n")).toBe(true);
            } else {
              expect(rule.passed).toBe(true);
            }
          });
        }
      }
    });
  }

  it("tüm spec grupları çalıştırıldı", () => {
    expect(results.length).toBeGreaterThanOrEqual(5);
  });
});
