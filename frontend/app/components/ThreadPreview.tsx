"use client";
import { Hash } from "lucide-react";

export default function ThreadPreview({ tweets }: { tweets: string[] }) {
  if (!tweets || tweets.length === 0) return null;
  return (
    <div style={{ border: "1.5px solid var(--border)", borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 8 }}>
        <Hash size={14} color="var(--accent)" />
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Thread Preview — {tweets.length} tweets</span>
      </div>
      <div style={{ maxHeight: 320, overflow: "auto" }}>
        {tweets.map((tweet, i) => (
          <div key={i} style={{ padding: "14px 16px", borderBottom: i < tweets.length - 1 ? "1px solid var(--border-subtle)" : "none", display: "flex", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--user-bubble)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>A</div>
              {i < tweets.length - 1 && <div style={{ width: 1.5, flex: 1, background: "var(--border)", marginTop: 6 }} />}
            </div>
            <div style={{ flex: 1, paddingBottom: i < tweets.length - 1 ? 12 : 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 3 }}>AdzryCo <span style={{ fontWeight: 400, color: "var(--text-tertiary)" }}>@AdzryCo</span></div>
              <div style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.5 }}>{tweet}</div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 6 }}>{tweet.length}/280 chars</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
