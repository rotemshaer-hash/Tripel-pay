import { Header } from "../../components/Header";
import { ChildBottomNav } from "../../components/BottomNav";
import { Card, SectionTitle, EmptyState } from "../../components/UI";
import { giftIcons, categoryLabels } from "../parent/GiftBank";
import { useActiveChild } from "../../data/store";

export function ChildMyVouchers() {
  const child = useActiveChild();

  return (
    <div className="screen">
      <Header title="השוברים שלי" back tint="playful" />
      <SectionTitle>מתנות שמימשתי</SectionTitle>
      <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {child.redeemedGifts.length === 0 && <EmptyState text="עדיין לא מימשת אף מתנה — תבדוק/י את מאגר המתנות!" />}
        {child.redeemedGifts.map((g) => (
          <Card key={g.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--violet-700)", flexShrink: 0 }}>
              {giftIcons[g.category]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{g.title}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 2 }}>
                {categoryLabels[g.category]} · {g.date}
              </div>
            </div>
            <span className="money" style={{ fontSize: 13.5, fontWeight: 700, color: "var(--violet-700)" }}>
              {g.cost.toLocaleString("he-IL")}₪
            </span>
          </Card>
        ))}
      </div>
      <ChildBottomNav />
    </div>
  );
}
