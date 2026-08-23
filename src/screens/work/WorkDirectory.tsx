import { useRef, useState } from "react";
import { Header } from "../../components/Header";
import { WorkBottomNav } from "../../components/WorkBottomNav";
import { Toast, useToast } from "../../components/Toast";
import { useStore } from "../../data/store";
import { V, work } from "../../data/vocabulary";
import { formatDate } from "../../utils/datetime";
import { fileIcon, formatBytes } from "../../utils/files";
import { resizeImageToDataUrl } from "../../utils/resizeImage";
import type { CompanyDoc, Supplier } from "../../data/types";

type Tab = "suppliers" | "docs";

/**
 * The things a team needs to look up while the work is happening: who to call, and
 * where the procedure is written down.
 *
 * Readable by everyone and editable only by the manager — which is not just a UI
 * choice: a worker's session may only write its own record, so a worker's edit here
 * would change the screen and never reach the database. Hiding the controls keeps
 * that from becoming a silent lie.
 */
export function WorkDirectory() {
  const { state } = useStore();
  const [tab, setTab] = useState<Tab>("suppliers");
  const { toastMessage, showToast } = useToast();
  const isManager = state.role === "parent";

  return (
    <div className="screen">
      <Header title="ספקים ומידע" subtitle="טלפונים ומסמכים לכל הצוות" tint="pro" />

      <div style={{ display: "flex", gap: 6, padding: "16px 20px 0" }}>
        {([["suppliers", "ספקים"], ["docs", "מסמכים"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1,
              padding: "9px 0",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              border: tab === key ? "none" : "1px solid var(--line)",
              background: tab === key ? work.ink : "#ffffff",
              color: tab === key ? "#ffffff" : "var(--ink-soft)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "suppliers" ? <Suppliers isManager={isManager} showToast={showToast} /> : <Documents isManager={isManager} showToast={showToast} />}

      <Toast message={toastMessage} />
      <WorkBottomNav />
    </div>
  );
}

function Suppliers({ isManager, showToast }: { isManager: boolean; showToast: (m: string) => void }) {
  const { state, dispatch } = useStore();
  const suppliers = state.family.suppliers ?? [];
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div style={{ padding: "14px 20px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
      {suppliers.length === 0 && !adding && (
        <div style={{ fontSize: 13, color: "var(--ink-faint)", background: "#ffffff", border: "1px solid var(--line)", borderRadius: 12, padding: "18px 14px", textAlign: "center", lineHeight: 1.6 }}>
          {isManager ? "אין ספקים עדיין. הוסף את המספרים שהצוות צריך בשטח." : "המנהל טרם הוסיף ספקים."}
        </div>
      )}

      {suppliers.map((sp) =>
        editing?.id === sp.id ? (
          <SupplierForm
            key={sp.id}
            initial={sp}
            onCancel={() => setEditing(null)}
            onSave={(v) => {
              dispatch({ type: "UPDATE_SUPPLIER", supplierId: sp.id, ...v });
              setEditing(null);
              showToast("הספק עודכן");
            }}
          />
        ) : (
          <div key={sp.id} style={cardStyle}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700 }}>{sp.name}</div>
                {sp.category && <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 2 }}>{sp.category}</div>}
                {sp.note && <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 4, lineHeight: 1.5 }}>{sp.note}</div>}
              </div>
              {isManager && (
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <button onClick={() => setEditing(sp)} aria-label={`עריכת ${sp.name}`} style={iconBtn}>
                    ✎
                  </button>
                  <button
                    onClick={() => {
                      if (!window.confirm(`למחוק את ${sp.name} מרשימת הספקים?`)) return;
                      dispatch({ type: "REMOVE_SUPPLIER", supplierId: sp.id });
                      showToast("הספק נמחק");
                    }}
                    aria-label={`מחיקת ${sp.name}`}
                    style={{ ...iconBtn, color: work.alert }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
            {/* A phone number in a directory exists to be dialled, not read out. */}
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <a href={`tel:${sp.phone.replace(/[^\d+]/g, "")}`} style={{ ...actionBtn, background: work.ink, color: "#ffffff", border: "none" }}>
                חיוג · <span dir="ltr">{sp.phone}</span>
              </a>
              {sp.email && (
                <a href={`mailto:${sp.email}`} style={{ ...actionBtn, background: "#ffffff", color: "var(--ink)", border: "1px solid var(--line)", flex: "0 0 auto", padding: "10px 14px" }}>
                  מייל
                </a>
              )}
            </div>
          </div>
        )
      )}

      {isManager &&
        (adding ? (
          <SupplierForm
            onCancel={() => setAdding(false)}
            onSave={(v) => {
              dispatch({ type: "ADD_SUPPLIER", ...v });
              setAdding(false);
              showToast("הספק נוסף");
            }}
          />
        ) : (
          <button onClick={() => setAdding(true)} style={{ ...actionBtn, background: work.ink, color: "#ffffff", border: "none", marginTop: 4 }}>
            + הוספת ספק
          </button>
        ))}
    </div>
  );
}

function SupplierForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Supplier;
  onSave: (v: { name: string; phone: string; category?: string; email?: string; note?: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const canSave = name.trim().length > 1 && phone.trim().length > 5;

  return (
    <div style={{ ...cardStyle, borderColor: work.ink }}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="שם הספק / איש הקשר" style={inputStyle} />
      <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" dir="ltr" placeholder="050-0000000" style={{ ...inputStyle, textAlign: "start" }} />
      <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="תחום (לדוגמה: חומרי ניקיון)" style={inputStyle} />
      <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" dir="ltr" placeholder="מייל (לא חובה)" style={{ ...inputStyle, textAlign: "start" }} />
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="הערה (לא חובה)" style={{ ...inputStyle, marginBottom: 10 }} />
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => canSave && onSave({ name, phone, category, email, note })}
          disabled={!canSave}
          style={{ ...actionBtn, background: work.ink, color: "#ffffff", border: "none", opacity: canSave ? 1 : 0.45 }}
        >
          שמירה
        </button>
        <button onClick={onCancel} style={{ ...actionBtn, background: "#ffffff", color: "var(--ink)", border: "1px solid var(--line)" }}>
          ביטול
        </button>
      </div>
    </div>
  );
}

function Documents({ isManager, showToast }: { isManager: boolean; showToast: (m: string) => void }) {
  const { state, dispatch, uploadAttachment, describeUploadFailure, maxUploadBytes } = useStore();
  const docs = state.family.documents ?? [];
  const fileRef = useRef<HTMLInputElement>(null);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [noteText, setNoteText] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [open, setOpen] = useState<CompanyDoc | null>(null);
  const actor = state.family.parentName || V.admin;

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !title.trim()) return;
    setBusy(true);
    setUploadError("");
    try {
      // Photos stay inline as a compressed data URL — small, and they load with the
      // record. A real document goes to Storage: there is no lossy version of a PDF,
      // and putting one inside the database record would blow past its size limit.
      if (file.type.startsWith("image/")) {
        const content = await resizeImageToDataUrl(file, 1200, 0.72);
        dispatch({ type: "ADD_DOCUMENT", title: title.trim(), kind: "image", content, by: actor });
        reset();
        showToast("המסמך נוסף");
        return;
      }
      if (file.size > maxUploadBytes) {
        setUploadError(`הקובץ גדול מדי (עד ${Math.round(maxUploadBytes / 1024 / 1024)}MB)`);
        return;
      }
      const stored = await uploadAttachment("documents", file);
      dispatch({ type: "ADD_DOCUMENT", title: title.trim(), kind: "file", content: stored.url, path: stored.path, size: stored.size, mime: stored.mime, by: actor });
      reset();
      showToast("הקובץ הועלה");
    } catch (err) {
      console.error("Document upload failed:", err);
      setUploadError(describeUploadFailure(err));
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setTitle("");
    setLinkUrl("");
    setNoteText("");
    setAdding(false);
  }

  return (
    <div style={{ padding: "14px 20px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
      {docs.length === 0 && !adding && (
        <div style={{ fontSize: 13, color: "var(--ink-faint)", background: "#ffffff", border: "1px solid var(--line)", borderRadius: 12, padding: "18px 14px", textAlign: "center", lineHeight: 1.6 }}>
          {isManager ? "אין מסמכים עדיין. נהלים, תמונות ציוד או קישורים שהצוות צריך." : "המנהל טרם הוסיף מסמכים."}
        </div>
      )}

      {docs.map((d) => (
        <div key={d.id} style={cardStyle}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span style={{ fontSize: 17, flexShrink: 0, lineHeight: 1.3 }}>
              {d.kind === "image" ? "🖼" : d.kind === "link" ? "🔗" : d.kind === "file" ? fileIcon(d.mime) : "📄"}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{d.title}</div>
              <div style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 2 }}>
                {d.addedBy} · {formatDate(d.addedAt)}
              </div>
            </div>
            {isManager && (
              <button
                onClick={() => {
                  if (!window.confirm(`למחוק את "${d.title}"?`)) return;
                  dispatch({ type: "REMOVE_DOCUMENT", docId: d.id });
                  showToast("המסמך נמחק");
                }}
                aria-label={`מחיקת ${d.title}`}
                style={{ ...iconBtn, color: work.alert }}
              >
                ×
              </button>
            )}
          </div>

          {d.kind === "note" && <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.6, marginTop: 9, whiteSpace: "pre-wrap" }}>{d.content}</div>}
          {d.kind === "link" && (
            <a href={d.content} target="_blank" rel="noopener noreferrer" dir="ltr" style={{ display: "block", fontSize: 12, color: work.waiting, marginTop: 9, wordBreak: "break-all" }}>
              {d.content}
            </a>
          )}
          {d.kind === "file" && (
            <a
              href={d.content}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 9, background: work.ink, color: "#ffffff", borderRadius: 9, padding: "10px", fontSize: 12.5, fontWeight: 700, textDecoration: "none" }}
            >
              פתיחת הקובץ{d.size ? ` · ${formatBytes(d.size)}` : ""}
            </a>
          )}
          {d.kind === "image" && (
            <button onClick={() => setOpen(d)} style={{ display: "block", width: "100%", border: "none", background: "none", padding: 0, marginTop: 9 }}>
              <img src={d.content} alt={d.title} style={{ width: "100%", borderRadius: 9, display: "block" }} />
            </button>
          )}
        </div>
      ))}

      {isManager &&
        (adding ? (
          <div style={{ ...cardStyle, borderColor: work.ink }}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="שם המסמך (חובה)" style={inputStyle} />
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 9 }}>בחר סוג אחד:</div>

            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy || !title.trim()}
              style={{ ...actionBtn, background: "#ffffff", color: "var(--ink)", border: "1px solid var(--line)", marginBottom: 8, opacity: busy || !title.trim() ? 0.45 : 1 }}
            >
              {busy ? "מעלה…" : "🖼 תמונה או קובץ (PDF, Word, Excel)"}
            </button>
            <input ref={fileRef} type="file" onChange={onPickFile} style={{ display: "none" }} />
            {uploadError && <div style={{ fontSize: 12, color: work.alert, marginBottom: 8 }}>{uploadError}</div>}

            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} dir="ltr" placeholder="https://…" style={{ ...inputStyle, marginBottom: 0, textAlign: "start" }} />
              <button
                onClick={() => {
                  dispatch({ type: "ADD_DOCUMENT", title: title.trim(), kind: "link", content: linkUrl.trim(), by: actor });
                  reset();
                  showToast("הקישור נוסף");
                }}
                disabled={!title.trim() || !/^https?:\/\//.test(linkUrl.trim())}
                style={{ ...actionBtn, flex: "0 0 auto", padding: "10px 14px", background: work.ink, color: "#ffffff", border: "none", opacity: !title.trim() || !/^https?:\/\//.test(linkUrl.trim()) ? 0.45 : 1 }}
              >
                קישור
              </button>
            </div>

            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={3}
              placeholder="או נוהל בכתב…"
              style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => {
                  dispatch({ type: "ADD_DOCUMENT", title: title.trim(), kind: "note", content: noteText.trim(), by: actor });
                  reset();
                  showToast("הנוהל נוסף");
                }}
                disabled={!title.trim() || noteText.trim().length < 2}
                style={{ ...actionBtn, background: work.ink, color: "#ffffff", border: "none", opacity: !title.trim() || noteText.trim().length < 2 ? 0.45 : 1 }}
              >
                שמירת נוהל
              </button>
              <button onClick={reset} style={{ ...actionBtn, background: "#ffffff", color: "var(--ink)", border: "1px solid var(--line)" }}>
                ביטול
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} style={{ ...actionBtn, background: work.ink, color: "#ffffff", border: "none", marginTop: 4 }}>
            + הוספת מסמך
          </button>
        ))}

      {open && (
        <button
          onClick={() => setOpen(null)}
          aria-label="סגירה"
          style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(10,12,18,0.92)", border: "none", padding: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <img src={open.content} alt={open.title} style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 8 }} />
        </button>
      )}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid var(--line)",
  borderRadius: 12,
  padding: "13px 15px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 9,
  border: "1px solid var(--line)",
  fontSize: 13.5,
  marginBottom: 8,
};

const actionBtn: React.CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 9,
  padding: "11px 10px",
  fontSize: 13,
  fontWeight: 700,
  textDecoration: "none",
};

const iconBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  fontSize: 16,
  fontWeight: 800,
  color: "var(--ink-soft)",
  padding: "0 5px",
  lineHeight: 1,
};
