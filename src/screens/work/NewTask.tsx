import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";
import { WorkBottomNav } from "../../components/WorkBottomNav";
import { Toast, useToast } from "../../components/Toast";
import { useStore } from "../../data/store";
import { childrenList } from "../../data/family";
import { V, priorityColor, priorityLabels, recurrenceLabels, work } from "../../data/vocabulary";
import { AttachButton, AttachmentList } from "../../components/Attachments";
import { draftToAttachment } from "../../data/attachments";
import type { Attachment, RecurrenceRule, TaskPriority } from "../../data/types";

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
  const [steps, setSteps] = useState<string[]>([]);
  const [stepDraft, setStepDraft] = useState("");
  // The task's id is decided here, not in the reducer, so a file can be uploaded into
  // this task's own folder while the task is still being written.
  const [taskId, setTaskId] = useState(() => `t-${crypto.randomUUID()}`);
  const [files, setFiles] = useState<Attachment[]>([]);
  const actor = state.family.parentName || V.admin;

  function addStep() {
    const text = stepDraft.trim();
    if (!text) return;
    setSteps((list) => [...list, text]);
    setStepDraft("");
  }

  const canSave = title.trim().length > 0 && assignee.length > 0;

  function save(andAnother: boolean) {
    if (!canSave) return;
    const worker = state.family.children[assignee];
    dispatch({
      type: "CREATE_TASK",
      childId: assignee,
      id: taskId,
      title: title.trim(),
      brief: brief.trim() || undefined,
      briefAttachments: files,
      // A date input gives a bare day; anchor it to end of day so "due today" isn't
      // already overdue at 00:01.
      dueAt: due ? new Date(`${due}T23:59:59`).toISOString() : undefined,
      priority,
      recurrence,
      site: site.trim() || undefined,
      checklist: steps.map((text) => ({ id: `ck-${crypto.randomUUID()}`, text, done: false })),
      by: actor,
    });
    showToast(`המשימה הוקצתה ל${worker?.name ?? V.worker}`);
    if (andAnother) {
      setTitle("");
      setBrief("");
      setSteps([]);
      setFiles([]);
      setRecurrence("none");
      setTaskId(`t-${crypto.randomUUID()}`);
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
          {/* Attaching the plan, the spec or the photo belongs here, with the
              instructions being written — not only on the task after it exists. */}
          <AttachmentList items={files} empty="" onRemove={(id) => setFiles((list) => list.filter((f) => f.id !== id))} />
          <AttachButton
            folder={`tasks/${taskId}`}
            label="📎 צירוף תמונה או קובץ להנחיות"
            onAttached={(draft) => setFiles((list) => [...list, draftToAttachment(draft, actor)])}
          />
        </Field>

        <Field label="שלבי ביצוע">
          <div style={{ fontSize: 11.5, color: "var(--ink-faint)", lineHeight: 1.5, marginBottom: 9 }}>
            פירוק המשימה לשלבים שהעובד מסמן תוך כדי — כך רואים מה בדיוק בוצע ומה נשאר.
          </div>
          {steps.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 9 }}>
              {steps.map((text, i) => (
                <div key={`${text}-${i}`} style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--paper)", borderRadius: 8, padding: "7px 10px" }}>
                  <span style={{ fontSize: 11, color: "var(--ink-faint)", fontWeight: 800, minWidth: 14 }}>{i + 1}</span>
                  <span style={{ flex: 1, fontSize: 13 }}>{text}</span>
                  <button
                    onClick={() => setSteps((list) => list.filter((_, j) => j !== i))}
                    aria-label={`הסרת שלב ${i + 1}`}
                    style={{ background: "none", border: "none", color: work.alert, fontSize: 15, fontWeight: 800, padding: "0 4px" }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={stepDraft}
              onChange={(e) => setStepDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                // Enter adds a step; without this it would submit nothing and feel broken.
                e.preventDefault();
                addStep();
              }}
              placeholder="לדוגמה: לרוקן פחים"
              style={inputStyle}
            />
            <button onClick={addStep} disabled={!stepDraft.trim()} style={{ ...secondaryBtn, opacity: stepDraft.trim() ? 1 : 0.5 }}>
              הוספה
            </button>
          </div>
        </Field>

        <Field label={`${V.worker} אחראי`} required>
          {workers.length === 0 ? (
            <div style={{ fontSize: 12.5, color: work.alert }}>אין עובדים במערכת — יש להוסיף עובד קודם.</div>
          ) : (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {workers.map((w) => (
                <Chip key={w.id} label={w.name} active={assignee === w.id} onClick={() => setAssignee(w.id)} activeColor={work.ink} />
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

        {/* A maintenance business runs on "every Sunday", not on one-off jobs. The
            engine that rolls the next occurrence has been here all along; this is the
            field that feeds it. */}
        <Field label="תדירות">
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {recurrences.map((r) => (
              <Chip key={r} label={recurrenceLabels[r]} active={recurrence === r} onClick={() => setRecurrence(r)} activeColor="#2f7fd1" />
            ))}
          </div>
          {recurrence !== "none" && (
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)", lineHeight: 1.5, marginTop: 8 }}>
              המשימה הבאה בסדרה תיווצר אוטומטית אחרי שהנוכחית תאושר. אפשר לעצור את הסדרה בכל שלב מתוך המשימה.
            </div>
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
        {required && <span style={{ color: work.alert }}> *</span>}
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
  background: work.ink,
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
