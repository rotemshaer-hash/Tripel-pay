import { chromium } from "playwright";

const shots = "/tmp/claude-0/-home-user-Telegram-rs/4f8aa2eb-e0e2-5755-84ac-b0e801e09c28/scratchpad/qa";
import { mkdirSync } from "fs";
mkdirSync(shots, { recursive: true });

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage({ viewport: { width: 430, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (msg) => { if (msg.type() === "error") errors.push(`console: ${msg.text()}`); });

async function shot(name) {
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${shots}/${name}.png` });
}

// ---- Onboarding ----
await page.goto("http://localhost:5173/");
await page.waitForURL("**/onboarding/splash", { timeout: 3000 });
await page.getByText("הצטרפות עכשיו").click();

await page.waitForURL("**/onboarding/welcome");
await page.getByText("המשך").click();
await page.getByText("המשך").click();
await page.getByText("בואו נתחיל").click();

await page.waitForURL("**/onboarding/details");
const email = `dana.qa.${Date.now()}@example.com`;
await page.getByPlaceholder("פלוני אלמוני").fill("דנה QA");
await page.getByPlaceholder("name@example.com").fill(email);
await page.getByPlaceholder("לפחות 6 תווים").fill("qapassword1");
await page.getByText("הבא").click();

await page.waitForURL("**/onboarding/children");
await shot("01-children-details");
await page.getByRole("button", { name: "שליחה" }).click();

await page.waitForURL("**/onboarding/success", { timeout: 3000 });
await shot("02-success");
await page.getByRole("button", { name: "סיימתי" }).click();
await page.waitForURL("**/parent", { timeout: 15000 });
await shot("03-parent-home");

// ---- Parent: Home interactions ----
// assign a recommended task
const recBtn = page.locator('button:has-text("הקצאה ל")').first();
if (await recBtn.count()) {
  await recBtn.click();
  await shot("04-after-assign-toast");
}

// switch active child via family list
const otherChildRow = page.locator('button:has-text("נועה")').first();
if (await otherChildRow.count()) {
  await otherChildRow.click();
  await shot("05-switched-to-noa");
  // switch back to רותם
  await page.locator('button:has-text("רותם")').first().click();
}

// ---- Parent: Child Tasks ----
await page.locator('nav a[href$="/parent/child-tasks"]').click();
await page.waitForURL("**/parent/child-tasks");
await shot("06-child-tasks");
const approveBtn = page.getByText("אישור").first();
if (await approveBtn.count()) {
  await approveBtn.click();
  await shot("07-after-approve-toast");
}

// ---- Parent: Tasks Bank (reached via empty-state CTA or direct nav) ----
await page.goto("http://localhost:5173/#/parent/tasks-bank");
await shot("08-tasks-bank");
const assignFromBankBtn = page.getByText("הקצאה").first();
if (await assignFromBankBtn.count()) {
  await assignFromBankBtn.click();
  await shot("09-tasks-bank-after-assign");
}

// ---- Parent: Gift Bank ----
await page.locator('nav a[href$="/parent/gift-bank"]').click();
await page.waitForURL("**/parent/gift-bank");
await shot("10-gift-bank");
// try filter chip
const foodFilter = page.getByText("אוכל", { exact: true });
if (await foodFilter.count()) {
  await foodFilter.click();
  await shot("11-gift-bank-filtered");
  await page.getByText("הכל", { exact: true }).click();
}

// ---- Parent: Child Hub + Settings ----
await page.locator('nav a[href$="/parent/child-hub"]').click();
await page.waitForURL("**/parent/child-hub");
await shot("12-child-hub");

await page.getByText("כללי הבית שלנו").click();
await page.waitForURL("**/parent/house-rules");
await shot("13-house-rules");
await page.getByPlaceholder(/לדוגמה: אחרי הארוחה/).fill("בדיקת QA - חוק זמני");
await page.getByRole("button", { name: "הוספה" }).click();
await shot("14-house-rules-added");
// remove it again
const removeBtn = page.locator('button[aria-label="הסרת חוק"]').last();
if (await removeBtn.count()) await removeBtn.click();

await page.goBack();
await page.waitForURL("**/parent/child-hub");
await page.getByText("הגדרות").click();
await page.waitForURL("**/parent/settings");
await shot("15-settings");

// toggle freeze on, verify, toggle off
const freezeToggle = page.getByRole("switch").first();
await freezeToggle.click();
await shot("16-settings-frozen");
await freezeToggle.click();
await shot("17-settings-unfrozen");

// ---- verify freeze actually blocks gift redemption ----
await freezeToggle.click();
await page.locator('nav a[href$="/parent/gift-bank"]').click();
await page.waitForURL("**/parent/gift-bank");
await shot("18-gift-bank-while-frozen");

// unfreeze again for the rest of the run
await page.locator('nav a[href$="/parent/child-hub"]').click();
await page.getByText("הגדרות").click();
await page.waitForURL("**/parent/settings");
await page.getByRole("switch").first().click();

// ---- Parent: Savings ----
await page.goBack();
await page.waitForURL("**/parent/child-hub");
await page.getByText("חסכונות").click();
await page.waitForURL("**/parent/savings");
await shot("19-savings");
// add a new goal with a note
await page.getByPlaceholder(/שם המטרה/).fill("QA מטרה");
await page.getByPlaceholder(/סכום יעד/).fill("1000");
await page.getByPlaceholder(/מכתב לעתיד/).fill("בדיקת QA");
await page.getByRole("button", { name: "הוספה" }).click();
await shot("20-savings-goal-added");

// ---- Parent: Transactions ----
await page.goBack();
await page.waitForURL("**/parent/child-hub");
await page.getByText("תנועות").click();
await page.waitForURL("**/parent/transactions");
await shot("21-transactions");

// ---- Parent: Achievements ----
await page.goBack();
await page.waitForURL("**/parent/child-hub");
await page.getByText("הישגים").click();
await page.waitForURL("**/parent/achievements");
await shot("22-achievements");

// ---- Send money with dedication ----
const fab = page.locator('button[aria-label="שליחת כסף"]');
if (await fab.count()) {
  await fab.click();
  await shot("23-send-money-modal");
  await page.getByText("כי עזרת/ה השבוע 💪").click();
  await page.getByRole("button", { name: "שלח" }).click();
  await shot("24-after-send-money");
}

// ---- Sign out / sign in cycle ----
await page.locator('nav a[href$="/parent/child-hub"]').click();
await page.getByText("הגדרות").click();
await page.waitForURL("**/parent/settings");
await page.getByRole("button", { name: "התנתקות" }).click();
await page.waitForURL("**/onboarding/splash", { timeout: 5000 });
await shot("25-after-logout");

await page.goto("http://localhost:5173/#/login");
await page.waitForTimeout(300);
await page.getByPlaceholder("name@example.com").fill(email);
await page.getByPlaceholder("סיסמה").fill("qapassword1");
await page.getByRole("button", { name: "כניסה" }).click();
await page.waitForURL("**/parent", { timeout: 10000 });
await shot("26-relogin-success");

// ---- Child view: all screens ----
await page.getByText("🧒 ילד").click();
await page.waitForURL("**/child");
await shot("27-child-home");

await page.getByText("הכללים שלנו בבית").click();
await page.waitForURL("**/child/house-rules");
await shot("28-child-house-rules");

await page.goBack();
await page.waitForURL("**/child");
await page.locator('nav a[href$="/child/courses"]').click();
await page.waitForURL("**/child/courses");
await shot("29-child-courses");

await page.locator('nav a[href$="/child/savings"]').click();
await page.waitForURL("**/child/savings");
await shot("30-child-savings");
const contribBtn = page.getByText("+ 5₪ מהארנק שלי").first();
if (await contribBtn.count()) {
  await contribBtn.click();
  await shot("31-child-savings-after-contribute");
}

await page.locator('nav a[href$="/child/transactions"]').click();
await page.waitForURL("**/child/transactions");
await shot("32-child-transactions");

await page.locator('nav a[href$="/child/achievements"]').click();
await page.waitForURL("**/child/achievements");
await shot("33-child-achievements");

console.log("TOTAL ERRORS:", errors.length);
if (errors.length) console.log(JSON.stringify(errors, null, 2));
await browser.close();
