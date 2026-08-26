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
}

export interface LinkUpdate {
  kind: "ack" | "started" | "done" | "note" | "photo";
  at: string;
  note?: string;
  /** A compressed data URL. Photos ride inside the update rather than through Storage
   * so the worker never needs an account for the bucket either. */
  photo?: string;
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
  }[];
}
