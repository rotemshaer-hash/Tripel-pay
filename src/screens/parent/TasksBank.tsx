import { useState } from "react";
import { Header } from "../../components/Header";
import { ParentBottomNav } from "../../components/BottomNav";
import { SendMoneyFab } from "../../components/SendMoneyFab";
import { SectionTitle, Money, CategoryIconChip, taskCategoryLabels } from "../../components/UI";
import { Toast, useToast } from "../../components/Toast";
import { useActiveChild, useStore } from "../../data/store";
import type { TaskCategory } from "../../data/types";

export function TasksBank() {
  const { state, dispatch } = useStore();
  const child = useActiveChild();
  const { toastMessage, showToast } = useToast();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [reward, setReward] = useState("10");
  const [category, setCategory] = useState<TaskCategory>("other");

  // Inline editing of an existing template (text + price + category).
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editReward, setEditReward] = useState("");
  const [editCategory, setEditCategory] = useState<TaskCategory>("other");

  function addTemplate() {
    const rewardNum = Number(reward);
    if (!title.trim() || !rewardNum) return;
    dispatch({ type: "ADD_TASK_TEMPLATE", title: title.trim(), reward: rewardNum, category });
    setTitle("");
    setReward("10");
    setCategory("other");
    setAdding(false);
  }

  function startEdit(t: { id: string; title: string; reward: number; category: TaskCategory }) {
    setEditingId(t.id);
    setEditTitle(t.title);
    setEditReward(String(t.reward));
    setEditCategory(t.category);
  }

  function saveEdit() {
    const rewardNum = Number(editReward);
    if (!editingId || !editTitle.trim() || !rewardNum) return;
    dispatch({ type: "UPDATE_TASK_TEMPLATE", templateId: editingId, title: editTitle.trim(), reward: rewardNum, category: editCategory });
    showToast("התבנית עודכנה");
    setEditingId(null);
  }

  return (
    <div className="screen">
      <Header title="מאגר מטלות" subtitle={`הקצאה ל${child.name}`} back tint="playful" />
      <SectionTitle
        action={
          <button onClick={() => setAdding((v) => !v)} style={{ background: "none", border: "none", color: "var(--violet-700)", fontSize: 13, fontWeight: 700 }}>
            {adding ? "ביטול" : "+ הוספת מטלה"}
          </button>
        }
      >
        תבניות זמינות
      </SectionTitle>

      {adding && (
        <div style={{ padding: "0 20px 16px" }}>
          <div className="glass" style={{ borderRadius: "var(--radius-sm)", padding: 14 }}>
            <label style={{ fontSize: 12, color: "var(--ink-soft)", display: "block", marginBottom: 6 }}>שם המטלה</label>
            <input
              placeholder="למשל: להאכיל את החתול"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--line)", fontSize: 14, marginBottom: 10 }}
            />
            <label style={{ fontSize: 12, color: "var(--ink-soft)", display: "block", marginBottom: 6 }}>תגמול (₪)</label>
            <input
              type="number"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--line)", fontSize: 14, marginBottom: 10 }}
            />
            <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
              {(Object.keys(taskCategoryLabels) as TaskCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    border: category === cat ? "2px solid var(--teal-500)" : "1px solid var(--line)",
                    background: category === cat ? "var(--teal-100)" : "transparent",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {taskCategoryLabels[cat]}
                </button>
              ))}
            </div>
            <button
              onClick={addTemplate}
              disabled={!title.trim() || !Number(reward)}
              style={{
                width: "100%",
                background: "var(--teal-700)",
                color: "#ffffff",
                border: "none",
                borderRadius: 10,
                padding: "10px",
                fontSize: 13.5,
                fontWeight: 700,
                opacity: title.trim() && Number(reward) ? 1 : 0.5,
              }}
            >
              שמירה
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 20px 20px" }}>
        {state.family.taskBank.map((t) =>
          editingId === t.id ? (
            <div key={t.id} className="glass" style={{ borderRadius: "var(--radius-sm)", padding: 14 }}>
              <label style={{ fontSize: 12, color: "var(--ink-soft)", display: "block", marginBottom: 6 }}>שם המטלה</label>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--line)", fontSize: 14, marginBottom: 10 }}
              />
              <label style={{ fontSize: 12, color: "var(--ink-soft)", display: "block", marginBottom: 6 }}>תגמול (₪)</label>
              <input
                type="number"
                value={editReward}
                onChange={(e) => setEditReward(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--line)", fontSize: 14, marginBottom: 10 }}
              />
              <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                {(Object.keys(taskCategoryLabels) as TaskCategory[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setEditCategory(cat)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 999,
                      border: editCategory === cat ? "2px solid var(--teal-500)" : "1px solid var(--line)",
                      background: editCategory === cat ? "var(--teal-100)" : "transparent",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {taskCategoryLabels[cat]}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={saveEdit}
                  disabled={!editTitle.trim() || !Number(editReward)}
                  style={{
                    flex: 1,
                    background: "var(--teal-700)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 10,
                    padding: "10px",
                    fontSize: 13.5,
                    fontWeight: 700,
                    opacity: editTitle.trim() && Number(editReward) ? 1 : 0.5,
                  }}
                >
                  שמירה
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  style={{ flex: 1, background: "transparent", color: "var(--ink-soft)", border: "1px solid var(--line)", borderRadius: 10, padding: "10px", fontSize: 13.5, fontWeight: 700 }}
                >
                  ביטול
                </button>
              </div>
            </div>
          ) : (
            <div
              key={t.id}
              className="glass"
              style={{
                borderRadius: "var(--radius-sm)",
                padding: "13px 15px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <CategoryIconChip cat={t.category} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{t.title}</div>
                <Money value={t.reward} />
              </div>
              <button
                onClick={() => {
                  dispatch({ type: "ASSIGN_TASK", childId: child.id, templateId: t.id });
                  showToast(`המטלה "${t.title}" הוקצתה ל${child.name}`);
                }}
                style={{
                  background: "var(--teal-700)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 999,
                  padding: "9px 14px",
                  fontSize: 12.5,
                  fontWeight: 800,
                  boxShadow: "var(--glow-teal)",
                  flexShrink: 0,
                }}
              >
                הקצאה
              </button>
              <button
                onClick={() => startEdit(t)}
                aria-label="עריכת תבנית"
                style={{ background: "none", border: "none", color: "var(--violet-700)", fontSize: 16, flexShrink: 0, padding: "4px 2px" }}
              >
                ✏️
              </button>
              <button
                onClick={() => dispatch({ type: "REMOVE_TASK_TEMPLATE", templateId: t.id })}
                aria-label="הסרת תבנית"
                style={{ background: "none", border: "none", color: "var(--ink-faint)", fontSize: 16, flexShrink: 0, padding: "4px 2px" }}
              >
                ✕
              </button>
            </div>
          )
        )}
      </div>
      <Toast message={toastMessage} />
      <SendMoneyFab childId={child.id} />
      <ParentBottomNav />
    </div>
  );
}
