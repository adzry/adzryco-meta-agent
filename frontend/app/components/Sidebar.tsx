"use client";
import { useState } from "react";
import { PenLine, Zap, MessageSquare, ChevronLeft, ChevronRight, BarChart2, X, Hash } from "lucide-react";
import { ConversationMeta, PROMPT_TEMPLATES } from "./types";
import { formatDistanceToNow } from "date-fns";

interface SidebarProps {
  open: boolean;
  conversations: ConversationMeta[];
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onToggle: () => void;
  onPromptSelect: (prompt: string) => void;
}

export default function Sidebar({ open, conversations, onNewChat, onSelectChat, onToggle, onPromptSelect }: SidebarProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  if (!open) return (
    <div style={collapsedWrap}>
      <button onClick={onToggle} style={iconCircle} title="Expand sidebar" aria-label="Expand sidebar">
        <ChevronRight size={15} />
      </button>
      <div style={{ width: 1, height: 24, background: "var(--border)", margin: "4px auto" }} />
      <button onClick={onNewChat} style={iconCircle} title="New chat" aria-label="New chat">
        <PenLine size={15} />
      </button>
    </div>
  );

  return (
    <aside style={sidebarWrap} role="complementary" aria-label="Sidebar">
      {/* ── Brand header ─────────────────────────── */}
      <div style={headerWrap}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={logoBox}>
            <X size={14} color="#fff" strokeWidth={3} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.03em", lineHeight: 1 }}>Meta-Agent</div>
            <div style={{ fontSize: 10.5, color: "var(--text-3)", fontWeight: 500, letterSpacing: "0.02em", marginTop: 2 }}>@AdzryCo · v2</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={onNewChat} style={iconCircle} title="New chat" aria-label="New chat"><PenLine size={14} /></button>
          <button onClick={onToggle} style={iconCircle} title="Collapse" aria-label="Collapse sidebar"><ChevronLeft size={14} /></button>
        </div>
      </div>

      {/* ── New chat CTA ──────────────────────────── */}
      <div style={{ padding: "12px 14px 0" }}>
        <button onClick={onNewChat} style={newChatBtn} aria-label="Start new conversation">
          <PenLine size={14} />
          <span>New conversation</span>
        </button>
      </div>

      {/* ── Quick actions ─────────────────────────── */}
      <section style={{ padding: "18px 14px 8px" }}>
        <div style={sectionLabel}><Zap size={10} /> Quick Actions</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 6 }}>
          {PROMPT_TEMPLATES.map((t, i) => (
            <button
              key={i}
              onClick={() => onPromptSelect(t.prompt)}
              style={quickBtn}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              aria-label={`Quick action: ${t.label}`}
            >
              <span style={{ width: 20, height: 20, borderRadius: 6, background: "var(--bg-active)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Hash size={10} color="var(--text-3)" />
              </span>
              <span style={{ fontSize: 12.5, color: "var(--text-2)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", fontWeight: 500 }}>{t.label}</span>
            </button>
          ))}
        </div>
      </section>

      <div style={{ height: 1, background: "var(--border)", margin: "8px 14px" }} />

      {/* ── Chat history ──────────────────────────── */}
      <section style={{ flex: 1, overflow: "auto", padding: "0 14px" }}>
        <div style={sectionLabel}><MessageSquare size={10} /> Recent Chats</div>
        <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 2 }}>
          {conversations.length === 0 ? (
            <div style={{ padding: "20px 0", textAlign: "center" }}>
              <MessageSquare size={22} color="var(--border-strong)" style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 500 }}>No chats yet</div>
            </div>
          ) : conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => { setActiveId(c.id); onSelectChat(c.id); }}
              style={{ ...chatItemBtn, background: activeId === c.id ? "var(--bg-active)" : "transparent" }}
              onMouseEnter={e => { if (activeId !== c.id) e.currentTarget.style.background = "var(--bg-hover)"; }}
              onMouseLeave={e => { if (activeId !== c.id) e.currentTarget.style.background = "transparent"; }}
              aria-label={`Open chat: ${c.title}`}
              aria-current={activeId === c.id ? "page" : undefined}
            >
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: activeId === c.id ? "var(--blue)" : "var(--border-strong)", flexShrink: 0, marginTop: 6 }} />
              <div style={{ flex: 1, overflow: "hidden", textAlign: "left" }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</div>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Footer ────────────────────────────────── */}
      <div style={{ padding: "12px 14px", borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--bg-active)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <BarChart2 size={13} color="var(--text-2)" />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)" }}>Analytics</div>
            <div style={{ fontSize: 10.5, color: "var(--text-3)" }}>Coming soon</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────
const sidebarWrap: React.CSSProperties = {
  width: 252, background: "var(--bg-card)", borderRight: "1px solid var(--border)",
  display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden",
  transition: "width 0.25s cubic-bezier(.16,1,.3,1)",
};
const collapsedWrap: React.CSSProperties = {
  width: 52, background: "var(--bg-card)", borderRight: "1px solid var(--border)",
  display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0", gap: 8, flexShrink: 0,
};
const headerWrap: React.CSSProperties = {
  padding: "16px 14px 12px", display: "flex", alignItems: "center",
  justifyContent: "space-between", borderBottom: "1px solid var(--border)",
};
const logoBox: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 9, background: "var(--accent)",
  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
};
const iconCircle: React.CSSProperties = {
  width: 30, height: 30, borderRadius: 8, border: "none", background: "transparent",
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  color: "var(--text-2)", transition: "background 0.15s",
};
const newChatBtn: React.CSSProperties = {
  width: "100%", padding: "9px 14px", borderRadius: "var(--r-md)", border: "1.5px solid var(--border)",
  background: "var(--bg-card)", cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
  fontSize: 13, fontWeight: 600, color: "var(--text-1)", fontFamily: "var(--font)",
  transition: "all 0.15s", letterSpacing: "-0.01em",
};
const sectionLabel: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.08em",
  textTransform: "uppercase", display: "flex", alignItems: "center", gap: 5,
};
const quickBtn: React.CSSProperties = {
  width: "100%", padding: "7px 8px", borderRadius: "var(--r-sm)", border: "none",
  background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
  transition: "background 0.12s", fontFamily: "var(--font)",
};
const chatItemBtn: React.CSSProperties = {
  width: "100%", padding: "8px 10px", borderRadius: "var(--r-sm)", border: "none",
  cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 10,
  transition: "background 0.12s", fontFamily: "var(--font)",
};
