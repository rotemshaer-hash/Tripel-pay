import { Header } from "../../components/Header";
import { ParentBottomNav } from "../../components/BottomNav";
import { SendMoneyFab } from "../../components/SendMoneyFab";
import { SectionTitle, ProgressRing } from "../../components/UI";
import { Confetti } from "../../components/Confetti";
import { StatTile } from "../../components/StatTile";
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "20px 20px 0" }}>
        <StatTile
          badge={<BadgeFlame size={34} />}
          label="רצף עקביות"
          value={`${child.achievements.consistencyStreakWeeks} שבועות`}
          gradient="linear-gradient(140deg, #ffb347 0%, #f2761b 100%)"
        />
        <StatTile badge={<BadgeCheck size={34} />} label="מטלות שבוצעו" value={child.achievements.tasksCompletedCount} gradient="var(--grad-violet)" />
        <StatTile badge={<BadgeStar size={34} />} label="מטלה מועדפת" value={child.achievements.favoriteTask} gradient="var(--grad-teal)" />
        <StatTile
          badge={<BadgeCoin size={34} />}
          label='הרוויח/ה בסה"כ'
          value={<span className="money">{totalEarned(child).toLocaleString("he-IL")}₪</span>}
          gradient="linear-gradient(140deg, #37d3b8 0%, #1f9e8a 100%)"
        />
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
