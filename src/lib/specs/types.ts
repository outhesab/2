export type SpecSeverity = "error" | "warn" | "info";

export interface SpecViolation {
  file: string;
  line?: number;
  message: string;
}

export interface SpecCheckResult {
  passed: boolean;
  violations: SpecViolation[];
}

export interface SpecRule {
  id: string;
  spec: string;
  title: string;
  severity: SpecSeverity;
  check: () => SpecCheckResult;
}

export interface SpecResult {
  id: string;
  title: string;
  severity: SpecSeverity;
  passed: boolean;
  violations: SpecViolation[];
}

export interface SpecGroupResult {
  spec: string;
  passed: number;
  total: number;
  rules: SpecResult[];
}
