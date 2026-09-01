import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrandDecor } from "../../components/BrandDecor";
import { SceneBroom, ScenePiggyBank, SceneGraduation } from "../../components/Illustrations";
import { MODE, work } from "../../data/vocabulary";

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

/**
 * The business slides are drawn here rather than reusing the family scenes. Those are
 * a cartoon mascot with coins and stars — right for a child, and a promise of a toy to
 * anyone opening a work tool. These marks are the product's own vocabulary: a task
 * row, a piece of evidence, a log.
 */
function MarkTask() {
  return (
    <svg width="112" height="112" viewBox="0 0 112 112" fill="none" role="img" aria-label="משימה עם אחראי ותאריך">
      <rect x="10" y="22" width="92" height="24" rx="6" fill="#eef0f4" />
      <rect x="10" y="54" width="92" height="24" rx="6" fill="#eef0f4" />
      <rect x="10" y="86" width="60" height="14" rx="6" fill="#f4f5f8" />
      <rect x="18" y="30" width="8" height="8" rx="2" fill={work.ink} />
      <rect x="32" y="31" width="40" height="6" rx="3" fill="#c9cdd6" />
      <circle cx="88" cy="34" r="6" fill="#4756b3" />
      <rect x="18" y="62" width="8" height="8" rx="2" fill={work.ink} />
      <rect x="32" y="63" width="52" height="6" rx="3" fill="#c9cdd6" />
      <circle cx="96" cy="66" r="6" fill="#f2761b" />
    </svg>
  );
}

function MarkProof() {
  return (
    <svg width="112" height="112" viewBox="0 0 112 112" fill="none" role="img" aria-label="אסמכתה מצורפת">
      <rect x="22" y="14" width="60" height="76" rx="7" fill="#eef0f4" />
      <rect x="34" y="30" width="36" height="6" rx="3" fill="#c9cdd6" />
      <rect x="34" y="44" width="28" height="6" rx="3" fill="#c9cdd6" />
      <rect x="34" y="58" width="34" height="6" rx="3" fill="#c9cdd6" />
      <circle cx="78" cy="80" r="20" fill="#1f9e8a" />
      <path d="M69 80l6 7 12-14" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MarkJournal() {
  return (
    <svg width="112" height="112" viewBox="0 0 112 112" fill="none" role="img" aria-label="יומן עבודה">
      <rect x="14" y="16" width="84" height="80" rx="8" fill="#eef0f4" />
      <rect x="14" y="16" width="84" height="16" rx="8" fill={work.ink} />
      <circle cx="30" cy="48" r="4" fill="#1f9e8a" />
      <rect x="42" y="45" width="42" height="6" rx="3" fill="#c9cdd6" />
      <circle cx="30" cy="64" r="4" fill="#4756b3" />
      <rect x="42" y="61" width="34" height="6" rx="3" fill="#c9cdd6" />
      <circle cx="30" cy="80" r="4" fill="#f2761b" />
      <rect x="42" y="77" width="46" height="6" rx="3" fill="#c9cdd6" />
    </svg>
  );
}

const workSlides = [
  {
    icon: <MarkTask />,
    title: "משימות עם אחראי ותאריך יעד",
    subtitle: "לא עוד הודעת וואטסאפ שנעלמת — לכל משימה יש עובד אחראי, פירוט ומועד.",
  },
  {
    icon: <MarkProof />,
    title: "אסמכתאות לכל ביצוע",
    subtitle: "העובד מצרף תמונה, קובץ או הערה בסיום, והמנהל מאשר או מחזיר לתיקון.",
  },
  {
    icon: <MarkJournal />,
    title: "יומן עבודה מסודר",
    subtitle: "כל מה שבוצע — יומי, שבועי וחודשי, עם תיעוד מלא של מי עשה מה ומתי.",
  },
];

const slides = MODE === "work" ? workSlides : familySlides;

export function Welcome() {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const slide = slides[index];
  const isWork = MODE === "work";
  const isLast = index === slides.length - 1;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      {MODE !== "work" && <BrandDecor />}
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "18px 20px 0", position: "relative", zIndex: 1 }}>
        <button
          onClick={() => navigate("/onboarding/details")}
          style={{ background: "none", border: "none", color: "var(--ink-soft)", fontSize: 13.5 }}
        >
          דלג
        </button>
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: isWork ? "0 28px" : "0 32px",
          gap: isWork ? 18 : 22,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          key={index}
          style={{
            width: isWork ? 168 : 140,
            height: isWork ? 168 : 140,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            // In work mode the mark sits on a surface, in the same card language the
            // rest of the app speaks. Floating on the page it read as unfinished.
            ...(isWork
              ? { background: "#ffffff", border: "1px solid var(--line)", borderRadius: 20, marginBottom: 6 }
              : {}),
            animation: "screenEnter 0.4s cubic-bezier(.22,1,.36,1) both",
          }}
        >
          {slide.icon}
        </div>
        <div style={{ fontSize: isWork ? 21 : 22, fontWeight: 800, textAlign: "center", lineHeight: 1.35 }}>{slide.title}</div>
        <div style={{ fontSize: 14.5, color: "var(--ink-soft)", textAlign: "center", lineHeight: 1.65, maxWidth: 310 }}>{slide.subtitle}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 6, paddingBottom: 20, position: "relative", zIndex: 1 }}>
        {slides.map((_, i) => (
          <span
            key={i}
            style={{
              width: i === index ? 22 : 7,
              height: 7,
              borderRadius: 999,
              background: i === index ? (isWork ? work.ink : "var(--teal-700)") : "var(--line)",
              boxShadow: i === index || !isWork ? (isWork ? "none" : "var(--glow-teal)") : "none",
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
            padding: isWork ? "15px" : "16px",
            borderRadius: isWork ? 11 : 999,
            border: "none",
            background: isWork ? work.ink : "var(--teal-700)",
            color: "#ffffff",
            fontSize: isWork ? 15 : 16,
            fontWeight: 800,
            boxShadow: isWork ? "none" : "var(--glow-teal)",
          }}
        >
          {isLast ? (isWork ? "פתיחת חשבון" : "בואו נתחיל") : "המשך"}
        </button>
      </div>
    </div>
  );
}
