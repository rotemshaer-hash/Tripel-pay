import { useState } from "react";
import { Header } from "../../components/Header";
import { ParentBottomNav } from "../../components/BottomNav";
import { SendMoneyFab } from "../../components/SendMoneyFab";
import { SectionTitle, Card, EmptyState } from "../../components/UI";
import { Toast, useToast } from "../../components/Toast";
import { GoalCelebration } from "../../components/GoalCelebration";
import { useActiveChild, useStore } from "../../data/store";
import piggyIllustration from "../../assets/illustration-piggy.png";
import type { SavingsGoal } from "../../data/types";

function GoalBar({
  goal,
  faded,
  expanded,
  onToggle,
  onContribute,
}: {
  goal: SavingsGoal;
  faded?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  onContribute?: (amount: number) => void;
}) {
  const pct = Math.min(100, Math.round((goal.current / Math.max(1, goal.target)) * 100));
  const label = goal.current >= goal.target ? `${goal.target.toLocaleString("he-IL")}₪` : `${goal.current.toLocaleString("he-IL")}₪ / ${goal.target.toLocaleString("he-IL")}₪`;
  const remaining = goal.target - goal.current;
  const almostThere = !faded && pct >= 80 && pct < 100;
  const [amount, setAmount] = useState("");

  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: 0, opacity: faded ? 0.55 : 1 }}>
      <button
        onClick={onToggle}
        disabled={!onToggle}
        style={{ display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", padding: 0, width: "100%", textAlign: "start" }}
      >
        <span style={{ fontSize: 15, color: "var(--violet-700)", transform: expanded ? "rotate(-90deg)" : "none", transition: "transform 0.15s" }}>‹</span>
        <div style={{ flex: 1, position: "relative", height: 34, borderRadius: 999, background: "var(--line-soft)", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, width: `${pct}%`, background: "var(--violet-700)", borderRadius: 999 }} />
          <div style={{ position: "relative", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: pct > 45 ? "#fff" : "var(--ink)" }}>
            {label}
          </div>
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, minWidth: 60, textAlign: "start" }}>{goal.title}</span>
      </button>
      {almostThere && (
        <div style={{ fontSize: 11.5, color: "var(--violet-700)", fontWeight: 700, marginTop: 8 }}>
          כמעט הגעתם! עוד {remaining.toLocaleString("he-IL")}₪ ל{goal.title} 🎯
        </div>
      )}
      {expanded && onContribute && (
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input
            type="number"
            placeholder="סכום להפקדה (₪)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ flex: 1, padding: "8px 10px", borderRadius: 10, fontSize: 13 }}
          />
          <button
            onClick={() => {
              const n = Number(amount);
              if (n > 0) {
                onContribute(n);
                setAmount("");
              }
            }}
            style={{
              background: "var(--violet-700)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "0 16px",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            הפקדה
          </button>
        </div>
      )}
    </Card>
  );
}

export function ParentSavings() {
  const { dispatch } = useStore();
  const child = useActiveChild();
  const [newGoal, setNewGoal] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newNote, setNewNote] = useState("");
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState<SavingsGoal | null>(null);
  const { toastMessage, showToast } = useToast();

  function contribute(goal: SavingsGoal, amount: number) {
    if (child.balance < amount) {
      showToast(`אין מספיק יתרה ל${child.name} להפקדה הזו`);
      return;
    }
    dispatch({ type: "CONTRIBUTE_SAVINGS", childId: child.id, goalId: goal.id, amount });
    setExpandedGoalId(null);
    if (goal.current < goal.target && goal.current + amount >= goal.target) {
      setCelebrating({ ...goal, current: goal.target });
    } else {
      showToast(`${amount}₪ הופקדו למטרה "${goal.title}"`);
    }
  }

  return (
    <div className="screen">
      <Header title={`החסכונות של ${child.name}`} back tint="playful" />

      <div style={{ display: "flex", justifyContent: "center", margin: "16px 0 4px" }}>
        <img src={piggyIllustration} alt="" style={{ width: 96, height: "auto" }} />
      </div>

      <SectionTitle>חסכונות קיימים</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 20px" }}>
        {child.savingsGoals.length === 0 && (
          <EmptyState text="אין מטרות חיסכון פעילות" actionLabel="הוספת מטרה" onAction={() => document.getElementById("new-goal-input")?.focus()} />
        )}
        {child.savingsGoals.map((g) => (
          <GoalBar
            key={g.id}
            goal={g}
            expanded={expandedGoalId === g.id}
            onToggle={() => setExpandedGoalId(expandedGoalId === g.id ? null : g.id)}
            onContribute={(amount) => contribute(g, amount)}
          />
        ))}
      </div>

      <SectionTitle>הוספת מטרת חיסכון</SectionTitle>
      <div style={{ padding: "0 20px" }}>
        <Card style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            id="new-goal-input"
            placeholder="שם המטרה (למשל: קורקינט)"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            style={{ padding: "10px 12px", borderRadius: 10 }}
          />
          <input placeholder="סכום יעד (₪)" type="number" value={newTarget} onChange={(e) => setNewTarget(e.target.value)} style={{ padding: "10px 12px", borderRadius: 10 }} />
          <textarea
            placeholder="מכתב לעתיד (אופציונלי): למה זה חשוב לילד/ה? יוצג כשהיעד יושג ✉️"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={2}
            style={{ padding: "10px 12px", borderRadius: 10, fontFamily: "inherit", resize: "none" }}
          />
          <button
            onClick={() => {
              if (!newGoal || !newTarget) return;
              dispatch({
                type: "ADD_SAVINGS_GOAL",
                childId: child.id,
                goal: { id: `sg-${crypto.randomUUID()}`, title: newGoal, target: Number(newTarget), current: 0, note: newNote.trim() || undefined },
              });
              showToast(`מטרת החיסכון "${newGoal}" נוספה`);
              setNewGoal("");
              setNewTarget("");
              setNewNote("");
            }}
            style={{
              background: "var(--violet-700)",
              color: "#ffffff",
              border: "none",
              borderRadius: 12,
              padding: "11px",
              fontWeight: 800,
              boxShadow: "var(--glow-violet)",
            }}
          >
            הוספה
          </button>
        </Card>
      </div>

      <SectionTitle>היסטוריית חסכונות</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 20px 24px" }}>
        {child.savingsHistory.length === 0 && <EmptyState text="עדיין אין חסכונות שהושלמו" />}
        {child.savingsHistory.map((g) => (
          <GoalBar key={g.id} goal={g} faded />
        ))}
      </div>
      <Toast message={toastMessage} />
      {celebrating && <GoalCelebration goal={celebrating} onClose={() => setCelebrating(null)} />}
      <SendMoneyFab childId={child.id} />
      <ParentBottomNav />
    </div>
  );
}
