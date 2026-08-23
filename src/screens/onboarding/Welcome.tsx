import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrandDecor } from "../../components/BrandDecor";
import { SceneBroom, ScenePiggyBank, SceneGraduation, SceneLedger, SceneAchievementBadge } from "../../components/Illustrations";
import { MODE } from "../../data/vocabulary";

// The pitch differs by vertical: the family build sells chores-for-allowance and
// savings; the business build sells documented work — the same three-screen shape,
// a different promise.
const familySlides = [
  {
    icon: <SceneBroom size={132} />,
    title: "מטלות בתמורה לתגמול",
    subtitle: "הגדירו מטלות בית, וכל אחת מגיעה עם תגמול משלה.",
  },
  {
    icon: <ScenePiggyBank size={132} />,
    title: "חיסכון למטרות אמיתיות",
    subtitle: "הילדים חוסכים לדברים שהם רוצים ועוקבים אחרי ההתקדמות.",
  },
  {
    icon: <SceneGraduation size={132} />,
    title: "בגרות פיננסית",
    subtitle: "המסע של ילדיכם לבגרות פיננסית עומד להתחיל!",
  },
];

const workSlides = [
  {
    icon: <SceneBroom size={132} />,
    title: "משימות עם אחראי ותאריך יעד",
    subtitle: "לא עוד הודעת וואטסאפ שנעלמת — לכל משימה יש עובד אחראי, פירוט ומועד.",
  },
  {
    icon: <SceneAchievementBadge size={132} />,
    title: "אסמכתאות לכל ביצוע",
    subtitle: "העובד מצרף תמונה או הערה בסיום, והמנהל מאשר או מחזיר לתיקון.",
  },
  {
    icon: <SceneLedger size={132} />,
    title: "יומן עבודה מסודר",
    subtitle: "כל מה שבוצע — יומי, שבועי וחודשי, עם תיעוד מלא של מי עשה מה ומתי.",
  },
];

const slides = MODE === "work" ? workSlides : familySlides;

export function Welcome() {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const slide = slides[index];
  const isLast = index === slides.length - 1;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      <BrandDecor />
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "18px 20px 0", position: "relative", zIndex: 1 }}>
        <button
          onClick={() => navigate("/onboarding/details")}
          style={{ background: "none", border: "none", color: "var(--ink-soft)", fontSize: 13.5 }}
        >
          דלג
        </button>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px", gap: 22, position: "relative", zIndex: 1 }}>
        <div
          key={index}
          style={{
            width: 140,
            height: 140,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "screenEnter 0.4s cubic-bezier(.22,1,.36,1) both",
          }}
        >
          {slide.icon}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, textAlign: "center" }}>{slide.title}</div>
        <div style={{ fontSize: 14, color: "var(--ink-soft)", textAlign: "center", lineHeight: 1.65 }}>{slide.subtitle}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 6, paddingBottom: 20, position: "relative", zIndex: 1 }}>
        {slides.map((_, i) => (
          <span
            key={i}
            style={{
              width: i === index ? 22 : 7,
              height: 7,
              borderRadius: 999,
              background: i === index ? "var(--teal-700)" : "var(--line)",
              boxShadow: i === index ? "var(--glow-teal)" : "none",
              transition: "all 0.25s ease",
            }}
          />
        ))}
      </div>
      <div style={{ padding: "0 20px 28px", position: "relative", zIndex: 1 }}>
        <button
          onClick={() => (isLast ? navigate("/onboarding/details") : setIndex((i) => i + 1))}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 999,
            border: "none",
            background: "var(--teal-700)",
            color: "#ffffff",
            fontSize: 16,
            fontWeight: 800,
            boxShadow: "var(--glow-teal)",
          }}
        >
          {isLast ? "בואו נתחיל" : "המשך"}
        </button>
      </div>
    </div>
  );
}
