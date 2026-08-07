import { chromium } from "playwright";
import { mkdirSync } from "fs";

const shots = "/tmp/claude-0/-home-user-Telegram-rs/4f8aa2eb-e0e2-5755-84ac-b0e801e09c28/scratchpad/share-shots";
mkdirSync(shots, { recursive: true });

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage({ viewport: { width: 430, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
});

await page.goto("http://localhost:5173/");
await page.waitForURL("**/onboarding/splash", { timeout: 5000 });
await page.getByText("הצטרפות עכשיו").click();
await page.waitForURL("**/onboarding/welcome");
await page.getByText("המשך").click();
await page.getByText("המשך").click();
await page.getByText("בואו נתחיל").click();
await page.waitForURL("**/onboarding/details");
const email = `dana.share.${Date.now()}@example.com`;
await page.getByPlaceholder("פלוני אלמוני").fill("דנה בדיקה");
await page.getByPlaceholder("name@example.com").fill(email);
await page.getByPlaceholder("לפחות 6 תווים").fill("qapassword1");
await page.getByText("הבא").click();
await page.waitForURL("**/onboarding/children");
await page.getByRole("button", { name: "שליחה" }).click();
await page.waitForURL("**/onboarding/success", { timeout: 5000 });
await page.getByRole("button", { name: "סיימתי" }).click();
await page.waitForURL("**/parent", { timeout: 15000 });

await page.getByRole("link", { name: "הילדים שלי" }).click();
await page.waitForTimeout(400);
await page.getByText("הגדרות").first().click();
await page.waitForURL("**/parent/settings", { timeout: 3000 });
await page.waitForTimeout(300);
await page.screenshot({ path: `${shots}/00-settings-share-card.png` });
console.log("1) share section visible:", (await page.locator("text=שתפו את Triple Pay").count()) > 0);

// no navigator.share in headless chromium by default -> falls back to clipboard copy
await page.locator('button:has-text("📤 שיתוף")').click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${shots}/01-after-share-click.png` });
console.log("2) toast/no crash after share click:", errors.length === 0);

console.log("=== console/page errors ===", errors);
await browser.close();
