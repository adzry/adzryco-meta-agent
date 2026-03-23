"use client";
import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { ArrowUp, Square, Bot, Sparkles, Command } from "lucide-react";
import { Message } from "./types";

interface ChatAreaProps {
  messages: Message[];
  input: string;
  isStreaming: boolean;
  onInputChange: (v: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  sidebarOpen: boolean;
}

export default function ChatArea({ messages, input, isStreaming, onInputChange, onSubmit, onStop }: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit(); }
  };

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  };

  const canSubmit = input.trim().length > 0 && !isStreaming;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg)", minWidth: 0 }}>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "48px 0 32px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 24px" }}>
          {messages.length === 0 ? <EmptyState /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {messages.map((m, i) => <MessageRow key={m.id} message={m} index={i} />)}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>

      {/* Premium input bar */}
      <div style={{ padding: "0 24px 28px", background: "var(--bg)" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>

          {/* Streaming status */}
          {isStreaming && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, paddingLeft: 4 }}>
              <span className="dot" /><span className="dot" /><span className="dot" />
              <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 500 }}>Meta-Agent is thinking…</span>
            </div>
          )}

          {/* Input container */}
          <div style={{
            background: "var(--bg-card)",
            border: `1.5px solid ${focused ? "var(--accent)" : "var(--border)"}`,
            borderRadius: 20,
            boxShadow: focused ? "0 0 0 4px rgba(10,10,11,0.06), var(--shadow-md)" : "var(--shadow-sm)",
            transition: "border-color 0.18s, box-shadow 0.18s",
            overflow: "hidden",
          }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, padding: "14px 14px 12px 20px" }}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => { onInputChange(e.target.value); autoResize(); }}
                onKeyDown={handleKey}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Ask Meta-Agent anything…"
                rows={1}
                disabled={isStreaming}
                style={{
                  flex: 1, resize: "none", border: "none", outline: "none",
                  background: "transparent", fontFamily: "var(--font)",
                  fontSize: 14.5, color: "var(--text-1)", lineHeight: 1.65,
                  maxHeight: 180, overflowY: "auto", letterSpacing: "-0.01em",
                  caretColor: "var(--accent)",
                }}
              />
              <button
                onClick={isStreaming ? onStop : onSubmit}
                disabled={!isStreaming && !canSubmit}
                style={{
                  width: 38, height: 38, borderRadius: 12, border: "none", flexShrink: 0,
                  background: isStreaming ? "var(--red)" : canSubmit ? "var(--accent)" : "var(--bg-active)",
                  cursor: (!isStreaming && !canSubmit) ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.18s, transform 0.12s",
                  transform: canSubmit || isStreaming ? "scale(1)" : "scale(0.92)",
                  boxShadow: canSubmit || isStreaming ? "var(--shadow-sm)" : "none",
                }}
              >
                {isStreaming
                  ? <Square size={13} fill="white" color="white" />
                  : <ArrowUp size={16} color={canSubmit ? "white" : "var(--text-3)"} strokeWidth={2.5} />
                }
              </button>
            </div>

            {/* Bottom toolbar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px 10px", borderTop: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-3)" }}>
                <Command size={10} />
                <span style={{ fontWeight: 500 }}>Enter to send · Shift+Enter for new line</span>
              </div>
              <div style={{ fontSize: 11, color: input.length > 240 ? "var(--amber)" : "var(--text-3)", fontFamily: "var(--mono)", fontWeight: 500 }}>
                {input.length > 0 ? `${input.length}` : ""}
              </div>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: "var(--text-3)" }}>
            All write actions require your approval before executing
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────
function EmptyState() {
  const suggestions = [
    { text: "Search tweets about n8n automation", tag: "Search" },
    { text: "Draft a 5-tweet thread on AI agents", tag: "Thread" },
    { text: "Get analytics for my account",        tag: "Analytics" },
    { text: "Find founders talking about automation", tag: "Leads" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 56 }}>

      {/* Hero icon with rings */}
      <div style={{ position: "relative", marginBottom: 28 }} className="animate-fadeUp">
        <div style={{ position: "absolute", inset: -14, borderRadius: "50%", border: "1px solid var(--border)", opacity: 0.6 }} />
        <div style={{ position: "absolute", inset: -28, borderRadius: "50%", border: "1px solid var(--border)", opacity: 0.3 }} />
        <div style={{ width: 72, height: 72, borderRadius: 22, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 40px rgba(0,0,0,0.22), 0 4px 12px rgba(0,0,0,0.12)", position: "relative", zIndex: 1 }}>
          <Sparkles size={30} color="white" />
        </div>
      </div>

      {/* Heading */}
      <div className="animate-fadeUp" style={{ animationDelay: "0.05s", textAlign: "center", marginBottom: 12 }}>
        <h1 style={{ fontSize: 34, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.045em", lineHeight: 1.08, marginBottom: 8 }}>
          AdzryCo Meta-Agent
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-2)", maxWidth: 380, lineHeight: 1.65, margin: "0 auto", fontWeight: 400 }}>
          Your autonomous X/Twitter AI. Search, post, analyze — all with human-in-the-loop approval.
        </p>
      </div>

      {/* Suggestion grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%", maxWidth: 560, marginTop: 28 }}>
        {suggestions.map((s, i) => (
          <SuggestionChip key={i} text={s.text} tag={s.tag} delay={0.08 + i * 0.05} />
        ))}
      </div>
    </div>
  );
}

function SuggestionChip({ text, tag, delay }: { text: string; tag: string; delay: number }) {
  const [hovered, setHovered] = useState(false);
  const tagColors: Record<string, { bg: string; color: string }> = {
    Search:    { bg: "#EFF6FF", color: "#2563EB" },
    Thread:    { bg: "#FAF5FF", color: "#9333EA" },
    Analytics: { bg: "#ECFEFF", color: "#0891B2" },
    Leads:     { bg: "#F0FDF4", color: "#16A34A" },
  };
  const colors = tagColors[tag] || { bg: "var(--bg-active)", color: "var(--text-2)" };

  return (
    <div
      className="animate-fadeUp"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "14px 16px",
        borderRadius: "var(--r-md)",
        border: `1.5px solid ${hovered ? "var(--border-strong)" : "var(--border)"}`,
        background: hovered ? "var(--bg-card)" : "var(--bg-card)",
        boxShadow: hovered ? "var(--shadow-md)" : "var(--shadow-xs)",
        cursor: "default",
        transition: "all 0.18s",
        animationDelay: `${delay}s`,
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      <div style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", padding: "2px 8px", borderRadius: 99, background: colors.bg, color: colors.color }}>{tag}</span>
      </div>
      <div style={{ fontSize: 13.5, color: "var(--text-2)", fontWeight: 500, lineHeight: 1.45 }}>{text}</div>
    </div>
  );
}

// ── Message row ───────────────────────────────────────────────────────────
function MessageRow({ message, index }: { message: Message; index: number }) {
  const isUser = message.role === "user";
  return (
    <div
      className="animate-fadeUp"
      style={{ display: "flex", flexDirection: isUser ? "row-reverse" : "row", alignItems: "flex-start", gap: 12, animationDelay: `${Math.min(index * 0.04, 0.2)}s` }}
    >
      {!isUser && (
        <div style={{ width: 30, height: 30, borderRadius: 9, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, boxShadow: "var(--shadow-sm)" }}>
          <Bot size={14} color="white" />
        </div>
      )}
      <div style={{
        maxWidth: isUser ? "68%" : "86%",
        background: isUser ? "var(--user-bg)" : "var(--bg-card)",
        color: isUser ? "var(--user-text)" : message.isError ? "var(--red)" : "var(--text-1)",
        padding: isUser ? "11px 16px" : "14px 18px",
        borderRadius: isUser ? "18px 18px 5px 18px" : "5px 18px 18px 18px",
        fontSize: 14.5, lineHeight: 1.65,
        boxShadow: isUser ? "none" : "var(--shadow-sm)",
        border: isUser ? "none" : "1px solid var(--border)",
        fontWeight: isUser ? 500 : 400,
        letterSpacing: isUser ? "-0.01em" : "0",
      }}>
        {message.isThinking
          ? <div style={{ display: "flex", gap: 4, padding: "3px 0" }}><span className="dot" /><span className="dot" /><span className="dot" /></div>
          : <div className="msg-prose" dangerouslySetInnerHTML={{ __html: fmt(message.content) }} />
        }
      </div>
    </div>
  );
}

function fmt(t: string) {
  return t
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br/>");
}
