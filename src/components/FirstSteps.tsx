import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../data/store";
import { childrenList } from "../data/family";
import { V, work } from "../data/vocabulary";
import { professionById, professions } from "../data/professions";
import { dayMessage } from "../data/messages";
import { whatsAppLink } from "../utils/share";

/**
 * The first five minutes of an account.
 *
 * An empty screen that describes absence — "no tasks yet" — is where a business
 * opened at nine at night, after a full day of work, closes the tab. So the empty
 * state is the tutorial, and every step is done HERE: the hire is added in this card,
 * the first job is one tap from the trade's own list, and the send is the same button
 * that will be used every morning after.
 *
 * It marks itself off as the work happens and disappears when there is nothing left
 * to teach — a checklist that outstays its welcome is clutter.
 */
export function FirstSteps({ sentToday }: { sentToday: boolean }) {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const workers = childrenList(state.family);
  const anyTask = workers.some((w) => w.tasks.length > 0);
  const anyPhone = workers.some((w) => !!w.phone);
  const profession = professionById(state.family.professionId) ?? professions[professions.length - 1];

  // Nothing left to teach once there is a crew, work on it, and it has gone out — a
  // card that promises three steps and disappears at the second one taught two.
  if (workers.length > 0 && anyTask && sentToday) return null;

  function addWorker() {
    const trimmed = name.trim();
    if (!trimmed) return;
    dispatch({ type: "ADD_WORKER", name: trimmed });
    const added = childrenList(state.family).length;
    if (phone.trim()) {
      // The id the reducer will mint is derived from the name, so read it back on the
      // next render instead of guessing it here.
      setTimeout(() => {
        const worker = childrenList(state.family)[added];
        if (worker) dispatch({ type: "SET_WORKER_PHONE", childId: worker.id, phone: phone.trim() });
      }, 0);
    }
    setName("");
    setPhone("");
  }

  const first = workers[0];

  return (
    <section style={{ background: "#ffffff", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden" }}>
      <div style={{ background: work.ink, color: "#ffffff", padding: "13px 16px" }}>
        <div style={{ fontSize: 14.5, fontWeight: 900 }}>שלושה צעדים ואתה עובד</div>
        <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.72)", marginTop: 3 }}>לוקח פחות מדקה. הכל מכאן.</div>
      </div>

      <Step index={1} done={workers.length > 0} title={`הוספת ${V.worker}`}>
        {workers.length === 0 ? (
          <>
            <div style={{ display: "flex", gap: 7 }}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addWorker()}
                placeholder="שם מלא"
                style={field}
              />
              <button
                onClick={addWorker}
                disabled={!name.trim()}
                style={{ background: work.ink, color: "#ffffff", border: "none", borderRadius: 9, padding: "0 16px", fontSize: 13, fontWeight: 800, opacity: name.trim() ? 1 : 0.4 }}
              >
                הוספה
              </button>
            </div>
            <input dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="טלפון (לא חובה)" style={{ ...field, marginTop: 7 }} />
          </>
        ) : (
          <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{workers.map((w) => w.name).join(" · ")}</div>
        )}
      </Step>

      <Step index={2} done={anyTask} title={`${V.task} ראשונה`}>
        {workers.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>קודם מוסיפים מישהו לצוות.</div>
        ) : (
          <>
            <div style={{ fontSize: 11.5, color: "var(--ink-soft)", lineHeight: 1.5, marginBottom: 8 }}>
              {`מוכן מראש ל${profession.name} ${profession.emoji} — לחיצה יוצרת את המשימה ל${first.name}.`}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {profession.tasks.slice(0, 4).map((template) => (
                <button
                  key={template.title}
                  onClick={() =>
                    dispatch({
                      type: "CREATE_TASK",
                      childId: first.id,
                      title: template.title,
                      brief: template.brief,
                      checklist: (template.steps ?? []).map((text) => ({ id: `ck-${crypto.randomUUID()}`, text, done: false })),
                      recurrence: template.recurrence,
                      by: state.family.parentName || V.admin,
                    })
                  }
                  style={{ background: "#ffffff", border: "1px solid var(--line)", borderRadius: 999, padding: "8px 12px", fontSize: 12.5, fontWeight: 700 }}
                >
                  {template.title}
                </button>
              ))}
              <button
                onClick={() => navigate("/work/new")}
                style={{ background: "var(--paper)", border: "1px dashed var(--line)", borderRadius: 999, padding: "8px 12px", fontSize: 12.5, fontWeight: 700, color: "var(--ink-soft)" }}
              >
                משהו אחר…
              </button>
            </div>
          </>
        )}
      </Step>

      <Step index={3} done={sentToday} title="שליחה בוואטסאפ" last>
        {!anyTask ? (
          <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>אחרי שתהיה משימה, השליחה היא כפתור אחד.</div>
        ) : (
          <>
            <div style={{ fontSize: 11.5, color: "var(--ink-soft)", lineHeight: 1.55, marginBottom: 8 }}>
              {`${first.name} יקבל הודעה עם קישור אישי. הוא לא מתקין כלום ולא זוכר סיסמה — לוחץ, ומדווח קבלה, התחלה, סיום, תמונה או הערה.`}
              {!anyPhone && " (אין מספר שמור, אז וואטסאפ יבקש לבחור איש קשר.)"}
            </div>
            <a
              href={whatsAppLink(first.phone, dayMessage(state.family.companyName || state.family.parentName, first))}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "block", textAlign: "center", background: "#25D366", color: "#ffffff", borderRadius: 10, padding: "13px", fontSize: 14, fontWeight: 800, textDecoration: "none" }}
            >
              {`שליחה ל${first.name}`}
            </a>
          </>
        )}
      </Step>
    </section>
  );
}

function Step({ index, done, title, children, last }: { index: number; done: boolean; title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ padding: "13px 16px", borderBottom: last ? "none" : "1px solid var(--line-soft)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: 999,
            background: done ? work.done : "var(--paper)",
            color: done ? "#ffffff" : "var(--ink-soft)",
            border: done ? "none" : "1px solid var(--line)",
            fontSize: 11.5,
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {done ? "✓" : index}
        </span>
        <span style={{ fontSize: 13.5, fontWeight: 800, color: done ? "var(--ink-faint)" : "var(--ink)", textDecoration: done ? "line-through" : "none" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

const field: React.CSSProperties = {
  flex: 1,
  width: "100%",
  padding: "10px 12px",
  borderRadius: 9,
  border: "1px solid var(--line)",
  fontSize: 13.5,
};
