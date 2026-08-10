import { Header } from "../../components/Header";
import { ParentBottomNav } from "../../components/BottomNav";
import { SendMoneyFab } from "../../components/SendMoneyFab";
import { SectionTitle, categoryIcon, categoryTileColor, EmptyState } from "../../components/UI";
import { Toast, useToast } from "../../components/Toast";
import { useActiveChild, useStore } from "../../data/store";
import { childrenList } from "../../data/family";
import { EggAvatar } from "../../components/EggAvatar";
import { useNavigate } from "react-router-dom";
import { useCountUp } from "../../hooks/useCountUp";

export function ParentHome() {
  const { state, dispatch } = useStore();
  const child = useActiveChild();
  const navigate = useNavigate();
  const { toastMessage, showToast } = useToast();
  const displaySavings = useCountUp(child.savingsTotal);
  const displayBalance = useCountUp(child.balance);

  const assignedTitles = new Set(child.tasks.filter((t) => t.status !== "completed").map((t) => t.title));
  const recommended = state.family.taskBank.filter((t) => !assignedTitles.has(t.title)).slice(0, 4);

  const tradeOffers = childrenList(state.family).flatMap((c) =>
    c.tasks
      .filter((t) => t.tradeOfferedTo)
      .map((t) => ({ fromChild: c, task: t, toChild: state.family.children[t.tradeOfferedTo!] }))
  );

  function assign(templateId: string, title: string) {
    dispatch({ type: "ASSIGN_TASK", childId: child.id, templateId });
    showToast(`המטלה "${title}" הוקצתה ל${child.name}`);
  }

  return (
    <div className="screen">
      <Header
        title="מסך הבית"
        tint="playful"
        right={
          <div style={{ position: "relative", fontSize: 20 }}>
            🔔
            <span
              style={{
                position: "absolute",
                top: -4,
                insetInlineStart: -6,
                background: "var(--violet-700)",
                color: "#fff",
                fontSize: 9.5,
                fontWeight: 700,
                borderRadius: 999,
                minWidth: 15,
                height: 15,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 3px",
              }}
            >
              2
            </span>
          </div>
        }
      >
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div className="money" style={{ fontSize: 40, lineHeight: 1 }}>
              {displayBalance.toLocaleString("he-IL")}₪
            </div>
            <div style={{ fontSize: 12.5, opacity: 0.85, marginTop: 6 }}>
              יתרת {child.name} · חסכונות {displaySavings.toLocaleString("he-IL")}₪
            </div>
          </div>
          <button onClick={() => navigate("/parent/savings")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: 0 }}>
            <EggAvatar photoUrl={child.photoUrl} color={child.avatarColor} initial={child.initial} size={44} />
            <span style={{ fontSize: 18, opacity: 0.9 }}>‹</span>
          </button>
        </div>
      </Header>

      <SectionTitle>המשפחה שלי</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 20px" }}>
        {childrenList(state.family).map((c) => {
          const pending = c.tasks.filter((t) => t.status === "pending_approval").length;
          const goal = c.savingsGoals[0];
          const goalPct = goal ? Math.min(100, Math.round((goal.current / Math.max(1, goal.target)) * 100)) : null;
          const isActive = c.id === child.id;
          return (
            <button
              key={c.id}
              onClick={() => dispatch({ type: "SET_ACTIVE_CHILD", childId: c.id })}
              className="glass"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 14px",
                borderRadius: "var(--radius-sm)",
                boxShadow: "var(--shadow-card)",
                border: isActive ? "1.5px solid var(--violet-700)" : "1px solid transparent",
                textAlign: "start",
              }}
            >
              <div style={{ flexShrink: 0 }}>
                <EggAvatar photoUrl={c.photoUrl} color={c.avatarColor} initial={c.initial} size={38} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="row-between">
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{c.name}</span>
                  <span className="money" style={{ fontSize: 14 }}>{c.balance.toLocaleString("he-IL")}₪</span>
                </div>
                {goal && goalPct !== null && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                    <div style={{ flex: 1, height: 5, borderRadius: 999, background: "var(--line-soft)", overflow: "hidden" }}>
                      <div style={{ width: `${goalPct}%`, height: "100%", background: "var(--violet-700)", borderRadius: 999 }} />
                    </div>
                    <span style={{ fontSize: 10.5, color: "var(--ink-faint)", flexShrink: 0 }}>{goal.title} {goalPct}%</span>
                  </div>
                )}
              </div>
              {pending > 0 && (
                <span
                  style={{
                    background: "var(--violet-700)",
                    color: "#fff",
                    fontSize: 10.5,
                    fontWeight: 800,
                    borderRadius: 999,
                    padding: "3px 8px",
                    flexShrink: 0,
                  }}
                >
                  {pending} לאישור
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tradeOffers.length > 0 && (
        <>
          <SectionTitle>הצעות החלפת מטלות</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 20px 20px" }}>
            {tradeOffers.map(({ fromChild, task, toChild }) => (
              <div
                key={task.id}
                style={{
                  borderRadius: "var(--radius-sm)",
                  padding: "13px 15px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  border: "1px dashed var(--violet-700)",
                  background: "var(--violet-200)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700 }}>
                    {fromChild.name} מציע/ה ל{toChild?.name ?? "אח/ות"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>
                    {task.title} · {task.reward.toLocaleString("he-IL")}₪
                  </div>
                </div>
                <button
                  onClick={() => dispatch({ type: "APPROVE_TASK_TRADE", fromChildId: fromChild.id, taskId: task.id })}
                  style={{ background: "var(--teal-700)", color: "#ffffff", border: "none", borderRadius: 999, padding: "8px 14px", fontSize: 12.5, fontWeight: 800, flexShrink: 0 }}
                >
                  אישור
                </button>
                <button
                  onClick={() => dispatch({ type: "CANCEL_TASK_TRADE", childId: fromChild.id, taskId: task.id })}
                  style={{ background: "none", border: "none", color: "var(--ink-faint)", fontSize: 14, flexShrink: 0 }}
                  aria-label="ביטול ההצעה"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <SectionTitle>מטלות מומלצות ל{child.name}</SectionTitle>
      {recommended.length === 0 ? (
        <div style={{ padding: "0 20px 20px" }}>
          <EmptyState text={`ל${child.name} כבר יש את כל המטלות הזמינות`} actionLabel="למאגר המטלות" onAction={() => navigate("/parent/tasks-bank")} />
        </div>
      ) : (
        <div style={{ position: "relative", padding: "6px 20px 24px" }}>
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 6,
              bottom: 24,
              insetInlineStart: "50%",
              borderInlineStart: "3px dashed var(--line)",
            }}
          />
          {recommended.map((t, i) => {
            const size = 52 + Math.min(20, Math.round(t.reward / 2));
            const leftSide = i % 2 === 0;
            return (
              <button
                key={t.id}
                onClick={() => assign(t.id, t.title)}
                style={{
                  position: "relative",
                  zIndex: 1,
                  width: "100%",
                  display: "flex",
                  flexDirection: leftSide ? "row" : "row-reverse",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 20,
                  background: "none",
                  border: "none",
                  textAlign: leftSide ? "start" : "end",
                }}
              >
                <span
                  style={{
                    width: size,
                    height: size,
                    borderRadius: "50%",
                    background: categoryTileColor(t.category),
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "var(--shadow-card-solid)",
                    flexShrink: 0,
                  }}
                >
                  {categoryIcon(t.category)}
                </span>
                <div
                  className="glass"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: "10px 14px",
                    borderRadius: leftSide ? "6px 22px 22px 22px" : "22px 6px 22px 22px",
                  }}
                >
                  <div style={{ fontSize: 13.5, fontWeight: 800, lineHeight: 1.3 }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 3 }}>
                    הקצאה ל{child.name} · <span className="money" style={{ color: "var(--teal-900)", fontWeight: 800 }}>{t.reward}₪</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Toast message={toastMessage} />
      <SendMoneyFab childId={child.id} />
      <ParentBottomNav />
    </div>
  );
}
