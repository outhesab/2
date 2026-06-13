import type { TestResult } from './types';
import { STATUS_COLORS } from './types';
import { BugEmptyResult } from './BugEmptyResult';

interface BugResultsProps {
  results: TestResult[];
}

function ResultDetail({ result }: { result: TestResult }) {
  const style = STATUS_COLORS[result.status];

  return (
    <details
      key={result.id}
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: 12,
        padding: '14px 18px',
      }}
    >
      <summary
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontWeight: 600,
          color: '#f1f5f9',
          fontSize: '0.9rem',
        }}
      >
        <span style={{ fontSize: '1.1rem' }}>{style.icon}</span>
        <span style={{ flex: 1 }}>{result.testName}</span>
        <span
          style={{
            fontSize: '0.7rem',
            background: 'rgba(0,0,0,0.2)',
            padding: '3px 8px',
            borderRadius: 6,
            color: 'var(--text-dim)',
          }}
        >
          {result.category} › {result.subCategory}
        </span>
        <span
          style={{
            fontSize: '0.75rem',
            background: style.bg,
            border: `1px solid ${style.border}`,
            padding: '2px 8px',
            borderRadius: 6,
            color: style.text,
            fontWeight: 700,
          }}
        >
          Sev: {result.severity}
        </span>
      </summary>
      <div
        style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div style={{ color: 'var(--text-primary)', fontSize: '0.85rem', marginBottom: 8 }}>
          <strong>Mesaj:</strong> {result.message}
        </div>
        {result.details && (
          <div
            style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 8,
              padding: '10px 12px',
              marginBottom: 8,
              fontSize: '0.8rem',
              color: '#cbd5e1',
              whiteSpace: 'pre-wrap',
            }}
          >
            <strong>Detay:</strong>
            <br />
            {result.details}
          </div>
        )}
        {result.fix && (
          <div
            style={{
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: '0.8rem',
              color: '#6ee7b7',
            }}
          >
            <strong>✓ Cozum:</strong>
            <br />
            {result.fix}
          </div>
        )}
      </div>
    </details>
  );
}

export function BugResults({ results }: BugResultsProps) {
  if (results.length === 0) {
    return <BugEmptyResult />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {results.map((result) => (
        <ResultDetail key={result.id} result={result} />
      ))}
    </div>
  );
}
