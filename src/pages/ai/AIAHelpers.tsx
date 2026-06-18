/* ------------------------------------------------------------------ */
/*  MarkdownText Component — React-based, no dangerouslySetInnerHTML  */
/*  Parses simple markdown tokens (**bold**, ### h3, ## h2, - list)   */
/*  into React elements for accessibility & security.                  */
/* ------------------------------------------------------------------ */

interface Part {
  type: 'bold' | 'text';
  text: string;
}

function parseBold(text: string): Part[] {
  const parts: Part[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', text: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'bold', text: match[1] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', text: text.slice(lastIndex) });
  }
  return parts;
}

function renderLine(line: string, index: number): React.ReactNode {
  const parts = parseBold(line);
  return (
    <span key={index}>
      {parts.map((p, i) =>
        p.type === 'bold' ? (
          <strong key={i}>{p.text}</strong>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </span>
  );
}

function processLines(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  const listBuffer: React.ReactNode[] = [];
  let listIndex = 0;

  function flushList(key: string) {
    if (listBuffer.length > 0) {
      nodes.push(
        <ul key={key} style={{ listStyle: 'none', padding: 0, margin: '6px 0' }}>
          {listBuffer}
        </ul>,
      );
      listBuffer.length = 0;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];

    if (raw === '') {
      flushList(`ul-${i}`);
      nodes.push(<br key={`br-${i}`} />);
      continue;
    }

    const h3Match = raw.match(/^### (.+)$/);
    if (h3Match) {
      flushList(`ul-${i}`);
      nodes.push(
        <h4
          key={`h3-${i}`}
          style={{ color: 'var(--accent)', fontSize: '0.9rem', margin: '10px 0 4px', fontWeight: 700 }}
        >
          {h3Match[1]}
        </h4>,
      );
      continue;
    }

    const h2Match = raw.match(/^## (.+)$/);
    if (h2Match) {
      flushList(`ul-${i}`);
      nodes.push(
        <h3
          key={`h2-${i}`}
          style={{ color: 'var(--text-primary)', fontSize: '1rem', margin: '12px 0 6px', fontWeight: 800 }}
        >
          {h2Match[1]}
        </h3>,
      );
      continue;
    }

    const liMatch = raw.match(/^- (.+)$/);
    if (liMatch) {
      listBuffer.push(
        <li key={`li-${listIndex++}`} style={{ margin: '3px 0', paddingLeft: '4px' }}>
          {renderLine(liMatch[1], i)}
        </li>,
      );
      continue;
    }

    flushList(`ul-${i}`);
    nodes.push(renderLine(raw, i));
  }

  flushList(`ul-end`);
  return nodes;
}

export function MarkdownText({ text }: { text: string }) {
  return <div>{processLines(text)}</div>;
}
