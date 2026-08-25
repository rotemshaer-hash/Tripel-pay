import { ref, onValue, set } from "firebase/database";
import { db } from "./config";
import { normalizeFamily } from "../data/family";
import type { Child, Family } from "../data/types";

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

export async function saveFamily(uid: string, family: Family) {
  await set(ref(db, `families/${uid}`), family);
}

// A linked child session is only ever allowed (by the security rules) to write to its
// own child subtree, never the rest of the family — so child sessions save through
// this narrower path instead of overwriting the whole family blob.
export async function saveChildOnly(familyUid: string, childId: string, child: Child) {
  await set(ref(db, `families/${familyUid}/children/${childId}`), child);
}

export async function createInviteCode(familyUid: string, childId: string, code: string) {
  await set(ref(db, `inviteCodes/${code}`), { familyUid, childId });
}

export async function createParentInviteCode(familyUid: string, code: string) {
  await set(ref(db, `parentInviteCodes/${code}`), { familyUid });
}
