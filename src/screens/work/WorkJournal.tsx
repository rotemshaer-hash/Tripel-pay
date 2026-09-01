import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";
import { WorkBottomNav } from "../../components/WorkBottomNav";
import { useStore } from "../../data/store";
import { childrenList } from "../../data/family";
import { V, activityLabels, taskStatusLabels, work } from "../../data/vocabulary";
import { formatDate, formatTime, isOverdue, rangeLabels, withinRange, type JournalRange } from "../../utils/datetime";
import type { ActivityEntry, Child, TaskItem } from "../../data/types";

// Every dot on the timeline comes from the palette. The three literals that used to
// sit here — a stray blue, a stray grey, and WhatsApp's green typed out again — are
// exactly how a system drifts back into forty slightly different colours.
const actionColor: Record<ActivityEntry["action"], string> = {
  created: work.idle,
  assigned: work.active,
  started: work.active,
  submitted: work.waiting,
  approved: work.done,
  reopened: work.alert,
  commented: work.idle,
  attached: work.active,
  edited: work.idle,
  reassigned: work.waiting,
  sent: work.action,
  seen: work.idle,
  acknowledged: work.done,
};

/** Which of the four pills the design system defines this job wears. The colours
 * live in the stylesheet; mixing them here is how a system becomes forty slightly
 * different chips. */
function pillClass(status: TaskItem["status"], late: boolean): string {
  if (status === "completed") return "pill pill-done";
  if (late) return "pill pill-late";
  if (status === "pending_approval") return "pill pill-wait";
  return "pill";
}

interface FeedRow {
  entry: ActivityEntry;
  task: TaskItem;
  worker: Child;
}

/** A run of identical events on one job, shown once with a count. Four separate
 * "attached a file" rows tell a reader nothing four times. */
interface GroupedRow extends FeedRow {
  count: number;
}

interface JobGroup {
  key: string;
  task: TaskItem;
  worker: Child;
  rows: GroupedRow[];
  /** Every event in the group, before collapsing — what the header counts. */
  total: number;
  lastAt: string;
}

/**
 * The feed, arranged the way the work is.
 *
 * A manager thinks in jobs, not in events. A flat stream ordered by clock forced them
 * to follow one job by eye through everybody else's — two jobs interleaved is already
 * hard, and a real week is unreadable. So each job is one closed row carrying its
 * name, its state and when it last moved, and its own history opens underneath only
 * when asked for. The screen answers "what is going on" before it offers to answer
 * "what happened at 22:45", which is the rarer question.
 *
 * Inside a job, runs of the same action by the same person still collapse to a count:
 * four "attached a file" rows say nothing four times.
 */
function groupByJob(rows: FeedRow[]): JobGroup[] {
  const byJob = new Map<string, JobGroup>();
  for (const row of rows) {
    const key = `${row.worker.id}/${row.task.id}`;
    let job = byJob.get(key);
    if (!job) {
      job = { key, task: row.task, worker: row.worker, rows: [], total: 0, lastAt: row.entry.at };
      byJob.set(key, job);
    }
    job.total++;
    if (Date.parse(row.entry.at) > Date.parse(job.lastAt)) job.lastAt = row.entry.at;
    const previous = job.rows[job.rows.length - 1];
    const sameThing =
      previous &&
      previous.entry.action === row.entry.action &&
      (previous.entry.detail ?? "") === (row.entry.detail ?? "") &&
      previous.entry.by === row.entry.by;
    if (sameThing) {
      previous.count++;
      continue;
    }
    job.rows.push({ ...row, count: 1 });
  }
  return [...byJob.values()].sort((a, b) => Date.parse(b.lastAt) - Date.parse(a.lastAt));
}

/**
 * The manager's work journal: an auditable record of everything that happened across
 * the team, over a chosen day / week / month. This is the product's core promise —
 * work assigned by phone, email or WhatsApp leaves no trace, and this does.
 */
export function WorkJournal() {
  const { state } = useStore();
  const navigate = useNavigate();
  const [range, setRange] = useState<JournalRange>("day");
  const [workerId, setWorkerId] = useState<string | "all">("all");
  /** One job open at a time. Letting several stand open rebuilds the wall of detail
   * this screen exists to put away. */
  const [openJob, setOpenJob] = useState<string | null>(null);

  const workers = childrenList(state.family);

  const { feed, jobs, done, awaiting, overdue } = useMemo(() => {
    const scoped = workerId === "all" ? workers : workers.filter((w) => w.id === workerId);
    const rows: FeedRow[] = [];
    let done = 0;
    let awaiting = 0;
    let overdue = 0;
    for (const worker of scoped) {
      for (const task of worker.tasks) {
        if (task.status === "pending_approval") awaiting++;
        if (isOverdue(task.dueAt, task.status)) overdue++;
        if (task.status === "completed" && withinRange(task.approvedAt, range)) done++;
        for (const entry of task.activity ?? []) {
          if (withinRange(entry.at, range)) rows.push({ entry, task, worker });
        }
      }
    }
    rows.sort((a, b) => Date.parse(b.entry.at) - Date.parse(a.entry.at));
    return { feed: rows, jobs: groupByJob(rows), done, awaiting, overdue };
  }, [workers, workerId, range]);

  return (
    <div className="screen work-ground">
      <Header
        title={V.journal}
        titleNote={state.family.companyName}
        subtitle="תיעוד מלא של העבודה"
        tint="pro"

      />

      {/* range switch */}
      <div style={{ display: "flex", gap: 6, padding: "16px 20px 0" }}>
        {(Object.keys(rangeLabels) as JournalRange[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            style={{
              flex: 1,
              padding: "9px 0",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              border: range === r ? "none" : "1px solid var(--line)",
              background: range === r ? work.ink : "#ffffff",
              color: range === r ? "#ffffff" : "var(--ink-soft)",
            }}
          >
            {rangeLabels[r]}
          </button>
        ))}
      </div>

      {/* summary */}
      <div style={{ display: "flex", gap: 8, padding: "12px 20px 0" }}>
        <Stat label="הושלמו" value={done} color={work.done} />
        <Stat label="ממתינות לאישור" value={awaiting} color={work.waiting} />
        <Stat label="באיחור" value={overdue} color={work.alert} />
      </div>

      {/* worker filter */}
      {workers.length > 1 && (
        <div style={{ display: "flex", gap: 6, padding: "14px 20px 0", overflowX: "auto" }}>
          <FilterChip label="הכל" active={workerId === "all"} onClick={() => setWorkerId("all")} />
          {workers.map((w) => (
            <FilterChip key={w.id} label={w.name} active={workerId === w.id} onClick={() => setWorkerId(w.id)} />
          ))}
        </div>
      )}

      {/* activity feed */}
      <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--ink-soft)" }}>יומן פעילות</div>
          {feed.length > 0 && (
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{`${feed.length} פעולות`}</div>
          )}
        </div>
        {/* One button, because there is one document. It used to offer a statistics
            report, a separate customer "proof pack" and a CSV, which made the manager
            choose between three answers before they had asked the question. */}
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => navigate(`/work/report?range=${range}&worker=${workerId}`)}
            style={{ flex: 1, background: work.ink, color: "#ffffff", border: "none", borderRadius: 8, padding: "10px 12px", fontSize: 13, fontWeight: 800 }}
          >
            דוח עבודה
          </button>
        </div>
        {/* An empty log is the one screen where a person decides whether this is worth
            the trouble, so it says what will land here and why that is the product. */}
        {feed.length === 0 && (
          <div className="pane" style={{ padding: "20px 16px" }}>
            <div style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 7 }}>כאן נרשם הכל, לבד</div>
            <div style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.7 }}>
              כל משימה שתשלח, כל אישור קבלה, כל התחלה וסיום, וכל תמונה שעובד יצרף — נכנסים לכאן עם שם ושעה,
              ואי אפשר לשנות אותם אחר כך. זה מה שמחליף את "אמרתי לך בוואטסאפ", וזה מה שהופך לתיק שאפשר לשלוח ללקוח.
            </div>
            <button
              onClick={() => navigate("/work/board")}
              style={{ width: "100%", marginTop: 12, background: work.ink, color: "#ffffff", border: "none", borderRadius: 10, padding: "12px", fontSize: 13.5, fontWeight: 800 }}
            >
              למסך המשימות
            </button>
          </div>
        )}
        {jobs.map((job) => {
          const isOpen = openJob === job.key;
          const late = isOverdue(job.task.dueAt, job.task.status);
          return (
            <section key={job.key} className="pane" style={{ padding: 0, overflow: "hidden" }}>
              {/* Closed, a job says the three things worth scanning: what it is, where
                  it stands, and when it last moved. Its history is a tap away and
                  costs nothing until it is asked for. */}
              <button
                onClick={() => setOpenJob(isOpen ? null : job.key)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  width: "100%",
                  background: "none",
                  border: "none",
                  padding: "13px 14px",
                  textAlign: "start",
                }}
              >
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span
                      style={{
                        fontSize: 14.5,
                        fontWeight: 800,
                        color: "var(--ink)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {job.task.title}
                    </span>
                    <span className={pillClass(job.task.status, late)} style={{ flexShrink: 0 }}>
                      {late && job.task.status !== "completed" ? "באיחור" : taskStatusLabels[job.task.status]}
                    </span>
                  </span>
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--ink-soft)", marginTop: 3 }}>
                    {`${job.worker.name} · ${job.total} פעולות · ${formatDate(job.lastAt)} ${formatTime(job.lastAt)}`}
                  </span>
                </span>
                <span style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 3, flexShrink: 0 }}>{isOpen ? "▲" : "▼"}</span>
              </button>

              {isOpen && (
                <div style={{ borderTop: "1px solid var(--line)" }}>
                  {job.rows.map((row) => (
                    <button
                      key={row.entry.id}
                      onClick={() => navigate(`/work/task/${row.worker.id}/${row.task.id}`)}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        width: "100%",
                        background: "none",
                        border: "none",
                        padding: "9px 14px",
                        textAlign: "start",
                      }}
                    >
                      {/* A fixed time column is what turns a list into a timeline: the
                          eye runs down one edge instead of hunting for the hour inside
                          each row. */}
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "var(--ink-faint)",
                          fontVariantNumeric: "tabular-nums",
                          width: 34,
                          flexShrink: 0,
                          paddingTop: 1,
                        }}
                      >
                        {formatTime(row.entry.at)}
                      </span>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: actionColor[row.entry.action], marginTop: 5, flexShrink: 0 }} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--ink)" }}>
                          {activityLabels[row.entry.action] ?? row.entry.action}
                          {row.count > 1 ? ` ×${row.count}` : ""}
                        </span>
                        <span style={{ display: "block", fontSize: 11, color: "var(--ink-soft)", marginTop: 1 }}>
                          {`${formatDate(row.entry.at)} · ${row.entry.by || row.worker.name}`}
                          {row.entry.detail ? ` · ${row.entry.detail}` : ""}
                        </span>
                      </span>
                    </button>
                  ))}
                  {/* The header now belongs to the fold, so the way into the job has
                      to be stated rather than left as a guess about which part of the
                      row is a link. */}
                  <button
                    onClick={() => navigate(`/work/task/${job.worker.id}/${job.task.id}`)}
                    style={{
                      display: "block",
                      width: "100%",
                      background: "none",
                      border: "none",
                      borderTop: "1px solid var(--line)",
                      padding: "11px 14px",
                      textAlign: "start",
                      fontSize: 12.5,
                      fontWeight: 800,
                      color: work.waiting,
                    }}
                  >
                    פתיחת המשימה ›
                  </button>
                </div>
              )}
            </section>
          );
        })}
      </div>
      <WorkBottomNav />
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ flex: 1, background: "#ffffff", border: "1px solid var(--line)", borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
      <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 10.5, color: "var(--ink-soft)", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0,
        padding: "6px 13px",
        borderRadius: 999,
        fontSize: 12.5,
        fontWeight: 700,
        border: active ? "none" : "1px solid var(--line)",
        background: active ? work.ink : "#ffffff",
        color: active ? "#ffffff" : "var(--ink-soft)",
      }}
    >
      {label}
    </button>
  );
}
