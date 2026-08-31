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
  /** A compressed data URL. Photos ride inside the update rather than through Storage
   * so the worker never needs an account for the bucket either. */
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
