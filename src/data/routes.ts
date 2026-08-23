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
