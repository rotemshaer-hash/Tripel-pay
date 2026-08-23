import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { auth, db } from "./config";
import { seedFamily } from "../data/seed";
import { createInviteCode, createParentInviteCode } from "./db";
import { normalizeFamily } from "../data/family";
import type { Family } from "../data/types";

// Children register with a username instead of an email — same synthesized-email trick
// Drushe uses (username -> username@kidemy.app), namespaced under child- so a kid's
// username can never collide with a parent's real email address.
function usernameToEmail(username: string): string {
  const clean = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "");
  return `child-${clean}@triplepay.app`;
}

export interface ChildLink {
  familyUid: string;
  childId: string;
}

export interface ParentLink {
  familyUid: string;
}

export function onAuthChange(cb: (user: User | null) => void) {
  return onAuthStateChanged(auth, cb);
}

export async function registerParent(email: string, password: string, name: string, childNames?: string[], companyName?: string): Promise<Family> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  // Same known Firebase race as Drushe: auth.currentUser updates in JS before the
  // Realtime Database connection has re-authenticated with the fresh token, so an
  // immediate write can fail with PERMISSION_DENIED. Force a fresh token first, then
  // retry the write a few times with backoff if it still gets rejected.
  await cred.user.getIdToken(true).catch(() => {});
  await updateProfile(cred.user, { displayName: name }).catch(() => {});

  const family = seedFamily(name, email, childNames, companyName);
  const delays = [1200, 2500, 4500];
  let lastErr: unknown = null;
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      await set(ref(db, `families/${cred.user.uid}`), family);
      // Each seeded child gets a redeemable invite code so the parent can share it —
      // stored at the top level (not under families/{uid}) so a child, once they have
      // their own auth identity, can look it up before they're linked to anything.
      await Promise.all(Object.values(family.children).map((c) => createInviteCode(cred.user.uid, c.id, c.inviteCode)));
      await createParentInviteCode(cred.user.uid, family.parentInviteCode);
      return family;
    } catch (err) {
      lastErr = err;
      if (attempt === delays.length) break;
      await new Promise((r) => setTimeout(r, delays[attempt]));
      await cred.user.getIdToken(true).catch(() => {});
    }
  }
  // Roll back the auth account if the family record never saved, so registration
  // can be retried cleanly instead of leaving an orphaned Auth-only account.
  await cred.user.delete().catch(() => {});
  throw lastErr;
}

export async function loginParent(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function resetParentPassword(email: string) {
  return sendPasswordResetEmail(auth, email);
}

export async function logoutParent() {
  return signOut(auth);
}

export async function fetchFamily(uid: string): Promise<Family | null> {
  const snap = await get(ref(db, `families/${uid}`));
  return snap.exists() ? normalizeFamily(snap.val() as Family) : null;
}

// A child redeems the invite code their parent shared with them, choosing their own
// username + password. This creates a real, separate Firebase Auth identity for the
// child — not a shared login with the parent — linked to the parent's family record
// via childLogins/{childUid}, which the security rules use to scope exactly what that
// child can read and write.
export async function registerChild(code: string, username: string, password: string): Promise<{ familyUid: string; childId: string; family: Family }> {
  const email = usernameToEmail(username);
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await cred.user.getIdToken(true).catch(() => {});

  const delays = [1200, 2500, 4500];
  let lastErr: unknown = null;
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      const codeSnap = await get(ref(db, `inviteCodes/${code.trim().toUpperCase()}`));
      if (!codeSnap.exists()) {
        lastErr = new Error("invalid-code");
        break; // a genuinely wrong code will never resolve on retry
      }
      const link = codeSnap.val() as ChildLink;
      await set(ref(db, `childLogins/${cred.user.uid}`), link);
      // Mark the child record itself as linked (so the parent's UI can stop showing
      // the invite card once this child has actually registered).
      await set(ref(db, `families/${link.familyUid}/children/${link.childId}/authUid`), cred.user.uid);
      const family = await fetchFamily(link.familyUid);
      if (!family) throw new Error("family-not-found");
      return { familyUid: link.familyUid, childId: link.childId, family };
    } catch (err) {
      lastErr = err;
      if (attempt === delays.length) break;
      await new Promise((r) => setTimeout(r, delays[attempt]));
      await cred.user.getIdToken(true).catch(() => {});
    }
  }
  await cred.user.delete().catch(() => {});
  throw lastErr;
}

export async function loginChild(username: string, password: string) {
  const email = usernameToEmail(username);
  return signInWithEmailAndPassword(auth, email, password);
}

export async function fetchChildLink(uid: string): Promise<ChildLink | null> {
  const snap = await get(ref(db, `childLogins/${uid}`));
  return snap.exists() ? (snap.val() as ChildLink) : null;
}

// A second parent (partner) redeems the invite code the first parent shared, with
// their own email + password — a real, separate Firebase Auth identity, linked via
// parentLogins/{parentUid}, which the rules grant the SAME full family access as the
// original owner (unlike a child, who only ever gets their own scoped subtree).
export async function registerSecondParent(code: string, email: string, password: string, name: string): Promise<{ familyUid: string; family: Family }> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await cred.user.getIdToken(true).catch(() => {});
  await updateProfile(cred.user, { displayName: name }).catch(() => {});

  const delays = [1200, 2500, 4500];
  let lastErr: unknown = null;
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      const codeSnap = await get(ref(db, `parentInviteCodes/${code.trim().toUpperCase()}`));
      if (!codeSnap.exists()) {
        lastErr = new Error("invalid-code");
        break;
      }
      const link = codeSnap.val() as ParentLink;
      await set(ref(db, `parentLogins/${cred.user.uid}`), link);
      await set(ref(db, `families/${link.familyUid}/secondParentAuthUid`), cred.user.uid);
      await set(ref(db, `families/${link.familyUid}/secondParentName`), name);
      const family = await fetchFamily(link.familyUid);
      if (!family) throw new Error("family-not-found");
      return { familyUid: link.familyUid, family };
    } catch (err) {
      lastErr = err;
      if (attempt === delays.length) break;
      await new Promise((r) => setTimeout(r, delays[attempt]));
      await cred.user.getIdToken(true).catch(() => {});
    }
  }
  await cred.user.delete().catch(() => {});
  throw lastErr;
}

export async function fetchParentLink(uid: string): Promise<ParentLink | null> {
  const snap = await get(ref(db, `parentLogins/${uid}`));
  return snap.exists() ? (snap.val() as ParentLink) : null;
}
