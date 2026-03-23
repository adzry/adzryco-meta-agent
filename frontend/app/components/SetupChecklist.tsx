"use client";

import { CheckCircle2, Circle, PlugZap } from "lucide-react";
import { ConfigStatusResponse, HealthResponse } from "../../lib/types/system";

function checklistItems(config: ConfigStatusResponse | null, health: HealthResponse | null, offline: boolean) {
  return [
    {
      label: "Backend reachable from frontend",
      done: !offline,
    },
    {
      label: "Anthropic API key configured",
      done: Boolean(config?.services.anthropic || health?.checks.anthropic?.status === "ok"),
    },
    {
      label: "Supabase configured",
      done: Boolean(config?.services.supabase || health?.checks.supabase?.status === "ok"),
    },
    {
      label: "X/Twitter credentials configured",
      done: Boolean(config?.services.x_api || health?.checks.x?.status === "ok"),
    },
    {
      label: "Approval store durable",
      done: Boolean(config?.approval_store?.durable),
    },
  ];
}

export default function SetupChecklist({
  config,
  health,
  offline,
}: {
  config: ConfigStatusResponse | null;
  health: HealthResponse | null;
  offline: boolean;
}) {
  const items = checklistItems(config, health, offline);
  const incomplete = items.filter((item) => !item.done);

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
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <PlugZap size={14} color="var(--accent)" />
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.02em" }}>
            Integration Checklist
          </div>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>
            {incomplete.length === 0 ? "All critical runtime dependencies are present." : `${incomplete.length} items still need attention.`}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {items.map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--text-2)" }}>
            {item.done ? <CheckCircle2 size={15} color="#16A34A" /> : <Circle size={15} color="var(--text-3)" />}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
