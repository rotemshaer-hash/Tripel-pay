import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";
import { WorkBottomNav } from "../../components/WorkBottomNav";
import { Toast, useToast } from "../../components/Toast";
import { useStore } from "../../data/store";
import { childrenList } from "../../data/family";
import { V, taskStatusColor, work } from "../../data/vocabulary";
import { formatDate, formatDateTime, isOverdue } from "../../utils/datetime";
import type { Child, TaskItem } from "../../data/types";

/**
 * Every job this business has, and what happened to it.
 *
 * The manager's home is a tracker, not a dashboard: one button to write a job, and
 * below it the jobs themselves — open ones with whether they reached the person, and
 * finished ones with the evidence attached to them. Nothing else. Sending lives where
 * sending is decided (on the job that was just written, on the person in the team
 * screen), and the record lives here.
 *
 * Order is by what needs a human: work waiting for the manager's approval first, then
 * what is late, then everything else by its due date. A list sorted by creation time
 * makes the manager do the triage the app should have done.
 */
type Filter = "open" | "done";

export function WorkBoard() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const { toastMessage, showToast } = useToast();
  const [filter, setFilter] = useState<Filter>("open");

  const workers = childrenList(state.family);
  const company = state.family.companyName || state.family.parentName;
  const actor = state.family.parentName || V.admin;

  const all: { worker: Child; task: TaskItem }[] = [];
  for (const worker of workers) for (const task of worker.tasks) all.push({ worker, task });

  const open = all.filter(({ task }) => task.status !== "completed");
  const done = all.filter(({ task }) => task.status === "completed");

  const rows = (filter === "open" ? open : done).sort((a, b) => weight(a.task) - weight(b.task));

  return (
    <div className="screen work-ground">
      <Header title="משימות" titleNote={company} subtitle={`${open.length} פתוחות · ${done.length} הושלמו`} tint="pro" />

      <div style={{ padding: "14px 18px 20px", display: "flex", flexDirection: "column", gap: 11 }}>
        <button className="press" onClick={() => navigate("/work/new")} style={{ padding: "16px", fontSize: 15.5 }}>
          + {V.task} חדשה
        </button>

        <div style={{ display: "flex", gap: 6 }}>
          <Tab label={`פתוחות · ${open.length}`} active={filter === "open"} onClick={() => setFilter("open")} />
          <Tab label={`הושלמו · ${done.length}`} active={filter === "done"} onClick={() => setFilter("done")} />
        </div>

        {rows.length === 0 && (
          <div className="pane" style={{ padding: "22px 16px" }}>
            <div style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 6 }}>
              {filter === "open" ? "אין משימות פתוחות" : "עוד לא הושלמה אף משימה"}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.65 }}>
              {filter === "open"
                ? `כל משימה שתכתוב תופיע כאן, ולידה מה קרה איתה: נשלחה, נצפתה, אושרה, בביצוע או הוגשה.`
                : `כשמשימה מאושרת היא עוברת לכאן עם כל מה שנצבר עליה — מי ביצע, מתי, והתמונות שצורפו.`}
            </div>
          </div>
        )}

        {rows.map(({ worker, task }) => (
          <div
            key={`${worker.id}-${task.id}`}
            className="pane pane-tint"
            style={{ "--tint": accentOf(task) } as React.CSSProperties}
          >
            <button
              onClick={() => navigate(`/work/task/${worker.id}/${task.id}`)}
              style={{ width: "100%", background: "none", border: "none", padding: "13px 15px", textAlign: "start", display: "flex", alignItems: "flex-start", gap: 10 }}
            >
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 14.5, fontWeight: 800, lineHeight: 1.35 }}>{task.title}</span>
                <span style={{ display: "block", fontSize: 11.5, color: isOverdue(task.dueAt, task.status) ? work.alert : "var(--ink-soft)", marginTop: 3 }}>
                  {[
                    worker.name,
                    task.site,
                    task.status === "completed"
                      ? task.approvedAt
                        ? `הושלמה ${formatDateTime(task.approvedAt)}`
                        : "הושלמה"
                      : task.dueAt
                        ? `יעד ${formatDate(task.dueAt)}`
                        : "",
                    isOverdue(task.dueAt, task.status) ? "באיחור" : "",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                {/* The record itself, at a glance: what this job can prove. */}
                {((task.proofs ?? []).length > 0 || (task.briefAttachments ?? []).length > 0) && (
                  <span style={{ display: "block", fontSize: 11, color: "var(--ink-faint)", marginTop: 3 }}>
                    {[
                      (task.proofs ?? []).length > 0 ? `${(task.proofs ?? []).length} אסמכתאות` : "",
                      (task.briefAttachments ?? []).length > 0 ? `${(task.briefAttachments ?? []).length} קבצים בהנחיות` : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                )}
              </span>
              <StatusChip task={task} />
            </button>

            {task.status === "pending_approval" && (
              <button
                onClick={() => {
                  dispatch({ type: "APPROVE_TASK", childId: worker.id, taskId: task.id, by: actor });
                  showToast("אושר ונסגר");
                }}
                style={{ width: "100%", background: `linear-gradient(150deg, #35c0a8 0%, ${work.done} 100%)`, color: "#ffffff", border: "none", padding: "12px", fontSize: 13.5, fontWeight: 800 }}
              >
                אישור וסגירה
              </button>
            )}
          </div>
        ))}
      </div>

      <Toast message={toastMessage} />
      <WorkBottomNav />
    </div>
  );
}

/** Work waiting on the manager first, then what is late, then the rest by due date. */
function weight(task: TaskItem): number {
  if (task.status === "pending_approval") return 0;
  if (isOverdue(task.dueAt, task.status)) return 1;
  if (task.status === "in_progress") return 2;
  return 3 + (Date.parse(task.dueAt ?? "") || Number.MAX_SAFE_INTEGER) / 1e13;
}

/** Where the job stands — and for an open one, whether it ever reached the person. */
/** The colour a job carries everywhere it appears — one definition, so the pill, the
 * edge of the pane and the wash behind it can never disagree. */
function accentOf(task: TaskItem): string {
  if (task.status === "completed") return taskStatusColor.completed;
  if (task.status === "pending_approval") return work.waiting;
  if (task.status === "in_progress") return work.active;
  if (isOverdue(task.dueAt, task.status)) return work.alert;
  if (task.acknowledgedAt) return work.done;
  if (task.seenAt) return work.idle;
  return work.alert;
}

function StatusChip({ task }: { task: TaskItem }) {
  const text =
    task.status === "completed"
      ? "הושלמה"
      : task.status === "pending_approval"
        ? "ממתין לאישורך"
        : task.status === "in_progress"
          ? "בביצוע"
          : task.acknowledgedAt
            ? "אישר קבלה"
            : task.seenAt
              ? "נצפתה"
              : "טרם נצפתה";
  return (
    <span className="pill" style={{ "--tint": accentOf(task), flexShrink: 0, marginTop: 2 } as React.CSSProperties}>
      {text}
    </span>
  );
}

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: active ? work.ink : "var(--card)",
        color: active ? "#ffffff" : "var(--text-muted-2)",
        border: `1px solid ${active ? work.ink : "var(--border)"}`,
        borderRadius: 12,
        padding: "10px",
        fontSize: 13,
        fontWeight: 800,
      }}
    >
      {label}
    </button>
  );
}
