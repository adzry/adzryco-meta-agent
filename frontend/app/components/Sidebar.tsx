"use client";
import { PenSquare, MessageSquare, Zap, ChevronLeft, ChevronRight } from "lucide-react";
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
  if (!open) return (
    <div style={{ width: 56, background: "var(--bg)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0", gap: 12, flexShrink: 0 }}>
      <button onClick={onToggle} style={iconBtn}><ChevronRight size={18} /></button>
      <button onClick={onNewChat} style={iconBtn}><PenSquare size={18} /></button>
    </div>
  );

  return (
    <div style={{ width: 260, background: "var(--bg)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "16px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, background: "var(--user-bubble)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>X</span>
          </div>
          <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Meta-Agent</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={onNewChat} style={iconBtn} title="New chat"><PenSquare size={16} /></button>
          <button onClick={onToggle} style={iconBtn}><ChevronLeft size={16} /></button>
        </div>
      </div>

      {/* Quick Prompts */}
      <div style={{ padding: "12px 12px 8px" }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, paddingLeft: 4 }}>Quick Actions</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {PROMPT_TEMPLATES.map((t) => (
            <button key={t.label} onClick={() => onPromptSelect(t.prompt)} style={promptBtn}>
              <Zap size={12} style={{ color: "var(--accent)", flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "var(--text-secondary)", truncate: true, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat History */}
      <div style={{ flex: 1, overflow: "auto", padding: "0 12px 12px" }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, paddingLeft: 4 }}>Recent</div>
        {conversations.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--text-tertiary)", padding: "8px 4px" }}>No conversations yet</div>
        ) : (
          conversations.map((c) => (
            <button key={c.id} onClick={() => onSelectChat(c.id)} style={chatItemBtn}>
              <MessageSquare size={13} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{c.title}</div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}</div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border-subtle)", fontSize: 11, color: "var(--text-tertiary)" }}>
        @AdzryCo · Meta-Agent v2
      </div>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 8,
  color: "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "center",
  transition: "background 0.15s",
};

const promptBtn: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer", padding: "6px 8px",
  borderRadius: 8, display: "flex", alignItems: "center", gap: 8, width: "100%",
  textAlign: "left", transition: "background 0.15s",
};

const chatItemBtn: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer", padding: "7px 8px",
  borderRadius: 8, display: "flex", alignItems: "flex-start", gap: 8, width: "100%",
  textAlign: "left", transition: "background 0.15s", marginBottom: 2,
};
