"use client";

import { ReactNode } from "react";

type BadgeTone = "ok" | "warn" | "error" | "neutral";

function toneStyles(tone: BadgeTone): { background: string; color: string; border: string } {
  switch (tone) {
    case "ok":
      return { background: "rgba(22,163,74,0.12)", color: "#16A34A", border: "rgba(22,163,74,0.28)" };
    case "warn":
      return { background: "rgba(217,119,6,0.12)", color: "#D97706", border: "rgba(217,119,6,0.28)" };
    case "error":
      return { background: "rgba(220,38,38,0.12)", color: "#DC2626", border: "rgba(220,38,38,0.28)" };
    default:
      return { background: "var(--bg-hover)", color: "var(--text-2)", border: "var(--border)" };
  }
}

export default function StatusBadge({
  label,
  tone,
  icon,
}: {
  label: string;
  tone: BadgeTone;
  icon?: ReactNode;
}) {
  const styles = toneStyles(tone);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 9px",
        borderRadius: 999,
        border: `1px solid ${styles.border}`,
        background: styles.background,
        color: styles.color,
        fontSize: 11.5,
        fontWeight: 700,
        letterSpacing: "-0.01em",
        whiteSpace: "nowrap",
      }}
    >
      {icon}
      {label}
    </span>
  );
}
