import { useState } from "react";
import { Confetti } from "./Confetti";
import { Mascot } from "./Mascot";
import type { TaskItem } from "../data/types";

export function RewardRevealCard({ task, onDone }: { task: TaskItem; onDone: () => void }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div
      onClick={revealed ? onDone : undefined}
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
      {revealed && <Confetti count={34} />}
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-sheet"
        style={{
          borderRadius: "var(--radius-lg)",
          padding: "28px 24px",
          textAlign: "center",
          maxWidth: 320,
          width: "100%",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 4 }}>ההורה אישר/ה את המטלה שלך</div>
        <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 18 }}>{task.title}</div>

        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="shine-sweep"
            style={{
              width: "100%",
              background: "linear-gradient(120deg, var(--violet-500), var(--teal-700))",
              border: "none",
              borderRadius: 16,
              padding: "26px 16px",
              color: "#fff",
              fontSize: 15,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            🎁 הקישו לחשיפת התגמול
          </button>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
              <Mascot size={92} pose="celebrate" />
            </div>
            <div className="money" style={{ fontSize: 38, fontWeight: 800, color: "var(--teal-900)" }}>
              +{task.reward.toLocaleString("he-IL")}₪
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 4 }}>נוסף ליתרה שלך!</div>
            <button
              onClick={onDone}
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
              מגניב! 🎉
            </button>
          </>
        )}
      </div>
    </div>
  );
}
