import { Header } from "../../components/Header";
import { ChildBottomNav } from "../../components/BottomNav";
import { useStore } from "../../data/store";

export function ChildHouseRules() {
  const { state } = useStore();
  const rules = state.family.houseRules ?? [];

  return (
    <div className="screen">
      <Header title="הכללים שלנו 🏡" subtitle="ככה אנחנו עושים דברים במשפחה שלנו" back />
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "20px 20px 24px" }}>
        {rules.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--ink-faint)", fontSize: 13.5, padding: "28px 20px" }}>ההורה שלך עוד לא הוסיף כללים 🙂</div>
        )}
        {rules.map((rule, i) => (
          <div
            key={rule.id}
            className="glass"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              borderRadius: "var(--radius-md)",
              padding: 16,
              boxShadow: "var(--shadow-card)",
            }}
          >
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--teal-700), var(--violet-700))",
                color: "#fff",
                fontSize: 14,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {i + 1}
            </span>
            <span style={{ fontSize: 14.5, fontWeight: 600 }}>{rule.text}</span>
          </div>
        ))}
      </div>
      <ChildBottomNav />
    </div>
  );
}
