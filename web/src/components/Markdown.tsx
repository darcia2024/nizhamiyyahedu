import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";

/** Markdown tersanitasi saat render (PRD 13.1): HTML mentah dibuang, enter tunggal jadi baris baru. */
export function Markdown({ source }: { source: string }) {
  const withBreaks = source.replace(/([^\n])\n(?!\n|[-*\d>#])/g, "$1  \n");
  return (
    <div className="prose">
      <ReactMarkdown
        rehypePlugins={[rehypeSanitize]}
        components={{
          a: ({ href, children }) =>
            href && /^https:\/\//.test(href) ? (
              <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
            ) : (
              <>{children}</>
            ),
        }}
      >
        {withBreaks}
      </ReactMarkdown>
    </div>
  );
}

export type MatanBlock = { ar: string; id: string };

export function parseMatan(raw: string | null | undefined): MatanBlock[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((b) => b && typeof b.ar === "string").map((b) => ({ ar: b.ar, id: String(b.id ?? "") })) : [];
  } catch {
    return [];
  }
}

export function MatanList({ blocks }: { blocks: MatanBlock[] }) {
  return (
    <>
      {blocks.map((b, i) => (
        <div className="matan" key={i}>
          <p className="ar" lang="ar" dir="rtl">{b.ar}</p>
          {b.id && <p className="tr">{b.id}</p>}
        </div>
      ))}
    </>
  );
}
