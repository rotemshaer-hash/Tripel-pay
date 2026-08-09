import { useState } from "react";
import { Header } from "../../components/Header";
import { ChildBottomNav } from "../../components/BottomNav";
import { SectionTitle, Card, ProgressBar, EmptyState } from "../../components/UI";
import { GoalCelebration } from "../../components/GoalCelebration";
import { useActiveChild, useStore } from "../../data/store";
import piggyIllustration from "../../assets/illustration-piggy.png";
import type { SavingsGoal } from "../../data/types";

export function ChildSavings() {
  const child = useActiveChild();
  const { dispatch } = useStore();
  const [celebrating, setCelebrating] = useState<SavingsGoal | null>(null);

  function contribute(goal: SavingsGoal) {
    dispatch({ type: "CONTRIBUTE_SAVINGS", childId: child.id, goalId: goal.id, amount: 5 });
    if (goal.current < goal.target && goal.current + 5 >= goal.target) {
      setCelebrating({ ...goal, current: goal.target });
    }
  }

  return (
    <div className="screen">
      <Header title="החיסכון שלי" subtitle={`סה"כ: ${child.savingsTotal.toLocaleString("he-IL")}₪`} back tint="playful" />
      <div style={{ display: "flex", justifyContent: "center", margin: "16px 0 4px" }}>
        <img src={piggyIllustration} alt="" style={{ width: 96, height: "auto" }} />
      </div>
      <SectionTitle>המטרות שלי</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 20px 24px" }}>
        {child.savingsGoals.length === 0 && <EmptyState text="עדיין אין לך מטרת חיסכון — בקש/י מההורה שיוסיף אחת, ותתחיל/י לחסוך למשהו שממש בא לך עליו! 🎯" />}
        {child.savingsGoals.map((g) => (
          <Card key={g.id}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{g.title}</span>
              <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }} className="money">
                {g.current.toLocaleString("he-IL")} / {g.target.toLocaleString("he-IL")}₪
              </span>
            </div>
            <ProgressBar value={g.current} max={g.target} color={g.current >= g.target ? "var(--teal-700)" : "var(--violet-500)"} />
            {g.current >= g.target ? (
              <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--teal-900)", fontWeight: 700 }}>🎉 המטרה הושגה!</div>
            ) : (
              <button
                onClick={() => contribute(g)}
                disabled={child.balance < 5}
                style={{ marginTop: 10, fontSize: 12, fontWeight: 700, padding: "7px 12px", borderRadius: 999, border: "1px solid var(--line)", background: "rgba(15,33,29,0.06)", color: "var(--ink)", cursor: "pointer" }}
              >
                + 5₪ מהארנק שלי
              </button>
            )}
          </Card>
        ))}
      </div>
      {celebrating && <GoalCelebration goal={celebrating} onClose={() => setCelebrating(null)} />}
      <ChildBottomNav />
    </div>
  );
}
