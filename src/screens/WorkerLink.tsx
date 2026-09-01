import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useStore } from "../data/store";
import { V, work } from "../data/vocabulary";
import { resizeImageToBlob } from "../utils/resizeImage";
import { formatDate, formatTime } from "../utils/datetime";
import { isServiceNotEnabled } from "../utils/authErrors";
import { ProofButtons } from "../components/Attachments";
import type { LinkUpdate, TaskLinkSnapshot } from "../data/tasklink";

/**
 * The whole product, for the person doing the work — one job at a time.
 *
 * They arrive from a WhatsApp message on a site, one-handed, and they have no account
 * — that is the point. Everything here is one tap: I got it, here is evidence, I
 * finished. Whatever they press is in the manager's journal with their name and the
 * time on it, which is the record the business is paying for.
 *
 * Deliberately not the app: no navigation, no tabs, nothing to sign into, nothing to
 * lose. The link is the account.
 */
export function WorkerLink() {
  const { token = "" } = useParams();
  const { loadTaskLink, sendLinkUpdate, uploadAttachment, describeUploadFailure } = useStore();
  const [link, setLink] = useState<TaskLinkSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState<string[]>([]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [finished, setFinished] = useState(false);
  /** A photo waits here for its caption instead of going straight out — see the same
   * choice on the daily link, which this mirrors so evidence behaves the same way
   * whether the manager sent one job or a whole day. */
  const [pendingPhoto, setPendingPhoto] = useState<{ blob: Blob; previewUrl: string; fileName: string; mime: string } | null>(null);
  const [photoName, setPhotoName] = useState("");

  // Re-read whenever the person comes back to the page: a manager can change the job
  // after sending it, and this link is the only copy the worker has.
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") setRefreshKey((k) => k + 1);
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

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
        // "Check your connection" is the wrong advice for what this almost always is:
        // a Firebase switch the business has not turned on yet. The worker cannot fix
        // that, and should not be sent to fiddle with their phone over it.
        const code = (err as { code?: string })?.code ?? "";
        const message = (err as { message?: string })?.message ?? "";
        setError(
          isServiceNotEnabled(code, message)
            ? "הקישור עדיין לא פעיל אצל המנהל — צריך להפעיל את השירות בהגדרות של העסק. כדאי להראות לו את ההודעה הזו."
            : "לא הצלחנו לטעון את המשימה. בדוק/י חיבור ונסה/י שוב."
        );
      });
    return () => {
      alive = false;
    };
  }, [token, loadTaskLink, refreshKey]);

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
  const lastMessage = (link?.messages ?? [])[(link?.messages ?? []).length - 1];

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
          <div className="display" style={{ fontSize: 19, lineHeight: 1.35 }}>{link.title}</div>
          <div style={{ fontSize: 12.5, color: "var(--text-muted-2)", marginTop: 5 }}>
            {`${link.workerName}${link.site ? ` · ${link.site}` : ""}${link.dueAt ? ` · יעד: ${formatDate(link.dueAt)}` : ""}`}
          </div>
        </div>

        {link.brief && (
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: "13px 14px", fontSize: 13.5, lineHeight: 1.6 }}>
            {link.brief}
          </div>
        )}

        {/* A correction the manager sends after the link went out is the only way this
            worker learns the job changed, so it reads as an attributed, timestamped
            note — not a caption buried under other text. */}
        {lastMessage && (
          <div style={{ background: "var(--tint-2)", border: "1px solid var(--tint-2)", borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: "var(--accent-text)" }}>{`💬 ${lastMessage.by} · ${formatTime(lastMessage.at)}`}</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--ink)", marginTop: 3 }}>{lastMessage.text}</div>
          </div>
        )}

        {(link.steps ?? []).length > 0 && (
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: "13px 14px" }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 8 }}>שלבי ביצוע</div>
            {(link.steps ?? []).map((step) => (
              <div key={step.id} style={{ fontSize: 13, color: "var(--ink)", padding: "4px 0" }}>
                {`• ${step.text}`}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {/* One job, two moves: I have it, and I have finished it — same as the daily
              link, and for the same reason: a status in between is one more thing to
              remember while holding a ladder. */}
          {!finished && (
            <Big
              label={acknowledged ? "🏁 סיימתי" : "✅ קיבלתי"}
              tone={acknowledged ? "done" : "ink"}
              disabled={busy}
              onClick={async () => {
                if (!acknowledged) {
                  await report({ kind: "ack", at: now() }, "אישור קבלה");
                  setAcknowledged(true);
                } else {
                  await report({ kind: "done", at: now() }, "סיום עבודה");
                  setFinished(true);
                }
              }}
            />
          )}

          {pendingPhoto ? (
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 13, padding: 11, display: "flex", flexDirection: "column", gap: 9 }}>
              <img src={pendingPhoto.previewUrl} alt="" style={{ width: "100%", maxHeight: 190, objectFit: "cover", borderRadius: 9, display: "block" }} />
              <input
                value={photoName}
                onChange={(e) => setPhotoName(e.target.value)}
                placeholder="מה רואים בתמונה? (למשל: סניף רמת גן)"
                style={{ padding: "12px 13px", borderRadius: 10, border: "1px solid var(--line)", fontSize: 14 }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={async () => {
                    const name = photoName.trim();
                    const { blob, fileName, mime } = pendingPhoto;
                    setBusy(true);
                    setError("");
                    try {
                      const stored = await uploadAttachment(`task/${link.taskId}`, new File([blob], fileName, { type: mime }));
                      URL.revokeObjectURL(pendingPhoto.previewUrl);
                      setPendingPhoto(null);
                      setPhotoName("");
                      await report(
                        {
                          kind: "photo",
                          at: now(),
                          ...(name ? { name } : {}),
                          file: { name: stored.name, url: stored.url, path: stored.path, mime: stored.mime, size: stored.size },
                        },
                        name || "תמונה"
                      );
                    } catch (err) {
                      console.error("Uploading the photo failed:", err);
                      setError(describeUploadFailure(err));
                      setBusy(false);
                    }
                  }}
                  disabled={busy}
                  style={{ flex: 1, background: work.ink, color: "#ffffff", border: "none", borderRadius: 10, padding: "13px", fontSize: 14, fontWeight: 800, opacity: busy ? 0.5 : 1 }}
                >
                  {busy ? "שולח…" : "שליחת התמונה"}
                </button>
                <button
                  onClick={() => {
                    URL.revokeObjectURL(pendingPhoto.previewUrl);
                    setPendingPhoto(null);
                    setPhotoName("");
                  }}
                  disabled={busy}
                  style={{ background: "none", border: "1px solid var(--line)", borderRadius: 10, padding: "0 16px", fontSize: 13, fontWeight: 700, color: "var(--ink-soft)" }}
                >
                  ביטול
                </button>
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-faint)" }}>אפשר לשלוח גם בלי שם — השם עוזר בתיק שנשלח ללקוח.</div>
            </div>
          ) : (
            <ProofButtons
              busy={busy}
              onPicked={async (file) => {
                setBusy(true);
                setError("");
                try {
                  const blob = await resizeImageToBlob(file);
                  setPendingPhoto({ blob, previewUrl: URL.createObjectURL(blob), fileName: file.name || "photo.jpg", mime: blob.type });
                  setPhotoName("");
                } catch (err) {
                  console.error("Preparing the photo failed:", err);
                  setError("לא הצלחנו להכין את התמונה. נסה/י שוב.");
                } finally {
                  setBusy(false);
                }
              }}
            />
          )}

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
          <div style={{ background: "var(--success-bg)", border: "1px solid var(--success-bg)", borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--success)", marginBottom: 5 }}>נשלח למנהל ✓</div>
            <div style={{ fontSize: 12, color: "var(--success)", lineHeight: 1.6 }}>{sent.join(" · ")}</div>
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
    <div className="screen work-ground">
      <div className="hero" style={{ padding: "13px 20px 14px", flexShrink: 0 }}>
        <div style={{ fontSize: 12, color: work.onDark }}>{V.appName}</div>
        <div className="display" style={{ fontSize: 19, color: "#ffffff", marginTop: 3 }}>{company ?? "משימה"}</div>
      </div>
      {children}
    </div>
  );
}

function Big({ label, onClick, disabled, tone = "plain" }: { label: string; onClick: () => void; disabled?: boolean; tone?: "plain" | "active" | "done" | "ink" }) {
  return (
    <button onClick={onClick} disabled={disabled} className="display" style={{ ...bigStyle(tone), opacity: disabled ? 0.5 : 1 }}>
      {label}
    </button>
  );
}

function bigStyle(tone: "plain" | "active" | "done" | "ink"): React.CSSProperties {
  const background = tone === "active" ? work.active : tone === "done" ? work.done : tone === "ink" ? work.ink : "var(--card)";
  const color = tone === "plain" ? "var(--ink)" : "#ffffff";
  return {
    display: "block",
    width: "100%",
    background,
    color,
    border: tone === "plain" ? "1px solid var(--line)" : "none",
    borderRadius: 13,
    padding: "17px",
    fontSize: 16.5,
  };
}
