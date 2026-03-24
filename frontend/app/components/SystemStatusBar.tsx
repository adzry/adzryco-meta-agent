"use client";

import { Activity, AlertTriangle, Bot, Database, KeyRound, Server } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { ConfigStatusResponse, HealthResponse } from "../../lib/types/system";

function toneFrom(status?: string): "ok" | "warn" | "error" | "neutral" {
  if (!status) return "neutral";
  if (["ok", "configured"].includes(status)) return "ok";
  if (["missing", "unconfigured", "degraded"].includes(status)) return "warn";
  if (["misconfigured", "error"].includes(status)) return "error";
  return "neutral";
}

export default function SystemStatusBar({
  health,
  config,
  offline,
}: {
  health: HealthResponse | null;
  config: ConfigStatusResponse | null;
  offline: boolean;
}) {
  const approvalStatus = config?.approval_store?.status ?? health?.checks.approval_store?.status;

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        padding: "10px 12px",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-md)",
        background: "var(--bg-card)",
        boxShadow: "var(--shadow-xs)",
      }}
    >
      <StatusBadge label={offline ? "Backend offline" : `Backend ${health?.status ?? "unknown"}`} tone={offline ? "error" : toneFrom(health?.status)} icon={<Server size={12} />} />
      <StatusBadge label={`Anthropic ${health?.checks.anthropic?.status ?? "unknown"}`} tone={toneFrom(health?.checks.anthropic?.status)} icon={<Bot size={12} />} />
      <StatusBadge label={`Supabase ${health?.checks.supabase?.status ?? "unknown"}`} tone={toneFrom(health?.checks.supabase?.status)} icon={<Database size={12} />} />
      <StatusBadge label={`X API ${health?.checks.x?.status ?? "unknown"}`} tone={toneFrom(health?.checks.x?.status)} icon={<Activity size={12} />} />
      <StatusBadge label={`Redis ${health?.checks.redis?.status ?? "unknown"}`} tone={toneFrom(health?.checks.redis?.status)} icon={<KeyRound size={12} />} />
      <StatusBadge label={`Approval ${approvalStatus ?? "unknown"}`} tone={toneFrom(approvalStatus)} icon={<AlertTriangle size={12} />} />
    </div>
  );
}
