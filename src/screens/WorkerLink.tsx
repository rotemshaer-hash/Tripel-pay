import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useStore } from "../data/store";
import { V, work } from "../data/vocabulary";
import { resizeImageToDataUrl } from "../utils/resizeImage";
import { formatDate } from "../utils/datetime";
import type { LinkUpdate, TaskLinkSnapshot } from "../data/tasklink";

/**
 * The whole product, for the person doing the work.
 *
 * They arrive from a WhatsApp message on a site, one-handed, and they have no account
 * — that is the point. Everything here is one tap: I got it, I started, I finished,
 * here is a photo, here is a note. Whatever they press is in the manager's journal
 * with their name and the time on it, which is the record the business is paying for.
 *
 * Deliberately not the app: no navigation, no tabs, nothing to sign into, nothing to
 * lose. The link is the account.
 */
export function WorkerLink() {
  const { token = "" } = useParams();
  const { loadTaskLink, sendLinkUpdate } = useStore();
  const [link, setLink] = useState<TaskLinkSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    loadTaskLink(token)
      .then((result) => {
        if (!alive) return;
        setLink(result);
        setLoading(false);
        if (!result) setError("הקישור לא נמצא או שפג תוקפו. אפשר לבקש מהמנהל לשלוח שוב.");
      })
      .catch((err) => {
        console.error("Loading the task link failed:", err);
        if (!alive) return;
        setLoading(false);
        setError("לא הצלחנו לטעון את המשימה. בדוק/י את החיבור ונסה/י שוב.");
      });
    return () => {
      alive = false;
    };
  }, [token, loadTaskLink]);

  async function report(update: LinkUpdate, label: string) {
    if (!link) return;
    setBusy(true);
    setError("");
    try {
      await sendLinkUpdate(link, update);
      setSent((list) => [...list, label]);
      setNote("");
    } catch (err) {
      console.error("Sending the update failed:", err);
      setError("השליחה נכשלה. בדוק/י חיבור לאינטרנט ונסה/י שוב.");
    } finally {
      setBusy(false);
    }
  }

  const now = () => new Date().toISOString();

  if (loading) {
    return <Frame><div style={{ padding: 30, textAlign: "center", color: "var(--ink-soft)" }}>רגע…</div></Frame>;
  }

  if (!link) {
    return (
      <Frame>
        <div style={{ padding: "26px 22px", fontSize: 14, color: "var(--ink)", lineHeight: 1.6 }}>{error}</div>
      </Frame>
    );
  }

  return (
    <Frame company={link.company}>
      <div style={{ padding: "18px 20px 34px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.35 }}>{link.title}</div>
          <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 5 }}>
            {`${link.workerName}${link.site ? ` · ${link.site}` : ""}${link.dueAt ? ` · יעד: ${formatDate(link.dueAt)}` : ""}`}
          </div>
        </div>

        {link.brief && (
          <div style={{ background: "#ffffff", border: "1px solid var(--line)", borderRadius: 12, padding: "13px 14px", fontSize: 13.5, lineHeight: 1.6 }}>
            {link.brief}
          </div>
        )}

        {(link.steps ?? []).length > 0 && (
          <div style={{ background: "#ffffff", border: "1px solid var(--line)", borderRadius: 12, padding: "13px 14px" }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 8 }}>שלבי ביצוע</div>
            {(link.steps ?? []).map((step) => (
              <div key={step.id} style={{ fontSize: 13, color: "var(--ink)", padding: "4px 0" }}>
                {`• ${step.text}`}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <Big label="✅ קיבלתי" onClick={() => report({ kind: "ack", at: now() }, "אישור קבלה")} disabled={busy} />
          <Big label="▶️ התחלתי לעבוד" onClick={() => report({ kind: "started", at: now() }, "התחלת עבודה")} disabled={busy} tone="active" />
          <Big label="🏁 סיימתי" onClick={() => report({ kind: "done", at: now() }, "סיום עבודה")} disabled={busy} tone="done" />

          <label style={{ ...bigStyle("plain"), textAlign: "center", cursor: "pointer", opacity: busy ? 0.5 : 1 }}>
            📷 שליחת תמונה
            <input
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setBusy(true);
                try {
                  const photo = await resizeImageToDataUrl(file, 900, 0.7);
                  await report({ kind: "photo", at: now(), photo }, "תמונה");
                } catch (err) {
                  console.error("Preparing the photo failed:", err);
                  setError("לא הצלחנו לצרף את התמונה. נסה/י שוב.");
                  setBusy(false);
                }
              }}
            />
          </label>

          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="הערה למנהל…"
              style={{ flex: 1, padding: "13px 14px", borderRadius: 11, border: "1px solid var(--line)", fontSize: 14 }}
            />
            <button
              onClick={() => report({ kind: "note", at: now(), note: note.trim() }, "הערה")}
              disabled={busy || !note.trim()}
              style={{ background: work.ink, color: "#ffffff", border: "none", borderRadius: 11, padding: "0 18px", fontSize: 13.5, fontWeight: 800, opacity: busy || !note.trim() ? 0.4 : 1 }}
            >
              שליחה
            </button>
          </div>
        </div>

        {error && <div style={{ fontSize: 13, color: work.alert, lineHeight: 1.55 }}>{error}</div>}

        {sent.length > 0 && (
          <div style={{ background: "#eaf7f2", border: "1px solid #bfe4d8", borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: "#136c58", marginBottom: 5 }}>נשלח למנהל ✓</div>
            <div style={{ fontSize: 12, color: "#2b6d5e", lineHeight: 1.6 }}>{sent.join(" · ")}</div>
          </div>
        )}

        <div style={{ fontSize: 11, color: "var(--ink-faint)", lineHeight: 1.6, textAlign: "center", marginTop: 4 }}>
          {`הקישור הזה שייך למשימה אחת בלבד. אין צורך בהתקנה או בסיסמה — כל מה שנשלח כאן נרשם ביומן של ${link.company}.`}
        </div>
      </div>
    </Frame>
  );
}

function Frame({ company, children }: { company?: string; children: React.ReactNode }) {
  return (
    <div className="screen">
      <div style={{ background: "linear-gradient(180deg, #232a3b 0%, #1b2130 100%)", padding: "22px 20px 18px", flexShrink: 0 }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{V.appName}</div>
        <div style={{ fontSize: 17, fontWeight: 800, color: "#ffffff", marginTop: 3 }}>{company ?? "משימה"}</div>
      </div>
      {children}
    </div>
  );
}

function Big({ label, onClick, disabled, tone = "plain" }: { label: string; onClick: () => void; disabled?: boolean; tone?: "plain" | "active" | "done" }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...bigStyle(tone), opacity: disabled ? 0.5 : 1 }}>
      {label}
    </button>
  );
}

function bigStyle(tone: "plain" | "active" | "done"): React.CSSProperties {
  const background = tone === "active" ? work.active : tone === "done" ? work.done : "#ffffff";
  const color = tone === "plain" ? "var(--ink)" : "#ffffff";
  return {
    display: "block",
    width: "100%",
    background,
    color,
    border: tone === "plain" ? "1px solid var(--line)" : "none",
    borderRadius: 12,
    padding: "16px",
    fontSize: 15.5,
    fontWeight: 800,
  };
}
