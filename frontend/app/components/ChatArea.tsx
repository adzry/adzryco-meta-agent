"use client";
import { useEffect, useRef, KeyboardEvent } from "react";
import { ArrowUp, Square, Bot, Sparkles } from "lucide-react";
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
      {/* ── Messages ──────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "40px 0 24px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 20px" }}>
          {messages.length === 0 ? <EmptyState /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {messages.map((m, i) => <MessageRow key={m.id} message={m} index={i} />)}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>

      {/* ── Input bar ─────────────────────────────── */}
      <div style={{ padding: "12px 20px 20px", background: "var(--bg)" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={inputWrap}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => { onInputChange(e.target.value); autoResize(); }}
              onKeyDown={handleKey}
              placeholder="Ask Meta-Agent anything…"
              rows={1}
              style={textareaStyle}
              aria-label="Message input"
              disabled={isStreaming}
            />
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
              {isStreaming && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 8px" }}>
                  <span className="dot" /><span className="dot" /><span className="dot" />
                </div>
              )}
              <button
                onClick={isStreaming ? onStop : onSubmit}
                disabled={!isStreaming && !canSubmit}
                style={{
                  ...sendBtn,
                  background: isStreaming ? "var(--red)" : canSubmit ? "var(--accent)" : "var(--border)",
                  cursor: (!isStreaming && !canSubmit) ? "not-allowed" : "pointer",
                }}
                aria-label={isStreaming ? "Stop generation" : "Send message"}
              >
                {isStreaming ? <Square size={14} fill="white" color="white" /> : <ArrowUp size={16} color="white" strokeWidth={2.5} />}
              </button>
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: "var(--text-3)", letterSpacing: "0.01em" }}>
            Review all write actions before confirming · Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────
function EmptyState() {
  const suggestions = [
    "Search tweets about n8n automation",
    "Draft a 5-tweet thread on AI agents",
    "Get analytics for my account",
    "Find leads: founders talking about automation",
  ];
  return (
    <div className="animate-fadeUp" style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 60, gap: 0 }}>
      {/* Icon */}
      <div style={{ width: 64, height: 64, borderRadius: 20, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, boxShadow: "0 8px 32px rgba(0,0,0,.18)" }}>
        <Sparkles size={28} color="white" />
      </div>

      {/* Heading */}
      <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.04em", textAlign: "center", lineHeight: 1.1, marginBottom: 10 }}>
        AdzryCo Meta-Agent
      </h1>
      <p style={{ fontSize: 15, color: "var(--text-2)", textAlign: "center", maxWidth: 400, lineHeight: 1.6, marginBottom: 36, fontWeight: 400 }}>
        Your autonomous X/Twitter AI. Search, post, analyze — all with human-in-the-loop approval.
      </p>

      {/* Suggestion chips */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%", maxWidth: 520 }}>
        {suggestions.map((s, i) => (
          <div key={i} style={suggestionChip} className="animate-fadeUp" style={{ ...suggestionChip, animationDelay: `${i * 0.06}s`, opacity: 0 }}>
            <span style={{ fontSize: 13.5, color: "var(--text-2)", fontWeight: 500, lineHeight: 1.4 }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Message row ─────────────────────────────────────────────────────────
function MessageRow({ message, index }: { message: Message; index: number }) {
  const isUser = message.role === "user";
  return (
    <div
      className="animate-fadeUp"
      style={{ display: "flex", flexDirection: isUser ? "row-reverse" : "row", alignItems: "flex-start", gap: 12, animationDelay: `${Math.min(index * 0.03, 0.15)}s`, opacity: 0 }}
    >
      {!isUser && (
        <div style={agentAvatar} aria-hidden="true">
          <Bot size={15} color="white" />
        </div>
      )}
      <div style={{
        maxWidth: isUser ? "70%" : "88%",
        background: isUser ? "var(--user-bg)" : "var(--bg-card)",
        color: isUser ? "var(--user-text)" : message.isError ? "var(--red)" : "var(--text-1)",
        padding: isUser ? "11px 16px" : "14px 18px",
        borderRadius: isUser ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
        fontSize: 14.5,
        lineHeight: 1.65,
        boxShadow: isUser ? "none" : "var(--shadow-sm)",
        border: isUser ? "none" : `1px solid var(--border)`,
        letterSpacing: isUser ? "-0.01em" : "0",
        fontWeight: isUser ? 500 : 400,
      }}>
        {message.isThinking ? (
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "2px 0" }} aria-label="Agent is thinking">
            <span className="dot" /><span className="dot" /><span className="dot" />
          </div>
        ) : (
          <div className="msg-prose" dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }} />
        )}
      </div>
    </div>
  );
}

function formatMessage(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br/>");
}

// ─── Styles ───────────────────────────────────────────────────────────────
const inputWrap: React.CSSProperties = {
  display: "flex", alignItems: "flex-end", gap: 10,
  background: "var(--bg-card)", border: "1.5px solid var(--border-strong)",
  borderRadius: 18, padding: "12px 12px 12px 20px",
  boxShadow: "var(--shadow-md)", transition: "border-color 0.15s, box-shadow 0.15s",
};
const textareaStyle: React.CSSProperties = {
  flex: 1, resize: "none", border: "none", outline: "none",
  background: "transparent", fontFamily: "var(--font)", fontSize: 14.5,
  color: "var(--text-1)", lineHeight: 1.6, maxHeight: 180, overflowY: "auto",
  letterSpacing: "-0.01em",
};
const sendBtn: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 12, border: "none",
  display: "flex", alignItems: "center", justifyContent: "center",
  transition: "background 0.18s, transform 0.1s", flexShrink: 0,
};
const agentAvatar: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 10, background: "var(--accent)",
  display: "flex", alignItems: "center", justifyContent: "center",
  flexShrink: 0, marginTop: 2, boxShadow: "var(--shadow-sm)",
};
const suggestionChip: React.CSSProperties = {
  padding: "12px 16px", borderRadius: "var(--r-md)", border: "1.5px solid var(--border)",
  background: "var(--bg-card)", cursor: "default", boxShadow: "var(--shadow-sm)",
};
