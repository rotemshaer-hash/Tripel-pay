import { Header } from "../../components/Header";
import { WorkBottomNav } from "../../components/WorkBottomNav";
import { Toast, useToast } from "../../components/Toast";
import { useStore } from "../../data/store";
import { childrenList } from "../../data/family";
import { V, work } from "../../data/vocabulary";
import { isOverdue } from "../../utils/datetime";

/** The team roster: who's on staff, what's on their plate, and how to get a new
 * hire signed in — by code, with no work email required. */
export function WorkTeam() {
  const { state } = useStore();
  const { toastMessage, showToast } = useToast();
  const workers = childrenList(state.family);

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      showToast("קוד ההצטרפות הועתק");
    } catch {
      showToast("לא ניתן להעתיק — יש להעתיק ידנית");
    }
  }

  return (
    <div className="screen">
      <Header title="צוות" subtitle={`${workers.length} ${V.workerPlural}`} tint="pro" />

      <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {workers.map((w) => {
          const open = w.tasks.filter((t) => t.status === "available" || t.status === "in_progress").length;
          const awaiting = w.tasks.filter((t) => t.status === "pending_approval").length;
          const late = w.tasks.filter((t) => isOverdue(t.dueAt, t.status)).length;
          return (
            <div key={w.id} style={{ background: "#ffffff", border: "1px solid var(--line)", borderRadius: 12, padding: "13px 15px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background: work.ink,
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 15,
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {w.initial}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700 }}>{w.name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 2 }}>
                    {open} פתוחות · {awaiting} לאישור
                    {late > 0 && <span style={{ color: work.alert, fontWeight: 700 }}> · {late} באיחור</span>}
                  </div>
                </div>
                {!w.authUid && (
                  <button
                    onClick={() => copyCode(w.inviteCode)}
                    style={{ background: "#ffffff", border: "1px solid var(--line)", borderRadius: 8, padding: "7px 11px", fontSize: 11.5, fontWeight: 700, color: "var(--ink)", flexShrink: 0 }}
                  >
                    העתקת קוד
                  </button>
                )}
              </div>
              {!w.authUid && (
                <div style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 9, background: "var(--paper)", borderRadius: 8, padding: "7px 10px" }}>
                  טרם התחבר/ה · קוד הצטרפות <span dir="ltr" style={{ fontWeight: 800, letterSpacing: "0.05em" }}>{w.inviteCode}</span>
                </div>
              )}
            </div>
          );
        })}
        {workers.length === 0 && (
          <div style={{ fontSize: 13, color: "var(--ink-faint)", background: "#ffffff", border: "1px solid var(--line)", borderRadius: 12, padding: "18px 14px", textAlign: "center" }}>
            אין עובדים עדיין.
          </div>
        )}
      </div>
      <Toast message={toastMessage} />
      <WorkBottomNav />
    </div>
  );
}
