import { useState } from "react";
import { Header } from "../../components/Header";
import { InviteShare } from "../../components/InviteShare";
import { WorkBottomNav } from "../../components/WorkBottomNav";
import { Toast, useToast } from "../../components/Toast";
import { useStore } from "../../data/store";
import { childrenList } from "../../data/family";
import { V, work } from "../../data/vocabulary";
import { isOverdue } from "../../utils/datetime";

/** The team roster: who's on staff, what's on their plate, and how to get a new
 * hire signed in — by code, with no work email required. */
export function WorkTeam() {
  const { state, dispatch } = useStore();
  const { toastMessage, showToast } = useToast();
  const workers = childrenList(state.family);
  const [openInvite, setOpenInvite] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  function addWorker() {
    const name = newName.trim();
    if (!name) return;
    dispatch({ type: "ADD_WORKER", name });
    showToast(`${name} נוסף/ה לצוות`);
    setNewName("");
  }

  return (
    <div className="screen">
      <Header title={state.family.companyName || "צוות"} subtitle={`${workers.length} ${V.workerPlural}`} tint="pro" />

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
                {(
                  <button
                    onClick={() => setOpenInvite(openInvite === w.id ? null : w.id)}
                    style={{ background: openInvite === w.id ? work.ink : "#ffffff", color: openInvite === w.id ? "#ffffff" : "var(--ink)", border: "1px solid var(--line)", borderRadius: 8, padding: "7px 11px", fontSize: 11.5, fontWeight: 700, flexShrink: 0 }}
                  >
                    {w.authUid ? "כניסה" : "הזמנה"}
                  </button>
                )}
              </div>
              {!w.authUid && openInvite !== w.id && (
                <div style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 9, background: "var(--paper)", borderRadius: 8, padding: "7px 10px" }}>
                  טרם התחבר/ה — לחיצה על "הזמנה" תפתח את הקישור לשליחה
                </div>
              )}
              {openInvite === w.id && (
                <div style={{ marginTop: 11, paddingTop: 11, borderTop: "1px solid var(--line-soft)" }}>
                  <InviteShare workerName={w.name} code={w.inviteCode} onNotify={showToast} />
                  {/* Someone who registered and then can't get in had no way back: the
                      invite disappeared the moment they signed up. This is the way back. */}
                  <div style={{ marginTop: 12, paddingTop: 11, borderTop: "1px solid var(--line-soft)" }}>
                    <div style={{ fontSize: 11.5, color: "var(--ink-faint)", lineHeight: 1.55, marginBottom: 8 }}>
                      {`${w.name} לא מצליח/ה להיכנס? הנפקת קוד חדש מבטלת את הקוד הקודם ומאפשרת הרשמה מחדש עם שם משתמש וסיסמה חדשים.`}
                    </div>
                    <button
                      onClick={() => {
                        dispatch({ type: "RESET_WORKER_ACCESS", childId: w.id });
                        showToast("הונפק קוד הצטרפות חדש");
                      }}
                      style={{ background: "#ffffff", border: `1px solid ${work.alert}`, color: work.alert, borderRadius: 8, padding: "9px 12px", fontSize: 12, fontWeight: 800 }}
                    >
                      הנפקת קוד הצטרפות חדש
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {workers.length === 0 && (
          <div style={{ fontSize: 13, color: "var(--ink-faint)", background: "#ffffff", border: "1px solid var(--line)", borderRadius: 12, padding: "18px 14px", textAlign: "center" }}>
            {`אין ${V.workerPlural} עדיין — אפשר להוסיף כאן.`}
          </div>
        )}

        <section style={{ background: "#ffffff", border: "1px solid var(--line)", borderRadius: 12, padding: "13px 15px", marginTop: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 9 }}>{`הוספת ${V.worker}`}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                addWorker();
              }}
              placeholder="שם מלא"
              style={{ flex: 1, padding: "10px 12px", borderRadius: 9, border: "1px solid var(--line)", fontSize: 13.5 }}
            />
            <button
              onClick={addWorker}
              disabled={!newName.trim()}
              style={{ background: work.ink, color: "#ffffff", border: "none", borderRadius: 9, padding: "0 16px", fontSize: 13, fontWeight: 800, opacity: newName.trim() ? 1 : 0.45 }}
            >
              הוספה
            </button>
          </div>
        </section>
      </div>
      <Toast message={toastMessage} />
      <WorkBottomNav />
    </div>
  );
}
