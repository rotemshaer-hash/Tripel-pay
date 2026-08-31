import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, signInAnonymously, signOut } from "firebase/auth";
import { getDatabase, ref as dbRef, get } from "firebase/database";
import { ref as storageRef, uploadBytes, deleteObject } from "firebase/storage";
import { firebaseConfig, auth, storage } from "./config";

/**
 * Does the thing a worker's phone does, from the manager's phone, and reports exactly
 * which switch is off.
 *
 * Three settings live in the Firebase console rather than in this repository, and any
 * one of them being off produces the same useless symptom: the worker taps their link
 * and is told to check their connection. Guessing which one it is has already cost
 * days, so the app tests them instead.
 *
 * The anonymous half runs on a SECOND Firebase app instance on purpose: signing in
 * anonymously on the main one would sign the manager out of their own account, which
 * is a spectacular way to make a diagnostic worse than the fault.
 */
export interface CheckResult {
  id: "anonymous" | "database" | "storage";
  title: string;
  ok: boolean;
  detail: string;
  fix?: string;
}

export async function runReadinessChecks(sampleToken: string | null): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const probe = initializeApp(firebaseConfig, `diagnostics-${Date.now()}`);
  const probeAuth = getAuth(probe);
  const probeDb = getDatabase(probe);

  let anonymousOk = false;
  try {
    await signInAnonymously(probeAuth);
    anonymousOk = true;
    results.push({ id: "anonymous", title: "כניסה אנונימית", ok: true, detail: "פעילה — דף העובד יכול להיפתח בלי חשבון." });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "";
    // Two different switches produce two different codes, and pointing at the wrong
    // one costs an evening. `operation-not-allowed` is the Anonymous provider itself;
    // `admin-restricted-operation` is the project-wide sign-up block — anonymous
    // sign-in creates a user, so blocking sign-up blocks it too, even with the
    // Anonymous provider on.
    const signUpBlocked = code === "auth/admin-restricted-operation";
    results.push({
      id: "anonymous",
      title: "כניסה אנונימית",
      ok: false,
      detail: signUpBlocked
        ? "Anonymous מופעל, אבל יצירת משתמשים חדשים חסומה בפרויקט — וכניסה אנונימית היא יצירת משתמש."
        : code === "auth/operation-not-allowed"
          ? "כבויה בפרויקט Firebase."
          : `נכשלה (${code || "שגיאה לא ידועה"}).`,
      fix: signUpBlocked
        ? 'Firebase Console ← Authentication ← Settings ← User actions ← לסמן "Enable create (sign-up)"'
        : "Firebase Console ← Authentication ← Sign-in method ← Anonymous ← Enable",
    });
  }

  if (anonymousOk) {
    try {
      // Exactly the read a worker's link performs. A token that does not exist still
      // proves the permission: it comes back empty instead of refused.
      await get(dbRef(probeDb, `workerLinks/${sampleToken ?? "diagnostics-probe"}`));
      results.push({ id: "database", title: "קריאת קישורי עובדים", ok: true, detail: "מותרת — חוקי מסד הנתונים מעודכנים." });
    } catch (err) {
      const message = (err as { message?: string })?.message ?? "";
      results.push({
        id: "database",
        title: "קריאת קישורי עובדים",
        ok: false,
        detail: /permission/i.test(message) ? "השרת דחה את הקריאה — החוקים בקונסולה ישנים." : "נכשלה. ייתכן שאין חיבור לרשת.",
        fix: "Firebase Console ← Realtime Database ← Rules ← להדביק את database.rules.json מהריפו",
      });
    }
  } else {
    results.push({
      id: "database",
      title: "קריאת קישורי עובדים",
      ok: false,
      detail: "לא נבדק — הכניסה האנונימית כבויה.",
      fix: "קודם להפעיל Anonymous, ואז להריץ שוב.",
    });
  }

  await signOut(probeAuth).catch(() => {});
  await deleteApp(probe).catch(() => {});

  // Storage is tested with the manager's own identity, because that is who uploads
  // files to a task's folder.
  const uid = auth.currentUser?.uid;
  if (!uid) {
    results.push({ id: "storage", title: "העלאת קבצים", ok: false, detail: "לא נבדק — אין חשבון מחובר.", fix: "יש להתחבר ולנסות שוב." });
    return results;
  }
  const path = `uploads/${uid}/diagnostics/${crypto.randomUUID()}.txt`;
  try {
    const object = storageRef(storage, path);
    await uploadBytes(object, new Blob(["ok"], { type: "text/plain" }));
    await deleteObject(object).catch(() => {});
    results.push({ id: "storage", title: "העלאת קבצים", ok: true, detail: "מותרת — צירוף קבצים למשימה עובד." });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "";
    results.push({
      id: "storage",
      title: "העלאת קבצים",
      ok: false,
      detail:
        code === "storage/unauthorized"
          ? "השרת דחה את ההעלאה — חוקי האחסון ישנים."
          : code === "storage/unknown" || code === "storage/object-not-found"
            ? "שירות האחסון לא זמין — ייתכן ש-Storage לא הופעל בפרויקט."
            : `נכשלה (${code || "שגיאה לא ידועה"}).`,
      fix: "Firebase Console ← Storage ← Rules ← להדביק את storage.rules מהריפו (ולוודא ש-Storage מופעל)",
    });
  }
  return results;
}
