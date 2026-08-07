import { useState } from "react";
import { useStore, useActiveChild } from "../data/store";
import { Toast, useToast } from "./Toast";

export function SendMoneyFab({ childId }: { childId: string }) {
  const { dispatch } = useStore();
  const child = useActiveChild();
  const { toastMessage, showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("20");
  const [dedication, setDedication] = useState("");

  const suggestions = ["כי עזרת/ה השבוע 💪", "מתנה סתם כי אוהבים אותך ❤️", "כי הצלחת בבחינה! 🎓"];

  return (
    <>
      <div style={{ position: "absolute", bottom: 100, insetInlineStart: "50%", transform: "translateX(50%)", zIndex: 45 }}>
        <div className="pulse-ring" />
        <button
          onClick={() => setOpen(true)}
          aria-label="שליחת כסף"
          style={{
            width: 58,
            height: 58,
            borderRadius: "50%",
            background: "var(--teal-700)",
            border: "4px solid #ffffff",
            boxShadow: "0 10px 22px -8px rgba(38,34,31,0.45)",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M4 8V5a1 1 0 0 1 1-1h3M20 8V5a1 1 0 0 0-1-1h-3M4 16v3a1 1 0 0 0 1 1h3M20 16v3a1 1 0 0 1-1 1h-3" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="9" y="9" width="6" height="6" rx="1" fill="#ffffff" />
          </svg>
        </button>
      </div>
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(3,8,7,0.65)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "flex-end",
            zIndex: 70,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="modal-sheet"
            style={{
              width: "100%",
              borderRadius: "26px 26px 0 0",
              padding: "24px 22px 32px",
              borderBottom: "none",
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 16 }}>שליחת כסף</div>
            <label style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>סכום (₪)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{
                width: "100%",
                padding: "13px 14px",
                borderRadius: 14,
                fontSize: 19,
                marginTop: 6,
                marginBottom: 14,
              }}
            />
            <label style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>הקדשה (אופציונלי)</label>
            <input
              placeholder="למה זה מגיע לו/לה?"
              value={dedication}
              onChange={(e) => setDedication(e.target.value)}
              style={{ width: "100%", padding: "11px 14px", borderRadius: 14, fontSize: 14, marginTop: 6, marginBottom: 10 }}
            />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setDedication(s)}
                  style={{
                    fontSize: 11.5,
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: "1px solid var(--line)",
                    background: "transparent",
                    color: "var(--ink-soft)",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                const n = Number(amount);
                if (n > 0) {
                  dispatch({ type: "SEND_MONEY", childId, amount: n, note: dedication.trim() || "העברה מההורה" });
                  showToast(`${n}₪ נשלחו ל${child.name}`);
                  setDedication("");
                }
                setOpen(false);
              }}
              style={{
                width: "100%",
                background: "var(--teal-700)",
                color: "#ffffff",
                border: "none",
                borderRadius: 16,
                padding: "14px",
                fontSize: 15.5,
                fontWeight: 800,
                boxShadow: "var(--glow-teal)",
              }}
            >
              שלח
            </button>
          </div>
        </div>
      )}
      <Toast message={toastMessage} />
    </>
  );
}
