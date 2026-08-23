import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "../../data/store";
import { childrenList } from "../../data/family";
import { V, activityLabels, taskStatusLabels } from "../../data/vocabulary";
import { formatDateExact, formatTime, isOverdue, rangeLabels, rangeStart, withinRange, type JournalRange } from "../../utils/datetime";
import type { ActivityEntry, Child, TaskItem } from "../../data/types";

/**
 * A report a manager can hand to a client, a bookkeeper or an auditor.
 *
 * Printed by the browser rather than assembled by a PDF library, and that is the
 * deliberate choice: Hebrew in jsPDF/pdf-lib means embedding a font and doing your
 * own right-to-left shaping, which is exactly where such reports come out reversed
 * or as tofu. The browser already lays out Hebrew correctly, and "Save as PDF" is in
 * every print dialog on every platform — so the output is a real PDF with real text
 * in it, selectable and searchable, with no dependency to keep alive.
 *
 * The page is a plain document: the app's chrome is dropped at print time so what
 * lands on paper is the report, not a screenshot of a phone.
 */
export function WorkReport() {
  const { state } = useStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const range = (params.get("range") as JournalRange) || "month";
  const workerId = params.get("worker") || "all";

  const workers = childrenList(state.family);
  const company = state.family.companyName || state.family.parentName;

  const { rows, done, awaiting, overdue, scopeLabel } = useMemo(() => {
    const scope = workerId === "all" ? workers : workers.filter((w) => w.id === workerId);
    const all: { entry: ActivityEntry; task: TaskItem; worker: Child }[] = [];
    let done = 0;
    let awaiting = 0;
    let overdue = 0;
    for (const worker of scope) {
      for (const task of worker.tasks) {
        if (task.status === "pending_approval") awaiting++;
        if (isOverdue(task.dueAt, task.status)) overdue++;
        if (task.status === "completed" && withinRange(task.approvedAt, range)) done++;
        for (const entry of task.activity ?? []) {
          if (withinRange(entry.at, range)) all.push({ entry, task, worker });
        }
      }
    }
    all.sort((a, b) => Date.parse(a.entry.at) - Date.parse(b.entry.at));
    return {
      rows: all,
      done,
      awaiting,
      overdue,
      scopeLabel: workerId === "all" ? `כל ה${V.workerPlural}` : (scope[0]?.name ?? ""),
    };
  }, [workers, workerId, range]);

  const from = formatDateExact(rangeStart(range).toISOString());
  const to = formatDateExact(new Date().toISOString());

  return (
    <div className="report-page">
      <style>{printCss}</style>

      <div className="report-bar no-print">
        <button onClick={() => navigate(-1)} className="report-bar-btn">
          חזרה
        </button>
        <button onClick={() => window.print()} className="report-bar-btn report-bar-primary">
          הדפסה / שמירה כ-PDF
        </button>
      </div>

      <div className="report-sheet">
        <header className="report-head">
          <div>
            <div className="report-company">{company}</div>
            <div className="report-title">{`דוח ${V.journal} — ${rangeLabels[range]}`}</div>
          </div>
          <div className="report-meta">
            <div>{`תקופה: ${from} – ${to}`}</div>
            <div>{scopeLabel}</div>
            <div>{`הופק: ${to} ${formatTime(new Date().toISOString())}`}</div>
          </div>
        </header>

        <section className="report-stats">
          <div className="report-stat">
            <div className="report-stat-value">{done}</div>
            <div className="report-stat-label">משימות שאושרו</div>
          </div>
          <div className="report-stat">
            <div className="report-stat-value">{awaiting}</div>
            <div className="report-stat-label">ממתינות לאישור</div>
          </div>
          <div className="report-stat">
            <div className="report-stat-value">{overdue}</div>
            <div className="report-stat-label">באיחור</div>
          </div>
          <div className="report-stat">
            <div className="report-stat-value">{rows.length}</div>
            <div className="report-stat-label">רישומים בתקופה</div>
          </div>
        </section>

        <table className="report-table">
          <thead>
            <tr>
              <th style={{ width: "13%" }}>תאריך</th>
              <th style={{ width: "8%" }}>שעה</th>
              <th style={{ width: "16%" }}>{V.worker}</th>
              <th style={{ width: "31%" }}>{V.task}</th>
              <th style={{ width: "16%" }}>{V.site}</th>
              <th style={{ width: "16%" }}>פעולה</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ entry, task, worker }) => (
              <tr key={entry.id}>
                <td>{formatDateExact(entry.at)}</td>
                <td>{formatTime(entry.at)}</td>
                <td>{worker.name}</td>
                <td>
                  {task.title}
                  {task.status === "completed" && <span className="report-ok"> ✓</span>}
                </td>
                <td>{task.site ?? "—"}</td>
                <td>
                  {activityLabels[entry.action] ?? entry.action}
                  {entry.detail ? ` (${entry.detail})` : ""}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="report-empty">
                  אין פעילות מתועדת בתקופה הזו.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <section className="report-open">
          <div className="report-section-title">משימות פתוחות בסוף התקופה</div>
          <table className="report-table">
            <thead>
              <tr>
                <th style={{ width: "20%" }}>{V.worker}</th>
                <th style={{ width: "40%" }}>{V.task}</th>
                <th style={{ width: "20%" }}>תאריך יעד</th>
                <th style={{ width: "20%" }}>סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {workers
                .filter((w) => workerId === "all" || w.id === workerId)
                .flatMap((w) => w.tasks.filter((t) => t.status !== "completed").map((t) => ({ w, t })))
                .map(({ w, t }) => (
                  <tr key={t.id}>
                    <td>{w.name}</td>
                    <td>{t.title}</td>
                    <td>
                      {t.dueAt ? formatDateExact(t.dueAt) : "—"}
                      {isOverdue(t.dueAt, t.status) && <span className="report-late"> באיחור</span>}
                    </td>
                    <td>{taskStatusLabels[t.status]}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>

        <footer className="report-foot">
          <div className="report-sign">
            <div className="report-sign-line" />
            <div>חתימת {V.admin}</div>
          </div>
          <div className="report-sign">
            <div className="report-sign-line" />
            <div>חתימת לקוח</div>
          </div>
        </footer>
      </div>
    </div>
  );
}

const printCss = `
.report-page { background: #f2f3f7; min-height: 100%; padding-bottom: 40px; }
.report-bar { display: flex; gap: 8px; padding: 14px 18px; position: sticky; top: 0; background: #232a3b; }
.report-bar-btn { flex: 1; padding: 12px; border-radius: 9px; border: 1px solid rgba(255,255,255,0.25);
  background: transparent; color: #fff; font-size: 13.5px; font-weight: 700; }
.report-bar-primary { background: #fff; color: #232a3b; border: none; font-weight: 800; }
.report-sheet { background: #fff; margin: 16px auto; padding: 26px 24px; max-width: 820px;
  box-shadow: 0 1px 4px rgba(16,24,40,0.10); color: #1a1d26; }
.report-head { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start;
  border-bottom: 2px solid #232a3b; padding-bottom: 12px; margin-bottom: 16px; }
.report-company { font-size: 19px; font-weight: 800; }
.report-title { font-size: 13.5px; color: #5c5f6b; margin-top: 3px; }
.report-meta { font-size: 11px; color: #5c5f6b; line-height: 1.7; text-align: start; }
.report-stats { display: flex; gap: 10px; margin-bottom: 18px; }
.report-stat { flex: 1; border: 1px solid #e3e5ea; border-radius: 8px; padding: 10px 8px; text-align: center; }
.report-stat-value { font-size: 20px; font-weight: 800; }
.report-stat-label { font-size: 10.5px; color: #5c5f6b; margin-top: 2px; }
.report-table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
.report-table th { text-align: start; font-weight: 800; padding: 7px 6px; border-bottom: 1.5px solid #232a3b; font-size: 11px; }
.report-table td { padding: 6px; border-bottom: 1px solid #eceef2; vertical-align: top; line-height: 1.45; }
.report-empty { text-align: center; color: #9a9ca6; padding: 18px 6px; }
.report-ok { color: #1f9e8a; font-weight: 800; }
.report-late { color: #e0224a; font-weight: 700; }
.report-open { margin-top: 22px; }
.report-section-title { font-size: 12.5px; font-weight: 800; margin-bottom: 8px; }
.report-foot { display: flex; gap: 40px; margin-top: 34px; }
.report-sign { flex: 1; font-size: 11px; color: #5c5f6b; }
.report-sign-line { border-bottom: 1px solid #9a9ca6; height: 30px; margin-bottom: 5px; }

@media print {
  /* What goes on paper is the report, not a screenshot of the app. */
  .no-print { display: none !important; }
  .report-page { background: #fff; padding: 0; }
  .report-sheet { box-shadow: none; margin: 0; max-width: none; padding: 0; }
  .report-table { font-size: 10px; }
  /* A row split across a page break is a row nobody can read. */
  tr, .report-stat, .report-foot { break-inside: avoid; }
  thead { display: table-header-group; }
  @page { size: A4; margin: 14mm; }
}
`;
