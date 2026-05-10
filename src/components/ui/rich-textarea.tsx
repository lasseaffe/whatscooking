"use client";

import { useRef, useCallback } from "react";

// ── cn util (no external dep) ─────────────────────────────────────
function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

// ── SVG icon set matching the screenshot toolbar ──────────────────
const Icons = {
  Bold: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" /><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
    </svg>
  ),
  Italic: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" />
    </svg>
  ),
  Underline: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M6 4v6a6 6 0 0 0 12 0V4" /><line x1="4" y1="20" x2="20" y2="20" />
    </svg>
  ),
  Strike: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="4" y1="12" x2="20" y2="12" />
      <path d="M17 6C17 6 15.5 4 12 4C8.5 4 7 6.5 7 8C7 11 10 12 12 12C14 12 17 13 17 16C17 18.5 15.5 20 12 20C8.5 20 7 18 7 18" />
    </svg>
  ),
  Link: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  Heading: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M4 12h16" /><path d="M4 4v16" /><path d="M20 4v16" />
    </svg>
  ),
  Quote: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
    </svg>
  ),
  AlignLeft: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="21" y1="6" x2="3" y2="6" /><line x1="15" y1="12" x2="3" y2="12" /><line x1="17" y1="18" x2="3" y2="18" />
    </svg>
  ),
  AlignCenter: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="21" y1="6" x2="3" y2="6" /><line x1="17" y1="12" x2="7" y2="12" /><line x1="19" y1="18" x2="5" y2="18" />
    </svg>
  ),
  AlignRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="12" x2="9" y2="12" /><line x1="21" y1="18" x2="7" y2="18" />
    </svg>
  ),
};

// ── Types ─────────────────────────────────────────────────────────
type FormatAction =
  | { type: "wrap"; before: string; after: string }
  | { type: "line-prefix"; prefix: string }
  | { type: "link" }
  | { type: "align"; align: "left" | "center" | "right" };

interface ToolbarItem {
  icon: React.ComponentType;
  title: string;
  action: FormatAction;
}

const TOOLS: (ToolbarItem | "sep")[] = [
  { icon: Icons.Bold,      title: "Bold",          action: { type: "wrap", before: "**", after: "**" } },
  { icon: Icons.Italic,    title: "Italic",        action: { type: "wrap", before: "_",  after: "_"  } },
  { icon: Icons.Underline, title: "Underline",     action: { type: "wrap", before: "<u>", after: "</u>" } },
  { icon: Icons.Strike,    title: "Strikethrough", action: { type: "wrap", before: "~~", after: "~~" } },
  "sep",
  { icon: Icons.Link,      title: "Link",          action: { type: "link" } },
  { icon: Icons.Heading,   title: "Heading",       action: { type: "line-prefix", prefix: "## " } },
  { icon: Icons.Quote,     title: "Quote",         action: { type: "line-prefix", prefix: "> " } },
  "sep",
  { icon: Icons.AlignLeft,   title: "Align left",   action: { type: "align", align: "left" } },
  { icon: Icons.AlignCenter, title: "Align center", action: { type: "align", align: "center" } },
  { icon: Icons.AlignRight,  title: "Align right",  action: { type: "align", align: "right" } },
];

// ── Format logic ──────────────────────────────────────────────────
function applyFormat(
  value: string,
  start: number,
  end: number,
  action: FormatAction
): { value: string; cursor: [number, number] } {
  const selected = value.slice(start, end);
  const before = value.slice(0, start);
  const after = value.slice(end);

  if (action.type === "wrap") {
    const { before: b, after: a } = action;
    if (selected.startsWith(b) && selected.endsWith(a)) {
      const inner = selected.slice(b.length, selected.length - a.length);
      return { value: before + inner + after, cursor: [start, start + inner.length] };
    }
    return { value: before + b + selected + a + after, cursor: [start + b.length, end + b.length] };
  }

  if (action.type === "line-prefix") {
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = value.indexOf("\n", end);
    const line = value.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
    if (line.startsWith(action.prefix)) {
      const newLine = line.slice(action.prefix.length);
      const result = value.slice(0, lineStart) + newLine + value.slice(lineStart + line.length);
      const delta = -action.prefix.length;
      return { value: result, cursor: [start + delta, end + delta] };
    }
    const result = value.slice(0, lineStart) + action.prefix + value.slice(lineStart);
    return { value: result, cursor: [start + action.prefix.length, end + action.prefix.length] };
  }

  if (action.type === "link") {
    const url = window.prompt("Enter URL:", "https://");
    if (!url) return { value, cursor: [start, end] };
    const text = selected || "link text";
    const md = `[${text}](${url})`;
    return { value: before + md + after, cursor: [start, start + md.length] };
  }

  if (action.type === "align") {
    if (action.align === "left") return { value, cursor: [start, end] };
    const wrapped = `<div style="text-align:${action.align}">${selected || "text"}</div>`;
    return { value: before + wrapped + after, cursor: [start, start + wrapped.length] };
  }

  return { value, cursor: [start, end] };
}

// ── Component ─────────────────────────────────────────────────────
interface RichTextareaProps extends Omit<React.ComponentProps<"textarea">, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  /** Override wrapper className */
  wrapperClassName?: string;
  /** Override toolbar className */
  toolbarClassName?: string;
  /** "light" = recipe-create page (cream bg), "dark" = comment/list (dark bg) */
  theme?: "light" | "dark";
}

export function RichTextarea({
  value,
  onChange,
  className,
  wrapperClassName,
  toolbarClassName,
  theme = "dark",
  ...props
}: RichTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const applyTool = useCallback(
    (action: FormatAction) => {
      const el = ref.current;
      if (!el) return;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const { value: newValue, cursor } = applyFormat(value, start, end, action);
      onChange(newValue);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(cursor[0], cursor[1]);
      });
    },
    [value, onChange]
  );

  const isLight = theme === "light";

  const toolbarStyle: React.CSSProperties = isLight
    ? { background: "#F5EDE0", borderColor: "#E8D4C0", borderBottom: "none" }
    : { background: "#120A04", borderColor: "#3A2416", borderBottom: "none" };

  const btnBase: React.CSSProperties = isLight
    ? { color: "#8A6A4A" }
    : { color: "#8A6A4A" };

  const textareaStyle: React.CSSProperties = isLight
    ? { borderColor: "#E8D4C0", background: "#FAF7F2", color: "#3D2817" }
    : { borderColor: "#3A2416", background: "transparent", color: "#EFE3CE" };

  return (
    <div className={cn("flex flex-col", wrapperClassName)}>
      {/* Toolbar */}
      <div
        className={cn(
          "flex items-center gap-0.5 px-2 py-1.5 rounded-t-xl border",
          toolbarClassName
        )}
        style={toolbarStyle}
      >
        {TOOLS.map((item, i) => {
          if (item === "sep") {
            return (
              <span
                key={`sep-${i}`}
                className="w-px h-4 mx-1 flex-shrink-0"
                style={{ background: isLight ? "#D4B896" : "#3A2416" }}
              />
            );
          }
          const Icon = item.icon;
          return (
            <button
              key={item.title}
              type="button"
              title={item.title}
              onMouseDown={(e) => {
                e.preventDefault();
                applyTool(item.action);
              }}
              className="w-7 h-7 flex items-center justify-center rounded transition-colors"
              style={btnBase}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = isLight
                  ? "rgba(176,125,86,0.15)"
                  : "rgba(176,125,86,0.12)";
                (e.currentTarget as HTMLButtonElement).style.color = "#C8913A";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = isLight ? "#8A6A4A" : "#8A6A4A";
              }}
            >
              <Icon />
            </button>
          );
        })}
      </div>

      {/* Textarea */}
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full rounded-b-xl rounded-t-none border px-3 py-2 text-sm resize-none",
          "focus:outline-none placeholder:opacity-40",
          className
        )}
        style={textareaStyle}
        {...props}
      />
    </div>
  );
}
