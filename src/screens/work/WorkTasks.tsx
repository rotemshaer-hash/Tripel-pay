import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";
import { WorkBottomNav } from "../../components/WorkBottomNav";
import { useStore, useWorkView } from "../../data/store";
import { childrenList } from "../../data/family";
import { V, priorityColor, priorityLabels, recurrenceLabels, statusPillClass, taskStatusLabels, work } from "../../data/vocabulary";
import { formatDate, isOverdue } from "../../utils/datetime";
import type { Child, TaskItem } from "../../data/types";

type Filter = "open" | "awaiting" | "done";

const filterLabels: Record<Filter, string> = {
  open: "פתוחות",
  awaiting: "לאישור",
  done: "הושלמו",
};


/** Every job in one list, filtered by state — the manager's working view. */
export function WorkTasks() {
  const { state } = useStore();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("open");

  const { isManager } = useWorkView();
  const scope = isManager ? childrenList(state.family) : childrenList(state.family).filter((c) => c.id === state.activeChildId);

  const rows = useMemo(() => {
    // Archived jobs stay in the record for the journal and any report — this list is
    // the working view, so it is the one place that stops showing them.
    const all: { task: TaskItem; worker: Child }[] = [];
    for (const worker of scope) for (const task of worker.tasks) if (!task.archivedAt) all.push({ task, worker });
    const matches = all.filter(({ task }) => {
      if (filter === "awaiting") return task.status === "pending_approval";
      if (filter === "done") return task.status === "completed";
      return task.status === "available" || task.status === "in_progress";
    });
    // Overdue first, then by due date, then newest.
    return matches.sort((a, b) => {
      const ao = isOverdue(a.task.dueAt, a.task.status) ? 0 : 1;
      const bo = isOverdue(b.task.dueAt, b.task.status) ? 0 : 1;
      if (ao !== bo) return ao - bo;
      const ad = a.task.dueAt ? Date.parse(a.task.dueAt) : Infinity;
      const bd = b.task.dueAt ? Date.parse(b.task.dueAt) : Infinity;
      return ad - bd;
    });
  }, [scope, filter]);

  return (
    <div className="screen work-ground">
      <Header
        title={V.taskPlural}
        subtitle={isManager ? "כל המשימות בצוות" : "המשימות שלי"}
        tint="pro"
        right={
          isManager ? (
            // Writing a task is the whole point of this screen and no longer has a tab
            // of its own, so it gets the one colour on the bar that means "press me".
            <button
              onClick={() => navigate("/work/new")}
              style={{
                background: work.action,
                color: "var(--ink)",
                border: "none",
                borderRadius: 999,
                padding: "9px 16px",
                fontSize: 13.5,
                fontWeight: 800,
                boxShadow: "0 2px 10px -2px rgba(245,165,36,0.55)",
              }}
            >
              + משימה חדשה
            </button>
          ) : undefined
        }
      />

      <div style={{ display: "flex", gap: 6, padding: "16px 20px 0" }}>
        {(Object.keys(filterLabels) as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              flex: 1,
              padding: "9px 0",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              border: filter === f ? "none" : "1px solid var(--line)",
              background: filter === f ? work.ink : "#ffffff",
              color: filter === f ? "#ffffff" : "var(--ink-soft)",
            }}
          >
            {filterLabels[f]}
          </button>
        ))}
      </div>

      <div style={{ padding: "14px 20px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.length === 0 && (
          <div style={{ fontSize: 13, color: "var(--ink-faint)", background: "#ffffff", border: "1px solid var(--line)", borderRadius: 12, padding: "18px 14px", textAlign: "center" }}>
            אין משימות בקטגוריה הזו
          </div>
        )}
        {rows.map(({ task, worker }) => {
          const overdue = isOverdue(task.dueAt, task.status);
          return (
            <button
              key={task.id}
              className="pane"
              onClick={() => navigate(`/work/task/${worker.id}/${task.id}`)}
              style={{
                // A job that has run late is the one thing on this screen that wants
                // catching, so it states it on the border as well as in the pill.
                border: overdue ? `2px solid ${work.alert}` : undefined,
                padding: "13px 14px",
                textAlign: "start",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: priorityColor[task.priority ?? "normal"], flexShrink: 0 }} />
                <span
                  className="display"
                  style={{ flex: 1, fontSize: 16, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                  {task.title}
                </span>
                {/* The status was plain grey text in the meta line while "late" got a
                    chip of its own, so the two states a manager sorts by did not look
                    like the same kind of fact. Both are pills now. */}
                <span className={statusPillClass(task.status, overdue)} style={{ flexShrink: 0 }}>
                  {overdue ? "באיחור" : taskStatusLabels[task.status]}
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--text-muted-2)", marginTop: 5, display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span>{worker.name}</span>
                {task.dueAt && (
                  <>
                    <span>·</span>
                    <span style={{ color: overdue ? work.alert : "inherit", fontWeight: overdue ? 700 : 400 }}>יעד {formatDate(task.dueAt)}</span>
                  </>
                )}
                {task.site && (
                  <>
                    <span>·</span>
                    <span>{task.site}</span>
                  </>
                )}
                {task.recurrence && task.recurrence !== "none" && (
                  <>
                    <span>·</span>
                    <span>{recurrenceLabels[task.recurrence]}</span>
                  </>
                )}
                {task.priority && task.priority !== "normal" && (
                  <>
                    <span>·</span>
                    <span style={{ color: priorityColor[task.priority], fontWeight: 700 }}>{priorityLabels[task.priority]}</span>
                  </>
                )}
              </div>
              {(task.checklist ?? []).length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 7 }}>
                  <div style={{ flex: 1, height: 4, borderRadius: 999, background: "var(--line-soft)", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.round(((task.checklist ?? []).filter((i) => i.done).length / (task.checklist ?? []).length) * 100)}%`,
                        background: (task.checklist ?? []).every((i) => i.done) ? work.done : work.ink,
                        borderRadius: 999,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 10.5, color: "var(--ink-faint)", fontWeight: 700 }}>
                    {(task.checklist ?? []).filter((i) => i.done).length}/{(task.checklist ?? []).length} שלבים
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
      <WorkBottomNav />
    </div>
  );
}
