import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";
import { WorkBottomNav } from "../../components/WorkBottomNav";
import { useStore } from "../../data/store";
import { childrenList } from "../../data/family";
import { V, activityLabels, statusPillClass, taskStatusLabels, work } from "../../data/vocabulary";
import { formatDate, formatTime, isOnDate, isOverdue, rangeLabels, withinRange, type JournalRange } from "../../utils/datetime";
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
  const [searchText, setSearchText] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const searching = !!searchText.trim() || !!searchDate;

  const workers = childrenList(state.family);

  const { feed, jobs, done, awaiting, overdue } = useMemo(() => {
    const scoped = workerId === "all" ? workers : workers.filter((w) => w.id === workerId);
    const rows: FeedRow[] = [];
    let done = 0;
    let awaiting = 0;
    let overdue = 0;
    // A search asks about the job, not about the tab the manager happened to be on —
    // "מתי בדיוק תיקנו אצל X" is usually asked from outside the current day or week.
    // So a name or a date turns the range buttons off for the duration of the search
    // and looks across everything instead; they resume the moment the search is
    // cleared.
    const effectiveRange: JournalRange = searching ? "all" : range;
    for (const worker of scoped) {
      for (const task of worker.tasks) {
        if (task.status === "pending_approval") awaiting++;
        if (isOverdue(task.dueAt, task.status)) overdue++;
        if (task.status === "completed" && withinRange(task.approvedAt, effectiveRange)) done++;
        for (const entry of task.activity ?? []) {
          if (!withinRange(entry.at, effectiveRange)) continue;
          if (searchDate && !isOnDate(entry.at, searchDate)) continue;
          rows.push({ entry, task, worker });
        }
      }
    }
    rows.sort((a, b) => Date.parse(b.entry.at) - Date.parse(a.entry.at));
    let grouped = groupByJob(rows);
    const q = searchText.trim().toLowerCase();
    if (q) grouped = grouped.filter((job) => job.task.title.toLowerCase().includes(q) || job.worker.name.toLowerCase().includes(q));
    return { feed: rows, jobs: grouped, done, awaiting, overdue };
  }, [workers, workerId, range, searching, searchText, searchDate]);

  return (
    <div className="screen work-ground">
      <Header
        title={V.journal}
        titleNote={state.family.companyName}
        subtitle="תיעוד מלא של העבודה"
        tint="pro"
      />

      {/* "באיזה יום בדיוק תיקנו אצל X" is usually asked about a job outside today's
          tab, so search looks past whichever range button is pressed rather than
          respecting it — see the note on `effectiveRange` above. */}
      {/* Wraps rather than holding both fields on one line: at 132px fixed for the
          date, the text field had nothing left to shrink into on a real phone width
          and its placeholder was clipped mid-word — a minWidth:0 flex item will take
          that squeeze silently instead of asking for a second line. */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "16px 20px 0" }}>
        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="חיפוש לפי שם משימה או עובד…"
          style={{ flex: "1 1 200px", minWidth: 170, padding: "10px 13px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)", fontSize: 13.5, color: "var(--ink)" }}
        />
        <input
          type="date"
          value={searchDate}
          onChange={(e) => setSearchDate(e.target.value)}
          style={{ flex: "0 0 132px", padding: "10px 8px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12.5, color: searchDate ? "var(--ink)" : "var(--text-muted)" }}
        />
        {searching && (
          <button
            type="button"
            onClick={() => {
              setSearchText("");
              setSearchDate("");
            }}
            style={{ flexShrink: 0, background: "var(--muted-bg)", border: "none", borderRadius: 10, padding: "0 12px", fontSize: 12.5, fontWeight: 700, color: "var(--text-muted-2)" }}
          >
            ניקוי
          </button>
        )}
      </div>

      {/* range switch — scrolls rather than splitting evenly now that there are five,
          not three: an evenly-split "הכל" next to "יומי" was either a sliver of a
          button or forced every other label to shrink with it. Dimmed while a search
          is active, since the search already looks past whichever one is pressed. */}
      <div style={{ display: "flex", gap: 6, padding: "10px 20px 0", overflowX: "auto", opacity: searching ? 0.4 : 1, pointerEvents: searching ? "none" : undefined }}>
        {(Object.keys(rangeLabels) as JournalRange[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            style={{
              flexShrink: 0,
              padding: "9px 16px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              whiteSpace: "nowrap",
              border: range === r ? "none" : "1px solid var(--line)",
              background: range === r ? work.ink : "#ffffff",
              color: range === r ? "#ffffff" : "var(--ink-soft)",
            }}
          >
            {rangeLabels[r]}
          </button>
        ))}
      </div>

      {/* worker filter */}
      {workers.length > 1 && (
        <div style={{ display: "flex", gap: 6, padding: "10px 20px 0", overflowX: "auto" }}>
          <FilterChip label="הכל" active={workerId === "all"} onClick={() => setWorkerId("all")} />
          {workers.map((w) => (
            <FilterChip key={w.id} label={w.name} active={workerId === w.id} onClick={() => setWorkerId(w.id)} />
          ))}
        </div>
      )}

      <div style={{ padding: "14px 20px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
        {/* One line where three tiles and two headings used to sit.
            The tiles were mostly large zeroes, and they contradicted the header on the
            way in — the header counts the whole business, they counted the chosen
            period, and nobody reading "3 הושלמו" above "1 הושלמו" concludes anything
            except that the screen is confused. A count of nothing is also not worth a
            card: only the states that actually have work in them are named. The
            per-job counts already sit on each row, so the total said "6 פעולות" twice
            in a row before a single job appeared. */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0, fontSize: 12, color: "var(--text-muted-2)" }}>
            {[
              // A search that narrows the jobs below has to narrow this count too, or
              // the line at the top and the list under it are visibly disagreeing.
              `${searching ? jobs.reduce((n, job) => n + job.total, 0) : feed.length} פעולות`,
              done > 0 ? `${done} הושלמו` : "",
              awaiting > 0 ? `${awaiting} ממתינות` : "",
              overdue > 0 ? `${overdue} באיחור` : "",
            ]
              .filter(Boolean)
              .join(" · ")}
          </div>
          {/* The report is built from what is on this screen, so it belongs beside the
              summary of that — not as a full-width black bar between the filters and
              the work, where it read as the next step rather than as an action. */}
          {feed.length > 0 && (
            <button
              onClick={() => navigate(`/work/report?range=${range}&worker=${workerId}`)}
              style={{
                flexShrink: 0,
                background: "var(--card)",
                color: "var(--ink)",
                border: "1px solid var(--border)",
                borderRadius: 9,
                padding: "8px 13px",
                fontSize: 12.5,
                fontWeight: 800,
              }}
            >
              דוח עבודה
            </button>
          )}
        </div>
        {/* An empty log is the one screen where a person decides whether this is worth
            the trouble, so it says what will land here and why that is the product.
            A search that matched nothing is a different fact and gets a different
            message — "nothing has ever happened" would be a lie the moment there is
            other, unrelated activity in the journal. */}
        {feed.length === 0 && !searching && (
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
        {searching && jobs.length === 0 && (
          <div className="pane" style={{ padding: "18px 16px", fontSize: 13, color: "var(--ink-soft)", textAlign: "center" }}>
            שום משימה לא תואמת את החיפוש.
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
                    <span className={statusPillClass(job.task.status, late)} style={{ flexShrink: 0 }}>
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
