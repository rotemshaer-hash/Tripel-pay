import type { ReactNode } from "react";
import type { SavingsGoal } from "../data/types";

/**
 * A growing crystal/potion meter replacing the flat "card + progress bar" goal
 * display — the fill rises through the vessel with drifting bubbles, and the
 * goal sparkles once it's within reach.
 */
export function GoalCrystal({
  goal,
  faded,
  color = "var(--violet-700)",
  onClick,
  children,
}: {
  goal: SavingsGoal;
  faded?: boolean;
  color?: string;
  onClick?: () => void;
  children?: ReactNode;
}) {
  const pct = Math.min(100, Math.round((goal.current / Math.max(1, goal.target)) * 100));
  const achieved = goal.current >= goal.target;
  const remaining = goal.target - goal.current;
  const almostThere = !faded && !achieved && pct >= 80;
  const fillPct = Math.max(pct, achieved ? 100 : goal.current > 0 ? 6 : 0);

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
      className="glass"
      style={{
        width: "100%",
        borderRadius: "var(--radius-md)",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        opacity: faded ? 0.55 : 1,
        cursor: onClick ? "pointer" : undefined,
        textAlign: "start",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ position: "relative", width: 72, height: 88, flexShrink: 0 }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "40% 40% 46% 46% / 34% 34% 50% 50%",
              background: "rgba(15,33,29,0.05)",
              border: "2px solid rgba(15,33,29,0.1)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                bottom: 0,
                insetInlineStart: 0,
                insetInlineEnd: 0,
                height: `${fillPct}%`,
                background: color,
                transition: "height 0.6s cubic-bezier(.22,1,.36,1)",
                overflow: "hidden",
              }}
            >
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0) 55%)" }} />
              <span className="crystal-bubble" style={{ insetInlineStart: "20%", width: 6, height: 6, animationDelay: "0s" }} />
              <span className="crystal-bubble" style={{ insetInlineStart: "55%", width: 4, height: 4, animationDelay: "1.1s" }} />
              <span className="crystal-bubble" style={{ insetInlineStart: "75%", width: 5, height: 5, animationDelay: "2s" }} />
            </div>
          </div>
          {(achieved || almostThere) && (
            <span className="sparkle-twinkle" style={{ position: "absolute", top: -6, insetInlineEnd: -4, fontSize: 16 }}>
              ✨
            </span>
          )}
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: pct > 45 ? "#ffffff" : "var(--ink)" }}>{pct}%</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 14.5 }}>{goal.title}</div>
          <div className="money" style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 2 }}>
            {goal.current.toLocaleString("he-IL")} / {goal.target.toLocaleString("he-IL")}₪
          </div>
          {achieved ? (
            <div style={{ fontSize: 11.5, color: "var(--teal-900)", fontWeight: 700, marginTop: 6 }}>🎉 המטרה הושגה!</div>
          ) : almostThere ? (
            <div style={{ fontSize: 11.5, color, fontWeight: 700, marginTop: 6 }}>כמעט הגעתם! עוד {remaining.toLocaleString("he-IL")}₪</div>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  );
}
