import { useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";
import { ChildBottomNav } from "../../components/BottomNav";
import { SectionTitle, Card } from "../../components/UI";
import { IconChecklist } from "../../components/Icons";
import { MissionTrail } from "../../components/MissionTrail";
import { GoalCrystal } from "../../components/GoalCrystal";
import { WalletCard } from "../../components/WalletCard";
import { EggAvatar } from "../../components/EggAvatar";
import { ExtraCardVisual } from "../../components/ExtraCardVisual";
import { CardCarousel } from "../../components/CardCarousel";
import { NotificationsBell } from "../../components/NotificationsBell";
import { RewardRevealCard } from "../../components/RewardRevealCard";
import { SceneRest } from "../../components/Illustrations";
import { BadgeFlame, BadgeCoin } from "../../components/Badges";
import { useActiveChild, useStore } from "../../data/store";
import { childrenList, totalEarned } from "../../data/family";
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
        tint="playful"
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
      >
        <div style={{ textAlign: "center" }}>
          <div className="egg-breathe" style={{ display: "flex", justifyContent: "center", marginBottom: 10, filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.25))" }}>
            <EggAvatar photoUrl={child.photoUrl} color={child.avatarColor} initial={child.initial} size={64} />
          </div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>הארנק שלי</div>
          <div className="money" style={{ fontSize: 42, marginTop: 4 }}>
            {displayBalance.toLocaleString("he-IL")}₪
          </div>
        </div>
      </Header>

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

      <CardCarousel
        items={[
          <div key="main" className="levitate">
            <WalletCard holderName={child.name} onClick={() => navigate("/child/cards")} />
          </div>,
          ...child.extraCards.map((c) => <ExtraCardVisual key={c.id} card={c} onClick={() => navigate("/child/cards")} />),
        ]}
      />

      <button
        onClick={() => navigate("/child/achievements")}
        style={{ display: "flex", gap: 10, padding: "16px 20px 0", width: "100%", background: "none", border: "none", textAlign: "start" }}
      >
        <Card style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
          <BadgeFlame size={38} />
          <div>
            <div style={{ fontSize: 10.5, color: "var(--ink-soft)" }}>רצף שבועות</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--violet-700)" }}>{child.achievements.consistencyStreakWeeks}</div>
          </div>
        </Card>
        <Card style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
          <BadgeCoin size={38} />
          <div>
            <div style={{ fontSize: 10.5, color: "var(--ink-soft)" }}>הרווחתי בסה"כ</div>
            <div className="money" style={{ fontSize: 15, fontWeight: 800, color: "var(--violet-700)" }}>
              {totalEarned(child).toLocaleString("he-IL")}₪
            </div>
          </div>
        </Card>
      </button>

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
      {quickTasks.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "10px 4px 20px" }}>
          <SceneRest size={110} />
          <div style={{ color: "var(--ink-faint)", fontSize: 13.5 }}>כל הכבוד! סיימת את כל המטלות 🎉</div>
        </div>
      ) : (
        <MissionTrail
          items={quickTasks.map((t) => ({
            task: t,
            actionLabel: t.status === "available" ? "התחלה" : t.status === "in_progress" ? "סיימתי" : undefined,
            onAction: t.status !== "pending_approval" ? () => dispatch({ type: "ADVANCE_TASK", childId: child.id, taskId: t.id }) : undefined,
          }))}
        />
      )}

      <SectionTitle
        action={
          <button onClick={() => navigate("/child/savings")} style={{ background: "none", border: "none", color: "var(--violet-700)", fontSize: 13, fontWeight: 700 }}>
            החיסכון שלי ‹
          </button>
        }
      >
        המטרה שלי
      </SectionTitle>
      <div style={{ padding: "0 20px 20px" }}>
        {child.savingsGoals[0] ? (
          <GoalCrystal goal={child.savingsGoals[0]} onClick={() => navigate("/child/savings")} />
        ) : (
          <button onClick={() => navigate("/child/savings")} style={{ display: "block", width: "100%", background: "none", border: "none", textAlign: "start" }}>
            <Card style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 28 }}>🎯</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>עדיין אין לך מטרת חיסכון</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 2 }}>לחצו כדי להתחיל לחסוך למשהו שממש בא לכם עליו</div>
              </div>
            </Card>
          </button>
        )}
      </div>
      {unrevealed && (
        <RewardRevealCard task={unrevealed} onDone={() => dispatch({ type: "REVEAL_TASK_REWARD", childId: child.id, taskId: unrevealed.id })} />
      )}
      <ChildBottomNav />
    </div>
  );
}
