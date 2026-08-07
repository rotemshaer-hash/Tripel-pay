import { chromium } from "playwright";
import { mkdirSync } from "fs";

const shots = "/tmp/claude-0/-home-user-Telegram-rs/4f8aa2eb-e0e2-5755-84ac-b0e801e09c28/scratchpad/verify-shots";
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

// ---- Real onboarding against the live emulator (2 real children, both start at 0) ----
await page.goto("http://localhost:5173/");
await page.waitForURL("**/onboarding/splash", { timeout: 5000 });
await page.getByText("הצטרפות עכשיו").click();
await page.waitForURL("**/onboarding/welcome");
await page.getByText("המשך").click();
await page.getByText("המשך").click();
await page.getByText("בואו נתחיל").click();
await page.waitForURL("**/onboarding/details");
const email = `dana.verify.${Date.now()}@example.com`;
await page.getByPlaceholder("פלוני אלמוני").fill("דנה בדיקה");
await page.getByPlaceholder("name@example.com").fill(email);
await page.getByPlaceholder("לפחות 6 תווים").fill("qapassword1");
await page.getByText("הבא").click();
await page.waitForURL("**/onboarding/children");
await page.getByRole("button", { name: "שליחה" }).click(); // leave names blank -> ילד/ה 1, ילד/ה 2
await page.waitForURL("**/onboarding/success", { timeout: 5000 });
await page.getByRole("button", { name: "סיימתי" }).click();
await page.waitForURL("**/parent", { timeout: 15000 });

// send money to the active child so there's a real transaction + real balance to redeem a gift with
await page.getByLabel("שליחת כסף").click();
await page.waitForTimeout(300);
await page.locator('input[type="number"]').fill("200");
await page.getByText("שלח", { exact: true }).click();
await page.waitForTimeout(500);

// a fresh child's default payment limit (30₪) blocks every real gift (cheapest is 45₪) —
// raise it first so the redeem step below isn't blocked by that (separate, working) guard
await page.getByText("הילדים שלי").click();
await page.waitForTimeout(300);
await page.getByText("הגדרות").click();
await page.waitForURL("**/parent/settings", { timeout: 3000 });
await page.waitForTimeout(300);
await page.locator('input[type="number"]').first().fill("500");
await page.waitForTimeout(300);

// redeem a real gift so redeemedGifts/transactions are non-empty for real (not seeded)
await page.getByRole("link", { name: "מתנות" }).click();
await page.waitForURL("**/parent/gift-bank", { timeout: 3000 });
await page.waitForTimeout(300);
const redeemBtn = page.locator('button:has-text("מימוש")').first();
await redeemBtn.click();
await page.waitForTimeout(150);
await page.locator('button:has-text("לאשר מימוש")').click();
await page.waitForTimeout(400);

// ---- Switch to child preview ----
await page.getByText("בית", { exact: true }).click();
await page.waitForURL("**/parent", { timeout: 3000 });
await page.getByText("🧒 ילד").click();
await page.waitForURL("**/child", { timeout: 5000 });
await shot("01-child-home");

const switchVisible = await page.locator("text=מציג/ה תצוגה של").count();
console.log("1) child switcher visible in preview mode:", switchVisible > 0);

const vouchersCardText = await page
  .locator("text=שוברים שלי")
  .locator("..")
  .innerText()
  .catch(() => "");
console.log("2) vouchers card (expect real count 1, from the gift just redeemed):", JSON.stringify(vouchersCardText));

// tap vouchers card -> real navigation
await page.getByText("שוברים שלי").click();
await page.waitForURL("**/child/vouchers", { timeout: 3000 });
await shot("02-vouchers-screen");
console.log("3) vouchers screen opened:", (await page.locator("text=מתנות שמימשתי").count()) > 0);
console.log("   redeemed gift rows visible:", await page.locator(".money").count());

await page.goBack();
await page.waitForURL("**/child", { timeout: 3000 });

// tap wallet card -> real navigation
await page.locator(".shine-sweep").first().click();
await page.waitForURL("**/child/cards", { timeout: 3000 });
await shot("03-cards-screen");
console.log("4) cards screen opened:", (await page.locator("text=כרטיסים נוספים").count()) > 0);
console.log("   no seeded extra cards (fresh account, expect 0):", (await page.locator("text=הסרה").count()) === 0);

// add a new card
await page.getByText("+ הוספת כרטיס").click();
await page.getByPlaceholder("למשל: מנוי נטפליקס").fill("כרטיס חבר מועדון");
await page.getByText("חברות מועדון").click();
await page.getByText("שמירה").click();
await shot("04-cards-after-add");
console.log("5) newly added card visible:", (await page.locator("text=כרטיס חבר מועדון").count()) > 0);

// remove it again
await page
  .locator("text=כרטיס חבר מועדון")
  .locator("..")
  .locator("..")
  .getByText("הסרה")
  .click();
await shot("05-cards-after-remove");
console.log("6) card removed:", (await page.locator("text=כרטיס חבר מועדון").count()) === 0);

await page.goBack();
await page.waitForURL("**/child", { timeout: 3000 });

// bell popover
await page.getByLabel("התראות").click();
await shot("06-bell-popover");
console.log("7) bell popover visible:", (await page.locator("text=עדכונים אחרונים").count()) > 0);
await page.mouse.click(20, 20); // close via the outside-tap overlay, not the bell itself

// child switcher: step to the second child
await page.getByLabel("הילד/ה הבא/ה").click();
await shot("07-switched-to-child2");
console.log("8) switched to second child:", (await page.locator("text=היי ילד/ה 2").count()) > 0);
const child2Vouchers = await page
  .locator("text=שוברים שלי")
  .locator("..")
  .innerText()
  .catch(() => "");
console.log("   second child vouchers card (expect count 0, never touched):", JSON.stringify(child2Vouchers));

// step back to the first child
await page.getByLabel("הילד/ה הקודם/ת").click();
console.log("9) switched back to first child:", (await page.locator("text=היי ילד/ה 1").count()) > 0);

console.log("=== console/page errors ===", errors);
await browser.close();
