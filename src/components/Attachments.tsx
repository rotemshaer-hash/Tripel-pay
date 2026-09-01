import { useRef, useState } from "react";
import { useStore } from "../data/store";
import { resizeImageToBlob } from "../utils/resizeImage";
import { formatBytes, fileIcon } from "../utils/files";
import { formatDateTime } from "../utils/datetime";
import { work } from "../data/vocabulary";
import type { AttachmentDraft } from "../data/attachments";
import type { Attachment } from "../data/types";

/**
 * Where the file actually is, said out loud.
 *
 * Tapping "file" hands over to Android's document picker, which opens on "Recent" —
 * a view that is empty on most phones and looks like the picker is broken or like the
 * phone has no files on it. The way to the device's own storage is a hamburger in the
 * corner that nobody finds by accident. The picker is the operating system's and
 * cannot be replaced from a web page; the sentence telling somebody where to tap is
 * the part that is ours, and it is cheaper than the support call.
 */
export const FILE_PICKER_HINT = "לא רואה את הקובץ? במסך שנפתח יש ☰ בפינה — משם בוחרים את הטלפון או Drive.";

/**
 * The three ways evidence actually arrives from a site: a fresh photo, one already on
 * the phone, or a document. Shared by the daily link and the single-task link, which
 * used to disagree — one offered all three, the other only a camera, so a delivery
 * note already photographed that morning had a way onto one link and not the other.
 *
 * No `accept` on the file input on purpose: filtering it narrows Android's picker to
 * local files of those types, which is how someone looking for a document in Drive
 * ends up staring at their Downloads folder.
 */
export function ProofButtons({ busy, onPicked }: { busy: boolean; onPicked: (file: File) => void }) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onPicked(file);
  }

  const sources = [
    { label: "📷 מצלמה", ref: cameraRef },
    { label: "🖼️ גלריה", ref: galleryRef },
    { label: "📄 קובץ", ref: fileRef },
  ];

  return (
    <div>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={pick} style={{ display: "none" }} />
      <input ref={galleryRef} type="file" accept="image/*" onChange={pick} style={{ display: "none" }} />
      <input ref={fileRef} type="file" onChange={pick} style={{ display: "none" }} />
      <div style={{ display: "flex", gap: 7 }}>
        {sources.map((source) => (
          <button
            key={source.label}
            type="button"
            disabled={busy}
            onClick={() => source.ref.current?.click()}
            style={{
              flex: 1,
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 13,
              padding: "15px 6px",
              fontSize: 14,
              fontWeight: 800,
              color: "var(--ink)",
              opacity: busy ? 0.5 : 1,
            }}
          >
            {busy ? "שולח…" : source.label}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 11, color: "var(--ink-faint)", lineHeight: 1.5, marginTop: 7 }}>{FILE_PICKER_HINT}</div>
    </div>
  );
}

/**
 * The one control for putting a file on something.
 *
 * It existed only inside the task-detail screen, which is why the manager could attach
 * a file to a task that already existed but not to the one they were writing — the
 * form had no such control at all. One definition, used by both.
 *
 * Photos go to Storage, the same as any other file. They used to ride inline as a
 * compressed data URL, which was fine for one or two but not for the evidence a real
 * job produces — a task photographed at every stop can run to dozens of shots, and
 * the whole family record loads as one object on every sign-in. Storage is what lets
 * that scale with the job instead of with what the record can carry.
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

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    setDone("");
    try {
      if (file.type.startsWith("image/")) {
        const blob = await resizeImageToBlob(file);
        const stored = await uploadAttachment(folder, new File([blob], file.name || "photo.jpg", { type: blob.type }));
        onAttached({ kind: "image", name: file.name, content: stored.url, path: stored.path, size: stored.size, mime: stored.mime });
        setDone(`${file.name} צורפה`);
        return;
      }
      // A Google Doc, Sheet or Slide is not a file on the device — Drive hands over an
      // empty shell, or nothing at all. Saying so beats a failed upload with no reason.
      if (file.size === 0) {
        setError("נראה שזה קובץ Google (Docs/Sheets) שלא ניתן לצרף ישירות מהטלפון. אפשר לייצא אותו ל-PDF ואז לצרף.");
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
      {!camera && <div style={{ fontSize: 11, color: "var(--ink-faint)", lineHeight: 1.5 }}>{FILE_PICKER_HINT}</div>}
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
            <>
              <img src={a.content} alt={a.name} style={{ width: "100%", borderRadius: 7, display: "block" }} />
              {/* What the worker called the shot lived in the alt attribute, which is
                  to say nowhere: the manager assembling a pack for a customer could
                  see twelve photos and not one of the captions written to tell them
                  apart. */}
              {a.name && a.name !== "צילום מהשטח" && (
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)", marginTop: 6 }}>{a.name}</div>
              )}
            </>
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
