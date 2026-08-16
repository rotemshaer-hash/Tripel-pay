import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useStore } from "../data/store";
import { childrenList } from "../data/family";

interface Nudge {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  childId: string;
  to: string;
}

/**
 * The parent's reminder centre: one place that surfaces everything actually waiting on
 * the parent — tasks to approve, redeemed vouchers to hand over, sibling trade offers,
 * and savings goals that just landed. The badge is a real count (it used to be a
 * hardcoded "2"), so an empty bell genuinely means nothing needs attention.
 */
export function ParentNotificationsBell() {
  const { state, dispatch } = useStore();
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const POPOVER_WIDTH = 268;

  const nudges: Nudge[] = childrenList(state.family).flatMap((c) => [
    ...c.tasks
      .filter((t) => t.status === "pending_approval")
      .map((t) => ({ id: `ap-${t.id}`, icon: "✅", title: "מטלה מחכה לאישור", subtitle: `${c.name} · ${t.title}`, childId: c.id, to: "/parent/child-tasks" })),
    ...c.redeemedGifts
      .filter((g) => !g.fulfilled)
      .map((g) => ({ id: `vo-${g.id}`, icon: "🎁", title: "שובר ממתין למסירה", subtitle: `${c.name} · ${g.title}`, childId: c.id, to: "/parent/gift-bank" })),
    ...c.tasks
      .filter((t) => t.tradeOfferedTo)
      .map((t) => ({ id: `tr-${t.id}`, icon: "🔁", title: "הצעת החלפת מטלה", subtitle: `${c.name} · ${t.title}`, childId: c.id, to: "/parent" })),
    ...c.savingsGoals
      .filter((g) => g.current >= g.target)
      .map((g) => ({ id: `go-${g.id}`, icon: "🎯", title: "מטרת חיסכון הושגה!", subtitle: `${c.name} · ${g.title}`, childId: c.id, to: "/parent/savings" })),
  ]);

  function toggle() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      // Align to whichever edge has room — the bell sits in an RTL flex row.
      const left = Math.min(Math.max(8, rect.right - POPOVER_WIDTH), window.innerWidth - POPOVER_WIDTH - 8);
      setAnchor({ top: rect.bottom + 10, left });
    }
    setOpen((v) => !v);
  }

  function go(n: Nudge) {
    setOpen(false);
    dispatch({ type: "SET_ACTIVE_CHILD", childId: n.childId });
    navigate(n.to);
  }

  return (
    <div style={{ position: "relative" }}>
      <button ref={btnRef} onClick={toggle} aria-label={`התראות${nudges.length ? ` (${nudges.length})` : ""}`} style={{ background: "none", border: "none", fontSize: 20, position: "relative", lineHeight: 1 }}>
        🔔
        {nudges.length > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              insetInlineStart: -6,
              background: "var(--violet-700)",
              color: "#fff",
              fontSize: 9.5,
              fontWeight: 700,
              borderRadius: 999,
              minWidth: 15,
              height: 15,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 3px",
            }}
          >
            {nudges.length}
          </span>
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
              maxHeight: 320,
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
            <div style={{ fontSize: 12.5, fontWeight: 800, padding: "4px 6px 8px", color: "var(--ink-soft)" }}>ממתין לך</div>
            {nudges.length === 0 && <div style={{ fontSize: 12.5, color: "var(--ink-faint)", padding: "10px 6px" }}>הכל מטופל — אין מה לאשר ✨</div>}
            {nudges.map((n, i) => (
              <button
                key={n.id}
                onClick={() => go(n)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 6px",
                  background: "none",
                  border: "none",
                  textAlign: "start",
                  borderBottom: i === nudges.length - 1 ? "none" : "1px solid var(--line-soft)",
                }}
              >
                <span style={{ fontSize: 17, flexShrink: 0 }}>{n.icon}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 700 }}>{n.title}</span>
                  <span style={{ display: "block", fontSize: 11, color: "var(--ink-faint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.subtitle}</span>
                </span>
                <span style={{ fontSize: 15, color: "var(--violet-700)", flexShrink: 0 }}>‹</span>
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
