import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "../../components/Header";
import { useStore, useWorkView } from "../../data/store";
import { childrenList } from "../../data/family";
import { V, activityLabels, priorityColor, priorityLabels, recurrenceLabels, taskStatusColor, taskStatusLabels, work } from "../../data/vocabulary";
import { formatDate, formatDateTime, formatTime, isOverdue } from "../../utils/datetime";
import { AttachButton, AttachmentList } from "../../components/Attachments";
import type { Child, TaskItem, TaskPriority } from "../../data/types";


/**
 * One task, in full: the brief and its reference files, the evidence attached on
 * completion, the conversation, and the immutable activity trail. Everything a
 * manager needs to prove what was asked, what was done, and when.
 */
export function TaskDetail() {
  const { workerId = "", taskId = "" } = useParams();
  const { state, connection, dispatch } = useStore();
  const navigate = useNavigate();
  const [comment, setComment] = useState("");
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(false);

  const worker = state.family.children[workerId];
  const task = worker?.tasks.find((t) => t.id === taskId);
  const { isManager, isWorker, isPreview } = useWorkView();
  // Whose name goes in the trail is a question about who you ARE, never about which
  // side you are looking at. Deriving it from the view meant a manager commenting from
  // the worker preview would be recorded as the worker — the precise falsification
  // this screen exists to prevent.
  const actor = state.role === "parent" ? state.family.parentName || V.admin : worker?.name || V.worker;

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

  function attach(target: "brief" | "proof") {
    return (draft: { kind: "image" | "file" | "note"; name: string; content: string; path?: string; size?: number; mime?: string }) =>
      dispatch({ type: "ADD_TASK_ATTACHMENT", childId: activeWorker.id, taskId: activeTask.id, target, ...draft, by: actor });
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
        {/* Preview hides every control on purpose, which looks identical to a broken
            screen. The banner has to say so and offer the one tap back. */}
        {isPreview && (
          <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 13px", fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.55 }}>
            {`תצוגת ${V.worker} — כך המסך נראה אצלו. הפעולות שמורות ל${V.worker} עצמו, כדי שהיומן ירשום מי באמת ביצע.`}
            <button
              onClick={() => dispatch({ type: "SET_VIEW_MODE", mode: "parent" })}
              style={{ display: "block", marginTop: 8, background: work.ink, color: "#ffffff", border: "none", borderRadius: 8, padding: "8px 12px", fontSize: 12.5, fontWeight: 800 }}
            >
              {`חזרה לתצוגת ${V.admin} — לצירוף קבצים ועריכה`}
            </button>
          </div>
        )}

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
        <Panel
          title={V.brief}
          right={
            isManager && task.status !== "completed" ? (
              <button
                onClick={() => setEditing((v) => !v)}
                style={{ background: "none", border: "none", color: work.waiting, fontSize: 12.5, fontWeight: 800, padding: 0 }}
              >
                {editing ? "סגירה" : "עריכה"}
              </button>
            ) : undefined
          }
        >
          {editing ? (
            <TaskEditor
              task={activeTask}
              worker={activeWorker}
              workers={childrenList(state.family)}
              actor={actor}
              onDone={() => setEditing(false)}
            />
          ) : (
          <>
          <div style={{ fontSize: 13.5, lineHeight: 1.6, color: task.brief ? "var(--ink)" : "var(--ink-faint)" }}>{task.brief || "לא נכתב פירוט."}</div>
          <AttachmentList items={task.briefAttachments ?? []} empty="אין קבצים מצורפים לפירוט." />
          {isManager && task.status !== "completed" && (
            <AttachButton folder={`tasks/${activeTask.id}`} label="📎 צירוף תמונה או קובץ להנחיות" onAttached={attach("brief")} />
          )}
          {/* Which account you are signed in as is invisible until something you expect
              to see is missing. Say it here, where the missing control is. */}
          {isWorker && (
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 10, lineHeight: 1.55 }}>
              {`צירוף קבצים להנחיות שמור ל${V.admin}. אתה מחובר כ${V.worker}${connection.signedInAs ? ` (${connection.signedInAs})` : ""} — האסמכתאות שלך מצורפות בכרטיס "${V.proof}" למטה.`}
            </div>
          )}
          {/* An absent control with no explanation reads as a broken screen. */}
          {isManager && task.status === "completed" && (
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 10 }}>
              המשימה אושרה וסגורה — לא ניתן לצרף לה קבצים נוספים.
            </div>
          )}
          </>
          )}
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

        {/* proof — the worker's evidence, and only the worker adds to it */}
        <Panel title={V.proof}>
          <AttachmentList items={task.proofs ?? []} empty="טרם צורפו אסמכתאות." />
          {isWorker && task.status !== "completed" && (
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
              <AttachButton folder={`tasks/${activeTask.id}`} onAttached={attach("proof")} />
            </div>
          )}
          {isManager && task.status !== "completed" && (
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 10, lineHeight: 1.5 }}>
              {`את האסמכתאות מצרף ה${V.worker} בסיום. לצירוף קובץ מצדך — בכרטיס "${V.brief}" למעלה.`}
            </div>
          )}
        </Panel>

        {/* actions */}
        <div style={{ display: "flex", gap: 8 }}>
          {isWorker && task.status === "available" && (
            <button onClick={() => dispatch({ type: "ADVANCE_TASK", childId: worker.id, taskId: task.id, by: actor })} style={btnStyle(false)}>
              התחלת ביצוע
            </button>
          )}
          {isWorker && task.status === "in_progress" && (
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

function Panel({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ background: "#ffffff", border: "1px solid var(--line)", borderRadius: 12, padding: "13px 15px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, margin: "0 0 9px" }}>
        <h2 style={{ fontSize: 12.5, fontWeight: 800, color: "var(--ink-soft)", margin: 0 }}>{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

/**
 * Changing a task after it has been written: the wording, when it is due, how urgent
 * it is, who it belongs to, and what its steps are.
 *
 * Every change is written into the trail naming the field that moved, because a log
 * that says only "updated" cannot answer the question the log exists for. Deleting is
 * offered only while nobody has started — after that the task has a history, and
 * destroying a history is the one thing this product must not make easy.
 */
function TaskEditor({
  task,
  worker,
  workers,
  actor,
  onDone,
}: {
  task: TaskItem;
  worker: Child;
  workers: Child[];
  actor: string;
  onDone: () => void;
}) {
  const { dispatch } = useStore();
  const navigate = useNavigate();
  const [title, setTitle] = useState(task.title);
  const [brief, setBrief] = useState(task.brief ?? "");
  const [due, setDue] = useState(task.dueAt ? task.dueAt.slice(0, 10) : "");
  const [priority, setPriority] = useState<TaskPriority>(task.priority ?? "normal");
  const [site, setSite] = useState(task.site ?? "");
  const [step, setStep] = useState("");

  function save() {
    if (!title.trim()) return;
    dispatch({
      type: "UPDATE_TASK",
      childId: worker.id,
      taskId: task.id,
      title,
      brief,
      // A date input gives a bare day; anchor it to end of day so "due today" is not
      // already overdue at one minute past midnight.
      dueAt: due ? new Date(`${due}T23:59:59`).toISOString() : undefined,
      priority,
      site,
      by: actor,
    });
    onDone();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="מה צריך לעשות" style={editField} />
      <textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={3} placeholder="פירוט" style={{ ...editField, fontFamily: "inherit", resize: "vertical" }} />
      <input type="date" value={due} onChange={(e) => setDue(e.target.value)} style={editField} />
      <input value={site} onChange={(e) => setSite(e.target.value)} placeholder={V.site} style={editField} />

      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {(["low", "normal", "high", "urgent"] as TaskPriority[]).map((p) => (
          <button
            key={p}
            onClick={() => setPriority(p)}
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              border: priority === p ? "none" : "1px solid var(--line)",
              background: priority === p ? priorityColor[p] : "#ffffff",
              color: priority === p ? "#ffffff" : "var(--ink-soft)",
            }}
          >
            {priorityLabels[p]}
          </button>
        ))}
      </div>

      {workers.length > 1 && (
        <>
          <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 2 }}>{`העברה ל${V.worker} אחר — המשימה עוברת עם כל ההיסטוריה שלה`}</div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {workers.map((o) => (
              <button
                key={o.id}
                onClick={() => {
                  if (o.id === worker.id) return;
                  dispatch({ type: "REASSIGN_TASK", fromChildId: worker.id, toChildId: o.id, taskId: task.id, by: actor });
                  navigate(`/work/task/${o.id}/${task.id}`, { replace: true });
                  onDone();
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  border: o.id === worker.id ? "none" : "1px solid var(--line)",
                  background: o.id === worker.id ? work.ink : "#ffffff",
                  color: o.id === worker.id ? "#ffffff" : "var(--ink-soft)",
                }}
              >
                {o.name}
              </button>
            ))}
          </div>
        </>
      )}

      <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 2 }}>שלבי ביצוע</div>
      {(task.checklist ?? []).map((i) => (
        <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--paper)", borderRadius: 8, padding: "6px 10px" }}>
          <span style={{ flex: 1, fontSize: 12.5 }}>{i.text}</span>
          <button
            onClick={() => dispatch({ type: "REMOVE_CHECKLIST_ITEM", childId: worker.id, taskId: task.id, itemId: i.id })}
            aria-label={`הסרת ${i.text}`}
            style={{ background: "none", border: "none", color: work.alert, fontSize: 15, fontWeight: 800, padding: "0 4px" }}
          >
            ×
          </button>
        </div>
      ))}
      <div style={{ display: "flex", gap: 6 }}>
        <input
          value={step}
          onChange={(e) => setStep(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            if (!step.trim()) return;
            dispatch({ type: "ADD_CHECKLIST_ITEM", childId: worker.id, taskId: task.id, text: step });
            setStep("");
          }}
          placeholder="שלב חדש"
          style={{ ...editField, marginBottom: 0 }}
        />
        <button
          onClick={() => {
            if (!step.trim()) return;
            dispatch({ type: "ADD_CHECKLIST_ITEM", childId: worker.id, taskId: task.id, text: step });
            setStep("");
          }}
          style={{ background: "#ffffff", border: "1px solid var(--line)", borderRadius: 9, padding: "0 14px", fontSize: 12.5, fontWeight: 700, color: "var(--ink)", flexShrink: 0 }}
        >
          הוספה
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button onClick={save} disabled={!title.trim()} style={{ ...btnStyle(!title.trim()), flex: 1 }}>
          שמירת השינויים
        </button>
        <button onClick={onDone} style={{ ...btnStyle(false), flex: 1, background: "#ffffff", color: "var(--ink)", border: "1px solid var(--line)" }}>
          ביטול
        </button>
      </div>

      {task.status === "available" && (
        <button
          onClick={() => {
            if (!window.confirm(`למחוק את "${task.title}"? המשימה טרם התחילה, אז אין לה תיעוד לאבד.`)) return;
            dispatch({ type: "DELETE_TASK", childId: worker.id, taskId: task.id });
            navigate("/work/tasks", { replace: true });
          }}
          style={{ background: "none", border: "none", color: work.alert, fontSize: 12.5, fontWeight: 700, padding: "6px 0" }}
        >
          מחיקת המשימה
        </button>
      )}
      {task.status !== "available" && (
        <div style={{ fontSize: 11, color: "var(--ink-faint)", lineHeight: 1.5 }}>
          {`המשימה כבר בעבודה ולכן לא ניתן למחוק אותה — יש לה תיעוד. אפשר להעביר ל${V.worker} אחר או להחזיר לתיקון.`}
        </div>
      )}
    </div>
  );
}

const editField: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 9,
  border: "1px solid var(--line)",
  fontSize: 13.5,
};

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
