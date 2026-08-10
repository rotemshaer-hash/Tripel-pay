import { useState } from "react";
import { Header } from "../../components/Header";
import { ChildBottomNav } from "../../components/BottomNav";
import { useActiveChild, useStore } from "../../data/store";
import { KNOWLEDGE_LIBRARY, categoryLabels, MISSION_REWARD, type KnowledgeArticle, type KnowledgeCategory } from "../../data/knowledgeLibrary";
import lightbulbIllustration from "../../assets/illustration-lightbulb.png";

const categoryOrder: KnowledgeCategory[] = ["finance", "academic", "values"];
const categoryColor: Record<KnowledgeCategory, string> = {
  finance: "var(--teal-700)",
  academic: "var(--violet-700)",
  values: "var(--coral-600)",
};

type Stage = "reading" | "quiz" | "done";

function ArticleReader({ article, read, onClose, onComplete }: { article: KnowledgeArticle; read: boolean; onClose: () => void; onComplete: () => void }) {
  // Captured once at open time so the completion screen still shows the reward summary
  // after onComplete() flips the live `read` prop to true via the store dispatch.
  const [alreadyReadAtOpen] = useState(read);
  const [stage, setStage] = useState<Stage>(alreadyReadAtOpen ? "done" : "reading");
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const question = article.quiz[step];
  const isLast = step === article.quiz.length - 1;

  function pick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    if (i === question.correctIndex) setCorrectCount((n) => n + 1);
  }

  function next() {
    if (isLast) {
      setStage("done");
      if (!alreadyReadAtOpen) onComplete();
    } else {
      setStep((s) => s + 1);
      setPicked(null);
    }
  }

  return (
    <div className="screen">
      <Header title={article.title} subtitle={categoryLabels[article.category]} back tint="playful" />

      {stage === "reading" && (
        <>
          <div style={{ padding: "20px 20px 4px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 40 }}>{article.icon}</div>
            <div>
              <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>{article.minutes} דקות קריאה</div>
              {alreadyReadAtOpen && <div style={{ fontSize: 12, color: "var(--teal-700)", fontWeight: 700, marginTop: 2 }}>נקרא ✓</div>}
            </div>
          </div>
          <div style={{ padding: "12px 20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
            {article.body.map((p, i) => (
              <p key={i} style={{ fontSize: 14.5, lineHeight: 1.8, color: "var(--ink)", margin: 0 }}>
                {p}
              </p>
            ))}
            <button
              onClick={() => setStage("quiz")}
              style={{
                marginTop: 8,
                background: "var(--violet-700)",
                color: "#ffffff",
                border: "none",
                borderRadius: 999,
                padding: "14px",
                fontSize: 15,
                fontWeight: 800,
                boxShadow: "var(--shadow-card-solid)",
              }}
            >
              {alreadyReadAtOpen ? "משימת ידע 🎯" : `למשימה — הרוויחו ${MISSION_REWARD}₪ 🎯`}
            </button>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--ink-soft)", fontSize: 13, fontWeight: 700, padding: "6px" }}>
              חזרה לרשימה
            </button>
          </div>
        </>
      )}

      {stage === "quiz" && (
        <div style={{ padding: "20px 20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 12, color: "var(--ink-faint)", fontWeight: 700 }}>
            שאלה {step + 1} מתוך {article.quiz.length}
          </div>
          <div style={{ fontSize: 16.5, fontWeight: 800, lineHeight: 1.5 }}>{question.question}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {question.options.map((opt, i) => {
              const isCorrect = i === question.correctIndex;
              const isPicked = i === picked;
              let bg = "#ffffff";
              let border = "1px solid var(--line)";
              if (picked !== null) {
                if (isCorrect) {
                  bg = "var(--coral-100)";
                  border = "2px solid var(--coral-600)";
                } else if (isPicked) {
                  bg = "var(--teal-100)";
                  border = "2px solid var(--teal-700)";
                }
              }
              return (
                <button
                  key={i}
                  onClick={() => pick(i)}
                  disabled={picked !== null}
                  style={{ textAlign: "start", padding: "13px 16px", borderRadius: 14, fontSize: 14.5, fontWeight: 600, background: bg, border, color: "var(--ink)" }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <div style={{ fontSize: 13.5, fontWeight: 700, color: picked === question.correctIndex ? "var(--coral-600)" : "var(--teal-700)" }}>
              {picked === question.correctIndex ? "כל הכבוד, נכון! ✓" : "לא בדיוק — התשובה הנכונה מסומנת למעלה"}
            </div>
          )}
          {picked !== null && (
            <button
              onClick={next}
              style={{
                background: "var(--violet-700)",
                color: "#ffffff",
                border: "none",
                borderRadius: 999,
                padding: "14px",
                fontSize: 15,
                fontWeight: 800,
              }}
            >
              {isLast ? "סיום המשימה" : "השאלה הבאה"}
            </button>
          )}
        </div>
      )}

      {stage === "done" && (
        <div style={{ padding: "36px 20px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" }}>
          <div style={{ fontSize: 64 }}>🏅</div>
          <div style={{ fontSize: 19, fontWeight: 800 }}>משימה הושלמה!</div>
          {alreadyReadAtOpen ? (
            <div style={{ fontSize: 13.5, color: "var(--ink-soft)" }}>כבר קיבלת את הפרס על המשימה הזו בעבר.</div>
          ) : (
            <>
              <div style={{ fontSize: 13.5, color: "var(--ink-soft)" }}>
                ענית נכון על {correctCount} מתוך {article.quiz.length} שאלות
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: "var(--coral-600)",
                  background: "var(--coral-100)",
                  borderRadius: 999,
                  padding: "8px 18px",
                }}
              >
                +{MISSION_REWARD}₪ נוספו לארנק שלך 🎉
              </div>
            </>
          )}
          <button
            onClick={onClose}
            style={{
              marginTop: 8,
              background: "var(--teal-700)",
              color: "#ffffff",
              border: "none",
              borderRadius: 999,
              padding: "13px 28px",
              fontSize: 14.5,
              fontWeight: 800,
              boxShadow: "var(--glow-teal)",
            }}
          >
            חזרה לרשימה
          </button>
        </div>
      )}

      <ChildBottomNav />
    </div>
  );
}

export function ChildCourses() {
  const child = useActiveChild();
  const { dispatch } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);

  const openArticle = KNOWLEDGE_LIBRARY.find((a) => a.id === openId);
  if (openArticle) {
    const read = child.readArticles.includes(openArticle.id);
    return (
      <ArticleReader
        article={openArticle}
        read={read}
        onClose={() => setOpenId(null)}
        onComplete={() =>
          dispatch({ type: "COMPLETE_MISSION", childId: child.id, articleId: openArticle.id, articleTitle: openArticle.title, reward: MISSION_REWARD })
        }
      />
    );
  }

  const readCount = child.readArticles.length;

  return (
    <div className="screen">
      <Header title="הידע שלי" subtitle={`השלמת ${readCount} מתוך ${KNOWLEDGE_LIBRARY.length} משימות ידע`} back tint="playful" />
      <div style={{ display: "flex", justifyContent: "center", margin: "16px 0 4px" }}>
        <img src={lightbulbIllustration} alt="" style={{ width: 84, height: "auto" }} />
      </div>
      {categoryOrder.map((cat) => {
        const items = KNOWLEDGE_LIBRARY.filter((a) => a.category === cat);
        return (
          <div key={cat}>
            <div style={{ margin: "20px 20px 10px", fontSize: 12.5, fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
              {categoryLabels[cat]}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 20px" }}>
              {items.map((a) => {
                const read = child.readArticles.includes(a.id);
                return (
                  <button
                    key={a.id}
                    onClick={() => setOpenId(a.id)}
                    className="glass"
                    style={{
                      borderRadius: "var(--radius-md)",
                      padding: 14,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      position: "relative",
                      textAlign: "start",
                      boxShadow: read ? "var(--glow-teal)" : "var(--shadow-card)",
                    }}
                  >
                    <div style={{ fontSize: 26 }}>{a.icon}</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.3, minHeight: 34 }}>{a.title}</div>
                    <span style={{ fontSize: 11, color: read ? "var(--teal-700)" : "var(--ink-faint)", fontWeight: read ? 700 : 400 }}>
                      {read ? "הושלם ✓" : `${a.minutes} דק' + משימה`}
                    </span>
                    <span
                      aria-hidden="true"
                      style={{ position: "absolute", top: 10, insetInlineEnd: 10, width: 8, height: 8, borderRadius: "50%", background: categoryColor[cat], opacity: read ? 1 : 0.35 }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <div style={{ height: 24 }} />
      <ChildBottomNav />
    </div>
  );
}
