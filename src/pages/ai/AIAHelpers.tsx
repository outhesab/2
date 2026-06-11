import DOMPurify from 'dompurify';
import { escapeHtml } from './AIAHelpers.utils';

/* ------------------------------------------------------------------ */
/*  MarkdownText Component                                            */
/* ------------------------------------------------------------------ */

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
