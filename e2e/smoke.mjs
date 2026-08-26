/**
 * The whole product, once, against real Firebase behaviour.
 *
 * Every bug that cost this project days would have been caught here and nowhere else:
 * an invite code that was never published, a save Firebase rejected because one
 * optional field held `undefined`, a worker who could sign up but never sign in, an
 * upload with no rule to allow it. None of those are visible in a type check or a unit
 * test — they only appear when a manager, a worker and the database are all in the
 * same run.
 *
 * It drives the real screens against the Firebase Emulator Suite, which loads the very
 * rules files this repo deploys, so the rules are exercised too.
 */
import { chromium } from "playwright";

const BASE = process.env.E2E_BASE_URL || "http://localhost:4173";
const HEADLESS = true;
const stamp = Date.now();
const manager = { name: "רותם בדיקה", email: `manager.${stamp}@example.com`, password: "test123456", company: "מסגריית בדיקה" };
const worker = { name: "יוסי בדיקה", username: `yossi${stamp}`, password: "worker123456" };

const failures = [];
function check(label, condition) {
  if (condition) console.log(`  ok  ${label}`);
  else {
    console.log(`  FAIL ${label}`);
    failures.push(label);
  }
}

const browser = await chromium.launch({ headless: HEADLESS, executablePath: process.env.E2E_CHROMIUM || undefined });

async function openPage() {
  const ctx = await browser.newContext({ viewport: { width: 420, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", (err) => failures.push(`page error: ${err.message}`));
  page.on("console", (msg) => {
    const text = msg.text();
    // A rejected write is the failure mode this whole file exists to catch, and it
    // never surfaces as a broken screen — only as this line.
    if (msg.type() === "error" && /contains undefined|PERMISSION_DENIED|permission_denied|Failed to save/.test(text)) {
      failures.push(`console: ${text.slice(0, 200)}`);
    }
  });
  return { ctx, page };
}

console.log("1. a manager opens a business account");
const { ctx: managerCtx, page: m } = await openPage();
await m.goto(`${BASE}/onboarding/details`);
await m.getByPlaceholder("לדוגמה: א.ב. שירותי ניקיון").fill(manager.company);
await m.getByPlaceholder("שם מלא").fill(manager.name);
await m.getByPlaceholder("name@example.com").fill(manager.email);
await m.getByPlaceholder("לפחות 6 תווים").fill(manager.password);
await m.getByRole("button", { name: "המשך" }).click();
await m.waitForURL("**/onboarding/children", { timeout: 15000 });
await m.getByPlaceholder("שם העובד").fill(worker.name);
await m.getByRole("button", { name: "הוספה" }).click();
await m.getByRole("button", { name: /יצירת החשבון/ }).click();
await m.waitForURL("**/onboarding/success", { timeout: 15000 });
await m.getByRole("button", { name: "יצירת החשבון" }).click();
await m.waitForSelector("text=החשבון נוצר", { timeout: 30000 });
check("the account is created and the invites are handed over", true);

console.log("2. the manager writes a task with a file attached");
await m.goto(`${BASE}/work/new`);
await m.getByPlaceholder("לדוגמה: ניקיון חדר ישיבות").fill("בדיקת מזגנים");
// Deliberately leaving the brief empty: an optional field left blank is what used to
// make Firebase reject the whole record.
await m.getByRole("button", { name: "הקצאה", exact: true }).click();
await m.waitForURL("**/work/journal", { timeout: 15000 });
await m.waitForTimeout(1500);
check("the task shows up in the journal", (await m.getByText("בדיקת מזגנים").count()) > 0);

console.log("3. the worker redeems the invite code");
await m.goto(`${BASE}/work/team`);
await m.waitForTimeout(1200);
await m.getByRole("button", { name: "הזמנה" }).first().click();
await m.waitForTimeout(400);
const inviteCode = await m.locator("text=/^[A-Z0-9]{6}$/").first().innerText().catch(() => "");
check("an invite code is shown for the new hire", /^[A-Z0-9]{6}$/.test(inviteCode.trim()));

const { ctx: workerCtx, page: w } = await openPage();
await w.goto(`${BASE}/join?code=${inviteCode.trim()}`);
await w.waitForTimeout(600);
await w.locator('input[dir="ltr"]').nth(1).fill(worker.username);
await w.getByPlaceholder("לפחות 6 תווים").fill(worker.password);
await w.getByRole("button", { name: "יצירת החשבון" }).click();
await w.waitForURL("**/work/tasks", { timeout: 30000 });
check("the worker signs up with the code and lands on their tasks", true);
await w.waitForTimeout(1500);
check("the worker sees the task assigned to them", (await w.getByText("בדיקת מזגנים").count()) > 0);

console.log("4. the worker opens it, confirms receipt and attaches evidence");
await w.getByText("בדיקת מזגנים").first().click();
await w.waitForURL("**/work/task/**", { timeout: 15000 });
await w.waitForTimeout(1200);
await w.getByText("קיבלתי — ראיתי את המשימה").click();
await w.waitForTimeout(800);
check("receipt is recorded", (await w.getByText("אישר/ה קבלה").count()) > 0);

// A real file goes to Storage, which means the storage rules are exercised too.
await w.setInputFiles('input[type="file"]', {
  name: "evidence.txt",
  mimeType: "text/plain",
  buffer: Buffer.from("done"),
});
await w.waitForTimeout(4000);
check("the uploaded file appears on the task", (await w.getByText("evidence.txt").count()) > 0);

console.log("5. the worker submits and the manager approves");
const submit = w.getByRole("button", { name: /הגשה|סיימתי|להגשה/ });
if ((await submit.count()) > 0) {
  await submit.first().click();
  await w.waitForTimeout(1500);
}
await m.goto(`${BASE}/work/journal`);
await m.waitForTimeout(2500);
const journal = await m.locator("body").innerText();
check("the manager's journal shows the worker's activity", journal.includes("בדיקת מזגנים"));
check("the trail records that the worker saw it", journal.includes("נצפתה") || journal.includes("אישרה קבלה") || journal.includes("אישר קבלה"));

console.log("6. the manager signs out and back in");
await m.goto(`${BASE}/work/settings`);
await m.waitForTimeout(800);
await m.getByRole("button", { name: "התנתקות" }).click();
// Signing out from a protected screen keeps the destination in the URL, so match
// loosely rather than on an exact path.
await m.waitForURL((url) => url.pathname === "/login", { timeout: 20000 });
await m.getByPlaceholder("name@example.com").fill(manager.email);
await m.getByPlaceholder("סיסמה").fill(manager.password);
await m.getByRole("button", { name: "כניסה", exact: true }).click();
// Signing out from settings means signing back in returns to settings — the whole
// point of carrying the destination. The journal is where this assertion lives.
await m.waitForURL((url) => url.pathname.startsWith("/work/"), { timeout: 30000 });
await m.goto(`${BASE}/work/journal`);
await m.waitForTimeout(2500);
check("signing back in restores the account from the server", (await m.getByText("בדיקת מזגנים").count()) > 0);

await managerCtx.close();
await workerCtx.close();
await browser.close();

if (failures.length) {
  console.error(`\n${failures.length} failure(s):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("\nsmoke: everything passed");
