import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Money } from "./UI";
import { formatDate } from "../utils/datetime";
import type { Child } from "../data/types";

export function NotificationsBell({ child }: { child: Child }) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const recent = child.transactions.slice(0, 5);
  const POPOVER_WIDTH = 240;

  function toggle() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      // Align the popover's edge with the button's edge (whichever side has room),
      // since the bell can land on either physical side depending on RTL flex order.
      const left = Math.min(Math.max(8, rect.right - POPOVER_WIDTH), window.innerWidth - POPOVER_WIDTH - 8);
      setAnchor({ top: rect.bottom + 10, left });
    }
    setOpen((v) => !v);
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        ref={btnRef}
        onClick={toggle}
        aria-label="התראות"
        style={{ background: "none", border: "none", fontSize: 22, color: "#fff", position: "relative", lineHeight: 1 }}
      >
        🔔
        {recent.length > 0 && (
          <span
            aria-hidden="true"
            style={{ position: "absolute", top: -2, insetInlineEnd: -2, width: 8, height: 8, borderRadius: "50%", background: "#ff5c72", border: "1.5px solid var(--violet-700)" }}
          />
        )}
      </button>
      {open && anchor && createPortal(
        <>
          {/* Rendered into <body>: the header both clips (overflow/clip-path) and forms
              its own stacking context, which would otherwise swallow the popover's
              clicks even at a higher z-index. */}
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 2000 }} />
          <div
            style={{
              position: "fixed",
              top: anchor.top,
              left: anchor.left,
              width: POPOVER_WIDTH,
              maxHeight: 280,
              overflowY: "auto",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-card-solid)",
              padding: 10,
              zIndex: 2001,
              color: "var(--ink)",
              background: "#ffffff",
              border: "1px solid var(--line)",
            }}
          >
            <div style={{ fontSize: 12.5, fontWeight: 800, padding: "4px 6px 8px", color: "var(--ink-soft)" }}>עדכונים אחרונים</div>
            {recent.length === 0 && <div style={{ fontSize: 12.5, color: "var(--ink-faint)", padding: "8px 6px" }}>אין עדכונים חדשים</div>}
            {recent.map((tx, i) => (
              <div
                key={tx.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 6px",
                  borderBottom: i === recent.length - 1 ? "none" : "1px solid var(--line-soft)",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tx.title}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-faint)" }}>{formatDate(tx.date)}</div>
                </div>
                <Money value={tx.amount} />
              </div>
            ))}
            <button
              onClick={() => {
                setOpen(false);
                navigate("/child/transactions");
              }}
              style={{ width: "100%", marginTop: 8, background: "none", border: "none", color: "var(--violet-700)", fontSize: 12.5, fontWeight: 700, padding: "8px 0 2px" }}
            >
              כל התנועות ‹
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
