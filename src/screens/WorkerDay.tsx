import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useStore } from "../data/store";
import { V, work } from "../data/vocabulary";
import { resizeImageToDataUrl } from "../utils/resizeImage";
import { formatDate, isOverdue } from "../utils/datetime";
import type { LinkUpdate, WorkerDaySnapshot } from "../data/tasklink";

/**
 * One person's whole day, on one link, with no account.
 *
 * A message per task is how a WhatsApp chat becomes the mess this product exists to
 * replace: five links, four of them scrolled away by lunchtime. The manager sends one
 * message in the morning; this is what it opens.
 *
 * Everything is one tap, because the person reading it is standing on a roof holding a
 * drill. And because that roof has no reception, a report that fails to send is kept on
 * the phone and sent by itself later — the worker is told it is waiting, and never has
 * to remember to do it again.
 */
const QUEUE_KEY = "work-it-pending-reports";

interface PendingReport {
  id: string;
  token: string;
  taskId: string;
  update: LinkUpdate;
}

function readQueue(): PendingReport[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as PendingReport[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(items: PendingReport[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  } catch {
    /* a full or blocked storage must not stop the person from working */
  }
}

export function WorkerDay() {
  const { token = "" } = useParams();
  const { loadWorkerDay, sendDayUpdate } = useStore();
  const [day, setDay] = useState<WorkerDaySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openTask, setOpenTask] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [done, setDone] = useState<Record<string, string[]>>({});
  const [pending, setPending] = useState<PendingReport[]>(() => readQueue().filter((p) => p.token === token));

  useEffect(() => {
    let alive = true;
    loadWorkerDay(token)
      .then((result) => {
        if (!alive) return;
        setDay(result);
        setLoading(false);
        if (!result) setError("הקישור לא נמצא או שפג תוקפו. אפשר לבקש מהמנהל לשלוח שוב.");
        if (result && result.tasks.length === 1) setOpenTask(result.tasks[0].taskId);
      })
      .catch((err) => {
        console.error("Loading the day link failed:", err);
        if (!alive) return;
        setLoading(false);
        setError("לא הצלחנו לטעון את המשימות. בדוק/י חיבור ונסה/י שוב.");
      });
    return () => {
      alive = false;
    };
  }, [token, loadWorkerDay]);

  // Anything that failed to send goes out again as soon as there is a connection.
  const flushQueue = useCallback(
    async (snapshot: WorkerDaySnapshot) => {
      const queued = readQueue();
      const mine = queued.filter((p) => p.token === token);
      if (mine.length === 0) return;
      const stillPending: PendingReport[] = [];
      for (const item of mine) {
        try {
          await sendDayUpdate(snapshot, item.taskId, item.update);
        } catch {
          stillPending.push(item);
        }
      }
      writeQueue([...queued.filter((p) => p.token !== token), ...stillPending]);
      setPending(stillPending);
    },
    [token, sendDayUpdate]
  );

  useEffect(() => {
    if (!day) return;
    void flushQueue(day);
    const onOnline = () => void flushQueue(day);
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [day, flushQueue]);

  async function report(taskId: string, update: LinkUpdate, label: string) {
    if (!day) return;
    setBusy(true);
    setError("");
    try {
      await sendDayUpdate(day, taskId, update);
      setDone((d) => ({ ...d, [taskId]: [...(d[taskId] ?? []), label] }));
      setNote("");
    } catch (err) {
      console.error("Sending the update failed, queued instead:", err);
      const item: PendingReport = { id: crypto.randomUUID(), token, taskId, update };
      const queue = [...readQueue(), item];
      writeQueue(queue);
      setPending(queue.filter((p) => p.token === token));
      setDone((d) => ({ ...d, [taskId]: [...(d[taskId] ?? []), `${label} (ממתין לשליחה)`] }));
      setNote("");
    } finally {
      setBusy(false);
    }
  }

  const now = () => new Date().toISOString();

  if (loading) return <Frame><div style={{ padding: 30, textAlign: "center", color: "var(--ink-soft)" }}>רגע…</div></Frame>;
  if (!day) return <Frame><div style={{ padding: "26px 22px", fontSize: 14, lineHeight: 1.6 }}>{error}</div></Frame>;

  return (
    <Frame company={day.company} subtitle={`המשימות של ${day.workerName}`}>
      <div style={{ padding: "16px 18px 34px", display: "flex", flexDirection: "column", gap: 10 }}>
        {pending.length > 0 && (
          <div style={{ background: "#fff6e5", border: "1px solid #f0d9a8", borderRadius: 11, padding: "11px 13px", fontSize: 12.5, color: "#7a5a12", lineHeight: 1.55 }}>
            {`${pending.length} דיווחים ממתינים לשליחה — הם יישלחו לבד ברגע שתהיה רשת. אפשר להמשיך לעבוד.`}
          </div>
        )}

        {day.tasks.length === 0 && (
          <div style={{ background: "#ffffff", border: "1px solid var(--line)", borderRadius: 12, padding: "22px 16px", textAlign: "center", fontSize: 13.5, color: "var(--ink-soft)" }}>
            אין משימות פתוחות כרגע. 👌
          </div>
        )}

        {day.tasks.map((task) => {
          const isOpen = openTask === task.taskId;
          const late = isOverdue(task.dueAt, task.status);
          const reported = done[task.taskId] ?? [];
          return (
            <section key={task.taskId} style={{ background: "#ffffff", border: `1px solid ${late ? "#f3c0c9" : "var(--line)"}`, borderRadius: 13, overflow: "hidden" }}>
              <button
                onClick={() => setOpenTask(isOpen ? null : task.taskId)}
                style={{ width: "100%", background: "none", border: "none", padding: "14px 15px", textAlign: "start", display: "flex", alignItems: "flex-start", gap: 10 }}
              >
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 15.5, fontWeight: 800, lineHeight: 1.35 }}>{task.title}</span>
                  <span style={{ display: "block", fontSize: 11.5, color: late ? work.alert : "var(--ink-soft)", marginTop: 4 }}>
                    {[task.site, task.dueAt ? `יעד: ${formatDate(task.dueAt)}` : "", late ? "באיחור" : "", task.status === "in_progress" ? "בביצוע" : "", task.status === "pending_approval" ? "נשלח לאישור" : ""]
                      .filter(Boolean)
                      .join(" · ") || "לביצוע"}
                  </span>
                </span>
                <span style={{ fontSize: 13, color: "var(--ink-faint)" }}>{isOpen ? "▲" : "▼"}</span>
              </button>

              {isOpen && (
                <div style={{ padding: "0 15px 15px", display: "flex", flexDirection: "column", gap: 9 }}>
                  {task.brief && <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--ink)" }}>{task.brief}</div>}
                  {(task.steps ?? []).length > 0 && (
                    <div style={{ background: "var(--paper)", borderRadius: 9, padding: "10px 12px" }}>
                      {(task.steps ?? []).map((step) => (
                        <div key={step.id} style={{ fontSize: 12.5, padding: "3px 0" }}>{`• ${step.text}`}</div>
                      ))}
                    </div>
                  )}

                  <Big label="✅ קיבלתי" onClick={() => report(task.taskId, { kind: "ack", at: now() }, "אישור קבלה")} disabled={busy} />
                  <Big label="▶️ התחלתי" onClick={() => report(task.taskId, { kind: "started", at: now() }, "התחלה")} disabled={busy} tone="active" />
                  <Big label="🏁 סיימתי" onClick={() => report(task.taskId, { kind: "done", at: now() }, "סיום")} disabled={busy} tone="done" />

                  <label style={{ ...bigStyle("plain"), textAlign: "center", cursor: "pointer", opacity: busy ? 0.5 : 1 }}>
                    📷 שליחת תמונה
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      style={{ display: "none" }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (!file) return;
                        setBusy(true);
                        try {
                          const photo = await resizeImageToDataUrl(file, 900, 0.7);
                          await report(task.taskId, { kind: "photo", at: now(), photo }, "תמונה");
                        } catch (err) {
                          console.error("Preparing the photo failed:", err);
                          setError("לא הצלחנו לצרף את התמונה. נסה/י שוב.");
                          setBusy(false);
                        }
                      }}
                    />
                  </label>

                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="הערה למנהל…"
                      style={{ flex: 1, padding: "12px 13px", borderRadius: 10, border: "1px solid var(--line)", fontSize: 13.5 }}
                    />
                    <button
                      onClick={() => report(task.taskId, { kind: "note", at: now(), note: note.trim() }, "הערה")}
                      disabled={busy || !note.trim()}
                      style={{ background: work.ink, color: "#ffffff", border: "none", borderRadius: 10, padding: "0 16px", fontSize: 13, fontWeight: 800, opacity: busy || !note.trim() ? 0.4 : 1 }}
                    >
                      שליחה
                    </button>
                  </div>

                  {reported.length > 0 && (
                    <div style={{ background: "#eaf7f2", border: "1px solid #bfe4d8", borderRadius: 10, padding: "10px 12px", fontSize: 12, color: "#2b6d5e", lineHeight: 1.6 }}>
                      {`נשלח למנהל ✓ ${reported.join(" · ")}`}
                    </div>
                  )}
                </div>
              )}
            </section>
          );
        })}

        {error && <div style={{ fontSize: 13, color: work.alert }}>{error}</div>}

        <div style={{ fontSize: 11, color: "var(--ink-faint)", lineHeight: 1.6, textAlign: "center", marginTop: 4 }}>
          {`הקישור אישי ל${day.workerName} ומתעדכן לבד. אין צורך בהתקנה או בסיסמה — כל דיווח נרשם ביומן של ${day.company}.`}
        </div>
      </div>
    </Frame>
  );
}

function Frame({ company, subtitle, children }: { company?: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="screen">
      <div style={{ background: "linear-gradient(180deg, #232a3b 0%, #1b2130 100%)", padding: "20px 18px 16px", flexShrink: 0 }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{V.appName}</div>
        <div style={{ fontSize: 17, fontWeight: 800, color: "#ffffff", marginTop: 3 }}>{company ?? "המשימות שלי"}</div>
        {subtitle && <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.7)", marginTop: 3 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function Big({ label, onClick, disabled, tone = "plain" }: { label: string; onClick: () => void; disabled?: boolean; tone?: "plain" | "active" | "done" }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...bigStyle(tone), opacity: disabled ? 0.5 : 1 }}>
      {label}
    </button>
  );
}

function bigStyle(tone: "plain" | "active" | "done"): React.CSSProperties {
  return {
    display: "block",
    width: "100%",
    background: tone === "active" ? work.active : tone === "done" ? work.done : "#ffffff",
    color: tone === "plain" ? "var(--ink)" : "#ffffff",
    border: tone === "plain" ? "1px solid var(--line)" : "none",
    borderRadius: 11,
    padding: "14px",
    fontSize: 15,
    fontWeight: 800,
  };
}
