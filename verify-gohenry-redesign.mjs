import { chromium } from "playwright";
import { mkdirSync } from "fs";

const shots = "/tmp/claude-0/-home-user-Telegram-rs/4f8aa2eb-e0e2-5755-84ac-b0e801e09c28/scratchpad/gohenry-shots";
mkdirSync(shots, { recursive: true });

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage({ viewport: { width: 430, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (msg) => { if (msg.type() === "error") errors.push(`console: ${msg.text()}`); });

async function shot(name) {
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${shots}/${name}.png` });
}

await page.goto("http://localhost:5173/");
await page.waitForURL("**/onboarding/splash", { timeout: 5000 });
await shot("00-splash");
await page.getByText("הצטרפות עכשיו").click();
await page.waitForURL("**/onboarding/welcome");
await shot("01-welcome");
await page.getByText("המשך").click();
await page.getByText("המשך").click();
await page.getByText("בואו נתחיל").click();
await page.waitForURL("**/onboarding/details");
const email = `dana.gohenry.${Date.now()}@example.com`;
await page.getByPlaceholder("פלוני אלמוני").fill("דנה בדיקה");
await page.getByPlaceholder("name@example.com").fill(email);
await page.getByPlaceholder("לפחות 6 תווים").fill("qapassword1");
await page.getByText("הבא").click();
await page.waitForURL("**/onboarding/children");
await page.getByRole("button", { name: "שליחה" }).click();
await page.waitForURL("**/onboarding/success", { timeout: 5000 });
await page.getByRole("button", { name: "סיימתי" }).click();
await page.waitForURL("**/parent", { timeout: 15000 });
await shot("02-parent-home");

await page.getByRole("link", { name: "מתנות" }).click().catch(() => {});
await page.waitForTimeout(300);
await shot("03-gift-bank");

await page.getByText("🧒 ילד").click();
await page.waitForURL("**/child", { timeout: 5000 });
await shot("04-child-home");

await page.getByRole("link", { name: "הכרטיס שלי" }).click().catch(() => {});
await page.waitForTimeout(300);
await shot("05-my-cards");

console.log("=== console/page errors ===", errors);
await browser.close();
