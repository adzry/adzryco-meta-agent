"use client";
import { useState } from "react";
import { useTheme } from "next-themes";
import { PenLine, MessageSquare, ChevronLeft, ChevronRight, BarChart2, X, Search, Zap, FileText, BarChart, Users, Radio, Sun, Moon } from "lucide-react";
import { ConversationMeta, PROMPT_TEMPLATES } from "./types";
import { formatDistanceToNow } from "date-fns";

interface SidebarProps {
  open: boolean;
  mobileOpen: boolean;
  conversations: ConversationMeta[];
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onToggle: () => void;
  onMobileClose: () => void;
  onPromptSelect: (prompt: string) => void;
}

const ACTION_ICONS = [
  { icon: Search,   color: "#2563EB", bg: "#EFF6FF", darkBg: "#1E3A5F" },
  { icon: Users,    color: "#16A34A", bg: "#F0FDF4", darkBg: "#14301A" },
  { icon: FileText, color: "#9333EA", bg: "#FAF5FF", darkBg: "#2D1B4E" },
  { icon: Radio,    color: "#D97706", bg: "#FFFBEB", darkBg: "#3B2A0A" },
  { icon: BarChart, color: "#0891B2", bg: "#ECFEFF", darkBg: "#0C2E38" },
  { icon: Zap,      color: "#DC2626", bg: "#FEF2F2", darkBg: "#3B1515" },
];

export default function Sidebar({ open, mobileOpen, conversations, onNewChat, onSelectChat, onToggle, onMobileClose, onPromptSelect }: SidebarProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoveredPrompt, setHoveredPrompt] = useState<number | null>(null);
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const sidebarStyle: React.CSSProperties = {
    width: "var(--sidebar-w)",
    background: "var(--bg-card)",
    borderRight: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    overflow: "hidden",
    transition: "transform 0.25s cubic-bezier(.16,1,.3,1)",
  };

  // Collapsed (desktop)
  if (!open && !mobileOpen) return (
    <div style={{ width: 52, background: "var(--bg-card)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 0", gap: 10, flexShrink: 0 }}>
      <button onClick={onToggle} style={iconBtn}><ChevronRight size={15} /></button>
      <div style={{ width: 28, height: 1, background: "var(--border)" }} />
      <button onClick={onNewChat} style={iconBtn}><PenLine size={15} /></button>
      <button onClick={() => setTheme(isDark ? "light" : "dark")} style={iconBtn} title="Toggle theme">
        {isDark ? <Sun size={14} /> : <Moon size={14} />}
      </button>
    </div>
  );

  return (
    <aside style={sidebarStyle} className="animate-slideIn">
      {/* Header + Avatar */}
      <div style={{ padding: "14px 14px 12px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={13} color={isDark ? "#0C0C0E" : "#fff"} strokeWidth={3} />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.03em", lineHeight: 1.1 }}>Meta-Agent</div>
              <div style={{ fontSize: 9.5, color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginTop: 1 }}>v2 · Autonomous</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 3 }}>
            <button onClick={() => setTheme(isDark ? "light" : "dark")} style={iconBtn} title="Toggle theme">
              {isDark ? <Sun size={13} /> : <Moon size={13} />}
            </button>
            <button onClick={onNewChat} style={iconBtn}><PenLine size={13} /></button>
            <button onClick={onToggle} style={iconBtn}><ChevronLeft size={13} /></button>
          </div>
        </div>

        {/* User profile */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: "var(--r-sm)", background: "var(--bg-hover)", border: "1px solid var(--border)" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #0A0A0B 0%, #3F3F46 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "var(--shadow-xs)" }}>
            <span style={{ color: "#fff", fontSize: 13, fontWeight: 800 }}>A</span>
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.02em" }}>AdzryCo</div>
            <div style={{ fontSize: 10.5, color: "var(--text-3)" }}>@AdzryCo · Active</div>
          </div>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#16A34A", flexShrink: 0 }} />
        </div>
      </div>

      {/* New chat */}
      <div style={{ padding: "10px 12px 6px" }}>
        <button
          onClick={onNewChat}
          style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--r-sm)", border: "1.5px dashed var(--border-strong)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600, color: "var(--text-2)", fontFamily: "var(--font)", letterSpacing: "-0.01em", transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.borderColor = "var(--text-3)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--border-strong)"; }}
        >
          <PenLine size={13} /> New conversation
        </button>
      </div>

      {/* Quick Actions */}
      <div style={{ padding: "14px 12px 6px" }}>
        <div style={sectionLabel}>Quick Actions</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 1, marginTop: 6 }}>
          {PROMPT_TEMPLATES.map((t, i) => {
            const { icon: Icon, color, bg, darkBg } = ACTION_ICONS[i % ACTION_ICONS.length];
            const hov = hoveredPrompt === i;
            return (
              <button key={i} onClick={() => { onPromptSelect(t.prompt); onMobileClose(); }} onMouseEnter={() => setHoveredPrompt(i)} onMouseLeave={() => setHoveredPrompt(null)}
                style={{ background: hov ? "var(--bg-hover)" : "transparent", border: "none", cursor: "pointer", padding: "7px 8px", borderRadius: "var(--r-xs)", display: "flex", alignItems: "center", gap: 9, width: "100%", transition: "background 0.12s", fontFamily: "var(--font)" }}>
                <span style={{ width: 22, height: 22, borderRadius: 7, background: hov ? (isDark ? darkBg : bg) : "var(--bg-active)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" }}>
                  <Icon size={11} color={hov ? color : "var(--text-3)"} />
                </span>
                <span style={{ fontSize: 12.5, color: "var(--text-2)", fontWeight: 500, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ height: 1, background: "var(--border)", margin: "8px 12px" }} />

      {/* Chat history */}
      <div style={{ flex: 1, overflow: "auto", padding: "0 12px" }}>
        <div style={sectionLabel}>Recent Chats</div>
        <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 1 }}>
          {conversations.length === 0 ? (
            <div style={{ padding: "20px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MessageSquare size={16} color="var(--text-3)" />
              </div>
              <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 500, textAlign: "center", lineHeight: 1.4 }}>Start a conversation to see your history</span>
            </div>
          ) : conversations.map(c => (
            <button key={c.id} onClick={() => { setActiveId(c.id); onSelectChat(c.id); onMobileClose(); }}
              style={{ background: activeId === c.id ? "var(--bg-active)" : "transparent", border: "none", cursor: "pointer", padding: "8px 10px", borderRadius: "var(--r-xs)", display: "flex", alignItems: "flex-start", gap: 9, width: "100%", transition: "background 0.12s", fontFamily: "var(--font)" }}
              onMouseEnter={e => { if (activeId !== c.id) e.currentTarget.style.background = "var(--bg-hover)"; }}
              onMouseLeave={e => { if (activeId !== c.id) e.currentTarget.style.background = "transparent"; }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: activeId === c.id ? "var(--blue)" : "var(--border-strong)", flexShrink: 0, marginTop: 7 }} />
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</div>
                <div style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 1 }}>{formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Analytics footer */}
      <div style={{ padding: "10px 12px 14px", borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: "var(--r-xs)", background: "var(--bg-hover)", border: "1px solid var(--border)" }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--bg-card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <BarChart2 size={13} color="var(--text-2)" />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.01em" }}>Analytics</div>
            <div style={{ fontSize: 10.5, color: "var(--text-3)" }}>Coming soon</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

const iconBtn: React.CSSProperties = { width: 28, height: 28, borderRadius: 7, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-2)", transition: "background 0.12s" };
const sectionLabel: React.CSSProperties = { fontSize: 9.5, fontWeight: 800, color: "var(--text-3)", letterSpacing: "0.1em", textTransform: "uppercase" };
