import { chromium } from "playwright";

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage({ viewport: { width: 430, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
});

// ---- Register a fresh family, leaving child names blank (worst case) ----
await page.goto("http://localhost:5173/");
await page.waitForURL("**/onboarding/splash", { timeout: 5000 });
await page.getByText("הצטרפות עכשיו").click();
await page.waitForURL("**/onboarding/welcome");
await page.getByText("המשך").click();
await page.getByText("המשך").click();
await page.getByText("בואו נתחיל").click();
await page.waitForURL("**/onboarding/details");
const email = `dana.zero.${Date.now()}@example.com`;
await page.getByPlaceholder("פלוני אלמוני").fill("דנה בדיקה");
await page.getByPlaceholder("name@example.com").fill(email);
await page.getByPlaceholder("לפחות 6 תווים").fill("qapassword1");
await page.getByText("הבא").click();
await page.waitForURL("**/onboarding/children");
await page.getByRole("button", { name: "שליחה" }).click(); // leave both name fields blank
await page.waitForURL("**/onboarding/success", { timeout: 5000 });
await page.getByRole("button", { name: "סיימתי" }).click();
await page.waitForURL("**/parent", { timeout: 15000 });
await page.waitForTimeout(500);

// ---- Check 1: the active child's balance/savings on Home is 0 ----
const balanceText = await page.locator(".money").first().innerText();
console.log("1) parent-home balance for first child (expect 0₪):", JSON.stringify(balanceText));

// ---- Check 2: every family member row shows 0₪ ----
const familyMoneyTexts = await page.locator(".money").allInnerTexts();
console.log("2) all money figures on parent-home (expect all 0₪):", JSON.stringify(familyMoneyTexts));

// ---- Check 3: switch to child view, confirm wallet/vouchers/savings all zero ----
await page.getByText("🧒 ילד").click();
await page.waitForURL("**/child", { timeout: 5000 });
await page.waitForTimeout(300);
const childBalance = await page.locator(".money").first().innerText();
console.log("3) child-home wallet balance (expect 0₪):", JSON.stringify(childBalance));
const vouchersCount = await page.locator("text=שוברים שלי").locator("..").innerText();
console.log("   vouchers count (expect 0):", JSON.stringify(vouchersCount));

await page.goto("http://localhost:5173/#/child/transactions");
await page.waitForTimeout(300);
console.log("4) child transactions empty state shown:", (await page.locator("text=עדיין אין כאן כלום").count()) > 0);

await page.goto("http://localhost:5173/#/child/savings");
await page.waitForTimeout(300);
const savingsBody = await page.locator("body").innerText();
console.log("5) no leftover seeded savings goal text on savings screen:", !savingsBody.includes("אופניים") && !savingsBody.includes("בובה חדשה"));

// ---- Check 6: log out, test the forgot-password flow on Login ----
await page.goto("http://localhost:5173/#/parent/settings");
await page.waitForTimeout(400);
await page.evaluate(() => localStorage.clear());
await page.goto("http://localhost:5173/#/login");
await page.waitForTimeout(400);
await page.getByPlaceholder("name@example.com").fill(email);
const forgotBtn = page.getByText("שכחתי סיסמה");
console.log("6) forgot-password link visible:", (await forgotBtn.count()) > 0);
await forgotBtn.click();
await page.waitForTimeout(1000);
const resetConfirmation = await page.locator(`text=נשלח מייל לאיפוס סיסמה ל-${email}`).count();
console.log("7) reset-email confirmation shown:", resetConfirmation > 0);

console.log("=== console/page errors ===", errors);
await browser.close();
