import { chromium } from "playwright";
import { mkdirSync } from "fs";

const shots = "/tmp/claude-0/-home-user-Telegram-rs/4f8aa2eb-e0e2-5755-84ac-b0e801e09c28/scratchpad/add-items-shots";
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

// ---- Check the Login-screen greeting BEFORE any real signup exists ----
await page.goto("http://localhost:5173/#/login");
await page.waitForTimeout(400);
await shot("00-login-greeting");
console.log("1) login shows generic guest greeting:", (await page.locator("text=שלום אורח").count()) > 0);
console.log("   no leftover 'דנה' placeholder name shown:", (await page.locator("text=היי דנה").count()) === 0);

// ---- Register a fresh family ----
await page.goto("http://localhost:5173/");
await page.waitForURL("**/onboarding/splash", { timeout: 5000 });
await page.getByText("הצטרפות עכשיו").click();
await page.waitForURL("**/onboarding/welcome");
await page.getByText("המשך").click();
await page.getByText("המשך").click();
await page.getByText("בואו נתחיל").click();
await page.waitForURL("**/onboarding/details");
const email = `dana.additems.${Date.now()}@example.com`;
await page.getByPlaceholder("פלוני אלמוני").fill("דנה בדיקה");
await page.getByPlaceholder("name@example.com").fill(email);
await page.getByPlaceholder("לפחות 6 תווים").fill("qapassword1");
await page.getByText("הבא").click();
await page.waitForURL("**/onboarding/children");
await page.getByRole("button", { name: "שליחה" }).click();
await page.waitForURL("**/onboarding/success", { timeout: 5000 });
await page.getByRole("button", { name: "סיימתי" }).click();
await page.waitForURL("**/parent", { timeout: 15000 });

// ---- Add a custom gift ----
await page.getByRole("link", { name: "מתנות" }).click();
await page.waitForURL("**/parent/gift-bank", { timeout: 3000 });
await page.waitForTimeout(300);
const giftCountBefore = await page.locator(".money").count();
await page.getByText("+ הוספת מתנה").click();
await page.getByPlaceholder("למשל: כרטיס לפארק שעשועים").fill("כרטיס לחדר בריחה");
await page.locator('input[type="number"]').fill("120");
await page.getByText("צעצועים").click();
await page.getByText("שמירה").click();
await shot("01-gift-added");
console.log("2) custom gift appears in the bank:", (await page.locator("text=כרטיס לחדר בריחה").count()) > 0);
const giftCountAfter = await page.locator(".money").count();
console.log("   gift count increased:", giftCountAfter > giftCountBefore);

// remove it
await page
  .locator("text=כרטיס לחדר בריחה")
  .locator("..")
  .getByLabel("הסרת מתנה")
  .click();
await shot("02-gift-removed");
console.log("3) custom gift removed:", (await page.locator("text=כרטיס לחדר בריחה").count()) === 0);

// ---- Add a custom task template ----
await page.goto("http://localhost:5173/#/parent/tasks-bank");
await page.waitForTimeout(300);
await page.getByText("+ הוספת מטלה").click();
await page.getByPlaceholder("למשל: להאכיל את החתול").fill("להאכיל את הדג");
await page.locator('input[type="number"]').fill("7");
await page.getByText("ניקיון").click();
await page.getByText("שמירה").click();
await shot("03-task-added");
console.log("4) custom task template appears:", (await page.locator("text=להאכיל את הדג").count()) > 0);

// remove it
await page
  .locator("text=להאכיל את הדג")
  .locator("..")
  .locator("..")
  .getByLabel("הסרת תבנית")
  .click();
await shot("04-task-removed");
console.log("5) custom task template removed:", (await page.locator("text=להאכיל את הדג").count()) === 0);

console.log("=== console/page errors ===", errors);
await browser.close();
