import { Confetti } from "./Confetti";
import { SceneAchievementBadge } from "./Illustrations";
import type { SavingsGoal } from "../data/types";

export function GoalCelebration({ goal, onClose }: { goal: SavingsGoal; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(3,8,7,0.65)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 90,
        padding: 24,
      }}
    >
      <Confetti count={40} />
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-sheet"
        style={{
          borderRadius: "var(--radius-lg)",
          padding: "28px 24px",
          textAlign: "center",
          maxWidth: 320,
          position: "relative",
          zIndex: 2,
        }}
      >
        <div style={{ display: "flex", justifyContent: "center" }}>
          <SceneAchievementBadge size={110} />
        </div>
        <div style={{ fontSize: 19, fontWeight: 800, marginTop: 8 }}>הגעתם ליעד!</div>
        <div className="money" style={{ fontSize: 15, color: "var(--violet-700)", marginTop: 4 }}>
          {goal.title} · {goal.target.toLocaleString("he-IL")}₪
        </div>
        {goal.note && (
          <div
            style={{
              marginTop: 18,
              padding: "14px 16px",
              borderRadius: 14,
              background: "var(--violet-200)",
              fontSize: 13.5,
              lineHeight: 1.6,
              textAlign: "start",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--violet-700)", marginBottom: 6 }}>✉️ מה שכתבת לעצמך כשהתחלת:</div>
            "{goal.note}"
          </div>
        )}
        <button
          onClick={onClose}
          style={{
            marginTop: 20,
            width: "100%",
            background: "var(--violet-700)",
            color: "#fff",
            border: "none",
            borderRadius: 14,
            padding: "13px",
            fontWeight: 800,
            fontSize: 14.5,
            boxShadow: "var(--glow-violet)",
          }}
        >
          יאללה! 🎊
        </button>
      </div>
    </div>
  );
}
