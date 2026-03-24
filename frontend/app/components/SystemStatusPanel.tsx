"use client";

import type { CSSProperties } from "react";
import { RefreshCw, ShieldAlert } from "lucide-react";
import { ConfigStatusResponse, HealthResponse } from "../../lib/types/system";

export default function SystemStatusPanel({
  health,
  config,
  offline,
  onRefresh,
}: {
  health: HealthResponse | null;
  config: ConfigStatusResponse | null;
  offline: boolean;
  onRefresh: () => Promise<void> | void;
}) {
  const warnings = [...(health?.warnings ?? []), ...(config?.warnings ?? [])].filter(
    (item, idx, arr) => arr.indexOf(item) === idx,
  );

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--r-md)",
        background: "var(--bg-card)",
        boxShadow: "var(--shadow-xs)",
        padding: 14,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.02em" }}>
            Runtime Status
          </div>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>
            {offline
              ? "Backend is unreachable from the frontend."
              : `${config?.app?.name ?? "Meta-Agent"} · ${config?.app?.environment ?? health?.environment ?? "unknown"} · v${config?.app?.version ?? health?.version ?? "?"}`}
          </div>
        </div>
        <button
          onClick={() => onRefresh()}
          style={{
            border: "1px solid var(--border)",
            background: "var(--bg-hover)",
            color: "var(--text-2)",
            borderRadius: 10,
            width: 34,
            height: 34,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          aria-label="Refresh runtime status"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          <div style={cardStyle}>
            <div style={labelStyle}>System</div>
            <div style={valueStyle}>{offline ? "Offline" : health?.status ?? "Unknown"}</div>
          </div>
          <div style={cardStyle}>
            <div style={labelStyle}>Approval backend</div>
            <div style={valueStyle}>{config?.approval_store?.backend ?? health?.checks.approval_store?.backend ?? "memory"}</div>
          </div>
          <div style={cardStyle}>
            <div style={labelStyle}>Durability</div>
            <div style={valueStyle}>{config?.approval_store?.durable ? "Durable" : "Ephemeral"}</div>
          </div>
        </div>

        {warnings.length > 0 && (
          <div style={{ ...cardStyle, borderColor: "rgba(217,119,6,0.25)", background: "rgba(217,119,6,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <ShieldAlert size={14} color="#D97706" />
              <span style={{ fontSize: 12, fontWeight: 800, color: "#D97706" }}>Warnings</span>
            </div>
            <div style={{ display: "grid", gap: 4 }}>
              {warnings.map((warning) => (
                <div key={warning} style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.45 }}>
                  • {warning}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const cardStyle: CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 12,
  background: "var(--bg-hover)",
  padding: 10,
};

const labelStyle: CSSProperties = {
  fontSize: 10.5,
  fontWeight: 800,
  color: "var(--text-3)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const valueStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "var(--text-1)",
  marginTop: 4,
};
