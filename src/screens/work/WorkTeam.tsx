import { useState } from "react";
import { Header } from "../../components/Header";
import { InviteShare } from "../../components/InviteShare";
import { WorkBottomNav } from "../../components/WorkBottomNav";
import { Toast, useToast } from "../../components/Toast";
import { ConfirmButton } from "../../components/ConfirmButton";
import { useStore } from "../../data/store";
import { childrenList } from "../../data/family";
import { V, work } from "../../data/vocabulary";
import { formatDate, isOverdue } from "../../utils/datetime";
import { dayMessage } from "../../data/messages";
import { whatsAppLink } from "../../utils/share";

/** The team roster: who's on staff, what's on their plate, and how to get a new
 * hire signed in — by code, with no work email required. */
export function WorkTeam() {
  const { state, dispatch } = useStore();
  const { toastMessage, showToast } = useToast();
  // Archived workers keep every task and journal entry they ever had — same rule as
  // an archived task — so this list is the one place that stops counting them: the
  // roster, the header count, and (below) the "no one on the team yet" empty state.
  const all = childrenList(state.family);
  const workers = all.filter((w) => !w.archivedAt);
  const archived = all.filter((w) => w.archivedAt);
  const [openInvite, setOpenInvite] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [phoneDraft, setPhoneDraft] = useState<Record<string, string>>({});

  function addWorker() {
    const name = newName.trim();
    if (!name) return;
    dispatch({ type: "ADD_WORKER", name });
    showToast(`${name} נוסף/ה לצוות`);
    setNewName("");
  }

  return (
    <div className="screen work-ground">
      <Header title={state.family.companyName || "צוות"} subtitle={`${workers.length} ${V.workerPlural}`} tint="pro" />

      <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {workers.map((w) => {
          const open = w.tasks.filter((t) => t.status === "available" || t.status === "in_progress").length;
          const awaiting = w.tasks.filter((t) => t.status === "pending_approval").length;
          const late = w.tasks.filter((t) => isOverdue(t.dueAt, t.status)).length;
          return (
            <div key={w.id} className="pane" style={{ padding: "14px 15px" }}>
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
                  <div className="display" style={{ fontSize: 16 }}>{w.name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--text-muted-2)", marginTop: 2 }}>
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
              {/* The team screen is where a manager stands when they think about a
                  person — so it is where sending that person their work belongs. */}
              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                <input
                  dir="ltr"
                  value={phoneDraft[w.id] ?? w.phone ?? ""}
                  onChange={(e) => setPhoneDraft((d) => ({ ...d, [w.id]: e.target.value }))}
                  onBlur={() => {
                    const value = (phoneDraft[w.id] ?? "").trim();
                    if (phoneDraft[w.id] === undefined || value === (w.phone ?? "")) return;
                    dispatch({ type: "SET_WORKER_PHONE", childId: w.id, phone: value });
                    showToast(value ? "המספר נשמר" : "המספר הוסר");
                  }}
                  placeholder="טלפון (05X…)"
                  style={{ flex: 1, minWidth: 0, padding: "9px 11px", borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }}
                />
                <a
                  href={whatsAppLink(w.phone, dayMessage(state.family.companyName || state.family.parentName, w))}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ background: work.action, color: "#06301a", borderRadius: 8, padding: "9px 12px", fontSize: 12, fontWeight: 800, textDecoration: "none", whiteSpace: "nowrap", alignSelf: "stretch", display: "flex", alignItems: "center" }}
                >
                  שליחת המשימות
                </a>
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
              {/* This used to live inside the "הזמנה"/"כניסה" panel above, reachable
                  only after opening it — nobody looking to remove a person thinks to
                  tap a button labelled for invites first, which is exactly what made
                  removing someone read as broken. It's its own control now, visible
                  on the card regardless of that panel's state. Same rule as removing
                  a task from the board: this takes the person off the active roster,
                  out of the assignment picker and off the WhatsApp link updates —
                  every task and journal entry they ever had stays exactly as it was. */}
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line-soft)" }}>
                <ConfirmButton
                  style={{ background: "none", border: "none", color: work.alert, fontSize: 12, fontWeight: 700, padding: 0, textAlign: "start" }}
                  label="הסרה מהצוות"
                  confirmLabel="כן, להסיר"
                  warning={`להסיר את ${w.name} מהצוות? הוא/היא ייעלם/תיעלם מהרשימה ומבחירת אחראי למשימה חדשה, אבל כל המשימות והתיעוד שלו/שלה יישארו ביומן כרגיל. אפשר לשחזר בכל שלב.`}
                  onConfirm={() => {
                    dispatch({ type: "ARCHIVE_WORKER", childId: w.id });
                    showToast(`${w.name} הוסר/ה מהצוות`);
                  }}
                />
              </div>
            </div>
          );
        })}
        {workers.length === 0 && (
          <div className="pane" style={{ padding: "20px 16px" }}>
            <div style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 7 }}>{`מוסיפים ${V.worker} — והוא לא מתקין כלום`}</div>
            <div style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.7 }}>
              {`מספיק שם ומספר טלפון. מכאן שולחים לו בוואטסאפ קישור אישי שנשאר נכון כל יום: הוא לוחץ, רואה את המשימות שלו, ומדווח קבלה, התחלה, סיום, תמונה או הערה — בלי התקנה ובלי סיסמה.`}
            </div>
          </div>
        )}

        {/* Removed, not deleted — this is the way back, so removing never reads as a
            one-way door. */}
        {archived.length > 0 && (
          <section className="pane" style={{ padding: "14px 15px" }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--ink-soft)", marginBottom: 9 }}>{`הוסרו מהצוות · ${archived.length}`}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {archived.map((w) => (
                <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--paper)", borderRadius: 9, padding: "9px 11px" }}>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: "var(--ink-soft)" }}>
                    {w.name}
                    {w.archivedAt && <span style={{ color: "var(--ink-faint)" }}>{` · הוסר/ה ${formatDate(w.archivedAt)}`}</span>}
                  </span>
                  <button
                    onClick={() => {
                      dispatch({ type: "RESTORE_WORKER", childId: w.id });
                      showToast(`${w.name} שוחזר/ה לצוות`);
                    }}
                    style={{ background: "#ffffff", border: "1px solid var(--line)", borderRadius: 8, padding: "7px 11px", fontSize: 11.5, fontWeight: 700, flexShrink: 0 }}
                  >
                    שחזור לצוות
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="pane" style={{ padding: "14px 15px", marginTop: 4 }}>
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
