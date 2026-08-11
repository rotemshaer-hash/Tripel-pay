import type { Child } from "../data/types";
import { EggAvatar } from "./EggAvatar";

/**
 * A bold "cosmic capsule" replacing the flat white family row — each child gets a
 * deep gradient drawn from their own avatar color, a glowing aura, a drifting spark,
 * and their balance in big white type. The whole family band reads as alive and
 * distinct per-kid instead of an identical stack of white rectangles.
 */
export function FamilyMemberCard({ child, isActive, onSelect }: { child: Child; isActive: boolean; onSelect: () => void }) {
  const pending = child.tasks.filter((t) => t.status === "pending_approval").length;
  const goal = child.savingsGoals[0];
  const goalPct = goal ? Math.min(100, Math.round((goal.current / Math.max(1, goal.target)) * 100)) : null;

  return (
    <button
      onClick={onSelect}
      style={{
        position: "relative",
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 18px",
        borderRadius: "var(--radius-md)",
        // Bright, cheerful capsule: a light tint of the child's color up top fading to
        // their vivid color, with only a mild deepening at the bottom for depth. White
        // text stays legible on the lighter tones thanks to the per-text shadow below.
        background: child.avatarColor,
        backgroundImage: `linear-gradient(140deg, color-mix(in srgb, ${child.avatarColor} 82%, #ffffff) 0%, ${child.avatarColor} 52%, color-mix(in srgb, ${child.avatarColor} 84%, #3a2560) 100%)`,
        border: isActive ? "3px solid #ffffff" : "3px solid transparent",
        boxShadow: isActive ? "0 16px 32px -10px rgba(23,24,31,0.4)" : "var(--shadow-card-solid)",
        overflow: "hidden",
        textAlign: "start",
        color: "#ffffff",
      }}
    >
      <span
        aria-hidden="true"
        style={{ position: "absolute", insetInlineEnd: -34, top: -34, width: 128, height: 128, borderRadius: "50%", background: child.avatarColor, filter: "blur(36px)", opacity: 0.55, pointerEvents: "none" }}
      />
      <span aria-hidden="true" className="surreal-shape" style={{ top: 12, insetInlineStart: 20, fontSize: 13, opacity: 0.7, animationDuration: "7s" }}>
        ✦
      </span>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          flexShrink: 0,
          background: "rgba(255,255,255,0.92)",
          borderRadius: "46% 54% 50% 50% / 52% 48% 54% 46%",
          padding: 4,
          boxShadow: "0 6px 16px -6px rgba(0,0,0,0.45)",
        }}
      >
        <EggAvatar photoUrl={child.photoUrl} color={child.avatarColor} initial={child.initial} size={46} />
      </div>

      <div style={{ flex: 1, minWidth: 0, position: "relative", zIndex: 1, textShadow: "0 1px 3px rgba(0,0,0,0.28)" }}>
        <div style={{ fontSize: 15.5, fontWeight: 800 }}>{child.name}</div>
        <div className="money" style={{ fontSize: 21, marginTop: 1 }}>
          {child.balance.toLocaleString("he-IL")}₪
        </div>
        {goal && goalPct !== null && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
            <div style={{ flex: 1, height: 6, borderRadius: 999, background: "rgba(0,0,0,0.18)", overflow: "hidden" }}>
              <div style={{ width: `${goalPct}%`, height: "100%", background: "#ffffff", borderRadius: 999, boxShadow: "0 0 8px rgba(255,255,255,0.9)" }} />
            </div>
            <span style={{ fontSize: 10.5, opacity: 0.95, flexShrink: 0 }}>
              {goal.title} {goalPct}%
            </span>
          </div>
        )}
      </div>

      {pending > 0 && (
        <span
          style={{
            position: "absolute",
            zIndex: 2,
            top: 12,
            insetInlineStart: 14,
            background: "#ffffff",
            color: child.avatarColor,
            fontSize: 11,
            fontWeight: 800,
            borderRadius: 999,
            padding: "4px 10px",
            boxShadow: "0 4px 10px -3px rgba(0,0,0,0.4)",
          }}
        >
          {pending} לאישור
        </span>
      )}
    </button>
  );
}
