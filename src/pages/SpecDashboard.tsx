import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { getSpecList, getRulesBySpec } from '@/lib/specs/index';

const BG_CARD = 'var(--bg-elevated)';
const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } },
};

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, { bg: string; fg: string }> = {
    error: { bg: 'rgba(239,68,68,0.15)', fg: '#ef4444' },
    warn: { bg: 'rgba(245,158,11,0.15)', fg: '#f59e0b' },
    info: { bg: 'rgba(59,130,246,0.15)', fg: '#3b82f6' },
  };
  const c = colors[severity] || colors.info;
  return (
    <span
      style={{
        background: c.bg,
        color: c.fg,
        fontSize: '0.7rem',
        padding: '2px 8px',
        borderRadius: 9999,
        fontWeight: 600,
      }}
    >
      {severity}
    </span>
  );
}

export default function SpecDashboard() {
  const specList = useMemo(() => getSpecList(), []);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}
    >
      <motion.div variants={item}>
        <h1 style={{ color: TEXT_PRIMARY, fontSize: '1.5rem', fontWeight: 700, marginBottom: 4 }}>Spec Compliance</h1>
        <p style={{ color: TEXT_MUTED, fontSize: '0.85rem', marginBottom: 24 }}>
          Dinamik spec kuralları ve uygunluk durumu. Detaylı kontrol için: <code>npm run test:specs</code>
        </p>
      </motion.div>

      {specList.map((spec) => (
        <SpecCard key={spec.name} name={spec.name} count={spec.count} />
      ))}
    </motion.div>
  );
}

function SpecCard({ name, count }: { name: string; count: number }) {
  const rules = useMemo(() => getRulesBySpec(name), [name]);

  return (
    <motion.div
      variants={item}
      style={{
        background: BG_CARD,
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ color: TEXT_PRIMARY, fontSize: '1.05rem', fontWeight: 600 }}>{name}</h2>
          <p style={{ color: TEXT_MUTED, fontSize: '0.8rem' }}>
            {count} kural · docs/{name}.md
          </p>
        </div>
        <a
          href={`/docs/${name.toLowerCase()}.md`}
          style={{ color: '#3b82f6', fontSize: '0.8rem', textDecoration: 'none' }}
        >
          Spec'i oku →
        </a>
      </div>

      {rules.map((rule) => (
        <div
          key={rule.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px 0',
            borderTop: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <span style={{ fontSize: '1rem' }}>{/* icon placeholder */}📋</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: TEXT_PRIMARY, fontSize: '0.85rem', fontWeight: 500 }}>{rule.title}</span>
              <SeverityBadge severity={rule.severity} />
            </div>
            <code style={{ color: TEXT_MUTED, fontSize: '0.75rem' }}>{rule.id}</code>
          </div>
        </div>
      ))}
    </motion.div>
  );
}
