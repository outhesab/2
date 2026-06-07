/**
 * SalesHelpers - Row component and re-exports
 * Note: Utilities moved to salesStyles.ts to fix react-refresh warnings
 */
export { StatCard } from './pageHelpers.tsx';

export function Row({ label, value, color, big }: { label: string; value: string; color?: string; big?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
      }}
    >
      <span style={{ color: 'var(--text-muted)', fontSize: big ? '0.9rem' : '0.82rem' }}>{label}</span>
      <span
        style={{
          color: color || '#f1f5f9',
          fontWeight: big ? 800 : 600,
          fontSize: big ? '1.1rem' : '0.88rem',
        }}
      >
        {value}
      </span>
    </div>
  );
}
