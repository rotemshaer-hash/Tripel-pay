import { chromium } from "playwright";
import { mkdirSync } from "fs";

const shots = "/tmp/claude-0/-home-user-Telegram-rs/4f8aa2eb-e0e2-5755-84ac-b0e801e09c28/scratchpad/reveal-trade-shots";
mkdirSync(shots, { recursive: true });

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage({ viewport: { width: 430, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
});

async function shot(name) {
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${shots}/${name}.png` });
}

// ---- Register a fresh family with 2 real children (default: ילד/ה 1, ילד/ה 2) ----
await page.goto("http://localhost:5173/");
await page.waitForURL("**/onboarding/splash", { timeout: 5000 });
await page.getByText("הצטרפות עכשיו").click();
await page.waitForURL("**/onboarding/welcome");
await page.getByText("המשך").click();
await page.getByText("המשך").click();
await page.getByText("בואו נתחיל").click();
await page.waitForURL("**/onboarding/details");
const email = `dana.reveal.${Date.now()}@example.com`;
await page.getByPlaceholder("פלוני אלמוני").fill("דנה בדיקה");
await page.getByPlaceholder("name@example.com").fill(email);
await page.getByPlaceholder("לפחות 6 תווים").fill("qapassword1");
await page.getByText("הבא").click();
await page.waitForURL("**/onboarding/children");
await page.getByRole("button", { name: "שליחה" }).click();
await page.waitForURL("**/onboarding/success", { timeout: 5000 });
await page.getByRole("button", { name: "סיימתי" }).click();
await page.waitForURL("**/parent", { timeout: 15000 });

// assign a task to the first (active) child, all via in-app navigation from here on —
// a full page.goto/reload mid-flow can race and cut off the async Firebase persistence
// write, which is exactly what corrupted the first version of this script.
await page.locator('button:has-text("הקצאה ל")').first().click();
await page.waitForTimeout(400);

// switch to child preview and advance the task through to pending_approval
await page.getByText("🧒 ילד").click();
await page.waitForURL("**/child", { timeout: 5000 });
await page.getByText("התחלה").first().click();
await page.waitForTimeout(300);
await page.getByText("סיימתי").first().click();
await page.waitForTimeout(500);
await shot("00-task-pending-approval");

// switch back to parent, approve it
await page.getByText("📱 הורה").click();
await page.waitForTimeout(300);
await page.getByRole("link", { name: "מטלות" }).click();
await page.waitForURL("**/parent/child-tasks", { timeout: 3000 });
await page.locator('button:has-text("אישור")').first().click();
await page.waitForTimeout(600);
console.log("1) task approved by parent");

// switch to child preview -> should show the reveal card immediately
await page.getByText("🧒 ילד").click();
await page.waitForURL("**/child", { timeout: 5000 });
await shot("01-reveal-card-covered");
console.log("2) reveal card shown:", (await page.locator("text=הקישו לחשיפת התגמול").count()) > 0);

await page.getByText("הקישו לחשיפת התגמול").click();
await shot("02-reveal-card-revealed");
console.log("3) reward amount revealed:", (await page.locator("text=נוסף ליתרה שלך").count()) > 0);

await page.getByText("מגניב! 🎉").click();
await page.waitForTimeout(500);
console.log("4) reveal card dismissed:", (await page.locator("text=הקישו לחשיפת התגמול").count()) === 0);

// reload and confirm it does NOT show again (rewardRevealed persisted) — safe here since
// we've waited well past the persistence effect after the last dispatch.
await page.reload();
await page.waitForTimeout(800);
console.log("5) reveal card does not reappear after reload:", (await page.locator("text=הקישו לחשיפת התגמול").count()) === 0);

// ---- Sibling task trade: assign a fresh (still-available) task first, since the
// only task on this child so far was already pushed through to "completed" above ----
await page.getByText("📱 הורה").click();
await page.waitForURL("**/parent", { timeout: 3000 });
await page.waitForTimeout(300);
await page.locator('button:has-text("הקצאה ל")').first().click();
await page.waitForTimeout(400);
await page.getByText("🧒 ילד").click();
await page.waitForURL("**/child", { timeout: 5000 });

await page.getByText("כל המטלות ‹").click();
await page.waitForURL("**/child/tasks", { timeout: 3000 });
await shot("03-child-all-tasks");
const offerBtn = page.getByText("🔁 להציע לאח/ות").first();
console.log("6) trade-offer button visible on a task:", (await offerBtn.count()) > 0);
await offerBtn.click();
await page.waitForTimeout(200);
await shot("04-trade-picker");
await page.locator("text=להציע ל:").locator("..").locator("button").first().click();
await page.waitForTimeout(500);
await shot("05-trade-offered");
console.log("7) offer recorded on the task:", (await page.locator("text=✓ הוצע ל").count()) > 0);

// parent approves the trade
await page.getByText("📱 הורה").click();
await page.waitForURL("**/parent", { timeout: 3000 });
await page.waitForTimeout(400);
await shot("06-parent-trade-offer-visible");
console.log("8) parent sees the trade offer:", (await page.locator("text=הצעות החלפת מטלות").count()) > 0);
await page.locator('button:has-text("אישור")').last().click();
await page.waitForTimeout(600);
console.log("9) trade offer no longer listed after approval:", (await page.locator("text=הצעות החלפת מטלות").count()) === 0);

// confirm the task actually moved to the sibling
await page.getByText("🧒 ילד").click();
await page.waitForURL("**/child", { timeout: 5000 });
await page.getByLabel("הילד/ה הבא/ה").click();
await page.waitForTimeout(300);
await page.getByText("כל המטלות ‹").click();
await page.waitForURL("**/child/tasks", { timeout: 3000 });
await shot("07-sibling-received-task");
console.log("10) sibling now has the traded task:", (await page.locator("text=כל הכבוד! סיימת").count()) === 0);

console.log("=== console/page errors ===", errors);
await browser.close();
