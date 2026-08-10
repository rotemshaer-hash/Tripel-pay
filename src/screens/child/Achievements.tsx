import { Header } from "../../components/Header";
import { ChildBottomNav } from "../../components/BottomNav";
import { SectionTitle, Card, ProgressRing } from "../../components/UI";
import { Confetti } from "../../components/Confetti";
import { BadgeFlame, BadgeCheck, BadgeStar, BadgeCoin } from "../../components/Badges";
import { useActiveChild } from "../../data/store";

const HEX = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";
const badgeGeometry = [
  { size: 66, rotate: -8, y: 0 },
  { size: 52, rotate: 6, y: 14 },
  { size: 60, rotate: -4, y: -6 },
  { size: 46, rotate: 10, y: 10 },
];

export function ChildAchievements() {
  const child = useActiveChild();
  const strengths = child.strengths.filter((s) => s.level === "strength");
  const difficulties = child.strengths.filter((s) => s.level === "difficulty");

  return (
    <div className="screen">
      <Confetti />
      <Header title="ההישגים שלי" subtitle="🎉 ממשיכים ככה!" back tall tint="playful" />

      <div style={{ display: "flex", justifyContent: "space-around", padding: "20px 20px 4px" }}>
        <ProgressRing pct={child.achievements.lessonsProgress} label="שיעורים שלמדתי" color="var(--violet-500)" />
        <ProgressRing pct={child.achievements.savingsPaidProgress} label="חסכונות שהשגתי" color="var(--teal-500)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "20px 20px 0" }}>
        <Card style={{ textAlign: "center", padding: "10px 6px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <BadgeFlame size={48} />
          <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>רצף שבועות</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--violet-700)" }}>{child.achievements.consistencyStreakWeeks}</div>
        </Card>
        <Card style={{ textAlign: "center", padding: "10px 6px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <BadgeCheck size={48} />
          <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>מטלות שביצעתי</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{child.achievements.tasksCompletedCount}</div>
        </Card>
        <Card style={{ textAlign: "center", padding: "10px 6px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <BadgeStar size={48} />
          <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>מטלה אהובה</div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{child.achievements.favoriteTask}</div>
        </Card>
        <Card style={{ textAlign: "center", padding: "10px 6px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <BadgeCoin size={48} />
          <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>הרווחתי בסה"כ</div>
          <div style={{ fontSize: 14, fontWeight: 700 }} className="money">
            {child.achievements.totalTaskReward.toLocaleString("he-IL")}₪
          </div>
        </Card>
      </div>

      <SectionTitle>אני חזק/ה ב</SectionTitle>
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

      <SectionTitle>עוד קצת לתרגל</SectionTitle>
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
      <ChildBottomNav />
    </div>
  );
}
