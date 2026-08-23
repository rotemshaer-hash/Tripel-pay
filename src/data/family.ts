import type { Child, Family } from "./types";

export function childrenList(family: Family): Child[] {
  return family.childOrder.map((id) => family.children[id]).filter((c): c is Child => !!c);
}

// "Total earned" is derived from the transaction log itself, never stored separately —
// a task reward, an allowance top-up from a parent, or any other positive transaction
// all count. A separately-incremented counter would only track one income source and
// silently drift out of sync with the real balance history, which is exactly the bug
// this replaced.
export function totalEarned(c: Child): number {
  return c.transactions.filter((tx) => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0);
}

// Firebase Realtime Database has no way to represent an "empty array" distinct from
// "this key doesn't exist" — writing `[]` to a field, then reading it back, comes back
// with that key simply missing. Any array/object field that can legitimately become
// empty (e.g. after a data reset) needs to be backfilled here, in the one place all
// Firebase-sourced family data passes through, rather than defensively everywhere it's read.
function normalizeChild(c: Child): Child {
  return {
    ...c,
    // Task-level arrays need the same backfill as the child-level ones — an empty
    // audit trail or attachment list comes back from Firebase as a missing key.
    tasks: (c.tasks ?? []).map((t) => ({
      ...t,
      activity: t.activity ?? [],
      comments: t.comments ?? [],
      proofs: t.proofs ?? [],
      briefAttachments: t.briefAttachments ?? [],
      checklist: t.checklist ?? [],
    })),
    transactions: c.transactions ?? [],
    savingsGoals: c.savingsGoals ?? [],
    savingsHistory: c.savingsHistory ?? [],
    readArticles: c.readArticles ?? [],
    strengths: c.strengths ?? [],
    redeemedGifts: c.redeemedGifts ?? [],
    extraCards: c.extraCards ?? [],
    settings: {
      ...c.settings,
      authorizedPeople: c.settings?.authorizedPeople ?? [],
    },
  };
}

export function normalizeFamily(family: Family): Family {
  const children = Object.fromEntries(Object.entries(family.children ?? {}).map(([id, c]) => [id, normalizeChild(c)]));
  return {
    ...family,
    children,
    childOrder: family.childOrder ?? [],
    taskBank: family.taskBank ?? [],
    giftBank: family.giftBank ?? [],
    houseRules: family.houseRules ?? [],
  };
}

export function genInviteCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid confusion
  let code = "";
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

export function slugifyId(name: string, fallback: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return base || fallback;
}
