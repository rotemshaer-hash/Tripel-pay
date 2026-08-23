import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";
import { PrimaryButton } from "../../components/UI";
import { MODE, V, work } from "../../data/vocabulary";

/**
 * Step two: who is on the team.
 *
 * A list you build a row at a time, rather than "how many?" followed by that many
 * blank boxes — a small business hires and lets go, so the count is the wrong
 * question. It can also be skipped: an account with nobody in it yet is a normal
 * state, and people can be added later from settings.
 */
export function ChildrenDetails() {
  const isWork = MODE === "work";
  const [names, setNames] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const navigate = useNavigate();

  function add() {
    const name = draft.trim();
    if (!name) return;
    setNames((list) => [...list, name]);
    setDraft("");
  }

  function next() {
    sessionStorage.setItem("tp-onboarding-child-names", JSON.stringify(names));
    navigate("/onboarding/success");
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <Header
        title={isWork ? "הצוות" : `פרטי ${V.workerPlural}`}
        subtitle={isWork ? "שלב 2 מתוך 2" : undefined}
        back
        tint={isWork ? "pro" : "playful"}
      />
      <div style={{ flex: 1, padding: "22px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.6 }}>
          {isWork
            ? `הוסף את ${V.workerPlural} שלך. לכל אחד ייווצר קוד הצטרפות אישי וקישור שתוכל לשלוח לו — הוא נכנס איתו ונרשם עם שם משתמש וסיסמה משלו.`
            : `לאחר יצירת החשבון יקבל כל ${V.worker} קוד הצטרפות אישי וקישור שאפשר לשלוח אליו.`}
        </div>

        {names.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {names.map((n, i) => (
              <div
                key={`${n}-${i}`}
                style={{ display: "flex", alignItems: "center", gap: 10, background: "#ffffff", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px" }}
              >
                <span
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: isWork ? work.ink : "var(--violet-700)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {n.trim().charAt(0)}
                </span>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{n}</span>
                <button
                  onClick={() => setNames((list) => list.filter((_, j) => j !== i))}
                  aria-label={`הסרת ${n}`}
                  style={{ background: "none", border: "none", color: work.alert, fontSize: 17, fontWeight: 800, padding: "0 4px" }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              add();
            }}
            placeholder={isWork ? `שם ה${V.worker}` : `שם ה${V.worker}`}
            style={{ flex: 1, padding: "13px 14px", borderRadius: 10, border: "1px solid var(--line)", fontSize: 14.5 }}
          />
          <button
            onClick={add}
            disabled={!draft.trim()}
            style={{
              background: "#ffffff",
              border: "1px solid var(--line)",
              borderRadius: 10,
              padding: "0 18px",
              fontSize: 13.5,
              fontWeight: 700,
              color: "var(--ink)",
              opacity: draft.trim() ? 1 : 0.45,
              flexShrink: 0,
            }}
          >
            הוספה
          </button>
        </div>

        <div style={{ flex: 1 }} />

        {isWork ? (
          <button
            onClick={next}
            style={{ width: "100%", padding: "15px", borderRadius: 11, border: "none", background: work.ink, color: "#ffffff", fontSize: 15, fontWeight: 800 }}
          >
            {names.length > 0 ? `יצירת החשבון · ${names.length} ${V.workerPlural}` : "יצירת החשבון"}
          </button>
        ) : (
          <PrimaryButton onClick={next}>שליחה</PrimaryButton>
        )}
        {names.length === 0 && (
          <div style={{ fontSize: 11.5, color: "var(--ink-faint)", textAlign: "center" }}>
            אפשר להתחיל לבד ולהוסיף {V.workerPlural} אחר כך מההגדרות.
          </div>
        )}
      </div>
    </div>
  );
}
