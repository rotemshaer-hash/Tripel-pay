import { useState } from "react";
import { Header } from "../../components/Header";
import { ChildBottomNav } from "../../components/BottomNav";
import { SectionTitle } from "../../components/UI";
import { TaskCard } from "../../components/TaskCard";
import { useActiveChild, useStore } from "../../data/store";
import { childrenList } from "../../data/family";

export function ChildAllTasks() {
  const { state, dispatch } = useStore();
  const child = useActiveChild();
  const [offeringId, setOfferingId] = useState<string | null>(null);

  const siblings = childrenList(state.family).filter((c) => c.id !== child.id);
  const active = child.tasks.filter((t) => t.status !== "completed");
  const done = child.tasks.filter((t) => t.status === "completed");

  function offerTo(taskId: string, toChildId: string) {
    dispatch({ type: "OFFER_TASK_TRADE", childId: child.id, taskId, toChildId });
    setOfferingId(null);
  }

  return (
    <div className="screen">
      <Header title="המטלות שלי" back tint="playful" />
      <SectionTitle>המטלות שלי</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 20px 20px" }}>
        {active.length === 0 && <div style={{ color: "var(--ink-faint)", fontSize: 13.5, padding: "10px 4px" }}>כל הכבוד! סיימת את כל המטלות 🎉</div>}
        {active.map((t) => (
          <div key={t.id}>
            <TaskCard
              task={t}
              actionLabel={t.status === "available" ? "התחלה" : t.status === "in_progress" ? "סיימתי" : undefined}
              onAction={t.status !== "pending_approval" ? () => dispatch({ type: "ADVANCE_TASK", childId: child.id, taskId: t.id }) : undefined}
            />
            {siblings.length > 0 && t.status !== "pending_approval" && (
              <div style={{ padding: "6px 15px 0" }}>
                {t.tradeOfferedTo ? (
                  <button
                    onClick={() => dispatch({ type: "CANCEL_TASK_TRADE", childId: child.id, taskId: t.id })}
                    style={{ background: "none", border: "none", color: "var(--coral-600)", fontSize: 12, fontWeight: 700 }}
                  >
                    ✓ הוצע ל{state.family.children[t.tradeOfferedTo]?.name ?? "אח/ות"} · ביטול ההצעה
                  </button>
                ) : offeringId === t.id ? (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>להציע ל:</span>
                    {siblings.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => offerTo(t.id, s.id)}
                        style={{ padding: "5px 10px", borderRadius: 999, border: "1px solid var(--line)", background: "transparent", fontSize: 12, fontWeight: 700 }}
                      >
                        {s.name}
                      </button>
                    ))}
                    <button onClick={() => setOfferingId(null)} style={{ background: "none", border: "none", color: "var(--ink-faint)", fontSize: 12 }}>
                      ביטול
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setOfferingId(t.id)}
                    style={{ background: "none", border: "none", color: "var(--violet-700)", fontSize: 12, fontWeight: 700 }}
                  >
                    🔁 להציע לאח/ות
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {done.length > 0 && (
        <>
          <SectionTitle>הושלמו</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 20px 20px" }}>
            {done.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </div>
        </>
      )}
      <ChildBottomNav />
    </div>
  );
}
