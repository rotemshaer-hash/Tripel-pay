import { ref, onValue, set, push, get, remove } from "firebase/database";
import { db } from "./config";
import { normalizeFamily } from "../data/family";
import type { Child, Family } from "../data/types";
import type { LinkUpdate, TaskLinkSnapshot, WorkerDaySnapshot } from "../data/tasklink";

// Real-time listener on a parent's family record — fires immediately with the
// current value, then again on every change from any device (parent phone,
// child phone, another parent). Mirrors Drushe's db.ref(...).on('value', ...) pattern.
export function subscribeFamily(uid: string, cb: (family: Family | null) => void, onError?: (err: Error) => void) {
  const familyRef = ref(db, `families/${uid}`);
  // A listener without an error handler fails silently: the record never arrives, the
  // app keeps showing the last cached copy, and nothing anywhere says the connection
  // to the server was refused. Every read that matters reports its failure.
  return onValue(
    familyRef,
    (snap) => {
      cb(snap.exists() ? normalizeFamily(snap.val() as Family) : null);
    },
    (err) => onError?.(err)
  );
}

/**
 * Firebase refuses a write whose payload contains `undefined` anywhere — and refuses
 * the WHOLE write, not the offending key. An optional field left empty (a task with no
 * brief, no due date, no site) therefore stopped the entire company record from saving,
 * which is invisible from the screen: the change is in local state and looks saved.
 *
 * Dropping undefined keys belongs here, at the one boundary where the rule exists,
 * rather than in every action that builds a record with an optional field in it.
 */
function forFirebase<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function saveFamily(uid: string, family: Family) {
  await set(ref(db, `families/${uid}`), forFirebase(family));
}

// A linked child session is only ever allowed (by the security rules) to write to its
// own child subtree, never the rest of the family — so child sessions save through
// this narrower path instead of overwriting the whole family blob.
export async function saveChildOnly(familyUid: string, childId: string, child: Child) {
  await set(ref(db, `families/${familyUid}/children/${childId}`), forFirebase(child));
}

export async function createInviteCode(familyUid: string, childId: string, code: string) {
  await set(ref(db, `inviteCodes/${code}`), { familyUid, childId });
}

export async function createParentInviteCode(familyUid: string, code: string) {
  await set(ref(db, `parentInviteCodes/${code}`), { familyUid });
}


/**
 * The worker's way in, without an account.
 *
 * The product is an add-on to WhatsApp, and asking the person on a roof to install an
 * app, invent a username and remember a password is where that promise breaks — it is
 * exactly what broke for the first worker who tried. So a task carries an unguessable
 * token, the link in the message contains it, and the token IS the permission: whoever
 * holds it can see that one task and report on it, and nothing else. It is the same
 * bargain as a Firebase download URL, which this app already relies on.
 *
 * `taskLinks/{token}` is the copy the worker reads — deliberately a snapshot of one
 * task, never a door into the company record. `linkInbox/{familyUid}` is where their
 * updates land, so the manager's app has ONE listener to watch instead of one per task.
 */
export async function publishTaskLink(token: string, snapshot: TaskLinkSnapshot) {
  await set(ref(db, `taskLinks/${token}`), snapshot);
}

export async function fetchTaskLink(token: string): Promise<TaskLinkSnapshot | null> {
  const snap = await get(ref(db, `taskLinks/${token}`));
  return snap.exists() ? (snap.val() as TaskLinkSnapshot) : null;
}

export async function pushLinkUpdate(familyUid: string, entry: LinkUpdate & { token: string; childId: string; taskId: string; by: string }) {
  // The one write that used to skip this. It got away with it while every field was a
  // string the caller had already checked, but an update now carries a nested file
  // whose size and type are only sometimes known — and a single undefined anywhere in
  // the payload makes Firebase reject the whole report, from a roof, with the evidence
  // in it.
  await push(ref(db, `linkInbox/${familyUid}`), forFirebase(entry));
}

export function subscribeLinkInbox(
  familyUid: string,
  cb: (entries: Record<string, LinkUpdate & { token: string; childId: string; taskId: string; by: string }>) => void,
  onError?: (err: Error) => void
) {
  return onValue(
    ref(db, `linkInbox/${familyUid}`),
    (snap) => cb((snap.val() as Record<string, LinkUpdate & { token: string; childId: string; taskId: string; by: string }>) ?? {}),
    (err) => onError?.(err)
  );
}

export async function clearInboxEntry(familyUid: string, entryId: string) {
  await remove(ref(db, `linkInbox/${familyUid}/${entryId}`));
}


export async function publishWorkerDay(token: string, snapshot: WorkerDaySnapshot) {
  await set(ref(db, `workerLinks/${token}`), snapshot);
}

export async function fetchWorkerDay(token: string): Promise<WorkerDaySnapshot | null> {
  const snap = await get(ref(db, `workerLinks/${token}`));
  return snap.exists() ? (snap.val() as WorkerDaySnapshot) : null;
}
