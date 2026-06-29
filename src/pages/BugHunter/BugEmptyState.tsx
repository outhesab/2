export function BugEmptyState() {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '60px 20px',
        color: 'var(--text-muted)',
      }}
    >
      <div style={{ fontSize: '4rem', marginBottom: 16, opacity: 0.3 }}>🐛</div>
      <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Testleri baslatmak icin yukardaki butona tiklayin</p>
      <p style={{ fontSize: '0.85rem', marginTop: 8 }}>
        JavaScript, React, Muhasebe, Form, API, Guvenlik, Performans ve Veri Butunlugu testleri calistirilacak
      </p>
    </div>
  );
}
