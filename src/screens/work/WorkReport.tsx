import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useStore } from "../../data/store";
import { ConfirmButton } from "../../components/ConfirmButton";
import { Toast, useToast } from "../../components/Toast";
import { childrenList } from "../../data/family";
import { V, taskStatusLabels } from "../../data/vocabulary";
import { formatDateExact, formatTime, isOverdue, rangeLabels, rangeStart, withinRange, type JournalRange } from "../../utils/datetime";
import type { ActivityEntry, Attachment, Child, TaskItem } from "../../data/types";

/**
 * One job's photos, folded by what the worker called them.
 *
 * A job that was really a round of twenty stops produces fifty photos, and every one
 * of them named after the stop it was taken at — that name is the client's own
 * address, which is exactly what this groups by. Order is first-appearance, so the
 * document reads in the order the worker actually moved through the day rather than
 * alphabetically, and a name recurring later in the pile still joins its first group
 * instead of starting a second one. Anything sent without a name — most of a smaller
 * job, where there is only the one site — falls into a single trailing, unheaded
 * group, exactly as before.
 */
function groupPhotosByName(photos: Attachment[]): { name: string; items: Attachment[] }[] {
  const groups: { name: string; items: Attachment[] }[] = [];
  const byKey = new Map<string, Attachment[]>();
  for (const photo of photos) {
    const key = photo.name && photo.name !== "צילום מהשטח" ? photo.name : "";
    let items = byKey.get(key);
    if (!items) {
      items = [];
      byKey.set(key, items);
      groups.push({ name: key, items });
    }
    items.push(photo);
  }
  // The unnamed group reads last regardless of where its photos fell chronologically
  // — named stops are the structure being reported on, and the leftover shots are a
  // footnote to it, not one more stop in the middle of the sequence.
  const unnamed = groups.findIndex((g) => !g.name);
  if (unnamed >= 0 && unnamed < groups.length - 1) groups.push(groups.splice(unnamed, 1)[0]);
  return groups;
}

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
 *
 * "Save as PDF" still needs the print dialog, which is a few extra taps and, inside
 * some in-app browsers (opened straight off a WhatsApp link), unreliable or missing
 * outright. The download button is the same sheet markup with the print styles
 * inlined, saved directly as a file — no dialog, and for the same reason as the print
 * choice above: an .html file, not a PDF library, so the Hebrew stays exactly what the
 * browser already renders correctly.
 */
export function WorkReport() {
  const { state, dispatch } = useStore();
  const { toastMessage, showToast } = useToast();
  const [params] = useSearchParams();
  const range = (params.get("range") as JournalRange) || "month";
  const workerId = params.get("worker") || "all";

  const workers = childrenList(state.family);
  const company = state.family.companyName || state.family.parentName;

  const { done, awaiting, overdue, scopeLabel } = useMemo(() => {
    const scope = workerId === "all" ? workers : workers.filter((w) => w.id === workerId);
    const all: { entry: ActivityEntry; task: TaskItem; worker: Child }[] = [];
    let done = 0;
    let awaiting = 0;
    let overdue = 0;
    for (const worker of scope) {
      for (const task of worker.tasks) {
        // A job pulled off the board while still open — a mistake, something
        // cancelled, whatever the reason — was never delivered, and that is exactly
        // the kind of thing a client-facing document should not be carrying. A job
        // pulled off the board after it was already finished and approved is a
        // different fact: the work happened, someone signed off on it, and taking it
        // off the active board afterwards doesn't undo that — so it still counts as
        // done and still belongs in the document.
        if (task.archivedAt && task.status !== "completed") continue;
        if (!task.archivedAt) {
          if (task.status === "pending_approval") awaiting++;
          if (isOverdue(task.dueAt, task.status)) overdue++;
        }
        if (task.status === "completed" && withinRange(task.approvedAt, range)) done++;
        for (const entry of task.activity ?? []) {
          if (withinRange(entry.at, range)) all.push({ entry, task, worker });
        }
      }
    }
    all.sort((a, b) => Date.parse(a.entry.at) - Date.parse(b.entry.at));
    return {
      done,
      awaiting,
      overdue,
      scopeLabel: workerId === "all" ? `כל ה${V.workerPlural}` : (scope[0]?.name ?? ""),
    };
  }, [workers, workerId, range]);

  // Every job that moved in the period, not only the approved ones: a manager asking
  // "what was this work" is usually asking about something still open, and a document
  // that silently dropped those was the reason three of them existed.
  const jobs = useMemo(() => {
    const scope = workerId === "all" ? workers : workers.filter((w) => w.id === workerId);
    const out: { key: string; task: TaskItem; worker: Child }[] = [];
    for (const worker of scope) {
      for (const task of worker.tasks) {
        // A job removed while still open doesn't belong in a document meant to go
        // clean to a client — see the same skip and the reasoning on it in the stats
        // above. A job removed after it was finished and approved is real, delivered
        // work, so it stays offered here even once it's off the active board.
        if (task.archivedAt && task.status !== "completed") continue;
        // Every timestamp a job can carry, not just its trail. A job whose activity
        // was written before this record kept one, or that arrived with only an
        // approval stamp on it, was dropped from the document with nothing said —
        // which looks exactly like a report that decided to show one job.
        const moved =
          (task.activity ?? []).some((entry) => withinRange(entry.at, range)) ||
          [task.createdAt, task.dueAt, task.seenAt, task.acknowledgedAt, task.startedAt, task.submittedAt, task.approvedAt].some((at) =>
            withinRange(at, range)
          );
        if (!moved) continue;
        out.push({ key: `${worker.id}/${task.id}`, task, worker });
      }
    }
    out.sort((a, b) => Date.parse(b.task.createdAt ?? "") - Date.parse(a.task.createdAt ?? ""));
    return out;
  }, [workers, workerId, range]);

  /**
   * Which jobs the document is being built from.
   *
   * A period is a blunt way to choose: an invoice covers the three jobs done at one
   * customer's site, not everything that moved that week. Nothing starts ticked —
   * a document handed to a client or an investor should never include a job by
   * default just because it happened to fall in the date range; picking what goes
   * in is a deliberate act, not something to notice and undo after the fact.
   */
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const chosen = jobs.filter((job) => selected.has(job.key));
  function toggle(key: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const from = formatDateExact(rangeStart(range).toISOString());
  const to = formatDateExact(new Date().toISOString());

  const safeCompany = (company || "עסק").replace(/[\\/:*?"<>|]/g, "");
  // A filename fixed to the day (via `to` above) meant a second download the same day
  // landed on the exact same name — the browser saw it as a repeat of the last
  // download and asked "download again?" instead of just saving it. A fresh,
  // second-granular stamp captured at click time makes every download its own file.
  function fileStamp() {
    const now = new Date();
    return [now.getHours(), now.getMinutes(), now.getSeconds()].map((n) => String(n).padStart(2, "0")).join("-");
  }
  function downloadFile(content: BlobPart, mime: string, filename: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Print/"Save as PDF" needs a dialog every time, and on some in-app browsers
  // (opened straight from a WhatsApp link, say) it is unreliable or missing
  // outright. A direct download is one tap and always works the same way: the
  // sheet's own markup, wrapped as a standalone document with its print styles
  // inlined — same reasoning as the print path above about not touching a PDF
  // library, just landing as a file instead of a dialog.
  const sheetRef = useRef<HTMLDivElement>(null);
  const [preparingHtml, setPreparingHtml] = useState(false);
  async function downloadHtml() {
    const sheet = sheetRef.current;
    if (!sheet || preparingHtml) return;
    setPreparingHtml(true);
    try {
      // A photo's <img src> here is a Storage download URL — real while the app is
      // open, but the whole point of a downloaded file is to survive without it: on
      // a phone with no signal, months later, forwarded to someone with no account.
      // Fetching each one and swapping in a data: URI is what makes this a real,
      // self-contained file instead of a page that only half-works once saved. Runs
      // on a clone, never the live DOM, and a photo that fails to fetch is left on
      // its remote URL rather than losing the whole export over one bad fetch.
      const clone = sheet.cloneNode(true) as HTMLElement;
      const images = Array.from(clone.querySelectorAll("img"));
      await Promise.all(
        images.map(async (img) => {
          const src = img.getAttribute("src");
          if (!src || src.startsWith("data:")) return;
          try {
            const res = await fetch(src);
            const blob = await res.blob();
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = () => reject(reader.error);
              reader.readAsDataURL(blob);
            });
            img.setAttribute("src", dataUrl);
          } catch (err) {
            console.error("Embedding a photo into the downloaded report failed:", err);
          }
        })
      );
      const doc = `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${`דוח עבודה — ${company}`}</title>
<style>
body { margin: 0; background: #f2f3f7; font-family: "Alef","Segoe UI","Arial Hebrew","Noto Sans Hebrew",-apple-system,BlinkMacSystemFont,Arial,sans-serif; }
${printCss}
</style>
</head>
<body>${clone.outerHTML}</body>
</html>`;
      downloadFile(doc, "text/html;charset=utf-8", `דוח עבודה - ${safeCompany} - ${to} ${fileStamp()}.html`);
    } finally {
      setPreparingHtml(false);
    }
  }

  // A row per job, not a copy of the printed sheet: a spreadsheet is for totaling and
  // filtering, which needs one clean value per column, not paragraphs of brief text
  // and photo captions crammed into the same cell a print layout groups them into.
  // Opens directly in Excel by double-click, and Google Sheets imports a .csv in two
  // taps (File › Import) — a real .xlsx binary or an actual push to a live Sheet are
  // both bigger asks (a spreadsheet library, or Google OAuth credentials this project
  // has nowhere to keep) that buy little over this for a table this simple.
  function downloadCsv() {
    const cell = (v: string | number | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const headers = ["משימה", "עובד", "אתר", "סטטוס", "יעד", "נשלחה", "נצפתה", "אישרה קבלה", "הוגשה", "אושרה", "תמונות", "קבצים", "הערות"];
    const rows = chosen.map(({ task, worker }) => [
      task.title,
      worker.name,
      task.site ?? "",
      taskStatusLabels[task.status],
      task.dueAt ? formatDateExact(task.dueAt) : "",
      task.createdAt ? formatDateExact(task.createdAt) : "",
      task.seenAt ? formatDateExact(task.seenAt) : "",
      task.acknowledgedAt ? formatDateExact(task.acknowledgedAt) : "",
      task.submittedAt ? formatDateExact(task.submittedAt) : "",
      task.approvedAt ? formatDateExact(task.approvedAt) : "",
      (task.proofs ?? []).filter((a) => a.kind === "image").length,
      (task.proofs ?? []).filter((a) => a.kind === "file").length,
      (task.comments ?? []).length,
    ]);
    const table = [headers, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");

    // Every photo's link on its own row — cramming several into one cell (joined by
    // a newline) opened in Sheets as a single tall, wrapped cell nobody could read
    // at a glance or click through cleanly. A second table, one row per photo, is
    // the shape a spreadsheet actually wants for a list like this. Only a real
    // Storage URL is a usable link — an older photo saved inline as a data: URI has
    // no address to hand anyone, so it's left out rather than dumping a base64 blob
    // into a cell.
    const photoHeaders = ["משימה", "אתר", "שם התמונה", "קישור"];
    // A bare URL in a cell is plain text — double-click-to-select in Sheets stops at
    // the first "/" or "?" it hits, so copying the whole thing takes a careful drag
    // instead of one click. Google Sheets (and Excel) both parse a CSV cell that
    // starts with "=" as a formula on import, so HYPERLINK(...) turns it into an
    // actual clickable link — nothing to select or copy at all.
    const photoRows = chosen.flatMap(({ task }) =>
      (task.proofs ?? [])
        .filter((a) => a.kind === "image" && a.content.startsWith("http"))
        .map((a) => [task.title, task.site ?? "", a.name && a.name !== "צילום מהשטח" ? a.name : "תמונה", `=HYPERLINK("${a.content}", "פתיחה")`]),
    );
    const photoTable = [["תמונות מצורפות"], photoHeaders, ...photoRows].map((r) => r.map(cell).join(",")).join("\r\n");

    const csv = photoRows.length > 0 ? `${table}\r\n\r\n${photoTable}` : table;
    // The BOM is not decorative: without it, Excel guesses a legacy Windows encoding
    // for a .csv with no declared charset and renders every Hebrew cell as garbage —
    // this one byte sequence is what tells it the file is UTF-8.
    downloadFile("\uFEFF" + csv, "text/csv;charset=utf-8", `דוח עבודה - ${safeCompany} - ${to} ${fileStamp()}.csv`);
  }

  return (
    <div className="report-page">
      <style>{printCss}</style>

      <div className="report-bar no-print">
        <button onClick={downloadHtml} disabled={preparingHtml} className="report-bar-btn" style={{ opacity: preparingHtml ? 0.6 : 1 }}>
          {preparingHtml ? "מכין…" : "הורדה כקובץ"}
        </button>
        <button onClick={downloadCsv} className="report-bar-btn">
          לאקסל / Sheets
        </button>
      </div>

      {/* Choosing what goes in belongs on the document rather than on the screen you
          came from: you can see each job's name and state while you decide, and the
          result is in front of you the moment you have. It is `no-print`, so the
          picker never lands on paper. */}
      {jobs.length > 0 && (
        <div className="report-picker no-print">
          <div className="report-picker-head">
            <span>{`מה ייכנס לדוח · ${chosen.length} מתוך ${jobs.length}`}</span>
            {/* This said "ניקוי הכל", which in Hebrew promises deletion — and it was
                read that way: jobs were unticked, and reported as coming back, because
                nothing had ever been deleted. A control names the thing it does. */}
            <button
              type="button"
              onClick={() => setSelected(chosen.length === jobs.length ? new Set() : new Set(jobs.map((j) => j.key)))}
            >
              {chosen.length === jobs.length ? "ביטול הסימון" : "סימון הכל"}
            </button>
          </div>
          {jobs.map((job) => (
            <label key={job.key} className="report-picker-row">
              <input type="checkbox" checked={selected.has(job.key)} onChange={() => toggle(job.key)} />
              <span className="report-picker-name">{job.task.title}</span>
              <span className="report-picker-meta">
                {[job.worker.name, job.task.site, taskStatusLabels[job.task.status]].filter(Boolean).join(" · ")}
              </span>
            </label>
          ))}
          {/* The same ticks that build the document also answer "get these out of my
              app". This is the only multi-select in the product, which is where anyone
              wanting to clear finished work off the board ends up — so the action
              lives here rather than in a second list built to hold the same names. */}
        </div>
      )}

      {/* Detached from the list on purpose. Sitting inside that card, directly under a
          row, this read as one more line of the selection — a tick and a board-level
          action an inch apart, in the same box. Archiving, not deleting: the record
          survives in the journal, which is the one place this product never forgets
          anything — but a job pulled off the board (a mistake, something cancelled)
          has no business padding a document meant to go clean to a client, so it also
          drops out of THIS report and its numbers the moment it's removed. Because
          `jobs` itself stops listing an archived task, the row disappearing here on
          its own next render is the confirmation that it worked — no extra tag or
          "stay ticked" bookkeeping needed to prove something happened. */}
      {jobs.length > 0 && chosen.length > 0 && (
        <div className="report-danger no-print">
          <ConfirmButton
            className="report-picker-delete"
            label={`הסרת ${chosen.length} העבודות המסומנות מהלוח`}
            warning={(() => {
              const names = chosen.slice(0, 4).map((job) => job.task.title).join(", ");
              const more = chosen.length > 4 ? ` ועוד ${chosen.length - 4}` : "";
              return `להסיר ${chosen.length} עבודות מהלוח — ${names}${more}? הן ייעלמו מרשימות המשימות ומהדוח, אבל התיעוד שלהן יישאר ביומן.`;
            })()}
            confirmLabel="כן, להסיר"
            onConfirm={() => {
              for (const job of chosen) dispatch({ type: "ARCHIVE_TASK", childId: job.worker.id, taskId: job.task.id, by: state.family.parentName || V.admin });
              showToast(chosen.length === 1 ? "העבודה הוסרה מהלוח ומהדוח" : `${chosen.length} עבודות הוסרו מהלוח ומהדוח`);
            }}
          />
        </div>
      )}

      <div className="report-sheet" ref={sheetRef}>
        <header className="report-head">
          <div>
            <div className="report-company">{company}</div>
            <div className="report-title">
              {`דוח עבודה — ${rangeLabels[range]}`}
            </div>
          </div>
          <div className="report-meta">
            <div>{`תקופה: ${from} – ${to}`}</div>
            <div>{scopeLabel}</div>
            <div>{`הופק: ${to} ${formatTime(new Date().toISOString())}`}</div>
          </div>
        </header>

        {/* One document, per job: what was asked, and what came back. It used to be
            three — a statistics table, a separate "proof pack" for customers, and a CSV
            — which meant the manager had to know which of the three answered the
            question before they could ask it, and none of them put the brief next to
            the evidence. There is one question here ("what was this job, and what
            happened") and now one answer. */}
        <section className="report-stats">
          <div className="report-stat">
            <div className="report-stat-value">{chosen.length}</div>
            <div className="report-stat-label">עבודות בדוח</div>
          </div>
          <div className="report-stat">
            <div className="report-stat-value">{done}</div>
            <div className="report-stat-label">הושלמו</div>
          </div>
          <div className="report-stat">
            <div className="report-stat-value">{awaiting}</div>
            <div className="report-stat-label">ממתינות לאישור</div>
          </div>
          <div className="report-stat">
            <div className="report-stat-value">{overdue}</div>
            <div className="report-stat-label">באיחור</div>
          </div>
        </section>

        <section className="report-proof">
          {chosen.map(({ task, worker }) => {
            const photos = (task.proofs ?? []).filter((a) => a.kind === "image");
            const notes = (task.proofs ?? []).filter((a) => a.kind === "note");
            const files = (task.proofs ?? []).filter((a) => a.kind === "file");
            const briefFiles = task.briefAttachments ?? [];
            const stamps: [string, string | undefined][] = [
              ["נשלחה", task.createdAt],
              ["נצפתה", task.seenAt],
              ["אושרה קבלה", task.acknowledgedAt],
              ["הוגשה", task.submittedAt],
              ["אושרה", task.approvedAt],
            ];
            return (
              <article key={`${worker.id}-${task.id}`} className="report-proof-item">
                <div className="report-proof-head">
                  <span className="report-proof-title">{task.title}</span>
                  <span className="report-proof-meta">
                    {[worker.name, task.site, task.dueAt ? `יעד: ${formatDateExact(task.dueAt)}` : "", taskStatusLabels[task.status]]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>

                <div className="report-requested">
                  <div className="report-block-title">מה התבקש</div>
                  {task.brief ? <div className="report-proof-brief">{task.brief}</div> : <div className="report-quiet">לא נכתב פירוט.</div>}
                  {(task.checklist ?? []).length > 0 && (
                    <ul className="report-proof-steps">
                      {(task.checklist ?? []).map((step) => (
                        <li key={step.id}>{`${step.done ? "✓" : "—"} ${step.text}`}</li>
                      ))}
                    </ul>
                  )}
                  {briefFiles.length > 0 && (
                    <div className="report-proof-shots">
                      {briefFiles
                        .filter((a) => a.kind === "image")
                        .map((a) => (
                          <figure key={a.id}>
                            <img src={a.content} alt={a.name} />
                            <figcaption>{a.name}</figcaption>
                          </figure>
                        ))}
                    </div>
                  )}
                  {briefFiles.filter((a) => a.kind !== "image").length > 0 && (
                    <div className="report-proof-notes">
                      {briefFiles
                        .filter((a) => a.kind !== "image")
                        .map((a) => (
                          <div key={a.id}>{`• ${a.kind === "note" ? a.content : a.name}`}</div>
                        ))}
                    </div>
                  )}
                </div>

                <div className="report-done">
                  <div className="report-block-title">מה בוצע</div>
                  {photos.length === 0 && files.length === 0 && notes.length === 0 && (
                    <div className="report-quiet">לא צורפו אסמכתאות.</div>
                  )}
                  {/* The worker's own general note on what was done is the headline of this
                      section, so it leads — a photo's caption names what's in that one
                      picture, this names the job. Reading order should match that. The
                      timestamps are the opposite: metadata about the record, not the
                      record itself, so they close the section instead of opening it. */}
                  {notes.length > 0 && (
                    <div className="report-proof-notes">
                      {notes.map((a) => (
                        <div key={a.id}>{`• ${a.content} (${a.addedBy} · ${formatDateExact(a.addedAt)} ${formatTime(a.addedAt)})`}</div>
                      ))}
                    </div>
                  )}
                  {photos.length > 0 &&
                    groupPhotosByName(photos).map((group, gi) => (
                      // A job photographed at twenty stops is twenty names repeated across
                      // fifty shots, not fifty captions to read one at a time. Same name,
                      // wherever it recurs in the pile, becomes one heading over its photos
                      // — the branch is the heading now, not a line under every picture of it.
                      <div key={group.name || `_${gi}`} className="report-shot-group">
                        {group.name && <div className="report-shot-group-name">{`${group.name} · ${group.items.length}`}</div>}
                        <div className="report-proof-shots">
                          {group.items.map((a) => (
                            <figure key={a.id}>
                              <img src={a.content} alt={a.name} />
                              {!group.name && a.name && a.name !== "צילום מהשטח" && <figcaption className="report-proof-name">{a.name}</figcaption>}
                              <figcaption>{`${a.addedBy} · ${formatDateExact(a.addedAt)} ${formatTime(a.addedAt)}`}</figcaption>
                            </figure>
                          ))}
                        </div>
                      </div>
                    ))}
                  {files.length > 0 && (
                    <div className="report-proof-notes">
                      {files.map((a) => (
                        <div key={a.id}>{`• ${a.name} (${a.addedBy} · ${formatDateExact(a.addedAt)} ${formatTime(a.addedAt)})`}</div>
                      ))}
                    </div>
                  )}
                  {(task.comments ?? []).length > 0 && (
                    <div className="report-proof-notes">
                      {(task.comments ?? []).map((c) => (
                        <div key={c.at}>{`• ${c.by}: ${c.text}`}</div>
                      ))}
                    </div>
                  )}
                  <div className="report-stamps">
                    {stamps
                      .filter(([, at]) => !!at)
                      .map(([label, at]) => (
                        <span key={label}>{`${label}: ${formatDateExact(at)} ${formatTime(at)}`}</span>
                      ))}
                  </div>
                </div>
              </article>
            );
          })}
          {chosen.length === 0 && <div className="report-empty">לא סומנה אף עבודה. סמן למעלה מה ייכנס לדוח.</div>}
        </section>
      </div>
      <Toast message={toastMessage} />
    </div>
  );
}

const printCss = `
.report-page { background: #f2f3f7; min-height: 100%; padding-bottom: 40px; }
/* This bar is "no-print" — the app's own chrome, still in the retired navy while
   everything else on screen moved to the header teal. The sheet below it keeps its
   own fixed ink-on-paper palette on purpose (a printed report should not reflow its
   colours every time the app is restyled); this bar is not the sheet. */
.report-bar { display: flex; flex-wrap: wrap; gap: 8px; padding: 14px 18px; position: sticky; top: 0; background: var(--accent); }
.report-bar-btn { flex: 1 1 100px; padding: 12px; border-radius: 9px; border: 1px solid rgba(255,255,255,0.3);
  background: transparent; color: #fff; font-size: 13px; font-weight: 700; white-space: nowrap; }
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
.report-proof-item { border: 1px solid #e3e5ea; border-radius: 8px; padding: 12px 13px; margin-bottom: 12px; break-inside: avoid; }
.report-proof-head { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; align-items: baseline; }
.report-proof-title { font-size: 13.5px; font-weight: 800; }
.report-proof-meta { font-size: 10.5px; color: #5c5f6b; }
.report-proof-brief { font-size: 11.5px; color: #3a3d47; margin-top: 6px; line-height: 1.5; }
.report-proof-steps { margin: 7px 0 0; padding-inline-start: 16px; font-size: 11px; color: #3a3d47; line-height: 1.7; }
.report-proof-notes { font-size: 12.5px; color: #3a3d47; margin-top: 7px; line-height: 1.6; }
.report-proof-shots { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 9px; }
.report-proof-shots figure { margin: 0; width: 30%; min-width: 150px; }
.report-proof-shots img { width: 100%; border-radius: 6px; display: block; border: 1px solid #e3e5ea; }
.report-proof-shots figcaption { font-size: 9px; color: #5c5f6b; margin-top: 3px; }
.report-proof-shots figcaption.report-proof-name { font-size: 10.5px; font-weight: 700; color: #232a3b; margin-top: 5px; }
.report-shot-group + .report-shot-group { margin-top: 12px; }
.report-shot-group-name { font-size: 14px; font-weight: 700; color: #232a3b; border-bottom: 1px solid #e3e5ea; padding-bottom: 4px; margin-top: 9px; }
.report-block-title { font-size: 13.5px; font-weight: 800; color: #5c5f6b; letter-spacing: .04em; margin: 11px 0 4px; }
/* "מה התבקש" and "מה בוצע" used to read as one continuous block with two small
   labels dropped in — easy to blur together when scanning. The done half now
   opens past its own rule, so the eye has an actual line to land on between what
   was asked for and what came back. */
.report-done { border-top: 1.5px solid #d8dae0; margin-top: 13px; padding-top: 10px; }
.report-stamps { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 10.5px; color: #232a3b; }
.report-quiet { font-size: 10.5px; color: #8b8e99; }

/* The picker is screen furniture: it lives above the sheet, in the app's own
   colours rather than the document's, so nobody mistakes it for part of the page
   that prints. */
.report-picker { margin: 12px auto 0; max-width: 780px; background: var(--card); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
.report-picker-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 11px 14px; border-bottom: 1px solid var(--border); font-size: 12.5px; font-weight: 700; color: var(--ink); }
.report-picker-head button { background: none; border: none; padding: 0; font-size: 12px; font-weight: 800; color: var(--accent-mid); }
.report-picker-row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-top: 1px solid var(--border); cursor: pointer; }
.report-picker-row:first-of-type { border-top: none; }
.report-picker-row input { width: 18px; height: 18px; accent-color: var(--accent); flex-shrink: 0; }
.report-picker-name { font-size: 13.5px; font-weight: 700; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.report-picker-meta { margin-inline-start: auto; font-size: 11px; color: var(--text-muted-2); white-space: nowrap; flex-shrink: 0; }
.report-danger { margin: 10px auto 0; max-width: 780px; }
.report-picker-delete { display: block; width: 100%; background: none; border: 1px solid var(--border); border-radius: 12px; padding: 13px 14px; font-size: 12.5px; font-weight: 800; color: var(--alert); text-align: start; }
.report-table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
.report-table th { text-align: start; font-weight: 800; padding: 7px 6px; border-bottom: 1.5px solid #232a3b; font-size: 11px; }
.report-table td { padding: 6px; border-bottom: 1px solid #eceef2; vertical-align: top; line-height: 1.45; }
.report-empty { text-align: center; color: #9a9ca6; padding: 18px 6px; }
.report-ok { color: #1f9e8a; font-weight: 800; }
.report-late { color: #e0224a; font-weight: 700; }
.report-open { margin-top: 22px; }
.report-section-title { font-size: 12.5px; font-weight: 800; margin-bottom: 8px; }

@media print {
  /* What goes on paper is the report, not a screenshot of the app. */
  .no-print { display: none !important; }
  .report-page { background: #fff; padding: 0; }
  .report-sheet { box-shadow: none; margin: 0; max-width: none; padding: 0; }
  .report-table { font-size: 10px; }
  /* A row split across a page break is a row nobody can read. */
  tr, .report-stat { break-inside: avoid; }
  thead { display: table-header-group; }
  @page { size: A4; margin: 14mm; }
}
`;
