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
 * This page is the product's face: most of the people who ever touch Work It will see
 * only this, from a WhatsApp message, one-handed, on a site. So it is built around one
 * question — "what do I press NOW" — rather than a control panel. Each job shows the
 * single action its state calls for, large and unmissable; everything else is
 * secondary and smaller. A job that is finished collapses out of the way, and the day
 * has a visible end.
 *
 * A message per task is how a chat becomes the mess this replaces, so the manager
 * sends one link and it stays right as the day changes.
 *
 * The roof has no reception, so a report that fails to send is kept on the phone, the
 * person is told it is waiting, and it goes out by itself when the signal returns.
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

/** What this person has already reported in this sitting, so the page can move on to
 * the next action without waiting for the manager's app to write anything back. */
type LocalState = Record<string, { ack?: boolean; started?: boolean; done?: boolean; proofs: number }>;

export function WorkerDay() {
  const { token = "" } = useParams();
  const { loadWorkerDay, sendDayUpdate } = useStore();
  const [day, setDay] = useState<WorkerDaySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openTask, setOpenTask] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [local, setLocal] = useState<LocalState>({});
  const [pending, setPending] = useState<PendingReport[]>(() => readQueue().filter((p) => p.token === token));

  useEffect(() => {
    let alive = true;
    loadWorkerDay(token)
      .then((result) => {
        if (!alive) return;
        setDay(result);
        setLoading(false);
        if (!result) setError("הקישור לא נמצא או שפג תוקפו. אפשר לבקש מהמנהל לשלוח שוב.");
        if (result) {
          setLocal(Object.fromEntries(result.tasks.map((t) => [t.taskId, { proofs: t.proofCount ?? 0, ack: t.acknowledged }])));
          const next = result.tasks.find((t) => t.status !== "pending_approval");
          if (next) setOpenTask(next.taskId);
        }
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

  function noteLocal(taskId: string, patch: Partial<LocalState[string]>) {
    setLocal((l) => ({ ...l, [taskId]: { ...(l[taskId] ?? { proofs: 0 }), ...patch } }));
  }

  async function report(taskId: string, update: LinkUpdate, patch: Partial<LocalState[string]>) {
    if (!day) return;
    setBusy(true);
    setError("");
    try {
      await sendDayUpdate(day, taskId, update);
      noteLocal(taskId, patch);
      setNote("");
    } catch (err) {
      console.error("Sending the update failed, queued instead:", err);
      const item: PendingReport = { id: crypto.randomUUID(), token, taskId, update };
      const queue = [...readQueue(), item];
      writeQueue(queue);
      setPending(queue.filter((p) => p.token === token));
      noteLocal(taskId, patch);
      setNote("");
    } finally {
      setBusy(false);
    }
  }

  const now = () => new Date().toISOString();

  if (loading) return <Frame><div style={{ padding: 40, textAlign: "center", color: "var(--ink-soft)", fontSize: 14 }}>רגע…</div></Frame>;
  if (!day) return <Frame><div style={{ padding: "26px 22px", fontSize: 14.5, lineHeight: 1.6 }}>{error}</div></Frame>;

  const state = (taskId: string) => local[taskId] ?? { proofs: 0 };
  const isFinished = (taskId: string, status: string) => status === "pending_approval" || !!state(taskId).done;
  const finishedCount = day.tasks.filter((t) => isFinished(t.taskId, t.status)).length;
  const allDone = day.tasks.length > 0 && finishedCount === day.tasks.length;

  return (
    <Frame company={day.company} workerName={day.workerName} done={finishedCount} total={day.tasks.length}>
      <div style={{ padding: "14px 16px 34px", display: "flex", flexDirection: "column", gap: 11 }}>
        {pending.length > 0 && (
          <div style={{ background: "#fff6e5", border: "1px solid #f0d9a8", borderRadius: 12, padding: "12px 14px", fontSize: 12.5, color: "#7a5a12", lineHeight: 1.55 }}>
            {`${pending.length} דיווחים ממתינים לשליחה — יישלחו לבד ברגע שתהיה רשת. אפשר להמשיך לעבוד.`}
          </div>
        )}

        {allDone && (
          <div style={{ background: work.done, color: "#ffffff", borderRadius: 14, padding: "18px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 26 }}>🎉</div>
            <div style={{ fontSize: 16.5, fontWeight: 900, marginTop: 4 }}>סיימת הכל להיום</div>
            <div style={{ fontSize: 12.5, opacity: 0.9, marginTop: 4, lineHeight: 1.5 }}>הכל נשלח למנהל. אם תיפתח משימה חדשה — היא תופיע כאן באותו קישור.</div>
          </div>
        )}

        {day.tasks.length === 0 && (
          <div style={{ background: "#ffffff", border: "1px solid var(--line)", borderRadius: 14, padding: "26px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 26 }}>☕</div>
            <div style={{ fontSize: 14.5, fontWeight: 800, marginTop: 6 }}>אין משימות פתוחות</div>
            <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 4 }}>כשהמנהל יקצה לך משהו — זה יופיע כאן.</div>
          </div>
        )}

        {day.tasks.map((task) => {
          const mine = state(task.taskId);
          const finished = isFinished(task.taskId, task.status);
          const started = mine.started || task.status === "in_progress";
          const acknowledged = mine.ack || task.acknowledged;
          const late = isOverdue(task.dueAt, task.status);
          const isOpen = openTask === task.taskId;
          const needsProof = day.requireProof !== false && mine.proofs === 0;

          // One job, one obvious next move. Everything else is available but quiet.
          const primary = !acknowledged
            ? { label: "✅ קיבלתי", tone: "ink" as const, run: () => report(task.taskId, { kind: "ack", at: now() }, { ack: true }) }
            : !started
              ? { label: "▶️ התחלתי לעבוד", tone: "active" as const, run: () => report(task.taskId, { kind: "started", at: now() }, { started: true }) }
              : { label: "🏁 סיימתי", tone: "done" as const, run: () => report(task.taskId, { kind: "done", at: now() }, { done: true }) };

          return (
            <section
              key={task.taskId}
              style={{
                background: "#ffffff",
                border: "1px solid var(--line)",
                borderInlineStartWidth: 4,
                borderInlineStartColor: finished ? work.done : late ? work.alert : started ? work.active : work.idle,
                borderRadius: 14,
                overflow: "hidden",
                opacity: finished ? 0.72 : 1,
              }}
            >
              <button
                onClick={() => setOpenTask(isOpen ? null : task.taskId)}
                style={{ width: "100%", background: "none", border: "none", padding: "15px 16px", textAlign: "start", display: "flex", alignItems: "flex-start", gap: 10 }}
              >
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 16.5, fontWeight: 800, lineHeight: 1.35, textDecoration: finished ? "line-through" : "none" }}>{task.title}</span>
                  <span style={{ display: "block", fontSize: 12, color: late && !finished ? work.alert : "var(--ink-soft)", marginTop: 4 }}>
                    {[
                      finished ? "נשלח למנהל ✓" : started ? "בביצוע" : acknowledged ? "אישרת קבלה" : "חדש",
                      task.site,
                      task.dueAt ? `יעד: ${formatDate(task.dueAt)}` : "",
                      late && !finished ? "באיחור" : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                <span style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 4 }}>{isOpen ? "▲" : "▼"}</span>
              </button>

              {isOpen && (
                <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {task.brief && <div style={{ fontSize: 14, lineHeight: 1.6 }}>{task.brief}</div>}

                  {(task.steps ?? []).length > 0 && (
                    <div style={{ background: "var(--paper)", borderRadius: 10, padding: "11px 13px" }}>
                      <div style={{ fontSize: 11.5, fontWeight: 800, color: "var(--ink-soft)", marginBottom: 6 }}>שלבי ביצוע</div>
                      {(task.steps ?? []).map((step) => (
                        <div key={step.id} style={{ fontSize: 13.5, padding: "3px 0", lineHeight: 1.5 }}>{`• ${step.text}`}</div>
                      ))}
                    </div>
                  )}

                  {!finished && (
                    <>
                      {primary.tone === "done" && needsProof ? (
                        <>
                          <div style={{ background: "#fff6e5", border: "1px solid #f0d9a8", borderRadius: 11, padding: "12px 13px", fontSize: 12.5, color: "#7a5a12", lineHeight: 1.55 }}>
                            לפני סגירה צריך לצרף תמונה או הערה — זה מה שנשמר ליומן ולתיק שנשלח ללקוח.
                          </div>
                          <BigButton label="🏁 סיימתי" tone="done" disabled onClick={() => {}} />
                        </>
                      ) : (
                        <BigButton label={primary.label} tone={primary.tone} disabled={busy} onClick={primary.run} />
                      )}

                      <PhotoButton
                        busy={busy}
                        onPicked={async (file) => {
                          setBusy(true);
                          try {
                            const photo = await resizeImageToDataUrl(file, 900, 0.7);
                            await report(task.taskId, { kind: "photo", at: now(), photo }, { proofs: state(task.taskId).proofs + 1 });
                          } catch (err) {
                            console.error("Preparing the photo failed:", err);
                            setError("לא הצלחנו לצרף את התמונה. נסה/י שוב.");
                            setBusy(false);
                          }
                        }}
                      />

                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="הערה למנהל…"
                          style={{ flex: 1, padding: "13px 14px", borderRadius: 11, border: "1px solid var(--line)", fontSize: 14 }}
                        />
                        <button
                          onClick={() => report(task.taskId, { kind: "note", at: now(), note: note.trim() }, { proofs: state(task.taskId).proofs + 1 })}
                          disabled={busy || !note.trim()}
                          style={{ background: work.ink, color: "#ffffff", border: "none", borderRadius: 11, padding: "0 18px", fontSize: 13.5, fontWeight: 800, opacity: busy || !note.trim() ? 0.4 : 1 }}
                        >
                          שליחה
                        </button>
                      </div>

                      {acknowledged && !started && (
                        <button
                          onClick={() => report(task.taskId, { kind: "done", at: now() }, { done: true })}
                          disabled={busy || needsProof}
                          style={{ background: "none", border: "none", color: "var(--ink-soft)", fontSize: 12.5, fontWeight: 700, textDecoration: "underline", opacity: needsProof ? 0.4 : 1 }}
                        >
                          סיימתי בלי לסמן התחלה
                        </button>
                      )}
                    </>
                  )}

                  {mine.proofs > 0 && (
                    <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{`צורפו ${mine.proofs} אסמכתאות למשימה הזו.`}</div>
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

function Frame({
  company,
  workerName,
  done,
  total,
  children,
}: {
  company?: string;
  workerName?: string;
  done?: number;
  total?: number;
  children: React.ReactNode;
}) {
  const percent = total && total > 0 ? Math.round(((done ?? 0) / total) * 100) : 0;
  return (
    <div className="screen">
      <div style={{ background: "linear-gradient(180deg, #232a3b 0%, #1b2130 100%)", padding: "20px 18px 18px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: 11,
              background: "rgba(255,255,255,0.12)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 17,
              fontWeight: 900,
              flexShrink: 0,
            }}
          >
            {(company ?? "W").trim().charAt(0)}
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 17, fontWeight: 800, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {company ?? V.appName}
            </span>
            {workerName && <span style={{ display: "block", fontSize: 12.5, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{`המשימות של ${workerName}`}</span>}
          </span>
        </div>

        {!!total && total > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "rgba(255,255,255,0.75)", marginBottom: 5 }}>
              <span>{`${done} מתוך ${total} הושלמו`}</span>
              <span>{`${percent}%`}</span>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.16)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${percent}%`, background: percent === 100 ? work.done : work.onDark, borderRadius: 999, transition: "width 240ms ease" }} />
            </div>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function BigButton({ label, tone, onClick, disabled }: { label: string; tone: "ink" | "active" | "done" | "plain"; onClick: () => void; disabled?: boolean }) {
  const background = tone === "active" ? work.active : tone === "done" ? work.done : tone === "ink" ? work.ink : "#ffffff";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        background,
        color: tone === "plain" ? "var(--ink)" : "#ffffff",
        border: tone === "plain" ? "1px solid var(--line)" : "none",
        borderRadius: 13,
        padding: "18px",
        fontSize: 17,
        fontWeight: 900,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {label}
    </button>
  );
}

function PhotoButton({ busy, onPicked }: { busy: boolean; onPicked: (file: File) => void }) {
  return (
    <label
      style={{
        display: "block",
        width: "100%",
        background: "#ffffff",
        border: "1px solid var(--line)",
        borderRadius: 12,
        padding: "15px",
        fontSize: 15,
        fontWeight: 800,
        textAlign: "center",
        opacity: busy ? 0.5 : 1,
        cursor: "pointer",
      }}
    >
      📷 צילום ושליחה
      <input
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onPicked(file);
        }}
      />
    </label>
  );
}
