import { useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";
import { ChildBottomNav } from "../../components/BottomNav";
import { SectionTitle } from "../../components/UI";
import { IconChecklist } from "../../components/Icons";
import { TaskCard } from "../../components/TaskCard";
import { WalletCard } from "../../components/WalletCard";
import { NotificationsBell } from "../../components/NotificationsBell";
import { RewardRevealCard } from "../../components/RewardRevealCard";
import { SceneRest } from "../../components/Illustrations";
import { useActiveChild, useStore } from "../../data/store";
import { childrenList } from "../../data/family";
import { useCountUp } from "../../hooks/useCountUp";

export function ChildHome() {
  const child = useActiveChild();
  const { state, dispatch, logout } = useStore();
  const displayBalance = useCountUp(child.balance);
  const navigate = useNavigate();
  const quickTasks = child.tasks.filter((t) => t.status !== "completed").slice(0, 2);
  const unrevealed = child.tasks.find((t) => t.status === "completed" && t.rewardRevealed === false);

  // Only a parent previewing "what my kid sees" can switch which kid is shown —
  // a real child login is locked to its own account (see SET_ACTIVE_CHILD reducer guard).
  const previewList = state.role === "parent" ? childrenList(state.family) : [];
  const previewIdx = previewList.findIndex((c) => c.id === child.id);

  function stepPreviewChild(dir: 1 | -1) {
    if (previewList.length < 2) return;
    const next = (previewIdx + dir + previewList.length) % previewList.length;
    dispatch({ type: "SET_ACTIVE_CHILD", childId: previewList[next].id });
  }

  async function signOut() {
    await logout();
    navigate("/onboarding/splash");
  }

  return (
    <div className="screen">
      <Header
        title={`היי ${child.name}! 👋`}
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <NotificationsBell child={child} />
            {state.role === "child" && (
              <button onClick={signOut} aria-label="התנתקות" style={{ background: "none", border: "none", color: "#fff", fontSize: 12.5, opacity: 0.85 }}>
                התנתקות
              </button>
            )}
          </div>
        }
      />
      <div style={{ background: "var(--header-gradient)", padding: "0 20px 22px", color: "#fff", textAlign: "center" }}>
        <div style={{ fontSize: 12, opacity: 0.85 }}>הארנק שלי</div>
        <div className="money" style={{ fontSize: 42, marginTop: 4 }}>
          {displayBalance.toLocaleString("he-IL")}₪
        </div>
      </div>

      {previewList.length > 1 && (
        <div style={{ margin: "14px 20px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <button
            onClick={() => stepPreviewChild(-1)}
            aria-label="הילד/ה הקודם/ת"
            style={{ background: "none", border: "none", fontSize: 20, color: "var(--teal-900)", fontWeight: 800 }}
          >
            ‹
          </button>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-soft)" }}>מציג/ה תצוגה של: {child.name}</span>
          <button
            onClick={() => stepPreviewChild(1)}
            aria-label="הילד/ה הבא/ה"
            style={{ background: "none", border: "none", fontSize: 20, color: "var(--teal-900)", fontWeight: 800 }}
          >
            ›
          </button>
        </div>
      )}

      <div style={{ margin: "20px 20px 0", display: "flex", gap: 12 }}>
        <WalletCard holderName={child.name} onClick={() => navigate("/child/cards")} />
        <button
          onClick={() => navigate("/child/vouchers")}
          style={{
            flex: 1,
            borderRadius: "50%",
            aspectRatio: "1",
            background: "var(--violet-700)",
            color: "#ffffff",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 3,
            border: "none",
            boxShadow: "var(--shadow-card-solid)",
            cursor: "pointer",
          }}
        >
          <div style={{ fontSize: 20 }}>🎫</div>
          <div style={{ fontSize: 10.5, opacity: 0.85, fontWeight: 700 }}>שוברים שלי</div>
          <div style={{ fontSize: 17, fontWeight: 800 }}>{child.redeemedGifts.length}</div>
        </button>
      </div>

      <div style={{ padding: "16px 20px 0" }}>
        <button
          onClick={() => navigate("/child/house-rules")}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderRadius: "var(--radius-sm)",
            padding: "12px 16px",
            border: "1px dashed var(--violet-700)",
            background: "var(--violet-200)",
            color: "var(--violet-700)",
          }}
        >
          <IconChecklist size={20} />
          <span style={{ fontSize: 13.5, fontWeight: 700, flex: 1, textAlign: "start" }}>הכללים שלנו בבית</span>
          <span style={{ fontSize: 16 }}>‹</span>
        </button>
      </div>

      <SectionTitle
        action={
          <button onClick={() => navigate("/child/tasks")} style={{ background: "none", border: "none", color: "var(--violet-700)", fontSize: 13, fontWeight: 700 }}>
            כל המטלות ‹
          </button>
        }
      >
        המטלות שלי היום
      </SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 20px 20px" }}>
        {quickTasks.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "10px 4px 4px" }}>
            <SceneRest size={110} />
            <div style={{ color: "var(--ink-faint)", fontSize: 13.5 }}>כל הכבוד! סיימת את כל המטלות 🎉</div>
          </div>
        )}
        {quickTasks.map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            actionLabel={t.status === "available" ? "התחלה" : t.status === "in_progress" ? "סיימתי" : undefined}
            onAction={t.status !== "pending_approval" ? () => dispatch({ type: "ADVANCE_TASK", childId: child.id, taskId: t.id }) : undefined}
          />
        ))}
      </div>
      {unrevealed && (
        <RewardRevealCard task={unrevealed} onDone={() => dispatch({ type: "REVEAL_TASK_REWARD", childId: child.id, taskId: unrevealed.id })} />
      )}
      <ChildBottomNav />
    </div>
  );
}
