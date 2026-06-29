import type { SpecGroupResult, SpecRule } from './types';
import { componentRules } from './component-rules';
import { errorRules } from './error-rules';
import { navigationRules } from './navigation-rules';
import { dataRules } from './data-rules';
import { testRules } from './test-rules';
import { componentCoverageRules } from './component-coverage-rules';
import { accessibilityRules } from './accessibility-rules';
import { performanceBudgetRules } from './performance-budget-rules';

const ALL_RULES: SpecRule[] = [
  ...componentRules,
  ...errorRules,
  ...navigationRules,
  ...dataRules,
  ...testRules,
  ...componentCoverageRules,
  ...accessibilityRules,
  ...performanceBudgetRules,
];

export function getAllRules(): SpecRule[] {
  return ALL_RULES;
}

export function getRulesBySpec(spec: string): SpecRule[] {
  return ALL_RULES.filter((r) => r.spec === spec);
}

export function getSpecList(): { name: string; count: number }[] {
  const map = new Map<string, number>();
  for (const r of ALL_RULES) {
    map.set(r.spec, (map.get(r.spec) || 0) + 1);
  }
  return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
}

export function runSpecs(): SpecGroupResult[] {
  const specMap = new Map<string, SpecRule[]>();
  for (const rule of ALL_RULES) {
    if (!specMap.has(rule.spec)) specMap.set(rule.spec, []);
    specMap.get(rule.spec)!.push(rule);
  }

  return Array.from(specMap.entries()).map(([spec, rules]) => {
    let passed = 0;
    const ruleResults = rules.map((rule) => {
      const result = rule.check();
      if (result.passed) passed++;
      return {
        id: rule.id,
        title: rule.title,
        severity: rule.severity as 'error' | 'warn' | 'info',
        passed: result.passed,
        violations: result.violations,
      };
    });
    return { spec, passed, total: rules.length, rules: ruleResults };
  });
}
