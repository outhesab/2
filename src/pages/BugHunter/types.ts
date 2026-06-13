export interface TestResult {
  id: string;
  category: string;
  subCategory: string;
  testName: string;
  status: 'pass' | 'fail' | 'warning' | 'critical' | 'pending' | 'running';
  message: string;
  details?: string;
  timestamp: number;
  duration: number;
  severity: 1 | 2 | 3 | 4 | 5;
  fix?: string;
}

export interface BugReport {
  totalTests: number;
  passed: number;
  failed: number;
  warnings: number;
  critical: number;
  results: TestResult[];
  startTime: number;
  endTime: number;
  score: number;
  grade: string;
}

export type FilterType = 'all' | 'critical' | 'fail' | 'warning' | 'pass';

export type StatusKey = TestResult['status'];

export const STATUS_COLORS: Record<StatusKey, { bg: string; border: string; text: string; icon: string }> = {
  pass: {
    bg: 'rgba(16,185,129,0.1)',
    border: 'rgba(16,185,129,0.3)',
    text: '#10b981',
    icon: '\u2713',
  },
  fail: {
    bg: 'rgba(239,68,68,0.1)',
    border: 'rgba(239,68,68,0.3)',
    text: '#ef4444',
    icon: '\u2717',
  },
  warning: {
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.3)',
    text: '#f59e0b',
    icon: '\u26A0',
  },
  critical: {
    bg: 'rgba(220,38,38,0.15)',
    border: 'rgba(220,38,38,0.4)',
    text: '#dc2626',
    icon: '\uD83D\uDEA8',
  },
  pending: {
    bg: 'rgba(100,116,139,0.1)',
    border: 'rgba(100,116,139,0.2)',
    text: '#64748b',
    icon: '\u25CB',
  },
  running: {
    bg: 'rgba(59,130,246,0.1)',
    border: 'rgba(59,130,246,0.3)',
    text: '#3b82f6',
    icon: '\u27F3',
  },
};
