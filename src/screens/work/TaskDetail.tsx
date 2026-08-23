import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "../../components/Header";
import { useStore } from "../../data/store";
import { V, activityLabels, priorityColor, priorityLabels, recurrenceLabels, taskStatusColor, taskStatusLabels, work } from "../../data/vocabulary";
import { formatDate, formatDateTime, formatTime, isOverdue } from "../../utils/datetime";
import { resizeImageToDataUrl } from "../../utils/resizeImage";
import { fileIcon, formatBytes } from "../../utils/files";
import type { Attachment } from "../../data/types";


/**
 * One task, in full: the brief and its reference files, the evidence attached on
 * completion, the conversation, and the immutable activity trail. Everything a
 * manager needs to prove what was asked, what was done, and when.
 */
export function TaskDetail() {
  const { workerId = "", taskId = "" } = useParams();
  const { state, dispatch, uploadAttachment, describeUploadFailure, maxUploadBytes } = useStore();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [comment, setComment] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const worker = state.family.children[workerId];
  const task = worker?.tasks.find((t) => t.id === taskId);
  const isManager = state.role === "parent";
  const actor = isManager ? state.family.parentName || V.admin : worker?.name || V.worker;

  if (!worker || !task) {
    return (
      <div className="screen">
        <Header title={V.task} back tint="pro" />
        <div style={{ padding: 24, color: "var(--ink-faint)", fontSize: 13.5 }}>המשימה לא נמצאה.</div>
      </div>
    );
  }

  // Re-bound as consts so the narrowing above survives inside the callbacks below.
  const activeTask = task;
  const activeWorker = worker;
  const overdue = isOverdue(task.dueAt, task.status);
  const steps = task.checklist ?? [];
  const doneSteps = steps.filter((i) => i.done).length;
  const stepPercent = steps.length === 0 ? 0 : Math.round((doneSteps / steps.length) * 100);
  // Steps are the worker's running record of the job, so they stay editable until the
  // work is approved — after that the task is a closed document.
  const canTick = task.status !== "completed";
  // Only the newest occurrence of a series carries the repeat rule forward, so it is
  // the only one from which the series can be stopped or resumed.
  const isSeriesHead =
    !!task.seriesId &&
    !activeWorker.tasks.some(
      (o) => o.seriesId === task.seriesId && o.id !== task.id && (Date.parse(o.dueAt ?? "") || 0) > (Date.parse(task.dueAt ?? "") || 0)
    );

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setUploadError("");
    try {
      const target = isManager ? "brief" : "proof";
      // Photos stay inline as a compressed data URL: they are small once resized, they
      // load with the record, and every one already stored is in that form. Real
      // documents go to Storage — a PDF has no lossy version, and putting one inside
      // the database record would blow past its size limit.
      if (file.type.startsWith("image/")) {
        const content = await resizeImageToDataUrl(file, 900, 0.75);
        dispatch({ type: "ADD_TASK_ATTACHMENT", childId: activeWorker.id, taskId: activeTask.id, target, kind: "image", name: file.name, content, by: actor });
        return;
      }
      if (file.size > maxUploadBytes) {
        setUploadError(`הקובץ גדול מדי (עד ${Math.round(maxUploadBytes / 1024 / 1024)}MB)`);
        return;
      }
      const stored = await uploadAttachment(`tasks/${activeTask.id}`, file);
      dispatch({
        type: "ADD_TASK_ATTACHMENT",
        childId: activeWorker.id,
        taskId: activeTask.id,
        target,
        kind: "file",
        name: stored.name,
        content: stored.url,
        path: stored.path,
        size: stored.size,
        mime: stored.mime,
        by: actor,
      });
    } catch (err) {
      console.error("Attachment upload failed:", err);
      setUploadError(describeUploadFailure(err));
    } finally {
      setBusy(false);
    }
  }

  function addNote() {
    if (!note.trim()) return;
    dispatch({ type: "ADD_TASK_ATTACHMENT", childId: activeWorker.id, taskId: activeTask.id, target: "proof", kind: "note", name: "הערת ביצוע", content: note.trim(), by: actor });
    setNote("");
  }

  function addComment() {
    if (!comment.trim()) return;
    dispatch({ type: "ADD_TASK_COMMENT", childId: activeWorker.id, taskId: activeTask.id, text: comment.trim(), by: actor });
    setComment("");
  }

  return (
    <div className="screen">
      <Header title={task.title} subtitle={`${worker.name}${task.site ? ` · ${task.site}` : ""}`} back tint="pro" />

      <div style={{ padding: "16px 20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* status strip */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Chip text={taskStatusLabels[task.status]} color={taskStatusColor[task.status]} solid />
          {task.priority && <Chip text={priorityLabels[task.priority]} color={priorityColor[task.priority]} />}
          {task.recurrence && task.recurrence !== "none" && <Chip text={recurrenceLabels[task.recurrence]} color="#2f7fd1" />}
          {task.dueAt && <Chip text={`יעד: ${formatDate(task.dueAt)}`} color={overdue ? work.alert : work.idle} solid={overdue} />}
          {task.autoGenerated && <Chip text="נוצרה אוטומטית" color={work.idle} />}
          {task.seriesStoppedAt && <Chip text="הסדרה הופסקה" color={work.alert} />}
        </div>

        {/* brief */}
        <Panel title={V.brief}>
          <div style={{ fontSize: 13.5, lineHeight: 1.6, color: task.brief ? "var(--ink)" : "var(--ink-faint)" }}>{task.brief || "לא נכתב פירוט."}</div>
          <AttachmentList items={task.briefAttachments ?? []} empty="אין קבצים מצורפים לפירוט." />
        </Panel>

        {/* checklist */}
        {(task.checklist ?? []).length > 0 && (
          <Panel title={`שלבי ביצוע · ${doneSteps}/${(task.checklist ?? []).length}`}>
            <div style={{ height: 5, borderRadius: 999, background: "var(--line-soft)", overflow: "hidden", marginBottom: 10 }}>
              <div style={{ height: "100%", width: `${stepPercent}%`, background: stepPercent === 100 ? work.done : work.ink, borderRadius: 999 }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {(task.checklist ?? []).map((item) => (
                <button
                  key={item.id}
                  onClick={() => canTick && dispatch({ type: "TOGGLE_CHECKLIST_ITEM", childId: activeWorker.id, taskId: activeTask.id, itemId: item.id, by: actor })}
                  disabled={!canTick}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    background: "none",
                    border: "none",
                    padding: "7px 2px",
                    textAlign: "start",
                    width: "100%",
                    cursor: canTick ? "pointer" : "default",
                  }}
                >
                  <span
                    style={{
                      width: 19,
                      height: 19,
                      borderRadius: 6,
                      flexShrink: 0,
                      border: item.done ? "none" : "1.5px solid var(--line)",
                      background: item.done ? work.done : "#ffffff",
                      color: "#ffffff",
                      fontSize: 12,
                      fontWeight: 900,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {item.done ? "✓" : ""}
                  </span>
                  <span style={{ flex: 1, fontSize: 13, color: item.done ? "var(--ink-faint)" : "var(--ink)", textDecoration: item.done ? "line-through" : "none" }}>
                    {item.text}
                  </span>
                  {item.done && item.doneAt && <span style={{ fontSize: 10.5, color: "var(--ink-faint)" }}>{formatTime(item.doneAt)}</span>}
                </button>
              ))}
            </div>
          </Panel>
        )}

        {/* proof */}
        <Panel title={V.proof}>
          <AttachmentList items={task.proofs ?? []} empty="טרם צורפו אסמכתאות." />
          {task.status !== "completed" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="תיאור מה בוצע…"
                  style={{ flex: 1, padding: "9px 12px", borderRadius: 9, border: "1px solid var(--line)", fontSize: 13 }}
                />
                <button onClick={addNote} disabled={!note.trim()} style={btnStyle(!note.trim())}>
                  הוספה
                </button>
              </div>
              <button onClick={() => fileRef.current?.click()} disabled={busy} style={{ ...btnStyle(busy), background: "#ffffff", color: "var(--ink)", border: "1px solid var(--line)" }}>
                {busy ? "מעלה…" : "📎 צירוף תמונה או קובץ"}
              </button>
              <input ref={fileRef} type="file" onChange={onPickFile} style={{ display: "none" }} />
              {uploadError && <div style={{ fontSize: 12, color: work.alert }}>{uploadError}</div>}
            </div>
          )}
        </Panel>

        {/* actions */}
        <div style={{ display: "flex", gap: 8 }}>
          {!isManager && task.status === "available" && (
            <button onClick={() => dispatch({ type: "ADVANCE_TASK", childId: worker.id, taskId: task.id, by: actor })} style={btnStyle(false)}>
              התחלת ביצוע
            </button>
          )}
          {!isManager && task.status === "in_progress" && (
            <button onClick={() => dispatch({ type: "ADVANCE_TASK", childId: worker.id, taskId: task.id, by: actor })} style={btnStyle(false)}>
              הגשה לאישור
            </button>
          )}
          {isManager && task.status === "pending_approval" && (
            <>
              <button onClick={() => dispatch({ type: "APPROVE_TASK", childId: worker.id, taskId: task.id, by: actor })} style={{ ...btnStyle(false), flex: 1 }}>
                אישור
              </button>
              <button
                onClick={() => {
                  const reason = prompt("סיבת ההחזרה לתיקון:") ?? undefined;
                  dispatch({ type: "REOPEN_TASK", childId: worker.id, taskId: task.id, reason, by: actor });
                }}
                style={{ ...btnStyle(false), flex: 1, background: "#ffffff", color: work.alert, border: `1px solid ${work.alert}` }}
              >
                החזרה לתיקון
              </button>
            </>
          )}
        </div>

        {/* the repeat rule, and the switch that ends it */}
        {isManager && isSeriesHead && (
          <Panel title="משימה קבועה">
            <div style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.6, marginBottom: 10 }}>
              {task.seriesStoppedAt
                ? "הסדרה הופסקה — לא ייווצרו מופעים חדשים."
                : `תדירות ${recurrenceLabels[task.recurrence ?? "none"]} — המופע הבא ייווצר אוטומטית ביום היעד שלו.`}
            </div>
            <button
              onClick={() =>
                dispatch({
                  type: task.seriesStoppedAt ? "RESUME_TASK_SERIES" : "STOP_TASK_SERIES",
                  childId: activeWorker.id,
                  taskId: activeTask.id,
                  by: actor,
                })
              }
              style={{
                ...btnStyle(false),
                width: "100%",
                background: "#ffffff",
                color: task.seriesStoppedAt ? work.done : work.alert,
                border: `1px solid ${task.seriesStoppedAt ? work.done : work.alert}`,
              }}
            >
              {task.seriesStoppedAt ? "חידוש המשימה הקבועה" : "הפסקת המשימה הקבועה"}
            </button>
          </Panel>
        )}

        {/* comments */}
        <Panel title="הערות">
          {(task.comments ?? []).length === 0 && <div style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>אין הערות עדיין.</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(task.comments ?? []).map((c) => (
              <div key={c.id} style={{ background: "var(--paper)", borderRadius: 9, padding: "8px 11px" }}>
                <div style={{ fontSize: 13, color: "var(--ink)" }}>{c.text}</div>
                <div style={{ fontSize: 10.5, color: "var(--ink-faint)", marginTop: 3 }}>
                  {c.by} · {formatDateTime(c.at)}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addComment()}
              placeholder="כתיבת הערה…"
              style={{ flex: 1, padding: "9px 12px", borderRadius: 9, border: "1px solid var(--line)", fontSize: 13 }}
            />
            <button onClick={addComment} disabled={!comment.trim()} style={btnStyle(!comment.trim())}>
              שליחה
            </button>
          </div>
        </Panel>

        {/* audit trail */}
        <Panel title="יומן פעילות">
          {(task.activity ?? []).length === 0 && <div style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>אין רישומים.</div>}
          {(task.activity ?? [])
            .slice()
            .reverse()
            .map((a) => (
              <div key={a.id} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--line-soft)" }}>
                <span style={{ fontSize: 11.5, color: "var(--ink-faint)", minWidth: 96 }}>{formatDateTime(a.at)}</span>
                <span style={{ fontSize: 12.5, color: "var(--ink)", flex: 1 }}>
                  {a.by ? `${a.by} — ` : ""}
                  {activityLabels[a.action] ?? a.action}
                  {a.detail ? ` (${a.detail})` : ""}
                </span>
              </div>
            ))}
        </Panel>

        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: "var(--ink-soft)", fontSize: 13, fontWeight: 700, padding: 8 }}>
          חזרה
        </button>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ background: "#ffffff", border: "1px solid var(--line)", borderRadius: 12, padding: "13px 15px" }}>
      <h2 style={{ fontSize: 12.5, fontWeight: 800, color: "var(--ink-soft)", margin: "0 0 9px" }}>{title}</h2>
      {children}
    </section>
  );
}

function Chip({ text, color, solid }: { text: string; color: string; solid?: boolean }) {
  return (
    <span
      style={{
        fontSize: 11.5,
        fontWeight: 700,
        padding: "4px 10px",
        borderRadius: 999,
        color: solid ? "#ffffff" : color,
        background: solid ? color : "transparent",
        border: `1px solid ${color}`,
      }}
    >
      {text}
    </span>
  );
}

function AttachmentList({ items, empty }: { items: Attachment[]; empty: string }) {
  if (items.length === 0) return <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 8 }}>{empty}</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
      {items.map((a) => (
        <div key={a.id} style={{ background: "var(--paper)", borderRadius: 9, padding: 9 }}>
          {a.kind === "image" ? (
            <img src={a.content} alt={a.name} style={{ width: "100%", borderRadius: 7, display: "block" }} />
          ) : a.kind === "file" ? (
            // A stored file is a thing to open, not a URL to read.
            <a
              href={a.content}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "var(--ink)" }}
            >
              <span style={{ fontSize: 17, flexShrink: 0 }}>{fileIcon(a.mime)}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
                <span style={{ display: "block", fontSize: 10.5, color: "var(--ink-faint)", marginTop: 1 }}>{formatBytes(a.size)} · פתיחה</span>
              </span>
            </a>
          ) : (
            <div style={{ fontSize: 13, color: "var(--ink)" }}>{a.content}</div>
          )}
          <div style={{ fontSize: 10.5, color: "var(--ink-faint)", marginTop: 5 }}>
            {a.addedBy} · {formatDateTime(a.addedAt)}
          </div>
        </div>
      ))}
    </div>
  );
}

function btnStyle(disabled: boolean): React.CSSProperties {
  return {
    background: disabled ? "rgba(15,33,29,0.10)" : work.ink,
    color: disabled ? "var(--ink-faint)" : "#ffffff",
    border: "none",
    borderRadius: 9,
    padding: "10px 16px",
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
  };
}
