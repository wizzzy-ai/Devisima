"use client";

import ReactMarkdown, { defaultUrlTransform, type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const markdownComponents: Components = {
  h1: ({ children }) => <h1 className="mb-3 mt-5 text-xl font-bold leading-tight tracking-tight text-[#142f35] first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 mt-5 text-lg font-bold leading-snug text-[#142f35] first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 mt-4 text-base font-bold leading-snug text-[#142f35] first:mt-0">{children}</h3>,
  h4: ({ children }) => <h4 className="mb-2 mt-4 text-sm font-bold text-[#142f35] first:mt-0">{children}</h4>,
  p: ({ children }) => <p className="my-3 break-words text-[14px] leading-7 text-[#293a3c] [overflow-wrap:anywhere] first:mt-0 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-bold text-[#142f35]">{children}</strong>,
  em: ({ children }) => <em className="text-[#293a3c]">{children}</em>,
  ul: ({ children }) => <ul className="my-3 list-disc space-y-1.5 pl-5 text-[14px] leading-7 text-[#293a3c] marker:text-[#0F4C5C] first:mt-0 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 list-decimal space-y-1.5 pl-5 text-[14px] leading-7 text-[#293a3c] marker:font-semibold marker:text-[#0F4C5C] first:mt-0 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="break-words [overflow-wrap:anywhere]">{children}</li>,
  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="break-all font-medium text-[#0F4C5C] underline decoration-[#35D0BA] underline-offset-2 hover:text-[#176276]">{children}</a>,
  blockquote: ({ children }) => <blockquote className="my-4 border-l-2 border-[#35D0BA] pl-4 text-[#526468] [&>p]:my-1">{children}</blockquote>,
  pre: ({ children }) => <pre className="my-4 max-w-full overflow-x-auto rounded-xl bg-[#122a31] px-4 py-3 text-xs leading-6 text-[#eaf7f4] [tab-size:2]">{children}</pre>,
  code: ({ className, children }) => <code className={className ? "font-mono" : "break-all rounded bg-[#e7f2ef] px-1.5 py-0.5 font-mono text-[0.9em] text-[#17343a]"}>{children}</code>,
  table: ({ children }) => <div className="my-4 max-w-full overflow-x-auto rounded-xl border border-[#dce8e3] bg-white/70"><table className="w-full min-w-[380px] border-collapse text-left text-xs leading-5 text-[#293a3c]">{children}</table></div>,
  thead: ({ children }) => <thead className="bg-[#edf6f2] text-[#17343a]">{children}</thead>,
  th: ({ children }) => <th className="whitespace-nowrap border-b border-[#dce8e3] px-3 py-2.5 font-semibold">{children}</th>,
  td: ({ children }) => <td className="max-w-[18rem] border-b border-[#e8efeb] px-3 py-2.5 align-top [overflow-wrap:anywhere]">{children}</td>,
  hr: () => <hr className="my-5 border-0 border-t border-[#dce8e3]" />,
  del: ({ children }) => <del className="text-[#71807b]">{children}</del>,
  input: ({ checked }) => <input type="checkbox" checked={checked} disabled readOnly className="mr-2 align-middle accent-[#0F4C5C]" />,
};

export function AssistantMarkdown({ content, isStreaming = false }: { content: string; isStreaming?: boolean }) {
  const lastLine = content.trimEnd().split("\n").pop() ?? "";
  const cursorInParagraph = isStreaming && !/^(?:#{1,6}\s|[-*+]\s|\d+[.)]\s|>|```|~~~|\|)/.test(lastLine);
  const components: Components = cursorInParagraph
    ? {
      ...markdownComponents,
      p: ({ children }) => (
        <p className="my-3 break-words text-[14px] leading-7 text-[#293a3c] [overflow-wrap:anywhere] first:mt-0 last:mb-0">
          {children}<span className="assistant-stream-cursor" aria-hidden="true" />
        </p>
      ),
    }
    : markdownComponents;

  return (
    <div className="min-w-0 max-w-full">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        urlTransform={defaultUrlTransform}
        components={components}
      >
        {content}
      </ReactMarkdown>
      {isStreaming && !cursorInParagraph && <span className="assistant-stream-cursor" aria-hidden="true" />}
    </div>
  );
}
