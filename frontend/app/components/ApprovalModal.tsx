"use client";
import { ApprovalData } from "./types";
import ThreadPreview from "./ThreadPreview";
import { CheckCircle, XCircle, AlertTriangle, Hash } from "lucide-react";

interface ApprovalModalProps {
  approval: ApprovalData;
  threadPreview: string[] | null;
  onApprove: () => void;
  onReject: () => void;
}

const ACTION_LABELS: Record<string, string> = {
  create_tweet: "Post Tweet",
  delete_tweet: "Delete Tweet",
  like_tweet: "Like Tweet",
  retweet_tweet: "Retweet",
  create_direct_message: "Send DM",
  add_member_to_list: "Add to List",
  follow_user: "Follow User",
  unfollow_user: "Unfollow User",
  post_thread: "Post Thread",
};

const ACTION_DANGER: Record<string, boolean> = {
  delete_tweet: true,
  unfollow_user: true,
};

export default function ApprovalModal({ approval, threadPreview, onApprove, onReject }: ApprovalModalProps) {
  const isDanger = ACTION_DANGER[approval.plan.action];
  const label = ACTION_LABELS[approval.plan.action] || approval.plan.action;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }}>
      <div className="fade-in" style={{ background: "var(--bg)", borderRadius: 24, boxShadow: "var(--shadow-lg)", width: "100%", maxWidth: 520, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: isDanger ? "#FFF1F0" : "var(--accent-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AlertTriangle size={20} color={isDanger ? "var(--danger)" : "var(--accent)"} />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Approval Required</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{approval.plan.intent}</div>
            </div>
          </div>
        </div>

        {/* Action Details */}
        <div style={{ padding: "20px 28px" }}>
          <div style={{ background: "var(--bg-secondary)", borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Action Details</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Row label="Action" value={<span style={{ fontWeight: 600, color: isDanger ? "var(--danger)" : "var(--accent)" }}>{label}</span>} />
              {Object.entries(approval.plan.parameters || {}).filter(([k]) => k !== "tweets").map(([k, v]) => (
                <Row key={k} label={k} value={<span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5 }}>{String(v).slice(0, 100)}</span>} />
              ))}
            </div>
          </div>

          {/* Tweet preview for single tweet */}
          {approval.plan.action === "create_tweet" && approval.plan.parameters?.text && (
            <TweetPreview text={approval.plan.parameters.text} />
          )}

          {/* Thread preview */}
          {(approval.plan.action === "post_thread" || (threadPreview && threadPreview.length > 0)) && (
            <ThreadPreview tweets={threadPreview || approval.plan.parameters?.tweets || []} />
          )}
        </div>

        {/* Actions */}
        <div style={{ padding: "0 28px 24px", display: "flex", gap: 10 }}>
          <button onClick={onReject} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "1.5px solid var(--border)", background: "var(--bg)", cursor: "pointer", fontSize: 14, fontWeight: 500, color: "var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontFamily: "var(--font-sans)", transition: "background 0.15s" }}>
            <XCircle size={16} /> Cancel
          </button>
          <button onClick={onApprove} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", background: isDanger ? "var(--danger)" : "var(--user-bubble)", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontFamily: "var(--font-sans)", transition: "opacity 0.15s" }}>
            <CheckCircle size={16} /> Confirm {label}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
      <span style={{ fontSize: 12, color: "var(--text-tertiary)", width: 90, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13.5, color: "var(--text-primary)", flex: 1 }}>{value}</span>
    </div>
  );
}

function TweetPreview({ text }: { text: string }) {
  return (
    <div style={{ border: "1.5px solid var(--border)", borderRadius: 16, padding: "16px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--user-bubble)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>A</span>
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>AdzryCo</div>
          <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>@AdzryCo</div>
        </div>
      </div>
      <div style={{ fontSize: 15, color: "var(--text-primary)", lineHeight: 1.5, marginBottom: 10 }}>{text}</div>
      <div style={{ fontSize: 12, color: "var(--text-tertiary)", display: "flex", gap: 16 }}>
        <span>💬 Reply</span><span>🔁 Repost</span><span>❤️ Like</span>
      </div>
    </div>
  );
}
