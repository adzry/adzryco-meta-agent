"use client";
import { useEffect, useRef, KeyboardEvent } from "react";
import { Send, Square, Bot } from "lucide-react";
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

export default function ChatArea({ messages, input, isStreaming, onInputChange, onSubmit, onStop, sidebarOpen }: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit(); }
  };

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg)" }}>
      {/* Messages */}
      <div style={{ flex: 1, overflow: "auto", padding: "32px 0" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px", display: "flex", flexDirection: "column", gap: 24 }}>
          {messages.length === 0 && <EmptyState />}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{ padding: "16px 24px 24px", borderTop: "1px solid var(--border-subtle)", background: "var(--bg)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{
            display: "flex", alignItems: "flex-end", gap: 10,
            background: "var(--bg-secondary)", borderRadius: 18,
            padding: "10px 10px 10px 18px", border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)", transition: "box-shadow 0.2s",
          }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => { onInputChange(e.target.value); autoResize(); }}
              onKeyDown={handleKeyDown}
              placeholder="Message Meta-Agent..."
              rows={1}
              style={{
                flex: 1, background: "none", border: "none", outline: "none", resize: "none",
                fontFamily: "var(--font-sans)", fontSize: 15, color: "var(--text-primary)",
                lineHeight: 1.5, maxHeight: 160, overflowY: "auto",
              }}
            />
            <button
              onClick={isStreaming ? onStop : onSubmit}
              disabled={!isStreaming && !input.trim()}
              style={{
                width: 36, height: 36, borderRadius: 12, border: "none", cursor: "pointer",
                background: isStreaming ? "var(--danger)" : (input.trim() ? "var(--user-bubble)" : "var(--border)"),
                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.2s, transform 0.1s", flexShrink: 0,
                transform: "scale(1)",
              }}
            >
              {isStreaming ? <Square size={15} fill="white" /> : <Send size={15} />}
            </button>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-tertiary)", textAlign: "center", marginTop: 8 }}>
            Meta-Agent can make mistakes. Review before approving write actions.
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 16 }}>
      <div style={{ width: 56, height: 56, background: "var(--user-bubble)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Bot size={28} color="white" />
      </div>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.03em", margin: "0 0 6px" }}>AdzryCo Meta-Agent</h1>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: 0 }}>Your autonomous X/Twitter AI. Ask anything.</p>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}>
        {["Search n8n automation tweets", "Draft a thread about AI agents", "Get analytics for my account"].map((s) => (
          <div key={s} style={{ padding: "8px 14px", background: "var(--bg-secondary)", borderRadius: 99, fontSize: 13, color: "var(--text-secondary)", border: "1px solid var(--border)", cursor: "default" }}>{s}</div>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className="fade-in" style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", alignItems: "flex-start", gap: 10 }}>
      {!isUser && (
        <div style={{ width: 30, height: 30, background: "var(--user-bubble)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
          <Bot size={15} color="white" />
        </div>
      )}
      <div style={{
        maxWidth: isUser ? "72%" : "85%",
        background: isUser ? "var(--user-bubble)" : "transparent",
        color: isUser ? "var(--user-bubble-text)" : (message.isError ? "var(--danger)" : "var(--text-primary)"),
        padding: isUser ? "10px 16px" : "4px 0",
        borderRadius: isUser ? "18px 18px 6px 18px" : 0,
        fontSize: 15, lineHeight: 1.6,
      }}>
        {message.isThinking ? <ThinkingIndicator /> : (
          <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }} />
        )}
      </div>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 0" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} className="thinking-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--text-tertiary)" }} />
      ))}
    </div>
  );
}

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br/>");
}
