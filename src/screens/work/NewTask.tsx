import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";
import { WorkBottomNav } from "../../components/WorkBottomNav";
import { Toast, useToast } from "../../components/Toast";
import { useStore } from "../../data/store";
import { childrenList } from "../../data/family";
import { V, work } from "../../data/vocabulary";
import { AttachButton, AttachmentList } from "../../components/Attachments";
import { DictateButton } from "../../components/DictateButton";
import { draftToAttachment } from "../../data/attachments";
import { newTaskMessage } from "../../data/messages";
import { whatsAppLink } from "../../utils/share";
import type { Attachment } from "../../data/types";

/**
 * The manager writes a new job.
 *
 * Five fields, deliberately: what, the detail, who, by when, for which customer. This
 * screen sits between a person and the thing they came to do, and every extra field is
 * a reason to go back to WhatsApp instead — which is the competitor. Steps, priority
 * and anything else are refinements, and refinements belong on the task once it
 * exists, not in the way of creating it.
 *
 * Writing a job and telling somebody about it are one thought, so they are one screen:
 * assigning does not throw the manager somewhere else, it hands them the send.
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
  const [site, setSite] = useState("");
  // The task's id is decided here, not in the reducer, so a file can be uploaded into
  // this task's own folder while the task is still being written.
  const [taskId, setTaskId] = useState(() => `t-${crypto.randomUUID()}`);
  const [files, setFiles] = useState<Attachment[]>([]);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const actor = state.family.parentName || V.admin;

  const canSave = title.trim().length > 0 && assignee.length > 0;
  // Read back from the store rather than from what was typed: the reducer is what
  // decided the final record, and the message must quote that.
  const createdWorker = createdId ? state.family.children[assignee] : undefined;
  const createdTask = createdWorker?.tasks.find((t) => t.id === createdId);

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
      site: site.trim() || undefined,
      by: actor,
    });
    showToast(`המשימה הוקצתה ל${worker?.name ?? V.worker}`);
    if (andAnother) {
      resetForm();
      return;
    }
    // Stay put and offer the send. Bouncing to another screen at exactly this moment is
    // how a task ends up written and never mentioned to anybody.
    setCreatedId(taskId);
  }

  function resetForm() {
    setTitle("");
    setBrief("");
    setFiles([]);
    setDue("");
    setSite("");
    setCreatedId(null);
    setTaskId(`t-${crypto.randomUUID()}`);
  }

  return (
    <div className="screen">
      <Header title={`${V.task} חדשה`} subtitle="הקצאה מתועדת לעובד" back tint="pro" />

      <div style={{ padding: "16px 20px 28px", display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="מה צריך לעשות" required>
          <div style={{ display: "flex", gap: 7 }}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="לדוגמה: ניקיון חדר ישיבות" style={{ ...inputStyle, flex: 1 }} />
            <DictateButton onText={(text) => setTitle((v) => (v ? `${v} ${text}` : text))} label="🎤" />
          </div>
        </Field>

        <Field label={V.brief}>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={3}
            placeholder="הנחיות מדויקות, על מה לשים לב, ציוד נדרש…"
            style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }}
          />
          <div style={{ display: "flex", justifyContent: "flex-start", marginTop: -6, marginBottom: 4 }}>
            <DictateButton onText={(text) => setBrief((v) => (v ? `${v} ${text}` : text))} label="🎤 הכתבת הנחיות" />
          </div>
          {/* Attaching the plan, the spec or the photo belongs here, with the
              instructions being written — not only on the task after it exists. */}
          <AttachmentList items={files} empty="" onRemove={(id) => setFiles((list) => list.filter((f) => f.id !== id))} />
          <AttachButton
            folder={`tasks/${taskId}`}
            label="📎 צירוף תמונה או קובץ להנחיות"
            onAttached={(draft) => setFiles((list) => [...list, draftToAttachment(draft, actor)])}
          />
        </Field>

        <Field label={`${V.worker} אחראי`} required>
          {workers.length === 0 ? (
            <div style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>{`עוד אין ${V.workerPlural} — אפשר להוסיף במסך הצוות.`}</div>
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

        <Field label={V.site}>
          <input value={site} onChange={(e) => setSite(e.target.value)} placeholder="לדוגמה: משרד ראשי / סניף חיפה" style={inputStyle} />
        </Field>

        {createdTask && createdWorker ? (
          <section style={{ background: "#ffffff", border: "1px solid #bfe4d8", borderRadius: 13, padding: "15px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: work.done }}>{`✓ המשימה הוקצתה ל${createdWorker.name}`}</div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.55 }}>
              {createdWorker.phone
                ? `נשאר לשלוח. ${createdWorker.name} יקבל קישור אישי — בלי התקנה ובלי סיסמה.`
                : `אין מספר טלפון שמור ל${createdWorker.name}, אז וואטסאפ יבקש לבחור איש קשר. אפשר לשמור מספר במסך הצוות.`}
            </div>
            <a
              href={whatsAppLink(createdWorker.phone, newTaskMessage(state.family.companyName || state.family.parentName, createdWorker, createdTask))}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => dispatch({ type: "MARK_TASK_SENT", childId: createdWorker.id, taskId: createdTask.id, by: actor })}
              style={{ display: "block", textAlign: "center", background: "#25D366", color: "#ffffff", borderRadius: 11, padding: "15px", fontSize: 15, fontWeight: 800, textDecoration: "none" }}
            >
              {`שליחה ל${createdWorker.name} בוואטסאפ`}
            </a>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={resetForm} style={{ ...secondaryBtn, flex: 1 }}>
                משימה נוספת
              </button>
              <button onClick={() => navigate("/work/board")} style={{ ...secondaryBtn, flex: 1 }}>
                למסך המשימות
              </button>
            </div>
          </section>
        ) : (
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button onClick={() => save(false)} disabled={!canSave} style={{ ...primaryBtn, flex: 1, opacity: canSave ? 1 : 0.5 }}>
              הקצאה
            </button>
            <button onClick={() => save(true)} disabled={!canSave} style={{ ...secondaryBtn, opacity: canSave ? 1 : 0.5 }}>
              שמירה והוספה נוספת
            </button>
          </div>
        )}
      </div>

      <Toast message={toastMessage} />
      <WorkBottomNav />
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--ink-soft)", marginBottom: 8 }}>
        {label}
        {required && <span style={{ color: work.alert }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function Chip({ label, active, onClick, activeColor }: { label: string; active: boolean; onClick: () => void; activeColor: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? activeColor : "#ffffff",
        color: active ? "#ffffff" : "var(--ink)",
        border: `1px solid ${active ? activeColor : "var(--line)"}`,
        borderRadius: 999,
        padding: "9px 14px",
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {label}
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 13px",
  borderRadius: 10,
  border: "1px solid var(--line)",
  fontSize: 14.5,
};

const primaryBtn: React.CSSProperties = {
  background: work.ink,
  color: "#ffffff",
  border: "none",
  borderRadius: 11,
  padding: "15px",
  fontSize: 15,
  fontWeight: 800,
};

const secondaryBtn: React.CSSProperties = {
  background: "#ffffff",
  color: "var(--ink)",
  border: "1px solid var(--line)",
  borderRadius: 11,
  padding: "15px 16px",
  fontSize: 13.5,
  fontWeight: 700,
};
