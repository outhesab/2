import type { SpecRule, SpecCheckResult } from "./types";

interface SpecMeta {
  id: string;
  spec: string;
  title: string;
  severity: "error" | "warn" | "info";
}

const META: SpecMeta[] = [
  { id: "NO_RELATIVE_IMPORT", spec: "BILESEN_MIMARISI", title: "Hiçbir dosyada relative import (../) kullanılmamalı", severity: "error" },
  { id: "NO_STATIC_INLINE_STYLE", spec: "BILESEN_MIMARISI", title: "Statik stiller inline style ile değil className ile yazılmalı", severity: "info" },
  { id: "EMPTY_COMPONENT_IMPORTED", spec: "BILESEN_MIMARISI", title: "Pages altında Empty component import edilmiş olmalı", severity: "info" },
  { id: "SHADCN_UNTOUCHED", spec: "BILESEN_MIMARISI", title: "shadcn/ui dosyaları değiştirilmemiş olmalı", severity: "error" },
  { id: "SUSPENSE_WRAPPED_ROUTES", spec: "HATA_DURUMLARI", title: "Tüm route'lar <Suspense> ile sarılmış olmalı", severity: "error" },
  { id: "TOAST_IMPORT_PATTERN", spec: "HATA_DURUMLARI", title: "Hata yönetiminde showToast kullanılıyor olmalı", severity: "info" },
  { id: "ERROR_BOUNDARY_ACTIVE", spec: "HATA_DURUMLARI", title: "ErrorBoundary mevcut ve aktif", severity: "error" },
  { id: "ALL_ROUTES_LAZY", spec: "NAVIGASYON", title: "Tüm page import'ları React.lazy() ile sarılmış olmalı", severity: "error" },
  { id: "TAB_ROUTE_MATCH", spec: "NAVIGASYON", title: "Her tab için TABS ve TAB_PATHS'de eşleşen kayıt olmalı", severity: "error" },
  { id: "NO_DIRECT_DB_WRITE", spec: "VERI_KATMANI", title: "doğrudan sobaYonetim DB key'ine yazmak yasak — save() kullanılmalı", severity: "error" },
  { id: "NO_DB_JSON_PARSE_IN_PAGES", spec: "VERI_KATMANI", title: "Sayfalarda doğrudan sobaYonetim JSON parse etmek yasak", severity: "error" },
  { id: "VERSION_CONSISTENCY_TEST_EXISTS", spec: "TEST_STRATEJISI", title: "Cross-file consistency testi mevcut olmalı", severity: "error" },
];

function toSpecRule(m: SpecMeta): SpecRule {
  return { ...m, check: (): SpecCheckResult => ({ passed: false, violations: [{ file: "", message: "check() yalnızca test ortamında çalışır" }] }) };
}

export function getAllRules(): SpecRule[] {
  return META.map(toSpecRule);
}

export function getRulesBySpec(spec: string): SpecRule[] {
  return META.filter((m) => m.spec === spec).map(toSpecRule);
}

export function getSpecList(): { name: string; count: number }[] {
  const map = new Map<string, number>();
  for (const m of META) {
    map.set(m.spec, (map.get(m.spec) || 0) + 1);
  }
  return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
}
