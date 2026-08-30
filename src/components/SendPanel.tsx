import { useState } from "react";
import { useStore } from "../data/store";
import { V, work } from "../data/vocabulary";
import { newTaskMessage, crewMessage } from "../data/messages";
import { whatsAppLink, shareText, canShare } from "../utils/share";
import type { Child, TaskItem } from "../data/types";

/**
 * Getting a job to the people who have to do it.
 *
 * Two different sends, because WhatsApp treats them differently and pretending
 * otherwise is how a manager ends up hunting through their contact list:
 *
 * - To a PERSON: a wa.me link opens that chat directly — but only if their number is
 *   saved. Without it WhatsApp opens on the contact picker, so the number is asked for
 *   right here, where the send is, rather than sending the manager to another screen
 *   to fetch it.
 * - To a GROUP: impossible with wa.me at all. A group has no phone number, so no link
 *   can address one. The phone's share sheet can — it lists every chat, groups
 *   included — so the group send is a share, and on a desktop with no share sheet it
 *   falls back to copying the text.
 *
 * A crew job is handed out one person at a time, and the panel keeps the place: each
 * name ticks off as it goes out.
 */
export function SendPanel({
  workers,
  tasks,
  company,
  onSent,
}: {
  /** Everyone this job was handed to, in order. */
  workers: Child[];
  /** Their copies of it, aligned to `workers` by index. */
  tasks: TaskItem[];
  company: string;
  onSent?: (workerId: string, taskId: string) => void;
}) {
  const { dispatch } = useStore();
  const [sent, setSent] = useState<string[]>([]);
  const [phoneFor, setPhoneFor] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [shareNote, setShareNote] = useState("");

  const crew = workers.length > 1;

  return (
    <section style={{ background: "#ffffff", border: "1px solid #bfe4d8", borderRadius: 13, padding: "15px 16px", display: "flex", flexDirection: "column", gap: 11 }}>
      <div style={{ fontSize: 14.5, fontWeight: 800, color: work.done }}>
        {crew ? `✓ המשימה הוקצתה ל-${workers.length} ${V.workerPlural}` : `✓ המשימה הוקצתה ל${workers[0]?.name ?? ""}`}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {workers.map((worker, index) => {
          const task = tasks[index];
          const already = sent.includes(worker.id);
          if (!task) return null;

          if (phoneFor === worker.id) {
            return (
              <div key={worker.id} style={{ background: "var(--paper)", borderRadius: 10, padding: "11px 12px" }}>
                <div style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.5, marginBottom: 8 }}>
                  {`מספר הטלפון של ${worker.name} — נשמר, וכל שליחה הבאה תיפתח ישר בצ'אט שלו.`}
                </div>
                <div style={{ display: "flex", gap: 7 }}>
                  <input
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="05X-XXXXXXX"
                    style={{ flex: 1, padding: "10px 12px", borderRadius: 9, border: "1px solid var(--line)", fontSize: 13.5 }}
                  />
                  <button
                    onClick={() => {
                      if (phone.trim()) dispatch({ type: "SET_WORKER_PHONE", childId: worker.id, phone: phone.trim() });
                      setPhoneFor(null);
                      setPhone("");
                    }}
                    style={{ background: work.ink, color: "#ffffff", border: "none", borderRadius: 9, padding: "0 16px", fontSize: 13, fontWeight: 800 }}
                  >
                    שמירה
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div key={worker.id} style={{ display: "flex", gap: 7, alignItems: "stretch" }}>
              <a
                href={whatsAppLink(worker.phone, newTaskMessage(company, worker, task))}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  setSent((list) => (list.includes(worker.id) ? list : [...list, worker.id]));
                  dispatch({ type: "MARK_TASK_SENT", childId: worker.id, taskId: task.id, by: company });
                  onSent?.(worker.id, task.id);
                }}
                style={{
                  flex: 1,
                  textAlign: "center",
                  background: already ? "#ffffff" : "#25D366",
                  color: already ? "var(--ink-soft)" : "#ffffff",
                  border: already ? "1px solid var(--line)" : "none",
                  borderRadius: 11,
                  padding: "14px",
                  fontSize: 14.5,
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                {already ? `נשלח ל${worker.name} ✓ · שוב` : `שליחה ל${worker.name}`}
              </a>
              {!worker.phone && (
                <button
                  onClick={() => {
                    setPhoneFor(worker.id);
                    setPhone("");
                  }}
                  style={{ background: "#ffffff", border: "1px solid var(--line)", borderRadius: 11, padding: "0 13px", fontSize: 12, fontWeight: 800, color: "var(--ink)" }}
                >
                  + מספר
                </button>
              )}
            </div>
          );
        })}
      </div>

      {workers.some((w) => !w.phone) && (
        <div style={{ fontSize: 11.5, color: "var(--ink-faint)", lineHeight: 1.55 }}>
          למי שאין מספר שמור — וואטסאפ ייפתח על רשימת אנשי הקשר. "+ מספר" שומר אותו פעם אחת, ומאז השליחה נפתחת ישר בצ'אט שלו.
        </div>
      )}

      <div style={{ borderTop: "1px solid var(--line-soft)", paddingTop: 11 }}>
        <button
          onClick={async () => {
            const result = await shareText(crewMessage(company, workers, tasks[0]));
            setShareNote(
              result === "shared"
                ? "נפתח שיתוף — אפשר לבחור קבוצה"
                : result === "copied"
                  ? "ההודעה הועתקה — אפשר להדביק בקבוצה"
                  : "לא ניתן לשתף מהדפדפן הזה"
            );
          }}
          style={{ width: "100%", background: "#ffffff", border: "1px solid var(--line)", borderRadius: 11, padding: "13px", fontSize: 13.5, fontWeight: 800 }}
        >
          {canShare() ? "שליחה לקבוצת עבודה" : "העתקת ההודעה לקבוצה"}
        </button>
        <div style={{ fontSize: 11.5, color: "var(--ink-faint)", lineHeight: 1.55, marginTop: 7 }}>
          לקבוצה אין מספר טלפון, ולכן אי אפשר לפתוח אותה בקישור. הכפתור פותח את חלון השיתוף של הטלפון — שם בוחרים את הקבוצה. הודעת הקבוצה מפרטת את המשימה ומי אחראי; הקישור האישי לדיווח נשלח לכל אחד בנפרד.
        </div>
        {shareNote && <div style={{ fontSize: 12, color: work.waiting, marginTop: 7, fontWeight: 700 }}>{shareNote}</div>}
      </div>
    </section>
  );
}
