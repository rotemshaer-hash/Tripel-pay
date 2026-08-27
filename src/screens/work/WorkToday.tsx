import { useState } from "react";
import { Header } from "../../components/Header";
import { WorkBottomNav } from "../../components/WorkBottomNav";
import { Toast, useToast } from "../../components/Toast";
import { FirstSteps } from "../../components/FirstSteps";
import { professionById, professions } from "../../data/professions";
import { useStore } from "../../data/store";
import { childrenList } from "../../data/family";
import { V, work } from "../../data/vocabulary";
import { dayMessage, nudgeMessage } from "../../data/messages";
import { whatsAppLink } from "../../utils/share";
import { formatDate, formatTime, isOverdue } from "../../utils/datetime";
import { useNavigate } from "react-router-dom";
import type { Child, TaskItem } from "../../data/types";

/**
 * The manager's morning, and their evening.
 *
 * A manager of a small crew does not think in boards or projects. They think in people
 * and in today: who is holding what, who has not answered, and what is late. And they
 * work in two bursts — hand the work out in the morning, check it at night — which is
 * why this screen is built around one action per person rather than a feed.
 *
 * The state that matters here is not "done / not done" but "did it reach them" —
 * sent, seen, taken on. That column is the thing WhatsApp can never tell you, and the
 * reason a manager would open this instead of scrolling their chat.
 *
 * Handing the work out is a round, not a click: WhatsApp opens one chat at a time, so
 * the morning is "send, come back, next person" — and the screen keeps that place for
 * you instead of leaving you to remember who you already did. Automating the round
 * away entirely needs Meta's paid API, business verification and a server; this needs
 * none of them and costs nothing.
 */
const SENT_KEY = "work-it-sent-today";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function readSent(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(SENT_KEY) || "{}") as { day?: string; ids?: string[] };
    return raw.day === todayKey() ? (raw.ids ?? []) : [];
  } catch {
    return [];
  }
}

function writeSent(ids: string[]) {
  try {
    localStorage.setItem(SENT_KEY, JSON.stringify({ day: todayKey(), ids }));
  } catch {
    /* a blocked storage costs the manager a tick mark, nothing more */
  }
}

export function WorkToday() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const { toastMessage, showToast } = useToast();
  const workers = childrenList(state.family);
  const company = state.family.companyName || state.family.parentName;
  const [sentToday, setSentToday] = useState<string[]>(() => readSent());
  const trade = professionById(state.family.professionId) ?? professions[professions.length - 1];
  // While the first-run card is still teaching, its own send button is the one to
  // press — two green "send" buttons on one screen is a choice nobody asked for.
  const showFirstRun = !(workers.length > 0 && workers.some((w) => w.tasks.length > 0) && sentToday.length > 0);

  function markSent(workerId: string) {
    const next = sentToday.includes(workerId) ? sentToday : [...sentToday, workerId];
    setSentToday(next);
    writeSent(next);
  }

  const open = (w: Child) => w.tasks.filter((t) => t.status !== "completed");
  const unacknowledged = (w: Child) => open(w).filter((t) => !t.acknowledgedAt).length;
  const late = (w: Child) => open(w).filter((t) => isOverdue(t.dueAt, t.status)).length;

  // Two hours is the line between "he hasn't looked at his phone yet" and "he never
  // got it" — before that a nudge is nagging, after it it is the job.
  const SILENT_AFTER_MS = 2 * 60 * 60 * 1000;
  const stuck: { worker: Child; task: TaskItem; reason: "overdue" | "unanswered" | "awaiting_approval" }[] = [];
  for (const worker of workers) {
    for (const task of worker.tasks) {
      if (task.status === "completed") continue;
      if (task.status === "pending_approval") {
        stuck.push({ worker, task, reason: "awaiting_approval" });
        continue;
      }
      if (isOverdue(task.dueAt, task.status)) {
        stuck.push({ worker, task, reason: "overdue" });
        continue;
      }
      const age = Date.now() - Date.parse(task.createdAt ?? "");
      if (!task.acknowledgedAt && age > SILENT_AFTER_MS) stuck.push({ worker, task, reason: "unanswered" });
    }
  }
  stuck.sort((a, b) => order(a.reason) - order(b.reason));

  // Nobody needs a message about an empty plate, and nobody needs the same message twice.
  const toSend = workers.filter((w) => open(w).length > 0 && !sentToday.includes(w.id));
  const totalOpen = workers.reduce((n, w) => n + open(w).length, 0);
  const totalWaiting = workers.reduce((n, w) => n + unacknowledged(w), 0);

  return (
    <div className="screen">
      <Header title="היום" titleNote={company} subtitle={`${totalOpen} משימות פתוחות · ${totalWaiting} טרם אושרו`} tint="pro" />

      <div style={{ padding: "14px 18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={() => navigate("/work/new")}
          style={{ background: work.action, color: "#20160a", border: "none", borderRadius: 12, padding: "15px", fontSize: 15, fontWeight: 900 }}
        >
          + {V.task} חדשה
        </button>

        {/* The morning round, kept for you. WhatsApp opens one chat at a time, so this
            says who is next rather than pretending it can send to everyone at once. */}
        {toSend.length > 0 && !(workers.length > 0 && totalOpen > 0 && sentToday.length === 0 && showFirstRun) && (
          <section style={{ background: "#ffffff", border: "1px solid var(--line)", borderRadius: 13, padding: "13px 15px" }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>
              {sentToday.length === 0 ? "עוד לא שלחת היום לצוות" : `נשלחו ${sentToday.length} מתוך ${workers.length}`}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--ink-soft)", lineHeight: 1.55, marginBottom: 10 }}>
              {`הבא בתור: ${toSend[0].name}. אחרי השליחה חוזרים לכאן והמסך יציג את הבא.`}
            </div>
            <a
              href={whatsAppLink(toSend[0].phone, dayMessage(company, toSend[0]))}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => markSent(toSend[0].id)}
              style={{ display: "block", textAlign: "center", background: "#25D366", color: "#ffffff", borderRadius: 11, padding: "14px", fontSize: 14.5, fontWeight: 800, textDecoration: "none" }}
            >
              {`שליחה ל${toSend[0].name} ←`}
            </a>
          </section>
        )}
        {toSend.length === 0 && workers.length > 0 && totalOpen > 0 && (
          <div style={{ background: "#eaf7f2", border: "1px solid #bfe4d8", borderRadius: 12, padding: "12px 14px", fontSize: 12.5, color: "#2b6d5e", lineHeight: 1.6 }}>
            {`נשלח היום לכל ה${V.workerPlural} ✓ מכאן זה עניין של מי מאשר ומי מדווח — התגיות ליד כל משימה מתעדכנות לבד.`}
          </div>
        )}

        {/* A manager scans for exceptions, not for lists. This is everything that needs
            them right now, and nothing that does not. */}
        {stuck.length > 0 && (
          <section style={{ background: "#ffffff", border: "1px solid #f3c0c9", borderRadius: 13, overflow: "hidden" }}>
            <div style={{ background: "#fdf0f3", padding: "11px 15px", fontSize: 13, fontWeight: 900, color: work.alert }}>
              {`מה תקוע · ${stuck.length}`}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {stuck.map(({ worker, task, reason }) => (
                <div key={`${worker.id}-${task.id}-${reason}`} style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 15px", borderTop: "1px solid var(--line-soft)" }}>
                  <button
                    onClick={() => navigate(`/work/task/${worker.id}/${task.id}`)}
                    style={{ flex: 1, minWidth: 0, background: "none", border: "none", textAlign: "start", padding: 0 }}
                  >
                    <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</span>
                    <span style={{ display: "block", fontSize: 11.5, color: "var(--ink-soft)", marginTop: 2 }}>
                      {`${worker.name} · ${reasonLabel(reason, task)}`}
                    </span>
                  </button>
                  {reason === "awaiting_approval" ? (
                    <button
                      onClick={() => {
                        dispatch({ type: "APPROVE_TASK", childId: worker.id, taskId: task.id, by: state.family.parentName || V.admin });
                        showToast("אושר ונסגר");
                      }}
                      style={{ background: work.done, color: "#ffffff", border: "none", borderRadius: 8, padding: "9px 13px", fontSize: 12, fontWeight: 800, flexShrink: 0 }}
                    >
                      אישור
                    </button>
                  ) : (
                    <a
                      href={whatsAppLink(worker.phone, nudgeMessage(company, worker, task))}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ background: "#25D366", color: "#ffffff", borderRadius: 8, padding: "9px 13px", fontSize: 12, fontWeight: 800, textDecoration: "none", flexShrink: 0 }}
                    >
                      תזכורת
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <FirstSteps sentToday={sentToday.length > 0} />

        {workers.map((worker) => {
          const list = open(worker);
          const waiting = unacknowledged(worker);
          const overdue = late(worker);
          return (
            <section key={worker.id} style={{ background: "#ffffff", border: "1px solid var(--line)", borderRadius: 13, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 15px 10px" }}>
                <span style={{ width: 34, height: 34, borderRadius: 9, background: work.ink, color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14.5, fontWeight: 800, flexShrink: 0 }}>
                  {worker.initial}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14.5, fontWeight: 800 }}>{worker.name}</span>
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--ink-soft)", marginTop: 2 }}>
                    {list.length} פתוחות
                    {waiting > 0 && <span style={{ color: work.alert, fontWeight: 700 }}>{` · ${waiting} טרם אושרו`}</span>}
                    {overdue > 0 && <span style={{ color: work.alert, fontWeight: 700 }}>{` · ${overdue} באיחור`}</span>}
                  </span>
                </span>
                <a
                  href={whatsAppLink(worker.phone, dayMessage(company, worker))}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    markSent(worker.id);
                    showToast(`המשימות של ${worker.name} מוכנות לשליחה`);
                  }}
                  style={{ background: "#25D366", color: "#ffffff", borderRadius: 9, padding: "10px 13px", fontSize: 12.5, fontWeight: 800, textDecoration: "none", flexShrink: 0 }}
                >
                  {sentToday.includes(worker.id) ? "שליחה שוב" : "שליחת היום"}
                </a>
              </div>

              <div style={{ padding: "0 15px 13px", display: "flex", flexDirection: "column", gap: 6 }}>
                {list.length === 0 && (
                  <div>
                    <div style={{ fontSize: 12, color: "var(--ink-faint)", marginBottom: 7 }}>
                      {`אין משימות פתוחות. לחיצה יוצרת משימה ל${worker.name}:`}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {trade.tasks.slice(0, 3).map((template) => (
                        <button
                          key={template.title}
                          onClick={() => {
                            dispatch({
                              type: "CREATE_TASK",
                              childId: worker.id,
                              title: template.title,
                              brief: template.brief,
                              checklist: (template.steps ?? []).map((text) => ({ id: `ck-${crypto.randomUUID()}`, text, done: false })),
                              recurrence: template.recurrence,
                              by: state.family.parentName || V.admin,
                            });
                            showToast(`${template.title} הוקצתה ל${worker.name}`);
                          }}
                          style={{ background: "#ffffff", border: "1px solid var(--line)", borderRadius: 999, padding: "7px 11px", fontSize: 12, fontWeight: 700 }}
                        >
                          {template.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {list.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => navigate(`/work/task/${worker.id}/${task.id}`)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "var(--paper)",
                      border: "none",
                      borderRadius: 9,
                      padding: "10px 11px",
                      textAlign: "start",
                      width: "100%",
                    }}
                  >
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</span>
                      <span style={{ display: "block", fontSize: 11, color: isOverdue(task.dueAt, task.status) ? work.alert : "var(--ink-faint)", marginTop: 2 }}>
                        {[task.site, task.dueAt ? formatDate(task.dueAt) : ""].filter(Boolean).join(" · ") || "ללא יעד"}
                      </span>
                    </span>
                    <ReceiptChip task={task} />
                  </button>
                ))}
              </div>
            </section>
          );
        })}

        <div style={{ fontSize: 11.5, color: "var(--ink-faint)", lineHeight: 1.6, textAlign: "center", padding: "4px 8px" }}>
          הקישור שנשלח לכל אחד מתעדכן לבד — אותו קישור טוב גם מחר, וכל דיווח ממנו נכנס ליומן.
        </div>
      </div>

      <Toast message={toastMessage} />
      <WorkBottomNav />
    </div>
  );
}

/** Work waiting on the manager comes first: it is the only kind they can clear alone. */
function order(reason: "overdue" | "unanswered" | "awaiting_approval"): number {
  return reason === "awaiting_approval" ? 0 : reason === "overdue" ? 1 : 2;
}

function reasonLabel(reason: "overdue" | "unanswered" | "awaiting_approval", task: TaskItem): string {
  if (reason === "awaiting_approval") return `ממתין לאישור שלך${task.submittedAt ? ` · ${formatTime(task.submittedAt)}` : ""}`;
  if (reason === "overdue") return `באיחור${task.dueAt ? ` · יעד ${formatDate(task.dueAt)}` : ""}`;
  return "טרם אישר קבלה";
}

/** Did it reach them — the one question a chat cannot answer. */
function ReceiptChip({ task }: { task: TaskItem }) {
  const [text, color] =
    task.status === "pending_approval"
      ? ["הוגש", work.waiting]
      : task.status === "in_progress"
        ? ["בביצוע", work.active]
        : task.acknowledgedAt
          ? ["אישר", work.done]
          : task.seenAt
            ? ["נצפה", work.idle]
            : ["לא נצפה", work.alert];
  return (
    <span style={{ fontSize: 10.5, fontWeight: 800, color: "#ffffff", background: color, borderRadius: 999, padding: "4px 8px", flexShrink: 0 }}>{text}</span>
  );
}
