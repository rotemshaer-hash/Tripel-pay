import { Header } from "../../components/Header";
import { ChildBottomNav } from "../../components/BottomNav";
import { useActiveChild } from "../../data/store";
import lightbulbIllustration from "../../assets/illustration-lightbulb.png";

export function ChildCourses() {
  const child = useActiveChild();
  const stages = [1, 2, 3] as const;
  const stageLabel: Record<number, string> = { 1: "יסודות", 2: "שלב 2", 3: "שלב 3 - מתקדם" };

  return (
    <div className="screen">
      <Header title="מה למדתי" subtitle="חינוך פיננסי בקצב שלך" back />
      <div style={{ display: "flex", justifyContent: "center", margin: "16px 0 4px" }}>
        <img src={lightbulbIllustration} alt="" style={{ width: 84, height: "auto" }} />
      </div>
      {stages.map((stage) => {
        const items = child.courses.filter((c) => c.stage === stage);
        if (items.length === 0) return null;
        return (
          <div key={stage}>
            <div style={{ margin: "20px 20px 10px", fontSize: 12.5, fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
              {stageLabel[stage]}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 20px" }}>
              {items.map((c) => (
                <div
                  key={c.id}
                  className="glass"
                  style={{
                    borderRadius: "var(--radius-md)",
                    padding: 14,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    position: "relative",
                    boxShadow: c.progress === 100 ? "var(--glow-teal)" : "var(--shadow-card)",
                  }}
                >
                  <div style={{ fontSize: 26 }}>{c.icon}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 700 }}>{c.title}</div>
                  <div style={{ height: 7, borderRadius: 999, background: "rgba(15,33,29,0.06)", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${c.progress}%`,
                        height: "100%",
                        background: c.progress === 100 ? "var(--teal-700)" : "linear-gradient(90deg, var(--violet-500), var(--teal-700))",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 11, color: "var(--ink-faint)" }}>{c.progress === 100 ? "הושלם ✓" : `${c.progress}%`}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      <div style={{ height: 24 }} />
      <ChildBottomNav />
    </div>
  );
}
