import { useState } from "react";
import { Header } from "../../components/Header";
import { ChildBottomNav } from "../../components/BottomNav";
import { useActiveChild, useStore } from "../../data/store";
import { KNOWLEDGE_LIBRARY, categoryLabels, type KnowledgeArticle, type KnowledgeCategory } from "../../data/knowledgeLibrary";
import lightbulbIllustration from "../../assets/illustration-lightbulb.png";

const categoryOrder: KnowledgeCategory[] = ["finance", "academic", "values"];
const categoryColor: Record<KnowledgeCategory, string> = {
  finance: "var(--teal-700)",
  academic: "var(--violet-700)",
  values: "var(--coral-600)",
};

function ArticleReader({ article, read, onClose, onMarkRead }: { article: KnowledgeArticle; read: boolean; onClose: () => void; onMarkRead: () => void }) {
  return (
    <div className="screen">
      <Header title={article.title} subtitle={categoryLabels[article.category]} back tint="playful" />
      <div style={{ padding: "20px 20px 4px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 40 }}>{article.icon}</div>
        <div>
          <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>{article.minutes} דקות קריאה</div>
          {read && <div style={{ fontSize: 12, color: "var(--teal-700)", fontWeight: 700, marginTop: 2 }}>נקרא ✓</div>}
        </div>
      </div>
      <div style={{ padding: "12px 20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
        {article.body.map((p, i) => (
          <p key={i} style={{ fontSize: 14.5, lineHeight: 1.8, color: "var(--ink)", margin: 0 }}>
            {p}
          </p>
        ))}
        {!read && (
          <button
            onClick={onMarkRead}
            style={{
              marginTop: 8,
              background: "var(--teal-700)",
              color: "#ffffff",
              border: "none",
              borderRadius: 999,
              padding: "14px",
              fontSize: 15,
              fontWeight: 800,
              boxShadow: "var(--glow-teal)",
            }}
          >
            סיימתי לקרוא ✓
          </button>
        )}
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--ink-soft)", fontSize: 13, fontWeight: 700, padding: "6px" }}>
          חזרה לרשימה
        </button>
      </div>
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
        onMarkRead={() => dispatch({ type: "MARK_ARTICLE_READ", childId: child.id, articleId: openArticle.id })}
      />
    );
  }

  const readCount = child.readArticles.length;

  return (
    <div className="screen">
      <Header title="הידע שלי" subtitle={`קראת ${readCount} מתוך ${KNOWLEDGE_LIBRARY.length} נושאים`} back tint="playful" />
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
                      {read ? "נקרא ✓" : `${a.minutes} דק' קריאה`}
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
