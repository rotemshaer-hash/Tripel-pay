import { Header } from "../../components/Header";
import { ParentBottomNav } from "../../components/BottomNav";
import { SendMoneyFab } from "../../components/SendMoneyFab";
import { SectionTitle, Card, ProgressRing } from "../../components/UI";
import { Confetti } from "../../components/Confetti";
import { BadgeFlame, BadgeCheck, BadgeStar, BadgeCoin } from "../../components/Badges";
import { useActiveChild } from "../../data/store";
import { totalEarned } from "../../data/family";

const HEX = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";
const badgeGeometry = [
  { size: 66, rotate: -8, y: 0 },
  { size: 52, rotate: 6, y: 14 },
  { size: 60, rotate: -4, y: -6 },
  { size: 46, rotate: 10, y: 10 },
];

export function ParentAchievements() {
  const child = useActiveChild();
  const strengths = child.strengths.filter((s) => s.level === "strength");
  const difficulties = child.strengths.filter((s) => s.level === "difficulty");

  return (
    <div className="screen">
      <Confetti />
      <Header title={`ההישגים של ${child.name}`} subtitle="🎉 עוד צעד לבגרות פיננסית" back tall tint="playful" />

      <div style={{ display: "flex", justifyContent: "space-around", padding: "20px 20px 4px" }}>
        <ProgressRing pct={child.achievements.lessonsProgress} label="שיעורים בחינוך פיננסי" color="var(--violet-500)" />
        <ProgressRing pct={child.achievements.savingsPaidProgress} label="חסכונות ששולמו" color="var(--teal-500)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "20px 20px 0" }}>
        <Card style={{ textAlign: "center", padding: "10px 6px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <BadgeFlame size={48} />
          <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>רצף עקביות</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--violet-700)" }}>{child.achievements.consistencyStreakWeeks} שבועות</div>
        </Card>
        <Card style={{ textAlign: "center", padding: "10px 6px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <BadgeCheck size={48} />
          <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>מטלות שבוצעו</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{child.achievements.tasksCompletedCount}</div>
        </Card>
        <Card style={{ textAlign: "center", padding: "10px 6px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <BadgeStar size={48} />
          <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>מטלה מועדפת</div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{child.achievements.favoriteTask}</div>
        </Card>
        <Card style={{ textAlign: "center", padding: "10px 6px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <BadgeCoin size={48} />
          <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>הרוויח/ה בסה"כ</div>
          <div style={{ fontSize: 14, fontWeight: 700 }} className="money">
            {totalEarned(child).toLocaleString("he-IL")}₪
          </div>
        </Card>
      </div>

      <SectionTitle>נקודות חוזק</SectionTitle>
      <div style={{ display: "flex", gap: 6, padding: "6px 20px", flexWrap: "wrap", alignItems: "flex-end" }}>
        {strengths.map((s, i) => {
          const geo = badgeGeometry[i % badgeGeometry.length];
          return (
            <div key={s.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 74, marginTop: geo.y }}>
              <div
                style={{
                  width: geo.size,
                  height: geo.size * 1.1,
                  clipPath: HEX,
                  background: "var(--grad-teal)",
                  boxShadow: "var(--glow-teal)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: geo.size * 0.36,
                  transform: `rotate(${geo.rotate}deg)`,
                }}
              >
                <span style={{ transform: `rotate(${-geo.rotate}deg)` }}>⭐</span>
              </div>
              <span style={{ fontSize: 11, textAlign: "center" }}>{s.title}</span>
            </div>
          );
        })}
      </div>

      <SectionTitle>נקודות קושי</SectionTitle>
      <div style={{ display: "flex", gap: 6, padding: "6px 20px 24px", flexWrap: "wrap", alignItems: "flex-end" }}>
        {difficulties.map((s, i) => {
          const geo = badgeGeometry[(i + 2) % badgeGeometry.length];
          return (
            <div key={s.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 74, marginTop: geo.y }}>
              <div
                style={{
                  width: geo.size,
                  height: geo.size * 1.1,
                  clipPath: HEX,
                  background: "var(--grad-violet)",
                  boxShadow: "var(--glow-violet)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: geo.size * 0.36,
                  transform: `rotate(${geo.rotate}deg)`,
                }}
              >
                <span style={{ transform: `rotate(${-geo.rotate}deg)` }}>💪</span>
              </div>
              <span style={{ fontSize: 11, textAlign: "center" }}>{s.title}</span>
            </div>
          );
        })}
      </div>
      <SendMoneyFab childId={child.id} />
      <ParentBottomNav />
    </div>
  );
}
