import { Header } from "../../components/Header";
import { ParentBottomNav } from "../../components/BottomNav";
import { SendMoneyFab } from "../../components/SendMoneyFab";
import { SectionTitle, categoryIcon, categoryTileColor, EmptyState } from "../../components/UI";
import { Toast, useToast } from "../../components/Toast";
import { useActiveChild, useStore } from "../../data/store";
import { childrenList } from "../../data/family";
import { EggAvatar } from "../../components/EggAvatar";
import { FamilyMemberCard } from "../../components/FamilyMemberCard";
import { ParentNotificationsBell } from "../../components/ParentNotificationsBell";
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

  const pendingApprovals = childrenList(state.family).flatMap((c) => c.tasks.filter((t) => t.status === "pending_approval").map((t) => ({ approveChild: c, task: t })));

  function assign(templateId: string, title: string) {
    dispatch({ type: "ASSIGN_TASK", childId: child.id, templateId });
    showToast(`המטלה "${title}" הוקצתה ל${child.name}`);
  }

  function approve(childId: string, taskId: string, title: string) {
    dispatch({ type: "APPROVE_TASK", childId, taskId });
    showToast(`אושר: ${title}`);
  }

  return (
    <div className="screen">
      <Header
        title="מסך הבית"
        tint="playful"
        right={<ParentNotificationsBell />}
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
      <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 20px" }}>
        {childrenList(state.family).map((c) => (
          <FamilyMemberCard key={c.id} child={c} isActive={c.id === child.id} onSelect={() => dispatch({ type: "SET_ACTIVE_CHILD", childId: c.id })} />
        ))}
      </div>

      {pendingApprovals.length > 0 && (
        <>
          <SectionTitle>מטלות לאישור</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 20px" }}>
            {pendingApprovals.map(({ approveChild: c, task }) => (
              <div key={task.id} className="glass" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-card)" }}>
                <EggAvatar photoUrl={c.photoUrl} color={c.avatarColor} initial={c.initial} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 2 }}>
                    {c.name} · <span className="money" style={{ color: "var(--teal-900)", fontWeight: 800 }}>+{task.reward}₪</span>
                  </div>
                </div>
                <button
                  onClick={() => approve(c.id, task.id, task.title)}
                  style={{ background: "var(--teal-700)", color: "#ffffff", border: "none", borderRadius: 999, padding: "9px 16px", fontSize: 12.5, fontWeight: 800, boxShadow: "var(--glow-teal)", flexShrink: 0 }}
                >
                  אישור
                </button>
              </div>
            ))}
          </div>
        </>
      )}

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
        <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 20px 24px" }}>
          {recommended.map((t, i) => (
            <button
              key={t.id}
              onClick={() => assign(t.id, t.title)}
              className="glass"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 14px",
                borderRadius: "var(--radius-sm)",
                boxShadow: "var(--shadow-card)",
                background: `var(--tint-${(i % 5) + 1})`,
                textAlign: "start",
              }}
            >
              <span
                style={{
                  width: 44,
                  height: 44,
                  flexShrink: 0,
                  borderRadius: "54% 46% 50% 50% / 50% 50% 54% 46%",
                  background: categoryTileColor(t.category),
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 8px 16px -6px ${categoryTileColor(t.category)}`,
                }}
              >
                {categoryIcon(t.category)}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 2 }}>
                  הקצאה ל{child.name} · <span className="money" style={{ color: "var(--teal-900)", fontWeight: 800 }}>{t.reward}₪</span>
                </div>
              </div>
              <span style={{ background: "var(--teal-700)", color: "#ffffff", borderRadius: 999, padding: "8px 14px", fontSize: 12.5, fontWeight: 800, boxShadow: "var(--glow-teal)", flexShrink: 0 }}>
                + הקצאה
              </span>
            </button>
          ))}
        </div>
      )}

      <Toast message={toastMessage} />
      <SendMoneyFab childId={child.id} />
      <ParentBottomNav />
    </div>
  );
}
