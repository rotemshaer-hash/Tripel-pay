import { Header } from "../../components/Header";
import { WorkBottomNav } from "../../components/WorkBottomNav";
import { Toast, useToast } from "../../components/Toast";
import { useStore } from "../../data/store";
import { childrenList } from "../../data/family";
import { V, work } from "../../data/vocabulary";
import { dayMessage } from "../../data/messages";
import { whatsAppLink } from "../../utils/share";
import { formatDate, isOverdue } from "../../utils/datetime";
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
 */
export function WorkToday() {
  const { state } = useStore();
  const navigate = useNavigate();
  const { toastMessage, showToast } = useToast();
  const workers = childrenList(state.family);
  const company = state.family.companyName || state.family.parentName;

  const open = (w: Child) => w.tasks.filter((t) => t.status !== "completed");
  const unacknowledged = (w: Child) => open(w).filter((t) => !t.acknowledgedAt).length;
  const late = (w: Child) => open(w).filter((t) => isOverdue(t.dueAt, t.status)).length;

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

        {workers.length === 0 && (
          <div style={{ background: "#ffffff", border: "1px solid var(--line)", borderRadius: 12, padding: "20px 15px", textAlign: "center", fontSize: 13.5, color: "var(--ink-soft)" }}>
            {`עוד אין ${V.workerPlural} — אפשר להוסיף במסך הצוות.`}
          </div>
        )}

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
                  onClick={() => showToast(`המשימות של ${worker.name} מוכנות לשליחה`)}
                  style={{ background: "#25D366", color: "#ffffff", borderRadius: 9, padding: "10px 13px", fontSize: 12.5, fontWeight: 800, textDecoration: "none", flexShrink: 0 }}
                >
                  שליחת היום
                </a>
              </div>

              <div style={{ padding: "0 15px 13px", display: "flex", flexDirection: "column", gap: 6 }}>
                {list.length === 0 && <div style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>אין משימות פתוחות.</div>}
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
