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
await m.waitForTimeout(400);
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
await m.waitForTimeout(1500);
check("assigning offers the send on the same screen", (await m.getByText(`שליחה ל${worker.name}`, { exact: false }).count()) > 0);
check("and a way to reach a work group, which wa.me cannot address", (await m.getByText("לקבוצת עבודה", { exact: false }).count() + await m.getByText("להעתקת ההודעה לקבוצה", { exact: false }).count() + await m.getByText("העתקת ההודעה לקבוצה", { exact: false }).count()) > 0);
await m.goto(`${BASE}/work/journal`);
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
await w.setInputFiles('input[type="file"]:not([accept])', {
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
check("the manager's journal shows the worker's activity", (await m.locator("body").innerText()).includes("בדיקת מזגנים"));
// The trail lives inside the job now rather than loose in a stream, so reading it
// means opening the job — which is the arrangement, not an obstacle to it.
await m.getByText("בדיקת מזגנים").first().click();
await m.waitForTimeout(800);
const journal = await m.locator("body").innerText();
check("the trail records that the worker saw it", journal.includes("נצפתה") || journal.includes("אישרה קבלה") || journal.includes("אישר קבלה"));

console.log("6. a worker with no account reports from the WhatsApp link");
await m.goto(`${BASE}/work/journal`);
await m.waitForTimeout(1200);
await m.getByText("בדיקת מזגנים").first().click();
await m.waitForTimeout(600);
await m.getByText("פתיחת המשימה ›").first().click();
await m.waitForURL("**/work/task/**", { timeout: 15000 });
await m.waitForTimeout(1200);
const waHref = await m.locator('a[href^="https://wa.me/"]').first().getAttribute("href");
const shareLink = decodeURIComponent(waHref).match(/https?:\/\/[^\s]+\/w\/[a-f0-9]+/)?.[0] ?? "";
check("the sent message carries a no-account task link", shareLink.length > 0);

// A third browser context with no session at all — the person on site.
const { ctx: linkCtx, page: l } = await openPage();
await l.goto(shareLink.replace(/^https?:\/\/[^/]+/, BASE));
await l.waitForTimeout(2500);
check("the link opens the task without signing in", (await l.getByText("בדיקת מזגנים").count()) > 0);
await l.getByText("✅ קיבלתי").click();
await l.waitForTimeout(1500);
await l.getByPlaceholder("הערה למנהל…").fill("הוחלפו שני מסננים");
await l.getByRole("button", { name: "שליחה" }).click();
await l.waitForTimeout(1500);
await l.getByText("🏁 סיימתי").click();
await l.waitForTimeout(2000);
check("the worker sees their reports were sent", (await l.getByText("נשלח למנהל").count()) > 0);

await m.reload();
await m.waitForTimeout(4000);
const taskText = await m.locator("body").innerText();
check("the manager's task shows the receipt from the link", taskText.includes("אישר") || taskText.includes("אישרה"));
check("the note from the link landed as evidence", taskText.includes("הוחלפו שני מסננים"));
await m.goto(`${BASE}/work/journal`);
await m.waitForTimeout(2500);
check("the journal records it as normal activity", (await m.locator("body").innerText()).includes("בדיקת מזגנים"));
await linkCtx.close();

console.log("7. the whole day on one link, for a worker with no account");
// A job already submitted has nothing left to report, and the page says so by hiding
// the buttons — so this step needs work that is actually still open.
await m.goto(`${BASE}/work/new`);
await m.waitForTimeout(1200);
await m.getByPlaceholder("לדוגמה: ניקיון חדר ישיבות").fill("ניקיון מחסן");
await m.getByRole("button", { name: "הקצאה", exact: true }).click();
await m.waitForTimeout(1800);
await m.goto(`${BASE}/work/board`);
await m.waitForTimeout(2500);
check("the board lists the work", (await m.getByText("בדיקת מזגנים").count()) > 0);
await m.goto(`${BASE}/work/team`);
await m.waitForTimeout(2000);
const dayHref = await m.locator('a[href^="https://wa.me/"]').first().getAttribute("href");
const dayLink = decodeURIComponent(dayHref).match(/https?:\/\/[^\s]+\/d\/[a-f0-9]+/)?.[0] ?? "";
check("the day message carries the worker's personal link", dayLink.length > 0);

const { ctx: dayCtx, page: d } = await openPage();
await d.goto(dayLink.replace(/^https?:\/\/[^/]+/, BASE));
await d.waitForTimeout(2500);
check("the daily link opens without signing in", (await d.getByText("ניקיון מחסן").count()) > 0);
if ((await d.getByPlaceholder("הערה למנהל…").count()) === 0) {
  await d.getByText("ניקיון מחסן").first().click();
  await d.waitForTimeout(600);
}

// One job, two moves: got it, then finished. There is deliberately nothing in
// between — a "started" status the business never acted on was one more thing to
// remember while holding a ladder.
await d.getByText("✅ קיבלתי").click();
await d.waitForTimeout(1500);
check("there is no third status to remember", (await d.getByText("התחלתי לעבוד").count()) === 0);

// The evidence gate: a job with nothing attached cannot be closed.
check("finishing is refused while there is no evidence", (await d.getByText("לפני סגירה צריך לצרף").count()) > 0);
await d.getByPlaceholder("הערה למנהל…").fill("הגעתי לאתר, הכל תקין");
await d.getByRole("button", { name: "שליחה" }).click();
await d.waitForTimeout(2000);
check("a report from the daily link is accepted", (await d.getByText("צורפו").count()) > 0);

// The link page could take a fresh camera photo and nothing else, so a delivery note
// already sitting on the phone, or a PDF from the supplier, had no way onto the job.
// The unfiltered input is the "file" source: it must reach Storage under the worker's
// anonymous uid and come back as evidence.
await d.setInputFiles('input[type="file"]:not([accept])', {
  name: "teudat-mishloach.txt",
  mimeType: "text/plain",
  buffer: Buffer.from("delivery note"),
});
await d.waitForTimeout(4000);
check("a worker with no account can send a real file, not only a photo", (await d.getByText("צורפו 2").count()) > 0);

// A photo is the evidence the customer actually looks at, and every one used to arrive
// called "צילום מהשטח" — a pack of identical captions the customer cannot read. The
// worker names it before it goes.
const onePixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);
await d.setInputFiles('input[accept="image/*"]:not([capture])', {
  name: "after.png",
  mimeType: "image/png",
  buffer: onePixelPng,
});
await d.waitForTimeout(1500);
check("a photo waits to be named instead of going straight out", (await d.getByPlaceholder("מה רואים בתמונה? (למשל: הצנרת אחרי התיקון)").count()) > 0);
await d.getByPlaceholder("מה רואים בתמונה? (למשל: הצנרת אחרי התיקון)").fill("המדף העליון אחרי הניקוי");
await d.getByRole("button", { name: "שליחת התמונה" }).click();
await d.waitForTimeout(3000);
check("the named photo is sent", (await d.getByText("צורפו 3").count()) > 0);
check("and then finishing is allowed", (await d.getByText("לפני סגירה צריך לצרף").count()) === 0);
await d.getByText("🏁 סיימתי").click();
await d.waitForTimeout(2000);
check("the day shows its own progress", (await d.getByText("מתוך").count()) > 0);

await dayCtx.close();

await m.goto(`${BASE}/work/journal`);
await m.waitForTimeout(4000);
check("it reaches the manager's journal", (await m.locator("body").innerText()).includes("ניקיון מחסן"));

// The journal lists jobs, not a stream of everybody's events interleaved by clock.
// A job's own history stays folded away until it is asked for — that fold is the
// whole point of the screen, so it is asserted in both positions.
check("a job's history stays folded until asked for", !(await m.locator("body").innerText()).includes("אושרה קבלה"));
await m.getByText("ניקיון מחסן").first().click();
await m.waitForTimeout(800);
check("opening the job shows its own history", (await m.locator("body").innerText()).includes("אושרה קבלה"));

console.log("8. the manager changes the job after sending it");
await m.goto(`${BASE}/work/journal`);
await m.waitForTimeout(1500);
await m.getByText("ניקיון מחסן").first().click();
await m.waitForTimeout(600);
await m.getByText("פתיחת המשימה ›").first().click();
await m.waitForURL("**/work/task/**", { timeout: 15000 });
await m.waitForTimeout(1500);
// The name the worker typed has to survive all the way to the manager's record, or it
// was never worth asking for: this is what the customer's pack is built from.
check("the worker's own words on the photo reach the manager", (await m.locator("body").innerText()).includes("המדף העליון אחרי הניקוי"));
await m.waitForTimeout(1500);
await m.getByText("עריכה", { exact: true }).click();
await m.waitForTimeout(600);
await m.getByPlaceholder("פירוט").fill("לרוקן את המדף העליון ולצלם אחרי");
await m.getByRole("button", { name: "שמירת השינויים" }).click();
await m.waitForTimeout(1500);
check("the manager is offered to tell the worker what changed", (await m.getByText("שליחת עדכון בוואטסאפ").count()) > 0);
await m.getByText("לא צריך").click();
await m.getByPlaceholder("הערה — תופיע לעובד בקישור שלו…").fill("תתחיל מהמדף העליון");
await m.getByRole("button", { name: "שליחה" }).first().click();
await m.waitForTimeout(2500);

const { ctx: reopenCtx, page: r } = await openPage();
await r.goto(dayLink.replace(/^https?:\/\/[^/]+/, BASE));
await r.waitForTimeout(3000);
// A finished job is collapsed, so the correction has to be readable on the card
// itself. Asserting the manager's actual words, not a label above them: the words are
// what the worker has to act on, and a heading can be present while the message it
// introduces is cut to nothing.
check("a new message from the manager is visible without opening the job", (await r.getByText("תתחיל מהמדף העליון", { exact: false }).count()) > 0);
await r.getByText("ניקיון מחסן").first().click();
await r.waitForTimeout(800);
const reopened = await r.locator("body").innerText();
check("the worker's link shows the edited brief", reopened.includes("לרוקן את המדף העליון"));
check("and shows what the manager wrote", reopened.includes("תתחיל מהמדף העליון"));
await reopenCtx.close();

console.log("9. the manager signs out and back in");
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

console.log("10. one work report, holding both halves of the job");
// The whole reason there is one document now: what was asked and what came back have
// to sit on the same page. Three separate outputs each held one half.
await m.goto(`${BASE}/work/report?range=month&worker=all`);
await m.waitForTimeout(3000);
const report = await m.locator("body").innerText();
check("the report states what was asked", report.includes("מה התבקש"));
check("and what was done", report.includes("מה בוצע"));
check("the brief the manager wrote is in it", report.includes("לרוקן את המדף העליון"));
check("so is the worker's evidence, in their words", report.includes("המדף העליון אחרי הניקוי"));

// A period is a blunt way to choose what a customer's document covers, so the jobs in
// it are ticked individually. Unticking one has to actually remove it from the sheet —
// a picker that changes a count and nothing else is worse than no picker.
check("every job in the period starts in the document", (await m.getByText("מה ייכנס לדוח · 2 מתוך 2").count()) > 0);
await m.locator(".report-picker-row", { hasText: "ניקיון מחסן" }).locator("input").uncheck();
await m.waitForTimeout(600);
const trimmed = await m.locator(".report-sheet").innerText();
check("unticking a job takes it out of the document", !trimmed.includes("ניקיון מחסן"));
check("and leaves the others in", trimmed.includes("בדיקת מזגנים"));

// The same ticks answer "get these out of my app". A delete offered here has to be a
// real one — gone from the record, and still gone after the server is read again.
m.on("dialog", (d) => d.accept());
await m.getByText(/מחיקת 1 העבודות המסומנות לצמיתות/).click();
await m.waitForTimeout(3000);
await m.goto(`${BASE}/work/journal?range=month`);
await m.waitForTimeout(2500);
check("deleting the ticked jobs removes them for good", !(await m.locator("body").innerText()).includes("בדיקת מזגנים"));
await m.reload();
await m.waitForTimeout(4500);
check("and they stay gone once the record is re-read", !(await m.locator("body").innerText()).includes("בדיקת מזגנים"));

await managerCtx.close();
await workerCtx.close();
await browser.close();

if (failures.length) {
  console.error(`\n${failures.length} failure(s):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("\nsmoke: everything passed");
