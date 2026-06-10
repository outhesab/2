import DOMPurify from 'dompurify';
import type { DBAction } from '@/lib/aiActions';

export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const ALLOWED_TAGS = new Set(['strong', 'h3', 'h4', 'li', 'ul', 'br', 'span']);
function sanitize(html: string): string {
  return html.replace(/<(\/?)(\w+)[^>]*>/g, (match, slash, tag) => {
    if (ALLOWED_TAGS.has(tag.toLowerCase())) return match;
    const escaped = match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return escaped;
  });
}

export function MarkdownText({ text }: { text: string }) {
  const html = sanitize(
    escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(
        /^### (.+)$/gm,
        '<h4 style="color:var(--accent);font-size:0.9rem;margin:10px 0 4px;font-weight:700">$1</h4>',
      )
      .replace(
        /^## (.+)$/gm,
        '<h3 style="color:var(--text-primary);font-size:1rem;margin:12px 0 6px;font-weight:800">$1</h3>',
      )
      .replace(/^- (.+)$/gm, '<li style="margin:3px 0;padding-left:4px">$1</li>')
      .replace(/(<li[^>]*>.*<\/li>\n?)+/gs, '<ul style="list-style:none;padding:0;margin:6px 0">$&</ul>')
      .replace(/\n\n/g, '<br/>')
      .replace(/\n/g, '<br/>'),
  );
  return <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />;
}

export function getActionAffectedIds(action: DBAction): string[] {
  const ids = new Set<string>();
  const payload = action.payload || {};
  ['id', 'productId', 'cariId', 'saleId', 'invoiceId', 'kasaEntryId'].forEach((key) => {
    const value = payload[key];
    if (typeof value === 'string' && value.trim()) ids.add(value.trim());
  });
  return [...ids];
}

export function isDangerousAction(action: DBAction): boolean {
  return ['sale', 'kasa_gider', 'stok_guncelle', 'cari_tahsilat'].includes(action.type);
}

export const sourceLabel: Record<string, { label: string; color: string; bg: string }> = {
  deepseek: {
    label: '🧠 DeepSeek',
    color: 'var(--color-success)',
    bg: 'var(--color-success-soft)',
  },
  claude: {
    label: '🤖 Claude',
    color: 'var(--color-accent)',
    bg: 'var(--color-accent-soft)',
  },
  gemini: {
    label: '✨ Gemini',
    color: 'var(--color-primary-light)',
    bg: 'var(--color-primary-ultra)',
  },
  offline: {
    label: '🔌 Çevrimdışı',
    color: 'var(--text-muted)',
    bg: 'var(--bg-card)',
  },
};
