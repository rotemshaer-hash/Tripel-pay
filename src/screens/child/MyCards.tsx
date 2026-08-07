import { useState } from "react";
import { Header } from "../../components/Header";
import { ChildBottomNav } from "../../components/BottomNav";
import { Card, SectionTitle, EmptyState } from "../../components/UI";
import { WalletCard } from "../../components/WalletCard";
import { IconReceipt, IconPeopleCoin, IconGift, IconCardCheck } from "../../components/Icons";
import { useActiveChild, useStore } from "../../data/store";
import type { ExtraCard } from "../../data/types";

const cardIcons: Record<ExtraCard["category"], React.ReactNode> = {
  subscription: <IconReceipt size={24} />,
  membership: <IconPeopleCoin size={24} />,
  gift: <IconGift size={24} />,
  other: <IconCardCheck size={24} />,
};

const categoryLabels: Record<ExtraCard["category"], string> = {
  subscription: "מנוי",
  membership: "חברות מועדון",
  gift: "כרטיס מתנה",
  other: "אחר",
};

export function ChildMyCards() {
  const child = useActiveChild();
  const { dispatch } = useStore();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ExtraCard["category"]>("subscription");

  function add() {
    if (!name.trim()) return;
    dispatch({ type: "ADD_EXTRA_CARD", childId: child.id, name: name.trim(), category });
    setName("");
    setAdding(false);
  }

  return (
    <div className="screen">
      <Header title="הכרטיסים שלי" back />

      <div style={{ margin: "20px 20px 0" }}>
        <WalletCard holderName={child.name} />
      </div>

      <SectionTitle
        action={
          <button onClick={() => setAdding((v) => !v)} style={{ background: "none", border: "none", color: "var(--violet-700)", fontSize: 13, fontWeight: 700 }}>
            {adding ? "ביטול" : "+ הוספת כרטיס"}
          </button>
        }
      >
        כרטיסים נוספים
      </SectionTitle>

      {adding && (
        <div style={{ padding: "0 20px 16px" }}>
          <Card>
            <label style={{ fontSize: 12, color: "var(--ink-soft)", display: "block", marginBottom: 6 }}>שם הכרטיס</label>
            <input
              placeholder="למשל: מנוי נטפליקס"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--line)", fontSize: 14, marginBottom: 10 }}
            />
            <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
              {(Object.keys(categoryLabels) as ExtraCard["category"][]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    border: category === cat ? "2px solid var(--teal-500)" : "1px solid var(--line)",
                    background: category === cat ? "var(--teal-100)" : "transparent",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {categoryLabels[cat]}
                </button>
              ))}
            </div>
            <button
              onClick={add}
              disabled={!name.trim()}
              style={{ width: "100%", background: "var(--teal-700)", color: "#ffffff", border: "none", borderRadius: 10, padding: "10px", fontSize: 13.5, fontWeight: 700, opacity: name.trim() ? 1 : 0.5 }}
            >
              שמירה
            </button>
          </Card>
        </div>
      )}

      <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {child.extraCards.length === 0 && !adding && <EmptyState text="עדיין אין כרטיסים נוספים — הוסיפו מנוי, כרטיס מועדון או שובר לסריקה מהירה" />}
        {child.extraCards.map((c) => (
          <Card key={c.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--violet-700)", flexShrink: 0 }}>
              {cardIcons[c.category]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{c.name}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 2 }}>{categoryLabels[c.category]}</div>
            </div>
            <button
              onClick={() => dispatch({ type: "REMOVE_EXTRA_CARD", childId: child.id, cardId: c.id })}
              aria-label="הסרת כרטיס"
              style={{ background: "none", border: "none", color: "var(--coral-600)", fontSize: 13, fontWeight: 700 }}
            >
              הסרה
            </button>
          </Card>
        ))}
      </div>
      <ChildBottomNav />
    </div>
  );
}
