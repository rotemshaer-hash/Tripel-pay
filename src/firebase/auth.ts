import {
  createUserWithEmailAndPassword,
  signInAnonymously,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  updateProfile,
  onAuthStateChanged,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  type User,
} from "firebase/auth";
import { ref, set, get, remove } from "firebase/database";
import { auth, db } from "./config";
import { seedFamily } from "../data/seed";
import { createInviteCode, createParentInviteCode } from "./db";
import { normalizeUsername } from "../data/username";
import { normalizeFamily } from "../data/family";
import type { Family } from "../data/types";

// Children register with a username instead of an email — same synthesized-email trick
// Drushe uses (username -> username@kidemy.app), namespaced under child- so a kid's
// username can never collide with a parent's real email address.
function usernameToEmail(username: string): string {
  return `child-${normalizeUsername(username)}@triplepay.app`;
}

/** The readable half of a signed-in identity. A worker signs in with a username, which
 * this file turns into a synthetic address — showing them that address would be
 * showing them something they never typed. Lives here because this is the one place
 * that knows the shape. */
export function identityLabel(email: string | null | undefined): string | null {
  if (!email) return null;
  const m = /^child-(.+)@triplepay\.app$/.exec(email);
  return m ? m[1] : email;
}

export interface ChildLink {
  familyUid: string;
  childId: string;
}

export interface ParentLink {
  familyUid: string;
}

/**
 * A session good enough to read one task link and report on it.
 *
 * Anonymous rather than open rules: the token is what grants access, but Firebase still
 * wants an identity behind every read and write, and an anonymous uid gives abuse
 * controls and a name in the record. Critically it must never run when somebody is
 * already signed in — a manager tapping their own link would be signed out of their
 * account by it.
 */
export async function ensureSomeSession(): Promise<void> {
  // On a cold page load `auth.currentUser` is null for a moment even when a signed-in
  // session is about to be restored from storage, so reading it straight away is
  // exactly how the manager above gets replaced by an anonymous user — the promise in
  // this comment was never actually kept. Let the restore settle before deciding.
  await auth.authStateReady();
  if (auth.currentUser) return;
  const cred = await signInAnonymously(auth);
  // The same race `writeNewFamily` already guards against, on the path that matters
  // most: the database connection can still be unauthenticated when signInAnonymously
  // resolves, and the read that follows comes back PERMISSION_DENIED. The worker's
  // screen can only translate that into "the manager has not switched something on",
  // so a person on a roof is told to go chase their manager over a handshake that
  // needed another moment. Forcing a token makes the connection carry one first.
  await cred.user.getIdToken(true).catch(() => {});
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

  try {
    const family = await writeNewFamily(cred.user, name, email, childNames, companyName);
    // Not a gate — nothing in the app checks emailVerified, and it never will block
    // sign-in. This is the manager's one chance to get an address on file that a
    // password reset can actually reach, and a timestamped record that this address
    // registered the account. If the send fails there is nothing to roll back for.
    sendEmailVerification(cred.user).catch(() => {});
    return family;
  } catch (err) {
    // Roll back the auth account if the family record never saved, so registration
    // can be retried cleanly instead of leaving an orphaned Auth-only account. When
    // even this fails, the account survives with nothing behind it — which is what
    // `createFamilyForCurrentUser` exists to repair.
    await cred.user.delete().catch(() => {});
    throw err;
  }
}

/**
 * Writes a brand-new company record for a signed-in account, retrying the known
 * Firebase race where the database connection has not yet picked up the fresh token.
 */
async function writeNewFamily(user: User, name: string, email: string, childNames?: string[], companyName?: string): Promise<Family> {
  const family = seedFamily(name, email, childNames, companyName);
  const delays = [1200, 2500, 4500];
  let lastErr: unknown = null;
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      await set(ref(db, `families/${user.uid}`), family);
      // Each seeded child gets a redeemable invite code so the parent can share it —
      // stored at the top level (not under families/{uid}) so a child, once they have
      // their own auth identity, can look it up before they're linked to anything.
      await Promise.all(Object.values(family.children).map((c) => createInviteCode(user.uid, c.id, c.inviteCode)));
      await createParentInviteCode(user.uid, family.parentInviteCode);
      return family;
    } catch (err) {
      lastErr = err;
      if (attempt === delays.length) break;
      await new Promise((r) => setTimeout(r, delays[attempt]));
      await user.getIdToken(true).catch(() => {});
    }
  }
  throw lastErr;
}

/**
 * The repair for an account that exists with nothing behind it.
 *
 * Registration creates the login first and the company record second. If the second
 * step fails and the rollback of the first one also fails, the person is left with a
 * sign-in that is refused everywhere — correct password, no data, no way forward. They
 * own that uid, so they are allowed to write its record: this finishes the job.
 */
export async function createFamilyForCurrentUser(name: string, companyName: string): Promise<Family> {
  const user = auth.currentUser;
  if (!user) throw new Error("not-signed-in");
  const existing = await fetchFamily(user.uid);
  if (existing) return existing;
  await user.getIdToken(true).catch(() => {});
  return writeNewFamily(user, name || user.displayName || "", user.email ?? "", [], companyName);
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

/**
 * Closes the account: the whole record, its invite codes, and the sign-in itself.
 *
 * Order matters and is not arbitrary.
 *
 * 1. Re-authenticate FIRST. Firebase refuses to delete a user whose session is not
 *    fresh, so this is required anyway — but doing it before anything is destroyed
 *    means a wrong password costs nothing instead of stopping halfway through with
 *    the data already gone.
 * 2. Then the database, while the account still exists. The security rules key every
 *    write on the signed-in uid, so deleting the login first would lock us out of
 *    the very records we came to remove and strand them forever.
 * 3. The login last.
 *
 * Invite codes are found by name from the family record rather than by searching:
 * the codes index is not readable as a whole (by design — it would list every
 * account's codes), but every code this account owns is written inside its own record.
 *
 * What this CANNOT do, and the UI says so: an employee who already signed up has
 * their own Firebase identity. Only that person, or a server holding admin
 * credentials, can delete it — a manager's session cannot reach another account.
 * Those logins are left behind with nothing to sign in to.
 */
export async function deleteOwnAccount(password: string): Promise<void> {
  const user = auth.currentUser;
  if (!user?.email) throw new Error("not-signed-in");

  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));

  const uid = user.uid;
  const family = await fetchFamily(uid);
  if (family) {
    const codes = Object.values(family.children)
      .map((c) => c.inviteCode)
      .filter(Boolean);
    // One failed code must not abort the rest; a leftover code points at a record that
    // no longer exists and simply resolves to nothing.
    await Promise.all(codes.map((code) => remove(ref(db, `inviteCodes/${code}`)).catch(() => {})));
    if (family.parentInviteCode) {
      await remove(ref(db, `parentInviteCodes/${family.parentInviteCode}`)).catch(() => {});
    }
    await remove(ref(db, `families/${uid}`));
  }

  await deleteUser(user);
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
  let cred;
  let createdNow = true;
  try {
    cred = await createUserWithEmailAndPassword(auth, email, password);
  } catch (err) {
    // The name being taken is usually the SAME person coming back: an earlier attempt
    // created their login and then failed to link it to the team (an invite code that
    // was never published, a refused write), leaving an account that exists and can't
    // get in anywhere. Signing them in and completing the link is the repair — it
    // needs their password, so it can only be them.
    if ((err as { code?: string })?.code === "auth/email-already-in-use") {
      cred = await signInWithEmailAndPassword(auth, email, password);
      createdNow = false;
    } else {
      throw err;
    }
  }
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
      // The rules allow writing this link once and never again, so a repeat attempt by
      // an already-linked account must not try to rewrite it.
      const existing = await get(ref(db, `childLogins/${cred.user.uid}`));
      if (!existing.exists()) await set(ref(db, `childLogins/${cred.user.uid}`), link);
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
  // Rolling the account back is only right when this call is what created it. Deleting
  // an account that already existed would destroy the person's login over a failure
  // that has nothing to do with them.
  if (createdNow) await cred.user.delete().catch(() => {});
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
      sendEmailVerification(cred.user).catch(() => {});
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
