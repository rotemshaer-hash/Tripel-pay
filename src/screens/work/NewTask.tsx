import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";
import { WorkBottomNav } from "../../components/WorkBottomNav";
import { Toast, useToast } from "../../components/Toast";
import { useStore } from "../../data/store";
import { childrenList } from "../../data/family";
import { V, priorityColor, priorityLabels, recurrenceLabels } from "../../data/vocabulary";
import type { RecurrenceRule, TaskPriority } from "../../data/types";

const priorities: TaskPriority[] = ["low", "normal", "high", "urgent"];
const recurrences: RecurrenceRule[] = ["none", "daily", "weekly", "monthly"];

/**
 * The manager writes a new job: what, who, by when, how often, and for which site.
 * This is the entry point that replaces "I'll just WhatsApp it to him" — everything
 * captured here is what later makes the work journal auditable.
 */
export function NewTask() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const { toastMessage, showToast } = useToast();
  const workers = childrenList(state.family);

  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [assignee, setAssignee] = useState(workers[0]?.id ?? "");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [recurrence, setRecurrence] = useState<RecurrenceRule>("none");
  const [site, setSite] = useState("");

  const canSave = title.trim().length > 0 && assignee.length > 0;

  function save(andAnother: boolean) {
    if (!canSave) return;
    const worker = state.family.children[assignee];
    dispatch({
      type: "CREATE_TASK",
      childId: assignee,
      title: title.trim(),
      brief: brief.trim() || undefined,
      // A date input gives a bare day; anchor it to end of day so "due today" isn't
      // already overdue at 00:01.
      dueAt: due ? new Date(`${due}T23:59:59`).toISOString() : undefined,
      priority,
      recurrence,
      site: site.trim() || undefined,
      by: state.family.parentName || V.admin,
    });
    showToast(`המשימה הוקצתה ל${worker?.name ?? V.worker}`);
    if (andAnother) {
      setTitle("");
      setBrief("");
      return;
    }
    setTimeout(() => navigate("/work/journal"), 400);
  }

  return (
    <div className="screen">
      <Header title={`${V.task} חדשה`} subtitle="הקצאה מתועדת לעובד" back tint="pro" />

      <div style={{ padding: "16px 20px 28px", display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="מה צריך לעשות" required>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="לדוגמה: ניקיון חדר ישיבות" style={inputStyle} />
        </Field>

        <Field label={V.brief}>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={3}
            placeholder="הנחיות מדויקות, על מה לשים לב, ציוד נדרש…"
            style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }}
          />
        </Field>

        <Field label={`${V.worker} אחראי`} required>
          {workers.length === 0 ? (
            <div style={{ fontSize: 12.5, color: "#e0224a" }}>אין עובדים במערכת — יש להוסיף עובד קודם.</div>
          ) : (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {workers.map((w) => (
                <Chip key={w.id} label={w.name} active={assignee === w.id} onClick={() => setAssignee(w.id)} activeColor="#232a3b" />
              ))}
            </div>
          )}
        </Field>

        <Field label="תאריך יעד">
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} style={inputStyle} />
        </Field>

        <Field label="עדיפות">
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {priorities.map((p) => (
              <Chip key={p} label={priorityLabels[p]} active={priority === p} onClick={() => setPriority(p)} activeColor={priorityColor[p]} />
            ))}
          </div>
        </Field>

        <Field label="תדירות">
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {recurrences.map((r) => (
              <Chip key={r} label={recurrenceLabels[r]} active={recurrence === r} onClick={() => setRecurrence(r)} activeColor="#2f7fd1" />
            ))}
          </div>
          {recurrence !== "none" && (
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 6 }}>משימה קבועה — תסומן ביומן כחוזרת.</div>
          )}
        </Field>

        <Field label={V.site}>
          <input value={site} onChange={(e) => setSite(e.target.value)} placeholder="לדוגמה: משרד ראשי / סניף חיפה" style={inputStyle} />
        </Field>

        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button onClick={() => save(false)} disabled={!canSave} style={{ ...primaryBtn, flex: 1, opacity: canSave ? 1 : 0.5 }}>
            הקצאה
          </button>
          <button onClick={() => save(true)} disabled={!canSave} style={{ ...secondaryBtn, opacity: canSave ? 1 : 0.5 }}>
            שמירה והוספה נוספת
          </button>
        </div>
      </div>
      <Toast message={toastMessage} />
      <WorkBottomNav />
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <section style={{ background: "#ffffff", border: "1px solid var(--line)", borderRadius: 12, padding: "12px 14px" }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--ink-soft)", marginBottom: 8 }}>
        {label}
        {required && <span style={{ color: "#e0224a" }}> *</span>}
      </label>
      {children}
    </section>
  );
}

function Chip({ label, active, onClick, activeColor }: { label: string; active: boolean; onClick: () => void; activeColor: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 14px",
        borderRadius: 999,
        fontSize: 12.5,
        fontWeight: 700,
        border: active ? "none" : "1px solid var(--line)",
        background: active ? activeColor : "#ffffff",
        color: active ? "#ffffff" : "var(--ink-soft)",
      }}
    >
      {label}
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 9,
  border: "1px solid var(--line)",
  fontSize: 13.5,
  background: "#ffffff",
};

const primaryBtn: React.CSSProperties = {
  background: "#232a3b",
  color: "#ffffff",
  border: "none",
  borderRadius: 10,
  padding: "13px",
  fontSize: 14,
  fontWeight: 800,
};

const secondaryBtn: React.CSSProperties = {
  background: "#ffffff",
  color: "var(--ink)",
  border: "1px solid var(--line)",
  borderRadius: 10,
  padding: "13px 14px",
  fontSize: 12.5,
  fontWeight: 700,
  flexShrink: 0,
};
