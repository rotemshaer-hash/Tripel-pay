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
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      if (file.type.startsWith("image/")) {
        const content = await resizeImageToDataUrl(file, 900, 0.75);
        onAttached({ kind: "image", name: file.name, content });
        return;
      }
      if (file.size > maxUploadBytes) {
        setError(`הקובץ גדול מדי (עד ${Math.round(maxUploadBytes / 1024 / 1024)}MB)`);
        return;
      }
      const stored = await uploadAttachment(folder, file);
      onAttached({ kind: "file", name: stored.name, content: stored.url, path: stored.path, size: stored.size, mime: stored.mime });
    } catch (err) {
      console.error("Attachment upload failed:", err);
      setError(describeUploadFailure(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
      <input
        ref={inputRef}
        type="file"
        accept={camera ? "image/*" : undefined}
        {...(camera ? { capture: "environment" as const } : {})}
        onChange={onPick}
        style={{ display: "none" }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        style={{
          background: "#ffffff",
          color: "var(--ink)",
          border: "1px solid var(--line)",
          borderRadius: 10,
          padding: "12px",
          fontSize: 13.5,
          fontWeight: 800,
          opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? "מעלה…" : label}
      </button>
      {error && <div style={{ fontSize: 12, color: work.alert }}>{error}</div>}
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
