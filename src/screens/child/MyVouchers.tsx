import { Header } from "../../components/Header";
import { ChildBottomNav } from "../../components/BottomNav";
import { Card, SectionTitle, EmptyState } from "../../components/UI";
import { giftIcons, categoryLabels } from "../parent/GiftBank";
import { useActiveChild } from "../../data/store";
import { formatDate } from "../../utils/datetime";

export function ChildMyVouchers() {
  const child = useActiveChild();

  return (
    <div className="screen">
      <Header title="השוברים שלי" back tint="playful" />
      <SectionTitle>מתנות שמימשתי</SectionTitle>
      <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {child.redeemedGifts.length === 0 && <EmptyState text="עדיין לא מימשת אף מתנה — תבדוק/י את מאגר המתנות!" />}
        {child.redeemedGifts.map((g) => (
          <Card key={g.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--violet-700)", flexShrink: 0 }}>
                {giftIcons[g.category]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{g.title}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 2 }}>
                  {categoryLabels[g.category]} · {formatDate(g.date)}
                </div>
              </div>
              <span className="money" style={{ fontSize: 13.5, fontWeight: 700, color: "var(--violet-700)" }}>
                {g.cost.toLocaleString("he-IL")}₪
              </span>
            </div>
            {g.fulfilled ? (
              g.code ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--coral-100)", borderRadius: 10, padding: "8px 12px" }}>
                  <span style={{ fontSize: 11.5, color: "var(--coral-600)", fontWeight: 700 }}>קוד השובר</span>
                  <span dir="ltr" style={{ flex: 1, fontFamily: "var(--mono, monospace)", fontSize: 14, fontWeight: 800, letterSpacing: "0.06em", textAlign: "center" }}>{g.code}</span>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: "var(--coral-600)", fontWeight: 700 }}>נמסר ✓</div>
              )
            ) : (
              <div style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 700 }}>⏳ ממתין למסירה מההורה</div>
            )}
          </Card>
        ))}
      </div>
      <ChildBottomNav />
    </div>
  );
}
