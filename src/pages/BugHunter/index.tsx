import { useState, useCallback, useRef } from 'react';
import { TestRunner } from './TestRunner';
import { BugStats } from './BugStats';
import { BugToolbar } from './BugToolbar';
import { BugResults } from './BugResults';
import { BugEmptyState } from './BugEmptyState';
import type { BugReport, FilterType } from './types';

export default function BugHunter() {
  const [report, setReport] = useState<BugReport | null>(null);
  const [running, setRunning] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const runnerRef = useRef<TestRunner | null>(null);

  const runTests = useCallback(() => {
    setRunning(true);
    const startTime = Date.now();
    setTimeout(() => {
      if (!runnerRef.current) runnerRef.current = new TestRunner();
      const results = runnerRef.current.runAll();
      const endTime = Date.now();
      const passed = results.filter((r) => r.status === 'pass').length;
      const failed = results.filter((r) => r.status === 'fail').length;
      const warnings = results.filter((r) => r.status === 'warning').length;
      const critical = results.filter((r) => r.status === 'critical').length;
      const score = Math.round((passed / results.length) * 100);
      const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
      setReport({
        totalTests: results.length,
        passed,
        failed,
        warnings,
        critical,
        results,
        startTime,
        endTime,
        score,
        grade,
      });
      setRunning(false);
    }, 100);
  }, []);

  const filteredResults =
    report?.results.filter((r) => {
      if (filter !== 'all' && r.status !== filter) return false;
      if (
        search &&
        !r.testName.toLowerCase().includes(search.toLowerCase()) &&
        !r.message.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    }) || [];

  return (
    <div style={{ padding: '20px', maxWidth: 1400, margin: '0 auto' }}>
      <div
        style={{
          background: 'linear-gradient(135deg,rgba(220,38,38,0.1),rgba(239,68,68,0.05))',
          border: '1px solid rgba(220,38,38,0.3)',
          borderRadius: 16,
          padding: '20px 24px',
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: '2rem' }}>🐛</span>
          <div style={{ flex: 1 }}>
            <h1
              style={{
                margin: 0,
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#f1f5f9',
              }}
            >
              Bug Hunter
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
              Kapsamli Hata Ayiklama & Test Sistemi — React Muhasebe Uygulamasi
            </p>
          </div>
          <button
            onClick={runTests}
            disabled={running}
            style={{
              background: running
                ? 'rgba(100,116,139,0.2)'
                : 'linear-gradient(135deg,#dc2626,#ef4444)',
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              padding: '12px 24px',
              fontWeight: 700,
              cursor: running ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              opacity: running ? 0.6 : 1,
            }}
          >
            {running ? '⟳ Testler Calisiyor...' : '▶ Testleri Baslat'}
          </button>
        </div>
        {report && <BugStats report={report} />}
      </div>

      {report && (
        <>
          <BugToolbar
            search={search}
            filter={filter}
            onSearchChange={setSearch}
            onFilterChange={setFilter}
          />
          <BugResults results={filteredResults} />
        </>
      )}

      {!report && !running && <BugEmptyState />}
    </div>
  );
}
