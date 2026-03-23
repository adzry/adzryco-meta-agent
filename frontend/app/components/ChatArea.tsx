"use client";
import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { ArrowUp, Square, Bot, Sparkles, Command, TrendingUp } from "lucide-react";
import { Message } from "./types";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

const ANALYTICS_DATA = [
  { day: "Mon", followers: 1240, impressions: 4200 },
  { day: "Tue", followers: 1255, impressions: 5800 },
  { day: "Wed", followers: 1248, impressions: 3900 },
  { day: "Thu", followers: 1270, impressions: 7200 },
  { day: "Fri", followers: 1285, impressions: 6100 },
  { day: "Sat", followers: 1301, impressions: 8900 },
  { day: "Sun", followers: 1318, impressions: 9400 },
];

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

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

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

      {/* Input */}
      <div style={{ padding: "0 24px 28px", background: "var(--bg)" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          {isStreaming && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, paddingLeft: 4 }}>
              <span className="dot" /><span className="dot" /><span className="dot" />
              <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 500 }}>Meta-Agent is thinking…</span>
            </div>
          )}
          <div style={{ background: "var(--bg-card)", border: `1.5px solid ${focused ? "var(--accent)" : "var(--border)"}`, borderRadius: 20, boxShadow: focused ? "0 0 0 4px rgba(10,10,11,0.06), var(--shadow-md)" : "var(--shadow-sm)", transition: "border-color 0.18s, box-shadow 0.18s", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, padding: "14px 14px 12px 20px" }}>
              <textarea
                ref={textareaRef} value={input}
                onChange={e => { onInputChange(e.target.value); autoResize(); }}
                onKeyDown={handleKey} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                placeholder="Ask Meta-Agent anything…" rows={1} disabled={isStreaming}
                style={{ flex: 1, resize: "none", border: "none", outline: "none", background: "transparent", fontFamily: "var(--font)", fontSize: 14.5, color: "var(--text-1)", lineHeight: 1.65, maxHeight: 180, overflowY: "auto", letterSpacing: "-0.01em", caretColor: "var(--accent)" }}
              />
              <button onClick={isStreaming ? onStop : onSubmit} disabled={!isStreaming && !canSubmit}
                style={{ width: 38, height: 38, borderRadius: 12, border: "none", flexShrink: 0, background: isStreaming ? "var(--red)" : canSubmit ? "var(--accent)" : "var(--bg-active)", cursor: (!isStreaming && !canSubmit) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.18s, transform 0.12s", transform: canSubmit || isStreaming ? "scale(1)" : "scale(0.92)", boxShadow: canSubmit || isStreaming ? "var(--shadow-sm)" : "none" }}>
                {isStreaming ? <Square size={13} fill="white" color="white" /> : <ArrowUp size={16} color={canSubmit ? "white" : "var(--text-3)"} strokeWidth={2.5} />}
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px 10px", borderTop: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-3)" }}>
                <Command size={10} />
                <span style={{ fontWeight: 500 }}>Enter to send · Shift+Enter for new line</span>
              </div>
              {input.length > 0 && (
                <div style={{ fontSize: 11, color: input.length > 240 ? "var(--amber)" : "var(--text-3)", fontFamily: "var(--mono)", fontWeight: 500 }}>{input.length}</div>
              )}
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

// ── Empty state with analytics chart ─────────────────────────────────────
function EmptyState() {
  const suggestions = [
    { text: "Search tweets about n8n automation", tag: "Search",    tagColor: "#2563EB", tagBg: "var(--blue-light)" },
    { text: "Draft a 5-tweet thread on AI agents", tag: "Thread",   tagColor: "#9333EA", tagBg: "#FAF5FF" },
    { text: "Get analytics for my account",        tag: "Analytics",tagColor: "#0891B2", tagBg: "#ECFEFF" },
    { text: "Find founders talking about automation", tag: "Leads", tagColor: "#16A34A", tagBg: "var(--green-light)" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 48 }}>
      {/* Hero */}
      <div className="animate-fadeUp" style={{ position: "relative", marginBottom: 28 }}>
        <div style={{ position: "absolute", inset: -14, borderRadius: "50%", border: "1px solid var(--border)", opacity: 0.5 }} />
        <div style={{ position: "absolute", inset: -28, borderRadius: "50%", border: "1px solid var(--border)", opacity: 0.25 }} />
        <div style={{ width: 72, height: 72, borderRadius: 22, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 40px rgba(0,0,0,.22)", position: "relative", zIndex: 1 }}>
          <Sparkles size={30} color="var(--bg)" />
        </div>
      </div>

      <div className="animate-fadeUp" style={{ animationDelay: "0.05s", textAlign: "center", marginBottom: 12 }}>
        <h1 style={{ fontSize: 34, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.045em", lineHeight: 1.08, marginBottom: 8 }}>AdzryCo Meta-Agent</h1>
        <p style={{ fontSize: 15, color: "var(--text-2)", maxWidth: 380, lineHeight: 1.65, margin: "0 auto", fontWeight: 400 }}>
          Your autonomous X/Twitter AI. Search, post, analyze — with human-in-the-loop approval.
        </p>
      </div>

      {/* Suggestion chips */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%", maxWidth: 560, marginTop: 28 }} className="animate-fadeUp" >
        {suggestions.map((s, i) => (
          <SuggestionChip key={i} text={s.text} tag={s.tag} tagColor={s.tagColor} tagBg={s.tagBg} delay={0.08 + i * 0.05} />
        ))}
      </div>

      {/* Analytics preview card */}
      <div className="animate-fadeUp" style={{ animationDelay: "0.32s", width: "100%", maxWidth: 560, marginTop: 24, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: "16px 20px", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <TrendingUp size={14} color="var(--blue)" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.02em" }}>Followers This Week</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--green)", background: "var(--green-light)", padding: "2px 8px", borderRadius: 99 }}>+78 ↑</span>
            <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 500 }}>demo</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={80}>
          <AreaChart data={ANALYTICS_DATA} margin={{ top: 2, right: 2, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="followersGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--text-3)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "var(--text-3)" }} axisLine={false} tickLine={false} domain={["dataMin - 20", "dataMax + 10"]} />
            <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, boxShadow: "var(--shadow-md)" }} itemStyle={{ color: "var(--text-1)" }} labelStyle={{ color: "var(--text-2)", fontWeight: 600 }} />
            <Area type="monotone" dataKey="followers" stroke="#2563EB" strokeWidth={2} fill="url(#followersGrad)" dot={false} activeDot={{ r: 4, fill: "#2563EB" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SuggestionChip({ text, tag, tagColor, tagBg, delay }: { text: string; tag: string; tagColor: string; tagBg: string; delay: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div className="animate-fadeUp" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ padding: "14px 16px", borderRadius: "var(--r-md)", border: `1.5px solid ${hovered ? "var(--border-strong)" : "var(--border)"}`, background: "var(--bg-card)", boxShadow: hovered ? "var(--shadow-md)" : "var(--shadow-xs)", cursor: "default", transition: "all 0.18s", animationDelay: `${delay}s`, transform: hovered ? "translateY(-2px)" : "translateY(0)" }}>
      <div style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", padding: "2px 8px", borderRadius: 99, background: tagBg, color: tagColor }}>{tag}</span>
      </div>
      <div style={{ fontSize: 13.5, color: "var(--text-2)", fontWeight: 500, lineHeight: 1.45 }}>{text}</div>
    </div>
  );
}

function MessageRow({ message, index }: { message: Message; index: number }) {
  const isUser = message.role === "user";
  return (
    <div className="animate-fadeUp" style={{ display: "flex", flexDirection: isUser ? "row-reverse" : "row", alignItems: "flex-start", gap: 12, animationDelay: `${Math.min(index * 0.04, 0.2)}s` }}>
      {!isUser && (
        <div style={{ width: 30, height: 30, borderRadius: 9, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, boxShadow: "var(--shadow-sm)" }}>
          <Bot size={14} color="var(--bg)" />
        </div>
      )}
      <div style={{ maxWidth: isUser ? "68%" : "86%", background: isUser ? "var(--user-bg)" : "var(--bg-card)", color: isUser ? "var(--user-text)" : message.isError ? "var(--red)" : "var(--text-1)", padding: isUser ? "11px 16px" : "14px 18px", borderRadius: isUser ? "18px 18px 5px 18px" : "5px 18px 18px 18px", fontSize: 14.5, lineHeight: 1.65, boxShadow: isUser ? "none" : "var(--shadow-sm)", border: isUser ? "none" : "1px solid var(--border)", fontWeight: isUser ? 500 : 400, letterSpacing: isUser ? "-0.01em" : "0" }}>
        {message.isThinking
          ? <div style={{ display: "flex", gap: 4, padding: "3px 0" }}><span className="dot" /><span className="dot" /><span className="dot" /></div>
          : <div className="msg-prose" dangerouslySetInnerHTML={{ __html: fmt(message.content) }} />
        }
      </div>
    </div>
  );
}

function fmt(t: string) {
  return t.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>").replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\n/g, "<br/>");
}
