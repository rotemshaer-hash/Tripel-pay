import { useState } from "react";
import { Header } from "../../components/Header";
import { ParentBottomNav } from "../../components/BottomNav";
import { SectionTitle, Card, EmptyState } from "../../components/UI";
import { Toast, useToast } from "../../components/Toast";
import { useStore } from "../../data/store";

export function HouseRules() {
  const { state, dispatch } = useStore();
  const [newRule, setNewRule] = useState("");
  const { toastMessage, showToast } = useToast();
  const rules = state.family.houseRules ?? [];

  function addRule() {
    if (!newRule.trim()) return;
    dispatch({ type: "ADD_HOUSE_RULE", text: newRule.trim() });
    setNewRule("");
    showToast("החוק נוסף לכללי הבית");
  }

  return (
    <div className="screen">
      <Header title="כללי הבית שלנו" subtitle="נראה לכל הילדים במשפחה" back tint="playful" />

      <SectionTitle>החוקים שלנו</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 20px" }}>
        {rules.length === 0 && <EmptyState text="עדיין לא נקבעו חוקים — הוסיפו את הראשון למטה" />}
        {rules.map((rule, i) => (
          <Card key={rule.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: "var(--violet-200)",
                color: "var(--violet-700)",
                fontSize: 12,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {i + 1}
            </span>
            <span style={{ flex: 1, fontSize: 14 }}>{rule.text}</span>
            <button
              onClick={() => dispatch({ type: "REMOVE_HOUSE_RULE", ruleId: rule.id })}
              aria-label="הסרת חוק"
              style={{ background: "none", border: "none", color: "var(--ink-faint)", fontSize: 16, padding: 4, flexShrink: 0 }}
            >
              ✕
            </button>
          </Card>
        ))}
      </div>

      <SectionTitle>הוספת חוק חדש</SectionTitle>
      <div style={{ padding: "0 20px 24px" }}>
        <Card style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            placeholder="לדוגמה: אחרי הארוחה כל אחד מנקה את הצלחת שלו"
            value={newRule}
            onChange={(e) => setNewRule(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addRule()}
            style={{ padding: "10px 12px", borderRadius: 10 }}
          />
          <button
            onClick={addRule}
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

      <Toast message={toastMessage} />
      <ParentBottomNav />
    </div>
  );
}
