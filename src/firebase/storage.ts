import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./config";

/** Anything larger than this is refused before the upload starts, so a phone on a bad
 * connection fails in a second rather than after a minute. Mirrored in storage.rules —
 * the rule is the one that actually binds; this is the courteous version of it. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export interface StoredFile {
  url: string;
  /** The object's path in the bucket. Kept because a download URL cannot be turned
   * back into one, and without it the object can never be deleted. */
  path: string;
  name: string;
  size: number;
  mime: string;
}

/** Firebase's own error codes, translated into something a person can act on. */
export function describeUploadError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  if (code === "storage/unauthorized") return "אין הרשאה להעלות. ייתכן שכללי האחסון טרם עודכנו.";
  if (code === "storage/quota-exceeded") return "נגמר מקום האחסון בפרויקט.";
  if (code === "storage/retry-limit-exceeded") return "ההעלאה נכשלה — חיבור איטי מדי. נסה שוב.";
  if (code === "storage/unknown" || code === "storage/object-not-found") {
    // The overwhelmingly common cause: the bucket was never created in the console.
    return "שירות האחסון לא זמין. ייתכן ש-Storage טרם הופעל בפרויקט Firebase.";
  }
  return "ההעלאה נכשלה. בדוק את החיבור ונסה שוב.";
}

/**
 * Puts one file in the bucket and hands back everything needed to show it and, later,
 * remove it.
 *
 * Objects live under the UPLOADER's uid rather than the company's, because Storage
 * rules cannot read the Realtime Database and therefore cannot ask "does this person
 * belong to that company?". Keying on the uploader is a question the rules can answer
 * on their own: each person writes only their own folder. Reading is open to any
 * signed-in user — a download URL carries an unguessable token, which is what actually
 * keeps a file private.
 */
export async function uploadFile(uid: string, folder: string, file: File): Promise<StoredFile> {
  // The rule is `size < 10MB`, so a file of exactly 10MB is refused by it. Checking
  // with > here would let that one file through to the server and come back as
  // "no permission" — a message pointing at the rules when the cause is the size.
  if (file.size >= MAX_UPLOAD_BYTES) throw new Error("file-too-large");
  // The stored name is generated: a real filename can carry characters that break a
  // path, and two people uploading "סריקה.pdf" must not overwrite each other.
  const extension = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
  const path = `uploads/${uid}/${folder}/${crypto.randomUUID()}${extension}`;
  const objectRef = storageRef(storage, path);
  await uploadBytes(objectRef, file, { contentType: file.type || "application/octet-stream", customMetadata: { originalName: file.name } });
  const url = await getDownloadURL(objectRef);
  return { url, path, name: file.name, size: file.size, mime: file.type || "application/octet-stream" };
}

/** Best effort: a record removed while its object lingers is untidy, but a failure
 * here must never block the user from removing the record they asked to remove. */
export async function deleteStoredFile(path: string): Promise<void> {
  await deleteObject(storageRef(storage, path)).catch(() => {});
}
