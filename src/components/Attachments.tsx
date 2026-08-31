import { useRef, useState } from "react";
import { useStore } from "../data/store";
import { resizeImageToDataUrl } from "../utils/resizeImage";
import { formatBytes, fileIcon } from "../utils/files";
import { formatDateTime } from "../utils/datetime";
import { work } from "../data/vocabulary";
import type { AttachmentDraft } from "../data/attachments";
import type { Attachment } from "../data/types";

/**
 * The one control for putting a file on something.
 *
 * It existed only inside the task-detail screen, which is why the manager could attach
 * a file to a task that already existed but not to the one they were writing — the
 * form had no such control at all. One definition, used by both.
 *
 * Photos stay inline as a compressed data URL: they are small once resized, they load
 * with the record, and every one already stored is in that form. Real documents go to
 * Storage — a PDF has no lossy version, and putting one inside the database record
 * would blow past its size limit.
 */
export function AttachButton({
  folder,
  label = "📎 צירוף תמונה או קובץ",
  onAttached,
  camera,
}: {
  /** Where in the bucket this file belongs, e.g. `tasks/{taskId}`. */
  folder: string;
  label?: string;
  onAttached: (draft: AttachmentDraft) => void;
  /** Opens the camera instead of the file browser. Evidence is taken on site, with
   * one hand — routing that through a file picker loses most of it. */
  camera?: boolean;
}) {
  const { uploadAttachment, describeUploadFailure, maxUploadBytes } = useStore();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const [link, setLink] = useState("");

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    setDone("");
    try {
      if (file.type.startsWith("image/")) {
        const content = await resizeImageToDataUrl(file, 900, 0.75);
        onAttached({ kind: "image", name: file.name, content });
        setDone(`${file.name} צורפה`);
        return;
      }
      // A Google Doc, Sheet or Slide is not a file on the device — Drive hands over an
      // empty shell, or nothing at all. Saying so beats a failed upload with no reason.
      if (file.size === 0) {
        setError("נראה שזה קובץ Google (Docs/Sheets) שלא ניתן לצרף ישירות. אפשר לצרף אותו כקישור בכפתור 🔗, או לייצא אותו ל-PDF ולצרף.");
        return;
      }
      if (file.size > maxUploadBytes) {
        setError(`הקובץ גדול מדי (עד ${Math.round(maxUploadBytes / 1024 / 1024)}MB)`);
        return;
      }
      const stored = await uploadAttachment(folder, file);
      onAttached({ kind: "file", name: stored.name, content: stored.url, path: stored.path, size: stored.size, mime: stored.mime });
      setDone(`${file.name} הועלה`);
    } catch (err) {
      console.error("Attachment upload failed:", err);
      setError(describeUploadFailure(err));
    } finally {
      setBusy(false);
    }
  }

  // Android's "choose an action" sheet is where an attachment goes to die: a person
  // looking for a photo is shown a voice recorder and a video camera. Naming the
  // source up front means the phone opens the right picker and nothing else.
  const sources: { label: string; ref: React.RefObject<HTMLInputElement | null> }[] = camera
    ? [{ label, ref: cameraRef }]
    : [
        { label: "📷 מצלמה", ref: cameraRef },
        { label: "🖼️ גלריה", ref: galleryRef },
        { label: "📄 קובץ", ref: fileRef },
      ];

  function attachLink() {
    const raw = link.trim();
    if (!raw) return;
    const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    let name = url;
    try {
      const parsed = new URL(url);
      name = parsed.hostname.replace(/^www\./, "") + (parsed.pathname !== "/" ? " — קישור" : "");
      if (/docs\.google\.com/.test(parsed.hostname)) {
        name = /spreadsheets/.test(parsed.pathname) ? "גיליון Google" : /presentation/.test(parsed.pathname) ? "מצגת Google" : "מסמך Google";
      } else if (/drive\.google\.com/.test(parsed.hostname)) {
        name = "קובץ ב-Google Drive";
      }
    } catch {
      /* an address that will not parse is still worth keeping as typed */
    }
    onAttached({ kind: "file", name, content: url });
    setDone(`${name} צורף`);
    setLink("");
    setLinkOpen(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={onPick} style={{ display: "none" }} />
      <input ref={galleryRef} type="file" accept="image/*" onChange={onPick} style={{ display: "none" }} />
      {/* No accept filter on purpose. Restricting it narrows Android's picker to
          local files of those types — which is how a person looking for a document in
          Google Drive ends up staring at their Downloads folder. Unfiltered, the picker
          opens with every source it has: the phone, Drive, Dropbox, whatever is
          installed. */}
      <input ref={fileRef} type="file" onChange={onPick} style={{ display: "none" }} />

      <div style={{ display: "flex", gap: 7 }}>
        {sources.map((source) => (
          <button
            key={source.label}
            type="button"
            onClick={() => source.ref.current?.click()}
            disabled={busy}
            style={{
              flex: 1,
              background: "#ffffff",
              color: "var(--ink)",
              border: "1px solid var(--line)",
              borderRadius: 10,
              padding: "12px 8px",
              fontSize: camera ? 15 : 13,
              fontWeight: 800,
              opacity: busy ? 0.6 : 1,
            }}
          >
            {busy ? "מעלה…" : source.label}
          </button>
        ))}
      </div>
      {/* Anything living in Drive — a sheet the office keeps open all week, a shared
          folder — belongs here as a link, not as a copy that goes stale the moment
          somebody edits the original. */}
      {!camera && !linkOpen && (
        <button
          type="button"
          onClick={() => setLinkOpen(true)}
          style={{ background: "none", border: "none", color: work.waiting, fontSize: 12.5, fontWeight: 800, textAlign: "start", padding: 0 }}
        >
          🔗 צירוף קישור (Google Drive / Sheets / כל כתובת)
        </button>
      )}
      {linkOpen && (
        <div style={{ display: "flex", gap: 7 }}>
          <input
            dir="ltr"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && attachLink()}
            placeholder="https://docs.google.com/…"
            style={{ flex: 1, padding: "11px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.9)", background: "rgba(255,255,255,0.85)", fontSize: 13 }}
          />
          <button
            type="button"
            onClick={attachLink}
            disabled={!link.trim()}
            style={{ background: "#232a3b", color: "#ffffff", border: "none", borderRadius: 10, padding: "0 15px", fontSize: 12.5, fontWeight: 800, opacity: link.trim() ? 1 : 0.4 }}
          >
            צירוף
          </button>
        </div>
      )}
      {done && <div style={{ fontSize: 12, color: work.done, fontWeight: 700 }}>{`✓ ${done}`}</div>}
      {error && <div style={{ fontSize: 12, color: work.alert, lineHeight: 1.5 }}>{error}</div>}
    </div>
  );
}

/** The attachments on a record. `onRemove` is for files not yet committed anywhere —
 * once an attachment is part of the audit trail it is not taken back. */
export function AttachmentList({
  items,
  empty,
  onRemove,
}: {
  items: Attachment[];
  empty: string;
  onRemove?: (id: string) => void;
}) {
  if (items.length === 0) return <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 8 }}>{empty}</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
      {items.map((a) => (
        <div key={a.id} style={{ background: "var(--paper)", borderRadius: 9, padding: 9 }}>
          {a.kind === "image" ? (
            <img src={a.content} alt={a.name} style={{ width: "100%", borderRadius: 7, display: "block" }} />
          ) : a.kind === "file" ? (
            <a
              href={a.content}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "var(--ink)" }}
            >
              <span style={{ fontSize: 17, flexShrink: 0 }}>{fileIcon(a.mime)}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
                <span style={{ display: "block", fontSize: 10.5, color: "var(--ink-faint)", marginTop: 1 }}>{formatBytes(a.size)} · פתיחה</span>
              </span>
            </a>
          ) : (
            <div style={{ fontSize: 13, color: "var(--ink)" }}>{a.content}</div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
            <span style={{ flex: 1, fontSize: 10.5, color: "var(--ink-faint)" }}>
              {a.addedBy} · {formatDateTime(a.addedAt)}
            </span>
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(a.id)}
                style={{ background: "none", border: "none", color: work.alert, fontSize: 11.5, fontWeight: 800, padding: 0 }}
              >
                הסרה
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
