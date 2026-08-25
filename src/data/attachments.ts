import type { Attachment } from "./types";

/** Everything about an attachment except who added it and when — the two facts the
 * place it lands is responsible for. */
export interface AttachmentDraft {
  kind: Attachment["kind"];
  name: string;
  content: string;
  path?: string;
  size?: number;
  mime?: string;
}

/** Turns what the picker produced into a stored attachment. */
export function draftToAttachment(draft: AttachmentDraft, by: string): Attachment {
  return { id: `at-${crypto.randomUUID()}`, addedAt: new Date().toISOString(), addedBy: by, ...draft };
}
