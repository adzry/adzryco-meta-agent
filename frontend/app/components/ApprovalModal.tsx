"use client";
import { useState } from "react";
import { ApprovalData } from "./types";
import ThreadPreview from "./ThreadPreview";
import { CheckCircle2, XCircle, ShieldAlert, ChevronRight, Edit3 } from "lucide-react";

interface ApprovalModalProps {
  approval: ApprovalData;
  threadPreview: string[] | null;
  onApprove: () => void;
  onReject: () => void;
  onEdit: (text: string) => void;
}

const ACTION_META: Record<string, { label: string; danger: boolean; icon: string }> = {
  create_tweet:          { label: "Post Tweet",    danger: false, icon: "🐦" },
  delete_tweet:          { label: "Delete Tweet",  danger: true,  icon: "🗑" },
  like_tweet:            { label: "Like Tweet",    danger: false, icon: "❤️" },
  retweet_tweet:         { label: "Retweet",       danger: false, icon: "🔁" },
  create_direct_message: { label: "Send DM",       danger: false, icon: "💬" },
  add_member_to_list:    { label: "Add to List",   danger: false, icon: "📋" },
  follow_user:           { label: "Follow User",   danger: false, icon: "➕" },
  unfollow_user:         { label: "Unfollow User", danger: true,  icon: "➖" },
  post_thread:           { label: "Post Thread",   danger: false, icon: "🧵" },
};

export default function ApprovalModal({ approval, threadPreview, onApprove, onReject, onEdit }: ApprovalModalProps) {
  const meta = ACTION_META[approval.plan.action] ?? { label: approval.plan.action, danger: false, icon: "⚡" };
  const params = approval.plan.parameters || {};
  const isTweet = approval.plan.action === "create_tweet";
  const isThread = approval.plan.action === "post_thread";
  const tweets = threadPreview || params.tweets || [];

  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(params.text || "");

  const handleSaveEdit = () => { onEdit(editText); setEditing(false); };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(9,9,11,0.6)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }} role="dialog" aria-modal="true">
      <div className="animate-scaleIn" style={{ background: "var(--bg-card)", borderRadius: 24, boxShadow: "var(--shadow-xl)", width: "100%", maxWidth: 540, overflow: "hidden", border: "1px solid var(--border)" }}>

        {/* Header */}
        <div style={{ padding: "22px 26px 18px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: meta.danger ? "var(--red-light)" : "var(--blue-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ShieldAlert size={22} color={meta.danger ? "var(--red)" : "var(--blue)"} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 17, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.03em" }}>Approval Required</span>
                <span className={`badge ${meta.danger ? "badge-red" : "badge-blue"}`}>{meta.icon} {meta.label}</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5, maxWidth: 360 }}>{approval.plan.intent}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "18px 26px", maxHeight: 420, overflowY: "auto" }}>

          {/* Params table */}
          {Object.keys(params).filter(k => k !== "tweets" && k !== "text").length > 0 && (
            <div style={infoCard}>
              <div style={cardLabel}>Action Parameters</div>
              {Object.entries(params).filter(([k]) => k !== "tweets" && k !== "text").map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 12, alignItems: "baseline", marginBottom: 6 }}>
                  <span style={{ fontSize: 11.5, color: "var(--text-3)", width: 100, flexShrink: 0, fontWeight: 600, textTransform: "capitalize" }}>{k.replace(/_/g, " ")}</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 12.5, color: "var(--text-1)", background: "var(--bg-hover)", padding: "2px 8px", borderRadius: 6 }}>{String(v).slice(0, 120)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tweet preview / edit */}
          {isTweet && (
            <div style={infoCard}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={cardLabel}>Tweet Preview</div>
                <button onClick={() => setEditing(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--blue)", fontWeight: 600, fontFamily: "var(--font)" }}>
                  <Edit3 size={11} /> {editing ? "Cancel" : "Edit"}
                </button>
              </div>

              {editing ? (
                <div>
                  <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={4}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border-strong)", background: "var(--bg)", color: "var(--text-1)", fontFamily: "var(--font)", fontSize: 14, lineHeight: 1.5, resize: "none", outline: "none" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                    <span style={{ fontSize: 11, color: editText.length > 280 ? "var(--red)" : "var(--text-3)", fontFamily: "var(--mono)" }}>{editText.length}/280</span>
                    <button onClick={handleSaveEdit} disabled={editText.length > 280}
                      style={{ padding: "5px 14px", borderRadius: 8, background: "var(--accent)", color: editText.length > 280 ? "var(--text-3)" : (theme => "var(--bg-card)"), border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "var(--font)" }}>
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <TweetPreview text={editText || params.text} />
              )}
            </div>
          )}

          {/* Thread preview */}
          {isThread && tweets.length > 0 && <ThreadPreview tweets={tweets} />}
        </div>

        {/* Action buttons */}
        <div style={{ padding: "0 26px 20px", display: "flex", gap: 10 }}>
          <button onClick={onReject} style={rejectBtn} onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"} onMouseLeave={e => e.currentTarget.style.background = "var(--bg-card)"}>
            <XCircle size={15} /> Cancel
          </button>
          <button onClick={onApprove} style={{ ...confirmBtn, background: meta.danger ? "var(--red)" : "var(--accent)" }} onMouseEnter={e => e.currentTarget.style.opacity = "0.87"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            <CheckCircle2 size={15} /> Confirm {meta.label} <ChevronRight size={13} style={{ marginLeft: "auto" }} />
          </button>
        </div>

        {/* Safety note */}
        <div style={{ padding: "0 26px 18px", display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>Human-in-the-loop active · Action won't execute without your confirmation</span>
        </div>
      </div>
    </div>
  );
}

function TweetPreview({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ color: "var(--bg)", fontWeight: 800, fontSize: 15 }}>A</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: "-0.02em", color: "var(--text-1)" }}>AdzryCo</span>
          <span style={{ fontSize: 13, color: "var(--text-3)" }}>@AdzryCo</span>
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.6, color: "var(--text-1)", marginBottom: 10 }}>{text}</div>
        <div style={{ display: "flex", gap: 18, fontSize: 12, color: "var(--text-3)", borderTop: "1px solid var(--border)", paddingTop: 10 }}>
          <span>💬 Reply</span><span>🔁 Repost</span><span>❤️ Like</span>
          <span style={{ marginLeft: "auto" }}>{text?.length || 0}/280</span>
        </div>
      </div>
    </div>
  );
}

const infoCard: React.CSSProperties = { background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 16px", marginBottom: 12 };
const cardLabel: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 };
const rejectBtn: React.CSSProperties = { flex: 1, padding: "11px 16px", borderRadius: 12, border: "1.5px solid var(--border)", background: "var(--bg-card)", cursor: "pointer", fontSize: 13.5, fontWeight: 600, color: "var(--text-1)", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontFamily: "var(--font)", transition: "background 0.15s", letterSpacing: "-0.01em" };
const confirmBtn: React.CSSProperties = { flex: 2, padding: "11px 16px", borderRadius: 12, border: "none", cursor: "pointer", fontSize: 13.5, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 7, fontFamily: "var(--font)", transition: "opacity 0.15s", letterSpacing: "-0.01em" };
