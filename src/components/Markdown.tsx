"use client";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";

export default function Markdown({ children }: { children: string }) {
    return (
        <div className="prose prose-zinc dark:prose-invert max-w-none">
            <ReactMarkdown
                // @ts-ignore - rehypeHighlight types are optional here
                rehypePlugins={[rehypeRaw, rehypeHighlight]}
                remarkPlugins={[remarkGfm]}
                components={{
                    code({ node, inline, className, children, ...props }: any) {
                        const text = String(children ?? "");
                        const match = /language-(\w+)/.exec(className || "");
                        const isInline = inline || !match;
                        const lang = match?.[1];

                        // Inline code → giữ nguyên, KHÔNG hiển thị nút Copy
                        if (isInline) {
                            return (
                                <code
                                    className="rounded bg-zinc-200/60 dark:bg-zinc-800/80 px-1 py-0.5"
                                    {...props}
                                >
                                    {children}
                                </code>
                            );
                        }

                        // Code block → hiển thị Copy rõ ràng, không bị prose ảnh hưởng
                        return (
                            <div className="not-prose relative my-3">
                <pre
                    className={`${className ?? ""} max-h-[60vh] overflow-auto rounded-lg`}
                    {...props}
                >
                  <code className={className}>{text}</code>
                </pre>

                                {/* nút Copy luôn hiện, to – rõ – nằm trên cùng */}
                                <CopyBtn value={text} />

                                {lang && (
                                    <span className="absolute right-20 top-2 text-[11px] opacity-60 select-none">
                    {lang}
                  </span>
                                )}
                            </div>
                        );
                    },

                    a({ href, children, ...rest }) {
                        return (
                            <a
                                href={href}
                                target="_blank"
                                rel="noreferrer"
                                className="underline decoration-dotted underline-offset-4"
                                {...rest}
                            >
                                {children}
                            </a>
                        );
                    },

                    table({ children }) {
                        return (
                            <div className="overflow-x-auto">
                                <table className="table-auto">{children}</table>
                            </div>
                        );
                    },
                }}
            >
                {children}
            </ReactMarkdown>
        </div>
    );
}

function CopyBtn({ value }: { value: string }) {
    const [ok, setOk] = React.useState(false);
    return (
        <button
            onClick={async () => {
                try {
                    await navigator.clipboard.writeText(value);
                    setOk(true);
                    setTimeout(() => setOk(false), 1200);
                } catch {}
            }}
            title="Copy code"
            className="absolute right-2 top-2 z-50 rounded-md px-3 py-1 text-xs font-semibold
                 bg-blue-600 text-white shadow-lg hover:bg-blue-700 active:scale-95 transition"
        >
            {ok ? "✓ Copied" : "Copy"}
        </button>
    );
}
