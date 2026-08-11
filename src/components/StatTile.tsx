import type { ReactNode } from "react";

/**
 * A bold, colored achievement stat tile — a deep gradient with a sheen, the
 * badge floating in a white pod, and the value in big white type. Replaces the
 * flat white stat cards so the achievements grid reads as vivid and celebratory.
 */
export function StatTile({ badge, label, value, gradient }: { badge: ReactNode; label: string; value: ReactNode; gradient: string }) {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "var(--radius-md)",
        padding: "14px 10px 16px",
        background: gradient,
        boxShadow: "var(--shadow-card-solid)",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 7,
        textAlign: "center",
      }}
    >
      <span
        aria-hidden="true"
        style={{ position: "absolute", top: -24, insetInlineEnd: -20, width: 82, height: 82, borderRadius: "50%", background: "rgba(255,255,255,0.35)", filter: "blur(26px)", pointerEvents: "none" }}
      />
      <div style={{ position: "relative", zIndex: 1, background: "rgba(255,255,255,0.92)", borderRadius: "48% 52% 50% 50% / 52% 48% 52% 48%", padding: 5, display: "flex" }}>
        {badge}
      </div>
      <div style={{ position: "relative", zIndex: 1, fontSize: 10.5, opacity: 0.95 }}>{label}</div>
      <div style={{ position: "relative", zIndex: 1, fontSize: 15, fontWeight: 800 }}>{value}</div>
    </div>
  );
}
