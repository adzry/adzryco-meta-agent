"use client";
import { Hash, AlertCircle } from "lucide-react";

export default function ThreadPreview({ tweets }: { tweets: string[] }) {
  if (!tweets?.length) return null;
  const overLimit = tweets.filter(t => t.length > 280);

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", marginBottom: 12 }}>
      {/* Header */}
      <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Hash size={13} color="var(--blue)" />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.02em" }}>Thread Preview</span>
          <span style={{ padding: "2px 8px", background: "var(--blue-light)", color: "var(--blue)", borderRadius: 99, fontSize: 11, fontWeight: 600 }}>{tweets.length} tweets</span>
        </div>
        {overLimit.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--amber)" }}>
            <AlertCircle size={12} />
            {overLimit.length} over 280 chars
          </div>
        )}
      </div>

      {/* Tweets */}
      <div style={{ maxHeight: 340, overflowY: "auto" }}>
        {tweets.map((tweet, i) => {
          const over = tweet.length > 280;
          return (
            <div key={i} style={{ padding: "14px 16px", borderBottom: i < tweets.length - 1 ? "1px solid var(--border)" : "none", display: "flex", gap: 12 }}>
              {/* Thread line */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#fff" }}>A</div>
                {i < tweets.length - 1 && <div style={{ width: 2, flex: 1, background: "var(--border)", marginTop: 5, borderRadius: 2 }} />}
              </div>
              {/* Content */}
              <div style={{ flex: 1, paddingBottom: i < tweets.length - 1 ? 14 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.02em" }}>AdzryCo</span>
                  <span style={{ fontSize: 12, color: "var(--text-3)" }}>@AdzryCo</span>
                  <span style={{ marginLeft: "auto", fontSize: 11, padding: "2px 7px", borderRadius: 99, background: over ? "var(--red-light)" : "var(--bg-active)", color: over ? "var(--red)" : "var(--text-3)", fontWeight: 600 }}>
                    {tweet.length}/280
                  </span>
                </div>
                <div style={{ fontSize: 14, color: "var(--text-1)", lineHeight: 1.6 }}>{tweet}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
