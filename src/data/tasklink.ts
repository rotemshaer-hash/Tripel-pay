/**
 * What travels on a shared task link.
 *
 * The snapshot is deliberately a copy of one task rather than a view into the company
 * record: whoever holds the link gets that task and nothing else. The update is what
 * they can report back. Both live here, in plain data, because the screens need them
 * and no screen is allowed to reach into the Firebase modules.
 */
export interface TaskLinkSnapshot {
  familyUid: string;
  childId: string;
  taskId: string;
  company: string;
  workerName: string;
  title: string;
  brief?: string;
  dueAt?: string;
  site?: string;
  steps?: { id: string; text: string; done: boolean }[];
  status: string;
  /** What the manager has written on this task since. Without it the link is a
   * one-way form: the worker can report, and anything said back to them dies in an
   * app they do not have. */
  messages?: { at: string; by: string; text: string }[];
}

export interface LinkUpdate {
  /** `started` is no longer offered: a worker marks a job received and then finished,
   * and a third button in between was one more thing to remember while holding a
   * ladder. The kind stays in the union so reports already sitting in an inbox, and
   * the trails they wrote, still read. */
  kind: "ack" | "started" | "done" | "note" | "photo" | "file";
  at: string;
  note?: string;
  /** A compressed data URL, read only when no `file` came with the update. This used
   * to be how every photo travelled — inline, because an anonymous worker has no
   * account for a bucket to belong to. That stopped being true the day evidence
   * became a whole shift's worth of photos rather than one: an anonymous Firebase
   * session still gets a uid, and the bucket rules already key on it, so a photo now
   * uploads and travels as a `file` like anything else. Kept for the rare update
   * still queued on a phone from before this changed. */
  photo?: string;
  /** What the photo shows, in the worker's words. Every shot used to arrive called
   * "צילום מהשטח", which is fine on the job and useless in the pack the customer
   * reads: twelve identical captions and no way to tell the leak from the repair. */
  name?: string;
  /** Everything that is not a photo — a delivery note as a PDF, a scan, a document out
   * of Drive. Too big to ride inside the update, so the bytes go to Storage under the
   * worker's own anonymous uid, which the bucket rules already allow, and only the
   * address travels here. */
  file?: { name: string; url: string; path?: string; mime?: string; size?: number };
  /** Set by the client at the moment a photo or note is first sent, and sent again
   * unchanged on every later edit of that same item — the one thing that tells the
   * manager's side "update this" instead of "here's another one". Without it, editing
   * a note read as appending to it: each save landed as a fresh piece of evidence
   * sitting next to the one it was meant to replace. */
  attachmentId?: string;
}


/** One person's open work, as it travels on their daily link. */
export interface WorkerDaySnapshot {
  familyUid: string;
  childId: string;
  company: string;
  workerName: string;
  tasks: {
    taskId: string;
    title: string;
    brief?: string;
    dueAt?: string;
    site?: string;
    status: string;
    steps?: { id: string; text: string; done: boolean }[];
    acknowledged?: boolean;
    /** How much evidence is already on the task — so the page can insist on some
     * before it lets the job be closed. */
    proofCount?: number;
    messages?: { at: string; by: string; text: string }[];
  }[];
  /** When true, "finished" is refused until at least one photo or note is attached.
   * Evidence is the only thing a business is paying for here; a job closed without it
   * leaves the record exactly as thin as the WhatsApp chat it replaced. */
  requireProof?: boolean;
}
