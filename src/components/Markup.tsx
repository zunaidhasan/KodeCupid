import type { ReactNode } from "react";

/** Minimal renderer for admin-editable content: `## Heading`, `- bullet`, `> callout`, blank line = new paragraph. */
export function Markup({ text }: { text: string }) {
  const out: ReactNode[] = [];
  let list: string[] = [];
  let para: string[] = [];
  const flushList = () => { if (list.length) { out.push(<ul key={`u${out.length}`} className="my-3 list-disc space-y-1.5 pl-6 text-ink-soft">{list.map((l, i) => <li key={i}>{l}</li>)}</ul>); list = []; } };
  const flushPara = () => { if (para.length) { out.push(<p key={`p${out.length}`} className="my-3 leading-relaxed text-ink-soft">{para.join(" ")}</p>); para = []; } };
  text.split("\n").forEach((raw) => {
    const line = raw.trim();
    if (!line) { flushList(); flushPara(); return; }
    if (line.startsWith("## ")) { flushList(); flushPara(); out.push(<h2 key={`h${out.length}`} className="mt-8 font-display text-xl font-semibold text-ink">{line.slice(3)}</h2>); }
    else if (line.startsWith("> ")) { flushList(); flushPara(); out.push(<p key={`c${out.length}`} role="note" className="my-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{line.slice(2)}</p>); }
    else if (line.startsWith("- ")) { flushPara(); list.push(line.slice(2)); }
    else { flushList(); para.push(line); }
  });
  flushList(); flushPara();
  return <div>{out}</div>;
}
