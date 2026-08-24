import { MODE } from "./vocabulary";

/**
 * Where a signed-in person belongs, by side of the account.
 *
 * One definition, used by the router's root redirect and by every screen that finishes
 * a sign-in or a sign-up. Without it each of those screens hardcodes "/parent" or
 * "/child" — routes the business build doesn't register — and the most important
 * moment in the product survives only by bouncing through the catch-all redirect.
 */
export function homePath(side: "parent" | "child"): string {
  if (MODE === "work") return side === "parent" ? "/work/journal" : "/work/tasks";
  return side === "parent" ? "/parent" : "/child";
}

/**
 * Where someone who is not signed in belongs.
 *
 * The family build opens on a splash that pitches the product, because it is sold to
 * a household that has never seen it. The business build opens on the sign-in form:
 * almost every visit is a manager or a worker coming back to their own account, and
 * making them tap past a poster first is a tax on the common case.
 */
export function entryPath(): string {
  return MODE === "work" ? "/login" : "/onboarding/splash";
}

/**
 * The link a manager sends someone so they can create their own account.
 *
 * This app runs on BrowserRouter, so the router reads the PATH. The old links were
 * built as `origin/#/child-register?code=…` — a hash the router never looks at — so
 * whoever clicked one landed on the splash screen with the code silently dropped, and
 * the invite simply did not work. Both invite links are built here now, once.
 */
function appBase(): string {
  // BASE_URL is where the app is MOUNTED (Vite's `base`), always "/"-terminated.
  // window.location.pathname is the current ROUTE — building on that produced links
  // like "/work/team/join?code=…", a path that does not exist, because whoever opened
  // the invite screen happened to be standing on the team screen at the time.
  const base = import.meta.env.BASE_URL || "/";
  return `${window.location.origin}${base.endsWith("/") ? base.slice(0, -1) : base}`;
}

/** Invite for someone who will do the work (a worker / a child). */
export function workerInviteLink(code: string): string {
  return `${appBase()}/join?code=${encodeURIComponent(code)}`;
}

/** Invite for a second person with full admin rights on the same account. */
export function adminInviteLink(code: string): string {
  return `${appBase()}/parent-register?code=${encodeURIComponent(code)}`;
}
