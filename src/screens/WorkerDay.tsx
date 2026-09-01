import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useStore } from "../data/store";
import { V, work } from "../data/vocabulary";
import { resizeImageToBlob } from "../utils/resizeImage";
import { formatDate, formatTime, isOverdue } from "../utils/datetime";
import { isServiceNotEnabled } from "../utils/authErrors";
import { ProofButtons } from "../components/Attachments";
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
  const { loadWorkerDay, sendDayUpdate, uploadAttachment, describeUploadFailure, maxUploadBytes } = useStore();
  const [day, setDay] = useState<WorkerDaySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openTask, setOpenTask] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [local, setLocal] = useState<LocalState>({});
  /** A photo waits here for its caption instead of going straight out. The customer's
   * pack is the point of the photo, and a pack of twelve shots all called "צילום
   * מהשטח" cannot be read — but a person on a site will not fill in a form either, so
   * it is one optional line and the send button is right there. */
  const [pendingPhoto, setPendingPhoto] = useState<{ taskId: string; blob: Blob; previewUrl: string; fileName: string; mime: string } | null>(null);
  const [photoName, setPhotoName] = useState("");
  const [pending, setPending] = useState<PendingReport[]>(() => readQueue().filter((p) => p.token === token));

  // React Router navigates within the same tab, so leaving this page for another one
  // does not reload it — a blob URL created here and never revoked would sit in memory
  // for the rest of the session, not just for the moment this component happened to be
  // mounted.
  useEffect(() => {
    return () => {
      if (pendingPhoto) URL.revokeObjectURL(pendingPhoto.previewUrl);
    };
  }, [pendingPhoto]);

  // The manager can change a job after sending it, and the link is the only copy the
  // worker has. Coming back to the page — from WhatsApp, from a locked screen — is
  // exactly when it must be re-read, or a person works from instructions that changed
  // an hour ago.
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") setRefreshKey((k) => k + 1);
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    loadWorkerDay(token)
      .then((result) => {
        if (!alive) return;
        setDay(result);
        setLoading(false);
        if (!result) setError("הקישור לא נמצא או שפג תוקפו. אפשר לבקש מהמנהל לשלוח שוב.");
        if (result) {
          // A refresh must not erase what was reported since it loaded, so what is
          // already known locally wins over the older copy from the server.
          setLocal((current) =>
            Object.fromEntries(
              result.tasks.map((t) => {
                const known = current[t.taskId];
                return [
                  t.taskId,
                  {
                    ...known,
                    proofs: Math.max(known?.proofs ?? 0, t.proofCount ?? 0),
                    ack: known?.ack || t.acknowledged,
                  },
                ];
              })
            )
          );
          setOpenTask((open) => {
            if (open && result.tasks.some((t) => t.taskId === open)) return open;
            return result.tasks.find((t) => t.status !== "pending_approval")?.taskId ?? null;
          });
        }
      })
      .catch((err) => {
        console.error("Loading the day link failed:", err);
        if (!alive) return;
        setLoading(false);
        // "Check your connection" is the wrong advice for what this almost always is:
        // a Firebase switch the business has not turned on yet. The worker cannot fix
        // that, and should not be sent to fiddle with their phone over it.
        const code = (err as { code?: string })?.code ?? "";
        const message = (err as { message?: string })?.message ?? "";
        setError(
          isServiceNotEnabled(code, message)
            ? "הקישור עדיין לא פעיל אצל המנהל — צריך להפעיל את השירות בהגדרות של העסק. כדאי להראות לו את ההודעה הזו."
            : "לא הצלחנו לטעון את המשימות. בדוק/י חיבור ונסה/י שוב."
        );
      });
    return () => {
      alive = false;
    };
  }, [token, loadWorkerDay, refreshKey]);

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
          <div style={{ background: "var(--tint-2)", border: "1px solid var(--tint-2)", borderRadius: 12, padding: "12px 14px", fontSize: 12.5, color: "var(--accent-text)", lineHeight: 1.55 }}>
            {`${pending.length} דיווחים ממתינים לשליחה — יישלחו לבד ברגע שתהיה רשת. אפשר להמשיך לעבוד.`}
          </div>
        )}

        {allDone && (
          <div style={{ background: work.done, color: "#ffffff", borderRadius: 16, padding: "20px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 26 }}>🎉</div>
            <div style={{ fontSize: 16.5, fontWeight: 900, marginTop: 4 }}>סיימת הכל להיום</div>
            <div style={{ fontSize: 12.5, opacity: 0.9, marginTop: 4, lineHeight: 1.5 }}>הכל נשלח למנהל. אם תיפתח משימה חדשה — היא תופיע כאן באותו קישור.</div>
          </div>
        )}

        {day.tasks.length === 0 && (
          <div className="pane" style={{ padding: "26px 16px", textAlign: "center" }}>
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
          const messages = task.messages ?? [];
          const lastMessage = messages[messages.length - 1];

          // One job, two moves: I have it, and I have finished it. A third button in
          // between ("started") was a status the business never acted on and one more
          // thing to remember while holding a ladder, so it is gone — jobs already
          // marked started elsewhere still read as started.
          const primary = !acknowledged
            ? { label: "✅ קיבלתי", tone: "ink" as const, run: () => report(task.taskId, { kind: "ack", at: now() }, { ack: true }) }
            : { label: "🏁 סיימתי", tone: "done" as const, run: () => report(task.taskId, { kind: "done", at: now() }, { done: true }) };

          return (
            <section
              key={task.taskId}
              className="pane pane-tint"
              style={{
                "--tint": finished ? work.done : late ? work.alert : started ? work.active : work.waiting,
                opacity: finished ? 0.74 : 1,
              } as React.CSSProperties}
            >
              <button
                onClick={() => {
                  const next = isOpen ? null : task.taskId;
                  // The naming panel only renders under its own task, but the photo it
                  // is holding lives in one slot of state shared by all of them. Without
                  // this, collapsing the card — or opening a different job — didn't
                  // touch that slot: the panel just stopped rendering, the blob URL was
                  // never revoked, and picking a photo somewhere else silently
                  // overwrote it. A photo that was about to be sent has to either get
                  // sent or be visibly discarded, never disappear because a different
                  // button was tapped.
                  if (pendingPhoto && pendingPhoto.taskId !== next) {
                    URL.revokeObjectURL(pendingPhoto.previewUrl);
                    setPendingPhoto(null);
                    setPhotoName("");
                  }
                  setOpenTask(next);
                }}
                style={{ width: "100%", background: "none", border: "none", padding: "15px 16px", textAlign: "start", display: "flex", alignItems: "flex-start", gap: 10 }}
              >
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 16.5, fontWeight: 800, lineHeight: 1.35, textDecoration: finished ? "line-through" : "none" }}>{task.title}</span>
                  {/* When a manager corrects a job after sending it, this is the only
                      place the worker finds out. It was a status pill with a sentence
                      cut off at forty characters — the shape used for one-word states,
                      carrying the most important text on the card. It reads as a note
                      now: quoted, two lines before it truncates, stamped with when it
                      arrived. */}
                  {lastMessage && (
                    <span
                      style={{
                        display: "block",
                        marginTop: 8,
                        background: "#eef2ff",
                        border: "1px solid #d5dcfb",
                        borderInlineStartWidth: 3,
                        borderInlineStartColor: work.waiting,
                        borderRadius: 10,
                        padding: "8px 11px",
                      }}
                    >
                      <span style={{ display: "block", fontSize: 10.5, fontWeight: 800, color: work.waiting }}>
                        {`💬 ${lastMessage.by} · ${formatTime(lastMessage.at)}`}
                      </span>
                      <span
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          fontSize: 13,
                          lineHeight: 1.5,
                          color: "var(--ink)",
                          marginTop: 3,
                        }}
                      >
                        {lastMessage.text}
                      </span>
                    </span>
                  )}
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

                  {(task.messages ?? []).length > 0 && (
                    <div style={{ background: "#eef2ff", border: "1px solid #d5dcfb", borderRadius: 11, padding: "11px 13px" }}>
                      <div style={{ fontSize: 11.5, fontWeight: 800, color: work.waiting, marginBottom: 6 }}>הודעות מהמנהל</div>
                      {(task.messages ?? []).map((message) => (
                        <div key={message.at} style={{ fontSize: 13, lineHeight: 1.55, marginBottom: 5 }}>
                          <span style={{ fontWeight: 700 }}>{message.by}: </span>
                          {message.text}
                        </div>
                      ))}
                    </div>
                  )}

                  {(task.steps ?? []).length > 0 && (
                    <div style={{ background: "var(--muted-bg)", borderRadius: 11, padding: "11px 13px", border: "1px solid var(--border)" }}>
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
                          <div style={{ background: "var(--tint-2)", border: "1px solid var(--tint-2)", borderRadius: 11, padding: "12px 13px", fontSize: 12.5, color: "var(--accent-text)", lineHeight: 1.55 }}>
                            לפני סגירה צריך לצרף תמונה או הערה — זה מה שנשמר ליומן ולתיק שנשלח ללקוח.
                          </div>
                          <BigButton label="🏁 סיימתי" tone="done" disabled onClick={() => {}} />
                        </>
                      ) : (
                        <BigButton label={primary.label} tone={primary.tone} disabled={busy} onClick={primary.run} />
                      )}

                      {pendingPhoto?.taskId === task.taskId ? (
                        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 13, padding: 11, display: "flex", flexDirection: "column", gap: 9 }}>
                          <img src={pendingPhoto.previewUrl} alt="" style={{ width: "100%", maxHeight: 190, objectFit: "cover", borderRadius: 9, display: "block" }} />
                          <input
                            value={photoName}
                            onChange={(e) => setPhotoName(e.target.value)}
                            placeholder="מה רואים בתמונה? (למשל: סניף רמת גן, אחרי התיקון)"
                            style={{ padding: "12px 13px", borderRadius: 10, border: "1px solid var(--line)", fontSize: 14 }}
                          />
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={async () => {
                                const name = photoName.trim();
                                const { blob, fileName, mime } = pendingPhoto;
                                setBusy(true);
                                setError("");
                                try {
                                  const stored = await uploadAttachment(`day/${task.taskId}`, new File([blob], fileName, { type: mime }));
                                  URL.revokeObjectURL(pendingPhoto.previewUrl);
                                  setPendingPhoto(null);
                                  setPhotoName("");
                                  await report(
                                    task.taskId,
                                    {
                                      kind: "photo",
                                      at: now(),
                                      ...(name ? { name } : {}),
                                      file: { name: stored.name, url: stored.url, path: stored.path, mime: stored.mime, size: stored.size },
                                    },
                                    { proofs: state(task.taskId).proofs + 1 }
                                  );
                                } catch (err) {
                                  console.error("Uploading the photo failed:", err);
                                  setError(describeUploadFailure(err));
                                  setBusy(false);
                                }
                              }}
                              disabled={busy}
                              style={{ flex: 1, background: work.ink, color: "#ffffff", border: "none", borderRadius: 10, padding: "13px", fontSize: 14, fontWeight: 800, opacity: busy ? 0.5 : 1 }}
                            >
                              {busy ? "שולח…" : "שליחת התמונה"}
                            </button>
                            <button
                              onClick={() => {
                                URL.revokeObjectURL(pendingPhoto.previewUrl);
                                setPendingPhoto(null);
                                setPhotoName("");
                              }}
                              disabled={busy}
                              style={{ background: "none", border: "1px solid var(--line)", borderRadius: 10, padding: "0 16px", fontSize: 13, fontWeight: 700, color: "var(--ink-soft)" }}
                            >
                              ביטול
                            </button>
                          </div>
                          {/* Naming it is worth a moment but never worth losing the shot
                              over, so sending without a name stays one tap away. When a
                              customer's site is a stop rather than a job — twenty
                              branches on one visit — the name IS the address: every
                              photo of "סניף רמת גן" lands together in the report. */}
                          <div style={{ fontSize: 11, color: "var(--ink-faint)" }}>אפשר לשלוח גם בלי שם — השם עוזר בתיק שנשלח ללקוח.</div>
                        </div>
                      ) : (
                      <ProofButtons
                        busy={busy}
                        onPicked={async (file) => {
                          setBusy(true);
                          setError("");
                          try {
                            if (file.type.startsWith("image/")) {
                              // Resized but not uploaded yet — the shot is only kept once
                              // it is named and confirmed, so there is nothing on the
                              // server to clean up if the person cancels.
                              const blob = await resizeImageToBlob(file);
                              setPendingPhoto({ taskId: task.taskId, blob, previewUrl: URL.createObjectURL(blob), fileName: file.name || "photo.jpg", mime: blob.type });
                              setPhotoName("");
                              setBusy(false);
                              return;
                            }
                            // Drive hands over an empty shell for a Doc or a Sheet
                            // rather than a file, and an upload of nothing fails with
                            // nothing to show for it. Say which file and why.
                            if (file.size === 0) {
                              setError("קובץ Google (Docs/Sheets) לא נשלח ישירות מהטלפון. אפשר לייצא ל-PDF ולשלוח, או לצלם.");
                              setBusy(false);
                              return;
                            }
                            if (file.size > maxUploadBytes) {
                              setError(`הקובץ גדול מדי (עד ${Math.round(maxUploadBytes / 1024 / 1024)}MB).`);
                              setBusy(false);
                              return;
                            }
                            const stored = await uploadAttachment(`day/${task.taskId}`, file);
                            await report(
                              task.taskId,
                              { kind: "file", at: now(), file: { name: stored.name, url: stored.url, path: stored.path, mime: stored.mime, size: stored.size } },
                              { proofs: state(task.taskId).proofs + 1 }
                            );
                          } catch (err) {
                            console.error("Sending the evidence failed:", err);
                            setError(describeUploadFailure(err));
                            setBusy(false);
                          }
                        }}
                      />
                      )}

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
    <div className="screen work-ground">
      <div className="hero" style={{ padding: "13px 18px 14px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: 11,
              background: "rgba(255,255,255,0.16)",
              border: "1px solid rgba(255,255,255,0.22)",
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
            <span
              className="display"
              style={{ display: "block", fontSize: 19, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {company ?? V.appName}
            </span>
            {workerName && <span style={{ display: "block", fontSize: 12.5, color: work.onDark, marginTop: 2 }}>{`המשימות של ${workerName}`}</span>}
          </span>
        </div>

        {!!total && total > 0 && (
          <div style={{ marginTop: 11 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: work.onDark, marginBottom: 5 }}>
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
  // The most important button in the product, and it was still painted in the retired
  // glass gradients — three of them, one carrying a navy that no longer exists in the
  // palette. Flat and solid reads further at arm's length on a site than a gradient
  // does: what makes it obvious is its size and its colour against a quiet card, not
  // the light baked into it.
  const background =
    tone === "active" ? work.active : tone === "done" ? work.done : tone === "ink" ? work.ink : "var(--card)";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="display"
      style={{
        width: "100%",
        background,
        color: tone === "plain" ? "var(--ink)" : "#ffffff",
        border: tone === "plain" ? "1px solid var(--border)" : "none",
        borderRadius: 15,
        padding: "19px",
        fontSize: 17.5,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {label}
    </button>
  );
}

