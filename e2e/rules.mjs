/**
 * The rules themselves, exercised directly — not through the app.
 *
 * `e2e/smoke.mjs` proves the product works when everyone plays by the rules. It never
 * proves what happens when someone doesn't: every check in it is a legitimate user
 * doing a legitimate thing, so a `.read`/`.write` clause that is quietly too permissive
 * has no way to surface there. This file is the negative space — one company's worker
 * reaching for another company's data, a stranger writing into someone else's inbox —
 * run straight against the real `database.rules.json` and `storage.rules` via
 * `@firebase/rules-unit-testing`, which loads the actual rule text and lets a request
 * be asserted denied or allowed without a browser or the UI in between.
 *
 * Two of the assertions below are `assertSucceeds`, not `assertFails` — not bugs, the
 * two places this model is deliberately open, called out here on purpose rather than
 * left to be rediscovered by surprise. See the comments at those two.
 */
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { ref, get, set, remove } from "firebase/database";
import { ref as storageRef, uploadBytes, getBytes } from "firebase/storage";

const failures = [];
function check(label, condition) {
  if (condition) console.log(`  ok  ${label}`);
  else {
    console.log(`  FAIL ${label}`);
    failures.push(label);
  }
}

// Wrapped in try/catch, unlike smoke.mjs's crash-on-first-surprise style: a security
// suite that stops reporting after the first unexpected result hides exactly the
// information a real gap needs — which other checks still hold and which don't.
async function expectDenied(label, promise) {
  try {
    await assertFails(promise);
    check(label, true);
  } catch {
    check(label, false);
  }
}
async function expectAllowed(label, promise) {
  try {
    await assertSucceeds(promise);
    check(label, true);
  } catch {
    check(label, false);
  }
}

const testEnv = await initializeTestEnvironment({
  projectId: "triplepay-test",
  database: {
    rules: readFileSync("database.rules.json", "utf8"),
    host: "127.0.0.1",
    port: 9000,
  },
  storage: {
    rules: readFileSync("storage.rules", "utf8"),
    host: "127.0.0.1",
    port: 9199,
  },
});

// Two companies, seeded by bypassing the rules entirely — the point here is testing
// what the rules let OTHER people do to this data, not testing that seeding works.
const FAMILY_A = "familyA-uid";
const FAMILY_B = "familyB-uid";
const CHILD_A1 = "childA1-uid";
const TOKEN_A = "task-token-a";
const TOKEN_B = "task-token-b";
const DAY_TOKEN_A = "day-token-a";

await testEnv.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.database();
  await set(ref(db, `families/${FAMILY_A}`), { companyName: "Family A" });
  await set(ref(db, `families/${FAMILY_A}/children/${CHILD_A1}`), { name: "Worker A1" });
  await set(ref(db, `families/${FAMILY_B}`), { companyName: "Family B" });
  await set(ref(db, `childLogins/${CHILD_A1}`), { familyUid: FAMILY_A, childId: CHILD_A1 });
  await set(ref(db, `taskLinks/${TOKEN_A}`), { familyUid: FAMILY_A, taskId: "t1", childId: CHILD_A1 });
  await set(ref(db, `taskLinks/${TOKEN_B}`), { familyUid: FAMILY_B, taskId: "t2", childId: "childB1-uid" });
  await set(ref(db, `workerLinks/${DAY_TOKEN_A}`), { familyUid: FAMILY_A });
  await set(ref(db, `linkInbox/${FAMILY_A}/existing-entry`), { taskId: "t1", childId: CHILD_A1 });
  await set(ref(db, `inviteCodes/CODE-A`), { familyUid: FAMILY_A });
});

console.log("1. reading across companies");
{
  const worker = testEnv.authenticatedContext(CHILD_A1).database();
  const stranger = testEnv.authenticatedContext("stranger-uid").database();

  await expectDenied(
    "a worker logged into company A cannot read company B's record",
    get(ref(worker, `families/${FAMILY_B}`))
  );
  await expectDenied(
    "an unrelated authenticated user cannot read either company's record directly",
    get(ref(stranger, `families/${FAMILY_A}`))
  );
  // The task link's OWN read is intentionally open to any signed-in user — the token
  // string in the path is the credential, the same way a Firebase Storage download
  // URL is. Holding company A's token proves nothing about company B's token, but
  // the rules don't (and structurally can't cheaply) check "is this the token you
  // were actually handed" — they check "do you know the exact key". This is the
  // model documented in HANDOFF.md section 1.2/6: intentional, not a bug, and worth
  // stating here explicitly rather than leaving it to be found by surprise.
  await expectAllowed(
    "[by design] any signed-in user who knows company B's token string can read that snapshot",
    get(ref(stranger, `taskLinks/${TOKEN_B}`))
  );
  await expectDenied(
    "but that same stranger still cannot read company B's actual family record",
    get(ref(stranger, `families/${FAMILY_B}`))
  );
}

console.log("2. writing across companies and children");
{
  const workerA = testEnv.authenticatedContext(CHILD_A1).database();
  const stranger = testEnv.authenticatedContext("stranger-uid").database();

  await expectDenied(
    "a worker cannot write to another company's family record",
    set(ref(workerA, `families/${FAMILY_B}/companyName`), "hijacked")
  );
  await expectDenied(
    "a worker cannot write a different child's node, even inside their own company",
    set(ref(workerA, `families/${FAMILY_A}/children/some-other-child`), { name: "not me" })
  );
  await expectAllowed(
    "but a worker CAN write their own child node (positive control)",
    set(ref(workerA, `families/${FAMILY_A}/children/${CHILD_A1}/photoUrl`), null)
  );
  await expectDenied(
    "a stranger cannot create a taskLinks entry claiming another company's uid as familyUid",
    set(ref(stranger, "taskLinks/forged-token"), { familyUid: FAMILY_A, taskId: "x", childId: "y" })
  );
  const ownerB = testEnv.authenticatedContext(FAMILY_B).database();
  await expectAllowed(
    "but a company CAN create its own taskLinks entry (positive control)",
    set(ref(ownerB, "taskLinks/legit-token-b2"), { familyUid: FAMILY_B, taskId: "t3", childId: "c3" })
  );
  await expectDenied(
    "a stranger cannot create a workerLinks (day link) entry for another company",
    set(ref(stranger, "workerLinks/forged-day-token"), { familyUid: FAMILY_A })
  );
  await expectDenied(
    "a stranger cannot create an inviteCode claiming another company's uid",
    set(ref(stranger, "inviteCodes/CODE-FORGED"), { familyUid: FAMILY_A })
  );
}

console.log("3. linkInbox — where a report from an anonymous worker link lands");
{
  const stranger = testEnv.authenticatedContext("stranger-uid").database();
  const ownerA = testEnv.authenticatedContext(FAMILY_A).database();

  await expectDenied(
    "nobody but the company itself can overwrite an existing inbox entry",
    set(ref(stranger, `linkInbox/${FAMILY_A}/existing-entry`), { taskId: "t1", childId: CHILD_A1, note: "tampered" })
  );
  await expectAllowed(
    "the company itself can clear its own inbox entries (this is how the manager's session consumes them)",
    remove(ref(ownerA, `linkInbox/${FAMILY_A}/existing-entry`))
  );
  // FINDING, not a fix: creating a brand-new entry only checks that it doesn't exist
  // yet and carries a taskId/childId — it never checks that the writer holds a valid
  // token for THIS company. Anyone who has ever learned company A's uid (it rides
  // inside every taskLinks/workerLinks snapshot as a plain field) can drop a
  // fabricated report into company A's inbox for any taskId/childId they can guess
  // or have seen. The existing worker-report flow never needs this — a worker's
  // session only ever writes into the inbox of the company whose link they opened —
  // so nothing in the product currently depends on this gap, but it is real and
  // worth a deliberate decision, not a rewrite done in passing here.
  await expectAllowed(
    "[FINDING — not fixed here] a stranger CAN create a brand-new inbox entry for a company whose uid they know, without holding that company's token",
    set(ref(stranger, `linkInbox/${FAMILY_A}/forged-entry`), { taskId: "t1", childId: CHILD_A1 })
  );
}

console.log("4. Storage — every upload lives under its uploader's own uid");
{
  const uidX = "storage-uid-x";
  const uidY = "storage-uid-y";
  const bytes = new TextEncoder().encode("test file");

  const ctxX = testEnv.authenticatedContext(uidX);
  const ctxY = testEnv.authenticatedContext(uidY);
  const anon = testEnv.unauthenticatedContext();

  await expectAllowed(
    "a signed-in user can upload into their own folder (positive control)",
    uploadBytes(storageRef(ctxX.storage(), `uploads/${uidX}/note.txt`), bytes)
  );
  await expectDenied(
    "a signed-in user cannot upload into someone else's folder",
    uploadBytes(storageRef(ctxY.storage(), `uploads/${uidX}/hijack.txt`), bytes)
  );
  await expectDenied(
    "a signed-out request cannot upload anywhere",
    uploadBytes(storageRef(anon.storage(), `uploads/${uidX}/anon.txt`), bytes)
  );
  await expectDenied(
    "nobody can write outside the uploads/ tree at all",
    uploadBytes(storageRef(ctxX.storage(), "outside/note.txt"), bytes)
  );
  // Reading is intentionally open to any signed-in user — the same download-URL-as-
  // credential model as taskLinks above, and the reason a manager can view evidence
  // a worker uploaded under the worker's own anonymous uid. Documented, not a bug.
  await expectAllowed(
    "[by design] a signed-in user can read a file uploaded under someone else's uid",
    getBytes(storageRef(ctxY.storage(), `uploads/${uidX}/note.txt`))
  );
}

await testEnv.cleanup();

console.log(failures.length === 0 ? "\nrules: everything passed" : `\n${failures.length} failure(s):`);
for (const f of failures) console.log(`  - ${f}`);
process.exit(failures.length === 0 ? 0 : 1);
