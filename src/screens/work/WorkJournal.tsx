import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";
import { WorkBottomNav } from "../../components/WorkBottomNav";
import { useStore } from "../../data/store";
import { childrenList } from "../../data/family";
import { V, activityLabels, work } from "../../data/vocabulary";
import { formatDateExact, formatDateTime, formatTime, isOverdue, rangeLabels, withinRange, type JournalRange } from "../../utils/datetime";
import { downloadCsv, toCsv } from "../../utils/exportCsv";
import type { ActivityEntry, Child, TaskItem } from "../../data/types";

const actionColor: Record<ActivityEntry["action"], string> = {
  created: work.idle,
  assigned: "#2f7fd1",
  started: work.active,
  submitted: work.waiting,
  approved: work.done,
  reopened: work.alert,
  commented: "#5c5f6b",
  attached: "#2f7fd1",
  edited: work.idle,
  reassigned: work.waiting,
  sent: "#25D366",
  seen: work.idle,
  acknowledged: work.done,
};

interface FeedRow {
  entry: ActivityEntry;
  task: TaskItem;
  worker: Child;
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

  const workers = childrenList(state.family);

  const { feed, done, awaiting, overdue } = useMemo(() => {
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
    return { feed: rows, done, awaiting, overdue };
  }, [workers, workerId, range]);

  // Exactly what's on screen — the same range and worker filter — so the file the
  // manager sends on always matches the journal they were just looking at.
  function exportRange() {
    const rows = feed.map(({ entry, task, worker }) => [
      formatDateExact(entry.at),
      formatTime(entry.at),
      worker.name,
      task.title,
      task.site ?? "",
      activityLabels[entry.action] ?? entry.action,
      entry.by,
      entry.detail ?? "",
      task.dueAt ? formatDateExact(task.dueAt) : "",
    ]);
    const csv = toCsv(["תאריך", "שעה", V.worker, V.task, V.site, "פעולה", "בוצע על ידי", "פירוט", "תאריך יעד"], rows);
    downloadCsv(`work-journal-${range}-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--ink-soft)" }}>יומן פעילות</div>
          {/* Exporting acts on this feed, so the controls sit with it rather than in
              the title bar, where they left the title no room to exist. */}
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button
              onClick={() => navigate(`/work/report?range=${range}&worker=${workerId}`)}
              style={{ background: work.ink, color: "#ffffff", border: "none", borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 800 }}
            >
              דוח PDF
            </button>
            <button
              onClick={() => navigate(`/work/report?range=${range}&worker=${workerId}&mode=proof`)}
              style={{ background: "#ffffff", color: "var(--ink)", border: "1px solid var(--line)", borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 700 }}
            >
              תיק ללקוח
            </button>
            {feed.length > 0 && (
              <button
                onClick={exportRange}
                style={{ background: "#ffffff", color: "var(--ink)", border: "1px solid var(--line)", borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 700 }}
              >
                CSV
              </button>
            )}
          </div>
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
        {feed.map(({ entry, task, worker }) => (
          <button
            key={entry.id}
            onClick={() => navigate(`/work/task/${worker.id}/${task.id}`)}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              background: "#ffffff",
              border: "1px solid var(--line)",
              borderRadius: 12,
              padding: "11px 13px",
              textAlign: "start",
              boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: actionColor[entry.action], marginTop: 6, flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{task.title}</span>
              <span style={{ display: "block", fontSize: 11.5, color: "var(--ink-soft)", marginTop: 2 }}>
                {activityLabels[entry.action] ?? entry.action} · {entry.by || worker.name}
                {entry.detail ? ` · ${entry.detail}` : ""}
              </span>
              <span style={{ display: "block", fontSize: 11, color: "var(--ink-faint)", marginTop: 2 }}>{formatDateTime(entry.at)}</span>
            </span>
          </button>
        ))}
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
