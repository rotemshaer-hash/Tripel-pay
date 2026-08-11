import type { ReactNode } from "react";

/**
 * A vibrant gradient navigation pill with a white icon pod — the shared building
 * block for the colorful menus across the app (parent child-hub, child home), so
 * every screen speaks the same bold, iconic language.
 */
export function NavPill({ label, icon, gradient, accent, onClick }: { label: string; icon: ReactNode; gradient: string; accent: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "relative",
        overflow: "hidden",
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 14,
        borderRadius: "var(--radius-md)",
        padding: "14px 18px",
        background: gradient,
        border: "none",
        boxShadow: "var(--shadow-card-solid)",
        color: "#ffffff",
        textAlign: "start",
      }}
    >
      <span aria-hidden="true" style={{ position: "absolute", top: -22, insetInlineEnd: -16, width: 76, height: 76, borderRadius: "50%", background: "rgba(255,255,255,0.28)", filter: "blur(24px)", pointerEvents: "none" }} />
      <span
        style={{
          position: "relative",
          zIndex: 1,
          flexShrink: 0,
          width: 40,
          height: 40,
          borderRadius: "52% 48% 50% 50% / 50% 50% 52% 48%",
          background: "rgba(255,255,255,0.92)",
          color: accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </span>
      <span style={{ position: "relative", zIndex: 1, flex: 1, fontSize: 15.5, fontWeight: 800 }}>{label}</span>
      <span style={{ position: "relative", zIndex: 1, fontSize: 18, opacity: 0.9 }}>‹</span>
    </button>
  );
}
