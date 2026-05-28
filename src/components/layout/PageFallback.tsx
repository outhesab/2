export default function PageFallback() {
  return (
    <div className="app-page-fallback">
      <div style={{ width: '100%', maxWidth: 800, margin: '0 auto' }}>
        <div className="skeleton skeleton-heading" style={{ height: 28, width: '30%', marginBottom: 24 }} />
        <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton skeleton-stat" style={{ flex: 1, height: 100 }} />
          ))}
        </div>
        <div className="skeleton" style={{ width: '100%', height: 260, borderRadius: 16 }} />
      </div>
    </div>
  );
}
